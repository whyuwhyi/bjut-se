<template>
	<view class="container">
		<view class="login-header">
			<image src="/static/images/logo.png" class="logo"></image>
			<text class="app-name">日新智链</text>
			<text class="app-slogan">北京工业大学学习交流平台</text>
		</view>

		<view class="login-form">
			<view class="form-item">
				<image src="/static/icons/user.png" class="form-icon"></image>
				<input v-model="formData.username" class="form-input" placeholder="请输入学号/工号" />
			</view>
			
			<view class="form-item">
				<image src="/static/icons/lock.png" class="form-icon"></image>
				<input v-model="formData.password" class="form-input" placeholder="请输入密码" password />
			</view>

			<view class="form-options">
				<view class="remember-me" @click="toggleRemember">
					<image :src="rememberMe ? '/static/icons/checked.png' : '/static/icons/unchecked.png'" class="checkbox"></image>
					<text class="option-text">记住密码</text>
				</view>
				<text class="forgot-password" @click="forgotPassword">忘记密码？</text>
			</view>

			<button class="login-btn" @click="handleLogin" :loading="loginLoading">登录</button>
			
			<view class="other-actions">
				<text class="register-link" @click="goToRegister">还没有账号？立即注册</text>
			</view>
		</view>

		<!-- 微信登录 -->
		<view class="wechat-login" v-if="isWechat">
			<view class="divider">
				<text class="divider-text">或</text>
			</view>
			<button class="wechat-btn" open-type="getUserInfo" @getuserinfo="wechatLogin">
				<image src="/static/icons/wechat.png" class="wechat-icon"></image>
				微信快捷登录
			</button>
		</view>

		<!-- 加载遮罩 -->
		<uni-load-more :status="loadingStatus" v-if="loginLoading"></uni-load-more>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				formData: {
					username: '',
					password: ''
				},
				rememberMe: false,
				loginLoading: false,
				loadingStatus: 'loading',
				isWechat: false
			}
		},
		onLoad() {
			// 检查是否在微信环境
			// #ifdef MP-WEIXIN
			this.isWechat = true
			// #endif
			
			// 检查是否有记住的密码
			this.loadRememberedData()
		},
		methods: {
			// 加载记住的登录信息
			loadRememberedData() {
				try {
					const remembered = uni.getStorageSync('rememberedLogin')
					if (remembered) {
						this.formData = { ...remembered }
						this.rememberMe = true
					}
				} catch (error) {
					console.error('加载记住的登录信息失败:', error)
				}
			},

			// 切换记住密码
			toggleRemember() {
				this.rememberMe = !this.rememberMe
			},

			// 处理登录
			async handleLogin() {
				if (!this.validateForm()) {
					return
				}

				this.loginLoading = true
				
				try {
					// 调用云函数进行登录验证
					const result = await this.callLoginApi()
					
					if (result.success) {
						// 保存用户信息
						uni.setStorageSync('userInfo', result.userInfo)
						uni.setStorageSync('token', result.token)
						
						// 如果选择记住密码，保存登录信息
						if (this.rememberMe) {
							uni.setStorageSync('rememberedLogin', this.formData)
						} else {
							uni.removeStorageSync('rememberedLogin')
						}
						
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})
						
						// 跳转到首页
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							})
						}, 1500)
					} else {
						uni.showToast({
							title: result.message || '登录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('登录错误:', error)
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					})
				} finally {
					this.loginLoading = false
				}
			},

			// 调用登录API
			async callLoginApi() {
				// 模拟API调用，实际应调用云函数
				return new Promise((resolve) => {
					setTimeout(() => {
						// 模拟登录验证
						if (this.formData.username && this.formData.password) {
							resolve({
								success: true,
								userInfo: {
									id: '12345',
									username: this.formData.username,
									realName: '测试用户',
									avatar: '/static/images/default-avatar.png',
									role: 'student',
									college: '软件学院',
									major: '软件工程'
								},
								token: 'mock-jwt-token'
							})
						} else {
							resolve({
								success: false,
								message: '用户名或密码错误'
							})
						}
					}, 1000)
				})
			},

			// 微信登录
			async wechatLogin(e) {
				if (!e.detail.userInfo) {
					uni.showToast({
						title: '取消登录',
						icon: 'none'
					})
					return
				}

				this.loginLoading = true
				
				try {
					// 获取微信登录凭证
					const loginRes = await this.getWechatLoginCode()
					
					// 调用云函数进行微信登录
					const result = await this.callWechatLoginApi(loginRes.code, e.detail.userInfo)
					
					if (result.success) {
						uni.setStorageSync('userInfo', result.userInfo)
						uni.setStorageSync('token', result.token)
						
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})
						
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/index/index'
							})
						}, 1500)
					} else {
						uni.showToast({
							title: result.message || '微信登录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('微信登录错误:', error)
					uni.showToast({
						title: '微信登录失败',
						icon: 'none'
					})
				} finally {
					this.loginLoading = false
				}
			},

			// 获取微信登录凭证
			getWechatLoginCode() {
				return new Promise((resolve, reject) => {
					uni.login({
						provider: 'weixin',
						success: resolve,
						fail: reject
					})
				})
			},

			// 调用微信登录API
			async callWechatLoginApi(code, userInfo) {
				// 模拟微信登录API
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							userInfo: {
								id: 'wx_12345',
								username: userInfo.nickName,
								realName: userInfo.nickName,
								avatar: userInfo.avatarUrl,
								role: 'student',
								college: '',
								major: ''
							},
							token: 'mock-wx-jwt-token'
						})
					}, 1000)
				})
			},

			// 表单验证
			validateForm() {
				if (!this.formData.username.trim()) {
					uni.showToast({
						title: '请输入学号/工号',
						icon: 'none'
					})
					return false
				}

				if (!this.formData.password.trim()) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					})
					return false
				}

				if (this.formData.password.length < 6) {
					uni.showToast({
						title: '密码至少6位',
						icon: 'none'
					})
					return false
				}

				return true
			},

			// 忘记密码
			forgotPassword() {
				uni.showModal({
					title: '忘记密码',
					content: '请联系管理员重置密码，或通过注册邮箱找回密码',
					showCancel: false
				})
			},

			// 跳转到注册页面
			goToRegister() {
				uni.navigateTo({
					url: '/pages/register/register'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 40rpx 40rpx;
	}

	.login-header {
		text-align: center;
		margin-bottom: 80rpx;

		.logo {
			width: 120rpx;
			height: 120rpx;
			border-radius: 60rpx;
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
			display: block;
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.8);
		}
	}

	.login-form {
		width: 100%;
		max-width: 600rpx;
		background: white;
		border-radius: 20rpx;
		padding: 60rpx 40rpx;
		margin-bottom: 40rpx;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);

		.form-item {
			display: flex;
			align-items: center;
			border-bottom: 2rpx solid #f0f0f0;
			margin-bottom: 40rpx;

			.form-icon {
				width: 40rpx;
				height: 40rpx;
				margin-right: 20rpx;
			}

			.form-input {
				flex: 1;
				height: 60rpx;
				font-size: 28rpx;
				color: #333;
			}
		}

		.form-options {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 60rpx;

			.remember-me {
				display: flex;
				align-items: center;

				.checkbox {
					width: 32rpx;
					height: 32rpx;
					margin-right: 16rpx;
				}

				.option-text {
					font-size: 24rpx;
					color: #666;
				}
			}

			.forgot-password {
				font-size: 24rpx;
				color: #007aff;
			}
		}

		.login-btn {
			width: 100%;
			height: 80rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			border: none;
			border-radius: 40rpx;
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 40rpx;
		}

		.other-actions {
			text-align: center;

			.register-link {
				font-size: 24rpx;
				color: #007aff;
			}
		}
	}

	.wechat-login {
		width: 100%;
		max-width: 600rpx;

		.divider {
			text-align: center;
			margin-bottom: 40rpx;
			position: relative;

			&::before {
				content: '';
				position: absolute;
				top: 50%;
				left: 0;
				right: 0;
				height: 1rpx;
				background: rgba(255, 255, 255, 0.3);
			}

			.divider-text {
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: rgba(255, 255, 255, 0.8);
				padding: 0 20rpx;
				font-size: 24rpx;
				position: relative;
				z-index: 1;
			}
		}

		.wechat-btn {
			width: 100%;
			height: 80rpx;
			background: #1aad19;
			color: white;
			border: none;
			border-radius: 40rpx;
			font-size: 28rpx;
			display: flex;
			align-items: center;
			justify-content: center;

			.wechat-icon {
				width: 40rpx;
				height: 40rpx;
				margin-right: 20rpx;
			}
		}
	}
</style>