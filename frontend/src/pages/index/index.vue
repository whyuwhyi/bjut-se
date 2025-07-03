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

		<!-- 快捷功能入口 -->
		<view class="quick-access-section">
			<view 
				class="quick-access-item" 
				v-for="(item, index) in quickAccess" 
				:key="index"
				@click="navigateTo(item.url)"
			>
				<image :src="item.icon" class="icon-img" mode="aspectFit"></image>
				<text class="text">{{ item.text }}</text>
			</view>
		</view>

		<!-- 最新公告 -->
		<view class="notice-section card">
			<view class="section-header">
				<text class="section-title">最新公告</text>
				<text class="section-more" @click="navigateTo('/pages/notification/messages')">更多</text>
			</view>
			<view class="notice-list">
				<view class="notice-item" v-for="(item, index) in notices" :key="index" @click="viewNotice(item)">
					<view class="notice-header">
						<text class="notice-tag" :class="'tag-' + item.type">{{ item.typeName }}</text>
						<text class="notice-time">{{ formatTime(item.createTime) }}</text>
					</view>
					<text class="notice-title">{{ item.title }}</text>
				</view>
			</view>
		</view>

		<!-- 热门资源 -->
		<view class="resource-section card">
			<view class="section-header">
				<text class="section-title">热门资源</text>
				<text class="section-more" @click="navigateTo('/pages/resources/resources')">更多</text>
			</view>
			<view class="resource-list">
				<view class="resource-item" v-for="(item, index) in hotResources" :key="index" @click="viewResource(item)">
					<view class="resource-icon">
						<text class="resource-icon-emoji">📚</text>
					</view>
					<view class="resource-content">
						<text class="resource-title">{{ item.title }}</text>
						<view class="resource-meta">
							<text class="resource-author">{{ item.author }}</text>
							<text class="resource-downloads">{{ item.downloads || 0 }}次下载</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 热门帖子 -->
		<view class="forum-section card">
			<view class="section-header">
				<text class="section-title">热门帖子</text>
				<text class="section-more" @click="navigateTo('/pages/forum/forum')">更多</text>
			</view>
			<view class="forum-list">
				<view class="forum-item" v-for="(item, index) in hotPosts" :key="index" @click="viewPost(item)">
					<view class="forum-content">
						<text class="forum-title">{{ item.title }}</text>
						<view class="forum-meta">
							<text class="forum-author">{{ item.author }}</text>
							<text class="forum-views">{{ item.views || 0 }}次浏览</text>
							<view class="forum-tag" v-if="item.isHot">热门</view>
						</view>
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
						image: require('@/static/images/information.png')
					},
					{
						image: require('@/static/images/digital.png')
					},
					{
						image: require('@/static/images/data-integration.png')
					}
				],
				quickAccess: [
					{
						icon: require('@/static/icons/upload.png'),
						text: '上传资源',
						url: '/pages/resources/upload'
					},
					{
						icon: require('@/static/icons/post.png'),
						text: '发布帖子',
						url: '/pages/forum/create'
					},
					{
						icon: require('@/static/icons/create-plan.png'),
						text: '新建计划',
						url: '/pages/learning/create-plan'
					},
					{
						icon: require('@/static/icons/star.png'),
						text: '我的收藏',
						url: '/pages/profile/favorites'
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
					const response = await this.requestWithRetry(`${this.$config.apiBaseUrl}/notifications`, {
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
					const response = await this.requestWithRetry(`${this.$config.apiBaseUrl}/resources`, {
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
								author: item.uploaderName || '匿名用户',
								downloads: item.downloadCount || 0,
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
					const response = await this.requestWithRetry(`${this.$config.apiBaseUrl}/posts`, {
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
				if (!fileType) return require('@/static/icons/resource.png')
				const iconMap = {
					'pdf': require('@/static/icons/post.png'),
					'doc': require('@/static/icons/post.png'),
					'docx': require('@/static/icons/post.png'),
					'ppt': require('@/static/icons/ppt.png'),
					'pptx': require('@/static/icons/ppt.png'),
					'xls': require('@/static/icons/post.png'),
					'xlsx': require('@/static/icons/post.png'),
					'zip': require('@/static/icons/post.png'),
					'rar': require('@/static/icons/post.png'),
					'video': require('@/static/icons/video.png'),
					'image': require('@/static/icons/image.png')
				}
				return iconMap[fileType.toLowerCase()] || require('@/static/icons/resource.png')
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
	min-height: 100vh;
	padding: 20rpx;
	background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	animation: gradientBG 15s ease infinite;
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 1024rpx;
	margin: 0 auto;
}

@keyframes gradientBG {
	0% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
	50% {
		background: linear-gradient(135deg, #FAEED1 0%, #FFF8DB 100%);
	}
	100% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
}

.banner-section {
	width: 100%;
	margin-bottom: 32rpx;
	border-radius: 24rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

	.banner-swiper {
		width: 100%;
		height: 300rpx;

		.banner-image {
			width: 100%;
			height: 100%;
		}
	}
}

.quick-access-section {
	width: 100%;
	display: flex;
	justify-content: space-between;
	padding: 32rpx;
	margin-bottom: 32rpx;
	background: white;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	box-sizing: border-box;

	.quick-access-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;

		.icon-img {
			width: 80rpx;
			height: 80rpx;
		}

		.text {
			font-size: 24rpx;
			color: #333;
		}
	}
}

.card {
	width: 100%;
	background: white;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 32rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;

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

.notice-list,
.resource-list,
.forum-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-top: 20rpx;
}

.notice-item {
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	padding: 20rpx;
	box-sizing: border-box;
	transition: transform 0.2s ease;

	&:active {
		transform: scale(0.98);
	}
}

.resource-item,
.forum-item {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	display: flex;
	align-items: center;
	gap: 20rpx;
	transition: all 0.3s ease;

	&:active {
		transform: scale(0.98);
		background-color: #f8f8f8;
	}
}

.resource-item {
	.resource-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 16rpx;
		background-color: #f0f7ff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.resource-icon-emoji {
		font-size: 40rpx;
	}

	.resource-content {
		flex: 1;
		min-width: 0;
	}

	.resource-title {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 8rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		overflow: hidden;
	}

	.resource-meta {
		display: flex;
		align-items: center;
		gap: 16rpx;
		font-size: 24rpx;
		color: #999;
	}
}

.forum-item {
	.forum-content {
		flex: 1;
		min-width: 0;
	}

	.forum-title {
		font-size: 28rpx;
		color: #333;
		font-weight: 500;
		margin-bottom: 8rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
		overflow: hidden;
	}

	.forum-meta {
		display: flex;
		align-items: center;
		gap: 16rpx;
		font-size: 24rpx;
		color: #999;
	}

	.forum-tag {
		background-color: #ff6b6b;
		color: white;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		font-size: 20rpx;
	}
}
</style>
