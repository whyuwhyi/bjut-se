<template>
	<view class="resource-detail-container">
		<!-- 资源头部信息 -->
		<view class="resource-header">
			<view class="resource-icon-section">
				<image :src="getFileIcon(resource.fileType)" class="file-icon-large"></image>
				<view class="file-info">
					<text class="file-type">{{ resource.fileType.toUpperCase() }}</text>
					<text class="file-size">{{ formatFileSize(resource.fileSize) }}</text>
				</view>
			</view>
			
			<view class="resource-title-section">
				<text class="resource-title">{{ resource.title }}</text>
				<view class="resource-tags">
					<text class="tag category">{{ resource.category }}</text>
				</view>
				<view class="resource-meta">
					<text class="meta-item">👤 {{ resource.uploaderName }}</text>
					<text class="meta-item">🕒 {{ formatTime(resource.uploadTime) }}</text>
				</view>
			</view>
		</view>

		<!-- 统计信息 -->
		<view class="stats-section">
			<view class="stat-item">
				<text class="stat-number">{{ resource.viewCount }}</text>
				<text class="stat-label">浏览</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ resource.downloadCount }}</text>
				<text class="stat-label">下载</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ resource.rating }}</text>
				<text class="stat-label">评分</text>
			</view>
			<view class="stat-item">
				<text class="stat-number">{{ resource.favoriteCount || 0 }}</text>
				<text class="stat-label">收藏</text>
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="action-section">
			<button class="action-btn primary" @click="downloadResource">
				<text class="btn-icon">⬇️</text>
				<text class="btn-text">下载</text>
			</button>
			<button class="action-btn" :class="{ favorited: resource.isFavorited }" @click="toggleFavorite">
				<text class="btn-icon">{{ resource.isFavorited ? '❤️' : '🤍' }}</text>
				<text class="btn-text">{{ resource.isFavorited ? '已收藏' : '收藏' }}</text>
			</button>
			<button class="action-btn" @click="showSharePopup">
				<text class="btn-icon">📤</text>
				<text class="btn-text">分享</text>
			</button>
		</view>

		<!-- 资源描述 -->
		<view class="description-section">
			<view class="section-header">
				<text class="section-title">资源描述</text>
			</view>
			<view class="description-content">
				<text class="description-text">{{ resource.description || '暂无描述' }}</text>
			</view>
		</view>

		<!-- 评分区域 -->
		<view class="rating-section">
			<view class="section-header">
				<text class="section-title">评价资源</text>
			</view>
			<view class="rating-content">
				<view class="rating-stars">
					<text 
						class="star" 
						:class="{ active: index < userRating }"
						v-for="(star, index) in 5" 
						:key="index"
						@click="rateResource(index + 1)"
					>
						⭐
					</text>
				</view>
				<text class="rating-text">{{ getRatingText(userRating) }}</text>
			</view>
		</view>

		<!-- 相关资源推荐 - 暂时移除，功能开发中 -->
		<!-- <view class="related-section">
			<view class="section-header">
				<text class="section-title">相关资源</text>
			</view>
			<view class="related-list">
				<text class="no-data">相关资源推荐功能开发中...</text>
			</view>
		</view> -->

		<!-- 评论区域 -->
		<view class="comment-section">
			<view class="section-header">
				<text class="section-title">评论 ({{ comments.length }})</text>
			</view>
			
			<!-- 评论输入区域 -->
			<view class="comment-input-area">
				<textarea 
					class="comment-textarea" 
					v-model="commentText" 
					placeholder="写下你的评论..."
					:maxlength="200"
					auto-height
				></textarea>
				<button class="submit-btn" @click="handleSubmitComment">发表</button>
			</view>
			
			<!-- 评论列表 -->
			<view class="comment-list">
				<view class="comment-item" v-for="(comment, index) in comments" :key="index">
					<image class="comment-avatar" :src="comment.userAvatar || '/static/images/default-avatar.png'"></image>
					<view class="comment-content">
						<view class="comment-header">
							<text class="comment-username">{{ comment.userName }}</text>
							<text class="comment-time">{{ formatTime(comment.createTime) }}</text>
						</view>
						<text class="comment-text">{{ comment.content }}</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="sharePopupVisible" class="share-popup-mask" @click.self="closeSharePopup">
			<view class="share-popup-window">
				<view class="share-popup-title">分享资源</view>
				<view class="share-popup-options" v-if="!qrCodeVisible">
					<button class="share-popup-btn" @click="shareToFriend">分享给好友</button>
					<button class="share-popup-btn" @click="copyResourceLink">复制链接</button>
					<button class="share-popup-btn" @click="showQrCode">保存二维码</button>
				</view>
				<view v-else class="qrcode-section">
					<image :src="qrCodeDataUrl" class="qrcode-img" mode="aspectFit"/>
					<view class="qrcode-tip">长按图片保存（移动端）或右键图片另存为（PC端）</view>
					<button class="share-popup-close" @click="closeQrCode">关闭二维码</button>
				</view>
				<button v-if="!qrCodeVisible" class="share-popup-close" @click="closeSharePopup">取消</button>
			</view>
		</view>
	</view>
