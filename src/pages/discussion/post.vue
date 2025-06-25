<template>
	<view class="post-container">
		<!-- 发布类型选择 -->
		<view class="post-type-section">
			<view class="type-tabs">
				<view 
					class="type-tab" 
					:class="{ active: postType === 'discussion' }"
					@click="changePostType('discussion')"
				>
					<text class="tab-icon">💬</text>
					<text class="tab-text">讨论</text>
				</view>
				<view 
					class="type-tab" 
					:class="{ active: postType === 'question' }"
					@click="changePostType('question')"
				>
					<text class="tab-icon">❓</text>
					<text class="tab-text">提问</text>
				</view>
				<view 
					class="type-tab" 
					:class="{ active: postType === 'share' }"
					@click="changePostType('share')"
				>
					<text class="tab-icon">📝</text>
					<text class="tab-text">分享</text>
				</view>
			</view>
		</view>

		<!-- 发布表单 -->
		<view class="post-form">
			<!-- 标题输入 -->
			<view class="form-item">
				<view class="form-label">
					<text class="label-text">标题</text>
					<text class="label-required">*</text>
				</view>
				<input 
					class="title-input" 
					:placeholder="titlePlaceholder"
					v-model="postData.title"
					:maxlength="100"
				/>
				<view class="char-count">{{ postData.title.length }}/100</view>
			</view>

			<!-- 内容输入 -->
			<view class="form-item">
				<view class="form-label">
					<text class="label-text">内容</text>
					<text class="label-required">*</text>
				</view>
				<textarea 
					class="content-input" 
					:placeholder="contentPlaceholder"
					v-model="postData.content"
					:maxlength="2000"
					:auto-height="true"
				></textarea>
				<view class="char-count">{{ postData.content.length }}/2000</view>
			</view>

			<!-- 图片上传 -->
			<view class="form-item">
				<view class="form-label">
					<text class="label-text">图片</text>
					<text class="label-optional">(最多9张)</text>
				</view>
				<view class="image-upload-area">
					<view class="uploaded-images">
						<view 
							class="image-item" 
							v-for="(image, index) in postData.images" 
							:key="index"
						>
							<image class="uploaded-image" :src="image" mode="aspectFill"></image>
							<view class="remove-image" @click="removeImage(index)">×</view>
						</view>
						
						<view 
							class="upload-btn" 
							v-if="postData.images.length < 9"
							@click="chooseImages"
						>
							<text class="upload-icon">📷</text>
							<text class="upload-text">添加图片</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 附件上传 -->
			<view class="form-item">
				<view class="form-label">
					<text class="label-text">附件</text>
					<text class="label-optional">(最多3个)</text>
				</view>
				<view class="attachment-area">
					<view class="attached-files">
						<view 
							class="file-item" 
							v-for="(file, index) in postData.attachments" 
							:key="index"
						>
							<text class="file-icon">📎</text>
							<view class="file-info">
								<text class="file-name">{{ file.name }}</text>
								<text class="file-size">{{ formatFileSize(file.size) }}</text>
							</view>
							<view class="remove-file" @click="removeAttachment(index)">×</view>
						</view>
					</view>
					
					<button 
						class="attach-btn" 
						v-if="postData.attachments.length < 3"
						@click="chooseFile"
					>
						<text class="attach-icon">📎</text>
						<text class="attach-text">添加附件</text>
					</button>
				</view>
			</view>

			<!-- 话题标签 -->
			<view class="form-item">
				<view class="form-label">
					<text class="label-text">话题标签</text>
					<text class="label-optional">(最多5个)</text>
				</view>
				<view class="tags-area">
					<!-- 已添加的标签 -->
					<view class="added-tags">
						<view 
							class="tag-item" 
							v-for="(tag, index) in postData.tags" 
							:key="index"
						>
							<text class="tag-text"># {{ tag }}</text>
							<text class="remove-tag" @click="removeTag(index)">×</text>
						</view>
					</view>
					
					<!-- 标签输入 -->
					<view class="tag-input-area" v-if="postData.tags.length < 5">
						<input 
							class="tag-input" 
							placeholder="输入标签后按确定"
							v-model="newTag"
							@confirm="addTag"
							:maxlength="20"
						/>
					</view>
					
					<!-- 推荐标签 -->
					<view class="recommended-tags">
						<text class="recommend-label">推荐标签：</text>
						<view class="recommend-tag-list">
							<text 
								class="recommend-tag" 
								v-for="(tag, index) in recommendedTags" 
								:key="index"
								@click="addRecommendedTag(tag)"
							>
								# {{ tag }}
							</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 匿名选项 -->
			<view class="form-item">
				<view class="anonymous-option" @click="toggleAnonymous">
					<view class="option-checkbox" :class="{ checked: postData.isAnonymous }">
						<text class="checkbox-icon" v-if="postData.isAnonymous">✓</text>
					</view>
					<text class="option-text">匿名发布</text>
					<text class="option-desc">选择匿名后，其他用户将看不到你的真实身份</text>
				</view>
			</view>

			<!-- 发布按钮 -->
			<view class="submit-section">
				<button class="draft-btn" @click="saveDraft">保存草稿</button>
				<button class="submit-btn" @click="submitPost" :disabled="!canSubmit">
					{{ postType === 'question' ? '发布提问' : '发布讨论' }}
				</button>
			</view>
		</view>

		<!-- 发布提示 -->
		<view class="tips-section">
			<view class="tips-header">
				<text class="tips-title">💡 发布建议</text>
			</view>
			<view class="tips-content">
				<text class="tip-item" v-for="(tip, index) in currentTips" :key="index">
					• {{ tip }}
				</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			postType: 'discussion', // discussion, question, share
			postData: {
				title: '',
				content: '',
				images: [],
				attachments: [],
				tags: [],
				isAnonymous: false
			},
			newTag: '',
			recommendedTags: ['学习方法', '编程', '数据结构', '算法', '数据库', '前端', '后端', '实习', '求职', '考研'],
			discussionTips: [
				'提供详细的背景信息有助于获得更好的回复',
				'使用相关的话题标签让更多人看到你的讨论',
				'保持友善和尊重的交流氛围',
				'分享你的想法和经验'
			],
			questionTips: [
				'清楚地描述你遇到的问题',
				'提供相关的错误信息或截图',
				'说明你已经尝试过的解决方法',
				'选择合适的标签让专业人士看到'
			],
			shareTips: [
				'分享有价值的学习资源或经验',
				'提供详细的使用方法或心得',
				'添加相关图片让内容更生动',
				'欢迎其他人的讨论和补充'
			]
		}
	},
	
	computed: {
		titlePlaceholder() {
			const placeholders = {
				discussion: '简洁明确地描述你想讨论的话题...',
				question: '简洁明确地描述你的问题...',
				share: '简洁明确地描述你要分享的内容...'
			}
			return placeholders[this.postType]
		},
		
		contentPlaceholder() {
			const placeholders = {
				discussion: '详细说明你的观点、想法或要讨论的内容...',
				question: '详细描述问题的具体情况，包括相关背景信息...',
				share: '详细介绍你要分享的内容，包括使用方法或心得体会...'
			}
			return placeholders[this.postType]
		},
		
		currentTips() {
			const tips = {
				discussion: this.discussionTips,
				question: this.questionTips,
				share: this.shareTips
			}
			return tips[this.postType]
		},
		
		canSubmit() {
			return this.postData.title.trim() && this.postData.content.trim()
		}
	},
	
	onLoad(options) {
		if (options.type) {
			this.postType = options.type
		}
		this.loadDraft()
	},
	
	methods: {
		changePostType(type) {
			this.postType = type
		},
		
		chooseImages() {
			const maxCount = 9 - this.postData.images.length
			uni.chooseImage({
				count: maxCount,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.postData.images.push(...res.tempFilePaths)
				}
			})
		},
		
		removeImage(index) {
			this.postData.images.splice(index, 1)
		},
		
		chooseFile() {
			uni.showToast({
				title: '文件选择功能开发中',
				icon: 'none'
			})
		},
		
		removeAttachment(index) {
			this.postData.attachments.splice(index, 1)
		},
		
		addTag() {
			const tag = this.newTag.trim()
			if (!tag) return
			
			if (this.postData.tags.includes(tag)) {
				uni.showToast({
					title: '标签已存在',
					icon: 'none'
				})
				return
			}
			
			if (this.postData.tags.length >= 5) {
				uni.showToast({
					title: '最多添加5个标签',
					icon: 'none'
				})
				return
			}
			
			this.postData.tags.push(tag)
			this.newTag = ''
		},
		
		addRecommendedTag(tag) {
			if (this.postData.tags.includes(tag)) {
				uni.showToast({
					title: '标签已存在',
					icon: 'none'
				})
				return
			}
			
			if (this.postData.tags.length >= 5) {
				uni.showToast({
					title: '最多添加5个标签',
					icon: 'none'
				})
				return
			}
			
			this.postData.tags.push(tag)
		},
		
		removeTag(index) {
			this.postData.tags.splice(index, 1)
		},
		
		toggleAnonymous() {
			this.postData.isAnonymous = !this.postData.isAnonymous
		},
		
		saveDraft() {
			try {
				uni.setStorageSync('discussionDraft', this.postData)
				uni.showToast({
					title: '草稿已保存',
					icon: 'success'
				})
			} catch (error) {
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			}
		},
		
		loadDraft() {
			try {
				const draft = uni.getStorageSync('discussionDraft')
				if (draft) {
					// 询问是否恢复草稿
					uni.showModal({
						title: '发现草稿',
						content: '检测到未发布的草稿，是否恢复？',
						success: (res) => {
							if (res.confirm) {
								this.postData = { ...draft }
							}
						}
					})
				}
			} catch (error) {
				console.error('加载草稿失败:', error)
			}
		},
		
		clearDraft() {
			try {
				uni.removeStorageSync('discussionDraft')
			} catch (error) {
				console.error('清除草稿失败:', error)
			}
		},
		
		submitPost() {
			if (!this.canSubmit) {
				uni.showToast({
					title: '请完善标题和内容',
					icon: 'none'
				})
				return
			}
			
			uni.showLoading({ title: '发布中...' })
			
			// 模拟发布过程
			setTimeout(() => {
				uni.hideLoading()
				
				// 清除草稿
				this.clearDraft()
				
				uni.showToast({
					title: '发布成功',
					icon: 'success'
				})
				
				// 返回讨论列表
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			}, 2000)
		},
		
		formatFileSize(bytes) {
			if (bytes === 0) return '0 B'
			const k = 1024
			const sizes = ['B', 'KB', 'MB', 'GB']
			const i = Math.floor(Math.log(bytes) / Math.log(k))
			return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
		}
	},
	
	onUnload() {
		// 页面卸载时自动保存草稿
		if (this.postData.title.trim() || this.postData.content.trim()) {
			this.saveDraft()
		}
	}
}
</script>

