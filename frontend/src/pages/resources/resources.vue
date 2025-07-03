<template>
	<view class="resources-container">
		<!-- 顶部搜索和过滤区域 -->
		<view class="top-section">
			<!-- 搜索栏 -->
			<view class="search-bar">
				<text class="search-icon">🔍</text>
				<input 
					class="search-input" 
					type="text"
					placeholder="搜索资源..." 
					:value="searchKeyword"
					@input="handleSearchInput"
					@confirm="handleSearch"
				/>
			</view>
			
			<!-- 分类过滤 -->
			<view class="category-filter">
				<scroll-view class="category-scroll" scroll-x="true">
					<view class="category-list">
						<view 
							class="category-item" 
							:class="{ active: selectedCategory === null }"
							@click="selectCategory(null)"
						>
							<text class="category-text">全部</text>
						</view>
						<view 
							class="category-item" 
							v-for="category in categories" 
							:key="category.id"
							:class="{ active: selectedCategory === category.id }"
							@click="selectCategory(category.id)"
						>
							<text class="category-text">{{ category.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>
			
			<!-- 排序选项 -->
			<view class="sort-section">
				<picker 
					:value="sortIndex" 
					:range="sortOptions" 
					@change="handleSortChange"
					class="sort-picker"
				>
					<view class="sort-text">{{ sortOptions[sortIndex] }}</view>
					<text class="sort-icon">▼</text>
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
						<image 
							class="thumbnail-image" 
							:src="item.thumbnail || '/static/images/default-thumbnail.png'" 
							mode="aspectFill"
						></image>
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

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && !loading">
			<button class="load-more-btn" @click="loadResources()">加载更多</button>
		</view>
	</view>
</template>

<script>
import AdvancedSearch from '@/components/AdvancedSearch.vue'

export default {
	components: {
		AdvancedSearch
	},
	
	data() {
		return {
			resources: [],
			page: 1,
			limit: 6,
			hasMore: true,
			loading: false,
			categories: [],
			selectedCategory: null,
			searchKeyword: '',
			sortOptions: ['最新发布', '最多下载', '最高评分', '最多收藏'],
			sortIndex: 0
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
		
		handleSearchInput(e) {
			this.searchKeyword = e.detail.value
		},
		
		handleSearch() {
			this.page = 1
			this.loadResources(true)
		},
		
		selectCategory(categoryId) {
			this.selectedCategory = categoryId
			this.page = 1
			this.loadResources(true)
		},
		
		handleSortChange(e) {
			this.sortIndex = e.detail.value
			this.page = 1
			this.loadResources(true)
		},
		
		// 加载资源列表
		async loadResources(refresh = false) {
			if (this.loading) return
			try {
				this.loading = true
				const params = {
					page: refresh ? 1 : this.page,
					limit: this.limit,
					...this.searchParams
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
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
	
	.top-section {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
		
		.search-bar {
			display: flex;
			align-items: center;
			background-color: #f5f5f5;
			border-radius: 30rpx;
			padding: 10rpx 20rpx;
			margin-bottom: 20rpx;
			
			.search-icon {
				margin-right: 10rpx;
				font-size: 32rpx;
			}
			
			.search-input {
				flex: 1;
				height: 60rpx;
				font-size: 28rpx;
				background: transparent;
			}
		}
		
		.category-filter {
			margin-bottom: 20rpx;
			
			.category-scroll {
				white-space: nowrap;
				
				.category-list {
					display: inline-flex;
					padding: 10rpx 0;
					
					.category-item {
						display: inline-block;
						padding: 10rpx 30rpx;
						margin-right: 20rpx;
						background-color: #f5f5f5;
						border-radius: 30rpx;
						transition: all 0.3s;
						
						&.active {
							background-color: #007aff;
							
							.category-text {
								color: #fff;
							}
						}
						
						.category-text {
							font-size: 26rpx;
							color: #333;
						}
						
						&:last-child {
							margin-right: 0;
						}
					}
				}
			}
		}
		
		.sort-section {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			
			.sort-picker {
				display: flex;
				align-items: center;
				padding: 10rpx 20rpx;
				background-color: #f5f5f5;
				border-radius: 20rpx;
				
				.sort-text {
					font-size: 26rpx;
					color: #333;
					margin-right: 10rpx;
				}
				
				.sort-icon {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
	}

	.resources-list {
		width: 100%;
		
		.resource-item {
			width: 100%;
			background: white;
			border-radius: 24rpx;
			padding: 32rpx;
			margin-bottom: 32rpx;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			box-sizing: border-box;
			transition: all 0.3s ease;
			
			&:active {
				transform: scale(0.98);
				background-color: #f8f8f8;
			}
			
			.resource-header {
				display: flex;
				align-items: flex-start;
				margin-bottom: 20rpx;
				
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
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 12rpx;
						line-height: 1.4;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					
					.resource-tags {
						display: flex;
						flex-wrap: wrap;
						gap: 8rpx;
						
						.tag {
							padding: 6rpx 12rpx;
							background: rgba(0, 122, 255, 0.1);
							color: #007aff;
							border-radius: 16rpx;
							font-size: 22rpx;
						}
					}
				}
			}
			
			.resource-meta {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 16rpx;
				
				.meta-info {
					display: flex;
					flex-direction: column;
					gap: 6rpx;
					
					.author, .upload-time {
						font-size: 24rpx;
						color: #666;
					}
				}
				
				.resource-stats {
					display: flex;
					gap: 16rpx;
					
					.stat-item {
						font-size: 24rpx;
						color: #999;
					}
				}
			}
			
			.resource-description {
				.description-text {
					font-size: 26rpx;
					color: #666;
					line-height: 1.5;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}
		}
	}

	.load-more {
		padding: 30rpx;
		text-align: center;
		
		.load-more-btn {
			padding: 20rpx 40rpx;
			background: #007aff;
			color: white;
			border: none;
			border-radius: 25rpx;
			font-size: 28rpx;
			
			&:active {
				background: #0066cc;
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

	.load-more {
		width: 100%;
		padding: 20rpx 0;
		text-align: center;
		
		.load-more-btn {
			display: inline-block;
			padding: 16rpx 32rpx;
			background: #007aff;
			color: white;
			border-radius: 30rpx;
			font-size: 26rpx;
			border: none;
			
			&:active {
				transform: scale(0.98);
				background: #0056b3;
			}
		}
	}
}
</style>