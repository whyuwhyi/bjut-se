<template>
	<view class="resources-container">
		<!-- 顶部搜索和筛选区域 -->
		<view class="top-section">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input class="search-input" placeholder="搜索学习资源..." v-model="searchKeyword" @input="handleSearch"/>
			</view>
			
			<!-- 分类筛选 -->
			<view class="category-filter" v-if="categories.length > 0">
				<scroll-view class="category-scroll" scroll-x="true">
					<view class="category-list">
						<view 
							class="category-item" 
							:class="{ active: selectedCategoryIndex === -1 }"
							@click="selectCategory(-1)"
						>
							<text class="category-text">全部</text>
						</view>
						<view 
							class="category-item" 
							:class="{ active: selectedCategoryIndex === index }"
							v-for="(category, index) in categories" 
							:key="category.category_id"
							@click="selectCategory(index)"
						>
							<text class="category-text">{{ category.category_name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
			
			<!-- 排序选择 -->
			<view class="sort-section">
				<picker :value="selectedSortIndex" :range="sortNames" @change="sortChange">
					<view class="sort-picker">
						<text class="sort-text">{{ sortNames[selectedSortIndex] }}</text>
						<text class="sort-icon">▼</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 资源列表 -->
		<view class="resources-list">
			<view 
				class="resource-item" 
				v-for="(item, index) in resources" 
				:key="index"
				@click="viewResource(item)"
			>
				<view class="resource-header">
					<view class="file-preview">
						<image class="thumbnail-image" :src="item.thumbnail" mode="aspectFill"></image>
						<text class="file-type-overlay">{{ getFileIcon(item.fileType) }}</text>
					</view>
					<view class="resource-info">
						<text class="resource-title">{{ item.title }}</text>
						<view class="resource-tags">
							<text class="tag">{{ item.category }}</text>
						</view>
					</view>
				</view>
				
				<view class="resource-meta">
					<view class="meta-info">
						<text class="author">👤 {{ item.uploaderName }}</text>
						<text class="upload-time">🕒 {{ formatTime(item.uploadTime) }}</text>
					</view>
					<view class="resource-stats">
						<text class="stat-item">👁️ {{ item.viewCount }}</text>
						<text class="stat-item">⬇️ {{ item.downloadCount }}</text>
						<text class="stat-item">⭐ {{ item.rating }}</text>
						<text class="stat-item">❤️ {{ item.favoriteCount || item.collection_count || 0 }}</text>
					</view>
				</view>
				
				<view class="resource-description">
					<text class="description-text">{{ item.description }}</text>
				</view>
			</view>
		</view>

		<!-- 上传按钮 -->
		<view class="upload-btn" @click="goToUpload">
			<image class="upload-icon" src="/static/icons/upload.png" mode="aspectFit"></image>
		</view>

		<view class="load-more" v-if="hasMore && !loading">
			<button class="load-more-btn" @click="loadResources()">加载更多</button>
		</view>

	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKeyword: '',
			currentSort: 'latest',
			categories: [],
			sortOptions: [
				{ label: '最新上传', value: 'latest' },
				{ label: '下载最多', value: 'download' },
				{ label: '评分最高', value: 'rating' },
				{ label: '浏览最多', value: 'view' }
			],
			selectedCategoryIndex: -1,
			selectedSortIndex: 0,
			resources: [],
			page: 1,
			limit: 6,
			hasMore: true,
			loading: false
		}
	},
	
	computed: {
		sortNames() {
			return this.sortOptions.map(sort => sort.label)
		}
	},
	
	onLoad() {
		this.loadCategories()
		this.loadResources()
	},
	
	onShow() {
		// 页面显示时重新加载资源列表，确保收藏状态同步
		this.loadResources()
	},
	
	methods: {
		// 加载分类列表
		async loadCategories() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/categories`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.categories = response.data.data
				}
			} catch (error) {
				console.error('加载分类失败:', error)
			}
		},
		
		// 加载资源列表
		async loadResources(refresh = false) {
			if (this.loading) return
			try {
				this.loading = true
				const params = {
					page: refresh ? 1 : this.page,
					limit: this.limit,
					sortBy: this.currentSort
				}
				if (this.selectedCategoryIndex >= 0 && this.categories[this.selectedCategoryIndex]) {
					params.categories = this.categories[this.selectedCategoryIndex].category_id
				}
				if (this.searchKeyword) {
					params.search = this.searchKeyword
				}
				const token = uni.getStorageSync('token')
				const headers = {}
				if (token) {
					headers['Authorization'] = `Bearer ${token}`
				}
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources`,
					method: 'GET',
					header: headers,
					data: params
				})
				if (response.statusCode === 200 && response.data.success) {
					const list = (response.data.data.resources || []).map(item => ({
						...item,
						isFavorited: typeof item.isFavorited === 'boolean' ? item.isFavorited : false
					}))
					if (refresh) {
						this.resources = list
						this.page = 2
					} else {
						this.resources = [...this.resources, ...list]
						this.page += 1
					}
					this.hasMore = list.length === this.limit
				} else {
					uni.showToast({ title: '加载失败', icon: 'none' })
				}
			} catch (error) {
				console.error('加载资源列表错误:', error)
				uni.showToast({ title: '网络错误', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		handleSearch() {
			this.page = 1
			this.hasMore = true
			this.loadResources(true)
		},
		

		// 分类选择
		selectCategory(index) {
			this.selectedCategoryIndex = index
			this.loadResources()
		},
		
		
		// 排序选择
		sortChange(e) {
			this.selectedSortIndex = e.detail.value
			this.currentSort = this.sortOptions[e.detail.value].value
			this.loadResources()
		},
		
		

		
		
		
		
		async toggleFavorite(item) {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				// 乐观更新
				const originalState = item.isFavorited
				item.isFavorited = !item.isFavorited
				// 本地同步更新收藏数
				const originalCount = item.collection_count || 0
				item.collection_count = originalState ? originalCount - 1 : originalCount + 1

				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources/${item.id}/favorite`,
					method: 'POST',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						type: 'resource'
					}
				})

				if (response.statusCode === 200 && response.data.success) {
					// 用接口返回的 isCollected 字段修正
					if (typeof response.data.data.isCollected !== 'undefined') {
						item.isFavorited = response.data.data.isCollected
					}
					// 用接口返回的收藏数修正（如果有）
					if (typeof response.data.data.collection_count !== 'undefined') {
						item.collection_count = response.data.data.collection_count
					}
					uni.showToast({
						title: response.data.message,
						icon: 'success'
					})
				} else {
					// 操作失败，恢复原来的状态和收藏数
					item.isFavorited = originalState
					item.collection_count = originalCount
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			} catch (error) {
				// 网络错误，恢复原来的状态和收藏数
				item.isFavorited = originalState
				item.collection_count = originalCount
				console.error('收藏操作错误:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			}
		},
		
		viewResource(item) {
			uni.navigateTo({
				url: `./detail?id=${item.id}`
			})
		},
		
		goToUpload() {
			uni.navigateTo({
				url: './upload'
			})
		},
		
		getFileIcon(fileType) {
			const iconMap = {
				'pdf': '📄',
				'doc': '📝',
				'ppt': '📊',
				'zip': '📦',
				'video': '🎥'
			}
			return iconMap[fileType] || '📁'
		},
		
		formatTime(time) {
			if (!time) return '未知时间'
			
			// 确保 time 是 Date 对象
			const date = new Date(time)
			if (isNaN(date.getTime())) {
				return '时间格式错误'
			}
			
			const now = new Date()
			const diff = now - date
			const day = 24 * 60 * 60 * 1000
			
			if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return hours > 0 ? `${hours}小时前` : '刚刚'
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return date.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.resources-container {
	min-height: 100vh;
	padding: 20rpx;
	background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	animation: gradientBG 15s ease infinite;
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 1024rpx;
	margin: 0 auto;
}

@keyframes gradientBG {
	0% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
	50% {
		background: linear-gradient(135deg, #FAEED1 0%, #FFF8DB 100%);
	}
	100% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
}

.top-section {
	background: white;
	padding: 32rpx;
	border-radius: 24rpx;
	margin-bottom: 32rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	width: 100%;
	box-sizing: border-box;
	
	.search-bar {
		display: flex;
		align-items: center;
		background: #f8f8f8;
		border-radius: 24rpx;
		padding: 0 30rpx;
		margin-bottom: 20rpx;
		
		.search-icon {
			font-size: 32rpx;
			margin-right: 20rpx;
			color: #999;
		}
		
		.search-input {
			flex: 1;
			height: 80rpx;
			font-size: 28rpx;
		}
	}
	
	.category-filter {
		margin-top: 20rpx;
		
		.category-scroll {
			.category-list {
				display: flex;
				gap: 12rpx;
				padding: 0 20rpx;
				
				.category-item {
					padding: 12rpx 24rpx;
					background: rgba(0, 122, 255, 0.1);
					border-radius: 30rpx;
					white-space: nowrap;
					flex-shrink: 0;
					transition: all 0.3s ease;
					
					&.active {
						background: #007aff;
						
						.category-text {
							color: white;
						}
					}
					
					.category-text {
						font-size: 26rpx;
						color: #007aff;
					}
				}
			}
		}
	}
	
	.sort-section {
		margin-top: 20rpx;
		
		.sort-picker {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: rgba(0, 122, 255, 0.1);
			border-radius: 8rpx;
			padding: 15rpx 20rpx;
			
			.sort-text {
				font-size: 26rpx;
				color: #007aff;
			}
			
			.sort-icon {
				font-size: 20rpx;
				color: #007aff;
			}
		}
	}
	
	.filter-section {
		margin-top: 20rpx;
		
		.filter-row {
			display: flex;
			gap: 15rpx;
			margin-bottom: 15rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.filter-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 8rpx;
				
				&.sort-item {
					flex: 2;
				}
				
				.filter-label {
					font-size: 24rpx;
					color: #666;
					font-weight: 500;
				}
				
				.picker-view {
					background: #f8f8f8;
					border: 1rpx solid #e0e0e0;
					border-radius: 8rpx;
					padding: 15rpx 20rpx;
					font-size: 26rpx;
					color: #333;
					text-align: center;
					
					&:active {
						background: #eeeeee;
					}
				}
			}
		}
	}
	
	.quick-filters {
		display: flex;
		align-items: center;
		gap: 20rpx;
		
		.category-scroll {
			flex: 1;
			white-space: nowrap;
			
			.category-list {
				display: flex;
				gap: 12rpx;
				
				.category-item {
					padding: 12rpx 24rpx;
					background: #f8f8f8;
					border-radius: 30rpx;
					white-space: nowrap;
					
					&.active {
						background: #007aff;
						
						.category-text {
							color: white;
						}
					}
					
					.category-text {
						font-size: 26rpx;
						color: #666;
					}
				}
			}
		}
		
		.filter-controls {
			display: flex;
			gap: 12rpx;
			
			.filter-btn, .sort-btn {
				display: flex;
				align-items: center;
				padding: 12rpx 16rpx;
				background: #f8f8f8;
				border-radius: 30rpx;
				min-width: 80rpx;
				
				.filter-text, .sort-text {
					font-size: 24rpx;
					color: #666;
					margin-right: 8rpx;
				}
				
				.filter-icon, .sort-icon {
					font-size: 20rpx;
					color: #999;
				}
			}
			
			.sort-btn {
				background: #e3f2fd;
				
				.sort-text {
					color: #1976d2;
				}
				
				.sort-icon {
					color: #1976d2;
				}
			}
		}
	}
	
	.active-filters {
		display: flex;
		align-items: center;
		gap: 12rpx;
		margin-top: 20rpx;
		flex-wrap: wrap;
		
		.filter-tag {
			display: flex;
			align-items: center;
			background: #007aff;
			color: white;
			padding: 8rpx 16rpx;
			border-radius: 20rpx;
			
			.tag-text {
				font-size: 22rpx;
				margin-right: 8rpx;
			}
			
			.tag-close {
				font-size: 20rpx;
				font-weight: bold;
			}
		}
		
		.clear-all {
			padding: 8rpx 16rpx;
			background: #ff4757;
			color: white;
			border-radius: 20rpx;
			font-size: 22rpx;
		}
	}
}

.resources-list {
	padding: 0;
	width: 100%;
	box-sizing: border-box;
	
	.resource-item {
		background: white;
		border-radius: 24rpx;
		padding: 32rpx;
		margin-bottom: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.98);
			background: #f8f8f8;
		}
		
		.resource-header {
			display: flex;
			align-items: flex-start;
			margin-bottom: 20rpx;
			min-width: 0;
			
			.file-preview {
				position: relative;
				width: 80rpx;
				height: 80rpx;
				margin-right: 20rpx;
				border-radius: 12rpx;
				overflow: hidden;
				background: rgba(0, 122, 255, 0.1);
				
				.thumbnail-image {
					width: 100%;
					height: 100%;
					background: #f0f0f0;
				}
				
				.file-type-overlay {
					position: absolute;
					bottom: 2rpx;
					right: 2rpx;
					font-size: 20rpx;
					background: rgba(0, 0, 0, 0.6);
					color: white;
					padding: 4rpx 6rpx;
					border-radius: 6rpx;
				}
			}
			
			.resource-info {
				flex: 1;
				min-width: 0;
				
				.resource-title {
					display: block;
					max-width: 100%;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 15rpx;
					line-height: 1.4;
				}
				
				.resource-tags {
					display: flex;
					flex-wrap: wrap;
					gap: 10rpx;
					
					.tag {
						padding: 8rpx 16rpx;
						background: rgba(0, 122, 255, 0.1);
						color: #007aff;
						border-radius: 20rpx;
						font-size: 22rpx;
					}
				}
			}
		}
		
		.resource-meta {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			
			.meta-info {
				display: flex;
				flex-direction: column;
				gap: 8rpx;
				
				.author, .upload-time {
					font-size: 24rpx;
					color: #666;
				}
			}
			
			.resource-stats {
				display: flex;
				gap: 20rpx;
				
				.stat-item {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
		
		.resource-description {
			.description-text {
				display: -webkit-box;
				max-width: 100%;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: normal;
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
			}
		}
	}
}

.upload-btn {
	position: fixed;
	right: 40rpx;
	bottom: 160rpx;
	width: 120rpx;
	height: 120rpx;
	background: rgba(0, 122, 255, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 25rpx rgba(0, 122, 255, 0.15);
	z-index: 100;
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.95);
		background: rgba(0, 122, 255, 0.2);
	}
	
	.upload-icon {
		width: 60rpx;
		height: 60rpx;
	}
}

</style>