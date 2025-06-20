<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-section">
			<view class="search-bar">
				<image src="/static/icons/search.png" class="search-icon"></image>
				<input v-model="searchKeyword" class="search-input" placeholder="搜索讨论内容..." @confirm="handleSearch" />
			</view>
		</view>

		<!-- 分类导航 -->
		<view class="category-section">
			<scroll-view class="category-scroll" scroll-x="true">
				<view class="category-list">
					<view 
						class="category-item" 
						:class="{ active: currentCategory === item.value }"
						v-for="(item, index) in categories" 
						:key="index"
						@click="selectCategory(item.value)"
					>
						{{ item.name }}
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 排序和筛选 -->
		<view class="filter-section">
			<view class="filter-left">
				<view 
					class="sort-item" 
					:class="{ active: currentSort === item.value }"
					v-for="(item, index) in sortOptions" 
					:key="index"
					@click="selectSort(item.value)"
				>
					{{ item.name }}
				</view>
			</view>
			<view class="filter-right">
				<view class="filter-btn" @click="showFilterModal">
					<image src="/static/icons/filter.png" class="filter-icon"></image>
					<text>筛选</text>
				</view>
			</view>
		</view>

		<!-- 讨论列表 -->
		<view class="discussion-section">
			<view class="discussion-list" v-if="discussions.length > 0">
				<view class="discussion-item" v-for="(item, index) in discussions" :key="index" @click="viewDiscussion(item)">
					<!-- 讨论头部 -->
					<view class="discussion-header">
						<view class="author-info">
							<image :src="item.authorAvatar || '/static/images/default-avatar.png'" class="author-avatar"></image>
							<view class="author-details">
								<text class="author-name">{{ item.authorName }}</text>
								<text class="post-time">{{ formatTime(item.createTime) }}</text>
							</view>
						</view>
						<view class="post-actions">
							<view class="action-btn" @click.stop="toggleLike(item, index)">
								<image :src="item.isLiked ? '/static/icons/heart-filled.png' : '/static/icons/heart.png'" class="action-icon"></image>
							</view>
							<view class="action-btn" @click.stop="showMoreActions(item)">
								<image src="/static/icons/more.png" class="action-icon"></image>
							</view>
						</view>
					</view>

					<!-- 讨论内容 -->
					<view class="discussion-content">
						<view class="content-header" v-if="item.title">
							<text class="discussion-title">{{ item.title }}</text>
							<view class="content-tags">
								<view class="tag question-tag" v-if="item.isQuestion">问题</view>
								<view class="tag solved-tag" v-if="item.isQuestion && item.isResolved">已解决</view>
								<view class="tag category-tag">{{ getCategoryName(item.category) }}</view>
							</view>
						</view>
						
						<view class="content-text">
							<text class="content-main">{{ item.content }}</text>
						</view>

						<!-- 图片 -->
						<view class="content-images" v-if="item.images && item.images.length > 0">
							<image 
								v-for="(img, imgIndex) in item.images" 
								:key="imgIndex"
								:src="img" 
								class="content-image"
								mode="aspectFill"
								@click.stop="previewImage(img, item.images)"
							></image>
						</view>

						<!-- 话题标签 -->
						<view class="topic-tags" v-if="item.tags && item.tags.length > 0">
							<text class="topic-tag" v-for="(tag, tagIndex) in item.tags" :key="tagIndex">#{{ tag }}</text>
						</view>
					</view>

					<!-- 讨论统计 -->
					<view class="discussion-stats">
						<view class="stat-item">
							<image src="/static/icons/like-gray.png" class="stat-icon"></image>
							<text class="stat-text">{{ item.likeCount }}</text>
						</view>
						<view class="stat-item">
							<image src="/static/icons/comment.png" class="stat-icon"></image>
							<text class="stat-text">{{ item.replyCount }}回复</text>
						</view>
						<view class="stat-item">
							<image src="/static/icons/view.png" class="stat-icon"></image>
							<text class="stat-text">{{ item.viewCount }}浏览</text>
						</view>
					</view>

					<!-- 最新回复预览 -->
					<view class="latest-reply" v-if="item.latestReply">
						<view class="reply-divider"></view>
						<view class="reply-content">
							<text class="reply-author">{{ item.latestReply.authorName }}：</text>
							<text class="reply-text">{{ item.latestReply.content }}</text>
						</view>
						<text class="reply-time">{{ formatTime(item.latestReply.createTime) }}</text>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-else>
				<image src="/static/images/empty-discussions.png" class="empty-icon"></image>
				<text class="empty-text">暂无讨论</text>
				<text class="empty-tip">快来发起第一个讨论吧！</text>
			</view>
		</view>

		<!-- 加载更多 -->
		<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore"></uni-load-more>

		<!-- 悬浮按钮 -->
		<view class="float-btn" @click="createPost">
			<image src="/static/icons/edit.png" class="float-icon"></image>
		</view>

		<!-- 筛选弹窗 -->
		<uni-popup ref="filterPopup" type="bottom">
			<view class="filter-modal">
				<view class="modal-header">
					<text class="modal-title">筛选条件</text>
					<text class="modal-close" @click="hideFilterModal">完成</text>
				</view>
				
				<view class="filter-content">
					<view class="filter-group">
						<text class="filter-label">讨论类型</text>
						<view class="filter-options">
							<text 
								class="filter-option" 
								:class="{ active: selectedTypes.includes(item.value) }"
								v-for="(item, index) in typeOptions" 
								:key="index"
								@click="toggleType(item.value)"
							>
								{{ item.name }}
							</text>
						</view>
					</view>
					
					<view class="filter-group">
						<text class="filter-label">状态</text>
						<view class="filter-options">
							<text 
								class="filter-option" 
								:class="{ active: selectedStatus.includes(item.value) }"
								v-for="(item, index) in statusOptions" 
								:key="index"
								@click="toggleStatus(item.value)"
							>
								{{ item.name }}
							</text>
						</view>
					</view>
				</view>
				
				<view class="filter-actions">
					<button class="reset-btn" @click="resetFilter">重置</button>
					<button class="apply-btn" @click="applyFilter">应用筛选</button>
				</view>
			</view>
		</uni-popup>

		<!-- 更多操作弹窗 -->
		<uni-popup ref="moreActionsPopup" type="bottom">
			<view class="more-actions-modal">
				<view class="action-item" @click="reportPost">
					<image src="/static/icons/report.png" class="action-icon"></image>
					<text class="action-text">举报</text>
				</view>
				<view class="action-item" @click="sharePost">
					<image src="/static/icons/share.png" class="action-icon"></image>
					<text class="action-text">分享</text>
				</view>
				<view class="action-item cancel-action" @click="hideMoreActions">
					<text class="action-text">取消</text>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchKeyword: '',
				currentCategory: 'all',
				currentSort: 'time',
				categories: [
					{ name: '全部', value: 'all' },
					{ name: '学习讨论', value: 'study' },
					{ name: '技术问答', value: 'tech' },
					{ name: '课程相关', value: 'course' },
					{ name: '项目分享', value: 'project' },
					{ name: '生活交流', value: 'life' }
				],
				sortOptions: [
					{ name: '最新', value: 'time' },
					{ name: '热门', value: 'hot' },
					{ name: '精华', value: 'featured' }
				],
				discussions: [],
				loadMoreStatus: 'more',
				currentPage: 1,
				pageSize: 10,
				selectedTypes: [],
				selectedStatus: [],
				typeOptions: [
					{ name: '讨论', value: 'discussion' },
					{ name: '提问', value: 'question' },
					{ name: '分享', value: 'share' }
				],
				statusOptions: [
					{ name: '未解决', value: 'unresolved' },
					{ name: '已解决', value: 'resolved' }
				],
				currentActionPost: null
			}
		},
		onLoad() {
			this.loadDiscussions()
		},
		onPullDownRefresh() {
			this.refreshData()
		},
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			// 加载讨论列表
			async loadDiscussions(reset = false) {
				if (reset) {
					this.currentPage = 1
					this.loadMoreStatus = 'more'
				}

				try {
					this.loadMoreStatus = 'loading'
					
					const params = {
						page: this.currentPage,
						pageSize: this.pageSize,
						keyword: this.searchKeyword,
						category: this.currentCategory,
						sort: this.currentSort,
						types: this.selectedTypes,
						status: this.selectedStatus
					}
					
					const result = await this.callDiscussionListApi(params)
					
					if (result.success) {
						if (reset) {
							this.discussions = result.data
						} else {
							this.discussions.push(...result.data)
						}
						
						this.loadMoreStatus = result.data.length < this.pageSize ? 'noMore' : 'more'
						this.currentPage++
					} else {
						this.loadMoreStatus = 'more'
						uni.showToast({
							title: result.message || '加载失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载讨论失败:', error)
					this.loadMoreStatus = 'more'
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					})
				}
			},

			// 调用讨论列表API
			async callDiscussionListApi(params) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						const mockData = [
							{
								id: 1,
								title: '关于数据库设计的几个问题',
								content: '最近在学习数据库设计，遇到了一些问题想请教大家。在设计用户表的时候，应该如何处理用户的多个角色问题？',
								type: 'question',
								isQuestion: true,
								isResolved: false,
								category: 'tech',
								authorName: '张三',
								authorAvatar: '',
								createTime: new Date('2025-06-19'),
								likeCount: 15,
								replyCount: 8,
								viewCount: 156,
								tags: ['数据库', '设计模式'],
								images: [],
								isLiked: false,
								latestReply: {
									authorName: '李老师',
									content: '可以考虑使用用户-角色中间表来处理多对多关系',
									createTime: new Date('2025-06-19')
								}
							},
							{
								id: 2,
								title: '分享一个Vue.js学习心得',
								content: '经过一段时间的Vue.js学习，想和大家分享一些心得体会。Vue的响应式原理真的很有趣！',
								type: 'share',
								isQuestion: false,
								isResolved: false,
								category: 'study',
								authorName: '李四',
								authorAvatar: '',
								createTime: new Date('2025-06-18'),
								likeCount: 32,
								replyCount: 12,
								viewCount: 234,
								tags: ['Vue.js', '前端'],
								images: ['/static/images/demo1.jpg'],
								isLiked: true,
								latestReply: {
									authorName: '王五',
									content: '很有用的分享，谢谢！',
									createTime: new Date('2025-06-18')
								}
							}
						]
						
						resolve({
							success: true,
							data: mockData
						})
					}, 500)
				})
			},

			// 刷新数据
			async refreshData() {
				await this.loadDiscussions(true)
				uni.stopPullDownRefresh()
			},

			// 加载更多
			loadMore() {
				if (this.loadMoreStatus === 'more') {
					this.loadDiscussions()
				}
			},

			// 搜索
			handleSearch() {
				this.loadDiscussions(true)
			},

			// 选择分类
			selectCategory(category) {
				this.currentCategory = category
				this.loadDiscussions(true)
			},

			// 选择排序
			selectSort(sort) {
				this.currentSort = sort
				this.loadDiscussions(true)
			},

			// 显示筛选弹窗
			showFilterModal() {
				this.$refs.filterPopup.open()
			},

			// 隐藏筛选弹窗
			hideFilterModal() {
				this.$refs.filterPopup.close()
			},

			// 切换类型筛选
			toggleType(type) {
				const index = this.selectedTypes.indexOf(type)
				if (index > -1) {
					this.selectedTypes.splice(index, 1)
				} else {
					this.selectedTypes.push(type)
				}
			},

			// 切换状态筛选
			toggleStatus(status) {
				const index = this.selectedStatus.indexOf(status)
				if (index > -1) {
					this.selectedStatus.splice(index, 1)
				} else {
					this.selectedStatus.push(status)
				}
			},

			// 重置筛选
			resetFilter() {
				this.selectedTypes = []
				this.selectedStatus = []
			},

			// 应用筛选
			applyFilter() {
				this.hideFilterModal()
				this.loadDiscussions(true)
			},

			// 查看讨论详情
			viewDiscussion(discussion) {
				uni.navigateTo({
					url: `/pages/discussion/detail?id=${discussion.id}`
				})
			},

			// 切换点赞状态
			async toggleLike(discussion, index) {
				try {
					const result = await this.callToggleLikeApi(discussion.id)
					if (result.success) {
						this.discussions[index].isLiked = !this.discussions[index].isLiked
						this.discussions[index].likeCount += this.discussions[index].isLiked ? 1 : -1
					}
				} catch (error) {
					console.error('点赞操作失败:', error)
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			},

			// 调用点赞切换API
			async callToggleLikeApi(discussionId) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({ success: true })
					}, 300)
				})
			},

			// 显示更多操作
			showMoreActions(post) {
				this.currentActionPost = post
				this.$refs.moreActionsPopup.open()
			},

			// 隐藏更多操作
			hideMoreActions() {
				this.$refs.moreActionsPopup.close()
				this.currentActionPost = null
			},

			// 举报帖子
			reportPost() {
				this.hideMoreActions()
				uni.showModal({
					title: '举报',
					content: '确定要举报这条讨论吗？',
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: '举报成功',
								icon: 'success'
							})
						}
					}
				})
			},

			// 分享帖子
			sharePost() {
				this.hideMoreActions()
				uni.share({
					title: this.currentActionPost.title,
					path: `/pages/discussion/detail?id=${this.currentActionPost.id}`
				})
			},

			// 预览图片
			previewImage(current, urls) {
				uni.previewImage({
					current: current,
					urls: urls
				})
			},

			// 创建新帖子
			createPost() {
				uni.navigateTo({
					url: '/pages/discussion/post'
				})
			},

			// 获取分类名称
			getCategoryName(categoryValue) {
				const category = this.categories.find(item => item.value === categoryValue)
				return category ? category.name : '其他'
			},

			// 格式化时间
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
	.container {
		padding-bottom: 120rpx;
	}

	// 搜索栏
	.search-section {
		background: white;
		padding: 20rpx;

		.search-bar {
			display: flex;
			align-items: center;
			background: #f5f5f5;
			border-radius: 50rpx;
			padding: 0 30rpx;
			height: 70rpx;

			.search-icon {
				width: 32rpx;
				height: 32rpx;
				margin-right: 20rpx;
			}

			.search-input {
				flex: 1;
				font-size: 28rpx;
				color: #333;
			}
		}
	}

	// 分类导航
	.category-section {
		background: white;
		border-bottom: 1rpx solid #f0f0f0;

		.category-scroll {
			white-space: nowrap;

			.category-list {
				display: inline-flex;
				padding: 0 20rpx;

				.category-item {
					padding: 20rpx 30rpx;
					font-size: 28rpx;
					color: #666;
					white-space: nowrap;

					&.active {
						color: #007aff;
						font-weight: bold;
						position: relative;

						&::after {
							content: '';
							position: absolute;
							bottom: 0;
							left: 50%;
							transform: translateX(-50%);
							width: 40rpx;
							height: 4rpx;
							background: #007aff;
							border-radius: 2rpx;
						}
					}
				}
			}
		}
	}

	// 筛选区域
	.filter-section {
		background: white;
		padding: 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f0f0f0;

		.filter-left {
			display: flex;

			.sort-item {
				margin-right: 40rpx;
				font-size: 24rpx;
				color: #666;
				padding: 10rpx 0;

				&.active {
					color: #007aff;
					font-weight: bold;
				}
			}
		}

		.filter-right {
			.filter-btn {
				display: flex;
				align-items: center;
				font-size: 24rpx;
				color: #666;
				padding: 10rpx;

				.filter-icon {
					width: 24rpx;
					height: 24rpx;
					margin-right: 8rpx;
				}
			}
		}
	}

	// 讨论列表
	.discussion-section {
		.discussion-list {
			.discussion-item {
				background: white;
				margin: 20rpx;
				border-radius: 12rpx;
				padding: 30rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

				.discussion-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 20rpx;

					.author-info {
						display: flex;
						align-items: center;

						.author-avatar {
							width: 60rpx;
							height: 60rpx;
							border-radius: 50%;
							margin-right: 20rpx;
						}

						.author-details {
							.author-name {
								display: block;
								font-size: 28rpx;
								color: #333;
								font-weight: 500;
								margin-bottom: 8rpx;
							}

							.post-time {
								font-size: 22rpx;
								color: #999;
							}
						}
					}

					.post-actions {
						display: flex;
						align-items: center;

						.action-btn {
							padding: 10rpx;
							margin-left: 10rpx;

							.action-icon {
								width: 32rpx;
								height: 32rpx;
							}
						}
					}
				}

				.discussion-content {
					margin-bottom: 20rpx;

					.content-header {
						display: flex;
						justify-content: space-between;
						align-items: flex-start;
						margin-bottom: 15rpx;

						.discussion-title {
							flex: 1;
							font-size: 32rpx;
							font-weight: bold;
							color: #333;
							line-height: 1.4;
						}

						.content-tags {
							display: flex;
							flex-wrap: wrap;
							gap: 8rpx;
							margin-left: 20rpx;

							.tag {
								padding: 4rpx 12rpx;
								border-radius: 8rpx;
								font-size: 20rpx;
								color: white;

								&.question-tag {
									background: #ff9500;
								}

								&.solved-tag {
									background: #5ac725;
								}

								&.category-tag {
									background: #007aff;
								}
							}
						}
					}

					.content-text {
						.content-main {
							font-size: 28rpx;
							color: #333;
							line-height: 1.6;
						}
					}

					.content-images {
						display: flex;
						flex-wrap: wrap;
						gap: 16rpx;
						margin: 20rpx 0;

						.content-image {
							width: 200rpx;
							height: 200rpx;
							border-radius: 8rpx;
						}
					}

					.topic-tags {
						margin-top: 15rpx;

						.topic-tag {
							display: inline-block;
							color: #007aff;
							font-size: 24rpx;
							margin-right: 20rpx;
						}
					}
				}

				.discussion-stats {
					display: flex;
					align-items: center;
					margin-bottom: 15rpx;

					.stat-item {
						display: flex;
						align-items: center;
						margin-right: 40rpx;

						.stat-icon {
							width: 24rpx;
							height: 24rpx;
							margin-right: 8rpx;
						}

						.stat-text {
							font-size: 22rpx;
							color: #666;
						}
					}
				}

				.latest-reply {
					.reply-divider {
						height: 1rpx;
						background: #f0f0f0;
						margin: 15rpx 0;
					}

					.reply-content {
						margin-bottom: 8rpx;

						.reply-author {
							font-size: 24rpx;
							color: #007aff;
							font-weight: 500;
						}

						.reply-text {
							font-size: 24rpx;
							color: #666;
						}
					}

					.reply-time {
						font-size: 20rpx;
						color: #999;
					}
				}
			}
		}

		.empty-state {
			text-align: center;
			padding: 100rpx 40rpx;

			.empty-icon {
				width: 200rpx;
				height: 200rpx;
				margin-bottom: 40rpx;
			}

			.empty-text {
				display: block;
				font-size: 32rpx;
				color: #666;
				margin-bottom: 20rpx;
			}

			.empty-tip {
				display: block;
				font-size: 26rpx;
				color: #999;
			}
		}
	}

	// 悬浮按钮
	.float-btn {
		position: fixed;
		right: 40rpx;
		bottom: 160rpx;
		width: 100rpx;
		height: 100rpx;
		background: #007aff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
		z-index: 999;

		.float-icon {
			width: 48rpx;
			height: 48rpx;
		}
	}

	// 筛选弹窗
	.filter-modal {
		background: white;
		border-radius: 20rpx 20rpx 0 0;
		padding: 40rpx;
		max-height: 80vh;

		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 40rpx;
			padding-bottom: 20rpx;
			border-bottom: 1rpx solid #f0f0f0;

			.modal-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}

			.modal-close {
				font-size: 28rpx;
				color: #007aff;
			}
		}

		.filter-content {
			.filter-group {
				margin-bottom: 40rpx;

				.filter-label {
					display: block;
					font-size: 28rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 20rpx;
				}

				.filter-options {
					display: flex;
					flex-wrap: wrap;
					gap: 20rpx;

					.filter-option {
						padding: 16rpx 32rpx;
						border: 2rpx solid #e5e5e5;
						border-radius: 24rpx;
						font-size: 26rpx;
						color: #666;

						&.active {
							border-color: #007aff;
							color: #007aff;
							background: #f0f8ff;
						}
					}
				}
			}
		}

		.filter-actions {
			display: flex;
			gap: 20rpx;
			padding-top: 20rpx;
			border-top: 1rpx solid #f0f0f0;

			.reset-btn {
				flex: 1;
				height: 80rpx;
				background: #f5f5f5;
				color: #666;
				border: none;
				border-radius: 12rpx;
				font-size: 28rpx;
			}

			.apply-btn {
				flex: 2;
				height: 80rpx;
				background: #007aff;
				color: white;
				border: none;
				border-radius: 12rpx;
				font-size: 28rpx;
			}
		}
	}

	// 更多操作弹窗
	.more-actions-modal {
		background: white;
		border-radius: 20rpx 20rpx 0 0;
		padding: 20rpx 0;

		.action-item {
			display: flex;
			align-items: center;
			padding: 30rpx 40rpx;
			border-bottom: 1rpx solid #f0f0f0;

			&:last-child {
				border-bottom: none;
			}

			&.cancel-action {
				justify-content: center;
				margin-top: 20rpx;
				border-top: 8rpx solid #f0f0f0;

				.action-text {
					color: #999;
				}
			}

			.action-icon {
				width: 40rpx;
				height: 40rpx;
				margin-right: 20rpx;
			}

			.action-text {
				font-size: 28rpx;
				color: #333;
			}
		}
	}
</style>