<template>
	<view class="my-discussions-container">
		<!-- 顶部统计 -->
		<view class="stats-header">
			<view class="stats-card">
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-value">{{ totalPosts }}</text>
						<text class="stat-label">发布讨论</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ totalReplies }}</text>
						<text class="stat-label">回复数量</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ totalLikes }}</text>
						<text class="stat-label">获得点赞</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ resolvedQuestions }}</text>
						<text class="stat-label">已解决问题</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 筛选标签 -->
		<view class="filter-section">
			<scroll-view class="filter-scroll" scroll-x="true">
				<view class="filter-list">
					<view 
						class="filter-item" 
						:class="{ active: selectedType === index }"
						v-for="(type, index) in discussionTypes" 
						:key="index"
						@click="selectType(index)"
					>
						<text class="filter-text">{{ type.name }}</text>
						<text class="filter-count">({{ type.count }})</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 讨论列表 -->
		<view class="discussions-list" v-if="filteredDiscussions.length > 0">
			<view 
				class="discussion-item" 
				:class="{ 'is-question': discussion.isQuestion, 'is-resolved': discussion.isResolved }"
				v-for="(discussion, index) in filteredDiscussions" 
				:key="index"
				@click="viewDiscussion(discussion)"
			>
				<!-- 讨论头部 -->
				<view class="discussion-header">
					<view class="discussion-type">
						<text class="type-icon">{{ discussion.isQuestion ? '❓' : '💬' }}</text>
						<text class="type-text">{{ discussion.isQuestion ? '提问' : '讨论' }}</text>
					</view>
					<view class="discussion-status" v-if="discussion.isQuestion">
						<text class="status-text" :class="{ resolved: discussion.isResolved }">
							{{ discussion.isResolved ? '已解决' : '待解决' }}
						</text>
					</view>
				</view>

				<!-- 讨论标题 -->
				<text class="discussion-title">{{ discussion.title }}</text>

				<!-- 讨论预览 -->
				<text class="discussion-preview">{{ discussion.content }}</text>

				<!-- 讨论标签 -->
				<view class="discussion-tags" v-if="discussion.tags && discussion.tags.length > 0">
					<text 
						class="discussion-tag" 
						v-for="tag in discussion.tags" 
						:key="tag"
					>
						{{ tag }}
					</text>
				</view>

				<!-- 讨论统计 -->
				<view class="discussion-stats">
					<view class="stat-group">
						<text class="stat-icon">👍</text>
						<text class="stat-text">{{ discussion.likeCount }}</text>
					</view>
					<view class="stat-group">
						<text class="stat-icon">💬</text>
						<text class="stat-text">{{ discussion.replyCount }}</text>
					</view>
					<view class="stat-group">
						<text class="stat-icon">👀</text>
						<text class="stat-text">{{ discussion.viewCount }}</text>
					</view>
					<view class="stat-group">
						<text class="stat-icon">⏰</text>
						<text class="stat-text">{{ formatTime(discussion.createTime) }}</text>
					</view>
				</view>

				<!-- 最佳答案标识 -->
				<view class="best-answer-badge" v-if="discussion.hasBestAnswer">
					<text class="badge-icon">🏆</text>
					<text class="badge-text">有最佳答案</text>
				</view>

				<!-- 操作按钮 -->
				<view class="discussion-actions">
					<button class="action-btn secondary" @click.stop="editDiscussion(discussion)">
						<text class="btn-icon">✏️</text>
						<text class="btn-text">编辑</text>
					</button>
					<button class="action-btn secondary" @click.stop="shareDiscussion(discussion)">
						<text class="btn-icon">📤</text>
						<text class="btn-text">分享</text>
					</button>
					<button class="action-btn danger" @click.stop="deleteDiscussion(discussion)">
						<text class="btn-icon">🗑️</text>
						<text class="btn-text">删除</text>
					</button>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-icon">💬</text>
			<text class="empty-title">还没有发布讨论</text>
			<text class="empty-desc">分享你的想法，与同学们交流学习心得</text>
			<button class="post-btn" @click="goPost">发布讨论</button>
		</view>

		<!-- 浮动发布按钮 -->
		<view class="floating-post" @click="goPost" v-if="filteredDiscussions.length > 0">
			<text class="post-icon">✏️</text>
		</view>

		<!-- 删除确认弹窗 -->
		<uni-popup ref="deletePopup" type="dialog">
			<uni-popup-dialog 
				type="warn" 
				title="确认删除" 
				content="删除后无法恢复，确定要删除这个讨论吗？"
				:before-close="true"
				@confirm="confirmDelete"
				@close="closeDeleteDialog"
			></uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedType: 0,
				discussionTypes: [
					{ name: '全部', value: 'all', count: 15 },
					{ name: '我的发布', value: 'posts', count: 8 },
					{ name: '我的回复', value: 'replies', count: 7 },
					{ name: '提问', value: 'questions', count: 5 },
					{ name: '已解决', value: 'resolved', count: 3 }
				],
				myDiscussions: [
					{
						id: '1',
						type: 'post',
						title: 'Vue3 Composition API 的最佳实践分享',
						content: '最近在项目中大量使用了Vue3的Composition API，总结了一些实用的技巧和最佳实践...',
						isQuestion: false,
						isResolved: false,
						hasBestAnswer: false,
						likeCount: 24,
						replyCount: 12,
						viewCount: 156,
						createTime: new Date('2025-06-19 14:30:00'),
						tags: ['Vue3', 'Composition API', '最佳实践']
					},
					{
						id: '2',
						type: 'post',
						title: '求助：React Hook 在复杂组件中的性能优化问题',
						content: '在开发一个复杂的数据展示组件时，遇到了性能问题，主要是频繁的重渲染...',
						isQuestion: true,
						isResolved: true,
						hasBestAnswer: true,
						likeCount: 18,
						replyCount: 8,
						viewCount: 89,
						createTime: new Date('2025-06-18 10:15:00'),
						tags: ['React', 'Hook', '性能优化']
					},
					{
						id: '3',
						type: 'reply',
						title: '关于数据库索引优化的讨论',
						content: '我觉得在选择索引类型时，还需要考虑数据的更新频率。如果是频繁更新的字段...',
						isQuestion: false,
						isResolved: false,
						hasBestAnswer: false,
						likeCount: 12,
						replyCount: 0,
						viewCount: 45,
						createTime: new Date('2025-06-17 16:45:00'),
						tags: ['数据库', '索引', '优化']
					},
					{
						id: '4',
						type: 'post',
						title: 'Python机器学习库选择心得',
						content: '在机器学习项目中，选择合适的库很重要。我来分享一下常用库的对比...',
						isQuestion: false,
						isResolved: false,
						hasBestAnswer: false,
						likeCount: 35,
						replyCount: 15,
						viewCount: 203,
						createTime: new Date('2025-06-16 09:20:00'),
						tags: ['Python', '机器学习', '库选择']
					},
					{
						id: '5',
						type: 'post',
						title: '如何设计一个高并发的消息队列系统？',
						content: '最近在思考消息队列的设计，想了解一下高并发场景下的架构设计要点...',
						isQuestion: true,
						isResolved: false,
						hasBestAnswer: false,
						likeCount: 22,
						replyCount: 6,
						viewCount: 78,
						createTime: new Date('2025-06-15 14:00:00'),
						tags: ['架构设计', '消息队列', '高并发']
					}
				],
				discussionToDelete: null
			}
		},
		
		computed: {
			filteredDiscussions() {
				const type = this.discussionTypes[this.selectedType];
				switch (type.value) {
					case 'all':
						return this.myDiscussions;
					case 'posts':
						return this.myDiscussions.filter(d => d.type === 'post');
					case 'replies':
						return this.myDiscussions.filter(d => d.type === 'reply');
					case 'questions':
						return this.myDiscussions.filter(d => d.isQuestion);
					case 'resolved':
						return this.myDiscussions.filter(d => d.isQuestion && d.isResolved);
					default:
						return this.myDiscussions;
				}
			},
			
			totalPosts() {
				return this.myDiscussions.filter(d => d.type === 'post').length;
			},
			
			totalReplies() {
				return this.myDiscussions.filter(d => d.type === 'reply').length;
			},
			
			totalLikes() {
				return this.myDiscussions.reduce((sum, d) => sum + d.likeCount, 0);
			},
			
			resolvedQuestions() {
				return this.myDiscussions.filter(d => d.isQuestion && d.isResolved).length;
			}
		},
		
		methods: {
			selectType(index) {
				this.selectedType = index;
			},
			
			viewDiscussion(discussion) {
				uni.navigateTo({
					url: `/pages/discussion/detail?id=${discussion.id}`
				});
			},
			
			editDiscussion(discussion) {
				uni.navigateTo({
					url: `/pages/discussion/edit?id=${discussion.id}`
				});
			},
			
			shareDiscussion(discussion) {
				uni.share({
					provider: 'weixin',
					type: 0,
					title: discussion.title,
					summary: discussion.content.substring(0, 100),
					success: () => {
						uni.showToast({
							title: '分享成功',
							icon: 'success'
						});
					}
				});
			},
			
			deleteDiscussion(discussion) {
				this.discussionToDelete = discussion;
				this.$refs.deletePopup.open();
			},
			
			confirmDelete() {
				if (this.discussionToDelete) {
					const index = this.myDiscussions.findIndex(d => d.id === this.discussionToDelete.id);
					if (index > -1) {
						this.myDiscussions.splice(index, 1);
						this.updateCounts();
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
					}
				}
				this.closeDeleteDialog();
			},
			
			closeDeleteDialog() {
				this.$refs.deletePopup.close();
				this.discussionToDelete = null;
			},
			
			goPost() {
				uni.navigateTo({
					url: '/pages/discussion/post'
				});
			},
			
			updateCounts() {
				// 更新各类型的数量
				this.discussionTypes[0].count = this.myDiscussions.length;
				this.discussionTypes[1].count = this.myDiscussions.filter(d => d.type === 'post').length;
				this.discussionTypes[2].count = this.myDiscussions.filter(d => d.type === 'reply').length;
				this.discussionTypes[3].count = this.myDiscussions.filter(d => d.isQuestion).length;
				this.discussionTypes[4].count = this.myDiscussions.filter(d => d.isQuestion && d.isResolved).length;
			},
			
			formatTime(date) {
				const now = new Date();
				const diff = now - date;
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (days === 0) {
					return '今天';
				} else if (days === 1) {
					return '昨天';
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return date.toLocaleDateString('zh-CN', {
						month: '2-digit',
						day: '2-digit'
					});
				}
			}
		},
		
		onLoad() {
			this.updateCounts();
		},
		
		onPullDownRefresh() {
			// 下拉刷新
			setTimeout(() => {
				uni.stopPullDownRefresh();
			}, 1000);
		}
	}
