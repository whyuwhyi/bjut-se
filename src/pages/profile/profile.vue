<template>
	<view class="profile-container">
		<!-- 个人信息卡片 -->
		<view class="profile-card">
			<view class="profile-header">
				<image class="avatar" :src="require('@/static/logo.png')" @click="changeAvatar"></image>
				<view class="user-info">
					<text class="username">张同学</text>
					<text class="user-title">计算机学院 · 软件工程专业</text>
					<view class="user-level">
						<text class="level-badge">LV.5</text>
						<text class="level-exp">2580/3000 EXP</text>
					</view>
				</view>
				<view class="edit-btn" @click="editProfile">
					<text class="edit-icon">✏️</text>
				</view>
			</view>
			
			<view class="profile-stats">
				<view class="stat-item" @click="goToMyResources">
					<text class="stat-number">24</text>
					<text class="stat-label">资源</text>
				</view>
				<view class="stat-item" @click="goToMyPosts">
					<text class="stat-number">156</text>
					<text class="stat-label">帖子</text>
				</view>
				<view class="stat-item" @click="goToFollowing">
					<text class="stat-number">89</text>
					<text class="stat-label">关注</text>
				</view>
				<view class="stat-item" @click="goToFollowers">
					<text class="stat-number">432</text>
					<text class="stat-label">粉丝</text>
				</view>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-group">
				<text class="group-title">学习管理</text>
				<view class="menu-item" @click="goToFavorites">
					<text class="menu-icon">⭐</text>
					<text class="menu-text">我的收藏</text>
					<text class="menu-badge">18</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="goToDownloads">
					<text class="menu-icon">📥</text>
					<text class="menu-text">下载记录</text>
					<text class="menu-arrow">></text>
				</view>
			</view>

			<view class="menu-group">
				<text class="group-title">消息与通知</text>
				<view class="menu-item" @click="goToMessages">
					<text class="menu-icon">💬</text>
					<text class="menu-text">消息与通知</text>
					<text class="menu-badge">8</text>
					<text class="menu-arrow">></text>
				</view>
			</view>

			<view class="menu-group">
				<text class="group-title">设置与工具</text>
				<view class="menu-item" @click="goToSettings">
					<text class="menu-icon">⚙️</text>
					<text class="menu-text">账号设置</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="goToPrivacy">
					<text class="menu-icon">🔒</text>
					<text class="menu-text">隐私设置</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="goToTheme">
					<text class="menu-icon">🎨</text>
					<text class="menu-text">主题设置</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="goToFeedback">
					<text class="menu-icon">📮</text>
					<text class="menu-text">意见反馈</text>
					<text class="menu-arrow">></text>
				</view>
			</view>

			<view class="menu-group">
				<text class="group-title">其他</text>
				<view class="menu-item" @click="goToAbout">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-text">关于我们</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="checkUpdate">
					<text class="menu-icon">🔄</text>
					<text class="menu-text">检查更新</text>
					<text class="menu-extra">v1.0.0</text>
					<text class="menu-arrow">></text>
				</view>
				<view class="menu-item" @click="logout">
					<text class="menu-icon">🚪</text>
					<text class="menu-text">退出登录</text>
					<text class="menu-arrow">></text>
				</view>
			</view>
		</view>

		<!-- 成就展示 -->
		<view class="achievement-section">
			<view class="section-header">
				<text class="section-title">🏆 我的成就</text>
				<text class="section-more" @click="goToAllAchievements">查看全部</text>
			</view>
			<scroll-view class="achievement-scroll" scroll-x="true">
				<view class="achievement-list">
					<view class="achievement-item" v-for="(achievement, index) in achievements" :key="index">
						<text class="achievement-icon">{{ achievement.icon }}</text>
						<text class="achievement-name">{{ achievement.name }}</text>
						<text class="achievement-desc">{{ achievement.desc }}</text>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			achievements: [
				{
					icon: '🌟',
					name: '初来乍到',
					desc: '完成注册'
				},
				{
					icon: '📚',
					name: '学者',
					desc: '上传10个资源'
				},
				{
					icon: '💬',
					name: '话痨',
					desc: '发布50个帖子'
				},
				{
					icon: '❤️',
					name: '人气王',
					desc: '获得100个赞'
				}
			]
		}
	},
	
	methods: {
		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					uni.showToast({
						title: '头像更新成功',
						icon: 'success'
					})
				}
			})
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
		
		goToDownloads() {
			uni.navigateTo({
				url: './downloads'
			})
		},
		
		
		goToMessages() {
			uni.navigateTo({
				url: './messages'
			})
		},
		
		goToNotifications() {
			uni.navigateTo({
				url: '/pages/notification/notification'
			})
		},
		
		
		goToSettings() {
			uni.navigateTo({
				url: './settings'
			})
		},
		
		goToPrivacy() {
			uni.navigateTo({
				url: './privacy'
			})
		},
		
		goToTheme() {
			uni.navigateTo({
				url: './theme'
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
		
		goToAllAchievements() {
			uni.navigateTo({
				url: './achievements'
			})
		},
		
		checkUpdate() {
			uni.showLoading({
				title: '检查更新中...'
			})
			
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({
					title: '当前已是最新版本',
					icon: 'success'
				})
			}, 2000)
		},
		
		logout() {
			uni.showModal({
				title: '确认退出',
				content: '您确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
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
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
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
			
			.user-level {
				display: flex;
				align-items: center;
				
				.level-badge {
					background: rgba(255, 255, 255, 0.2);
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
					font-size: 22rpx;
					margin-right: 15rpx;
				}
				
				.level-exp {
					font-size: 22rpx;
					opacity: 0.8;
				}
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

.achievement-section {
	margin: 20rpx;
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
		
		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
		
		.section-more {
			font-size: 26rpx;
			color: #007aff;
		}
	}
	
	.achievement-scroll {
		white-space: nowrap;
		
		.achievement-list {
			display: flex;
			
			.achievement-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				min-width: 150rpx;
				margin-right: 30rpx;
				padding: 20rpx;
				background: #f8f8f8;
				border-radius: 15rpx;
				
				.achievement-icon {
					font-size: 48rpx;
					margin-bottom: 10rpx;
				}
				
				.achievement-name {
					font-size: 26rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 5rpx;
				}
				
				.achievement-desc {
					font-size: 22rpx;
					color: #666;
					text-align: center;
				}
			}
		}
	}
}
</style>