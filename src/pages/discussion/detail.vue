<template>
	<view class="discussion-detail-container">
		<!-- 主帖内容 -->
		<view class="main-post">
			<view class="post-header">
				<image class="author-avatar" :src="discussion.authorAvatar || '/static/images/default-avatar.png'"></image>
				<view class="author-info">
					<text class="author-name">{{ discussion.authorName }}</text>
					<view class="post-meta">
						<text class="post-time">{{ formatTime(discussion.createTime) }}</text>
						<view class="post-tag" v-if="discussion.isQuestion">❓ 提问</view>
						<view class="post-tag resolved" v-if="discussion.isResolved">✅ 已解决</view>
					</view>
				</view>
				<view class="post-actions">
					<view class="action-btn" @click="showMoreActions">
						<text class="action-icon">⋯</text>
					</view>
				</view>
			</view>
			
			<view class="post-content">
				<text class="post-title">{{ discussion.title }}</text>
				<text class="post-text">{{ discussion.content }}</text>
				
				<!-- 图片展示 -->
				<view class="post-images" v-if="discussion.images && discussion.images.length">
					<image 
						class="post-image" 
						v-for="(image, index) in discussion.images" 
						:key="index"
						:src="image"
						mode="aspectFill"
						@click="previewImage(index)"
					></image>
				</view>
				
				<!-- 附件展示 -->
				<view class="post-attachments" v-if="discussion.attachments && discussion.attachments.length">
					<view 
						class="attachment-item" 
						v-for="(attachment, index) in discussion.attachments" 
						:key="index"
						@click="downloadAttachment(attachment)"
					>
						<text class="attachment-icon">📎</text>
						<text class="attachment-name">{{ attachment.name }}</text>
						<text class="attachment-size">{{ formatFileSize(attachment.size) }}</text>
					</view>
				</view>
				
				<!-- 话题标签 -->
				<view class="post-tags" v-if="discussion.tags && discussion.tags.length">
					<text class="tag" v-for="(tag, index) in discussion.tags" :key="index"># {{ tag }}</text>
				</view>
			</view>
			
			<view class="post-stats">
				<view class="stat-item" @click="toggleLike">
					<text class="stat-icon" :class="{ liked: discussion.isLiked }">👍</text>
					<text class="stat-text">{{ discussion.likeCount }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-icon">💬</text>
					<text class="stat-text">{{ discussion.replyCount }}</text>
				</view>
				<view class="stat-item">
					<text class="stat-icon">👁️</text>
					<text class="stat-text">{{ discussion.viewCount }}</text>
				</view>
				<view class="stat-item" @click="shareDiscussion">
					<text class="stat-icon">📤</text>
					<text class="stat-text">分享</text>
				</view>
			</view>
		</view>

		<!-- 回复列表 -->
		<view class="replies-section">
			<view class="section-header">
				<text class="section-title">回复 ({{ replies.length }})</text>
				<view class="sort-options">
					<text 
						class="sort-option" 
						:class="{ active: sortType === 'time' }" 
						@click="changeSortType('time')"
					>
						时间
					</text>
					<text 
						class="sort-option" 
						:class="{ active: sortType === 'hot' }" 
						@click="changeSortType('hot')"
					>
						热度
					</text>
				</view>
			</view>
			
			<view class="replies-list">
				<view class="reply-item" v-for="(reply, index) in sortedReplies" :key="index">
					<image class="reply-avatar" :src="reply.authorAvatar || '/static/images/default-avatar.png'"></image>
					<view class="reply-content">
						<view class="reply-header">
							<text class="reply-author">{{ reply.authorName }}</text>
							<view class="reply-badge" v-if="reply.isBestAnswer">🏆 最佳答案</view>
							<text class="reply-time">{{ formatTime(reply.createTime) }}</text>
						</view>
						
						<text class="reply-text">{{ reply.content }}</text>
						
						<!-- 回复的图片 -->
						<view class="reply-images" v-if="reply.images && reply.images.length">
							<image 
								class="reply-image" 
								v-for="(image, imgIndex) in reply.images" 
								:key="imgIndex"
								:src="image"
								mode="aspectFill"
								@click="previewReplyImage(reply, imgIndex)"
							></image>
						</view>
						
						<view class="reply-actions">
							<view class="reply-action" @click="toggleReplyLike(reply)">
								<text class="action-icon" :class="{ liked: reply.isLiked }">👍</text>
								<text class="action-count">{{ reply.likeCount || 0 }}</text>
							</view>
							<view class="reply-action" @click="replyToReply(reply)">
								<text class="action-icon">💬</text>
								<text class="action-text">回复</text>
							</view>
							<view 
								class="reply-action" 
								v-if="discussion.isQuestion && !discussion.isResolved && isAuthor"
								@click="markAsBestAnswer(reply)"
							>
								<text class="action-icon">🏆</text>
								<text class="action-text">采纳</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 回复输入框 -->
		<view class="reply-input-section">
			<view class="reply-input-header" v-if="replyToUser">
				<text class="reply-to-text">回复 @{{ replyToUser }}</text>
				<text class="cancel-reply" @click="cancelReply">取消</text>
			</view>
			
			<view class="input-area">
				<textarea 
					class="reply-input" 
					:placeholder="replyPlaceholder"
					v-model="replyText"
					:maxlength="1000"
					:auto-height="true"
				></textarea>
				<view class="input-actions">
					<view class="input-action" @click="chooseImage">
						<text class="action-icon">🖼️</text>
					</view>
					<view class="input-action" @click="chooseFile">
						<text class="action-icon">📎</text>
					</view>
				</view>
			</view>
			
			<!-- 选中的图片预览 -->
			<view class="selected-images" v-if="selectedImages.length">
				<view class="selected-image-item" v-for="(image, index) in selectedImages" :key="index">
					<image class="selected-image" :src="image" mode="aspectFill"></image>
					<view class="remove-image" @click="removeImage(index)">×</view>
				</view>
			</view>
			
			<button class="submit-reply-btn" @click="submitReply" :disabled="!replyText.trim()">
				发表回复
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			discussionId: '',
			discussion: {
				id: 1,
				title: '关于数据库设计的几个问题',
				content: '大家好，我在学习数据库设计的时候遇到了几个问题，希望大家能帮忙解答一下：\n\n1. 在设计表结构时，什么情况下应该使用外键约束？\n2. 如何平衡数据库的规范化和查询性能？\n3. 对于大数据量的表，有什么分表策略推荐吗？\n\n谢谢大家！🙏',
				authorName: '张同学',
				authorAvatar: '',
				createTime: new Date('2025-06-19 14:30:00'),
				isQuestion: true,
				isResolved: false,
				isLiked: false,
				likeCount: 12,
				replyCount: 8,
				viewCount: 156,
				tags: ['数据库', '设计', '性能优化'],
				images: [],
				attachments: []
			},
			replies: [
				{
					id: 1,
					authorName: '李老师',
					authorAvatar: '',
					content: '关于外键约束的使用，我建议在以下情况使用：\n\n1. 需要保证数据完整性的关键业务场景\n2. 数据变化频率不高的表\n3. 对性能要求不是特别严格的系统\n\n外键约束可以在数据库层面保证数据一致性，但会影响插入和更新的性能。',
					createTime: new Date('2025-06-19 15:10:00'),
					likeCount: 8,
					isLiked: false,
					isBestAnswer: false,
					images: []
				},
				{
					id: 2,
					authorName: '王同学',
					authorAvatar: '',
					content: '关于规范化和性能的平衡，我的经验是：\n\n第三范式通常是一个比较好的平衡点。过度规范化会导致查询时需要大量JOIN操作，影响性能。可以考虑适当的反规范化，比如冗余一些经常查询的字段。',
					createTime: new Date('2025-06-19 15:25:00'),
					likeCount: 5,
					isLiked: true,
					isBestAnswer: true,
					images: []
				},
				{
					id: 3,
					authorName: '赵同学',
					authorAvatar: '',
					content: '分表策略的话，我推荐几种方案：\n\n1. 水平分表：按照某个字段值分表，比如按用户ID取模\n2. 垂直分表：把不常用的字段分离到单独的表\n3. 时间分表：按月份或年份分表，适合日志类数据\n\n具体选择哪种要看业务场景。',
					createTime: new Date('2025-06-19 16:00:00'),
					likeCount: 3,
					isLiked: false,
					isBestAnswer: false,
					images: []
				}
			],
			sortType: 'time', // time 或 hot
			replyText: '',
			replyToUser: '',
			selectedImages: [],
			isAuthor: false // 当前用户是否为主帖作者
		}
	},
	
	computed: {
		replyPlaceholder() {
			return this.replyToUser ? `回复 @${this.replyToUser}` : '写下你的回复...'
		},
		
		sortedReplies() {
			const replies = [...this.replies]
			if (this.sortType === 'hot') {
				return replies.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
			} else {
				return replies.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
			}
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.discussionId = options.id
			this.loadDiscussionDetail()
		}
	},
	
	methods: {
		async loadDiscussionDetail() {
			try {
				uni.showLoading({ title: '加载中...' })
				// 模拟API调用
				setTimeout(() => {
					uni.hideLoading()
					// 增加浏览量
					this.discussion.viewCount++
				}, 1000)
			} catch (error) {
				uni.hideLoading()
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		toggleLike() {
			this.discussion.isLiked = !this.discussion.isLiked
			if (this.discussion.isLiked) {
				this.discussion.likeCount++
			} else {
				this.discussion.likeCount--
			}
		},
		
		toggleReplyLike(reply) {
			reply.isLiked = !reply.isLiked
			if (reply.isLiked) {
				reply.likeCount = (reply.likeCount || 0) + 1
			} else {
				reply.likeCount = Math.max(0, (reply.likeCount || 0) - 1)
			}
		},
		
		changeSortType(type) {
			this.sortType = type
		},
		
		replyToReply(reply) {
			this.replyToUser = reply.authorName
		},
		
		cancelReply() {
			this.replyToUser = ''
		},
		
		markAsBestAnswer(reply) {
			uni.showModal({
				title: '确认采纳',
				content: '确定要采纳这个回答为最佳答案吗？',
				success: (res) => {
					if (res.confirm) {
						// 取消其他回答的最佳答案状态
						this.replies.forEach(r => r.isBestAnswer = false)
						// 设置当前回答为最佳答案
						reply.isBestAnswer = true
						// 标记问题为已解决
						this.discussion.isResolved = true
						
						uni.showToast({
							title: '已采纳为最佳答案',
							icon: 'success'
						})
					}
				}
			})
		},
		
		chooseImage() {
			uni.chooseImage({
				count: 3 - this.selectedImages.length,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.selectedImages.push(...res.tempFilePaths)
				}
			})
		},
		
		chooseFile() {
			uni.showToast({
				title: '文件上传功能开发中',
				icon: 'none'
			})
		},
		
		removeImage(index) {
			this.selectedImages.splice(index, 1)
		},
		
		submitReply() {
			if (!this.replyText.trim()) {
				uni.showToast({
					title: '请输入回复内容',
					icon: 'none'
				})
				return
			}
			
			const newReply = {
				id: Date.now(),
				authorName: '我',
				authorAvatar: '',
				content: this.replyText,
				createTime: new Date(),
				likeCount: 0,
				isLiked: false,
				isBestAnswer: false,
				images: [...this.selectedImages]
			}
			
			this.replies.push(newReply)
			this.discussion.replyCount++
			
			// 清空输入
			this.replyText = ''
			this.selectedImages = []
			this.replyToUser = ''
			
			uni.showToast({
				title: '回复成功',
				icon: 'success'
			})
		},
		
		previewImage(index) {
			uni.previewImage({
				urls: this.discussion.images,
				current: index
			})
		},
		
		previewReplyImage(reply, index) {
			uni.previewImage({
				urls: reply.images,
				current: index
			})
		},
		
		downloadAttachment(attachment) {
			uni.showToast({
				title: '开始下载',
				icon: 'success'
			})
		},
		
		shareDiscussion() {
			uni.showActionSheet({
				itemList: ['分享给好友', '复制链接', '举报'],
				success: (res) => {
					const actions = ['分享给好友', '复制链接', '举报']
					uni.showToast({
						title: actions[res.tapIndex],
						icon: 'none'
					})
				}
			})
		},
		
		showMoreActions() {
			const itemList = ['举报', '收藏']
			if (this.isAuthor) {
				itemList.unshift('编辑', '删除')
			}
			
			uni.showActionSheet({
				itemList: itemList,
				success: (res) => {
					uni.showToast({
						title: itemList[res.tapIndex],
						icon: 'none'
					})
				}
			})
		},
		
		formatTime(time) {
			const now = new Date()
			const diff = now - time
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
				if (hours > 0) return `${hours}小时前`
				if (minutes > 0) return `${minutes}分钟前`
				return '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return time.toLocaleDateString()
			}
		},
		
		formatFileSize(bytes) {
			if (bytes === 0) return '0 B'
			const k = 1024
			const sizes = ['B', 'KB', 'MB', 'GB']
			const i = Math.floor(Math.log(bytes) / Math.log(k))
			return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
		}
	}
}
</script>

