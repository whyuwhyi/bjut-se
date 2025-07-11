<template>
	<view class="resource-detail-container">
		<!-- 加载状态 -->
		<view v-if="!resource.id && resource.title === '加载中...' && !loadError" class="loading-container">
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 错误状态 -->
		<view v-else-if="loadError" class="error-container">
			<text class="error-text">{{ loadError }}</text>
			<button class="retry-btn" @click="loadResourceDetail">重试</button>
		</view>
		
		<!-- 资源详情内容 -->
		<template v-else-if="resource.id">
			<!-- 资源头部信息 -->
			<view class="resource-header">
			<view class="resource-icon-section">
				<image :src="getFileIcon(resource.fileType)" class="file-icon-large"></image>
				<view class="file-info">
					<text class="file-type">{{ resource.fileType ? resource.fileType.toUpperCase() : '未知类型' }}</text>
					<text class="file-size">{{ resource.fileSize ? formatFileSize(resource.fileSize) : '大小未知' }}</text>
				</view>
			</view>
			
			<view class="resource-title-section">
				<text class="resource-title">{{ resource.title || '资源标题' }}</text>
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
			<button class="action-btn report-btn" @click="showReportModal">
				<text class="btn-icon">🚨</text>
				<text class="btn-text">举报</text>
			</button>
		</view>

		<!-- 文件状态提示 -->
		<view class="file-status-section" v-if="!resource.files || resource.files.length === 0">
			<view class="file-status-warning">
				<text class="warning-icon">⚠️</text>
				<text class="warning-text">该资源暂无关联文件</text>
			</view>
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
					:placeholder="replyTarget ? `回复 ${replyTarget.userName}：` : '写下你的评论...'"
					:maxlength="200"
					:style="{height: commentTextareaHeight + 'px'}"
					@input="adjustCommentTextareaHeight"
				></textarea>
				<view class="comment-actions">
					<button class="submit-btn" @click="handleSubmitComment" :disabled="sending">{{ sending ? '发送中...' : '发表' }}</button>
					<view class="cancel-reply" v-if="replyTarget" @click="cancelReply">
						<text class="cancel-text">取消回复</text>
					</view>
				</view>
			</view>
			
			<!-- 评论列表 -->
			<view class="comment-list">
				<HybridComment
					v-for="comment in comments"
					:key="comment.comment_id"
					:comment="comment"
					@reply="replyToComment"
					@viewProfile="viewUserProfile"
					@report="reportComment"
				/>
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
		</template>

		<!-- 举报弹窗 -->
		<ReportModal 
			ref="reportModal"
			content-type="resource"
			:content-id="resourceId"
			:content-title="resource.title"
			@reported="onReported"
		/>
	</view>
</template>

<script>
import QRCode from 'qrcode'
import ReportModal from '@/components/ReportModal.vue'
import config from '@/utils/config'
import { navigateToUserProfile } from '@/utils/userUtils'
import eventBus, { EVENTS } from '@/utils/eventBus'

