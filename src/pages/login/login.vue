<template>
	<view class="login-container">
		<!-- 顶部Logo区域 -->
		<view class="login-header">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="app-name">日新智链</text>
			<text class="app-slogan">让学习更简单，让知识更流动</text>
		</view>

		<!-- 登录表单 -->
		<view class="login-form">
			<view class="form-item">
				<view class="form-label">
					<text class="icon">📱</text>
					<input 
						class="form-input" 
						type="number"
						placeholder="请输入手机号（登录账号）" 
						v-model="loginForm.phone_number"
						maxlength="11"
					/>
				</view>
				<text class="field-tip">使用注册时的手机号登录</text>
			</view>
			
			<view class="form-item">
				<view class="form-label">
					<text class="icon">🔒</text>
					<input 
						class="form-input" 
						type="password"
						placeholder="请输入密码" 
						v-model="loginForm.password"
						maxlength="32"
					/>
				</view>
			</view>

			<view class="form-options">
				<view class="remember-me" @click="toggleRemember">
					<text class="checkbox" :class="{ active: rememberMe }">{{ rememberMe ? '✓' : '' }}</text>
					<text class="option-text">记住密码</text>
				</view>
				<text class="forgot-password" @click="forgotPassword">忘记密码？</text>
			</view>

			<button class="login-btn" @click="handleLogin" :disabled="isLoading">
				<text v-if="!isLoading">登录</text>
				<text v-else>登录中...</text>
			</button>
			
			<view class="register-link">
				<text class="register-text">还没有账号？</text>
				<text class="register-action" @click="goToRegister">立即注册</text>
			</view>
		</view>

		<!-- 其他登录方式 -->
		<view class="other-login">
			<view class="divider">
				<text class="divider-text">其他登录方式</text>
			</view>
			<view class="social-login">
				<view class="social-item" @click="wechatLogin">
					<text class="social-icon">💬</text>
					<text class="social-text">微信登录</text>
				</view>
			</view>
		</view>

		<!-- 帮助提示 -->
		<view class="help-section">
			<view class="help-item">
				<text class="help-icon">💡</text>
				<text class="help-text">使用手机号作为登录账号，更安全便捷</text>
			</view>
			<view class="help-item">
				<text class="help-icon">🔐</text>
				<text class="help-text">首次使用请先注册，学号/工号可选填</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loginForm: {
				phone_number: '',
				password: ''
			},
			rememberMe: false,
			isLoading: false
		}
	},
	
	onLoad() {
		// 检查是否有保存的登录信息
		const savedInfo = uni.getStorageSync('savedLoginInfo')
		if (savedInfo) {
			this.loginForm.phone_number = savedInfo.phone_number
			this.loginForm.password = savedInfo.password
			this.rememberMe = true
		}
	},
	
	methods: {
		// 处理登录
		async handleLogin() {
			// 验证输入
			if (!this.loginForm.phone_number) {
				uni.showToast({
					title: '请输入手机号',
					icon: 'none'
				})
				return
			}
			
			if (!this.loginForm.password) {
				uni.showToast({
					title: '请输入密码',
					icon: 'none'
				})
				return
			}
			
			// 手机号格式验证
			const phonePattern = /^1[3-9]\d{9}$/
			if (!phonePattern.test(this.loginForm.phone_number)) {
				uni.showToast({
					title: '手机号格式不正确',
					icon: 'none'
				})
				return
			}
			
			this.isLoading = true
			
			try {
				// 调用登录API
				const result = await this.login()
				
				if (result.success) {
					// 保存用户信息
					uni.setStorageSync('userInfo', result.data.user)
					uni.setStorageSync('token', result.data.token)
					
					// 如果选择记住密码
					if (this.rememberMe) {
						uni.setStorageSync('savedLoginInfo', {
							phone_number: this.loginForm.phone_number,
							password: this.loginForm.password
						})
					} else {
						uni.removeStorageSync('savedLoginInfo')
					}
					
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 延迟跳转到首页
					setTimeout(() => {
						uni.switchTab({
							url: '../index/index'
						})
					}, 1000)
				} else {
					uni.showToast({
						title: result.message || '登录失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('登录错误:', error)
				uni.showToast({
					title: '网络错误，请稍后重试',
					icon: 'none'
				})
			} finally {
				this.isLoading = false
			}
		},
		
		// 调用登录API
		async login() {
			try {
				// 调用后端API
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/login`,
					method: 'POST',
					data: {
						phone_number: this.loginForm.phone_number,
						password: this.loginForm.password
					},
					header: {
						'Content-Type': 'application/json'
					}
				})
				
				return response.data
			} catch (error) {
				console.error('API调用失败:', error)
				// 开发阶段的模拟数据
				return new Promise((resolve) => {
					setTimeout(() => {
						// 模拟登录成功
						if (this.loginForm.phone_number === '13912345678' && this.loginForm.password === 'password123') {
							resolve({
								success: true,
								data: {
									user: {
										phone_number: this.loginForm.phone_number,
										name: '张同学',
										nickname: '张三',
										student_id: '12345678'
									},
									token: 'mock_token_123456'
								}
							})
						} else {
							resolve({
								success: false,
								message: '手机号或密码错误'
							})
						}
					}, 1000)
				})
			}
		},
		
		toggleRemember() {
			this.rememberMe = !this.rememberMe
		},
		
		forgotPassword() {
			uni.showModal({
				title: '找回密码',
				content: '请联系管理员重置密码，或通过注册邮箱找回密码',
				showCancel: false
			})
		},
		
		goToRegister() {
			uni.navigateTo({
				url: '../register/register'
			})
		},
		
		wechatLogin() {
			uni.showToast({
				title: '微信登录功能开发中',
				icon: 'none'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.login-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
}

.login-header {
	text-align: center;
	margin-bottom: 80rpx;
	
	.logo {
		width: 120rpx;
		height: 120rpx;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
	}
	
	.app-name {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 10rpx;
	}
	
	.app-slogan {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
	}
}

.login-form {
	flex: 1;
	
	.form-item {
		margin-bottom: 30rpx;
		
		.form-label {
			display: flex;
			align-items: center;
			background: white;
			border-radius: 50rpx;
			padding: 0 30rpx;
			border: 2rpx solid rgba(255, 255, 255, 0.8);
			
			.icon {
				font-size: 32rpx;
				margin-right: 20rpx;
			}
			
			.form-input {
				flex: 1;
				height: 100rpx;
				font-size: 32rpx;
				color: #333;
				
				&::placeholder {
					color: #999;
				}
			}
		}
		
		.field-tip {
			display: block;
			font-size: 22rpx;
			color: rgba(255, 255, 255, 0.7);
			margin-top: 10rpx;
			padding-left: 30rpx;
		}
	}
	
	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 50rpx;
		
		.remember-me {
			display: flex;
			align-items: center;
			
			.checkbox {
				width: 36rpx;
				height: 36rpx;
				border: 2rpx solid rgba(255, 255, 255, 0.6);
				border-radius: 6rpx;
				margin-right: 15rpx;
				text-align: center;
				line-height: 32rpx;
				font-size: 24rpx;
				color: white;
				
				&.active {
					background: rgba(255, 255, 255, 0.2);
				}
			}
			
			.option-text {
				color: rgba(255, 255, 255, 0.8);
				font-size: 28rpx;
			}
		}
		
		.forgot-password {
			color: rgba(255, 255, 255, 0.8);
			font-size: 28rpx;
		}
	}
	
	.login-btn {
		width: 100%;
		height: 100rpx;
		background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
		border: none;
		border-radius: 50rpx;
		color: white;
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 40rpx;
		box-shadow: 0 10rpx 30rpx rgba(255, 107, 107, 0.3);
		
		&:disabled {
			opacity: 0.6;
		}
	}
	
	.register-link {
		text-align: center;
		
		.register-text {
			color: rgba(255, 255, 255, 0.8);
			font-size: 28rpx;
		}
		
		.register-action {
			color: #ffd93d;
			font-size: 28rpx;
			font-weight: bold;
		}
	}
}

.other-login {
	margin-top: 60rpx;
	
	.divider {
		text-align: center;
		margin-bottom: 30rpx;
		
		.divider-text {
			color: rgba(255, 255, 255, 0.6);
			font-size: 24rpx;
		}
	}
	
	.social-login {
		display: flex;
		justify-content: center;
		
		.social-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 20rpx;
			margin: 0 20rpx;
			
			.social-icon {
				font-size: 60rpx;
				margin-bottom: 10rpx;
			}
			
			.social-text {
				color: rgba(255, 255, 255, 0.8);
				font-size: 24rpx;
			}
		}
	}
}

.help-section {
	margin-top: 40rpx;
	padding: 30rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 20rpx;
	
	.help-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 15rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
		
		.help-icon {
			font-size: 28rpx;
			margin-right: 15rpx;
			margin-top: 2rpx;
		}
		
		.help-text {
			flex: 1;
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.8);
			line-height: 1.5;
		}
	}
}
</style>