<style lang="scss" scoped>
.discussion-detail-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 200rpx;
}

.main-post {
	background: white;
	margin-bottom: 20rpx;
	
	.post-header {
		display: flex;
		align-items: flex-start;
		padding: 30rpx;
		
		.author-avatar {
			width: 70rpx;
			height: 70rpx;
			border-radius: 50%;
			margin-right: 20rpx;
		}
		
		.author-info {
			flex: 1;
			
			.author-name {
				display: block;
				font-size: 30rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 8rpx;
			}
			
			.post-meta {
				display: flex;
				align-items: center;
				
				.post-time {
					font-size: 24rpx;
					color: #666;
					margin-right: 20rpx;
				}
				
				.post-tag {
					padding: 4rpx 12rpx;
					border-radius: 10rpx;
					font-size: 20rpx;
					color: white;
					background: #ff9500;
					margin-right: 10rpx;
					
					&.resolved {
						background: #4caf50;
					}
				}
			}
		}
		
		.post-actions {
			.action-btn {
				padding: 10rpx;
				
				.action-icon {
					font-size: 32rpx;
					color: #666;
				}
			}
		}
	}
	
	.post-content {
		padding: 0 30rpx 20rpx;
		
		.post-title {
			display: block;
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
			line-height: 1.4;
			margin-bottom: 20rpx;
		}
		
		.post-text {
			font-size: 28rpx;
			color: #333;
			line-height: 1.6;
			white-space: pre-line;
			margin-bottom: 20rpx;
		}
		
		.post-images {
			display: flex;
			flex-wrap: wrap;
			gap: 10rpx;
			margin-bottom: 20rpx;
			
			.post-image {
				width: 200rpx;
				height: 200rpx;
				border-radius: 10rpx;
			}
		}
		
		.post-attachments {
			margin-bottom: 20rpx;
			
			.attachment-item {
				display: flex;
				align-items: center;
				padding: 15rpx;
				background: #f8f8f8;
				border-radius: 10rpx;
				margin-bottom: 10rpx;
				
				.attachment-icon {
					font-size: 32rpx;
					margin-right: 15rpx;
				}
				
				.attachment-name {
					flex: 1;
					font-size: 26rpx;
					color: #333;
				}
				
				.attachment-size {
					font-size: 22rpx;
					color: #666;
				}
			}
		}
		
		.post-tags {
			.tag {
				display: inline-block;
				padding: 8rpx 16rpx;
				background: #e3f2fd;
				color: #1976d2;
				border-radius: 20rpx;
				font-size: 22rpx;
				margin-right: 15rpx;
				margin-bottom: 10rpx;
			}
		}
	}
	
	.post-stats {
		display: flex;
		padding: 20rpx 30rpx;
		border-top: 1rpx solid #f0f0f0;
		
		.stat-item {
			display: flex;
			align-items: center;
			margin-right: 40rpx;
			
			.stat-icon {
				font-size: 32rpx;
				margin-right: 8rpx;
				
				&.liked {
					color: #007aff;
				}
			}
			
			.stat-text {
				font-size: 24rpx;
				color: #666;
			}
		}
	}
}

