<template>
	<view class="detail-container">
		<!-- 帖子详情 -->
		<view class="post-detail" v-if="post">
			<view class="post-header">
				<view class="author-info">
					<image class="avatar" :src="post.author.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
					<view class="author-details">
						<text class="author-name">{{ post.author.nickname || post.author.name }}</text>
						<text class="post-time">{{ formatTime(post.created_at) }}</text>
					</view>
				</view>
				<view class="post-actions">
					<view class="action-btn" @click="toggleLike">
						<text class="action-icon" :class="{ liked: isLiked }">{{ isLiked ? '❤️' : '🤍' }}</text>
						<text class="action-text">{{ post.like_count }}</text>
					</view>
				</view>
			</view>
			
			<view class="post-content">
				<text class="post-title">{{ post.title }}</text>
				<view class="post-body" v-html="renderedContent"></view>
			</view>
			
			<view class="post-footer" v-if="post.tags && post.tags.length > 0">
				<view class="post-tags">
					<view 
						class="post-tag" 
						v-for="tag in post.tags" 
						:key="tag.tag_id"
						:style="{ backgroundColor: tag.tag_color + '20', color: tag.tag_color }"
					>
						<text class="tag-name">{{ tag.tag_name }}</text>
					</view>
				</view>
			</view>
			
			<view class="post-stats">
				<text class="stat-item">👁️ {{ post.view_count }} 浏览</text>
				<text class="stat-item">💬 {{ post.comment_count }} 评论</text>
				<text class="stat-item">❤️ {{ post.like_count }} 点赞</text>
			</view>
		</view>
		
		<!-- 评论区域 -->
		<view class="comments-section">
			<view class="comments-header">
				<text class="comments-title">评论 ({{ totalComments }})</text>
				<view class="sort-options">
					<text 
						class="sort-option" 
						:class="{ active: sortBy === 'latest' }"
						@click="changeSortBy('latest')"
					>最新</text>
					<text 
						class="sort-option" 
						:class="{ active: sortBy === 'hot' }"
						@click="changeSortBy('hot')"
					>热门</text>
				</view>
			</view>
			
			<view class="comments-list">
				<view 
					class="comment-item" 
					v-for="comment in comments" 
					:key="comment.comment_id"
				>
					<view class="comment-header">
						<image class="comment-avatar" :src="comment.author.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
						<view class="comment-info">
							<text class="comment-author">{{ comment.author.nickname || comment.author.name }}</text>
							<text class="comment-time">{{ formatTime(comment.created_at) }}</text>
						</view>
						<view class="comment-actions">
							<view class="comment-like" @click="toggleCommentLike(comment)">
								<text class="like-icon" :class="{ liked: comment.isLiked }">{{ comment.isLiked ? '❤️' : '🤍' }}</text>
								<text class="like-count">{{ comment.like_count }}</text>
							</view>
						</view>
					</view>
					
					<view class="comment-content">
						<text class="comment-text">{{ comment.content }}</text>
					</view>
					
					<view class="comment-footer">
						<view class="reply-btn" @click="replyToComment(comment)">
							<text class="reply-text">回复</text>
						</view>
					</view>
					
					<!-- 回复列表 -->
					<view class="replies" v-if="comment.replies && comment.replies.length > 0">
						<view 
							class="reply-item"
							v-for="reply in comment.replies"
							:key="reply.comment_id"
						>
							<view class="reply-header">
								<image class="reply-avatar" :src="reply.author.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
								<view class="reply-info">
									<text class="reply-author">{{ reply.author.nickname || reply.author.name }}</text>
									<text class="reply-time">{{ formatTime(reply.created_at) }}</text>
								</view>
							</view>
							<view class="reply-content">
								<text class="reply-text">{{ reply.content }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 加载更多评论 -->
			<view class="load-more" v-if="hasMoreComments && !loadingComments">
				<button class="load-more-btn" @click="loadMoreComments">加载更多评论</button>
			</view>
			
			<!-- 加载中提示 -->
			<view class="loading" v-if="loadingComments">
				<text class="loading-text">加载中...</text>
			</view>
		</view>
		
		<!-- 评论输入框 -->
		<view class="comment-input-section">
			<view class="input-container">
				<textarea 
					class="comment-input" 
					:placeholder="replyTarget ? `回复 ${replyTarget.author.nickname || replyTarget.author.name}：` : '写评论...'"
					v-model="commentContent"
					maxlength="1000"
				></textarea>
				<view class="input-actions">
					<view class="cancel-reply" v-if="replyTarget" @click="cancelReply">
						<text class="cancel-text">取消回复</text>
					</view>
					<button 
						class="send-btn" 
						@click="sendComment"
						:disabled="!commentContent.trim() || sending"
					>
						{{ sending ? '发送中...' : '发送' }}
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			postId: '',
			post: null,
			comments: [],
			commentContent: '',
			replyTarget: null,
			sortBy: 'latest',
			page: 1,
			totalComments: 0,
			hasMoreComments: true,
			loadingComments: false,
			sending: false,
			isLiked: false
		}
	},
	
	computed: {
		renderedContent() {
			if (!this.post || !this.post.content) return ''
			
			// 简单的Markdown渲染
			return this.post.content
				.replace(/### (.*)/g, '<h3 style="font-size: 32rpx; font-weight: bold; margin: 20rpx 0;">$1</h3>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/`(.*?)`/g, '<code style="background: #f5f5f5; padding: 4rpx 8rpx; border-radius: 4rpx;">$1</code>')
				.replace(/^- (.*)/gm, '<li style="margin: 10rpx 0;">$1</li>')
				.replace(/\n/g, '<br>')
		}
	},
	
	onLoad(options) {
		this.postId = options.id
		if (this.postId) {
			this.loadPostDetail()
			this.loadComments()
		}
	},
	
	methods: {
		async loadPostDetail() {
			try {
				const response = await uni.request({
					url: `http://localhost:3000/api/v1/posts/${this.postId}`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.post = response.data.data
				} else {
					uni.showToast({
						title: '帖子不存在',
						icon: 'none'
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (error) {
				console.error('加载帖子详情失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			}
		},
		
		async loadComments(refresh = false) {
			if (this.loadingComments) return
			
			try {
				this.loadingComments = true
				
				const params = {
					page: refresh ? 1 : this.page,
					limit: 10
				}
				
				const response = await uni.request({
					url: `http://localhost:3000/api/v1/posts/${this.postId}/comments`,
					method: 'GET',
					data: params
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const { comments, pagination } = response.data.data
					
					if (refresh) {
						this.comments = comments
						this.page = 1
					} else {
						this.comments = [...this.comments, ...comments]
					}
					
					this.totalComments = pagination.totalItems
					this.hasMoreComments = pagination.currentPage < pagination.totalPages
					this.page = pagination.currentPage + 1
				}
			} catch (error) {
				console.error('加载评论失败:', error)
			} finally {
				this.loadingComments = false
			}
		},
		
		async loadMoreComments() {
			if (this.hasMoreComments && !this.loadingComments) {
				await this.loadComments()
			}
		},
		
		changeSortBy(newSortBy) {
			this.sortBy = newSortBy
			this.page = 1
			this.hasMoreComments = true
			this.loadComments(true)
		},
		
		async sendComment() {
			if (!this.commentContent.trim() || this.sending) return
			
			try {
				this.sending = true
				
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				const data = {
					content: this.commentContent.trim()
				}
				
				if (this.replyTarget) {
					data.parent_comment_id = this.replyTarget.comment_id
				}
				
				const response = await uni.request({
					url: `http://localhost:3000/api/v1/posts/${this.postId}/comments`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: data
				})
				
				if (response.statusCode === 201 && response.data.success) {
					uni.showToast({
						title: '评论成功',
						icon: 'success'
					})
					
					this.commentContent = ''
					this.replyTarget = null
					
					// 重新加载评论列表
					this.page = 1
					this.hasMoreComments = true
					this.loadComments(true)
					
					// 更新帖子评论数
					if (this.post) {
						this.post.comment_count++
					}
				} else {
					uni.showToast({
						title: response.data.message || '评论失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('发表评论失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			} finally {
				this.sending = false
			}
		},
		
		replyToComment(comment) {
			this.replyTarget = comment
			// 聚焦到输入框（在小程序中可能需要特殊处理）
		},
		
		cancelReply() {
			this.replyTarget = null
		},
		
		async toggleLike() {
			// 点赞功能实现
			this.isLiked = !this.isLiked
			if (this.isLiked) {
				this.post.like_count++
			} else {
				this.post.like_count--
			}
		},
		
		async toggleCommentLike(comment) {
			// 评论点赞功能实现
			comment.isLiked = !comment.isLiked
			if (comment.isLiked) {
				comment.like_count++
			} else {
				comment.like_count--
			}
		},
		
		formatTime(time) {
			if (!time) return '未知时间'
			
			const date = new Date(time)
			if (isNaN(date.getTime())) {
				return '时间格式错误'
			}
			
			const now = new Date()
			const diff = now - date
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return hours > 0 ? `${hours}小时前` : '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return date.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.detail-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 160rpx;
}

.post-detail {
	background: white;
	margin-bottom: 20rpx;
	
	.post-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		.author-info {
			display: flex;
			align-items: center;
			
			.avatar {
				width: 80rpx;
				height: 80rpx;
				border-radius: 50%;
				margin-right: 20rpx;
			}
			
			.author-details {
				display: flex;
				flex-direction: column;
				
				.author-name {
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 8rpx;
				}
				
				.post-time {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
		
		.post-actions {
			.action-btn {
				display: flex;
				flex-direction: column;
				align-items: center;
				
				.action-icon {
					font-size: 40rpx;
					margin-bottom: 5rpx;
					
					&.liked {
						color: #ff4757;
					}
				}
				
				.action-text {
					font-size: 22rpx;
					color: #666;
				}
			}
		}
	}
	
	.post-content {
		padding: 30rpx;
		
		.post-title {
			display: block;
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
			line-height: 1.4;
		}
		
		.post-body {
			font-size: 28rpx;
			line-height: 1.6;
			color: #333;
		}
	}
	
	.post-footer {
		padding: 0 30rpx 30rpx;
		
		.post-tags {
			display: flex;
			gap: 10rpx;
			flex-wrap: wrap;
			margin-bottom: 20rpx;
			
			.post-tag {
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				
				.tag-name {
					font-size: 22rpx;
				}
			}
		}
	}
	
	.post-stats {
		display: flex;
		gap: 30rpx;
		padding: 20rpx 30rpx;
		background: #f8f8f8;
		
		.stat-item {
			font-size: 24rpx;
			color: #666;
		}
	}
}

.comments-section {
	background: white;
	
	.comments-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		.comments-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
		}
		
		.sort-options {
			display: flex;
			gap: 20rpx;
			
			.sort-option {
				font-size: 26rpx;
				color: #666;
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				
				&.active {
					background: #007aff;
					color: white;
				}
			}
		}
	}
	
	.comments-list {
		.comment-item {
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			.comment-header {
				display: flex;
				align-items: center;
				margin-bottom: 20rpx;
				
				.comment-avatar {
					width: 60rpx;
					height: 60rpx;
					border-radius: 50%;
					margin-right: 15rpx;
				}
				
				.comment-info {
					flex: 1;
					
					.comment-author {
						display: block;
						font-size: 26rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 5rpx;
					}
					
					.comment-time {
						font-size: 22rpx;
						color: #999;
					}
				}
				
				.comment-actions {
					.comment-like {
						display: flex;
						align-items: center;
						gap: 5rpx;
						
						.like-icon {
							font-size: 30rpx;
							
							&.liked {
								color: #ff4757;
							}
						}
						
						.like-count {
							font-size: 22rpx;
							color: #666;
						}
					}
				}
			}
			
			.comment-content {
				margin-bottom: 20rpx;
				
				.comment-text {
					font-size: 26rpx;
					line-height: 1.5;
					color: #333;
				}
			}
			
			.comment-footer {
				.reply-btn {
					.reply-text {
						font-size: 24rpx;
						color: #007aff;
					}
				}
			}
			
			.replies {
				margin-top: 20rpx;
				padding-left: 40rpx;
				
				.reply-item {
					padding: 20rpx 0;
					border-top: 1rpx solid #f0f0f0;
					
					.reply-header {
						display: flex;
						align-items: center;
						margin-bottom: 15rpx;
						
						.reply-avatar {
							width: 50rpx;
							height: 50rpx;
							border-radius: 50%;
							margin-right: 10rpx;
						}
						
						.reply-info {
							.reply-author {
								display: block;
								font-size: 24rpx;
								font-weight: bold;
								color: #333;
								margin-bottom: 3rpx;
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
							line-height: 1.4;
							color: #333;
						}
					}
				}
			}
		}
	}
}

.load-more {
	padding: 20rpx;
	text-align: center;
	
	.load-more-btn {
		background: #f8f8f8;
		color: #666;
		border: none;
		border-radius: 50rpx;
		padding: 20rpx 40rpx;
		font-size: 26rpx;
	}
}

.loading {
	padding: 40rpx;
	text-align: center;
	
	.loading-text {
		font-size: 26rpx;
		color: #999;
	}
}

.comment-input-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	border-top: 1rpx solid #e0e0e0;
	
	.input-container {
		padding: 20rpx;
		
		.comment-input {
			width: 100%;
			min-height: 80rpx;
			max-height: 200rpx;
			border: 1rpx solid #e0e0e0;
			border-radius: 25rpx;
			padding: 20rpx;
			font-size: 26rpx;
			margin-bottom: 15rpx;
		}
		
		.input-actions {
			display: flex;
			justify-content: space-between;
			align-items: center;
			
			.cancel-reply {
				.cancel-text {
					font-size: 24rpx;
					color: #666;
				}
			}
			
			.send-btn {
				background: #007aff;
				color: white;
				border: none;
				border-radius: 25rpx;
				padding: 15rpx 30rpx;
				font-size: 26rpx;
				
				&[disabled] {
					background: #ccc;
				}
			}
		}
	}
}
</style>