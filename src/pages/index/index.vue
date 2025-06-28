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
				<text class="section-more" @click="navigateTo('/pages/notification/messages')">更多</text>
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


		<!-- 热门帖子 -->
		<view class="forum-section">
			<view class="section-header">
				<text class="section-title">热门帖子</text>
				<text class="section-more" @click="navigateTo('/pages/forum/forum')">更多</text>
			</view>
			<view class="forum-list">
				<view class="forum-item" v-for="(item, index) in hotPosts" :key="index" @click="viewPost(item)">
					<view class="forum-header">
						<text class="forum-title">{{ item.title }}</text>
						<view class="forum-tag" v-if="item.isHot">热门</view>
					</view>
					<view class="forum-meta">
						<text class="forum-author">{{ item.authorName }}</text>
						<text class="forum-reply">{{ item.commentCount }}评论</text>
						<text class="forum-time">{{ formatTime(item.createTime) }}</text>
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
					}
				],
				notices: [],
				hotResources: [],
				hotPosts: []
			}
		},
		onLoad() {
			console.log('首页 onLoad 开始')
			// 检查登录状态，只有登录后才加载数据
			if (this.checkLogin()) {
				this.loadData()
			}
		},
		onPullDownRefresh() {
			this.loadData()
			setTimeout(() => {
				uni.stopPullDownRefresh()
			}, 1000)
		},
		methods: {
			// 检查登录状态
			checkLogin() {
				const token = uni.getStorageSync('token')
				const userInfo = uni.getStorageSync('userInfo')
				
				console.log('首页检查登录状态 - token:', token, 'userInfo:', userInfo)
				
				if (!token || !userInfo) {
					console.log('首页：未登录，跳转到登录页面')
					uni.reLaunch({
						url: '/pages/login/login'
					})
					return false
				}
				console.log('首页：已登录，继续加载数据')
				return true
			},
			
			// 加载页面数据
			async loadData() {
				try {
					// 顺序加载以避免并发请求导致的429错误
					await this.loadNotices()
					await this.delay(200) // 200ms延迟
					await this.loadHotResources()
					await this.delay(200) // 200ms延迟
					await this.loadHotPosts()
				} catch (error) {
					console.error('加载数据失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},
			
			// 延迟函数
			delay(ms) {
				return new Promise(resolve => setTimeout(resolve, ms))
			},
			
			// 带重试的请求函数
			async requestWithRetry(url, data, maxRetries = 3) {
				const token = uni.getStorageSync('token')
				
				for (let i = 0; i < maxRetries; i++) {
					try {
						const response = await uni.request({
							url: url,
							method: 'GET',
							header: {
								'Authorization': `Bearer ${token}`
							},
							data: data
						})
						
						// 如果成功，直接返回
						if (response.statusCode === 200) {
							return response
						}
						
						// 如果是429错误，直接停止重试
						if (response.statusCode === 429) {
							console.log('收到429错误，请求频率过高，停止重试')
							throw new Error('请求频率过高，请稍后再试')
						}
						
						// 其他错误，不重试
						throw new Error(`HTTP ${response.statusCode}`)
						
					} catch (error) {
						console.log(`请求失败，第${i + 1}次尝试:`, error)
						
						// 最后一次重试也失败了
						if (i === maxRetries - 1) {
							throw error
						}
						
						// 等待后重试
						await this.delay(500 * (i + 1))
					}
				}
			},

			// 加载最新公告
			async loadNotices() {
				try {
					const response = await this.requestWithRetry('http://localhost:3000/api/v1/notifications', {
						page: 1,
						limit: 5,
						type: 'announcement'
					})
					
					if (response && response.data.success) {
						this.notices = response.data.data.notifications.map(item => ({
							id: item.notification_id,
							title: item.title,
							type: item.priority,
							typeName: this.getPriorityName(item.priority),
							createTime: new Date(item.created_at)
						}))
					}
				} catch (error) {
					console.error('加载公告失败:', error)
					// 如果加载失败，显示默认数据
					this.notices = []
				}
			},
			
			getPriorityName(priority) {
				const map = {
					'high': '重要',
					'medium': '一般',
					'low': '普通'
				}
				return map[priority] || '普通'
			},

			// 加载热门资源
			async loadHotResources() {
				try {
					const response = await this.requestWithRetry('http://localhost:3000/api/v1/resources', {
						page: 1,
						limit: 5,
						sort: 'download_count'
					})
					
					console.log('热门资源API响应:', response.data)
					
					if (response && response.data.success) {
						console.log('原始资源数据:', response.data.data.resources)
						this.hotResources = response.data.data.resources.map(item => {
							console.log('处理资源项:', item)
							return {
								id: item.id,
								title: item.title,
								fileType: this.getFileExtension(item.files?.[0]?.file_name),
								uploaderName: item.uploaderName || '匿名用户',
								downloadCount: item.downloadCount || 0
							}
						})
						console.log('处理后的热门资源:', this.hotResources)
					}
				} catch (error) {
					console.error('加载热门资源失败:', error)
					this.hotResources = []
				}
			},
			
			getFileExtension(fileName) {
				if (!fileName) return 'unknown'
				return fileName.split('.').pop().toLowerCase()
			},


			// 加载热门帖子
			async loadHotPosts() {
				try {
					const response = await this.requestWithRetry('http://localhost:3000/api/v1/posts', {
						page: 1,
						limit: 5,
						sort: 'comments'
					})
					
					if (response && response.data.success) {
						this.hotPosts = response.data.data.posts.map(item => ({
							id: item.post_id,
							title: item.title,
							isHot: item.comment_count > 10,
							authorName: item.author?.nickname || item.author?.name || '匿名用户',
							commentCount: item.comment_count || 0,
							createTime: new Date(item.created_at)
						}))
					}
				} catch (error) {
					console.error('加载热门帖子失败:', error)
					this.hotPosts = []
				}
			},

			// 页面导航
			navigateTo(url) {
				// 判断是否为tabBar页面
				const tabBarPages = [
					'/pages/index/index',
					'/pages/resources/resources', 
					'/pages/forum/forum',
					'/pages/learning/learning',
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
				if (!resource.id) {
					uni.showToast({
						title: '资源ID无效',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: `/pages/resources/detail?id=${resource.id}`
				})
			},


			// 查看帖子详情
			viewPost(post) {
				if (!post.id) {
					uni.showToast({
						title: '帖子ID无效',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: `/pages/forum/detail?id=${post.id}`
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

					&.tag-high {
						background: #ff3b30;
					}

					&.tag-medium {
						background: #007aff;
					}

					&.tag-low {
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


	// 讨论样式
	.forum-section {
		margin: 20rpx;
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;

		.forum-list {
			.forum-item {
				padding: 20rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				.forum-header {
					display: flex;
					align-items: center;
					margin-bottom: 10rpx;

					.forum-title {
						flex: 1;
						font-size: 28rpx;
						color: #333;
					}

					.forum-tag {
						background: #ff9500;
						color: white;
						padding: 4rpx 12rpx;
						border-radius: 8rpx;
						font-size: 20rpx;
					}
				}

				.forum-meta {
					display: flex;
					align-items: center;
					font-size: 22rpx;
					color: #999;

					.forum-author {
						margin-right: 20rpx;
					}

					.forum-reply {
						margin-right: 20rpx;
					}
					
					.forum-time {
						margin-left: auto;
					}
				}
			}
		}
	}
</style>
