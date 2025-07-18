<template>
	<view class="detail-container">
		<!-- 帖子详情 -->
		<view class="post-detail" v-if="post">
			<view class="post-header">
				<view class="author-info">
					<image class="avatar" :src="post.author.avatar_url || '/static/images/default-avatar.png'" mode="aspectFill" @click.stop="viewUserProfile(post.author.phone_number, post.author)"></image>
					<view class="author-details">
						<text class="author-name">{{ post.author.nickname || post.author.name }}</text>
						<text class="post-time">{{ formatTime(post.created_at) }}</text>
					</view>
				</view>
				<view class="post-actions">
					<view class="action-btn" @click="toggleCollection">
						<text class="action-icon" :class="{ collected: isCollected }">{{ isCollected ? '❤️' : '🤍' }}</text>
						<text class="action-text">{{ isCollected ? '已收藏' : '收藏' }}</text>
					</view>
					<view class="action-btn" @click="showSharePopup">
						<text class="action-icon">📤</text>
						<text class="action-text">分享</text>
					</view>
					<view class="action-btn report-btn" @click="showReportModal">
						<text class="action-icon">🚨</text>
						<text class="action-text">举报</text>
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
			</view>
		</view>
		
		<!-- 评论区 -->
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
				<view class="share-popup-title">分享帖子</view>
				<view class="share-popup-options" v-if="!postQrCodeVisible">
					<button class="share-popup-btn" @click="shareToFriend">分享给好友</button>
					<button class="share-popup-btn" @click="copyPostLink">复制链接</button>
					<button class="share-popup-btn" @click="showPostQrCode">保存二维码</button>
				</view>
				<view v-else class="qrcode-section">
					<image :src="postQrCodeDataUrl" class="qrcode-img" mode="aspectFit"/>
					<view class="qrcode-tip">长按图片保存（移动端）或右键图片另存为（PC端）</view>
					<button class="share-popup-close" @click="closePostQrCode">关闭二维码</button>
				</view>
				<button v-if="!postQrCodeVisible" class="share-popup-close" @click="closeSharePopup">取消</button>
			</view>
		</view>

		<!-- 举报弹窗 -->
		<ReportModal 
			ref="reportModal"
			content-type="post"
			:content-id="postId"
			:content-title="post ? post.title : ''"
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
			postId: '',
			post: null,
			commentText: '',
			comments: [],
			page: 1,
			hasMoreComments: true,
			loadingComments: false,
			sending: false,
			isCollected: false,
			sharePopupVisible: false,
			postQrCodeVisible: false,
			postQrCodeDataUrl: '',
			replyTarget: null,
			commentTextareaHeight: 40
		}
	},
	
	computed: {
		renderedContent() {
			if (!this.post || !this.post.content) return ''
			return this.renderMarkdown(this.post.content)
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
					url: `${config.apiBaseUrl}/posts/${this.postId}`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.post = response.data.data
					
					// 发送浏览数更新事件
					eventBus.emit(EVENTS.POST_VIEW_CHANGED, {
						postId: this.postId,
						viewCount: this.post.view_count
					})
					
					// 检查是否已收藏
					this.checkCollectionStatus()
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
		
		async checkCollectionStatus() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: `${config.apiBaseUrl}/posts/${this.postId}/favorite-status?type=post`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.isCollected = response.data.data.isCollected
				}
			} catch (error) {
				console.error('检查收藏状态失败:', error)
			}
		},
		
		async loadComments() {
			try {
				this.loadingComments = true
				const response = await uni.request({
					url: `${config.apiBaseUrl}/posts/${this.postId}/comments`,
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
				uni.showToast({ title: '加载评论失败', icon: 'none' })
			} finally {
				this.loadingComments = false
			}
		},
		
		async handleSubmitComment() {
			if (this.sending) return;
			this.sending = true;
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				return
			}
			if (!this.commentText || !this.commentText.trim()) {
				uni.showToast({ title: '评论内容不能为空', icon: 'none' })
				return
			}
			try {
				const data = {
					content: this.commentText.trim()
				}
				if (this.replyTarget) {
					data.parent_comment_id = this.replyTarget.comment_id
				}
				const response = await uni.request({
					url: `${config.apiBaseUrl}/posts/${this.postId}/comments`,
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
					
					// 更新本地帖子评论数
					if (this.post) {
						this.post.comment_count = (this.post.comment_count || 0) + 1
					}
					
					// 发送评论数更新事件
					eventBus.emit(EVENTS.POST_COMMENT_CHANGED, {
						postId: this.postId,
						commentCount: this.post.comment_count
					})
					
					uni.showToast({ title: '评论成功', icon: 'success' })
				}
			} catch (error) {
				uni.showToast({ title: '评论失败', icon: 'none' })
			} finally {
				this.sending = false
			}
		},
		
		async toggleCollection() {
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
					url: `${config.apiBaseUrl}/posts/${this.postId}/favorite`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						type: 'post'
					}
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.isCollected = response.data.data.isCollected
					
					uni.showToast({
						title: response.data.message,
						icon: 'success'
					})
					
					// 收藏成功，不需要更新计数（帖子收藏通过collections表管理）
				} else {
					uni.showToast({
						title: response.data.message || '操作失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('收藏操作失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			}
		},
		
		showSharePopup() {
			this.sharePopupVisible = true
		},
		closeSharePopup() {
			this.sharePopupVisible = false
			this.postQrCodeVisible = false
		},
		shareToFriend() {
			this.closeSharePopup()
			uni.showModal({
				title: '分享给好友',
				content: '请点击"复制链接"并粘贴到微信/QQ等聊天工具发送给好友。',
				showCancel: false
			})
		},
		copyPostLink() {
			this.closeSharePopup()
			const url = window.location.origin + `/#/pages/forum/detail?id=${this.postId}`
			uni.setClipboardData({
				data: url,
				success: () => {
					uni.showToast({ title: '链接已复制', icon: 'success' })
				}
			})
		},
		showPostQrCode() {
			const url = window.location.origin + `/#/pages/forum/detail?id=${this.postId}`
			QRCode.toDataURL(url, { width: 240, margin: 2 }, (err, url) => {
				if (!err) {
					this.postQrCodeDataUrl = url
					this.postQrCodeVisible = true
				} else {
					uni.showToast({ title: '二维码生成失败', icon: 'none' })
				}
			})
		},
		closePostQrCode() {
			this.postQrCodeVisible = false
		},
		
		renderMarkdown(content) {
			// 导入Markdown渲染工具函数
			const { renderMarkdown } = require('@/utils/markdown.js')
			return renderMarkdown(content)
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
		},
		
		cancelReply() {
			this.replyTarget = null
			this.commentText = ''
		},
		replyToComment(comment) {
			this.replyTarget = comment
			this.commentText = ''
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
			console.log('reportComment called with:', comment)
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
.detail-container {
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

@keyframes backgroundPan {
	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
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
			display: flex;
			gap: 30rpx;
			
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
					
					&.collected {
						color: #ffb700;
					}
				}
				
				.action-text {
					font-size: 22rpx;
					color: #666;
				}

				&.report-btn:active {
					.action-icon {
						color: #ff6b6b;
					}
					.action-text {
						color: #ff6b6b;
					}
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
			word-wrap: break-word;
			word-break: break-all;
			overflow-wrap: break-word;
		}
		
		.post-body {
			font-size: 28rpx;
			line-height: 1.6;
			color: #333;
			word-wrap: break-word;
			word-break: break-all;
			overflow-wrap: break-word;
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

</style>