</template>

<script>
import QRCode from 'qrcode'
export default {
	data() {
		return {
			resourceId: '',
			resource: {
				id: '',
				title: '加载中...',
				description: '',
				category: '未分类',
				uploaderName: '',
				uploadTime: new Date(),
				viewCount: 0,
				downloadCount: 0,
				rating: 0,
				favoriteCount: 0,
				isFavorited: false,
				fileType: 'unknown',
				fileSize: 0
			},
			userRating: 0,
			commentText: '',
			comments: [],
			sharePopupVisible: false,
			qrCodeVisible: false,
			qrCodeDataUrl: ''
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.resourceId = options.id
			this.loadResourceDetail()
		}
	},
	
	methods: {
		async loadResourceDetail() {
			try {
				uni.showLoading({ title: '加载中...' })
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const data = response.data.data
					console.log('原始资源数据:', data)
					
					this.resource = {
						id: data.resource_id,
						title: data.resource_name,
						description: data.description,
						category: data.category?.category_name || '未分类',
						uploaderName: data.publisher?.nickname || data.publisher?.name || '匿名用户',
						uploadTime: new Date(data.created_at),
						viewCount: data.view_count || 0,
						downloadCount: data.download_count || 0,
						rating: parseFloat(data.rating) || 0,
						favoriteCount: parseInt(data.collection_count) || 0,
						isFavorited: false, // 后续根据用户状态查询
						files: data.files || [],
						fileType: 'unknown',
						fileSize: 0
					}
					
					
					// 处理文件信息
					if (data.files && data.files.length > 0) {
						const file = data.files[0]
						this.resource.fileType = file.file_type || this.getFileTypeFromName(file.file_name)
						this.resource.fileSize = file.file_size || 0
					}
					
					console.log('处理后的资源数据:', this.resource)
				} else {
					throw new Error('获取资源详情失败')
				}
				
				// 加载评论
				await this.loadComments()
				
				// 检查收藏状态
				await this.checkCollectionStatus()
				
				// 获取用户评分
				await this.getUserRating()
				
				uni.hideLoading()
			} catch (error) {
				console.error('加载资源详情错误:', error)
				uni.hideLoading()
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		async downloadResource() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				if (!this.resource.files || this.resource.files.length === 0) {
					uni.showToast({
						title: '没有可下载的文件',
						icon: 'none'
					})
					return
				}
				
				uni.showLoading({ title: '准备下载...' })
				
				const file = this.resource.files[0]
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resource.id}/files/${file.file_id}/download`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.resource.downloadCount++
					
					if (response.data.data.content) {
						// 文本文件直接显示内容
						uni.hideLoading()
						uni.showModal({
							title: '文件内容',
							content: response.data.data.content.substring(0, 200) + (response.data.data.content.length > 200 ? '...' : ''),
							showCancel: true,
							cancelText: '关闭',
							confirmText: '复制全部',
							success: (res) => {
								if (res.confirm) {
									// 复制完整内容到剪贴板
									uni.setClipboardData({
										data: response.data.data.content,
										success: () => {
											uni.showToast({
												title: '已复制到剪贴板',
												icon: 'success'
											})
										}
									})
								}
							}
						})
					} else if (response.data.data.downloadUrl) {
						// 其他文件进行真实下载
						uni.hideLoading()
						
						// #ifdef H5
						// H5环境使用带身份认证的下载
						const h5DownloadUrl = `${this.$config.apiBaseUrl}/resources/${this.resource.id}/files/${file.file_id}/download`
						
						// 使用fetch下载文件
						fetch(h5DownloadUrl, {
							method: 'GET',
							headers: {
								'Authorization': `Bearer ${token}`,
								'Accept': 'application/octet-stream'
							}
						}).then(response => {
							if (!response.ok) {
								throw new Error('下载失败')
							}
							return response.blob()
						}).then(blob => {
							// 创建下载链接
							const url = window.URL.createObjectURL(blob)
							const link = document.createElement('a')
							link.href = url
							link.download = response.data.data.fileName || 'download'
							document.body.appendChild(link)
							link.click()
							document.body.removeChild(link)
							window.URL.revokeObjectURL(url)
						}).catch(error => {
							console.error('下载失败:', error)
							uni.showToast({
								title: '下载失败',
								icon: 'none'
							})
						})
						// #endif
						
						// #ifdef MP-WEIXIN
						// 微信小程序使用下载API
						const wxDownloadUrl = `${this.$config.apiBaseUrl}/resources/${this.resource.id}/files/${file.file_id}/download`
						
						uni.downloadFile({
							url: wxDownloadUrl,
							header: {
								'Authorization': `Bearer ${token}`,
								'Accept': 'application/octet-stream'
							},
							success: (downloadRes) => {
								if (downloadRes.statusCode === 200) {
									// 在微信小程序中，可以打开文档或保存到相册
									uni.openDocument({
										filePath: downloadRes.tempFilePath,
										success: () => {
											uni.showToast({
												title: '文件已打开',
												icon: 'success'
											})
										},
										fail: () => {
											uni.showToast({
												title: '文件下载完成',
												icon: 'success'
											})
										}
									})
								}
							},
							fail: () => {
								uni.showToast({
									title: '下载失败',
									icon: 'none'
								})
							}
						})
						// #endif
						
						// #ifdef APP-PLUS
						// App环境使用plus下载
						const appDownloadUrl = `${this.$config.apiBaseUrl}/resources/${this.resource.id}/files/${file.file_id}/download`
						
						const dtask = plus.downloader.createDownload(appDownloadUrl, {
							filename: '_downloads/' + (response.data.data.fileName || 'download'),
							headers: {
								'Authorization': `Bearer ${token}`,
								'Accept': 'application/octet-stream'
							}
						}, (download, status) => {
							if (status == 200) {
								uni.showToast({
									title: '下载完成',
									icon: 'success'
								})
								// 可以选择打开文件
								plus.runtime.openFile(download.filename)
							} else {
								uni.showToast({
									title: '下载失败',
									icon: 'none'
								})
							}
						})
						dtask.start()
						// #endif
					}
					
					uni.showToast({
						title: '操作成功',
						icon: 'success'
					})
				} else {
					throw new Error(response.data.message || '下载失败')
				}
			} catch (error) {
				console.error('下载失败:', error)
				uni.hideLoading()
				uni.showToast({
					title: error.message || '下载失败',
					icon: 'none'
				})
			}
		},
		
		// 检查收藏状态
		async checkCollectionStatus() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}/favorite-status?type=resource`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.resource.isFavorited = response.data.data.isCollected
				}
			} catch (error) {
				console.error('检查收藏状态失败:', error)
			}
		},
		
		async toggleFavorite() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				// 立即更新UI状态，提供即时反馈
				const newFavoritedState = !this.resource.isFavorited
				this.resource.isFavorited = newFavoritedState
				this.resource.favoriteCount += newFavoritedState ? 1 : -1
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}/favorite`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						type: 'resource'
					}
				})
				
				if (response.statusCode === 200 && response.data.success) {
					uni.showToast({
						title: newFavoritedState ? '收藏成功' : '已取消收藏',
						icon: 'success'
					})
				} else {
					// 如果请求失败，恢复原始状态
					this.resource.isFavorited = !newFavoritedState
					this.resource.favoriteCount += newFavoritedState ? -1 : 1
					throw new Error(response.data.message || '操作失败')
				}
			} catch (error) {
				console.error('收藏操作失败:', error)
				uni.showToast({
					title: error.message || '收藏操作失败',
					icon: 'none'
				})
			}
		},
		
		showSharePopup() {
			this.sharePopupVisible = true
		},
		closeSharePopup() {
			this.sharePopupVisible = false
			this.qrCodeVisible = false
		},
		showQrCode() {
			const url = window.location.origin + `/#/pages/resources/detail?id=${this.resourceId}`
			QRCode.toDataURL(url, { width: 240, margin: 2 }, (err, url) => {
				if (!err) {
					this.qrCodeDataUrl = url
					this.qrCodeVisible = true
				} else {
					uni.showToast({ title: '二维码生成失败', icon: 'none' })
				}
			})
		},
		closeQrCode() {
			this.qrCodeVisible = false
		},
		shareToFriend() {
			this.closeSharePopup()
			uni.showModal({
				title: '分享给好友',
				content: '请点击"复制链接"并粘贴到微信/QQ等聊天工具发送给好友。',
				showCancel: false
			})
		},
		copyResourceLink() {
			this.closeSharePopup()
			const url = window.location.origin + `/#/pages/resources/detail?id=${this.resourceId}`
			uni.setClipboardData({
				data: url,
				success: () => {
					uni.showToast({ title: '链接已复制', icon: 'success' })
				}
			})
		},
		
		// 获取用户评分
		async getUserRating() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}/my-rating`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const rating = response.data.data
					if (rating) {
						this.userRating = rating.rating
					}
				}
			} catch (error) {
				console.error('获取用户评分失败:', error)
			}
		},
		
		async rateResource(rating) {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}/rating`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						rating: rating, // 直接使用5分制
						review_text: ''
					}
				})
				
				if (response.statusCode === 200 || response.statusCode === 201) {
					this.userRating = rating
					uni.showToast({
						title: response.data.message,
						icon: 'success'
					})
					// 重新加载资源详情以更新评分
					this.loadResourceDetail()
				} else {
					throw new Error(response.data.message || '评分失败')
				}
			} catch (error) {
				console.error('评分失败:', error)
				uni.showToast({
					title: error.message || '评分失败',
					icon: 'none'
				})
			}
		},
		
		getRatingText(rating) {
			const ratingTexts = ['', '很差', '较差', '一般', '很好', '非常好']
			return ratingTexts[rating] || '点击评分'
		},
		
		handleSubmitComment() {
			// 检查登录状态
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			// 检查评论内容
			if (!this.commentText || !this.commentText.trim()) {
				uni.showToast({
					title: '评论内容不能为空',
					icon: 'none'
				})
				return
			}
			
			// 提交评论
			this.submitComment(this.commentText)
		},
		
		async submitComment(content) {
			try {
				if (!content || !content.trim()) {
					uni.showToast({
						title: '评论内容不能为空',
						icon: 'none'
					})
					return
				}
				
				const token = uni.getStorageSync('token')
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}/comments`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						comment_content: content.trim()
					}
				})
				
				if (response.statusCode === 201 && response.data.success) {
					const commentData = response.data.data
					
					// 使用后端返回的完整评论数据
					this.comments.unshift({
						comment_id: commentData.comment_id,
						userName: commentData.author?.nickname || commentData.author?.name || '我',
						userAvatar: commentData.author?.avatar_url || '/static/images/default-avatar.png',
						content: commentData.content,
						createTime: new Date(commentData.created_at)
					})
					
					this.commentText = '' // 清空输入框
					
					uni.showToast({
						title: '评论成功',
						icon: 'success'
					})
				} else {
					throw new Error(response.data.message || '评论失败')
				}
			} catch (error) {
				console.error('发表评论失败:', error)
				uni.showToast({
					title: error.message || '评论失败',
					icon: 'none'
				})
			}
		},
		
		// 加载评论列表
		async loadComments() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${this.resourceId}/comments`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.comments = (response.data.data.comments || []).map(comment => ({
						comment_id: comment.comment_id,
						userName: comment.author?.nickname || comment.author?.name || '匿名用户',
						userAvatar: comment.author?.avatar_url || '/static/images/default-avatar.png',
						content: comment.content,
						createTime: new Date(comment.created_at)
					}))
				}
			} catch (error) {
				console.error('加载评论失败:', error)
				uni.showToast({
					title: '加载评论失败',
					icon: 'none'
				})
			}
		},
		
		getFileIcon(fileType) {
			const iconMap = {
				'pdf': '/static/icons/pdf.png',
				'doc': '/static/icons/doc.png',
				'docx': '/static/icons/doc.png',
				'ppt': '/static/icons/ppt.png',
				'pptx': '/static/icons/ppt.png',
				'zip': '/static/icons/zip.png',
				'rar': '/static/icons/zip.png'
			}
			return iconMap[fileType] || '/static/icons/file.png'
		},
		
		getFileTypeFromName(fileName) {
			if (!fileName) return 'unknown'
			return fileName.split('.').pop().toLowerCase()
		},
		
		formatFileSize(bytes) {
			if (bytes === 0) return '0 B'
			const k = 1024
			const sizes = ['B', 'KB', 'MB', 'GB']
			const i = Math.floor(Math.log(bytes) / Math.log(k))
			return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
		},
		
		formatTime(time) {
			const now = new Date()
			const diff = now - time
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return hours > 0 ? `${hours}小时前` : '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return time.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.resource-detail-container {
	min-height: 100vh;
	padding: 30rpx;
	padding-bottom: 160rpx;
	background: transparent !important;
	
	&::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
		background-color: #FAEED1;
		background-image: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
		background-size: 400% 400%;
		animation: backgroundPan 15s ease infinite;
	}
}

