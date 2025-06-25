<template>
	<view class="settings-container">
		<!-- 账号信息 -->
		<view class="settings-section">
			<text class="section-title">账号信息</text>
			<view class="settings-group">
				<view class="setting-item" @click="editProfile">
					<view class="setting-left">
						<text class="setting-icon">👤</text>
						<text class="setting-label">个人资料</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">编辑基本信息</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
				
				<view class="setting-item" @click="changePassword">
					<view class="setting-left">
						<text class="setting-icon">🔒</text>
						<text class="setting-label">修改密码</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">保护账号安全</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
				
				<view class="setting-item" @click="bindAccount">
					<view class="setting-left">
						<text class="setting-icon">🔗</text>
						<text class="setting-label">账号绑定</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">微信已绑定</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 通知设置 -->
		<view class="settings-section">
			<text class="section-title">通知设置</text>
			<view class="settings-group">
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">🔔</text>
						<text class="setting-label">推送通知</text>
					</view>
					<view class="setting-right">
						<switch :checked="notificationSettings.push" @change="onPushChange" />
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">💬</text>
						<text class="setting-label">讨论回复通知</text>
					</view>
					<view class="setting-right">
						<switch :checked="notificationSettings.reply" @change="onReplyChange" />
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">👍</text>
						<text class="setting-label">点赞通知</text>
					</view>
					<view class="setting-right">
						<switch :checked="notificationSettings.like" @change="onLikeChange" />
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">🎯</text>
						<text class="setting-label">活动通知</text>
					</view>
					<view class="setting-right">
						<switch :checked="notificationSettings.activity" @change="onActivityChange" />
					</view>
				</view>
				
				<view class="setting-item" @click="setQuietTime">
					<view class="setting-left">
						<text class="setting-icon">🌙</text>
						<text class="setting-label">免打扰时间</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">{{ quietTimeText }}</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 隐私设置 -->
		<view class="settings-section">
			<text class="section-title">隐私设置</text>
			<view class="settings-group">
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">🔐</text>
						<text class="setting-label">资料可见性</text>
					</view>
					<view class="setting-right">
						<picker @change="onProfileVisibilityChange" :value="privacySettings.profileVisibility" :range="profileVisibilityOptions">
							<view class="picker-trigger">
								<text class="setting-value">{{ profileVisibilityOptions[privacySettings.profileVisibility] }}</text>
								<text class="setting-arrow">›</text>
							</view>
						</picker>
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">📊</text>
						<text class="setting-label">学习记录可见</text>
					</view>
					<view class="setting-right">
						<switch :checked="privacySettings.learningVisible" @change="onLearningVisibleChange" />
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">📧</text>
						<text class="setting-label">允许邮件联系</text>
					</view>
					<view class="setting-right">
						<switch :checked="privacySettings.emailContact" @change="onEmailContactChange" />
					</view>
				</view>
			</view>
		</view>

		<!-- 应用设置 -->
		<view class="settings-section">
			<text class="section-title">应用设置</text>
			<view class="settings-group">
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">🌈</text>
						<text class="setting-label">深色模式</text>
					</view>
					<view class="setting-right">
						<switch :checked="appSettings.darkMode" @change="onDarkModeChange" />
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">🔤</text>
						<text class="setting-label">字体大小</text>
					</view>
					<view class="setting-right">
						<picker @change="onFontSizeChange" :value="appSettings.fontSize" :range="fontSizeOptions">
							<view class="picker-trigger">
								<text class="setting-value">{{ fontSizeOptions[appSettings.fontSize] }}</text>
								<text class="setting-arrow">›</text>
							</view>
						</picker>
					</view>
				</view>
				
				<view class="setting-item">
					<view class="setting-left">
						<text class="setting-icon">💾</text>
						<text class="setting-label">自动缓存</text>
					</view>
					<view class="setting-right">
						<switch :checked="appSettings.autoCache" @change="onAutoCacheChange" />
					</view>
				</view>
				
				<view class="setting-item" @click="clearCache">
					<view class="setting-left">
						<text class="setting-icon">🗑️</text>
						<text class="setting-label">清理缓存</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">{{ cacheSize }}</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 数据管理 -->
		<view class="settings-section">
			<text class="section-title">数据管理</text>
			<view class="settings-group">
				<view class="setting-item" @click="exportData">
					<view class="setting-left">
						<text class="setting-icon">📤</text>
						<text class="setting-label">导出数据</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">导出学习记录</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
				
				<view class="setting-item" @click="dataBackup">
					<view class="setting-left">
						<text class="setting-icon">☁️</text>
						<text class="setting-label">数据备份</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">上次备份：昨天</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 其他设置 */
		<view class="settings-section">
			<text class="section-title">其他</text>
			<view class="settings-group">
				<view class="setting-item" @click="checkUpdate">
					<view class="setting-left">
						<text class="setting-icon">🔄</text>
						<text class="setting-label">检查更新</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">v1.0.0</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
				
				<view class="setting-item" @click="feedback">
					<view class="setting-left">
						<text class="setting-icon">💭</text>
						<text class="setting-label">意见反馈</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">帮助改进</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
				
				<view class="setting-item" @click="about">
					<view class="setting-left">
						<text class="setting-icon">ℹ️</text>
						<text class="setting-label">关于应用</text>
					</view>
					<view class="setting-right">
						<text class="setting-value">了解更多</text>
						<text class="setting-arrow">›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-section">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>

		<!-- 免打扰时间设置弹窗 -->
		<uni-popup ref="quietTimePopup" type="bottom">
			<view class="quiet-time-form">
				<view class="form-header">
					<text class="form-title">免打扰时间设置</text>
					<text class="form-close" @click="closeQuietTimeForm">✕</text>
				</view>
				
				<view class="form-body">
					<view class="time-setting">
						<text class="time-label">开始时间</text>
						<picker mode="time" @change="onStartTimeChange" :value="quietTime.start">
							<view class="time-picker">{{ quietTime.start }}</view>
						</picker>
					</view>
					
					<view class="time-setting">
						<text class="time-label">结束时间</text>
						<picker mode="time" @change="onEndTimeChange" :value="quietTime.end">
							<view class="time-picker">{{ quietTime.end }}</view>
						</picker>
					</view>
				</view>
				
				<view class="form-actions">
					<button class="cancel-btn" @click="closeQuietTimeForm">取消</button>
					<button class="confirm-btn" @click="saveQuietTime">确定</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				notificationSettings: {
					push: true,
					reply: true,
					like: false,
					activity: true
				},
				privacySettings: {
					profileVisibility: 0,
					learningVisible: true,
					emailContact: true
				},
				appSettings: {
					darkMode: false,
					fontSize: 1,
					autoCache: true
				},
				quietTime: {
					start: '22:00',
					end: '07:00'
				},
				profileVisibilityOptions: ['公开', '仅同学可见', '私密'],
				fontSizeOptions: ['小', '标准', '大', '特大'],
				cacheSize: '125.6MB'
			}
		},
		
		computed: {
			quietTimeText() {
				return `${this.quietTime.start} - ${this.quietTime.end}`;
			}
		},
		
		methods: {
			// 账号信息相关
			editProfile() {
				uni.navigateTo({
					url: '/pages/profile/edit'
				});
			},
			
			changePassword() {
				uni.navigateTo({
					url: '/pages/profile/change-password'
				});
			},
			
			bindAccount() {
				uni.navigateTo({
					url: '/pages/profile/bind-account'
				});
			},
			
			// 通知设置相关
			onPushChange(e) {
				this.notificationSettings.push = e.detail.value;
				this.saveSettings();
			},
			
			onReplyChange(e) {
				this.notificationSettings.reply = e.detail.value;
				this.saveSettings();
			},
			
			onLikeChange(e) {
				this.notificationSettings.like = e.detail.value;
				this.saveSettings();
			},
			
			onActivityChange(e) {
				this.notificationSettings.activity = e.detail.value;
				this.saveSettings();
			},
			
			setQuietTime() {
				this.$refs.quietTimePopup.open();
			},
			
			onStartTimeChange(e) {
				this.quietTime.start = e.detail.value;
			},
			
			onEndTimeChange(e) {
				this.quietTime.end = e.detail.value;
			},
			
			saveQuietTime() {
				this.saveSettings();
				this.closeQuietTimeForm();
				uni.showToast({
					title: '设置成功',
					icon: 'success'
				});
			},
			
			closeQuietTimeForm() {
				this.$refs.quietTimePopup.close();
			},
			
			// 隐私设置相关
			onProfileVisibilityChange(e) {
				this.privacySettings.profileVisibility = e.detail.value;
				this.saveSettings();
			},
			
			onLearningVisibleChange(e) {
				this.privacySettings.learningVisible = e.detail.value;
				this.saveSettings();
			},
			
			onEmailContactChange(e) {
				this.privacySettings.emailContact = e.detail.value;
				this.saveSettings();
			},
			
			// 应用设置相关
			onDarkModeChange(e) {
				this.appSettings.darkMode = e.detail.value;
				this.saveSettings();
				// 这里可以添加切换主题的逻辑
				uni.showToast({
					title: e.detail.value ? '已开启深色模式' : '已关闭深色模式',
					icon: 'success'
				});
			},
			
			onFontSizeChange(e) {
				this.appSettings.fontSize = e.detail.value;
				this.saveSettings();
				uni.showToast({
					title: '字体大小已更改',
					icon: 'success'
				});
			},
			
			onAutoCacheChange(e) {
				this.appSettings.autoCache = e.detail.value;
				this.saveSettings();
			},
			
			clearCache() {
				uni.showModal({
					title: '清理缓存',
					content: '确定要清理所有缓存数据吗？这可能影响应用启动速度。',
					success: (res) => {
						if (res.confirm) {
							// 清理缓存逻辑
							uni.showLoading({
								title: '清理中...'
							});
							
							setTimeout(() => {
								uni.hideLoading();
								this.cacheSize = '0MB';
								uni.showToast({
									title: '清理完成',
									icon: 'success'
								});
							}, 2000);
						}
					}
				});
			},
			
			// 数据管理相关
			exportData() {
				uni.showLoading({
					title: '导出中...'
				});
				
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '导出成功',
						icon: 'success'
					});
				}, 2000);
			},
			
			dataBackup() {
				uni.showLoading({
					title: '备份中...'
				});
				
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '备份完成',
						icon: 'success'
					});
				}, 2000);
			},
			
			// 其他功能
			checkUpdate() {
				uni.showLoading({
					title: '检查更新中...'
				});
				
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '当前已是最新版本',
						icon: 'success'
					});
				}, 2000);
			},
			
			feedback() {
				uni.navigateTo({
					url: '/pages/profile/feedback'
				});
			},
			
			about() {
				uni.navigateTo({
					url: '/pages/profile/about'
				});
			},
			
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							// 清理登录状态
							uni.clearStorageSync();
							uni.reLaunch({
								url: '/pages/login/login'
							});
						}
					}
				});
			},
			
			// 保存设置
			saveSettings() {
				const settings = {
					notification: this.notificationSettings,
					privacy: this.privacySettings,
					app: this.appSettings,
					quietTime: this.quietTime
				};
				
				uni.setStorageSync('userSettings', settings);
			},
			
			// 加载设置
			loadSettings() {
				try {
					const settings = uni.getStorageSync('userSettings');
					if (settings) {
						this.notificationSettings = { ...this.notificationSettings, ...settings.notification };
						this.privacySettings = { ...this.privacySettings, ...settings.privacy };
						this.appSettings = { ...this.appSettings, ...settings.app };
						this.quietTime = { ...this.quietTime, ...settings.quietTime };
					}
				} catch (e) {
					console.error('加载设置失败:', e);
				}
			}
		},
		
		onLoad() {
			this.loadSettings();
		}
	}