<style lang="scss" scoped>
.post-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.post-type-section {
	background: white;
	padding: 30rpx;
	
	.type-tabs {
		display: flex;
		background: #f8f8f8;
		border-radius: 15rpx;
		padding: 8rpx;
		
		.type-tab {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 20rpx;
			border-radius: 10rpx;
			transition: all 0.3s;
			
			&.active {
				background: white;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			}
			
			.tab-icon {
				font-size: 32rpx;
				margin-bottom: 8rpx;
			}
			
			.tab-text {
				font-size: 24rpx;
				color: #333;
			}
		}
	}
}

.post-form {
	.form-item {
		background: white;
		margin: 20rpx 0;
		padding: 30rpx;
		
		.form-label {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;
			
			.label-text {
				font-size: 28rpx;
				font-weight: bold;
				color: #333;
			}
			
			.label-required {
				color: #ff3b30;
				margin-left: 8rpx;
			}
			
			.label-optional {
				font-size: 22rpx;
				color: #666;
				margin-left: 8rpx;
			}
		}
		
		.title-input {
			width: 100%;
			padding: 20rpx;
			background: #f8f8f8;
			border-radius: 12rpx;
			font-size: 28rpx;
			margin-bottom: 10rpx;
		}
		
		.content-input {
			width: 100%;
			min-height: 200rpx;
			padding: 20rpx;
			background: #f8f8f8;
			border-radius: 12rpx;
			font-size: 26rpx;
			line-height: 1.5;
			margin-bottom: 10rpx;
		}
		
		.char-count {
			text-align: right;
			font-size: 22rpx;
			color: #999;
		}
	}
}

