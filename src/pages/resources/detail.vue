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
			<button class="action-btn" @click="shareResource">
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
			
			<!-- 发表评论 -->
			<view class="comment-input-section">
				<textarea 
					class="comment-input" 
					placeholder="写下你的评论..." 
					v-model="commentText"
					:maxlength="500"
				></textarea>
				<button class="comment-submit-btn" @click="submitComment">发表</button>
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
	</view>
</template>

<script>
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
			comments: []
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
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}`,
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
					url: `this.$config.apiBaseUrl + '/resources/${this.resource.id}/files/${file.file_id}/download`,
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
							content: response.data.data.content.substring(0, 200) + '...',
							showCancel: false
						})
					} else if (response.data.data.downloadUrl) {
						// 其他文件显示下载链接
						uni.hideLoading()
						uni.showModal({
							title: '下载地址',
							content: '文件准备完成，实际项目中这里会触发文件下载',
							showCancel: false
						})
					}
					
					uni.showToast({
						title: '下载成功',
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
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}/favorite-status?type=resource`,
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
				
				// 记录当前状态，用于计算变化
				const wasAlreadyFavorited = this.resource.isFavorited
				
				const response = await uni.request({
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}/favorite`,
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
					const newFavoritedState = response.data.data.isCollected
					this.resource.isFavorited = newFavoritedState
					
					uni.showToast({
						title: response.data.message,
						icon: 'success'
					})
					
					// 重新加载资源详情以获取最新的收藏计数
					// 但不显示loading，避免闪烁
					setTimeout(async () => {
						try {
							const response = await uni.request({
								url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}`,
								method: 'GET'
							})
							
							if (response.statusCode === 200 && response.data.success) {
								const data = response.data.data
								this.resource.favoriteCount = parseInt(data.collection_count) || 0
							}
						} catch (error) {
							console.error('更新收藏计数失败:', error)
						}
					}, 100)
				} else {
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
		
		shareResource() {
			uni.showActionSheet({
				itemList: ['分享给好友', '复制链接', '保存二维码'],
				success: (res) => {
					const actions = ['分享给好友', '复制链接', '保存二维码']
					uni.showToast({
						title: actions[res.tapIndex],
						icon: 'none'
					})
				}
			})
		},
		
		// 获取用户评分
		async getUserRating() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}/my-rating`,
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
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}/rating`,
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
		
		async submitComment() {
			if (!this.commentText.trim()) {
				uni.showToast({
					title: '请输入评论内容',
					icon: 'none'
				})
				return
			}
			
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
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}/comments`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						comment_content: this.commentText
					}
				})
				
				if (response.statusCode === 201 && response.data.success) {
					// 重新加载评论列表
					await this.loadComments()
					this.commentText = ''
					
					uni.showToast({
						title: '评论成功',
						icon: 'success'
					})
				} else {
					throw new Error(response.data.message || '评论失败')
				}
			} catch (error) {
				console.error('评论失败:', error)
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
					url: `this.$config.apiBaseUrl + '/resources/${this.resourceId}/comments`,
					method: 'GET'
				})
				
				console.log('评论API响应:', response.data)
				
				if (response.statusCode === 200 && response.data.success) {
					this.comments = (response.data.data.comments || []).map(comment => ({
						comment_id: comment.comment_id,
						userName: comment.author?.nickname || comment.author?.name || '匿名用户',
						userAvatar: comment.author?.avatar_url || '',
						content: comment.content,
						createTime: new Date(comment.created_at)
					}))
					console.log('处理后的评论数据:', this.comments)
				}
			} catch (error) {
				console.error('加载评论失败:', error)
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
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.resource-header {
	background: white;
	padding: 40rpx 30rpx;
	display: flex;
	align-items: flex-start;
	
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
	margin-top: 20rpx;
	padding: 30rpx;
	display: flex;
	justify-content: space-around;
	
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
		
		&.primary {
			background: #007aff;
			color: white;
			border-color: #007aff;
		}
		
		&.favorited {
			border-color: #ff4757;
			color: #ff4757;
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
	margin: 20rpx 0;
	padding: 30rpx;
	
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


.comment-input-section {
	display: flex;
	margin-bottom: 30rpx;
	
	.comment-input {
		flex: 1;
		min-height: 100rpx;
		padding: 20rpx;
		background: #f8f8f8;
		border-radius: 15rpx;
		font-size: 26rpx;
		margin-right: 20rpx;
	}
	
	.comment-submit-btn {
		width: 120rpx;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 15rpx;
		font-size: 26rpx;
	}
}

.comment-list {
	.comment-item {
		display: flex;
		padding: 25rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
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
				margin-bottom: 10rpx;
				
				.comment-username {
					font-size: 26rpx;
					font-weight: bold;
					color: #333;
					margin-right: 20rpx;
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
				margin-bottom: 15rpx;
			}
			
		}
	}
}
</style>