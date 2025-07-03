<template>
	<view class="container">
		<!-- 顶部区域 -->
		<view class="register-header">
			<text class="title">注册账号</text>
			<text class="subtitle">加入日新智链学习社区</text>
		</view>

		<!-- 注册表单 -->
		<view class="register-form">
			<!-- 手机号（必填，主要登录方式） -->
			<view class="form-item required">
				<view class="form-label">
					<text class="icon"></text>
					<input 
						class="form-input" 
						type="number"
						placeholder="请输入手机号（用于登录）" 
						v-model="registerForm.phone_number"
						maxlength="11"
					/>
				</view>
				<text class="field-tip">手机号将作为您的登录账号</text>
			</view>
			
			<!-- 真实姓名（必填） -->
			<view class="form-item required">
				<view class="form-label">
					<text class="icon"></text>
					<input 
						class="form-input" 
						type="text"
						placeholder="请输入真实姓名" 
						v-model="registerForm.name"
						maxlength="50"
					/>
				</view>
			</view>
			
			<!-- 学号/工号（可选） -->
			<view class="form-item">
				<view class="form-label">
					<text class="icon"></text>
					<input 
						class="form-input" 
						type="text"
						placeholder="学号/工号（可选填）" 
						v-model="registerForm.student_id"
						maxlength="20"
					/>
				</view>
				<text class="field-tip">8位学号或S+9位学号，学生建议填写</text>
			</view>
			
			<!-- 邮箱（可选） -->
			<view class="form-item">
				<view class="form-label">
					<text class="icon"></text>
					<input 
						class="form-input" 
						type="text"
						placeholder="邮箱地址（可选）" 
						v-model="registerForm.email"
					/>
				</view>
			</view>
			
			<!-- 密码 -->
			<view class="form-item required">
				<view class="form-label">
					<text class="icon"></text>
					<input 
						class="form-input" 
						type="password"
						placeholder="请设置密码（6-32位）" 
						v-model="registerForm.password"
						maxlength="32"
					/>
				</view>
			</view>
			
			<!-- 确认密码 -->
			<view class="form-item required">
				<view class="form-label">
					<text class="icon"></text>
					<input 
						class="form-input" 
						type="password"
						placeholder="请确认密码" 
						v-model="registerForm.confirmPassword"
						maxlength="32"
					/>
				</view>
			</view>

			<!-- 协议同意 -->
			<view class="agreement">
				<view class="agreement-check" @click="toggleAgreement">
					<text class="checkbox" :class="{ active: agreedToTerms }">{{ agreedToTerms ? '✓' : '' }}</text>
					<text class="agreement-text">我已阅读并同意</text>
					<text class="agreement-link" @click.stop="showTerms">《用户协议》</text>
					<text class="agreement-text">和</text>
					<text class="agreement-link" @click.stop="showPrivacy">《隐私政策》</text>
				</view>
			</view>

			<button class="register-btn" @click="handleRegister" :disabled="isLoading || !canRegister">
				<text v-if="!isLoading">立即注册</text>
				<text v-else>注册中...</text>
			</button>
			
			<view class="login-link">
				<text class="login-text">已有账号？</text>
				<text class="login-action" @click="goToLogin">立即登录</text>
			</view>
			
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			registerForm: {
				phone_number: '',
				name: '',
				student_id: '',
				email: '',
				password: '',
				confirmPassword: ''
			},
			agreedToTerms: false,
			isLoading: false
		}
	},
	
	computed: {
		canRegister() {
			return this.registerForm.phone_number && 
				   this.registerForm.name && 
				   this.registerForm.password && 
				   this.registerForm.confirmPassword && 
				   this.agreedToTerms
		}
	},
	
	methods: {
		toggleAgreement() {
			this.agreedToTerms = !this.agreedToTerms
		},
		
		showTerms() {
			uni.showModal({
				title: '用户协议',
				content: '这里是用户协议的详细内容...',
				showCancel: false
			})
		},
		
		showPrivacy() {
			uni.showModal({
				title: '隐私政策',
				content: '这里是隐私政策的详细内容...',
				showCancel: false
			})
		},
		
		// 处理注册
		async handleRegister() {
			// 验证必填字段
			if (!this.registerForm.phone_number) {
				uni.showToast({
					title: '请输入手机号',
					icon: 'none'
				})
				return
			}
			
			if (!this.registerForm.name) {
				uni.showToast({
					title: '请输入真实姓名',
					icon: 'none'
				})
				return
			}
			
			if (!this.registerForm.password) {
				uni.showToast({
					title: '请设置密码',
					icon: 'none'
				})
				return
			}
			
			// 格式验证
			const phonePattern = /^1[3-9]\d{9}$/
			if (!phonePattern.test(this.registerForm.phone_number)) {
				uni.showToast({
					title: '手机号格式不正确',
					icon: 'none'
				})
				return
			}
			
			// 学号格式验证（如果填写了）
			if (this.registerForm.student_id) {
				const studentIdPattern = /^(\d{8}|S\d{9})$/
				if (!studentIdPattern.test(this.registerForm.student_id)) {
					uni.showToast({
						title: '学号格式不正确（8位数字或S+9位数字）',
						icon: 'none'
					})
					return
				}
			}
			
			// 邮箱格式验证（如果填写了）
			if (this.registerForm.email) {
				const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				if (!emailPattern.test(this.registerForm.email)) {
					uni.showToast({
						title: '邮箱格式不正确',
						icon: 'none'
					})
					return
				}
			}
			
			if (this.registerForm.password.length < 6) {
				uni.showToast({
					title: '密码至少6位',
					icon: 'none'
				})
				return
			}
			
			if (this.registerForm.password !== this.registerForm.confirmPassword) {
				uni.showToast({
					title: '两次密码输入不一致',
					icon: 'none'
				})
				return
			}
			
			if (!this.agreedToTerms) {
				uni.showToast({
					title: '请同意用户协议和隐私政策',
					icon: 'none'
				})
				return
			}
			
			this.isLoading = true
			
			try {
				// 调用注册API
				const result = await this.register()
				
				if (result.success) {
					// 注册成功后保存手机号和密码到localStorage
					uni.setStorageSync('autoLoginPhone', this.registerForm.phone_number)
					uni.setStorageSync('autoLoginPassword', this.registerForm.password)
					uni.showModal({
						title: '注册成功',
						content: '欢迎加入日新智链学习社区！请使用手机号登录。',
						showCancel: false,
						success: () => {
							// 跳转到登录页
							uni.redirectTo({ url: '../login/login' })
						}
					})
				} else {
					uni.showToast({
						title: result.message || '注册失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('注册错误:', error)
				uni.showToast({
					title: '网络错误，请稍后重试',
					icon: 'none'
				})
			} finally {
				this.isLoading = false
			}
		},
		
		// 调用注册API
		async register() {
			try {
				// 准备请求数据，过滤空值
				const requestData = {
					phone_number: this.registerForm.phone_number,
					name: this.registerForm.name,
					password: this.registerForm.password
				}
				
				// 只添加非空的可选字段
				if (this.registerForm.student_id) {
					requestData.student_id = this.registerForm.student_id
				}
				if (this.registerForm.email) {
					requestData.email = this.registerForm.email
				}
				
				// 调用后端API
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/users/register`,
					method: 'POST',
					data: requestData,
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
		
		goToLogin() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss">
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	animation: gradientBG 15s ease infinite;
	padding: 40rpx 0;
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

.register-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 60rpx;
	margin-bottom: 60rpx;

	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
	}

	.subtitle {
		font-size: 28rpx;
		color: #666;
	}
}

.register-form {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	margin: 0 32rpx;
	padding: 32rpx;
}

.form-item {
	margin-bottom: 32rpx;
	
	&.required::before {
		content: "*";
		color: #ff6b6b;
		font-size: 28rpx;
		font-weight: bold;
		position: absolute;
		margin-left: -16rpx;
		margin-top: 32rpx;
	}
	
	.form-label {
		display: flex;
		align-items: center;
		background: #ffffff;
		border-radius: 16rpx;
		padding: 0 24rpx;
		border: 2rpx solid #eee;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
		
		&:focus-within {
			border-color: #007aff;
			box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.1);
		}
		
		.icon {
			font-size: 32rpx;
			margin-right: 16rpx;
			color: #999;
		}
		
		.form-input {
			flex: 1;
			height: 88rpx;
			font-size: 28rpx;
			color: #333;
			
			&::placeholder {
				color: #999;
			}
		}
	}
	
	.field-tip {
		display: block;
		font-size: 24rpx;
		color: #666;
		margin-top: 12rpx;
		padding-left: 24rpx;
		line-height: 1.4;
	}
}

.agreement {
	margin: 40rpx 0;
	
	.agreement-check {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		padding: 0 12rpx;
		
		.checkbox {
			width: 32rpx;
			height: 32rpx;
			border: 2rpx solid #ddd;
			border-radius: 6rpx;
			margin-right: 12rpx;
			text-align: center;
			line-height: 28rpx;
			font-size: 20rpx;
			color: #fff;
			transition: all 0.3s ease;
			
			&.active {
				background: #007aff;
				border-color: #007aff;
			}
		}
		
		.agreement-text {
			color: #666;
			font-size: 26rpx;
			margin-right: 8rpx;
		}
		
		.agreement-link {
			color: #007aff;
			font-size: 26rpx;
			margin: 0 4rpx;
		}
	}
}

.register-btn {
	width: 100%;
	height: 88rpx;
	background: #007aff;
	border: none;
	border-radius: 16rpx;
	color: white;
	font-size: 32rpx;
	font-weight: 500;
	margin: 32rpx 0;
	box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.2);
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.98);
	}
	
	&:disabled {
		opacity: 0.6;
	}
}

.login-link {
	text-align: right;
	margin-top: 32rpx;
	padding-right: 32rpx;
	
	.login-text {
		color: #666;
		font-size: 28rpx;
	}
	
	.login-action {
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
