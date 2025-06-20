<template>
	<view class="container">
		<view class="register-header">
			<text class="title">用户注册</text>
			<text class="subtitle">加入日新智链学习社区</text>
		</view>

		<view class="register-form">
			<view class="form-item">
				<text class="form-label">学号/工号 *</text>
				<input v-model="formData.studentId" class="form-input" placeholder="请输入学号或工号" />
			</view>

			<view class="form-item">
				<text class="form-label">真实姓名 *</text>
				<input v-model="formData.realName" class="form-input" placeholder="请输入真实姓名" />
			</view>

			<view class="form-item">
				<text class="form-label">用户角色 *</text>
				<picker @change="onRoleChange" :value="roleIndex" :range="roleOptions" range-key="name">
					<view class="picker-view">
						<text class="picker-text">{{ roleOptions[roleIndex].name }}</text>
						<image src="/static/icons/arrow-down.png" class="picker-arrow"></image>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">所属学院</text>
				<picker @change="onCollegeChange" :value="collegeIndex" :range="collegeOptions">
					<view class="picker-view">
						<text class="picker-text">{{ collegeOptions[collegeIndex] || '请选择学院' }}</text>
						<image src="/static/icons/arrow-down.png" class="picker-arrow"></image>
					</view>
				</picker>
			</view>

			<view class="form-item" v-if="formData.role === 'student'">
				<text class="form-label">专业</text>
				<input v-model="formData.major" class="form-input" placeholder="请输入专业" />
			</view>

			<view class="form-item" v-if="formData.role === 'student'">
				<text class="form-label">年级</text>
				<picker @change="onGradeChange" :value="gradeIndex" :range="gradeOptions">
					<view class="picker-view">
						<text class="picker-text">{{ gradeOptions[gradeIndex] || '请选择年级' }}</text>
						<image src="/static/icons/arrow-down.png" class="picker-arrow"></image>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="form-label">邮箱地址 *</text>
				<view class="input-group">
					<input v-model="formData.email" class="form-input flex-1" placeholder="请输入邮箱地址" />
					<button class="verify-btn" @click="sendEmailCode" :disabled="emailCodeSending">
						{{ emailCodeSending ? '发送中...' : (emailCodeSent ? `${emailCountDown}s后重发` : '发送验证码') }}
					</button>
				</view>
			</view>

			<view class="form-item" v-if="emailCodeSent">
				<text class="form-label">邮箱验证码 *</text>
				<input v-model="formData.emailCode" class="form-input" placeholder="请输入邮箱验证码" />
			</view>

			<view class="form-item">
				<text class="form-label">手机号码</text>
				<input v-model="formData.phone" class="form-input" placeholder="请输入手机号码" />
			</view>

			<view class="form-item">
				<text class="form-label">登录密码 *</text>
				<input v-model="formData.password" class="form-input" placeholder="请输入密码（至少6位）" password />
			</view>

			<view class="form-item">
				<text class="form-label">确认密码 *</text>
				<input v-model="formData.confirmPassword" class="form-input" placeholder="请再次输入密码" password />
			</view>

			<view class="agreement">
				<view class="agreement-check" @click="toggleAgreement">
					<image :src="agreedToTerms ? '/static/icons/checked.png' : '/static/icons/unchecked.png'" class="checkbox"></image>
					<text class="agreement-text">我已阅读并同意</text>
				</view>
				<text class="agreement-link" @click="viewTerms">《用户协议》</text>
				<text class="agreement-text">和</text>
				<text class="agreement-link" @click="viewPrivacy">《隐私政策》</text>
			</view>

			<button class="register-btn" @click="handleRegister" :loading="registerLoading">立即注册</button>
			
			<view class="login-link">
				<text>已有账号？</text>
				<text class="link-text" @click="goToLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				formData: {
					studentId: '',
					realName: '',
					role: 'student',
					college: '',
					major: '',
					grade: '',
					email: '',
					emailCode: '',
					phone: '',
					password: '',
					confirmPassword: ''
				},
				roleOptions: [
					{ name: '学生', value: 'student' },
					{ name: '教师', value: 'teacher' }
				],
				roleIndex: 0,
				collegeOptions: [
					'软件学院',
					'计算机学院',
					'信息学院',
					'电子工程学院',
					'机械工程学院',
					'建筑工程学院',
					'材料科学与工程学院',
					'经济管理学院'
				],
				collegeIndex: -1,
				gradeOptions: ['2021级', '2022级', '2023级', '2024级', '2025级'],
				gradeIndex: -1,
				agreedToTerms: false,
				registerLoading: false,
				emailCodeSending: false,
				emailCodeSent: false,
				emailCountDown: 0,
				countDownTimer: null
			}
		},
		methods: {
			// 角色选择
			onRoleChange(e) {
				this.roleIndex = e.detail.value
				this.formData.role = this.roleOptions[this.roleIndex].value
			},

			// 学院选择
			onCollegeChange(e) {
				this.collegeIndex = e.detail.value
				this.formData.college = this.collegeOptions[this.collegeIndex]
			},

			// 年级选择
			onGradeChange(e) {
				this.gradeIndex = e.detail.value
				this.formData.grade = this.gradeOptions[this.gradeIndex]
			},

			// 发送邮箱验证码
			async sendEmailCode() {
				if (!this.formData.email) {
					uni.showToast({
						title: '请输入邮箱地址',
						icon: 'none'
					})
					return
				}

				if (!this.validateEmail(this.formData.email)) {
					uni.showToast({
						title: '邮箱格式不正确',
						icon: 'none'
					})
					return
				}

				this.emailCodeSending = true

				try {
					// 调用云函数发送邮箱验证码
					const result = await this.callSendEmailCodeApi()
					
					if (result.success) {
						this.emailCodeSent = true
						this.startCountDown()
						uni.showToast({
							title: '验证码已发送',
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: result.message || '发送失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('发送邮箱验证码失败:', error)
					uni.showToast({
						title: '发送失败，请重试',
						icon: 'none'
					})
				} finally {
					this.emailCodeSending = false
				}
			},

			// 调用发送邮箱验证码API
			async callSendEmailCodeApi() {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							message: '验证码已发送到您的邮箱'
						})
					}, 1000)
				})
			},

			// 开始倒计时
			startCountDown() {
				this.emailCountDown = 60
				this.countDownTimer = setInterval(() => {
					this.emailCountDown--
					if (this.emailCountDown <= 0) {
						clearInterval(this.countDownTimer)
						this.emailCodeSent = false
					}
				}, 1000)
			},

			// 切换协议同意状态
			toggleAgreement() {
				this.agreedToTerms = !this.agreedToTerms
			},

			// 查看用户协议
			viewTerms() {
				uni.showModal({
					title: '用户协议',
					content: '这里是用户协议的内容...',
					showCancel: false
				})
			},

			// 查看隐私政策
			viewPrivacy() {
				uni.showModal({
					title: '隐私政策',
					content: '这里是隐私政策的内容...',
					showCancel: false
				})
			},

			// 处理注册
			async handleRegister() {
				if (!this.validateForm()) {
					return
				}

				this.registerLoading = true

				try {
					// 调用注册API
					const result = await this.callRegisterApi()
					
					if (result.success) {
						uni.showToast({
							title: '注册成功',
							icon: 'success'
						})
						
						// 跳转到登录页面
						setTimeout(() => {
							uni.redirectTo({
								url: '/pages/login/login'
							})
						}, 1500)
					} else {
						uni.showToast({
							title: result.message || '注册失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('注册错误:', error)
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'none'
					})
				} finally {
					this.registerLoading = false
				}
			},

			// 调用注册API
			async callRegisterApi() {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							message: '注册成功'
						})
					}, 1500)
				})
			},

			// 表单验证
			validateForm() {
				const { studentId, realName, email, emailCode, password, confirmPassword } = this.formData

				if (!studentId.trim()) {
					uni.showToast({
						title: '请输入学号/工号',
						icon: 'none'
					})
					return false
				}

				if (!realName.trim()) {
					uni.showToast({
						title: '请输入真实姓名',
						icon: 'none'
					})
					return false
				}

				if (!email.trim()) {
					uni.showToast({
						title: '请输入邮箱地址',
						icon: 'none'
					})
					return false
				}

				if (!this.validateEmail(email)) {
					uni.showToast({
						title: '邮箱格式不正确',
						icon: 'none'
					})
					return false
				}

				if (!emailCode.trim()) {
					uni.showToast({
						title: '请输入邮箱验证码',
						icon: 'none'
					})
					return false
				}

				if (!password.trim()) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					})
					return false
				}

				if (password.length < 6) {
					uni.showToast({
						title: '密码至少6位',
						icon: 'none'
					})
					return false
				}

				if (password !== confirmPassword) {
					uni.showToast({
						title: '两次密码不一致',
						icon: 'none'
					})
					return false
				}

				if (!this.agreedToTerms) {
					uni.showToast({
						title: '请先同意用户协议',
						icon: 'none'
					})
					return false
				}

				return true
			},

			// 邮箱格式验证
			validateEmail(email) {
				const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				return re.test(email)
			},

			// 跳转到登录页面
			goToLogin() {
				uni.redirectTo({
					url: '/pages/login/login'
				})
			}
		},

		onUnload() {
			// 清除倒计时器
			if (this.countDownTimer) {
				clearInterval(this.countDownTimer)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background: #f8f8f8;
		padding: 40rpx;
	}

	.register-header {
		text-align: center;
		margin-bottom: 60rpx;

		.title {
			display: block;
			font-size: 48rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 20rpx;
		}

		.subtitle {
			display: block;
			font-size: 28rpx;
			color: #666;
		}
	}

	.register-form {
		background: white;
		border-radius: 20rpx;
		padding: 40rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

		.form-item {
			margin-bottom: 40rpx;

			.form-label {
				display: block;
				font-size: 28rpx;
				color: #333;
				margin-bottom: 20rpx;
				font-weight: 500;
			}

			.form-input {
				width: 100%;
				height: 80rpx;
				border: 2rpx solid #e5e5e5;
				border-radius: 12rpx;
				padding: 0 24rpx;
				font-size: 28rpx;
				color: #333;
				background: #fafafa;

				&:focus {
					border-color: #007aff;
					background: white;
				}
			}

			.input-group {
				display: flex;
				align-items: center;
				gap: 20rpx;

				.verify-btn {
					padding: 0 24rpx;
					height: 80rpx;
					background: #007aff;
					color: white;
					border: none;
					border-radius: 12rpx;
					font-size: 24rpx;
					white-space: nowrap;

					&:disabled {
						background: #ccc;
					}
				}
			}

			.picker-view {
				display: flex;
				align-items: center;
				height: 80rpx;
				border: 2rpx solid #e5e5e5;
				border-radius: 12rpx;
				padding: 0 24rpx;
				background: #fafafa;

				.picker-text {
					flex: 1;
					font-size: 28rpx;
					color: #333;
				}

				.picker-arrow {
					width: 24rpx;
					height: 24rpx;
				}
			}
		}

		.agreement {
			display: flex;
			align-items: center;
			margin-bottom: 60rpx;
			font-size: 24rpx;
			flex-wrap: wrap;

			.agreement-check {
				display: flex;
				align-items: center;
				margin-right: 10rpx;

				.checkbox {
					width: 32rpx;
					height: 32rpx;
					margin-right: 12rpx;
				}

				.agreement-text {
					color: #666;
				}
			}

			.agreement-link {
				color: #007aff;
				margin: 0 6rpx;
			}

			.agreement-text {
				color: #666;
			}
		}

		.register-btn {
			width: 100%;
			height: 88rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			border: none;
			border-radius: 44rpx;
			font-size: 32rpx;
			font-weight: bold;
			margin-bottom: 40rpx;
		}

		.login-link {
			text-align: center;
			font-size: 28rpx;
			color: #666;

			.link-text {
				color: #007aff;
				margin-left: 10rpx;
			}
		}
	}
</style>