.image-upload-area {
	.uploaded-images {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		
		.image-item {
			position: relative;
			width: 200rpx;
			height: 200rpx;
			
			.uploaded-image {
				width: 100%;
				height: 100%;
				border-radius: 12rpx;
			}
			
			.remove-image {
				position: absolute;
				top: -10rpx;
				right: -10rpx;
				width: 40rpx;
				height: 40rpx;
				background: #ff3b30;
				color: white;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 24rpx;
			}
		}
		
		.upload-btn {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 200rpx;
			height: 200rpx;
			background: #f8f8f8;
			border: 2rpx dashed #ccc;
			border-radius: 12rpx;
			
			.upload-icon {
				font-size: 48rpx;
				margin-bottom: 10rpx;
				color: #999;
			}
			
			.upload-text {
				font-size: 24rpx;
				color: #666;
			}
		}
	}
}

.attachment-area {
	.attached-files {
		margin-bottom: 20rpx;
		
		.file-item {
			display: flex;
			align-items: center;
			padding: 20rpx;
			background: #f8f8f8;
			border-radius: 12rpx;
			margin-bottom: 15rpx;
			
			.file-icon {
				font-size: 32rpx;
				margin-right: 15rpx;
			}
			
			.file-info {
				flex: 1;
				
				.file-name {
					display: block;
					font-size: 26rpx;
					color: #333;
					margin-bottom: 5rpx;
				}
				
				.file-size {
					font-size: 22rpx;
					color: #666;
				}
			}
			
			.remove-file {
				width: 32rpx;
				height: 32rpx;
				background: #ff3b30;
				color: white;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 20rpx;
			}
		}
	}
	
	.attach-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 20rpx;
		background: #f8f8f8;
		border: 2rpx dashed #ccc;
		border-radius: 12rpx;
		color: #666;
		
		.attach-icon {
			font-size: 24rpx;
			margin-right: 10rpx;
		}
		
		.attach-text {
			font-size: 26rpx;
		}
	}
}

