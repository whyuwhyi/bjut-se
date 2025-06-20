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

		<!-- 功能导航 -->
		<view class="nav-section">
			<view class="nav-grid">
				<view class="nav-item" v-for="(item, index) in navItems" :key="index" @click="navigateTo(item.url)">
					<image :src="item.icon" class="nav-icon"></image>
					<text class="nav-text">{{ item.name }}</text>
				</view>
			</view>
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
					<image :src="getFileIcon(item.fileType)" class="resource-icon"></image>
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
						image: '/static/images/banner1.jpg'
					},
					{
						image: '/static/images/banner2.jpg'
					},
					{
						image: '/static/images/banner3.jpg'
					}
				],
				navItems: [
					{
						name: '学习资源',
						icon: '/static/icons/resources.png',
						url: '/pages/resources/resources'
					},
					{
						name: '讨论区',
						icon: '/static/icons/discussion.png',
						url: '/pages/discussion/discussion'
					},
					{
						name: '社团活动',
						icon: '/static/icons/activity.png',
						url: '/pages/activity/activity'
					},
					{
						name: '学习记录',
						icon: '/static/icons/learning.png',
						url: '/pages/learning/learning'
					}
				],
				notices: [],
				hotResources: [],
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
				uni.navigateTo({
					url: url
				})
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

			// 查看讨论详情
			viewDiscussion(discussion) {
				uni.navigateTo({
					url: `/pages/discussion/detail?id=${discussion.id}`
				})
			},

			// 获取文件图标
			getFileIcon(fileType) {
				const iconMap = {
					'pdf': '/static/icons/pdf.png',
					'doc': '/static/icons/doc.png',
					'docx': '/static/icons/doc.png',
					'ppt': '/static/icons/ppt.png',
					'pptx': '/static/icons/ppt.png',
					'zip': '/static/icons/zip.png',
					'rar': '/static/icons/zip.png',
					'jpg': '/static/icons/image.png',
					'png': '/static/icons/image.png',
					'gif': '/static/icons/image.png'
				}
				return iconMap[fileType] || '/static/icons/file.png'
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

	// 功能导航样式
	.nav-section {
		background: white;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 30rpx;

		.nav-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 40rpx;

			.nav-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 20rpx;

				.nav-icon {
					width: 60rpx;
					height: 60rpx;
					margin-bottom: 10rpx;
				}

				.nav-text {
					font-size: 24rpx;
					color: #666;
				}
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

				.resource-icon {
					width: 40rpx;
					height: 40rpx;
					margin-right: 20rpx;
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