<template>
	<view class="container">
		<!-- 顶部轮播图 -->
		<view class="banner-section">
			<swiper class="banner-swiper" indicator-dots="true" autoplay="true" interval="3000" duration="500">
				<swiper-item v-for="(item, index) in banners" :key="index">
					<image :src="item.image" class="banner-image" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>


		<!-- 最新公告 -->
		<view class="notice-section">
			<view class="section-header">
				<text class="section-title">最新公告</text>
				<text class="section-more" @click="navigateTo('/pages/notification/notification')">更多</text>
			</view>
			<view class="notice-list">
				<view class="notice-item" v-for="(item, index) in notices" :key="index" @click="viewNotice(item)">
					<view class="notice-tag" :class="'tag-' + item.type">{{ item.typeName }}</view>
					<text class="notice-title">{{ item.title }}</text>
					<text class="notice-time">{{ formatTime(item.createTime) }}</text>
				</view>
			</view>
		</view>

		<!-- 热门资源 -->
		<view class="resource-section">
			<view class="section-header">
				<text class="section-title">热门资源</text>
				<text class="section-more" @click="navigateTo('/pages/resources/resources')">更多</text>
			</view>
			<view class="resource-list">
				<view class="resource-item" v-for="(item, index) in hotResources" :key="index" @click="viewResource(item)">
					<text class="resource-icon-emoji">{{ getFileIcon(item.fileType) }}</text>
					<view class="resource-info">
						<text class="resource-title">{{ item.title }}</text>
						<view class="resource-meta">
							<text class="resource-author">{{ item.uploaderName }}</text>
							<text class="resource-download">{{ item.downloadCount }}次下载</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 热门活动 -->
		<view class="activity-section">
			<view class="section-header">
				<text class="section-title">热门活动</text>
				<text class="section-more" @click="navigateTo('/pages/activity/activity')">更多</text>
			</view>
			<view class="activity-list">
				<view class="activity-item" v-for="(item, index) in hotActivities" :key="index" @click="viewActivity(item)">
					<image class="activity-image" :src="item.image || require('@/static/images/default-activity.jpg')" mode="aspectFill"></image>
					<view class="activity-info">
						<text class="activity-title">{{ item.title }}</text>
						<view class="activity-meta">
							<text class="activity-time">{{ formatActivityTime(item.startTime) }}</text>
							<text class="activity-location">{{ item.location }}</text>
						</view>
						<view class="activity-stats">
							<text class="activity-participants">{{ item.participantCount }}人参与</text>
							<view class="activity-status" :class="'status-' + item.status">{{ getActivityStatusText(item.status) }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 热门讨论 -->
		<view class="discussion-section">
			<view class="section-header">
				<text class="section-title">热门讨论</text>
				<text class="section-more" @click="navigateTo('/pages/discussion/discussion')">更多</text>
			</view>
			<view class="discussion-list">
				<view class="discussion-item" v-for="(item, index) in hotDiscussions" :key="index" @click="viewDiscussion(item)">
					<view class="discussion-header">
						<text class="discussion-title">{{ item.title }}</text>
						<view class="discussion-tag" v-if="item.isQuestion">问题</view>
					</view>
					<view class="discussion-meta">
						<text class="discussion-author">{{ item.authorName }}</text>
						<text class="discussion-reply">{{ item.replyCount }}回复</text>
						<text class="discussion-time">{{ formatTime(item.createTime) }}</text>
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
				banners: [
					{
						image: require('@/static/logo.png')
					},
					{
						image: require('@/static/logo.png')
					},
					{
						image: require('@/static/logo.png')
					}
				],
				notices: [],
				hotResources: [],
				hotActivities: [],
				hotDiscussions: []
			}
		},
		onLoad() {
			this.loadData()
		},
		onPullDownRefresh() {
			this.loadData()
			setTimeout(() => {
				uni.stopPullDownRefresh()
			}, 1000)
		},
		methods: {
			// 加载页面数据
			async loadData() {
				try {
					await Promise.all([
						this.loadNotices(),
						this.loadHotResources(),
						this.loadHotActivities(),
						this.loadHotDiscussions()
					])
				} catch (error) {
					console.error('加载数据失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},

			// 加载最新公告
			async loadNotices() {
				// 模拟数据，实际应调用云函数
				this.notices = [
					{
						id: 1,
						title: '关于期末考试安排的通知',
						type: 'important',
						typeName: '重要',
						createTime: new Date('2025-06-18')
					},
					{
						id: 2,
						title: '系统维护通知',
						type: 'system',
						typeName: '系统',
						createTime: new Date('2025-06-17')
					},
					{
						id: 3,
						title: '学术讲座：人工智能前沿技术',
						type: 'activity',
						typeName: '活动',
						createTime: new Date('2025-06-16')
					}
				]
			},

			// 加载热门资源
			async loadHotResources() {
				// 模拟数据
				this.hotResources = [
					{
						id: 1,
						title: '数据结构与算法课件',
						fileType: 'pdf',
						uploaderName: '张教授',
						downloadCount: 156
					},
					{
						id: 2,
						title: '机器学习实验代码',
						fileType: 'zip',
						uploaderName: '李同学',
						downloadCount: 89
					},
					{
						id: 3,
						title: '软件工程复习资料',
						fileType: 'doc',
						uploaderName: '王老师',
						downloadCount: 234
					}
				]
			},

			// 加载热门活动
			async loadHotActivities() {
				// 模拟数据
				this.hotActivities = [
					{
						id: 1,
						title: '人工智能前沿技术讲座',
						image: require('@/static/logo.png'),
						startTime: new Date('2025-06-25 14:00:00'),
						location: '学术报告厅',
						participantCount: 156,
						status: 'upcoming'
					},
					{
						id: 2,
						title: '编程马拉松大赛',
						image: require('@/static/logo.png'),
						startTime: new Date('2025-06-28 09:00:00'),
						location: '计算机学院',
						participantCount: 89,
						status: 'registration'
					},
					{
						id: 3,
						title: '软件工程经验分享会',
						image: require('@/static/logo.png'),
						startTime: new Date('2025-06-22 16:30:00'),
						location: '多媒体教室',
						participantCount: 67,
						status: 'ongoing'
					}
				]
			},

			// 加载热门讨论
			async loadHotDiscussions() {
				// 模拟数据
				this.hotDiscussions = [
					{
						id: 1,
						title: '关于数据库设计的几个问题',
						isQuestion: true,
						authorName: '张三',
						replyCount: 12,
						createTime: new Date('2025-06-19')
					},
					{
						id: 2,
						title: '分享一个Vue.js学习心得',
						isQuestion: false,
						authorName: '李四',
						replyCount: 8,
						createTime: new Date('2025-06-18')
					},
					{
						id: 3,
						title: '求助：如何优化SQL查询性能？',
						isQuestion: true,
						authorName: '王五',
						replyCount: 15,
						createTime: new Date('2025-06-17')
					}
				]
			},

			// 页面导航
			navigateTo(url) {
				// 判断是否为tabBar页面
				const tabBarPages = [
					'/pages/index/index',
					'/pages/resources/resources', 
					'/pages/discussion/discussion',
					'/pages/activity/activity',
					'/pages/profile/profile'
				]
				
				if (tabBarPages.includes(url)) {
					uni.switchTab({
						url: url
					})
				} else {
					uni.navigateTo({
						url: url
					})
				}
			},

			// 查看公告详情
			viewNotice(notice) {
				uni.navigateTo({
					url: `/pages/notification/detail?id=${notice.id}`
				})
			},

			// 查看资源详情
			viewResource(resource) {
				uni.navigateTo({
					url: `/pages/resources/detail?id=${resource.id}`
				})
			},

			// 查看活动详情
			viewActivity(activity) {
				uni.navigateTo({
					url: `/pages/activity/detail?id=${activity.id}`
				})
			},

			// 查看讨论详情
			viewDiscussion(discussion) {
				uni.navigateTo({
					url: `/pages/discussion/detail?id=${discussion.id}`
				})
			},

			// 获取文件图标
			getFileIcon(fileType) {
				const iconMap = {
					'pdf': '📄',
					'doc': '📝',
					'docx': '📝',
					'ppt': '📊',
					'pptx': '📊',
					'zip': '📦',
					'rar': '📦',
					'jpg': '🖼️',
					'png': '🖼️',
					'gif': '🖼️'
				}
				return iconMap[fileType] || '📁'
			},

			// 格式化活动时间
			formatActivityTime(time) {
				const now = new Date()
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
				const activityDate = new Date(time.getFullYear(), time.getMonth(), time.getDate())
				const diff = activityDate - today
				const day = 24 * 60 * 60 * 1000

				if (diff === 0) {
					return `今天 ${time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
				} else if (diff === day) {
					return `明天 ${time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
				} else if (diff > 0 && diff < 7 * day) {
					const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
					return `${weekdays[time.getDay()]} ${time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
				} else {
					return time.toLocaleDateString('zh-CN') + ' ' + time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
				}
			},

			// 获取活动状态文本
			getActivityStatusText(status) {
				const statusMap = {
					'upcoming': '即将开始',
					'registration': '报名中',
					'ongoing': '进行中',
					'ended': '已结束'
				}
				return statusMap[status] || '未知状态'
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
		padding-bottom: 20rpx;
	}

	// 轮播图样式
	.banner-section {
		.banner-swiper {
			height: 300rpx;
			
			.banner-image {
				width: 100%;
				height: 100%;
			}
		}
	}


	// 通用section样式
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 30rpx 20rpx;

		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}

		.section-more {
			font-size: 24rpx;
			color: #007aff;
		}
	}

	// 公告样式
	.notice-section {
		margin: 20rpx;
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;

		.notice-list {
			.notice-item {
				display: flex;
				align-items: center;
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.notice-tag {
					padding: 4rpx 12rpx;
					border-radius: 8rpx;
					font-size: 20rpx;
					color: white;
					margin-right: 20rpx;

					&.tag-important {
						background: #ff3b30;
					}

					&.tag-system {
						background: #007aff;
					}

					&.tag-activity {
						background: #5ac725;
					}
				}

				.notice-title {
					flex: 1;
					font-size: 28rpx;
					color: #333;
				}

				.notice-time {
					font-size: 22rpx;
					color: #999;
				}
			}
		}
	}

	// 资源样式
	.resource-section {
		margin: 20rpx;
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;

		.resource-list {
			.resource-item {
				display: flex;
				align-items: center;
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.resource-icon-emoji {
					font-size: 40rpx;
					margin-right: 20rpx;
					line-height: 1;
				}

				.resource-info {
					flex: 1;

					.resource-title {
						display: block;
						font-size: 28rpx;
						color: #333;
						margin-bottom: 10rpx;
					}

					.resource-meta {
						display: flex;
						justify-content: space-between;

						.resource-author {
							font-size: 22rpx;
							color: #666;
						}

						.resource-download {
							font-size: 22rpx;
							color: #999;
						}
					}
				}
			}
		}
	}

	// 活动样式
	.activity-section {
		margin: 20rpx;
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;

		.activity-list {
			.activity-item {
				display: flex;
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.activity-image {
					width: 120rpx;
					height: 120rpx;
					border-radius: 12rpx;
					margin-right: 20rpx;
				}

				.activity-info {
					flex: 1;

					.activity-title {
						display: block;
						font-size: 28rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 10rpx;
					}

					.activity-meta {
						display: flex;
						margin-bottom: 10rpx;

						.activity-time {
							font-size: 24rpx;
							color: #007aff;
							margin-right: 20rpx;
						}

						.activity-location {
							font-size: 24rpx;
							color: #666;
						}
					}

					.activity-stats {
						display: flex;
						align-items: center;
						justify-content: space-between;

						.activity-participants {
							font-size: 22rpx;
							color: #999;
						}

						.activity-status {
							padding: 4rpx 12rpx;
							border-radius: 8rpx;
							font-size: 20rpx;

							&.status-upcoming {
								background: #e6f3ff;
								color: #007aff;
							}

							&.status-registration {
								background: #e6ffe6;
								color: #5ac725;
							}

							&.status-ongoing {
								background: #fff3cd;
								color: #ff9500;
							}

							&.status-ended {
								background: #f0f0f0;
								color: #999;
							}
						}
					}
				}
			}
		}
	}

	// 讨论样式
	.discussion-section {
		margin: 20rpx;
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;

		.discussion-list {
			.discussion-item {
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.discussion-header {
					display: flex;
					align-items: center;
					margin-bottom: 10rpx;

					.discussion-title {
						flex: 1;
						font-size: 28rpx;
						color: #333;
					}

					.discussion-tag {
						background: #ff9500;
						color: white;
						padding: 4rpx 12rpx;
						border-radius: 8rpx;
						font-size: 20rpx;
					}
				}

				.discussion-meta {
					display: flex;
					align-items: center;
					font-size: 22rpx;
					color: #999;

					.discussion-author {
						margin-right: 20rpx;
					}

					.discussion-reply {
						margin-right: 20rpx;
					}
				}
			}
		}
	}
</style>