</script>

<style scoped>
	.settings-container {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 40rpx;
	}

	.settings-section {
		margin-bottom: 32rpx;
	}

	.section-title {
		font-size: 28rpx;
		color: #999999;
		padding: 32rpx 32rpx 16rpx;
		display: block;
	}

	.settings-group {
		background-color: #ffffff;
		border-radius: 16rpx;
		margin: 0 32rpx;
		overflow: hidden;
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx 24rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: background-color 0.3s ease;
	}

	.setting-item:last-child {
		border-bottom: none;
	}

	.setting-item:active {
		background-color: #f8f8f8;
	}

	.setting-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.setting-icon {
		font-size: 32rpx;
		margin-right: 24rpx;
		width: 48rpx;
		text-align: center;
	}

	.setting-label {
		font-size: 32rpx;
		color: #333333;
		font-weight: 500;
	}

	.setting-right {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.setting-value {
		font-size: 28rpx;
		color: #666666;
	}

	.setting-arrow {
		font-size: 28rpx;
		color: #cccccc;
	}

	.picker-trigger {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	/* 退出登录 */
	.logout-section {
		margin: 64rpx 32rpx 32rpx;
	}

	.logout-btn {
		width: 100%;
		padding: 32rpx;
		background-color: #ff3b30;
		color: #ffffff;
		border-radius: 16rpx;
		font-size: 32rpx;
		font-weight: 600;
		border: none;
	}

	/* 免打扰时间设置弹窗 */
	.quiet-time-form {
		background-color: #ffffff;
		border-radius: 16rpx 16rpx 0 0;
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}

	.form-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
	}

	.form-close {
		font-size: 32rpx;
		color: #666666;
		padding: 8rpx;
	}

	.form-body {
		padding: 32rpx;
	}

	.time-setting {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.time-setting:last-child {
		border-bottom: none;
	}

	.time-label {
		font-size: 28rpx;
		color: #333333;
	}

	.time-picker {
		padding: 16rpx 24rpx;
		background-color: #f0f0f0;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #333333;
	}

	.form-actions {
		display: flex;
		gap: 24rpx;
		padding: 32rpx;
		border-top: 1rpx solid #e0e0e0;
	}

	.cancel-btn, .confirm-btn {
		flex: 1;
		padding: 24rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		border: none;
	}

	.cancel-btn {
		background-color: #f0f0f0;
		color: #666666;
	}

	.confirm-btn {
		background-color: #007aff;
		color: #ffffff;
	}
</style>