.resource-header {
	background: white;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	padding: 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	
	.resource-icon-section {
		margin-right: 30rpx;
		
		.file-icon-large {
			width: 100rpx;
			height: 100rpx;
			border-radius: 15rpx;
			margin-bottom: 10rpx;
		}
		
		.file-info {
			text-align: center;
			
			.file-type {
				display: block;
				font-size: 20rpx;
				color: #666;
				margin-bottom: 5rpx;
			}
			
			.file-size {
				font-size: 18rpx;
				color: #999;
			}
		}
	}
	
	.resource-title-section {
		flex: 1;
		
		.resource-title {
			display: block;
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
			line-height: 1.4;
			margin-bottom: 20rpx;
		}
		
		.resource-tags {
			margin-bottom: 15rpx;
			
			.tag {
				display: inline-block;
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				font-size: 22rpx;
				margin-right: 15rpx;
				
				&.category {
					background: #e3f2fd;
					color: #1976d2;
				}
				
				&.difficulty {
					&.level-1 {
						background: #e8f5e8;
						color: #4caf50;
					}
					
					&.level-2 {
						background: #fff3e0;
						color: #ff9800;
					}
					
					&.level-3 {
						background: #ffebee;
						color: #f44336;
					}
				}
			}
		}
		
		.resource-meta {
			.meta-item {
				font-size: 24rpx;
				color: #666;
				margin-right: 30rpx;
			}
		}
	}
}

