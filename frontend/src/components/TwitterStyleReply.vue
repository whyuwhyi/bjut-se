<template>
	<view class="twitter-reply-container">
		<view class="reply-item" :class="{ 'deep-reply': depth >= 2 }">
			<!-- 连线指示器 -->
			<view class="reply-line" v-if="depth > 0" :style="{ left: getLinePosition(depth) + 'rpx' }"></view>
			
			<!-- 头像 -->
			<image 
				class="reply-avatar" 
				:src="comment.userAvatar || '/static/images/default-avatar.png'" 
				@click.stop="viewUserProfile(comment.userPhone, comment)"
				:style="{ 
					width: getAvatarSize(depth) + 'rpx', 
					height: getAvatarSize(depth) + 'rpx',
					marginLeft: getIndentSize(depth) + 'rpx'
				}"
			></image>
			
			<!-- 回复内容 -->
			<view class="reply-content" :style="{ marginLeft: getContentMargin(depth) + 'rpx' }">
				<view class="reply-header">
					<text class="reply-username" :style="{ fontSize: getUsernameSize(depth) + 'rpx' }">
						{{ comment.userName }}
						<!-- 显示回复对象，Twitter风格 -->
						<text class="reply-to" v-if="comment.replyToName" :style="{ fontSize: getReplyToSize(depth) + 'rpx' }">
							回复 @{{ comment.replyToName }}
						</text>
					</text>
					<text class="reply-time" :style="{ fontSize: getTimeSize(depth) + 'rpx' }">
						{{ formatTime(comment.createTime) }}
					</text>
				</view>
				
				<!-- 在深层回复中显示被回复的内容 -->
				<view class="quoted-content" v-if="comment.replyToName && comment.replyToContent && depth >= 2" :style="{ fontSize: getQuotedContentSize(depth) + 'rpx' }">
					<text class="quote-prefix">「</text>
					<text class="quote-text">{{ comment.replyToContent }}</text>
					<text class="quote-suffix">」</text>
				</view>
				
				<view class="reply-text" :style="{ fontSize: getContentSize(depth) + 'rpx' }">
					{{ comment.content }}
				</view>
				
				<view class="reply-footer">
					<view class="reply-btn" @click="replyToComment(comment)" :style="{ fontSize: getReplyBtnSize(depth) + 'rpx' }">
						<text class="reply-text">回复</text>
					</view>
					
					<view class="report-btn" @click="reportComment(comment)" :style="{ fontSize: getReplyBtnSize(depth) + 'rpx' }">
						<text class="report-text">举报</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 递归渲染子回复 -->
		<view class="nested-replies" v-if="comment.replies && comment.replies.length > 0">
			<TwitterStyleReply
				v-for="reply in comment.replies"
				:key="reply.comment_id"
				:comment="reply"
				:depth="depth + 1"
				@reply="replyToComment"
				@viewProfile="viewUserProfile"
				@report="reportComment"
			/>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TwitterStyleReply',
	props: {
		comment: {
			type: Object,
			required: true
		},
		depth: {
			type: Number,
			default: 0
		}
	},
	methods: {
		replyToComment(comment) {
			this.$emit('reply', comment)
		},
		
		viewUserProfile(userPhone, userInfo) {
			this.$emit('viewProfile', userPhone, userInfo)
		},
		
		// 举报评论
		reportComment(comment) {
			this.$emit('report', comment)
		},
		
		// 根据深度获取头像尺寸（平面化回复使用统一大小）
		getAvatarSize(depth) {
			if (depth >= 2) {
				return 35 // 平面化回复统一使用35rpx头像
			}
			const baseSize = 50
			const minSize = 35
			const decrease = Math.min(depth * 8, 15)
			return Math.max(baseSize - decrease, minSize)
		},
		
		// 根据深度获取缩进尺寸（平面化回复统一缩进）
		getIndentSize(depth) {
			if (depth === 0) return 0
			if (depth === 1) return 20
			// 所有平面化回复（depth >= 2）使用相同的缩进
			return 40 // 平面化回复统一缩进40rpx，比1级回复更靠右
		},
		
		// 根据深度获取内容边距（极小间距）
		getContentMargin(depth) {
			return this.getIndentSize(depth) + this.getAvatarSize(depth) + 2
		},
		
		// 根据深度获取线条位置
		getLinePosition(depth) {
			if (depth === 1) return 10 // 1级回复的线条位置
			return 30 // 所有平面化回复（depth >= 2）使用相同的线条位置
		},
		
		// 根据深度获取用户名字体大小
		getUsernameSize(depth) {
			const baseSize = 24
			const minSize = 20
			const decrease = Math.min(depth * 2, 6)
			return Math.max(baseSize - decrease, minSize)
		},
		
		// 根据深度获取回复对象字体大小
		getReplyToSize(depth) {
			const baseSize = 22
			const minSize = 18
			const decrease = Math.min(depth * 2, 6)
			return Math.max(baseSize - decrease, minSize)
		},
		
		// 根据深度获取内容字体大小
		getContentSize(depth) {
			const baseSize = 24
			const minSize = 20
			const decrease = Math.min(depth * 2, 6)
			return Math.max(baseSize - decrease, minSize)
		},
		
		// 根据深度获取时间字体大小
		getTimeSize(depth) {
			const baseSize = 20
			const minSize = 16
			const decrease = Math.min(depth * 2, 6)
			return Math.max(baseSize - decrease, minSize)
		},
		
		// 统一回复按钮字体大小
		getReplyBtnSize(depth) {
			return 20 // 所有回复按钮使用相同大小
		},
		
		// 根据深度获取引用内容字体大小
		getQuotedContentSize(depth) {
			const baseSize = 20
			const minSize = 16
			const decrease = Math.min(depth * 2, 6)
			return Math.max(baseSize - decrease, minSize)
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
.twitter-reply-container {
	position: relative;
}

.reply-item {
	position: relative;
	display: flex;
	padding: 15rpx 0;
	border-bottom: 1rpx solid #f8f8f8;
	transition: background-color 0.2s ease;
	
	&:hover {
		background-color: #fafafa;
	}
	
	&:last-child {
		border-bottom: none;
	}
	
	&.deep-reply {
		background-color: #f9f9f9;
		border-left: 2rpx solid #007AFF;
		border-radius: 0 8rpx 8rpx 0;
		padding-left: 8rpx;
	}
	
	.reply-line {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 2rpx;
		background: linear-gradient(to bottom, #e0e0e0, #f0f0f0);
		border-radius: 1rpx;
	}
	
	.reply-avatar {
		border-radius: 50%;
		margin-right: 2rpx;
		flex-shrink: 0;
		border: 1rpx solid #f0f0f0;
		transition: transform 0.2s ease;
		
		&:active {
			transform: scale(0.95);
		}
	}
	
	.reply-content {
		flex: 1;
		min-width: 0;
		margin-right: 20rpx;
		
		.reply-header {
			display: flex;
			align-items: center;
			margin-bottom: 6rpx;
			flex-wrap: wrap;
			
			.reply-username {
				font-weight: bold;
				color: #333;
				margin-right: 12rpx;
				
				.reply-to {
					font-weight: normal;
					color: #666;
					margin-left: 8rpx;
				}
			}
			
			.reply-time {
				color: #999;
				flex-shrink: 0;
			}
		}
		
		.quoted-content {
			background: #f8f9fa;
			border-left: 3rpx solid #007AFF;
			padding: 8rpx 12rpx;
			margin: 6rpx 20rpx 6rpx 0; // 增加右边距，防止太靠右
			border-radius: 0 6rpx 6rpx 0;
			color: #666;
			line-height: 1.4;
			
			.quote-prefix, .quote-suffix {
				color: #007AFF;
				font-weight: bold;
				margin: 0 2rpx;
			}
			
			.quote-text {
				color: #666;
				font-style: italic;
			}
		}
		
		.reply-text {
			color: #333;
			line-height: 1.5;
			word-break: break-all;
			white-space: pre-wrap;
			overflow-wrap: anywhere;
			margin-bottom: 6rpx;
		}
		
		.reply-footer {
			display: flex;
			justify-content: flex-end;
			gap: 8rpx;
			
			.reply-btn, .report-btn {
				padding: 4rpx 12rpx;
				background: #f5f5f5;
				border-radius: 12rpx;
				color: #666;
				transition: all 0.2s ease;
				
				&:active {
					background: #e0e0e0;
					transform: scale(0.95);
				}
			}
			
			.report-btn {
				color: #ff6b6b;
				
				&:active {
					background: #ffe0e0;
				}
			}
		}
	}
}

.nested-replies {
	position: relative;
	
	&::before {
		content: '';
		position: absolute;
		left: 25rpx;
		top: 0;
		bottom: 30rpx;
		width: 2rpx;
		background: linear-gradient(to bottom, #e0e0e0, transparent);
		border-radius: 1rpx;
	}
}
</style>