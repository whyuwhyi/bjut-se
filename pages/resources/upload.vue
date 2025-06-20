<template>
	<view class="container">
		<view class="upload-form">
			<!-- 文件选择区域 -->
			<view class="file-section">
				<text class="section-title">选择文件 *</text>
				<view class="file-upload-area" @click="chooseFile">
					<view class="upload-content" v-if="!selectedFile">
						<image src="/static/icons/upload.png" class="upload-icon"></image>
						<text class="upload-text">点击选择文件</text>
						<text class="upload-tip">支持PDF、Word、PPT、图片、视频等格式</text>
					</view>
					<view class="file-preview" v-else>
						<image :src="getFileIcon(selectedFile.type)" class="file-icon"></image>
						<view class="file-info">
							<text class="file-name">{{ selectedFile.name }}</text>
							<text class="file-size">{{ formatFileSize(selectedFile.size) }}</text>
						</view>
						<view class="file-actions">
							<text class="change-file" @click.stop="chooseFile">更换</text>
							<text class="remove-file" @click.stop="removeFile">删除</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 基本信息 -->
			<view class="info-section">
				<view class="form-item">
					<text class="form-label">资源标题 *</text>
					<input v-model="formData.title" class="form-input" placeholder="请输入资源标题" maxlength="50" />
					<text class="char-count">{{ formData.title.length }}/50</text>
				</view>

				<view class="form-item">
					<text class="form-label">资源描述</text>
					<textarea 
						v-model="formData.description" 
						class="form-textarea" 
						placeholder="请描述资源内容，帮助其他同学了解..." 
						maxlength="200"
					></textarea>
					<text class="char-count">{{ formData.description.length }}/200</text>
				</view>

				<view class="form-item">
					<text class="form-label">资源分类 *</text>
					<picker @change="onCategoryChange" :value="categoryIndex" :range="categories" range-key="name">
						<view class="picker-view">
							<text class="picker-text">{{ categories[categoryIndex]?.name || '请选择分类' }}</text>
							<image src="/static/icons/arrow-down.png" class="picker-arrow"></image>
						</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">关联课程</text>
					<picker @change="onCourseChange" :value="courseIndex" :range="courses" range-key="name">
						<view class="picker-view">
							<text class="picker-text">{{ courses[courseIndex]?.name || '请选择课程（可选）' }}</text>
							<image src="/static/icons/arrow-down.png" class="picker-arrow"></image>
						</view>
					</picker>
				</view>

				<view class="form-item">
					<text class="form-label">难度等级</text>
					<view class="difficulty-options">
						<view 
							class="difficulty-item" 
							:class="{ active: formData.difficulty === item.value }"
							v-for="(item, index) in difficultyOptions" 
							:key="index"
							@click="selectDifficulty(item.value)"
						>
							{{ item.name }}
						</view>
					</view>
				</view>

				<view class="form-item">
					<text class="form-label">标签</text>
					<view class="tag-input-section">
						<view class="tag-list" v-if="formData.tags.length > 0">
							<view class="tag-item" v-for="(tag, index) in formData.tags" :key="index">
								<text class="tag-text">{{ tag }}</text>
								<image src="/static/icons/close.png" class="tag-remove" @click="removeTag(index)"></image>
							</view>
						</view>
						<view class="tag-input-area">
							<input 
								v-model="tagInput" 
								class="tag-input" 
								placeholder="输入标签，回车添加" 
								@confirm="addTag"
								@blur="addTag"
							/>
							<text class="add-tag-btn" @click="addTag">添加</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 共享设置 -->
			<view class="share-section">
				<text class="section-title">共享设置</text>
				<view class="share-options">
					<view 
						class="share-item" 
						:class="{ active: formData.shareScope === item.value }"
						v-for="(item, index) in shareOptions" 
						:key="index"
						@click="selectShareScope(item.value)"
					>
						<view class="share-icon">
							<image :src="item.icon" class="option-icon"></image>
						</view>
						<view class="share-info">
							<text class="share-name">{{ item.name }}</text>
							<text class="share-desc">{{ item.description }}</text>
						</view>
						<view class="share-radio">
							<image :src="formData.shareScope === item.value ? '/static/icons/radio-checked.png' : '/static/icons/radio-unchecked.png'" class="radio-icon"></image>
						</view>
					</view>
				</view>
			</view>

			<!-- 上传按钮 -->
			<view class="upload-actions">
				<button class="cancel-btn" @click="goBack">取消</button>
				<button class="upload-btn" @click="handleUpload" :loading="uploading" :disabled="!canUpload">
					{{ uploading ? '上传中...' : '确认上传' }}
				</button>
			</view>
		</view>

		<!-- 上传进度弹窗 -->
		<uni-popup ref="progressPopup" type="center" :mask-click="false">
			<view class="progress-modal">
				<text class="progress-title">正在上传</text>
				<view class="progress-info">
					<text class="progress-text">{{ selectedFile?.name }}</text>
					<text class="progress-percent">{{ uploadProgress }}%</text>
				</view>
				<progress :percent="uploadProgress" stroke-width="6" activeColor="#007aff" backgroundColor="#f0f0f0"></progress>
				<view class="progress-actions" v-if="!uploading">
					<button class="progress-btn" @click="hideProgressModal">完成</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedFile: null,
				formData: {
					title: '',
					description: '',
					category: '',
					courseId: '',
					difficulty: '',
					tags: [],
					shareScope: 'public'
				},
				tagInput: '',
				uploading: false,
				uploadProgress: 0,
				categories: [
					{ name: '课件', value: 'courseware' },
					{ name: '笔记', value: 'note' },
					{ name: '习题', value: 'exercise' },
					{ name: '参考资料', value: 'reference' }
				],
				categoryIndex: -1,
				courses: [
					{ name: '数据结构与算法', value: 'data-structure' },
					{ name: '软件工程', value: 'software-engineering' },
					{ name: '计算机网络', value: 'computer-network' },
					{ name: '数据库系统', value: 'database-system' },
					{ name: '操作系统', value: 'operating-system' }
				],
				courseIndex: -1,
				difficultyOptions: [
					{ name: '简单', value: 'easy' },
					{ name: '中等', value: 'medium' },
					{ name: '困难', value: 'hard' }
				],
				shareOptions: [
					{
						name: '公开',
						value: 'public',
						description: '所有用户都可以查看和下载',
						icon: '/static/icons/public.png'
					},
					{
						name: '课程内',
						value: 'course',
						description: '仅选择的课程内用户可见',
						icon: '/static/icons/course.png'
					},
					{
						name: '私有',
						value: 'private',
						description: '仅自己可见',
						icon: '/static/icons/private.png'
					}
				]
			}
		},
		computed: {
			canUpload() {
				return this.selectedFile && 
					   this.formData.title.trim() && 
					   this.formData.category &&
					   !this.uploading
			}
		},
		methods: {
			// 选择文件
			chooseFile() {
				uni.chooseMessageFile({
					count: 1,
					type: 'all',
					success: (res) => {
						const file = res.tempFiles[0]
						if (file.size > 100 * 1024 * 1024) { // 100MB限制
							uni.showToast({
								title: '文件大小不能超过100MB',
								icon: 'none'
							})
							return
						}
						
						this.selectedFile = {
							path: file.path,
							name: file.name,
							size: file.size,
							type: this.getFileType(file.name)
						}
						
						// 如果标题为空，使用文件名作为默认标题
						if (!this.formData.title) {
							this.formData.title = file.name.replace(/\.[^/.]+$/, "")
						}
					},
					fail: (err) => {
						console.error('选择文件失败:', err)
						uni.showToast({
							title: '选择文件失败',
							icon: 'none'
						})
					}
				})
			},

			// 移除文件
			removeFile() {
				this.selectedFile = null
			},

			// 获取文件类型
			getFileType(fileName) {
				const ext = fileName.split('.').pop().toLowerCase()
				return ext
			},

			// 获取文件图标
			getFileIcon(fileType) {
				const iconMap = {
					'pdf': '/static/icons/pdf.png',
					'doc': '/static/icons/doc.png',
					'docx': '/static/icons/doc.png',
					'ppt': '/static/icons/ppt.png',
					'pptx': '/static/icons/ppt.png',
					'zip': '/static/icons/zip.png',
					'rar': '/static/icons/zip.png',
					'jpg': '/static/icons/image.png',
					'png': '/static/icons/image.png',
					'gif': '/static/icons/image.png',
					'mp4': '/static/icons/video.png',
					'avi': '/static/icons/video.png'
				}
				return iconMap[fileType] || '/static/icons/file.png'
			},

			// 格式化文件大小
			formatFileSize(bytes) {
				if (bytes === 0) return '0 B'
				const k = 1024
				const sizes = ['B', 'KB', 'MB', 'GB']
				const i = Math.floor(Math.log(bytes) / Math.log(k))
				return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
			},

			// 分类选择
			onCategoryChange(e) {
				this.categoryIndex = e.detail.value
				this.formData.category = this.categories[this.categoryIndex].value
			},

			// 课程选择
			onCourseChange(e) {
				this.courseIndex = e.detail.value
				this.formData.courseId = this.courses[this.courseIndex].value
			},

			// 选择难度
			selectDifficulty(difficulty) {
				this.formData.difficulty = difficulty
			},

			// 添加标签
			addTag() {
				const tag = this.tagInput.trim()
				if (tag && !this.formData.tags.includes(tag)) {
					if (this.formData.tags.length >= 5) {
						uni.showToast({
							title: '最多添加5个标签',
							icon: 'none'
						})
						return
					}
					this.formData.tags.push(tag)
					this.tagInput = ''
				}
			},

			// 移除标签
			removeTag(index) {
				this.formData.tags.splice(index, 1)
			},

			// 选择共享范围
			selectShareScope(scope) {
				this.formData.shareScope = scope
			},

			// 处理上传
			async handleUpload() {
				if (!this.validateForm()) {
					return
				}

				this.uploading = true
				this.uploadProgress = 0
				this.$refs.progressPopup.open()

				try {
					// 1. 上传文件到云存储
					const fileResult = await this.uploadFileToCloud()
					
					if (!fileResult.success) {
						throw new Error(fileResult.message || '文件上传失败')
					}

					this.uploadProgress = 80

					// 2. 保存资源信息到数据库
					const resourceData = {
						...this.formData,
						fileName: this.selectedFile.name,
						fileSize: this.selectedFile.size,
						fileType: this.selectedFile.type,
						fileUrl: fileResult.fileURL
					}

					const saveResult = await this.saveResourceInfo(resourceData)
					
					if (!saveResult.success) {
						throw new Error(saveResult.message || '保存资源信息失败')
					}

					this.uploadProgress = 100

					uni.showToast({
						title: '上传成功',
						icon: 'success'
					})

					// 延迟跳转，让用户看到成功提示
					setTimeout(() => {
						this.goBack()
					}, 1500)

				} catch (error) {
					console.error('上传失败:', error)
					uni.showToast({
						title: error.message || '上传失败',
						icon: 'none'
					})
				} finally {
					this.uploading = false
				}
			},

			// 上传文件到云存储
			async uploadFileToCloud() {
				return new Promise((resolve, reject) => {
					// 模拟文件上传进度
					let progress = 0
					const progressTimer = setInterval(() => {
						progress += Math.random() * 20
						if (progress > 70) {
							progress = 70
						}
						this.uploadProgress = Math.floor(progress)
					}, 200)

					// 模拟云存储上传
					setTimeout(() => {
						clearInterval(progressTimer)
						this.uploadProgress = 75
						
						// 实际应该调用微信云开发的文件上传API
						wx.cloud.uploadFile({
							cloudPath: `resources/${Date.now()}-${this.selectedFile.name}`,
							filePath: this.selectedFile.path,
							success: (res) => {
								resolve({
									success: true,
									fileURL: res.fileID
								})
							},
							fail: (err) => {
								console.error('云存储上传失败:', err)
								resolve({
									success: false,
									message: '文件上传失败'
								})
							}
						})
					}, 2000)
				})
			},

			// 保存资源信息
			async saveResourceInfo(resourceData) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							resourceId: 'res_' + Date.now()
						})
					}, 500)
				})
			},

			// 表单验证
			validateForm() {
				if (!this.selectedFile) {
					uni.showToast({
						title: '请选择要上传的文件',
						icon: 'none'
					})
					return false
				}

				if (!this.formData.title.trim()) {
					uni.showToast({
						title: '请输入资源标题',
						icon: 'none'
					})
					return false
				}

				if (!this.formData.category) {
					uni.showToast({
						title: '请选择资源分类',
						icon: 'none'
					})
					return false
				}

				return true
			},

			// 隐藏进度弹窗
			hideProgressModal() {
				this.$refs.progressPopup.close()
			},

			// 返回上一页
			goBack() {
				uni.navigateBack()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 20rpx;
		padding-bottom: 40rpx;
	}

	.upload-form {
		.section-title {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
		}
	}

	// 文件选择区域
	.file-section {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;

		.file-upload-area {
			border: 2rpx dashed #ddd;
			border-radius: 12rpx;
			padding: 60rpx 30rpx;
			text-align: center;

			.upload-content {
				.upload-icon {
					width: 80rpx;
					height: 80rpx;
					margin-bottom: 20rpx;
				}

				.upload-text {
					display: block;
					font-size: 28rpx;
					color: #333;
					margin-bottom: 10rpx;
				}

				.upload-tip {
					display: block;
					font-size: 24rpx;
					color: #999;
				}
			}

			.file-preview {
				display: flex;
				align-items: center;
				text-align: left;

				.file-icon {
					width: 60rpx;
					height: 60rpx;
					margin-right: 20rpx;
				}

				.file-info {
					flex: 1;

					.file-name {
						display: block;
						font-size: 28rpx;
						color: #333;
						margin-bottom: 10rpx;
					}

					.file-size {
						font-size: 24rpx;
						color: #666;
					}
				}

				.file-actions {
					display: flex;
					gap: 20rpx;

					.change-file,
					.remove-file {
						font-size: 24rpx;
						color: #007aff;
						padding: 10rpx;
					}

					.remove-file {
						color: #ff3b30;
					}
				}
			}
		}
	}

	// 基本信息区域
	.info-section {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;

		.form-item {
			margin-bottom: 40rpx;
			position: relative;

			&:last-child {
				margin-bottom: 0;
			}

			.form-label {
				display: block;
				font-size: 28rpx;
				color: #333;
				margin-bottom: 20rpx;
				font-weight: 500;
			}

			.form-input,
			.form-textarea {
				width: 100%;
				border: 2rpx solid #e5e5e5;
				border-radius: 12rpx;
				padding: 20rpx;
				font-size: 28rpx;
				color: #333;
				background: #fafafa;

				&:focus {
					border-color: #007aff;
					background: white;
				}
			}

			.form-input {
				height: 80rpx;
			}

			.form-textarea {
				height: 120rpx;
			}

			.char-count {
				position: absolute;
				right: 20rpx;
				bottom: 10rpx;
				font-size: 22rpx;
				color: #999;
			}

			.picker-view {
				display: flex;
				align-items: center;
				height: 80rpx;
				border: 2rpx solid #e5e5e5;
				border-radius: 12rpx;
				padding: 0 20rpx;
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

			.difficulty-options {
				display: flex;
				gap: 20rpx;

				.difficulty-item {
					flex: 1;
					text-align: center;
					padding: 20rpx;
					border: 2rpx solid #e5e5e5;
					border-radius: 12rpx;
					font-size: 26rpx;
					color: #666;

					&.active {
						border-color: #007aff;
						color: #007aff;
						background: #f0f8ff;
					}
				}
			}

			.tag-input-section {
				.tag-list {
					display: flex;
					flex-wrap: wrap;
					gap: 10rpx;
					margin-bottom: 20rpx;

					.tag-item {
						display: flex;
						align-items: center;
						background: #e3f2fd;
						color: #1976d2;
						padding: 8rpx 16rpx;
						border-radius: 16rpx;
						font-size: 24rpx;

						.tag-text {
							margin-right: 8rpx;
						}

						.tag-remove {
							width: 24rpx;
							height: 24rpx;
						}
					}
				}

				.tag-input-area {
					display: flex;
					align-items: center;

					.tag-input {
						flex: 1;
						height: 60rpx;
						border: 2rpx solid #e5e5e5;
						border-radius: 8rpx;
						padding: 0 16rpx;
						font-size: 26rpx;
						margin-right: 20rpx;
					}

					.add-tag-btn {
						color: #007aff;
						font-size: 26rpx;
						padding: 10rpx;
					}
				}
			}
		}
	}

	// 共享设置区域
	.share-section {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;

		.share-options {
			.share-item {
				display: flex;
				align-items: center;
				padding: 30rpx 0;
				border-bottom: 1rpx solid #f0f0f0;

				&:last-child {
					border-bottom: none;
				}

				&.active {
					.share-info {
						.share-name {
							color: #007aff;
						}
					}
				}

				.share-icon {
					margin-right: 20rpx;

					.option-icon {
						width: 48rpx;
						height: 48rpx;
					}
				}

				.share-info {
					flex: 1;

					.share-name {
						display: block;
						font-size: 28rpx;
						color: #333;
						margin-bottom: 8rpx;
					}

					.share-desc {
						font-size: 24rpx;
						color: #666;
					}
				}

				.share-radio {
					.radio-icon {
						width: 32rpx;
						height: 32rpx;
					}
				}
			}
		}
	}

	// 上传按钮
	.upload-actions {
		display: flex;
		gap: 20rpx;
		padding: 0 20rpx;

		.cancel-btn,
		.upload-btn {
			flex: 1;
			height: 88rpx;
			border: none;
			border-radius: 12rpx;
			font-size: 28rpx;
		}

		.cancel-btn {
			background: #f5f5f5;
			color: #666;
		}

		.upload-btn {
			background: #007aff;
			color: white;

			&:disabled {
				background: #ccc;
			}
		}
	}

	// 进度弹窗
	.progress-modal {
		background: white;
		border-radius: 16rpx;
		padding: 40rpx;
		width: 600rpx;

		.progress-title {
			display: block;
			text-align: center;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
		}

		.progress-info {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;

			.progress-text {
				font-size: 26rpx;
				color: #666;
			}

			.progress-percent {
				font-size: 26rpx;
				color: #007aff;
				font-weight: bold;
			}
		}

		.progress-actions {
			text-align: center;
			margin-top: 30rpx;

			.progress-btn {
				width: 200rpx;
				height: 60rpx;
				background: #007aff;
				color: white;
				border: none;
				border-radius: 8rpx;
				font-size: 26rpx;
			}
		}
	}
</style>