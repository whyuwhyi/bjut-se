<template>
	<view class="profile-container">
		<!-- 个人信息卡片 -->
		<view class="profile-card">
			<view class="profile-header">
				<image class="avatar" :src="userProfile.avatar || require('@/static/images/default-avatar.png')" @click="changeAvatar"></image>
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
				<view class="menu-item" @click="goToPrivacySettings">
					<text class="menu-icon">🔒</text>
					<text class="menu-text">隐私设置</text>
					<text class="menu-arrow">></text>
				</view>
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
import config from '@/utils/config'

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
					url: `${config.apiBaseUrl}/users/profile`,
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
					url: `${config.apiBaseUrl}/users/stats`,
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
					url: `${config.apiBaseUrl}/notifications/unread-count`,
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
		
		goToPrivacySettings() {
			uni.navigateTo({
				url: './privacy-settings'
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

.profile-card {
	width: 100%;
	background: #F0F7FF;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 32rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	box-sizing: border-box;
	
	.profile-header {
		display: flex;
		align-items: center;
		margin-bottom: 32rpx;
		
		.avatar {
			width: 120rpx;
			height: 120rpx;
			border-radius: 60rpx;
			margin-right: 24rpx;
			background: #f0f0f0;
		}
		
		.user-info {
			flex: 1;
			
			.username {
				font-size: 36rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 8rpx;
				display: block;
			}
			
			.user-title {
				font-size: 26rpx;
				color: #666;
				display: block;
			}
		}
		
		.edit-btn {
			width: 64rpx;
			height: 64rpx;
			border-radius: 32rpx;
			background: #f8f8f8;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.edit-icon {
				font-size: 32rpx;
			}
		}
	}
	
	.profile-stats {
		display: flex;
		justify-content: space-around;
		padding-top: 24rpx;
		border-top: 2rpx solid #f0f0f0;
		
		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.stat-number {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 8rpx;
			}
			
			.stat-label {
				font-size: 24rpx;
				color: #666;
			}
		}
	}
}

.menu-section {
	width: 100%;
	
	.menu-group {
		background: white;
		border-radius: 24rpx;
		padding: 32rpx;
		margin-bottom: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		
		.group-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 24rpx;
			display: block;
		}
		
		.menu-item {
			display: flex;
			align-items: center;
			padding: 24rpx 0;
			border-bottom: 2rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
				padding-bottom: 0;
			}
			
			&:first-child {
				padding-top: 0;
			}
			
			.menu-icon {
				font-size: 36rpx;
				margin-right: 20rpx;
			}
			
			.menu-text {
				flex: 1;
				font-size: 28rpx;
				color: #333;
			}
			
			.menu-badge {
				min-width: 40rpx;
				height: 40rpx;
				padding: 0 12rpx;
				background: #ff3b30;
				border-radius: 20rpx;
				color: white;
				font-size: 24rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;
			}
			
			.menu-arrow {
				font-size: 28rpx;
				color: #999;
			}
		}
	}
}
</style>