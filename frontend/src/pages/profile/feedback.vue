<template>
	<view class="feedback-container">
		<!-- 右上角我的反馈按钮 -->
		<view class="my-feedback-btn" @click="showFeedbackDialog = true">
			<text class="btn-text">我的反馈</text>
		</view>
		<!-- 反馈类型选择 -->
		<view class="feedback-type">
			<text class="section-title">反馈类型</text>
			<view class="type-grid">
				<view class="type-item" 
					v-for="(type, index) in feedbackTypes" 
					:key="index"
					:class="{ 'active': selectedType === type.key }"
					@click="selectType(type.key)">
					<text class="type-icon">{{ type.icon }}</text>
					<text class="type-name">{{ type.name }}</text>
				</view>
			</view>
		</view>

		<!-- 反馈内容 -->
		<view class="feedback-content">
			<text class="section-title">详细描述</text>
			<view class="content-form">
				<textarea 
					class="feedback-textarea"
					v-model="feedbackContent"
					:placeholder="getPlaceholder()"
					:maxlength="500"
					show-confirm-bar="false">
				</textarea>
				<view class="char-count">
					<text class="count-text">{{ feedbackContent.length }}/500</text>
				</view>
			</view>
		</view>

		<!-- 图片上传 -->
		<view class="image-upload">
			<text class="section-title">上传图片（可选）</text>
			<view class="upload-area">
				<view class="image-list">
					<view class="image-item" v-for="(image, index) in uploadedImages" :key="index">
						<image class="uploaded-image" :src="image" mode="aspectFill"></image>
						<view class="delete-btn" @click="deleteImage(index)">
							<text class="delete-icon">×</text>
						</view>
					</view>
					<view class="upload-btn" v-if="uploadedImages.length < 3" @click="uploadImage">
						<text class="upload-icon">📷</text>
						<text class="upload-text">添加图片</text>
					</view>
				</view>
				<text class="upload-tip">最多可上传3张图片，每张不超过5MB</text>
			</view>
		</view>

		<!-- 联系方式 -->
		<view class="contact-info">
			<text class="section-title">联系方式（可选）</text>
			<view class="contact-form">
				<input 
					class="contact-input"
					v-model="contactInfo"
					placeholder="请输入邮箱或手机号，方便我们与您联系"
					:maxlength="50">
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-section">
			<view class="submit-btn" :class="{ 'disabled': !canSubmit }" @click="submitFeedback">
				<text class="submit-text">提交反馈</text>
			</view>
		</view>

		<!-- 弹窗：我的反馈记录 -->
		<view v-if="showFeedbackDialog" class="feedback-dialog-mask" @click.self="showFeedbackDialog = false">
			<view class="feedback-dialog">
				<view class="dialog-header">
					<text class="dialog-title">我的反馈记录</text>
					<text class="dialog-close" @click="showFeedbackDialog = false">×</text>
				</view>
				<view class="dialog-list">
					<view v-if="recentFeedback.length === 0" class="dialog-empty">暂无反馈记录</view>
					<view v-for="(item, idx) in recentFeedback" :key="idx" class="dialog-item">
						<view class="dialog-type">{{ getFeedbackTypeName(item.type) }}</view>
						<view class="dialog-content">{{ item.content }}</view>
						<view class="dialog-time">{{ formatTime(item.created_at) }}</view>
						<view class="dialog-status">{{ getStatusText(item.status) }}</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			selectedType: '',
			feedbackContent: '',
			contactInfo: '',
			uploadedImages: [],
			feedbackTypes: [
				{ key: 'bug', name: 'Bug反馈', icon: '🐛' },
				{ key: 'feature', name: '功能建议', icon: '💡' },
				{ key: 'ui', name: '界面问题', icon: '🎨' },
				{ key: 'performance', name: '性能问题', icon: '⚡' },
				{ key: 'content', name: '内容建议', icon: '📝' },
				{ key: 'other', name: '其他问题', icon: '❓' }
			],
			recentFeedback: [],
			showFeedbackDialog: false
		}
	},
	
	computed: {
		canSubmit() {
			return this.selectedType && this.feedbackContent.trim().length >= 10
		}
	},
	
	onLoad() {
		this.loadRecentFeedback()
	},
	
	methods: {
		async loadRecentFeedback() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/feedback/my`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${uni.getStorageSync('token')}`
					}
				})
				
				if (response.data.success) {
					this.recentFeedback = response.data.data || []
				}
			} catch (error) {
				console.error('加载反馈历史失败:', error)
				this.recentFeedback = []
			}
		},
		
		selectType(typeKey) {
			this.selectedType = typeKey
		},
		
		getPlaceholder() {
			const placeholders = {
				'bug': '请详细描述遇到的问题，包括操作步骤、错误现象等...',
				'feature': '请描述您希望添加的功能特性和使用场景...',
				'ui': '请描述界面上的问题，如布局错乱、显示异常等...',
				'performance': '请描述性能问题，如加载缓慢、卡顿现象等...',
				'content': '请描述对内容的建议，如资源质量、分类优化等...',
				'other': '请详细描述您遇到的问题或建议...'
			}
			return placeholders[this.selectedType] || '请详细描述您的问题或建议...'
		},
		
		uploadImage() {
			const remain = 3 - this.uploadedImages.length
			if (remain <= 0) return
			uni.chooseImage({
				count: remain,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePaths = res.tempFilePaths
					tempFilePaths.forEach(filePath => {
						uni.getFileInfo({
							filePath,
							success: (fileInfo) => {
								if (fileInfo.size > 5 * 1024 * 1024) {
									uni.showToast({ title: '图片大小不能超过5MB', icon: 'none' })
									return
								}
								// 上传到后端通用图片接口
								uni.uploadFile({
									url: `${this.$config.apiBaseUrl}/files/upload-image`,
									filePath,
									name: 'file',
									header: {
										'Authorization': `Bearer ${uni.getStorageSync('token')}`
									},
									success: (uploadRes) => {
										let data = uploadRes.data
										if (typeof data === 'string') {
											try { data = JSON.parse(data) } catch (e) { data = {} }
										}
										if (data.success && data.url) {
											let url = data.url
											if (!/^https?:/.test(url)) {
												url = 'http://localhost:3000' + url
											}
											this.uploadedImages.push(url)
											this.$forceUpdate && this.$forceUpdate()
										} else {
											uni.showToast({ title: '图片上传失败', icon: 'none' })
										}
									},
									fail: () => {
										uni.showToast({ title: '图片上传失败', icon: 'none' })
									}
								})
							}
						})
					})
				}
			})
		},
		
		deleteImage(index) {
			this.uploadedImages.splice(index, 1)
		},
		
		async submitFeedback() {
			if (!this.canSubmit) {
				uni.showToast({
					title: '请完善反馈信息（至少10个字）',
					icon: 'none'
				})
				return
			}
			
			uni.showLoading({
				title: '提交中...'
			})
			
			try {
				// 模拟提交反馈
				const feedbackData = {
					type: this.selectedType,
					content: this.feedbackContent,
					contact: this.contactInfo,
					images: this.uploadedImages
				}
				
				// 调用真实API
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/feedback`,
					method: 'POST',
					data: feedbackData,
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${uni.getStorageSync('token')}`
					}
				})
				
				if (!response.data.success) {
					throw new Error(response.data.message || '提交失败')
				}
				
				uni.hideLoading()
				uni.showModal({
					title: '提交成功',
					content: '感谢您的反馈！我们会认真处理您的建议，并在3个工作日内给出回复。',
					showCancel: false,
					success: () => {
						this.resetForm()
						this.loadRecentFeedback()
					}
				})
			} catch (error) {
				uni.hideLoading()
				console.error('提交反馈失败:', error)
				uni.showToast({
					title: '提交失败，请重试',
					icon: 'none'
				})
			}
		},
		
		resetForm() {
			this.selectedType = ''
			this.feedbackContent = ''
			this.contactInfo = ''
			this.uploadedImages = []
		},
		
		viewAllFeedback() {
			uni.navigateTo({
				url: './feedback-history'
			})
		},
		
		viewFeedbackDetail(feedback) {
			uni.navigateTo({
				url: `./feedback-detail?id=${feedback.id}`
			})
		},
		
		getFeedbackTypeName(typeKey) {
			const type = this.feedbackTypes.find(t => t.key === typeKey)
			return type ? type.name : '未知类型'
		},
		
		getStatusText(status) {
			const statusMap = {
				'pending': '待处理',
				'processing': '处理中',
				'resolved': '已解决',
				'closed': '已关闭'
			}
			return statusMap[status] || '未知状态'
		},
		
		formatTime(time) {
			if (!time) return '未知时间'
			let date = time
			if (typeof time === 'string' || typeof time === 'number') {
				date = new Date(time)
			}
			if (!(date instanceof Date) || isNaN(date.getTime())) {
				return '时间格式错误'
			}
			// 转为北京时间
			const pad = n => n < 10 ? '0' + n : n
			const year = date.getFullYear()
			const month = pad(date.getMonth() + 1)
			const day = pad(date.getDate())
			const hour = pad(date.getHours())
			const min = pad(date.getMinutes())
			return `${year}-${month}-${day} ${hour}:${min}`
		}
	}
}
</script>