.replies-section {
	background: white;
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
		
		.sort-options {
			.sort-option {
				font-size: 26rpx;
				color: #666;
				margin-left: 30rpx;
				
				&.active {
					color: #007aff;
					font-weight: bold;
				}
			}
		}
	}
	
	.replies-list {
		.reply-item {
			display: flex;
			align-items: flex-start;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.reply-avatar {
				width: 60rpx;
				height: 60rpx;
				border-radius: 50%;
				margin-right: 20rpx;
			}
			
			.reply-content {
				flex: 1;
				
				.reply-header {
					display: flex;
					align-items: center;
					margin-bottom: 15rpx;
					
					.reply-author {
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-right: 15rpx;
					}
					
					.reply-badge {
						padding: 4rpx 12rpx;
						background: #ffd700;
						color: #333;
						border-radius: 10rpx;
						font-size: 20rpx;
						margin-right: 15rpx;
					}
					
					.reply-time {
						font-size: 22rpx;
						color: #666;
					}
				}
				
				.reply-text {
					font-size: 26rpx;
					color: #333;
					line-height: 1.5;
					margin-bottom: 15rpx;
					white-space: pre-line;
				}
				
				.reply-images {
					display: flex;
					flex-wrap: wrap;
					gap: 10rpx;
					margin-bottom: 15rpx;
					
					.reply-image {
						width: 150rpx;
						height: 150rpx;
						border-radius: 8rpx;
					}
				}
				
				.reply-actions {
					display: flex;
					align-items: center;
					
					.reply-action {
						display: flex;
						align-items: center;
						margin-right: 30rpx;
						
						.action-icon {
							font-size: 24rpx;
							margin-right: 6rpx;
							
							&.liked {
								color: #007aff;
							}
						}
						
						.action-count, .action-text {
							font-size: 22rpx;
							color: #666;
						}
					}
				}
			}
		}
	}
}

