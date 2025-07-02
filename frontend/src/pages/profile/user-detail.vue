<template>
	<view class="user-detail-container">
		<view v-if="loading" class="loading">
			<text>加载中...</text>
		</view>
		
		<view v-else-if="userProfile" class="profile-content">
			<!-- 用户信息卡片 -->
			<view class="profile-card">
				<view class="profile-header">
					<image class="avatar" :src="userProfile.avatar_url || '/static/images/default-avatar.png'" mode="aspectFill"></image>
					<view class="user-info">
						<text class="username">{{ displayName }}</text>
						<text class="user-bio" v-if="userProfile.bio">{{ userProfile.bio }}</text>
						<text class="join-date">加入时间：{{ formatDate(userProfile.created_at) }}</text>
					</view>
				</view>
				
				<!-- 统计数据 -->
				<view class="profile-stats" v-if="showStats">
					<view class="stat-item">
						<text class="stat-number">{{ userProfile.resource_count || 0 }}</text>
						<text class="stat-label">资源</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ userProfile.post_count || 0 }}</text>
						<text class="stat-label">帖子</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ userProfile.following_count || 0 }}</text>
						<text class="stat-label">关注</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ userProfile.follower_count || 0 }}</text>
						<text class="stat-label">粉丝</text>
					</view>
				</view>
				
				<!-- 操作按钮 -->
				<view class="action-buttons" v-if="canFollow">
					<button 
						class="follow-btn" 
						:class="{ 'following': isFollowing }"
						@click="toggleFollow"
						:loading="followLoading"
					>
						{{ followLoading ? '处理中...' : (isFollowing ? '已关注' : '关注') }}
					</button>
				</view>
			</view>
			
			<!-- 联系信息 -->
			<view class="contact-section" v-if="hasContactInfo">
				<view class="section-title">📞 联系方式</view>
				<view class="contact-item" v-if="userProfile.email">
					<text class="contact-label">邮箱：</text>
					<text class="contact-value">{{ userProfile.email }}</text>
				</view>
				<view class="contact-item" v-if="userProfile.student_id">
					<text class="contact-label">学号：</text>
					<text class="contact-value">{{ userProfile.student_id }}</text>
				</view>
			</view>
		</view>
		
		<view v-else class="error-state">
			<text>用户信息加载失败</text>
			<button class="retry-btn" @click="loadUserProfile">重试</button>
		</view>
	</view>
</template>

<script>
import config from '@/utils/config'

export default {
	data() {
		return {
			userPhone: '',
			userProfile: null,
			loading: true,
			isFollowing: false,
			canFollow: false,
			followLoading: false
		}
	},
	
	computed: {
		displayName() {
			if (!this.userProfile) return '用户'
			if (this.userProfile.name && this.showRealName) {
				return this.userProfile.name
			}
			return this.userProfile.nickname || '用户'
		},
		
		showRealName() {
			// 如果没有隐私设置或者show_real_name为true，则显示真实姓名
			return !this.userProfile.privacy_settings || this.userProfile.privacy_settings.show_real_name !== false
		},
		
		showStats() {
			return !this.userProfile.privacy_settings || this.userProfile.privacy_settings.show_stats !== false
		},
		
		hasContactInfo() {
			return this.userProfile.email || this.userProfile.student_id
		}
	},
	
	onLoad(options) {
		if (options.phone) {
			this.userPhone = options.phone
			this.loadUserProfile()
		} else {
			uni.showToast({
				title: '参数错误',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	},
	
	methods: {
		async loadUserProfile() {
			this.loading = true
			try {
				const token = uni.getStorageSync('token')
				
				const response = await uni.request({
					url: `${config.apiBaseUrl}/users/${this.userPhone}/profile`,
					method: 'GET',
					header: token ? {
						'Authorization': `Bearer ${token}`
					} : {}
				})
				
				if (response.data.success) {
					this.userProfile = response.data.data.user
					this.isFollowing = response.data.data.isFollowing || false
					this.canFollow = response.data.data.canFollow !== false
				} else {
					throw new Error(response.data.message || '加载失败')
				}
			} catch (error) {
				console.error('加载用户资料失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		async toggleFollow() {
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			if (this.followLoading) return
			
			this.followLoading = true
			try {
				const response = await uni.request({
					url: `${config.apiBaseUrl}/users/follow/${this.userPhone}`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					this.isFollowing = response.data.data.isFollowing
					uni.showToast({
						title: response.data.message,
						icon: 'success'
					})
					
					// 更新粉丝数
					if (this.isFollowing) {
						this.userProfile.follower_count += 1
					} else {
						this.userProfile.follower_count = Math.max(0, this.userProfile.follower_count - 1)
					}
				} else {
					throw new Error(response.data.message || '操作失败')
				}
			} catch (error) {
				console.error('关注操作失败:', error)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			} finally {
				this.followLoading = false
			}
		},
		
		formatDate(dateString) {
			if (!dateString) return ''
			const date = new Date(dateString)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
	}
}
</script>

<style lang="scss" scoped>
.user-detail-container {
	min-height: 100vh;
	background: #f8f9fa;
	padding: 30rpx;
}

.loading, .error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 60vh;
	
	text {
		font-size: 30rpx;
		color: #666;
		margin-bottom: 30rpx;
	}
	
	.retry-btn {
		background: #007aff;
		color: white;
		border: none;
		border-radius: 25rpx;
		padding: 20rpx 40rpx;
		font-size: 28rpx;
	}
}

.profile-card {
	background: linear-gradient(135deg, #BEE3F8 0%, #90CDF4 100%);
	padding: 40rpx 30rpx;
	color: white;
	border-radius: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	margin-bottom: 30rpx;
	
	.profile-header {
		display: flex;
		align-items: flex-start;
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
			
			.user-bio {
				display: block;
				font-size: 26rpx;
				opacity: 0.8;
				margin-bottom: 15rpx;
				line-height: 1.4;
			}
			
			.join-date {
				font-size: 24rpx;
				opacity: 0.7;
			}
		}
	}
	
	.profile-stats {
		display: flex;
		justify-content: space-around;
		margin-bottom: 30rpx;
		
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
	
	.action-buttons {
		text-align: center;
		
		.follow-btn {
			background: rgba(255, 255, 255, 0.2);
			color: white;
			border: 2rpx solid rgba(255, 255, 255, 0.5);
			border-radius: 25rpx;
			padding: 20rpx 40rpx;
			font-size: 28rpx;
			
			&.following {
				background: rgba(255, 255, 255, 0.9);
				color: #333;
			}
			
			&[loading] {
				opacity: 0.7;
			}
		}
	}
}

.contact-section {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	
	.section-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.contact-item {
		display: flex;
		margin-bottom: 15rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.contact-label {
			font-size: 26rpx;
			color: #666;
			width: 100rpx;
		}
		
		.contact-value {
			flex: 1;
			font-size: 26rpx;
			color: #333;
		}
	}
}
</style>