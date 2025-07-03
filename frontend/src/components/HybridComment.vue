<template>
	<view class="hybrid-comment-container">
		<!-- 主评论 -->
		<view class="main-comment">
			<view class="comment-item">
				<image 
					class="comment-avatar main-avatar" 
					:src="comment.userAvatar || '/static/images/default-avatar.png'" 
					@click.stop="viewUserProfile(comment.userPhone, comment)"
				></image>
				
				<view class="comment-content">
					<view class="comment-header">
						<text class="comment-username">{{ comment.userName }}</text>
						<text class="comment-time">{{ formatTime(comment.createTime) }}</text>
					</view>
					
					<view class="comment-text">{{ comment.content }}</view>
					
					<view class="comment-footer">
						<view class="reply-btn" @click="replyToComment(comment)">
							<text class="reply-text">回复</text>
						</view>
						
						<!-- 展开/隐藏回复按钮 -->
						<view class="toggle-replies-btn" v-if="shouldShowToggle" @click="toggleReplies">
							<text class="toggle-text">
								{{ repliesExpanded ? '隐藏回复' : `查看${totalRepliesCount}条回复` }}
							</text>
							<text class="toggle-icon">{{ repliesExpanded ? '▲' : '▼' }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 递归嵌套回复显示 - Twitter风格 -->
		<view class="replies-container" v-if="comment.replies && comment.replies.length > 0 && (repliesExpanded || !shouldShowToggle)">
			<TwitterStyleReply
				v-for="reply in comment.replies"
				:key="reply.comment_id"
				:comment="reply"
				:depth="1"
				@reply="replyToComment"
				@viewProfile="viewUserProfile"
			/>
		</view>
	</view>
</template>

<script>
// 导入递归回复组件
import TwitterStyleReply from './TwitterStyleReply.vue'

export default {
	name: 'HybridComment',
	components: {
		TwitterStyleReply
	},
	props: {
		comment: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			repliesExpanded: false // 回复是否展开，默认隐藏
		}
	},
	computed: {
		// 计算总回复数（递归计算所有层级）
		totalRepliesCount() {
			const countReplies = (replies) => {
				if (!replies || !Array.isArray(replies)) return 0
				let count = replies.length
				replies.forEach(reply => {
					count += countReplies(reply.replies)
				})
				return count
			}
			return countReplies(this.comment.replies)
		},
		
		// 是否应该显示展开/隐藏按钮
		shouldShowToggle() {
			return this.totalRepliesCount >= 3
		}
	},
	methods: {
		replyToComment(comment) {
			this.$emit('reply', comment)
		},
		
		viewUserProfile(userPhone, userInfo) {
			this.$emit('viewProfile', userPhone, userInfo)
		},
		
		// 切换回复展开状态
		toggleReplies() {
			this.repliesExpanded = !this.repliesExpanded
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
.hybrid-comment-container {
	margin-bottom: 20rpx;
}

.main-comment {
	.comment-item {
		display: flex;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		
		.main-avatar {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			margin-right: 20rpx;
			flex-shrink: 0;
		}
		
		.comment-content {
			flex: 1;
			min-width: 0;
			
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
				margin-bottom: 8rpx;
			}
			
			.comment-footer {
				display: flex;
				justify-content: flex-end;
				align-items: center;
				gap: 12rpx;
				
				.reply-btn {
					padding: 4rpx 12rpx;
					background: #f5f5f5;
					border-radius: 12rpx;
					font-size: 24rpx;
					color: #666;
					
					&:active {
						background: #e0e0e0;
					}
				}
				
				.toggle-replies-btn {
					display: flex;
					align-items: center;
					padding: 4rpx 12rpx;
					background: #007AFF;
					border-radius: 12rpx;
					font-size: 22rpx;
					color: #fff;
					gap: 4rpx;
					
					&:active {
						background: #0056CC;
						transform: scale(0.95);
					}
					
					.toggle-text {
						color: #fff;
					}
					
					.toggle-icon {
						color: #fff;
						font-size: 18rpx;
						font-weight: bold;
					}
				}
			}
		}
	}
}

.replies-container {
	margin-top: 10rpx;
}
</style>