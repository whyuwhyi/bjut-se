<template>
	<view class="container">
		<!-- 用户信息头部 -->
		<view class="profile-header">
			<view class="user-info">
				<image :src="userInfo.avatar || '/static/images/default-avatar.png'" class="user-avatar" @click="changeAvatar"></image>
				<view class="user-details">
					<text class="user-name">{{ userInfo.realName || userInfo.username }}</text>
					<text class="user-role">{{ getRoleName(userInfo.role) }}</text>
					<text class="user-college" v-if="userInfo.college">{{ userInfo.college }} {{ userInfo.major }}</text>
				</view>
				<view class="edit-btn" @click="editProfile">
					<image src="/static/icons/edit.png" class="edit-icon"></image>
				</view>
			</view>
			
			<view class="user-stats">
				<view class="stat-item" @click="goToMyResources">
					<text class="stat-number">{{ userStats.resourceCount }}</text>
					<text class="stat-label">资源</text>
				</view>
				<view class="stat-item" @click="goToMyDiscussions">
					<text class="stat-number">{{ userStats.discussionCount }}</text>
					<text class="stat-label">讨论</text>
				</view>
				<view class="stat-item" @click="goToMyFavorites">
					<text class="stat-number">{{ userStats.favoriteCount }}</text>
					<text class="stat-label">收藏</text>
				</view>
				<view class="stat-item" @click="goToMyFollows">
					<text class="stat-number">{{ userStats.followCount }}</text>
					<text class="stat-label">关注</text>
				</view>
			</view>
		</view>

		<!-- 快捷功能 -->
		<view class="quick-actions">
			<view class="action-grid">
				<view class="action-item" v-for="(item, index) in quickActions" :key="index" @click="handleQuickAction(item)">
					<image :src="item.icon" class="action-icon"></image>
					<text class="action-text">{{ item.name }}</text>
				</view>
			</view>
		</view>

		<!-- 学习记录 -->
		<view class="learning-section" v-if="userInfo.role === 'student'">
			<view class="section-header" @click="goToLearningRecord">
				<text class="section-title">学习记录</text>
				<image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
			</view>
			<view class="learning-overview">
				<view class="learning-item">
					<text class="learning-label">今日学习</text>
					<text class="learning-value">{{ learningStats.todayMinutes }}分钟</text>
				</view>
				<view class="learning-item">
					<text class="learning-label">本周学习</text>
					<text class="learning-value">{{ learningStats.weekMinutes }}分钟</text>
				</view>
				<view class="learning-item">
					<text class="learning-label">累计学习</text>
					<text class="learning-value">{{ learningStats.totalHours }}小时</text>
				</view>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-group" v-for="(group, groupIndex) in menuGroups" :key="groupIndex">
				<view class="menu-item" v-for="(item, index) in group.items" :key="index" @click="handleMenuClick(item)">
					<image :src="item.icon" class="menu-icon"></image>
					<text class="menu-text">{{ item.name }}</text>
					<view class="menu-badge" v-if="item.badge">{{ item.badge }}</view>
					<image src="/static/icons/arrow-right.png" class="menu-arrow"></image>
				</view>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-section">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>

		<!-- 头像选择弹窗 -->
		<uni-popup ref="avatarPopup" type="bottom">
			<view class="avatar-modal">
				<view class="modal-header">
					<text class="modal-title">选择头像</text>
					<text class="modal-close" @click="hideAvatarModal">取消</text>
				</view>
				<view class="avatar-actions">
					<view class="avatar-action" @click="chooseFromAlbum">
						<image src="/static/icons/album.png" class="avatar-action-icon"></image>
						<text class="avatar-action-text">从相册选择</text>
					</view>
					<view class="avatar-action" @click="takePhoto">
						<image src="/static/icons/camera.png" class="avatar-action-icon"></image>
						<text class="avatar-action-text">拍照</text>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {},
				userStats: {
					resourceCount: 0,
					discussionCount: 0,
					favoriteCount: 0,
					followCount: 0
				},
				learningStats: {
					todayMinutes: 0,
					weekMinutes: 0,
					totalHours: 0
				},
				quickActions: [
					{
						name: '上传资源',
						icon: '/static/icons/upload.png',
						action: 'uploadResource'
					},
					{
						name: '发起讨论',
						icon: '/static/icons/discuss.png',
						action: 'createDiscussion'
					},
					{
						name: '我的收藏',
						icon: '/static/icons/favorite.png',
						action: 'myFavorites'
					},
					{
						name: '消息通知',
						icon: '/static/icons/notification.png',
						action: 'notifications'
					}
				],
				menuGroups: [
					{
						items: [
							{
								name: '我的资源',
								icon: '/static/icons/my-resources.png',
								action: 'myResources'
							},
							{
								name: '我的讨论',
								icon: '/static/icons/my-discussions.png',
								action: 'myDiscussions'
							},
							{
								name: '学习记录',
								icon: '/static/icons/learning-record.png',
								action: 'learningRecord'
							},
							{
								name: '我的收藏',
								icon: '/static/icons/favorites.png',
								action: 'myFavorites'
							}
						]
					},
					{
						items: [
							{
								name: '消息通知',
								icon: '/static/icons/messages.png',
								action: 'notifications',
								badge: '3'
							},
							{
								name: '系统设置',
								icon: '/static/icons/settings.png',
								action: 'settings'
							},
							{
								name: '帮助反馈',
								icon: '/static/icons/help.png',
								action: 'help'
							},
							{
								name: '关于我们',
								icon: '/static/icons/about.png',
								action: 'about'
							}
						]
					}
				]
			}
		},
		onLoad() {
			this.loadUserInfo()
			this.loadUserStats()
			this.loadLearningStats()
		},
		onShow() {
			// 每次显示页面时刷新数据
			this.loadUserStats()
			this.loadLearningStats()
		},
		methods: {
			// 加载用户信息
			loadUserInfo() {
				try {
					const userInfo = uni.getStorageSync('userInfo')
					if (userInfo) {
						this.userInfo = userInfo
					} else {
						// 如果没有用户信息，跳转到登录页
						uni.reLaunch({
							url: '/pages/login/login'
						})
					}
				} catch (error) {
					console.error('加载用户信息失败:', error)
				}
			},

			// 加载用户统计数据
			async loadUserStats() {
				try {
					const result = await this.callUserStatsApi()
					if (result.success) {
						this.userStats = result.data
					}
				} catch (error) {
					console.error('加载用户统计失败:', error)
				}
			},

			// 调用用户统计API
			async callUserStatsApi() {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							data: {
								resourceCount: 12,
								discussionCount: 8,
								favoriteCount: 25,
								followCount: 15
							}
						})
					}, 500)
				})
			},

			// 加载学习统计数据
			async loadLearningStats() {
				if (this.userInfo.role !== 'student') return

				try {
					const result = await this.callLearningStatsApi()
					if (result.success) {
						this.learningStats = result.data
					}
				} catch (error) {
					console.error('加载学习统计失败:', error)
				}
			},

			// 调用学习统计API
			async callLearningStatsApi() {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							data: {
								todayMinutes: 45,
								weekMinutes: 320,
								totalHours: 128
							}
						})
					}, 500)
				})
			},

			// 获取角色名称
			getRoleName(role) {
				const roleMap = {
					'student': '学生',
					'teacher': '教师',
					'admin': '管理员'
				}
				return roleMap[role] || '用户'
			},

			// 更换头像
			changeAvatar() {
				this.$refs.avatarPopup.open()
			},

			// 隐藏头像弹窗
			hideAvatarModal() {
				this.$refs.avatarPopup.close()
			},

			// 从相册选择头像
			chooseFromAlbum() {
				this.hideAvatarModal()
				uni.chooseImage({
					count: 1,
					sourceType: ['album'],
					success: (res) => {
						this.uploadAvatar(res.tempFilePaths[0])
					}
				})
			},

			// 拍照选择头像
			takePhoto() {
				this.hideAvatarModal()
				uni.chooseImage({
					count: 1,
					sourceType: ['camera'],
					success: (res) => {
						this.uploadAvatar(res.tempFilePaths[0])
					}
				})
			},

			// 上传头像
			async uploadAvatar(filePath) {
				uni.showLoading({
					title: '上传中...'
				})

				try {
					// 实际应该调用云存储上传
					const result = await this.callUploadAvatarApi(filePath)
					if (result.success) {
						this.userInfo.avatar = result.avatarUrl
						// 更新本地存储
						uni.setStorageSync('userInfo', this.userInfo)
						uni.showToast({
							title: '头像更新成功',
							icon: 'success'
						})
					}
				} catch (error) {
					console.error('上传头像失败:', error)
					uni.showToast({
						title: '上传失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
				}
			},

			// 调用上传头像API
			async callUploadAvatarApi(filePath) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							avatarUrl: filePath // 实际应该是云存储URL
						})
					}, 1000)
				})
			},

			// 编辑个人资料
			editProfile() {
				uni.navigateTo({
					url: '/pages/profile/edit'
				})
			},

			// 处理快捷操作
			handleQuickAction(action) {
				this.handleMenuClick(action)
			},

			// 处理菜单点击
			handleMenuClick(item) {
				switch (item.action) {
					case 'uploadResource':
						uni.navigateTo({
							url: '/pages/resources/upload'
						})
						break
					case 'createDiscussion':
						uni.navigateTo({
							url: '/pages/discussion/post'
						})
						break
					case 'myResources':
						this.goToMyResources()
						break
					case 'myDiscussions':
						this.goToMyDiscussions()
						break
					case 'myFavorites':
						this.goToMyFavorites()
						break
					case 'learningRecord':
						this.goToLearningRecord()
						break
					case 'notifications':
						uni.navigateTo({
							url: '/pages/notification/notification'
						})
						break
					case 'settings':
						uni.navigateTo({
							url: '/pages/profile/settings'
						})
						break
					case 'help':
						this.showHelp()
						break
					case 'about':
						this.showAbout()
						break
					default:
						uni.showToast({
							title: '功能开发中',
							icon: 'none'
						})
				}
			},

			// 跳转到我的资源
			goToMyResources() {
				uni.navigateTo({
					url: '/pages/resources/my-resources'
				})
			},

			// 跳转到我的讨论
			goToMyDiscussions() {
				uni.navigateTo({
					url: '/pages/discussion/my-discussions'
				})
			},

			// 跳转到我的收藏
			goToMyFavorites() {
				uni.navigateTo({
					url: '/pages/profile/favorites'
				})
			},

			// 跳转到我的关注
			goToMyFollows() {
				uni.navigateTo({
					url: '/pages/profile/follows'
				})
			},

			// 跳转到学习记录
			goToLearningRecord() {
				uni.navigateTo({
					url: '/pages/learning/learning'
				})
			},

			// 显示帮助
			showHelp() {
				uni.showModal({
					title: '帮助中心',
					content: '如有问题，请联系客服或发送邮件至 support@bjut.edu.cn',
					showCancel: false
				})
			},

			// 显示关于
			showAbout() {
				uni.showModal({
					title: '关于日新智链',
					content: '日新智链平台 v1.0.0\n北京工业大学校园学习交流平台\n© 2025 SE2024-Team-01',
					showCancel: false
				})
			},

			// 退出登录
			handleLogout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							// 清除本地存储
							uni.removeStorageSync('userInfo')
							uni.removeStorageSync('token')
							
							// 跳转到登录页
							uni.reLaunch({
								url: '/pages/login/login'
							})
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		background: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 40rpx;
	}

	// 用户信息头部
	.profile-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 60rpx 30rpx 40rpx;

		.user-info {
			display: flex;
			align-items: center;
			margin-bottom: 40rpx;

			.user-avatar {
				width: 120rpx;
				height: 120rpx;
				border-radius: 60rpx;
				border: 4rpx solid rgba(255, 255, 255, 0.2);
				margin-right: 30rpx;
			}

			.user-details {
				flex: 1;

				.user-name {
					display: block;
					font-size: 36rpx;
					font-weight: bold;
					color: white;
					margin-bottom: 10rpx;
				}

				.user-role {
					display: block;
					font-size: 24rpx;
					color: rgba(255, 255, 255, 0.8);
					margin-bottom: 8rpx;
				}

				.user-college {
					display: block;
					font-size: 22rpx;
					color: rgba(255, 255, 255, 0.7);
				}
			}

			.edit-btn {
				padding: 15rpx;

				.edit-icon {
					width: 36rpx;
					height: 36rpx;
				}
			}
		}

		.user-stats {
			display: flex;
			justify-content: space-around;

			.stat-item {
				text-align: center;

				.stat-number {
					display: block;
					font-size: 40rpx;
					font-weight: bold;
					color: white;
					margin-bottom: 8rpx;
				}

				.stat-label {
					font-size: 24rpx;
					color: rgba(255, 255, 255, 0.8);
				}
			}
		}
	}

	// 快捷功能
	.quick-actions {
		background: white;
		margin: 20rpx;
		border-radius: 16rpx;
		padding: 30rpx;

		.action-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 40rpx;

			.action-item {
				display: flex;
				flex-direction: column;
				align-items: center;

				.action-icon {
					width: 60rpx;
					height: 60rpx;
					margin-bottom: 15rpx;
				}

				.action-text {
					font-size: 24rpx;
					color: #666;
					text-align: center;
				}
			}
		}
	}

	// 学习记录区域
	.learning-section {
		background: white;
		margin: 20rpx;
		border-radius: 16rpx;
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

			.arrow-icon {
				width: 24rpx;
				height: 24rpx;
			}
		}

		.learning-overview {
			display: flex;
			justify-content: space-around;

			.learning-item {
				text-align: center;

				.learning-label {
					display: block;
					font-size: 24rpx;
					color: #666;
					margin-bottom: 10rpx;
				}

				.learning-value {
					display: block;
					font-size: 28rpx;
					font-weight: bold;
					color: #007aff;
				}
			}
		}
	}

	// 功能菜单
	.menu-section {
		.menu-group {
			background: white;
			margin: 20rpx;
			border-radius: 16rpx;
			overflow: hidden;

			.menu-item {
				display: flex;
				align-items: center;
				padding: 30rpx;
				border-bottom: 1rpx solid #f0f0f0;
				position: relative;

				&:last-child {
					border-bottom: none;
				}

				.menu-icon {
					width: 48rpx;
					height: 48rpx;
					margin-right: 30rpx;
				}

				.menu-text {
					flex: 1;
					font-size: 28rpx;
					color: #333;
				}

				.menu-badge {
					background: #ff3b30;
					color: white;
					padding: 2rpx 12rpx;
					border-radius: 16rpx;
					font-size: 20rpx;
					margin-right: 20rpx;
				}

				.menu-arrow {
					width: 24rpx;
					height: 24rpx;
				}
			}
		}
	}

	// 退出登录
	.logout-section {
		padding: 0 20rpx;
		margin-top: 40rpx;

		.logout-btn {
			width: 100%;
			height: 88rpx;
			background: #ff3b30;
			color: white;
			border: none;
			border-radius: 12rpx;
			font-size: 28rpx;
		}
	}

	// 头像选择弹窗
	.avatar-modal {
		background: white;
		border-radius: 20rpx 20rpx 0 0;
		padding: 40rpx;

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

		.avatar-actions {
			display: flex;
			gap: 40rpx;

			.avatar-action {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 40rpx 20rpx;
				border: 2rpx solid #e5e5e5;
				border-radius: 16rpx;

				.avatar-action-icon {
					width: 60rpx;
					height: 60rpx;
					margin-bottom: 20rpx;
				}

				.avatar-action-text {
					font-size: 26rpx;
					color: #333;
				}
			}
		}
	}
</style>