.stats-section {
	background: white;
	border-radius: 20rpx;
	margin-top: 20rpx;
	padding: 30rpx;
	display: flex;
	justify-content: space-around;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	.stat-item {
		text-align: center;
		
		.stat-number {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 8rpx;
		}
		
		.stat-label {
			font-size: 24rpx;
			color: #666;
		}
	}
}

.action-section {
	display: flex;
	padding: 30rpx;
	gap: 20rpx;
	
	.action-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx;
		background: white;
		border: 2rpx solid #e0e0e0;
		border-radius: 15rpx;
		font-size: 26rpx;
		transition: all 0.3s ease;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		
		&.primary {
			border-color: #e0e0e0;
			color: #333;
			
			&:active {
				border-color: #007aff;
				color: #007aff;
			}
		}
		
		&.favorited {
			background: #fff2f2;
			border-color: #ff4757;
			color: #ff4757;
			transition: all 0.3s ease;
			
			.btn-icon {
				transform: scale(1.2);
				transition: transform 0.3s ease;
			}
		}
		
		.btn-icon {
			font-size: 32rpx;
			margin-bottom: 8rpx;
		}
		
		.btn-text {
			font-size: 24rpx;
		}
	}
}

.description-section, .rating-section, .related-section, .comment-section {
	background: white;
	border-radius: 20rpx;
	margin: 20rpx 0;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	.section-header {
		margin-bottom: 20rpx;
		
		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}
}

