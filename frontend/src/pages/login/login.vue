<template>
	<view class="container">
		<!-- 顶部Logo区域 -->
		<view class="login-header animated fadeInDown">
			<image class="logo animated fadeIn" src="/static/logo.png" mode="aspectFit"></image>
			<text class="app-name animated fadeInUp">日新智链</text>
			<text class="app-slogan animated fadeInUp delay-100">让学习更简单，让知识更流动</text>
		</view>

		<!-- 登录表单 -->
		<view class="login-form animated fadeInUp delay-200">
			<view class="form-item">
				<view class="form-label">
					<text class="icon"></text>
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
					<text class="icon"></text>
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

			<button class="login-btn animated fadeInUp delay-300" @click="handleLogin" :disabled="isLoading">
				<text v-if="!isLoading">登录</text>
				<text v-else>登录中...</text>
			</button>
			
			<view class="register-link animated fadeInUp delay-400">
				<text class="register-text">还没有账号？</text>
				<text class="register-action" @click="goToRegister">立即注册</text>
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
		// 检查是否有注册自动填充信息
		const autoPhone = uni.getStorageSync('autoLoginPhone')
		const autoPassword = uni.getStorageSync('autoLoginPassword')
		if (autoPhone && autoPassword) {
			this.loginForm.phone_number = autoPhone
			this.loginForm.password = autoPassword
			uni.removeStorageSync('autoLoginPhone')
			uni.removeStorageSync('autoLoginPassword')
		} else {
			// 检查是否有保存的登录信息
			const savedInfo = uni.getStorageSync('savedLoginInfo')
			if (savedInfo) {
				this.loginForm.phone_number = savedInfo.phone_number
				this.loginForm.password = savedInfo.password
				this.rememberMe = true
			}
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
					uni.setStorageSync('currentUserPhone', result.data.user.phone_number)
					
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
				throw error
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
				throw error
			}
		},
		
		toggleRemember() {
			this.rememberMe = !this.rememberMe
		},
		
		forgotPassword() {
			uni.showModal({
				title: '找回密码',
				content: '请联系管理员重置密码',
				showCancel: false
			})
		},
		
		goToRegister() {
			uni.navigateTo({
				url: '../register/register'
			})
		}
	}
}
</script>

<style lang="scss">
/* 定义动画 */
@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes fadeInDown {
	from { opacity: 0; transform: translateY(-20rpx); }
	to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
	from { opacity: 0; transform: translateY(20rpx); }
	to { opacity: 1; transform: translateY(0); }
}

.animated {
	animation-duration: 0.6s;
	animation-fill-mode: both;
	animation-timing-function: ease-out;
}

.fadeIn { animation-name: fadeIn; }
.fadeInDown { animation-name: fadeInDown; }
.fadeInUp { animation-name: fadeInUp; }

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
.delay-600 { animation-delay: 0.6s; }

.login-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 100rpx;
	margin-bottom: 80rpx;

	.logo {
		width: 200rpx;
		height: 200rpx;
		margin-bottom: 20rpx;
	}

	.app-name {
		font-size: 60rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 10rpx;
	}

	.app-slogan {
		font-size: 30rpx;
		color: #666;
	}
}

.login-form {
	background-color: #FFFFFF;
	border-radius: 30rpx;
	box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
	margin: 0 40rpx;
	padding: 40rpx;
}

.form-item {
	margin-bottom: 40rpx; /* 增加间距 */
	
	.form-label {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.95); /* 更不透明的白色 */
		border-radius: 50rpx;
		padding: 0 30rpx;
		border: none; /* 移除边框 */
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08); /* 添加柔和阴影 */
		transition: all 0.3s ease; /* 添加过渡效果 */
		
		&:focus-within { /* 聚焦时增加阴影和微小缩放 */
			box-shadow: 0 15rpx 45rpx rgba(0, 0, 0, 0.2); /* 调整阴影更深 */
			transform: translateY(-5rpx) scale(1.01); /* 增加微小放大效果 */
		}
		
		.icon {
			font-size: 36rpx; /* 调整图标大小 */
			margin-right: 25rpx;
			color: #88A6E0; /* 调整图标颜色 */
		}
		
		.form-input {
			flex: 1;
			height: 110rpx; /* 调整高度 */
			font-size: 32rpx;
			color: #333;
			
			&::placeholder {
				color: #A0A0A0; /* 调整占位符颜色 */
			}
		}
	}
	
	.field-tip {
		display: block;
		font-size: 24rpx; /* 调整字体大小 */
		color: rgba(255, 255, 255, 0.9); /* 调整颜色 */
		margin-top: 15rpx;
		padding-left: 35rpx; /* 调整内边距 */
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
			width: 40rpx; /* 调整大小 */
			height: 40rpx; /* 调整大小 */
			border: 2rpx solid rgba(255, 255, 255, 0.7); /* 调整边框颜色 */
			border-radius: 8rpx; /* 调整圆角 */
			margin-right: 15rpx;
			text-align: center;
			line-height: 36rpx; /* 调整行高 */
			font-size: 28rpx; /* 调整字体大小 */
			color: white;
			transition: all 0.2s ease; /* 添加过渡效果 */
			
			&.active {
				background: rgba(255, 255, 255, 0.3); /* 调整选中背景色 */
				border-color: rgba(255, 255, 255, 0.4); /* 调整选中边框色 */
			}
		}
		
		.option-text {
			color: rgba(255, 255, 255, 0.9); /* 调整颜色 */
			font-size: 30rpx; /* 调整字体大小 */
		}
	}
	
	.forgot-password {
		color: #666;  /* 改为深灰色，确保可见性 */
		font-size: 28rpx;
	}
}

.login-btn {
	width: 100%;
	height: 100rpx;
	background: linear-gradient(135deg, #4A76EC 0%, #6F8EE7 100%); /* 调整为更协调的蓝色渐变 */
	border: none;
	border-radius: 50rpx;
	color: white;
	font-size: 36rpx;
	font-weight: bold;
	margin-bottom: 40rpx;
	box-shadow: 0 15rpx 40rpx rgba(74, 118, 236, 0.4); /* 调整阴影，更柔和且与渐变色协调 */
	transition: all 0.3s ease; /* 添加过渡效果 */
	
	&:disabled {
		opacity: 0.6;
	}
	
	&:hover { /* 新增悬停效果 */
		transform: translateY(-5rpx) scale(1.01); /* 悬停时轻微上浮和放大 */
		box-shadow: 0 20rpx 50rpx rgba(74, 118, 236, 0.5); /* 悬停时阴影更明显 */
	}
	
	&:active {
		transform: scale(0.96); /* 点击时更明显的缩小 */
		box-shadow: 0 5rpx 20rpx rgba(74, 118, 236, 0.2); /* 点击时阴影变浅 */
	}
}

.register-link {
	text-align: right;
	margin-top: 30rpx;
	padding-right: 32rpx;
	
	.register-text {
		color: #666;
		font-size: 28rpx;
	}
	
	.register-action {
		color: #007aff;
		font-size: 28rpx;
		font-weight: 500;
		margin-left: 8rpx;
		transition: opacity 0.2s ease;
		
		&:active {
			opacity: 0.8;
		}
	}
}
</style>