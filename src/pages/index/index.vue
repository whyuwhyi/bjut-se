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
					<text class="resource-title">{{ item.title }}</text>
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
					<view class="forum-header">
						<text class="forum-title">{{ item.title }}</text>
						<view class="forum-tag" v-if="item.isHot">热门</view>
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
				quickAccess: [
					{
						icon: require('@/static/icons/learning.png'),
						text: '我的学习',
						url: '/pages/learning/learning'
					},
					{
						icon: require('@/static/icons/post.png'),
						text: '发布帖子',
						url: '/pages/forum/create'
					},
					{
						icon: require('@/static/icons/upload.png'),
						text: '上传资源',
						url: '/pages/resources/upload'
					},
					{
						icon: require('@/static/icons/profile.png'),
						text: '个人中心',
						url: '/pages/profile/profile'
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

<style lang="scss">
.banner-section {
	margin-bottom: 30rpx; /* 增加底部间距，将下方内容向下推 */

	.banner-swiper {
		height: 300rpx;

		.banner-image {
			width: 100%;
			height: 100%;
		}
	}
}

.quick-access-section {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 20rpx;
	margin: 30rpx 0;
	padding: 0 10rpx;

	.quick-access-item {
		width: 160rpx;
		height: 160rpx;
		background-color: rgba(255, 255, 255, 0.7);
		border-radius: 30rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		transition: transform 0.2s ease;

		&:active {
			transform: scale(0.95);
		}

		.icon-img {
			width: 60rpx;
			height: 60rpx;
			margin-bottom: 16rpx;
			object-fit: contain;
		}

		.text {
			font-size: 26rpx;
			color: #333;
			text-align: center;
			width: 120rpx;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}

.card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	margin-bottom: 40rpx;
	padding: 30rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;

	.section-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.section-more {
		font-size: 28rpx;
		color: #666;
	}
}

.notice-list,
.resource-list,
.forum-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr); /* 两列平均分布 */
	gap: 20rpx; /* 项目间距 */
	margin-top: 20rpx; /* 与section header的间距 */
}

.notice-item,
.resource-item,
.forum-item {
	background-color: rgba(255, 255, 255, 0.7); /* 半透明白色背景 */
	border-radius: 20rpx; /* 圆角 */
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05); /* 轻微阴影 */
	padding: 20rpx;
	box-sizing: border-box;
	aspect-ratio: 1 / 1; /* 保持正方形比例 */
	display: flex;
	flex-direction: column;
	justify-content: center; /* 垂直居中内容 */
	align-items: center;   /* 水平居中内容 */
	text-align: center;    /* 文本居中 */
	overflow: hidden;      /* 隐藏溢出内容 */
	transition: transform 0.2s ease; /* 添加过渡效果 */

	&:active {
		transform: scale(0.95); /* 点击时缩小 */
	}

	// Common title styling for truncation
	.notice-title,
	.resource-title,
	.forum-title {
		font-size: 28rpx;
		color: #333;
		white-space: normal; /* 允许换行 */
		display: -webkit-box; /* 启用多行文本截断 */
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2; /* 最多显示2行 */
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: bold;
		margin: 0; // 重置任何之前的margin
	}
}

.notice-list {
	.notice-item {
		.notice-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			margin-bottom: 8rpx;
		}
		.notice-tag {
			font-size: 20rpx;
			padding: 4rpx 8rpx;
			border-radius: 6rpx;
			flex-shrink: 0;
			margin-right: 8rpx;
		}
		.notice-time {
			font-size: 18rpx;
			color: #999;
			flex-shrink: 0;
			text-align: right;
		}
	}
}

.resource-list {
	.resource-item {
		.resource-icon-emoji {
			font-size: 80rpx;
			margin-bottom: 10rpx;
		}
		.resource-info, .resource-meta {
			display: none;
		}
	}
}

.forum-list {
	.forum-item {
		.forum-header {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 100%;
			margin-bottom: 8rpx;
		}
		.forum-title {
			margin-right: 8rpx;
		}
		.forum-tag {
			font-size: 20rpx;
			padding: 4rpx 8rpx;
			border-radius: 6rpx;
			flex-shrink: 0;
		}
		.forum-meta {
			display: none;
		}
	}
}
</style>
