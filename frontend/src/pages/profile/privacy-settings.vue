<template>
	<view class="privacy-container">
		<view class="header">
			<text class="title">隐私设置</text>
			<text class="subtitle">管理您的个人信息显示偏好</text>
		</view>
		
		<view class="settings-section">
			<view class="section-title">📧 联系信息</view>
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">显示邮箱地址</text>
					<text class="setting-desc">其他用户是否可以看到您的邮箱</text>
				</view>
				<switch :checked="privacySettings.show_email" @change="updateSetting('show_email', $event)" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">显示学号</text>
					<text class="setting-desc">其他用户是否可以看到您的学号</text>
				</view>
				<switch :checked="privacySettings.show_student_id" @change="updateSetting('show_student_id', $event)" />
			</view>
		</view>
		
		<view class="settings-section">
			<view class="section-title">👤 个人信息</view>
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">显示真实姓名</text>
					<text class="setting-desc">其他用户是否可以看到您的真实姓名</text>
				</view>
				<switch :checked="privacySettings.show_real_name" @change="updateSetting('show_real_name', $event)" />
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">显示个人简介</text>
					<text class="setting-desc">其他用户是否可以看到您的个人简介</text>
				</view>
				<switch :checked="privacySettings.show_bio" @change="updateSetting('show_bio', $event)" />
			</view>
		</view>
		
		<view class="settings-section">
			<view class="section-title">📊 活动数据</view>
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">显示统计数据</text>
					<text class="setting-desc">其他用户是否可以看到您的发帖数、资源数等</text>
				</view>
				<switch :checked="privacySettings.show_stats" @change="updateSetting('show_stats', $event)" />
			</view>
		</view>
		
		<view class="settings-section">
			<view class="section-title">🤝 社交功能</view>
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">允许被关注</text>
					<text class="setting-desc">其他用户是否可以关注您</text>
				</view>
				<switch :checked="privacySettings.allow_follow" @change="updateSetting('allow_follow', $event)" />
			</view>
		</view>
		
		<view class="save-section">
			<button class="save-btn" @click="saveSettings" :loading="saving">
				{{ saving ? '保存中...' : '保存设置' }}
			</button>
		</view>
	</view>
</template>

<script>
import config from '@/utils/config'

export default {
	data() {
		return {
			privacySettings: {
				show_email: false,
				show_student_id: false,
				show_real_name: true,
				show_bio: true,
				show_stats: true,
				allow_follow: true
			},
			saving: false
		}
	},
	
	onLoad() {
		this.loadPrivacySettings()
	},
	
	methods: {
		async loadPrivacySettings() {
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
				
				if (response.data.success && response.data.data.user.privacy_settings) {
					this.privacySettings = { ...this.privacySettings, ...response.data.data.user.privacy_settings }
				}
			} catch (error) {
				console.error('加载隐私设置失败:', error)
				uni.showToast({
					title: '加载设置失败',
					icon: 'none'
				})
			}
		},
		
		updateSetting(key, event) {
			this.privacySettings[key] = event.detail.value
		},
		
		async saveSettings() {
			if (this.saving) return
			
			this.saving = true
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.redirectTo({
						url: '/pages/login/login'
					})
					return
				}
				
				const response = await uni.request({
					url: `${config.apiBaseUrl}/users/privacy-settings`,
					method: 'PUT',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						privacy_settings: this.privacySettings
					}
				})
				
				if (response.data.success) {
					uni.showToast({
						title: '设置保存成功',
						icon: 'success'
					})
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					throw new Error(response.data.message || '保存失败')
				}
			} catch (error) {
				console.error('保存隐私设置失败:', error)
				uni.showToast({
					title: '保存失败，请重试',
					icon: 'none'
				})
			} finally {
				this.saving = false
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.privacy-container {
	min-height: 100vh;
	background: #f8f9fa;
	padding: 30rpx;
}

.header {
	text-align: center;
	margin-bottom: 40rpx;
	
	.title {
		display: block;
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
	}
	
	.subtitle {
		font-size: 26rpx;
		color: #666;
	}
}

.settings-section {
	background: white;
	border-radius: 20rpx;
	margin-bottom: 30rpx;
	overflow: hidden;
	
	.section-title {
		display: block;
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		padding: 30rpx 30rpx 20rpx;
		background: #fafafa;
		border-bottom: 1rpx solid #eee;
	}
	
	.setting-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.setting-info {
			flex: 1;
			
			.setting-label {
				display: block;
				font-size: 30rpx;
				color: #333;
				margin-bottom: 8rpx;
			}
			
			.setting-desc {
				font-size: 24rpx;
				color: #666;
				line-height: 1.4;
			}
		}
		
		switch {
			margin-left: 20rpx;
		}
	}
}

.save-section {
	margin-top: 40rpx;
	padding: 0 20rpx;
	
	.save-btn {
		width: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 25rpx;
		height: 100rpx;
		font-size: 32rpx;
		font-weight: bold;
		
		&[loading] {
			opacity: 0.7;
		}
	}
}
</style>