.tags-area {
	.added-tags {
		display: flex;
		flex-wrap: wrap;
		margin-bottom: 20rpx;
		
		.tag-item {
			display: flex;
			align-items: center;
			padding: 8rpx 16rpx;
			background: #e3f2fd;
			color: #1976d2;
			border-radius: 20rpx;
			margin-right: 15rpx;
			margin-bottom: 15rpx;
			
			.tag-text {
				font-size: 24rpx;
			}
			
			.remove-tag {
				margin-left: 10rpx;
				font-size: 20rpx;
				width: 24rpx;
				height: 24rpx;
				background: rgba(255, 255, 255, 0.5);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
	}
	
	.tag-input-area {
		margin-bottom: 20rpx;
		
		.tag-input {
			width: 100%;
			padding: 15rpx 20rpx;
			background: #f8f8f8;
			border-radius: 25rpx;
			font-size: 26rpx;
		}
	}
	
	.recommended-tags {
		.recommend-label {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 15rpx;
		}
		
		.recommend-tag-list {
			display: flex;
			flex-wrap: wrap;
			
			.recommend-tag {
				padding: 8rpx 16rpx;
				background: #f0f0f0;
				color: #666;
				border-radius: 20rpx;
				font-size: 22rpx;
				margin-right: 15rpx;
				margin-bottom: 10rpx;
			}
		}
	}
}

.anonymous-option {
	display: flex;
	align-items: flex-start;
	
	.option-checkbox {
		width: 36rpx;
		height: 36rpx;
		border: 2rpx solid #ccc;
		border-radius: 6rpx;
		margin-right: 15rpx;
		margin-top: 2rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		
		&.checked {
			background: #007aff;
			border-color: #007aff;
			
			.checkbox-icon {
				color: white;
				font-size: 20rpx;
			}
		}
	}
	
	.option-text {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 8rpx;
	}
	
	.option-desc {
		font-size: 22rpx;
		color: #666;
		line-height: 1.4;
	}
}

.submit-section {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	
	.draft-btn, .submit-btn {
		flex: 1;
		height: 80rpx;
		border-radius: 40rpx;
		font-size: 28rpx;
		border: none;
	}
	
	.draft-btn {
		background: #f0f0f0;
		color: #666;
	}
	
	.submit-btn {
		background: #007aff;
		color: white;
		
		&:disabled {
			background: #ccc;
		}
	}
}

.tips-section {
	background: white;
	margin: 20rpx 0;
	padding: 30rpx;
	
	.tips-header {
		margin-bottom: 20rpx;
		
		.tips-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
		}
	}
	
	.tips-content {
		.tip-item {
			display: block;
			font-size: 24rpx;
			color: #666;
			line-height: 1.6;
			margin-bottom: 10rpx;
		}
	}
}
</style>