<style lang="scss" scoped>
.feedback-container {
	min-height: 100vh;
	padding: 30rpx;
	padding-bottom: 160rpx;
	position: relative;
}

.my-feedback-btn {
	position: absolute;
	top: 30rpx;
	right: 40rpx;
	z-index: 20;
	background: #007aff;
	color: #fff;
	border-radius: 30rpx;
	padding: 16rpx 36rpx;
	font-size: 28rpx;
	font-weight: bold;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
	cursor: pointer;
}

.feedback-dialog-mask {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(0,0,0,0.25);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
}
.feedback-dialog {
	background: #fff;
	border-radius: 20rpx;
	width: 80vw;
	max-width: 600rpx;
	max-height: 70vh;
	overflow-y: auto;
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.18);
	padding: 0 0 30rpx 0;
}
.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx 30rpx 10rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}
.dialog-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}
.dialog-close {
	font-size: 40rpx;
	color: #999;
	cursor: pointer;
}
.dialog-list {
	padding: 20rpx 30rpx 0 30rpx;
}
.dialog-item {
	margin-bottom: 24rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.dialog-type {
	font-size: 26rpx;
	color: #007aff;
	margin-bottom: 6rpx;
}
.dialog-content {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 6rpx;
}
.dialog-time {
	font-size: 22rpx;
	color: #999;
	display: inline-block;
	margin-right: 18rpx;
}
.dialog-status {
	font-size: 22rpx;
	color: #666;
	display: inline-block;
}
.dialog-empty {
	text-align: center;
	color: #aaa;
	font-size: 28rpx;
	margin: 40rpx 0;
}

.feedback-form {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.section-title {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin: 40rpx 30rpx 20rpx;
}

.feedback-type {
	margin: 20rpx;
	
	.type-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 15rpx;
		
		.type-item {
			background: white;
			border-radius: 15rpx;
			padding: 30rpx 20rpx;
			text-align: center;
			border: 3rpx solid transparent;
			
			&.active {
				border-color: #007aff;
				background: #f0f8ff;
			}
			
			.type-icon {
				display: block;
				font-size: 48rpx;
				margin-bottom: 10rpx;
			}
			
			.type-name {
				font-size: 24rpx;
				color: #333;
			}
		}
	}
}

.feedback-content {
	margin: 20rpx;
	
	.content-form {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		position: relative;
		
		.feedback-textarea {
			width: 100%;
			min-height: 200rpx;
			font-size: 28rpx;
			color: #333;
			line-height: 1.6;
		}
		
		.char-count {
			text-align: right;
			margin-top: 15rpx;
			
			.count-text {
				font-size: 24rpx;
				color: #999;
			}
		}
	}
}

.image-upload {
	margin: 20rpx;
	
	.upload-area {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		
		.image-list {
			display: flex;
			flex-wrap: wrap;
			gap: 15rpx;
			margin-bottom: 20rpx;
			
			.image-item {
				position: relative;
				width: 150rpx;
				height: 150rpx;
				
				.uploaded-image {
					width: 100%;
					height: 100%;
					border-radius: 10rpx;
				}
				
				.delete-btn {
					position: absolute;
					top: -10rpx;
					right: -10rpx;
					width: 40rpx;
					height: 40rpx;
					background: #ff3b30;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					
					.delete-icon {
						color: white;
						font-size: 28rpx;
						line-height: 1;
					}
				}
			}
			
			.upload-btn {
				width: 150rpx;
				height: 150rpx;
				border: 2rpx dashed #ddd;
				border-radius: 10rpx;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				
				.upload-icon {
					font-size: 48rpx;
					margin-bottom: 10rpx;
				}
				
				.upload-text {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
		
		.upload-tip {
			font-size: 24rpx;
			color: #999;
		}
	}
}

.contact-info {
	margin: 20rpx;
	
	.contact-form {
		background: white;
		border-radius: 15rpx;
		padding: 30rpx;
		
		.contact-input {
			width: 100%;
			font-size: 28rpx;
			color: #333;
		}
	}
}

.submit-section {
	margin: 40rpx 20rpx 20rpx;
	
	.submit-btn {
		background: #007aff;
		border-radius: 30rpx;
		padding: 30rpx;
		text-align: center;
		
		&.disabled {
			background: #ccc;
		}
		
		.submit-text {
			font-size: 32rpx;
			color: white;
			font-weight: bold;
		}
	}
}
</style>