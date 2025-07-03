<template>
	<view class="create-container">
		<view class="form-section">
			<!-- 标题输入 -->
			<view class="form-item">
				<text class="form-label">标题</text>
				<input 
					class="title-input" 
					placeholder="请输入帖子标题..."
					:value="form.title"
					@input="onTitleInput"
					maxlength="200"
					type="text"
					confirm-type="done"
				/>
				<text class="char-count">{{ form.title.length }}/200</text>
			</view>
			
			<!-- 标签选择 -->
			<view class="form-item">
				<text class="form-label">标签</text>
				<view class="tag-section">
					<view class="selected-tags" v-if="form.tags.length > 0">
						<view 
							class="selected-tag" 
							v-for="(tag, index) in form.tags" 
							:key="index"
							@click="removeTag(index)"
						>
							<text class="tag-text">{{ tag }}</text>
							<text class="tag-remove">✕</text>
						</view>
					</view>
					<view class="tag-input-section">
						<input 
							class="tag-input" 
							placeholder="输入标签名称..." 
							:value="newTag"
							@input="onTagInput"
							@confirm="addTag"
							maxlength="20"
							type="text"
							confirm-type="done"
						/>
						<button class="add-tag-btn" @click="addTag" :disabled="!newTag.trim()">添加</button>
					</view>
					<view class="popular-tags" v-if="popularTags.length > 0">
						<text class="popular-label">热门标签：</text>
						<view class="popular-tag-list">
							<view 
								class="popular-tag" 
								v-for="tag in popularTags" 
								:key="tag.tag_id"
								@click="selectPopularTag(tag.tag_name)"
								:style="{ backgroundColor: tag.tag_color + '20', color: tag.tag_color }"
							>
								<text class="popular-tag-text">{{ tag.tag_name }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 内容编辑器 -->
			<view class="form-item">
				<text class="form-label">内容</text>
				<view class="editor-section">
					<view class="editor-toolbar">
						<view class="toolbar-item" @click="insertFormat('**', '**')">
							<text class="toolbar-text">B</text>
						</view>
						<view class="toolbar-item" @click="insertFormat('*', '*')">
							<text class="toolbar-text">I</text>
						</view>
						<view class="toolbar-item" @click="insertFormat('### ', '')">
							<text class="toolbar-text">H3</text>
						</view>
						<view class="toolbar-item" @click="insertFormat('`', '`')">
							<text class="toolbar-text">Code</text>
						</view>
						<view class="toolbar-item" @click="insertFormat('- ', '')">
							<text class="toolbar-text">List</text>
						</view>
						<view class="preview-toggle" @click="togglePreview">
							<text class="toggle-text">{{ showPreview ? '编辑' : '预览' }}</text>
						</view>
					</view>
					
					<textarea 
						v-if="!showPreview"
						class="content-editor" 
						placeholder="请输入帖子内容，支持Markdown格式..."
						v-model="form.content"
						@focus="onEditorFocus"
						@blur="onEditorBlur"
					></textarea>
					
					<view v-if="showPreview" class="content-preview">
						<view class="preview-content" v-html="renderedContent"></view>
					</view>
				</view>
				<text class="char-count">{{ form.content.length }}/10000</text>
			</view>
		</view>
		
		<!-- 底部操作按钮 -->
		<view class="bottom-actions">
			<button class="cancel-btn" @click="goBack">取消</button>
			<button class="publish-btn" @click="publishPost" :disabled="!canPublish">发布</button>
		</view>
		
		<!-- 加载提示 -->
		<view class="loading-mask" v-if="publishing">
			<view class="loading-content">
				<text class="loading-text">发布中...</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			form: {
				title: '',
				content: '',
				tags: []
			},
			newTag: '',
			popularTags: [],
			showPreview: false,
			publishing: false,
			cursorPosition: 0
		}
	},
	
	computed: {
		canPublish() {
			return this.form.title.trim() && this.form.content.trim() && !this.publishing
		},
		
		renderedContent() {
			// 简单的Markdown渲染，实际使用中可以引入专门的Markdown库
			return this.form.content
				.replace(/### (.*)/g, '<h3>$1</h3>')
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/`(.*?)`/g, '<code>$1</code>')
				.replace(/^- (.*)/gm, '<li>$1</li>')
				.replace(/\n/g, '<br>')
		}
	},
	
	onLoad(options) {
		this.loadPopularTags()
		// 编辑模式下加载原帖内容
		if (options.mode === 'edit' && options.id) {
			this.loadPostDetail(options.id)
		}
	},
	
	methods: {
		onTitleInput(e) {
			// 确保在下一个事件循环中更新值
			setTimeout(() => {
				this.form.title = e.detail.value
			}, 0)
		},
		
		onTagInput(e) {
			// 确保在下一个事件循环中更新值
			setTimeout(() => {
				this.newTag = e.detail.value
			}, 0)
		},
		
		async loadPopularTags() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/posts/tags`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.popularTags = response.data.data.slice(0, 8) // 只显示前8个热门标签
				}
			} catch (error) {
				console.error('加载热门标签失败:', error)
			}
		},
		
		addTag() {
			const tag = this.newTag.trim()
			if (!tag) return
			
			if (this.form.tags.includes(tag)) {
				uni.showToast({
					title: '标签已存在',
					icon: 'none'
				})
				return
			}
			
			if (this.form.tags.length >= 5) {
				uni.showToast({
					title: '最多只能添加5个标签',
					icon: 'none'
				})
				return
			}
			
			this.form.tags.push(tag)
			this.newTag = ''
		},
		
		removeTag(index) {
			this.form.tags.splice(index, 1)
		},
		
		selectPopularTag(tagName) {
			if (this.form.tags.includes(tagName)) {
				uni.showToast({
					title: '标签已存在',
					icon: 'none'
				})
				return
			}
			
			if (this.form.tags.length >= 5) {
				uni.showToast({
					title: '最多只能添加5个标签',
					icon: 'none'
				})
				return
			}
			
			this.form.tags.push(tagName)
		},
		
		insertFormat(before, after) {
			if (this.showPreview) return
			
			const textarea = uni.createSelectorQuery().select('.content-editor')
			// 简单的格式插入，实际使用中需要获取光标位置
			this.form.content += before + '文本' + after
		},
		
		togglePreview() {
			this.showPreview = !this.showPreview
		},
		
		onEditorFocus() {
			// 编辑器获得焦点时的处理
		},
		
		onEditorBlur() {
			// 编辑器失去焦点时的处理
		},
		
		async publishPost() {
			if (!this.canPublish) return
			
			try {
				this.publishing = true
				
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/posts`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						title: this.form.title.trim(),
						content: this.form.content.trim(),
						tags: this.form.tags
					}
				})
				
				if (response.statusCode === 201 && response.data.success) {
					uni.showToast({
						title: '发布成功',
						icon: 'success'
					})
					
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					uni.showToast({
						title: response.data.message || '发布失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('发布帖子失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			} finally {
				this.publishing = false
			}
		},
		
		goBack() {
			if (this.form.title.trim() || this.form.content.trim()) {
				uni.showModal({
					title: '确认离开',
					content: '有未保存的内容，确定要离开吗？',
					success: (res) => {
						if (res.confirm) {
							uni.navigateBack()
						}
					}
				})
			} else {
				uni.navigateBack()
			}
		},
		
		async loadPostDetail(postId) {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({ title: '请先登录', icon: 'none' })
					return
				}
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/posts/${postId}`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				if (response.statusCode === 200 && response.data.success) {
					const post = response.data.data
					this.form.title = post.title || ''
					this.form.content = post.content || ''
					this.form.tags = (post.tags || []).map(tag => tag.tag_name)
				} else {
					uni.showToast({ title: '加载原帖失败', icon: 'none' })
				}
			} catch (error) {
				uni.showToast({ title: '加载原帖失败', icon: 'none' })
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.create-container {
	min-height: 100vh;
	padding: 20rpx;
	padding-bottom: 160rpx;
	background-color: #f5f5f5;
}

.form-section {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	margin: 0 auto;
	width: 100%;
	box-sizing: border-box;
}

.form-item {
	margin-bottom: 30rpx;
	
	.form-label {
		display: block;
		font-size: 28rpx;
		color: #666;
		margin-bottom: 15rpx;
	}
	
	.title-input {
		width: 100%;
		height: 80rpx;
		padding: 20rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		font-size: 28rpx;
		background: #fafafa;
		box-sizing: border-box;
	}
	
	.char-count {
		font-size: 22rpx;
		color: #999;
		text-align: right;
		display: block;
		margin-top: 8rpx;
	}
}

.tag-section {
	width: 100%;
	
	.selected-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
		margin-bottom: 20rpx;
		
		.selected-tag {
			display: flex;
			align-items: center;
			background: #007aff;
			color: white;
			padding: 8rpx 16rpx;
			border-radius: 20rpx;
			
			.tag-text {
				font-size: 24rpx;
				margin-right: 8rpx;
			}
			
			.tag-remove {
				font-size: 20rpx;
				font-weight: bold;
			}
		}
	}
	
	.tag-input-section {
		display: flex;
		gap: 15rpx;
		margin-bottom: 20rpx;
		
		.tag-input {
			flex: 1;
			height: 70rpx;
			border: 1rpx solid #e0e0e0;
			border-radius: 8rpx;
			padding: 15rpx;
			font-size: 26rpx;
			background: #fafafa;
			box-sizing: border-box;
		}
		
		.add-tag-btn {
			height: 70rpx;
			line-height: 70rpx;
			background: #007aff;
			color: white;
			border: none;
			border-radius: 8rpx;
			padding: 0 30rpx;
			font-size: 26rpx;
			
			&[disabled] {
				background: #ccc;
			}
		}
	}
	
	.popular-tags {
		.popular-label {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 15rpx;
			display: block;
		}
		
		.popular-tag-list {
			display: flex;
			flex-wrap: wrap;
			gap: 10rpx;
			
			.popular-tag {
				padding: 8rpx 16rpx;
				border-radius: 20rpx;
				
				.popular-tag-text {
					font-size: 22rpx;
				}
			}
		}
	}
}

.editor-section {
	width: 100%;
	box-sizing: border-box;
	
	.editor-toolbar {
		display: flex;
		align-items: center;
		border-bottom: 1rpx solid #e0e0e0;
		padding-bottom: 15rpx;
		margin-bottom: 15rpx;
		gap: 15rpx;
		width: 100%;
		box-sizing: border-box;
		overflow-x: auto;
		
		.toolbar-item {
			padding: 8rpx 12rpx;
			background: #f8f8f8;
			border-radius: 6rpx;
			
			.toolbar-text {
				font-size: 22rpx;
				color: #666;
				font-weight: bold;
			}
		}
		
		.preview-toggle {
			margin-left: auto;
			padding: 8rpx 16rpx;
			background: #007aff;
			border-radius: 6rpx;
			
			.toggle-text {
				font-size: 22rpx;
				color: white;
			}
		}
	}
	
	.content-editor {
		width: 100%;
		min-height: 400rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		padding: 20rpx;
		font-size: 26rpx;
		line-height: 1.5;
		resize: none;
		box-sizing: border-box;
		background: #fafafa;
	}
	
	.content-preview {
		width: 100%;
		min-height: 400rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		padding: 20rpx;
		box-sizing: border-box;
		background: #fafafa;
		
		.preview-content {
			font-size: 26rpx;
			line-height: 1.5;
			color: #333;
			width: 100%;
			box-sizing: border-box;
			word-wrap: break-word;
		}
	}
}

.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	padding: 20rpx;
	border-top: 1rpx solid #e0e0e0;
	display: flex;
	gap: 20rpx;
	
	.cancel-btn {
		flex: 1;
		background: #f8f8f8;
		color: #666;
		border: none;
		border-radius: 50rpx;
		padding: 25rpx;
		font-size: 28rpx;
	}
	
	.publish-btn {
		flex: 2;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 50rpx;
		padding: 25rpx;
		font-size: 28rpx;
		
		&[disabled] {
			background: #ccc;
		}
	}
}

.loading-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	
	.loading-content {
		background: white;
		padding: 40rpx;
		border-radius: 20rpx;
		
		.loading-text {
			font-size: 28rpx;
			color: #333;
		}
	}
}
</style>