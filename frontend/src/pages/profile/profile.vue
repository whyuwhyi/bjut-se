<template>
	<view class="profile-container">
		<!-- 个人信息卡片 -->
		<view class="profile-card">
			<view class="profile-header">
				<image class="avatar" :src="userProfile.avatar || require('@/static/logo.png')" @click="changeAvatar"></image>
				<view class="user-info">
					<text class="username">{{ userProfile.nickname || userProfile.name || '用户' }}</text>
					<text class="user-title">{{ userProfile.bio || '暂无简介' }}</text>
				</view>
				<view class="edit-btn" @click="editProfile">
					<text class="edit-icon">✏️</text>
				</view>
			</view>
			
			<view class="profile-stats">
				<view class="stat-item" @click="goToMyResources">
					<text class="stat-number">{{ userStats.resourceCount || 0 }}</text>
					<text class="stat-label">资源</text>
				</view>
				<view class="stat-item" @click="goToMyPosts">
					<text class="stat-number">{{ userStats.postCount || 0 }}</text>
					<text class="stat-label">帖子</text>
				</view>
				<view class="stat-item" @click="goToFollowing">
					<text class="stat-number">{{ userStats.followingCount || 0 }}</text>
					<text class="stat-label">关注</text>
				</view>
				<view class="stat-item" @click="goToFollowers">
					<text class="stat-number">{{ userStats.followerCount || 0 }}</text>
					<text class="stat-label">粉丝</text>
				</view>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-group">
				<text class="group-title">📚 学习数据</text>
				<view class="menu-item" @click="goToFavorites">
					<text class="menu-icon">⭐</text>
					<text class="menu-text">我的收藏</text>
					<text class="menu-badge" v-if="userStats.collectionCount > 0">{{ userStats.collectionCount }}</text>
					<text class="menu-arrow">></text>
				</view>
			</view>

			<view class="menu-group">
				<text class="group-title">💬 互动交流</text>
				<view class="menu-item" @click="goToMessages">
					<text class="menu-icon">🔔</text>
					<text class="menu-text">消息通知</text>
					<text class="menu-badge" v-if="unreadNotificationCount > 0">{{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}</text>
					<text class="menu-arrow">></text>
				</view>
			</view>

			<view class="menu-group">
				<text class="group-title">⚙️ 应用管理</text>
				<view class="menu-item" @click="goToFeedback">
					<text class="menu-icon">📮</text>
					<text class="menu-text">意见反馈</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="goToAbout">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-text">关于应用</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="logout">
					<text class="menu-icon">🚪</text>
					<text class="menu-text">退出登录</text>
					<text class="menu-arrow">></text>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
export default {
	data() {
		return {
			userProfile: {
				nickname: '',
				name: '',
				avatar: '',
				bio: ''
			},
			userStats: {
				resourceCount: 0,
				postCount: 0,
				followingCount: 0,
				followerCount: 0,
				collectionCount: 0
			},
			unreadNotificationCount: 0
		}
	},
	
	onLoad() {
		this.loadUserProfile()
		this.loadUserStats()
		this.loadUnreadNotificationCount()
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.loadUserProfile()
		this.loadUserStats()
		this.loadUnreadNotificationCount()
	},
	
	methods: {
		async loadUserProfile() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.redirectTo({
						url: '/pages/login/login'
					})
					return
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/profile`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					const user = response.data.data.user
					this.userProfile = {
						nickname: user.nickname || '',
						name: user.name || '',
						avatar: user.avatar_url || '',
						bio: user.bio || ''
					}
				}
			} catch (error) {
				console.error('加载用户资料失败:', error)
			}
		},
		
		async loadUserStats() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/stats`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					const stats = response.data.data
					this.userStats = {
						resourceCount: stats.resourceCount || 0,
						postCount: stats.postCount || 0,
						followingCount: stats.followingCount || 0,
						followerCount: stats.followerCount || 0,
						collectionCount: stats.collectionCount || 0
					}
				}
			} catch (error) {
				console.error('加载用户统计失败:', error)
			}
		},
		
		async loadUnreadNotificationCount() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/notifications/unread-count`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					this.unreadNotificationCount = response.data.data.unread_count
				}
			} catch (error) {
				console.error('获取未读通知数量失败:', error)
			}
		},
		
		changeAvatar() {
			// 点击头像跳转到编辑页面
			this.editProfile()
		},
		
		editProfile() {
			uni.navigateTo({
				url: './edit'
			})
		},
		
		goToMyResources() {
			uni.navigateTo({
				url: './my-resources'
			})
		},
		
		goToMyPosts() {
			uni.navigateTo({
				url: './my-discussions'
			})
		},
		
		goToFollowing() {
			uni.navigateTo({
				url: './following'
			})
		},
		
		goToFollowers() {
			uni.navigateTo({
				url: './followers'
			})
		},
		
		goToFavorites() {
			uni.navigateTo({
				url: './favorites'
			})
		},
		
		
		
		goToMessages() {
			uni.navigateTo({
				url: '/pages/notification/messages'
			})
		},
		
		
		
		goToFeedback() {
			uni.navigateTo({
				url: './feedback'
			})
		},
		
		goToAbout() {
			uni.navigateTo({
				url: './about'
			})
		},
		
		
		
		logout() {
			uni.showModal({
				title: '确认退出',
				content: '您确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除本地存储的token
						uni.removeStorageSync('token')
						uni.reLaunch({
							url: '../login/login'
						})
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.profile-container {
	min-height: 100vh;
	padding: 30rpx;
	padding-bottom: 160rpx;
}

.profile-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx;
	color: white;
	
	.profile-header {
		display: flex;
		align-items: center;
		margin-bottom: 40rpx;
		
		.avatar {
			width: 120rpx;
			height: 120rpx;
			border-radius: 50%;
			border: 4rpx solid rgba(255, 255, 255, 0.3);
			margin-right: 30rpx;
		}
		
		.user-info {
			flex: 1;
			
			.username {
				display: block;
				font-size: 36rpx;
				font-weight: bold;
				margin-bottom: 10rpx;
			}
			
			.user-title {
				display: block;
				font-size: 26rpx;
				opacity: 0.8;
				margin-bottom: 15rpx;
			}
			
		}
		
		.edit-btn {
			padding: 15rpx;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			
			.edit-icon {
				font-size: 32rpx;
			}
		}
	}
	
	.profile-stats {
		display: flex;
		justify-content: space-around;
		
		.stat-item {
			text-align: center;
			
			.stat-number {
				display: block;
				font-size: 36rpx;
				font-weight: bold;
				margin-bottom: 8rpx;
			}
			
			.stat-label {
				font-size: 24rpx;
				opacity: 0.8;
			}
		}
	}
}

.menu-section {
	margin: 20rpx;
	
	.menu-group {
		background: white;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		
		.group-title {
			display: block;
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
			padding: 30rpx 30rpx 20rpx;
			background: #fafafa;
		}
		
		.menu-item {
			display: flex;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.menu-icon {
				font-size: 32rpx;
				margin-right: 25rpx;
				width: 40rpx;
			}
			
			.menu-text {
				flex: 1;
				font-size: 30rpx;
				color: #333;
			}
			
			.menu-badge {
				background: #ff3b30;
				color: white;
				font-size: 20rpx;
				padding: 4rpx 12rpx;
				border-radius: 15rpx;
				margin-right: 15rpx;
			}
			
			.menu-extra {
				font-size: 24rpx;
				color: #999;
				margin-right: 15rpx;
			}
			
			.menu-arrow {
				font-size: 28rpx;
				color: #ccc;
			}
		}
	}
}

</style>