.description-content {
	.description-text {
		font-size: 28rpx;
		color: #333;
		line-height: 1.6;
		white-space: pre-line;
	}
}

.rating-content {
	display: flex;
	align-items: center;
	
	.rating-stars {
		margin-right: 20rpx;
		
		.star {
			font-size: 40rpx;
			margin-right: 10rpx;
			opacity: 0.3;
			
			&.active {
				opacity: 1;
			}
		}
	}
	
	.rating-text {
		font-size: 26rpx;
		color: #666;
	}
}

.comment-input-area {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
	
	.comment-textarea {
		flex: 1;
		height: 72rpx;
		max-height: 144rpx;
		padding: 16rpx;
		background: #fff;
		border-radius: 12rpx;
		font-size: 28rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}
	
	.submit-btn {
		width: 120rpx;
		height: 72rpx;
		line-height: 72rpx;
		text-align: center;
		background: #6CB4EE;  /* 浅蓝色 */
		color: white;
		border-radius: 12rpx;
		font-size: 28rpx;
		padding: 0;
		margin: 0;
		box-shadow: 0 2rpx 8rpx rgba(108, 180, 238, 0.3);  /* 添加浅蓝色阴影 */
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.95);
			background: #5AA1DB;  /* 点击时稍微深一点的蓝色 */
		}
	}
}

