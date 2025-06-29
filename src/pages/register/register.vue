<template>
	<view class="register-container">
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
					<text class="icon\"></text>
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
				const studentIdPattern = /^(\\d{8}|S\\d{9})$/
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
				const emailPattern = /^[^\s@]+@[^\s@]+\\.[^\s@]+$/
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
					uni.showModal({
						title: '注册成功',
						content: '欢迎加入日新智链学习社区！请使用手机号登录。',
						showCancel: false,
						success: () => {
							uni.navigateBack()
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
					url: `this.$config.apiBaseUrl + '/users/register`,
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

<style lang="scss" scoped>
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

/* 新增背景渐变动画 (与登录页面一致) */
@keyframes backgroundPan {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.register-container {
	min-height: 100vh;
	background-image: linear-gradient(135deg, #A8BFFF 0%, #88A6E0 100%); /* 与登录页面一致的柔和蓝色渐变 */
	background-size: 400% 400%; /* 使背景足够大以便移动 */
	animation: backgroundPan 15s ease infinite; /* 应用动画 */
	padding: 40rpx;
}

.register-header {
	text-align: center;
	margin-bottom: 50rpx;
	padding-top: 40rpx;
	
	.title {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: white;
		margin-bottom: 10rpx;
	}
	
	.subtitle {
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.8);
	}
}

.register-form {
	.form-item {
		margin-bottom: 40rpx;
		
		&.required::before {
			content: "*";
			color: #ff6b6b;
			font-size: 32rpx;
			font-weight: bold;
			position: absolute;
			margin-left: -20rpx;
			margin-top: 35rpx;
		}
		
		.form-label {
			display: flex;
			align-items: center;
			background: rgba(255, 255, 255, 0.95);
			border-radius: 50rpx;
			padding: 0 30rpx;
			border: none;
			box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
			transition: all 0.3s ease;
			
			&:focus-within {
				box-shadow: 0 15rpx 45rpx rgba(0, 0, 0, 0.2);
				transform: translateY(-5rpx) scale(1.01);
			}
			
			.icon {
				font-size: 36rpx;
				margin-right: 25rpx;
				color: #88A6E0;
			}
			
			.form-input {
				flex: 1;
				height: 110rpx;
				font-size: 32rpx;
				color: #333;
				
				&::placeholder {
					color: #A0A0A0;
				}
			}
		}
		
		.field-tip {
			display: block;
			font-size: 24rpx;
			color: rgba(255, 255, 255, 0.9);
			margin-top: 15rpx;
			padding-left: 35rpx;
			line-height: 1.6;
		}
	}
	
	.agreement {
		margin-bottom: 40rpx;
		
		.agreement-check {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			
			.checkbox {
				width: 32rpx;
				height: 32rpx;
				border: 2rpx solid rgba(255, 255, 255, 0.6);
				border-radius: 6rpx;
				margin-right: 15rpx;
				text-align: center;
				line-height: 28rpx;
				font-size: 20rpx;
				color: white;
				
				&.active {
					background: rgba(255, 255, 255, 0.2);
				}
			}
			
			.agreement-text {
				color: rgba(255, 255, 255, 0.8);
				font-size: 26rpx;
			}
			
			.agreement-link {
				color: #ffd93d;
				font-size: 26rpx;
				text-decoration: underline;
				margin: 0 5rpx;
			}
		}
	}
	
	.register-btn {
		width: 100%;
		height: 100rpx;
		background: linear-gradient(45deg, #4ecdc4, #44a08d);
		border: none;
		border-radius: 50rpx;
		color: white;
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 30rpx;
		box-shadow: 0 10rpx 30rpx rgba(78, 205, 196, 0.3);
		
		&:disabled {
			opacity: 0.6;
		}
	}
	
	.login-link {
		text-align: center;
		margin-bottom: 40rpx;
		
		.login-text {
			color: rgba(255, 255, 255, 0.8);
			font-size: 28rpx;
		}
		
		.login-action {
			color: #ffd93d;
			font-size: 28rpx;
			font-weight: bold;
		}
	}
}
</style>