.reply-input-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	border-top: 1rpx solid #e0e0e0;
	padding: 20rpx;
	
	.reply-input-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15rpx;
		
		.reply-to-text {
			font-size: 24rpx;
			color: #007aff;
		}
		
		.cancel-reply {
			font-size: 24rpx;
			color: #666;
		}
	}
	
	.input-area {
		display: flex;
		align-items: flex-end;
		margin-bottom: 15rpx;
		
		.reply-input {
			flex: 1;
			min-height: 60rpx;
			max-height: 200rpx;
			padding: 15rpx;
			background: #f8f8f8;
			border-radius: 25rpx;
			font-size: 26rpx;
			margin-right: 15rpx;
		}
		
		.input-actions {
			display: flex;
			
			.input-action {
				padding: 15rpx;
				margin-left: 10rpx;
				
				.action-icon {
					font-size: 32rpx;
				}
			}
		}
	}
	
	.selected-images {
		display: flex;
		gap: 10rpx;
		margin-bottom: 15rpx;
		
		.selected-image-item {
			position: relative;
			
			.selected-image {
				width: 100rpx;
				height: 100rpx;
				border-radius: 8rpx;
			}
			
			.remove-image {
				position: absolute;
				top: -10rpx;
				right: -10rpx;
				width: 32rpx;
				height: 32rpx;
				background: #ff3b30;
				color: white;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 20rpx;
			}
		}
	}
	
	.submit-reply-btn {
		width: 100%;
		height: 70rpx;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 35rpx;
		font-size: 28rpx;
		
		&:disabled {
			background: #ccc;
		}
	}
}
</style>