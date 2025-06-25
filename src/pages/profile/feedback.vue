<template>
	<view class="feedback-container">
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

		<!-- 历史反馈 -->
		<view class="feedback-history">
			<view class="history-header">
				<text class="section-title">我的反馈</text>
				<text class="view-all" @click="viewAllFeedback">查看全部</text>
			</view>
			<view class="history-list">
				<view class="history-item" v-for="(item, index) in recentFeedback" :key="index" @click="viewFeedbackDetail(item)">
					<view class="history-content">
						<text class="history-type">{{ getFeedbackTypeName(item.type) }}</text>
						<text class="history-text">{{ item.content }}</text>
						<text class="history-time">{{ formatTime(item.createTime) }}</text>
					</view>
					<view class="history-status" :class="'status-' + item.status">
						<text class="status-text">{{ getStatusText(item.status) }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-section">
			<view class="submit-btn" :class="{ 'disabled': !canSubmit }" @click="submitFeedback">
				<text class="submit-text">提交反馈</text>
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
			recentFeedback: []
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
				// 模拟加载最近的反馈记录
				this.recentFeedback = [
					{
						id: 1,
						type: 'bug',
						content: '登录时偶尔会出现卡顿现象',
						status: 'resolved',
						createTime: new Date('2025-06-18 10:30:00')
					},
					{
						id: 2,
						type: 'feature',
						content: '希望能增加夜间模式功能',
						status: 'processing',
						createTime: new Date('2025-06-15 14:20:00')
					}
				]
			} catch (error) {
				console.error('加载反馈历史失败:', error)
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
			uni.chooseImage({
				count: 3 - this.uploadedImages.length,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const tempFilePaths = res.tempFilePaths
					
					// 检查文件大小
					tempFilePaths.forEach(filePath => {
						uni.getFileInfo({
							filePath: filePath,
							success: (fileInfo) => {
								if (fileInfo.size > 5 * 1024 * 1024) {
									uni.showToast({
										title: '图片大小不能超过5MB',
										icon: 'none'
									})
									return
								}
								
								this.uploadedImages.push(filePath)
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
					title: '请完善反馈信息',
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
				
				console.log('提交反馈:', feedbackData)
				
				// 模拟API调用
				await new Promise(resolve => setTimeout(resolve, 2000))
				
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
			const now = new Date()
			const diff = now - time
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return hours > 0 ? `${hours}小时前` : '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return time.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.feedback-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
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

.feedback-history {
	margin: 20rpx;
	background: white;
	border-radius: 15rpx;
	padding: 30rpx;
	
	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
		
		.view-all {
			font-size: 26rpx;
			color: #007aff;
		}
	}
	
	.history-list {
		.history-item {
			display: flex;
			align-items: center;
			padding: 20rpx 0;
			border-bottom: 1rpx solid #f0f0f0;
			
			&:last-child {
				border-bottom: none;
			}
			
			.history-content {
				flex: 1;
				
				.history-type {
					display: block;
					font-size: 24rpx;
					color: #007aff;
					margin-bottom: 8rpx;
				}
				
				.history-text {
					display: block;
					font-size: 28rpx;
					color: #333;
					margin-bottom: 8rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				
				.history-time {
					font-size: 22rpx;
					color: #999;
				}
			}
			
			.history-status {
				padding: 8rpx 20rpx;
				border-radius: 20rpx;
				
				&.status-pending {
					background: #fff3cd;
					
					.status-text {
						color: #856404;
					}
				}
				
				&.status-processing {
					background: #cce5ff;
					
					.status-text {
						color: #0066cc;
					}
				}
				
				&.status-resolved {
					background: #d4edda;
					
					.status-text {
						color: #155724;
					}
				}
				
				.status-text {
					font-size: 22rpx;
				}
			}
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