</script>

<style scoped>
	.my-discussions-container {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 160rpx;
	}

	/* 统计头部 */
	.stats-header {
		padding: 32rpx;
	}

	.stats-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32rpx;
	}

	.stat-item {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 48rpx;
		font-weight: 700;
		color: #007aff;
		margin-bottom: 8rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: #666666;
	}

	/* 筛选区域 */
	.filter-section {
		background-color: #ffffff;
		padding: 20rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}

	.filter-scroll {
		white-space: nowrap;
	}

	.filter-list {
		display: flex;
		gap: 20rpx;
	}

	.filter-item {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 12rpx 20rpx;
		background-color: #f0f0f0;
		border-radius: 24rpx;
		transition: all 0.3s ease;
	}

	.filter-item.active {
		background-color: #007aff;
		color: #ffffff;
	}

	.filter-text {
		font-size: 26rpx;
		color: inherit;
	}

	.filter-count {
		font-size: 22rpx;
		opacity: 0.8;
	}

	/* 讨论列表 */
	.discussions-list {
		padding: 16rpx 32rpx;
	}

	.discussion-item {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		position: relative;
	}

	.discussion-item.is-question {
		border-left: 6rpx solid #ff9500;
	}

	.discussion-item.is-resolved {
		border-left-color: #34c759;
	}

	.discussion-item:active {
		transform: scale(0.98);
	}

	.discussion-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.discussion-type {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.type-icon {
		font-size: 24rpx;
	}

	.type-text {
		font-size: 24rpx;
		color: #666666;
		padding: 4rpx 12rpx;
		background-color: #f0f0f0;
		border-radius: 12rpx;
	}

	.discussion-status {
		font-size: 22rpx;
	}

	.status-text {
		padding: 6rpx 12rpx;
		border-radius: 12rpx;
		color: #ffffff;
		background-color: #ff9500;
	}

	.status-text.resolved {
		background-color: #34c759;
	}

	.discussion-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
		display: block;
		margin-bottom: 12rpx;
		line-height: 1.4;
	}

	.discussion-preview {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.5;
		display: block;
		margin-bottom: 16rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.discussion-tags {
		display: flex;
		gap: 12rpx;
		margin-bottom: 20rpx;
		flex-wrap: wrap;
	}

	.discussion-tag {
		padding: 6rpx 12rpx;
		background-color: #f0f0f0;
		border-radius: 12rpx;
		font-size: 22rpx;
		color: #666666;
	}

	.discussion-stats {
		display: flex;
		gap: 32rpx;
		margin-bottom: 24rpx;
		padding: 16rpx 0;
		border-top: 1rpx solid #f0f0f0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.stat-group {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.stat-icon {
		font-size: 20rpx;
	}

	.stat-text {
		font-size: 24rpx;
		color: #666666;
	}

	.best-answer-badge {
		position: absolute;
		top: 24rpx;
		right: 24rpx;
		display: flex;
		align-items: center;
		gap: 6rpx;
		padding: 6rpx 12rpx;
		background: linear-gradient(135deg, #ff9500, #ff6b35);
		border-radius: 12rpx;
		color: #ffffff;
	}

	.badge-icon {
		font-size: 18rpx;
	}

	.badge-text {
		font-size: 20rpx;
		font-weight: 500;
	}

	.discussion-actions {
		display: flex;
		gap: 16rpx;
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding: 16rpx;
		border-radius: 12rpx;
		font-size: 24rpx;
		border: none;
	}

	.action-btn.secondary {
		background-color: #f0f0f0;
		color: #666666;
	}

	.action-btn.danger {
		background-color: #ff3b30;
		color: #ffffff;
	}

	.btn-icon {
		font-size: 20rpx;
	}

	.btn-text {
		font-size: 24rpx;
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 60rpx;
		text-align: center;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
		opacity: 0.6;
	}

	.empty-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}

	.empty-desc {
		font-size: 28rpx;
		color: #666666;
		margin-bottom: 48rpx;
	}

	.post-btn {
		padding: 20rpx 40rpx;
		background-color: #007aff;
		color: #ffffff;
		border-radius: 24rpx;
		font-size: 28rpx;
		border: none;
	}

	/* 浮动发布按钮 */
	.floating-post {
		position: fixed;
		bottom: 40rpx;
		right: 40rpx;
		width: 120rpx;
		height: 120rpx;
		background-color: #007aff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);
		z-index: 999;
	}

	.post-icon {
		font-size: 40rpx;
		color: #ffffff;
	}
</style>