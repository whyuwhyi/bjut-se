<template>
	<view class="upload-container">
		<view class="upload-form">
			<view class="form-section">
				<text class="section-title">📄 资源信息</text>
				
				<view class="form-item">
					<text class="form-label">资源标题</text>
					<uni-easyinput
						class="form-input"
						placeholder="请输入资源标题"
						v-model="uploadForm.title"
						trim="true"
					/>
				</view>
				
				<view class="form-item">
					<text class="form-label">资源描述</text>
					<textarea 
						class="form-textarea" 
						placeholder="请详细描述资源内容..." 
						v-model="uploadForm.description"
					></textarea>
				</view>
				
				<view class="form-item">
					<text class="form-label">资源分类</text>
					<picker :value="selectedCategory" :range="categoryNames" @change="categoryChange">
						<view class="picker-view">
							{{ selectedCategory >= 0 ? categoryNames[selectedCategory] : '请选择分类' }}
						</view>
					</picker>
				</view>
				
				
			</view>

			<view class="form-section">
				<text class="section-title">📎 文件上传</text>
				
				<view class="upload-area" @click="chooseFile">
					<view class="upload-content" v-if="!uploadForm.file">
						<text class="upload-icon">📁</text>
						<text class="upload-text">点击选择文件</text>
						<text class="upload-tips">支持以下格式，最大 100MB</text>
						<view class="file-type-list">
							<text class="file-type-category">📄 文档类：</text>
							<text class="file-type-items">PDF、DOC、DOCX、XLS、XLSX、PPT、PPTX、TXT</text>
							
							<text class="file-type-category">🗜️ 压缩包：</text>
							<text class="file-type-items">ZIP、RAR</text>
							
							<text class="file-type-category">🖼️ 图片：</text>
							<text class="file-type-items">JPEG、PNG、GIF</text>
							
							<text class="file-type-category">🎵 音频：</text>
							<text class="file-type-items">MP3、WAV、OGG</text>
							
							<text class="file-type-category">🎬 视频：</text>
							<text class="file-type-items">MP4、AVI、MKV</text>
						</view>
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
	components: {
		'uni-easyinput': () => import('@dcloudio/uni-ui/lib/uni-easyinput/uni-easyinput.vue')
	},
	data() {
		return {
			uploadForm: {
				title: '',
				description: '',
				category: '',
				categoryId: '',
				file: null
			},
			categories: [],
			selectedCategory: -1,
			uploading: false,
			uploadProgress: 0
		}
	},
	
	computed: {
		categoryNames() {
			return this.categories.map(cat => cat.name)
		}
	},
	
	onLoad() {
		this.loadCategories()
	},
	
	methods: {
		// 加载分类列表
		async loadCategories() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/categories/options`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.categories = response.data.data
					console.log('分类数据', this.categories)
					// 自动选中第一个分类
					if (this.categories.length > 0 && this.selectedCategory === -1) {
						this.selectedCategory = 0
						const selectedCat = this.categories[0]
						this.uploadForm.category = selectedCat.name
						this.uploadForm.categoryId = String(selectedCat.category_id || '')
						console.log('自动选中分类', selectedCat, 'categoryId:', this.uploadForm.categoryId)
					}
				}
			} catch (error) {
				console.error('加载分类失败:', error)
			}
		},
		
		categoryChange(e) {
			this.selectedCategory = e.detail.value
			const selectedCat = this.categories[e.detail.value]
			this.uploadForm.category = selectedCat.name
			this.uploadForm.categoryId = String(selectedCat.category_id || '')
			console.log('手动选择分类', selectedCat, 'categoryId:', this.uploadForm.categoryId)
		},
		
		chooseFile() {
			uni.chooseFile({
				count: 1,
				type: 'file',
				success: (res) => {
					const file = res.tempFiles[0]
					if (file.size > 100 * 1024 * 1024) {
						uni.showToast({
							title: '文件大小不能超过100MB',
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
		
		previewResource() {
			if (!this.validateForm()) {
				return
			}
			
			uni.showModal({
				title: '资源预览',
				content: `标题：${this.uploadForm.title}\n分类：${this.uploadForm.category}\n描述：${this.uploadForm.description}`,
				showCancel: false
			})
		},
		
		validateForm() {
			const { title, description, category, file, categoryId } = this.uploadForm
			
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
			
			if (!category || !categoryId) {
				uni.showToast({
					title: '请选择资源分类',
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
		
		async submitUpload() {
			if (!this.validateForm()) {
				return
			}
			console.log('上传数据', {
				resource_name: this.uploadForm.title,
				description: this.uploadForm.description,
				categoryId: this.uploadForm.categoryId
			})
			try {
				this.uploading = true
				this.uploadProgress = 0
				
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				// 1. 创建资源记录
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						resource_name: this.uploadForm.title,
						description: this.uploadForm.description,
						category_id: this.uploadForm.categoryId
					}
				})
				
				if (response.statusCode !== 201 || !response.data.success) {
					throw new Error(response.data.message || '创建资源失败')
				}
				
				const resourceId = response.data.data.resource_id
				this.uploadProgress = 30
				
				// 2. 上传文件
				await this.uploadFiles(resourceId)
				this.uploadProgress = 90
				
				// 3. 提交审核
				this.submitForReview(resourceId)
				
			} catch (error) {
				console.error('上传失败:', error)
				this.uploading = false
				uni.showToast({
					title: error.message || '上传失败',
					icon: 'none'
				})
			}
		},
		
		async submitForReview(resourceId) {
			try {
				const token = uni.getStorageSync('token')
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${resourceId}/submit-review`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				this.uploadProgress = 100
				
				setTimeout(() => {
					this.uploading = false
					uni.showModal({
						title: '上传成功',
						content: response.data.message || '您的资源已成功发布，等待审核通过后将对其他用户可见。',
						showCancel: false,
						success: () => {
							uni.navigateBack()
						}
					})
				}, 500)
				
			} catch (error) {
				console.error('提交审核失败:', error)
				this.uploading = false
				uni.showToast({
					title: '提交审核失败',
					icon: 'none'
				})
			}
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
		},
		
		// 真实文件上传
		async uploadFiles(resourceId) {
			if (!this.uploadForm.file) {
				return
			}
			
			const file = this.uploadForm.file
			const token = uni.getStorageSync('token')
			const uploadTask = uni.uploadFile({
				url: `${this.$config.apiBaseUrl}/files/upload`,
				filePath: file.path,
				name: 'file',
				formData: {
					resource_id: resourceId,
					file_name: file.name,
					file_type: file.type
				},
				header: {
					'Authorization': `Bearer ${token}`
				}
			})
			
			// 兼容H5和小程序/APP
			await new Promise((resolve, reject) => {
				if (uploadTask && typeof uploadTask.onSuccess === 'function') {
					// 小程序/APP端
					uploadTask.onSuccess((res) => {
						const data = JSON.parse(res.data)
						if (data.success) {
							resolve(data)
						} else {
							reject(new Error(data.message || '文件上传失败'))
						}
					})
					uploadTask.onFail((err) => {
						reject(new Error('文件上传失败'))
					})
				} else if (uploadTask && typeof uploadTask.then === 'function') {
					// H5端
					uploadTask.then(res => {
						const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
						if (data.success) {
							resolve(data)
						} else {
							reject(new Error(data.message || '文件上传失败'))
						}
					}).catch(() => {
						reject(new Error('文件上传失败'))
					})
				} else {
					reject(new Error('文件上传失败'))
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.upload-container {
	min-height: 100vh;
	padding: 30rpx;
	padding-bottom: 160rpx;
}

.upload-form {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		width: 100%;
		box-sizing: border-box;
		
	.form-section {
		width: 100%;
		box-sizing: border-box;
		
		.section-title {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
		}
		
		.form-item {
			margin-bottom: 36rpx;
			width: 100%;
			box-sizing: border-box;
			
			.form-label {
				display: block;
				font-size: 30rpx;
				color: #333;
				margin-bottom: 16rpx;
				font-weight: 500;
			}
			
			.form-input, .form-textarea {
				width: 100%;
				padding: 24rpx;
				border: 2rpx solid #e0e0e0;
				border-radius: 12rpx;
				font-size: 32rpx;
				background: #ffffff;
				box-sizing: border-box;
				
				&:focus {
					border-color: #007aff;
					background: #ffffff;
					box-shadow: 0 0 0 2rpx rgba(0,122,255,0.1);
				}
			}
			
			.form-textarea {
				height: 200rpx;
				resize: none;
			}
			
			.picker-view {
				padding: 20rpx;
				border: 2rpx solid #e0e0e0;
				border-radius: 10rpx;
				background: #fafafa;
				font-size: 28rpx;
				color: #333;
				width: 100%;
				box-sizing: border-box;
			}
			
			.tags-section {
				.selected-tags {
					display: flex;
					flex-wrap: wrap;
					margin-bottom: 20rpx;
					
					.tag-item {
						display: flex;
						align-items: center;
						background: #007aff;
						color: white;
						padding: 8rpx 15rpx;
						border-radius: 20rpx;
						margin: 5rpx 10rpx 5rpx 0;
						font-size: 24rpx;
						
						.tag-remove {
							margin-left: 10rpx;
							font-size: 32rpx;
							font-weight: bold;
						}
					}
				}
				
				.tag-actions {
					display: flex;
					align-items: center;
					justify-content: space-between;
					
					.select-tag-btn {
						background: #f0f0f0;
						color: #333;
						border: 2rpx solid #e0e0e0;
						border-radius: 10rpx;
						padding: 15rpx 30rpx;
						font-size: 26rpx;
					}
					
					.tag-count {
						font-size: 24rpx;
						color: #666;
					}
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
			margin-bottom: 20rpx;
		}
		
		.file-type-list {
			text-align: left;
			background: #f8f9fa;
			padding: 20rpx;
			border-radius: 10rpx;
			margin-top: 15rpx;
			
			.file-type-category {
				display: block;
				font-size: 22rpx;
				font-weight: bold;
				color: #007aff;
				margin: 10rpx 0 5rpx 0;
			}
			
			.file-type-category:first-child {
				margin-top: 0;
			}
			
			.file-type-items {
				display: block;
				font-size: 20rpx;
				color: #666;
				line-height: 1.5;
				margin-bottom: 8rpx;
			}
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