.comment-list {
	.comment-item {
		display: flex;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
			padding-bottom: 0;
		}
		
		.comment-avatar {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			margin-right: 20rpx;
		}
		
		.comment-content {
			flex: 1;
			
			.comment-header {
				display: flex;
				align-items: center;
				margin-bottom: 8rpx;
				
				.comment-username {
					font-size: 26rpx;
					font-weight: bold;
					color: #333;
					margin-right: 16rpx;
				}
				
				.comment-time {
					font-size: 22rpx;
					color: #999;
				}
			}
			
			.comment-text {
				font-size: 26rpx;
				color: #333;
				line-height: 1.5;
			}
		}
	}
}

.share-popup-mask {
	position: fixed;
	left: 0; top: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.4);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}
.share-popup-window {
	background: #fff;
	border-radius: 20rpx;
	width: 80vw;
	max-width: 600rpx;
	display: flex;
	flex-direction: column;
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.18);
	padding: 40rpx 30rpx 30rpx 30rpx;
}
.share-popup-title {
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
	text-align: center;
}
.share-popup-options {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-bottom: 30rpx;
}
.share-popup-btn {
	width: 100%;
	background: #f5f5f5;
	color: #333;
	border-radius: 12rpx;
	font-size: 30rpx;
	padding: 20rpx 0;
}
.share-popup-close {
	width: 100%;
	background: #667eea;
	color: #fff;
	border-radius: 12rpx;
	font-size: 30rpx;
	margin-top: 10rpx;
}
.qrcode-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 20rpx;
}
.qrcode-img {
	width: 240rpx;
	height: 240rpx;
	margin: 20rpx 0;
}
.qrcode-tip {
	font-size: 24rpx;
	color: #888;
	margin-bottom: 10rpx;
}
</style>