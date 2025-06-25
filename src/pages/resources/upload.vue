<template>
	<view class="upload-container">
		<view class="upload-form">
			<view class="form-section">
				<text class="section-title">📄 资源信息</text>
				
				<view class="form-item">
					<text class="form-label">资源标题</text>
					<input class="form-input" placeholder="请输入资源标题" v-model="uploadForm.title"/>
				</view>
				
				<view class="form-item">
					<text class="form-label">资源描述</text>
					<textarea class="form-textarea" placeholder="请详细描述资源内容..." v-model="uploadForm.description"></textarea>
				</view>
				
				<view class="form-item">
					<text class="form-label">资源分类</text>
					<picker :value="selectedCategory" :range="categories" @change="categoryChange">
						<view class="picker-view">
							{{ selectedCategory >= 0 ? categories[selectedCategory] : '请选择分类' }}
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="form-label">难度等级</text>
					<picker :value="selectedDifficulty" :range="difficulties" @change="difficultyChange">
						<view class="picker-view">
							{{ selectedDifficulty >= 0 ? difficulties[selectedDifficulty] : '请选择难度' }}
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="form-label">标签</text>
					<view class="tags-input">
						<view class="tag-item" v-for="(tag, index) in uploadForm.tags" :key="index">
							<text class="tag-text">{{ tag }}</text>
							<text class="tag-remove" @click="removeTag(index)">×</text>
						</view>
						<input class="tag-input" placeholder="输入标签后按回车" v-model="newTag" @confirm="addTag"/>
					</view>
				</view>
			</view>

			<view class="form-section">
				<text class="section-title">📎 文件上传</text>
				
				<view class="upload-area" @click="chooseFile">
					<view class="upload-content" v-if="!uploadForm.file">
						<text class="upload-icon">📁</text>
						<text class="upload-text">点击选择文件</text>
						<text class="upload-tips">支持 PDF、DOC、PPT、ZIP 等格式，最大 50MB</text>
					</view>
					<view class="file-info" v-else>
						<text class="file-icon">{{ getFileIcon(uploadForm.file.type) }}</text>
						<text class="file-name">{{ uploadForm.file.name }}</text>
						<text class="file-size">{{ formatFileSize(uploadForm.file.size) }}</text>
					</view>
				</view>
				
				<view class="upload-progress" v-if="uploading">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
					</view>
					<text class="progress-text">{{ uploadProgress }}%</text>
				</view>
			</view>

			<view class="form-section">
				<text class="section-title">⚙️ 权限设置</text>
				
				<view class="permission-item">
					<text class="permission-label">资源可见性</text>
					<radio-group @change="visibilityChange">
						<label class="radio-item">
							<radio value="public" checked/>
							<text>公开 - 所有用户可见</text>
						</label>
						<label class="radio-item">
							<radio value="college"/>
							<text>学院内 - 仅本学院用户可见</text>
						</label>
						<label class="radio-item">
							<radio value="private"/>
							<text>私有 - 仅自己可见</text>
						</label>
					</radio-group>
				</view>
				
				<view class="permission-item">
					<text class="permission-label">下载权限</text>
					<view class="switch-item">
						<text class="switch-label">允许下载</text>
						<switch @change="downloadChange" checked/>
					</view>
					<view class="switch-item">
						<text class="switch-label">需要积分</text>
						<switch @change="pointsChange"/>
						<input class="points-input" placeholder="积分" v-model="uploadForm.requiredPoints" v-if="uploadForm.requirePoints"/>
					</view>
				</view>
			</view>
		</view>

		<view class="action-buttons">
			<button class="preview-btn" @click="previewResource">预览</button>
			<button class="submit-btn" @click="submitUpload" :disabled="uploading">
				{{ uploading ? '上传中...' : '发布资源' }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			uploadForm: {
				title: '',
				description: '',
				category: '',
				difficulty: '',
				tags: [],
				file: null,
				visibility: 'public',
				allowDownload: true,
				requirePoints: false,
				requiredPoints: 0
			},
			categories: ['课件', '作业', '实验', '考试', '项目', '论文', '其他'],
			difficulties: ['入门', '中级', '高级'],
			selectedCategory: -1,
			selectedDifficulty: -1,
			newTag: '',
			uploading: false,
			uploadProgress: 0
		}
	},
	
	methods: {
		categoryChange(e) {
			this.selectedCategory = e.detail.value
			this.uploadForm.category = this.categories[e.detail.value]
		},
		
		difficultyChange(e) {
			this.selectedDifficulty = e.detail.value
			this.uploadForm.difficulty = this.difficulties[e.detail.value]
		},
		
		addTag() {
			if (this.newTag.trim() && !this.uploadForm.tags.includes(this.newTag.trim())) {
				this.uploadForm.tags.push(this.newTag.trim())
				this.newTag = ''
			}
		},
		
		removeTag(index) {
			this.uploadForm.tags.splice(index, 1)
		},
		
		chooseFile() {
			uni.chooseFile({
				count: 1,
				type: 'file',
				success: (res) => {
					const file = res.tempFiles[0]
					if (file.size > 50 * 1024 * 1024) {
						uni.showToast({
							title: '文件大小不能超过50MB',
							icon: 'none'
						})
						return
					}
					
					this.uploadForm.file = {
						name: file.name,
						size: file.size,
						type: file.name.split('.').pop().toLowerCase(),
						path: file.path
					}
				}
			})
		},
		
		visibilityChange(e) {
			this.uploadForm.visibility = e.detail.value
		},
		
		downloadChange(e) {
			this.uploadForm.allowDownload = e.detail.value
		},
		
		pointsChange(e) {
			this.uploadForm.requirePoints = e.detail.value
		},
		
		previewResource() {
			if (!this.validateForm()) {
				return
			}
			
			uni.showModal({
				title: '资源预览',
				content: `标题：${this.uploadForm.title}\n分类：${this.uploadForm.category}\n难度：${this.uploadForm.difficulty}\n描述：${this.uploadForm.description}`,
				showCancel: false
			})
		},
		
		validateForm() {
			const { title, description, category, difficulty, file } = this.uploadForm
			
			if (!title.trim()) {
				uni.showToast({
					title: '请输入资源标题',
					icon: 'none'
				})
				return false
			}
			
			if (!description.trim()) {
				uni.showToast({
					title: '请输入资源描述',
					icon: 'none'
				})
				return false
			}
			
			if (!category) {
				uni.showToast({
					title: '请选择资源分类',
					icon: 'none'
				})
				return false
			}
			
			if (!difficulty) {
				uni.showToast({
					title: '请选择难度等级',
					icon: 'none'
				})
				return false
			}
			
			if (!file) {
				uni.showToast({
					title: '请选择要上传的文件',
					icon: 'none'
				})
				return false
			}
			
			return true
		},
		
		submitUpload() {
			if (!this.validateForm()) {
				return
			}
			
			this.uploading = true
			this.uploadProgress = 0
			
			// 模拟上传进度
			const progressInterval = setInterval(() => {
				this.uploadProgress += Math.random() * 20
				if (this.uploadProgress >= 100) {
					this.uploadProgress = 100
					clearInterval(progressInterval)
					
					setTimeout(() => {
						this.uploading = false
						uni.showModal({
							title: '上传成功',
							content: '您的资源已成功发布，等待审核通过后将对其他用户可见。',
							showCancel: false,
							success: () => {
								uni.navigateBack()
							}
						})
					}, 500)
				}
			}, 200)
		},
		
		getFileIcon(fileType) {
			const iconMap = {
				'pdf': '📄',
				'doc': '📃',
				'docx': '📃',
				'ppt': '📊',
				'pptx': '📊',
				'zip': '🗜️',
				'rar': '🗜️',
				'mp4': '🎥',
				'avi': '🎥'
			}
			return iconMap[fileType] || '📁'
		},
		
		formatFileSize(size) {
			if (size < 1024) {
				return size + 'B'
			} else if (size < 1024 * 1024) {
				return (size / 1024).toFixed(1) + 'KB'
			} else {
				return (size / (1024 * 1024)).toFixed(1) + 'MB'
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.upload-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding: 20rpx;
	padding-bottom: 140rpx;
}

.upload-form {
	.form-section {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		
		.section-title {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
		}
		
		.form-item {
			margin-bottom: 30rpx;
			
			.form-label {
				display: block;
				font-size: 28rpx;
				color: #666;
				margin-bottom: 15rpx;
			}
			
			.form-input, .form-textarea {
				width: 100%;
				padding: 20rpx;
				border: 2rpx solid #e0e0e0;
				border-radius: 10rpx;
				font-size: 28rpx;
				background: #fafafa;
			}
			
			.form-textarea {
				height: 150rpx;
			}
			
			.picker-view {
				padding: 20rpx;
				border: 2rpx solid #e0e0e0;
				border-radius: 10rpx;
				background: #fafafa;
				font-size: 28rpx;
				color: #333;
			}
			
			.tags-input {
				display: flex;
				flex-wrap: wrap;
				align-items: center;
				min-height: 80rpx;
				padding: 15rpx;
				border: 2rpx solid #e0e0e0;
				border-radius: 10rpx;
				background: #fafafa;
				
				.tag-item {
					display: flex;
					align-items: center;
					background: #007aff;
					color: white;
					padding: 8rpx 15rpx;
					border-radius: 20rpx;
					margin: 5rpx;
					font-size: 24rpx;
					
					.tag-remove {
						margin-left: 10rpx;
						font-size: 32rpx;
						font-weight: bold;
					}
				}
				
				.tag-input {
					flex: 1;
					min-width: 150rpx;
					border: none;
					background: transparent;
					font-size: 28rpx;
				}
			}
		}
	}
}

.upload-area {
	border: 4rpx dashed #ccc;
	border-radius: 20rpx;
	padding: 60rpx 30rpx;
	text-align: center;
	background: #fafafa;
	
	.upload-content {
		.upload-icon {
			display: block;
			font-size: 80rpx;
			margin-bottom: 20rpx;
		}
		
		.upload-text {
			display: block;
			font-size: 32rpx;
			color: #666;
			margin-bottom: 15rpx;
		}
		
		.upload-tips {
			font-size: 24rpx;
			color: #999;
		}
	}
	
	.file-info {
		.file-icon {
			display: block;
			font-size: 60rpx;
			margin-bottom: 15rpx;
		}
		
		.file-name {
			display: block;
			font-size: 28rpx;
			color: #333;
			margin-bottom: 10rpx;
		}
		
		.file-size {
			font-size: 24rpx;
			color: #999;
		}
	}
}

.upload-progress {
	margin-top: 30rpx;
	
	.progress-bar {
		height: 8rpx;
		background: #e0e0e0;
		border-radius: 4rpx;
		margin-bottom: 10rpx;
		
		.progress-fill {
			height: 100%;
			background: #007aff;
			border-radius: 4rpx;
			transition: width 0.3s;
		}
	}
	
	.progress-text {
		font-size: 24rpx;
		color: #666;
		text-align: center;
	}
}

.permission-item {
	margin-bottom: 30rpx;
	
	.permission-label {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 20rpx;
	}
	
	.radio-item {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
		font-size: 26rpx;
		color: #333;
		
		radio {
			margin-right: 15rpx;
		}
	}
	
	.switch-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
		
		.switch-label {
			font-size: 26rpx;
			color: #333;
		}
		
		.points-input {
			width: 150rpx;
			padding: 10rpx;
			border: 1rpx solid #ddd;
			border-radius: 8rpx;
			text-align: center;
			font-size: 24rpx;
		}
	}
}

.action-buttons {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	padding: 20rpx;
	background: white;
	border-top: 1rpx solid #e0e0e0;
	
	.preview-btn, .submit-btn {
		flex: 1;
		height: 90rpx;
		border: none;
		border-radius: 45rpx;
		font-size: 32rpx;
		font-weight: bold;
	}
	
	.preview-btn {
		background: #f0f0f0;
		color: #666;
		margin-right: 20rpx;
	}
	
	.submit-btn {
		background: #007aff;
		color: white;
		
		&:disabled {
			background: #ccc;
		}
	}
}
</style>