<template>
	<view class="container">
		<!-- 搜索栏 -->
		<view class="search-section">
			<view class="search-bar">
				<image src="/static/icons/search.png" class="search-icon"></image>
				<input v-model="searchKeyword" class="search-input" placeholder="搜索学习资源..." @confirm="handleSearch" />
				<view class="filter-btn" @click="showFilterModal">
					<image src="/static/icons/filter.png" class="filter-icon"></image>
				</view>
			</view>
		</view>

		<!-- 分类导航 -->
		<view class="category-section">
			<scroll-view class="category-scroll" scroll-x="true">
				<view class="category-list">
					<view 
						class="category-item" 
						:class="{ active: currentCategory === item.value }"
						v-for="(item, index) in categories" 
						:key="index"
						@click="selectCategory(item.value)"
					>
						{{ item.name }}
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 排序选项 -->
		<view class="sort-section">
			<view class="sort-options">
				<view 
					class="sort-item" 
					:class="{ active: currentSort === item.value }"
					v-for="(item, index) in sortOptions" 
					:key="index"
					@click="selectSort(item.value)"
				>
					{{ item.name }}
				</view>
			</view>
		</view>

		<!-- 资源列表 -->
		<view class="resource-section">
			<view class="resource-list" v-if="resources.length > 0">
				<view class="resource-item" v-for="(item, index) in resources" :key="index" @click="viewResource(item)">
					<view class="resource-header">
						<image :src="getFileIcon(item.fileType)" class="file-icon"></image>
						<view class="resource-info">
							<text class="resource-title">{{ item.title }}</text>
							<view class="resource-meta">
								<text class="resource-category">{{ getCategoryName(item.category) }}</text>
								<text class="resource-size">{{ formatFileSize(item.fileSize) }}</text>
							</view>
						</view>
						<view class="resource-actions">
							<view class="action-btn" @click.stop="toggleFavorite(item, index)">
								<image :src="item.isFavorite ? '/static/icons/heart-filled.png' : '/static/icons/heart.png'" class="action-icon"></image>
							</view>
							<view class="action-btn" @click.stop="downloadResource(item)">
								<image src="/static/icons/download.png" class="action-icon"></image>
							</view>
						</view>
					</view>
					
					<view class="resource-description" v-if="item.description">
						<text class="description-text">{{ item.description }}</text>
					</view>
					
					<view class="resource-tags" v-if="item.tags && item.tags.length > 0">
						<text class="tag" v-for="(tag, tagIndex) in item.tags" :key="tagIndex">{{ tag }}</text>
					</view>
					
					<view class="resource-footer">
						<view class="author-info">
							<image :src="item.uploaderAvatar || '/static/images/default-avatar.png'" class="author-avatar"></image>
							<text class="author-name">{{ item.uploaderName }}</text>
						</view>
						<view class="resource-stats">
							<text class="stat-item">{{ item.downloadCount }}下载</text>
							<text class="stat-item">{{ formatTime(item.uploadTime) }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-else>
				<image src="/static/images/empty-resources.png" class="empty-icon"></image>
				<text class="empty-text">暂无资源</text>
				<text class="empty-tip">快来上传第一个资源吧！</text>
			</view>
		</view>

		<!-- 加载更多 -->
		<uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore"></uni-load-more>

		<!-- 悬浮按钮 -->
		<view class="float-btn" @click="uploadResource">
			<image src="/static/icons/add.png" class="float-icon"></image>
		</view>

		<!-- 筛选弹窗 -->
		<uni-popup ref="filterPopup" type="bottom">
			<view class="filter-modal">
				<view class="modal-header">
					<text class="modal-title">筛选条件</text>
					<text class="modal-close" @click="hideFilterModal">完成</text>
				</view>
				
				<view class="filter-content">
					<view class="filter-group">
						<text class="filter-label">文件类型</text>
						<view class="filter-options">
							<text 
								class="filter-option" 
								:class="{ active: selectedFileTypes.includes(item.value) }"
								v-for="(item, index) in fileTypeOptions" 
								:key="index"
								@click="toggleFileType(item.value)"
							>
								{{ item.name }}
							</text>
						</view>
					</view>
					
					<view class="filter-group">
						<text class="filter-label">难度等级</text>
						<view class="filter-options">
							<text 
								class="filter-option" 
								:class="{ active: selectedDifficulties.includes(item.value) }"
								v-for="(item, index) in difficultyOptions" 
								:key="index"
								@click="toggleDifficulty(item.value)"
							>
								{{ item.name }}
							</text>
						</view>
					</view>
				</view>
				
				<view class="filter-actions">
					<button class="reset-btn" @click="resetFilter">重置</button>
					<button class="apply-btn" @click="applyFilter">应用筛选</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchKeyword: '',
				currentCategory: 'all',
				currentSort: 'time',
				categories: [
					{ name: '全部', value: 'all' },
					{ name: '课件', value: 'courseware' },
					{ name: '笔记', value: 'note' },
					{ name: '习题', value: 'exercise' },
					{ name: '参考资料', value: 'reference' }
				],
				sortOptions: [
					{ name: '最新', value: 'time' },
					{ name: '热门', value: 'download' },
					{ name: '评分', value: 'rating' }
				],
				resources: [],
				loadMoreStatus: 'more',
				currentPage: 1,
				pageSize: 10,
				selectedFileTypes: [],
				selectedDifficulties: [],
				fileTypeOptions: [
					{ name: 'PDF', value: 'pdf' },
					{ name: 'Word', value: 'doc' },
					{ name: 'PowerPoint', value: 'ppt' },
					{ name: '图片', value: 'image' },
					{ name: '视频', value: 'video' },
					{ name: '压缩包', value: 'archive' }
				],
				difficultyOptions: [
					{ name: '简单', value: 'easy' },
					{ name: '中等', value: 'medium' },
					{ name: '困难', value: 'hard' }
				]
			}
		},
		onLoad() {
			this.loadResources()
		},
		onPullDownRefresh() {
			this.refreshData()
		},
		onReachBottom() {
			this.loadMore()
		},
		methods: {
			// 加载资源列表
			async loadResources(reset = false) {
				if (reset) {
					this.currentPage = 1
					this.loadMoreStatus = 'more'
				}

				try {
					this.loadMoreStatus = 'loading'
					
					const params = {
						page: this.currentPage,
						pageSize: this.pageSize,
						keyword: this.searchKeyword,
						category: this.currentCategory,
						sort: this.currentSort,
						fileTypes: this.selectedFileTypes,
						difficulties: this.selectedDifficulties
					}
					
					const result = await this.callResourceListApi(params)
					
					if (result.success) {
						if (reset) {
							this.resources = result.data
						} else {
							this.resources.push(...result.data)
						}
						
						this.loadMoreStatus = result.data.length < this.pageSize ? 'noMore' : 'more'
						this.currentPage++
					} else {
						this.loadMoreStatus = 'more'
						uni.showToast({
							title: result.message || '加载失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('加载资源失败:', error)
					this.loadMoreStatus = 'more'
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					})
				}
			},

			// 调用资源列表API
			async callResourceListApi(params) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						const mockData = [
							{
								id: 1,
								title: '数据结构与算法分析课件',
								description: '包含基本数据结构的定义、操作和算法分析',
								category: 'courseware',
								fileType: 'pdf',
								fileSize: 2048576,
								tags: ['数据结构', '算法', '课件'],
								uploaderName: '张教授',
								uploaderAvatar: '',
								downloadCount: 156,
								rating: 4.8,
								uploadTime: new Date('2025-06-15'),
								isFavorite: false
							},
							{
								id: 2,
								title: '机器学习实验代码',
								description: '包含线性回归、决策树等经典算法的Python实现',
								category: 'reference',
								fileType: 'zip',
								fileSize: 5242880,
								tags: ['机器学习', 'Python', '实验'],
								uploaderName: '李同学',
								uploaderAvatar: '',
								downloadCount: 89,
								rating: 4.5,
								uploadTime: new Date('2025-06-14'),
								isFavorite: true
							}
						]
						
						resolve({
							success: true,
							data: mockData
						})
					}, 500)
				})
			},

			// 刷新数据
			async refreshData() {
				await this.loadResources(true)
				uni.stopPullDownRefresh()
			},

			// 加载更多
			loadMore() {
				if (this.loadMoreStatus === 'more') {
					this.loadResources()
				}
			},

			// 搜索
			handleSearch() {
				this.loadResources(true)
			},

			// 选择分类
			selectCategory(category) {
				this.currentCategory = category
				this.loadResources(true)
			},

			// 选择排序
			selectSort(sort) {
				this.currentSort = sort
				this.loadResources(true)
			},

			// 显示筛选弹窗
			showFilterModal() {
				this.$refs.filterPopup.open()
			},

			// 隐藏筛选弹窗
			hideFilterModal() {
				this.$refs.filterPopup.close()
			},

			// 切换文件类型筛选
			toggleFileType(type) {
				const index = this.selectedFileTypes.indexOf(type)
				if (index > -1) {
					this.selectedFileTypes.splice(index, 1)
				} else {
					this.selectedFileTypes.push(type)
				}
			},

			// 切换难度筛选
			toggleDifficulty(difficulty) {
				const index = this.selectedDifficulties.indexOf(difficulty)
				if (index > -1) {
					this.selectedDifficulties.splice(index, 1)
				} else {
					this.selectedDifficulties.push(difficulty)
				}
			},

			// 重置筛选
			resetFilter() {
				this.selectedFileTypes = []
				this.selectedDifficulties = []
			},

			// 应用筛选
			applyFilter() {
				this.hideFilterModal()
				this.loadResources(true)
			},

			// 查看资源详情
			viewResource(resource) {
				uni.navigateTo({
					url: `/pages/resources/detail?id=${resource.id}`
				})
			},

			// 切换收藏状态
			async toggleFavorite(resource, index) {
				try {
					const result = await this.callToggleFavoriteApi(resource.id)
					if (result.success) {
						this.resources[index].isFavorite = !this.resources[index].isFavorite
						uni.showToast({
							title: this.resources[index].isFavorite ? '已收藏' : '已取消收藏',
							icon: 'success'
						})
					}
				} catch (error) {
					console.error('收藏操作失败:', error)
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			},

			// 调用收藏切换API
			async callToggleFavoriteApi(resourceId) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({ success: true })
					}, 300)
				})
			},

			// 下载资源
			async downloadResource(resource) {
				try {
					uni.showLoading({
						title: '准备下载...'
					})
					
					// 调用下载API
					const result = await this.callDownloadApi(resource.id)
					
					if (result.success) {
						// 执行下载
						uni.downloadFile({
							url: result.downloadUrl,
							success: (res) => {
								if (res.statusCode === 200) {
									uni.saveFile({
										tempFilePath: res.tempFilePath,
										success: (saveRes) => {
											uni.showToast({
												title: '下载成功',
												icon: 'success'
											})
										}
									})
								}
							},
							fail: (err) => {
								console.error('下载失败:', err)
								uni.showToast({
									title: '下载失败',
									icon: 'none'
								})
							}
						})
					}
				} catch (error) {
					console.error('下载失败:', error)
					uni.showToast({
						title: '下载失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
				}
			},

			// 调用下载API
			async callDownloadApi(resourceId) {
				// 模拟API调用
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							downloadUrl: 'https://example.com/download/' + resourceId
						})
					}, 500)
				})
			},

			// 上传资源
			uploadResource() {
				uni.navigateTo({
					url: '/pages/resources/upload'
				})
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

			// 获取分类名称
			getCategoryName(categoryValue) {
				const category = this.categories.find(item => item.value === categoryValue)
				return category ? category.name : '其他'
			},

			// 格式化文件大小
			formatFileSize(bytes) {
				if (bytes === 0) return '0 B'
				const k = 1024
				const sizes = ['B', 'KB', 'MB', 'GB']
				const i = Math.floor(Math.log(bytes) / Math.log(k))
				return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
			},

			// 格式化时间
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
	.container {
		padding-bottom: 120rpx;
	}

	// 搜索栏
	.search-section {
		background: white;
		padding: 20rpx;

		.search-bar {
			display: flex;
			align-items: center;
			background: #f5f5f5;
			border-radius: 50rpx;
			padding: 0 30rpx;
			height: 70rpx;

			.search-icon {
				width: 32rpx;
				height: 32rpx;
				margin-right: 20rpx;
			}

			.search-input {
				flex: 1;
				font-size: 28rpx;
				color: #333;
			}

			.filter-btn {
				padding: 10rpx;

				.filter-icon {
					width: 32rpx;
					height: 32rpx;
				}
			}
		}
	}

	// 分类导航
	.category-section {
		background: white;
		border-bottom: 1rpx solid #f0f0f0;

		.category-scroll {
			white-space: nowrap;

			.category-list {
				display: inline-flex;
				padding: 0 20rpx;

				.category-item {
					padding: 20rpx 30rpx;
					font-size: 28rpx;
					color: #666;
					white-space: nowrap;

					&.active {
						color: #007aff;
						font-weight: bold;
						position: relative;

						&::after {
							content: '';
							position: absolute;
							bottom: 0;
							left: 50%;
							transform: translateX(-50%);
							width: 40rpx;
							height: 4rpx;
							background: #007aff;
							border-radius: 2rpx;
						}
					}
				}
			}
		}
	}

	// 排序选项
	.sort-section {
		background: white;
		padding: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;

		.sort-options {
			display: flex;

			.sort-item {
				margin-right: 40rpx;
				font-size: 24rpx;
				color: #666;
				padding: 10rpx 0;

				&.active {
					color: #007aff;
					font-weight: bold;
				}
			}
		}
	}

	// 资源列表
	.resource-section {
		.resource-list {
			.resource-item {
				background: white;
				margin: 20rpx;
				border-radius: 12rpx;
				padding: 30rpx;
				box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);

				.resource-header {
					display: flex;
					align-items: flex-start;
					margin-bottom: 20rpx;

					.file-icon {
						width: 60rpx;
						height: 60rpx;
						margin-right: 20rpx;
					}

					.resource-info {
						flex: 1;

						.resource-title {
							display: block;
							font-size: 32rpx;
							font-weight: bold;
							color: #333;
							margin-bottom: 10rpx;
						}

						.resource-meta {
							display: flex;
							align-items: center;

							.resource-category {
								background: #f0f0f0;
								color: #666;
								padding: 4rpx 12rpx;
								border-radius: 8rpx;
								font-size: 22rpx;
								margin-right: 20rpx;
							}

							.resource-size {
								font-size: 22rpx;
								color: #999;
							}
						}
					}

					.resource-actions {
						display: flex;
						align-items: center;

						.action-btn {
							padding: 10rpx;
							margin-left: 10rpx;

							.action-icon {
								width: 36rpx;
								height: 36rpx;
							}
						}
					}
				}

				.resource-description {
					margin-bottom: 20rpx;

					.description-text {
						font-size: 26rpx;
						color: #666;
						line-height: 1.4;
					}
				}

				.resource-tags {
					margin-bottom: 20rpx;

					.tag {
						display: inline-block;
						background: #e3f2fd;
						color: #1976d2;
						padding: 6rpx 16rpx;
						border-radius: 16rpx;
						font-size: 22rpx;
						margin-right: 16rpx;
						margin-bottom: 10rpx;
					}
				}

				.resource-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;

					.author-info {
						display: flex;
						align-items: center;

						.author-avatar {
							width: 40rpx;
							height: 40rpx;
							border-radius: 50%;
							margin-right: 12rpx;
						}

						.author-name {
							font-size: 24rpx;
							color: #666;
						}
					}

					.resource-stats {
						display: flex;
						align-items: center;

						.stat-item {
							font-size: 22rpx;
							color: #999;
							margin-left: 20rpx;
						}
					}
				}
			}
		}

		.empty-state {
			text-align: center;
			padding: 100rpx 40rpx;

			.empty-icon {
				width: 200rpx;
				height: 200rpx;
				margin-bottom: 40rpx;
			}

			.empty-text {
				display: block;
				font-size: 32rpx;
				color: #666;
				margin-bottom: 20rpx;
			}

			.empty-tip {
				display: block;
				font-size: 26rpx;
				color: #999;
			}
		}
	}

	// 悬浮按钮
	.float-btn {
		position: fixed;
		right: 40rpx;
		bottom: 160rpx;
		width: 100rpx;
		height: 100rpx;
		background: #007aff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
		z-index: 999;

		.float-icon {
			width: 48rpx;
			height: 48rpx;
		}
	}

	// 筛选弹窗
	.filter-modal {
		background: white;
		border-radius: 20rpx 20rpx 0 0;
		padding: 40rpx;
		max-height: 80vh;

		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 40rpx;
			padding-bottom: 20rpx;
			border-bottom: 1rpx solid #f0f0f0;

			.modal-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}

			.modal-close {
				font-size: 28rpx;
				color: #007aff;
			}
		}

		.filter-content {
			.filter-group {
				margin-bottom: 40rpx;

				.filter-label {
					display: block;
					font-size: 28rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 20rpx;
				}

				.filter-options {
					display: flex;
					flex-wrap: wrap;
					gap: 20rpx;

					.filter-option {
						padding: 16rpx 32rpx;
						border: 2rpx solid #e5e5e5;
						border-radius: 24rpx;
						font-size: 26rpx;
						color: #666;

						&.active {
							border-color: #007aff;
							color: #007aff;
							background: #f0f8ff;
						}
					}
				}
			}
		}

		.filter-actions {
			display: flex;
			gap: 20rpx;
			padding-top: 20rpx;
			border-top: 1rpx solid #f0f0f0;

			.reset-btn {
				flex: 1;
				height: 80rpx;
				background: #f5f5f5;
				color: #666;
				border: none;
				border-radius: 12rpx;
				font-size: 28rpx;
			}

			.apply-btn {
				flex: 2;
				height: 80rpx;
				background: #007aff;
				color: white;
				border: none;
				border-radius: 12rpx;
				font-size: 28rpx;
			}
		}
	}
</style>