export default {
	components: {
		ReportModal,
		HybridComment: () => import('@/components/HybridComment.vue')
	},
	data() {
		return {
			resourceId: '',
			loadError: null,
			resource: {
				id: '',
				resource_id: '',
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
			replyTarget: null,
			sending: false,
			sharePopupVisible: false,
			qrCodeVisible: false,
			qrCodeDataUrl: '',
			commentTextareaHeight: 40
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.resourceId = options.id
			this.loadResourceDetail()
			this.loadComments()
		}
	},
	
	onUnload() {
		// 页面卸载时，通知列表页面刷新数据
		const pages = getCurrentPages()
		if (pages.length >= 2) {
			const prevPage = pages[pages.length - 2]
			// 如果前一个页面是资源列表页面，通知其刷新
			if (prevPage.route === 'pages/resources/resources') {
				prevPage.$vm.refreshResourceData({
					resourceId: this.resourceId,
					viewCount: this.resource.viewCount,
					downloadCount: this.resource.downloadCount,
					favoriteCount: this.resource.favoriteCount,
					rating: this.resource.rating
				})
			}
		}
	},
	
	methods: {
		async loadResourceDetail() {
			try {
				this.loadError = null
				uni.showLoading({ title: '加载中...' })
				
				const response = await uni.request({
					url: `${config.apiBaseUrl}/resources/${this.resourceId}`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const data = response.data.data
					console.log('原始资源数据:', data)
					
					this.resource = {
						id: data.resource_id,
						resource_id: data.resource_id,
						title: data.resource_name,
						description: data.description,
						category: typeof data.category === 'string' ? data.category : (data.category?.category_name || '未分类'),
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
					this.loadError = response.data.message || '获取资源详情失败'
					// 重置resource到初始状态，但清空id以触发错误状态显示
					this.resource.id = ''
					this.resource.title = '加载中...'
				}
				
				// 检查收藏状态
				await this.checkCollectionStatus()
				
				// 获取用户评分
				await this.getUserRating()
				
				uni.hideLoading()
			} catch (error) {
				console.error('加载资源详情错误:', error)
				this.loadError = '网络错误，请检查网络连接'
				// 重置resource到初始状态，但清空id以触发错误状态显示
				this.resource.id = ''
				this.resource.title = '加载中...'
				uni.hideLoading()
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
				// 直接进行平台特定的下载
				// #ifdef H5
				// H5环境使用带身份认证的下载
				const h5DownloadUrl = `${config.apiBaseUrl}/resources/${this.resource.resource_id}/files/${file.file_id}/download`
				
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
					link.download = file.file_name || 'download'
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
					window.URL.revokeObjectURL(url)
					
					// 增加下载计数
					this.resource.downloadCount++
					uni.hideLoading()
					uni.showToast({
						title: '下载成功',
						icon: 'success'
					})
					
					// 触发下载计数变化事件
					eventBus.emit(EVENTS.RESOURCE_DOWNLOAD_CHANGED, {
						resourceId: this.resourceId,
						downloadCount: this.resource.downloadCount
					})
				}).catch(error => {
					console.error('下载失败:', error)
					uni.hideLoading()
					uni.showToast({
						title: '下载失败',
						icon: 'none'
					})
				})
				// #endif
				
				// #ifdef MP-WEIXIN
				// 微信小程序使用下载API
				const wxDownloadUrl = `${config.apiBaseUrl}/resources/${this.resource.resource_id}/files/${file.file_id}/download`
				
				uni.downloadFile({
					url: wxDownloadUrl,
					header: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/octet-stream'
					},
					success: (downloadRes) => {
						if (downloadRes.statusCode === 200) {
							// 增加下载计数
							this.resource.downloadCount++
							uni.hideLoading()
							
							// 触发下载计数变化事件
							eventBus.emit(EVENTS.RESOURCE_DOWNLOAD_CHANGED, {
								resourceId: this.resourceId,
								downloadCount: this.resource.downloadCount
							})
							
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
						} else {
							uni.hideLoading()
							uni.showToast({
								title: '下载失败',
								icon: 'none'
							})
						}
					},
					fail: () => {
						uni.hideLoading()
						uni.showToast({
							title: '下载失败',
							icon: 'none'
						})
					}
				})
				// #endif
				
				// #ifdef APP-PLUS
				// App环境使用plus下载
				const appDownloadUrl = `${config.apiBaseUrl}/resources/${this.resource.resource_id}/files/${file.file_id}/download`
				
				const dtask = plus.downloader.createDownload(appDownloadUrl, {
					filename: '_downloads/' + (file.file_name || 'download'),
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/octet-stream'
					}
				}, (download, status) => {
					uni.hideLoading()
					if (status == 200) {
						// 增加下载计数
						this.resource.downloadCount++
						uni.showToast({
							title: '下载完成',
							icon: 'success'
						})
						
						// 触发下载计数变化事件
						eventBus.emit(EVENTS.RESOURCE_DOWNLOAD_CHANGED, {
							resourceId: this.resourceId,
							downloadCount: this.resource.downloadCount
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
					url: `${config.apiBaseUrl}/resources/${this.resourceId}/favorite-status?type=resource`,
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
					url: `${config.apiBaseUrl}/resources/${this.resourceId}/favorite`,
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
					
					// 触发收藏状态变化事件
					eventBus.emit(EVENTS.RESOURCE_FAVORITE_CHANGED, {
						resourceId: this.resourceId,
						isFavorited: newFavoritedState,
						favoriteCount: this.resource.favoriteCount
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
					url: `${config.apiBaseUrl}/resources/${this.resourceId}/my-rating`,
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
					url: `${config.apiBaseUrl}/resources/${this.resourceId}/rating`,
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
					
					// 触发评分变化事件
					eventBus.emit(EVENTS.RESOURCE_RATING_CHANGED, {
						resourceId: this.resourceId,
						rating: this.resource.rating,
						userRating: rating
					})
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
		
		async loadComments() {
			try {
				const response = await uni.request({
					url: `${config.apiBaseUrl}/resources/${this.resourceId}/comments`,
					method: 'GET'
				})
				if (response.statusCode === 200 && response.data.success) {
					// 递归处理评论数据，确保所有层级都有正确的格式
					const processComments = (comments) => {
						return comments.map(comment => ({
							...comment,
							// 确保时间是Date对象
							createTime: comment.createTime ? new Date(comment.createTime) : new Date(comment.created_at),
							// 确保有默认头像
							userAvatar: comment.userAvatar || '/static/images/default-avatar.png',
							// 确保有用户名
							userName: comment.userName || '匿名用户',
							// 确保回复相关字段
							replyToName: comment.replyToName || '',
							replyToContent: comment.replyToContent || '',
							// 递归处理子回复
							replies: comment.replies ? processComments(comment.replies) : []
						}))
					}
					
					this.comments = processComments(response.data.data.comments || [])
				}
			} catch (error) {
				console.error('加载评论失败:', error)
				uni.showToast({
					title: '加载评论失败',
					icon: 'none'
				})
			}
		},
		
		replyToComment(comment) {
			this.replyTarget = comment
		},
		cancelReply() {
			this.replyTarget = null
			this.commentText = ''
		},
		async handleSubmitComment() {
			if (this.sending) return;
			this.sending = true;
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				if (!this.commentText || !this.commentText.trim()) {
					uni.showToast({ title: '评论内容不能为空', icon: 'none' })
					return
				}
				const data = {
					comment_content: this.commentText.trim()
				}
				if (this.replyTarget) {
					data.parent_comment_id = this.replyTarget.comment_id
				}
				const response = await uni.request({
					url: `${config.apiBaseUrl}/resources/${this.resourceId}/comments`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data
				})
				if (response.statusCode === 201 && response.data.success) {
					this.commentText = ''
					this.replyTarget = null
					this.loadComments()
					uni.showToast({ title: '评论成功', icon: 'success' })
				}
			} catch (error) {
				uni.showToast({ title: '评论失败', icon: 'none' })
			} finally {
				this.sending = false;
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
		},

		// 显示举报弹窗
		showReportModal() {
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			this.$refs.reportModal.show()
		},

		// 举报成功回调
		onReported() {
			uni.showToast({
				title: '举报已提交，感谢您的反馈',
				icon: 'success',
				duration: 3000
			})
		},

		adjustCommentTextareaHeight(e) {
			// 兼容uni-app和web
			const textarea = e.detail && e.detail.height ? e : e.target;
			if (textarea && textarea.scrollHeight) {
				this.commentTextareaHeight = textarea.scrollHeight;
			} else if (e.detail && e.detail.height) {
				this.commentTextareaHeight = e.detail.height;
			}
		},
		
		viewUserProfile(userPhone, userInfo) {
			navigateToUserProfile(userPhone, userInfo)
		},
		
		// 举报评论
		async reportComment(comment) {
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			uni.showActionSheet({
				itemList: ['内容不当', '垃圾信息', '冒犯性内容', '骚扰他人', '其他'],
				success: async (res) => {
					const reasonMap = {
						0: 'inappropriate',
						1: 'spam', 
						2: 'offensive',
						3: 'harassment',
						4: 'other'
					}
					const reasonLabels = ['内容不当', '垃圾信息', '冒犯性内容', '骚扰他人', '其他']
					const reason = reasonMap[res.tapIndex]
					const reasonLabel = reasonLabels[res.tapIndex]
					
					try {
						// 调用举报API
						const response = await uni.request({
							url: `${config.default.apiBaseUrl}/reports/comments/${comment.comment_id}`,
							method: 'POST',
							header: {
								'Authorization': `Bearer ${token}`,
								'Content-Type': 'application/json'
							},
							data: {
								reason: reason,
								description: `举报原因：${reasonLabel}`
							}
						})
						
						console.log('评论举报API响应:', response)
						if (response.statusCode === 200 && response.data.success) {
							uni.showToast({
								title: response.data.message || '举报提交成功',
								icon: 'success'
							})
						} else {
							console.error('评论举报失败响应:', response)
							throw new Error(response.data?.message || `API错误: ${response.statusCode}`)
						}
					} catch (error) {
						console.error('举报评论失败:', error)
						uni.showToast({
							title: error.message || '举报失败',
							icon: 'none'
						})
					}
				}
			})
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
			word-wrap: break-word;
			word-break: break-all;
			overflow-wrap: break-word;
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
	justify-content: space-between;
	background: white;
	border-radius: 20rpx;
	margin: 20rpx 0;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	.action-btn {
		flex: 1;
		height: 120rpx; /* 固定高度 */
		min-width: 140rpx; /* 最小宽度 */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16rpx 10rpx;
		background: white;
		border: none; /* 移除边框 */
		border-radius: 12rpx;
		transition: all 0.3s ease;
		
		.btn-icon {
			font-size: 40rpx;
			margin-bottom: 12rpx;
			line-height: 1;
		}
		
		.btn-text {
			font-size: 24rpx;
			line-height: 1;
			white-space: nowrap;
			color: #666;
		}
		
		&.primary {
			.btn-text {
				color: #333;
			}
			
			&:active {
				opacity: 0.8;
			}
		}
		
		&.favorited {
			.btn-icon {
				transform: scale(1.1);
				transition: transform 0.3s ease;
			}
			
			.btn-text {
				color: #ff4757;
			}
		}
		
		&:active {
			opacity: 0.8;
			transform: scale(0.98);
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
		word-wrap: break-word;
		word-break: break-all;
		overflow-wrap: break-word;
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

.comment-section {
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
	.comment-actions {
		display: flex;
		align-items: center;
		gap: 10rpx;
		
		.submit-btn {
			width: 120rpx;
			height: 72rpx;
			line-height: 72rpx;
			text-align: center;
			background: #6CB4EE;
			color: white;
			border-radius: 12rpx;
			font-size: 28rpx;
			padding: 0;
			margin: 0;
			box-shadow: 0 2rpx 8rpx rgba(108, 180, 238, 0.3);
			transition: all 0.3s ease;
			&:active {
				transform: scale(0.95);
				background: #5AA1DB;
			}
		}
		
		.cancel-reply {
			height: 72rpx;
			line-height: 72rpx;
			padding: 0 16rpx;
			background: #f5f5f5;
			border-radius: 12rpx;
			font-size: 26rpx;
			color: #666;
			text-align: center;
			&:active {
				background: #e0e0e0;
			}
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
				word-break: break-all;
				white-space: pre-wrap;
				overflow-wrap: anywhere;
			}
			.comment-footer {
				display: flex;
				justify-content: flex-end;
				margin-top: 8rpx;
				.reply-btn {
					padding: 4rpx 12rpx;
					background: #f5f5f5;
					border-radius: 12rpx;
					font-size: 24rpx;
					color: #666;
					margin-left: 10rpx;
					&:active {
						background: #e0e0e0;
					}
				}
			}
			.replies {
				margin-top: 10rpx;
				.reply-item {
					display: flex;
					flex-direction: row;
					align-items: flex-start;
					padding: 10rpx 0;
					border-bottom: 1rpx solid #f0f0f0;
					&:last-child {
						border-bottom: none;
						padding-bottom: 0;
					}
					.reply-avatar {
						width: 40rpx;
						height: 40rpx;
						border-radius: 50%;
						margin-right: 10rpx;
					}
					.reply-content-wrap {
						flex: 1;
						display: flex;
						flex-direction: column;
						.reply-header {
							display: flex;
							align-items: center;
							margin-bottom: 6rpx;
							.reply-info {
								flex: 1;
								.reply-author {
									font-size: 24rpx;
									font-weight: bold;
									color: #333;
									margin-right: 8rpx;
								}
								.reply-time {
									font-size: 20rpx;
									color: #999;
								}
							}
						}
						.reply-content {
							.reply-text {
								font-size: 24rpx;
								color: #333;
								line-height: 1.5;
								word-break: break-all;
								white-space: pre-wrap;
								overflow-wrap: anywhere;
							}
						}
						
						.reply-footer {
							display: flex;
							justify-content: flex-end;
							margin-top: 6rpx;
							.reply-btn {
								padding: 3rpx 10rpx;
								background: #f5f5f5;
								border-radius: 10rpx;
								font-size: 22rpx;
								color: #666;
								&:active {
									background: #e0e0e0;
								}
							}
						}
						
						.nested-replies {
							margin-top: 8rpx;
							margin-left: 20rpx;
							border-left: 2rpx solid #f0f0f0;
							padding-left: 10rpx;
							
							.nested-reply-item {
								display: flex;
								flex-direction: row;
								align-items: flex-start;
								padding: 8rpx 0;
								border-bottom: 1rpx solid #f8f8f8;
								&:last-child {
									border-bottom: none;
									padding-bottom: 0;
								}
								
								.nested-reply-avatar {
									width: 32rpx;
									height: 32rpx;
									border-radius: 50%;
									margin-right: 8rpx;
								}
								
								.nested-reply-content-wrap {
									flex: 1;
									display: flex;
									flex-direction: column;
									
									.nested-reply-header {
										display: flex;
										align-items: center;
										margin-bottom: 4rpx;
										
										.nested-reply-info {
											flex: 1;
											.nested-reply-author {
												font-size: 22rpx;
												font-weight: bold;
												color: #333;
												margin-right: 6rpx;
											}
											.nested-reply-time {
												font-size: 18rpx;
												color: #999;
											}
										}
									}
									
									.nested-reply-content {
										.nested-reply-text {
											font-size: 22rpx;
											color: #333;
											line-height: 1.5;
											word-break: break-all;
											white-space: pre-wrap;
											overflow-wrap: anywhere;
										}
									}
									
									.nested-reply-footer {
										display: flex;
										justify-content: flex-end;
										margin-top: 4rpx;
										.reply-btn {
											padding: 2rpx 8rpx;
											background: #f5f5f5;
											border-radius: 8rpx;
											font-size: 20rpx;
											color: #666;
											&:active {
												background: #e0e0e0;
											}
										}
									}
								}
							}
						}
					}
				}
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

/* 文件状态提示样式 */
.file-status-section {
	background-color: #fff8dc;
	border: 2rpx solid #f0ad4e;
	border-radius: 12rpx;
	margin: 20rpx 0;
	padding: 20rpx;
}

.file-status-warning {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
}

.warning-icon {
	font-size: 32rpx;
}

.warning-text {
	font-size: 28rpx;
	color: #856404;
	font-weight: 500;
}

.loading-container, .error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	text-align: center;
}

.loading-text, .error-text {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.retry-btn {
	background: #007aff;
	color: white;
	border: none;
	border-radius: 8rpx;
	padding: 20rpx 40rpx;
	font-size: 28rpx;
}
</style>