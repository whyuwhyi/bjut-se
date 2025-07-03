<template>
	<view class="resources-container">
		<!-- 高级搜索组件 -->
		<AdvancedSearch 
			type="resource"
			placeholder="搜索学习资源..."
			:loading="loading"
			@search="handleAdvancedSearch"
		/>

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
						:key="category.category_id"
						:class="{ active: selectedCategory === category.category_id }"
						@click="selectCategory(category.category_id)"
					>
						<text class="category-text">{{ category.category_name }}</text>
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
			searchParams: {},
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
		this.page = 1
		this.loadResources(true)
	},
	
	methods: {
		// 处理高级搜索
		handleAdvancedSearch(searchParams) {
			this.searchParams = searchParams
			this.page = 1
			this.hasMore = true
			this.loadResources(true)
		},
		
		async loadCategories() {
			try {
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/categories`,
					method: 'GET'
				})
				
				if (response.statusCode === 200 && response.data.success) {
					this.categories = response.data.data
					console.log('加载到的分类数据:', this.categories)
				} else {
					console.error('加载分类失败:', response.data)
					uni.showToast({
						title: '加载分类失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载分类失败:', error)
				uni.showToast({
					title: '加载分类失败',
					icon: 'none'
				})
			}
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
				
				// 添加分类过滤
				if (this.selectedCategory) {
					params.category = this.selectedCategory
				}
				
				// 添加排序
				switch (this.sortIndex) {
					case 0: // 最新发布
						params.sort = 'created_at'
						params.order = 'desc'
						break
					case 1: // 最多下载
						params.sort = 'download_count'
						params.order = 'desc'
						break
					case 2: // 最高评分
						params.sort = 'rating'
						params.order = 'desc'
						break
					case 3: // 最多收藏
						params.sort = 'collection_count'
						params.order = 'desc'
						break
				}
				
				const token = uni.getStorageSync('token')
				const headers = {}
				if (token) {
					headers['Authorization'] = `Bearer ${token}`
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/resources`,
					method: 'GET',
					data: params,
					header: headers
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const { resources, pagination } = response.data.data
					
					if (refresh) {
						this.resources = resources
					} else {
						this.resources = [...this.resources, ...resources]
					}
					
					this.hasMore = pagination.currentPage < pagination.totalPages
					this.page = pagination.currentPage + 1
				} else {
					uni.showToast({
						title: response.data.message || '加载失败',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('加载资源列表失败:', error)
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		viewResource(resource) {
			// 支持两种ID格式：新版本的id和旧版本的resource_id
			const resourceId = resource.id || resource.resource_id
			if (!resourceId) {
				console.error('资源ID缺失:', resource)
				uni.showToast({
					title: '资源ID错误',
					icon: 'none'
				})
				return
			}
			uni.navigateTo({
				url: `./detail?id=${resourceId}`
			})
		},
		
		goToUpload() {
			const token = uni.getStorageSync('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				})
				return
			}
			
			uni.navigateTo({
				url: './upload'
			})
		},
		
		getFileIcon(fileType) {
			if (!fileType) return '📄'
			
			const type = fileType.toLowerCase()
			if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return '🖼️'
			if (['doc', 'docx'].includes(type)) return '📝'
			if (['xls', 'xlsx'].includes(type)) return '📊'
			if (['ppt', 'pptx'].includes(type)) return '📊'
			if (['pdf'].includes(type)) return '📑'
			if (['zip', 'rar', '7z'].includes(type)) return '📦'
			if (['mp4', 'avi', 'mov'].includes(type)) return '🎬'
			if (['mp3', 'wav', 'ogg'].includes(type)) return '🎵'
			return '📄'
		},
		
		formatTime(time) {
			if (!time) return ''
			const { formatTime } = require('@/utils/time.js')
			return formatTime(time)
		}
	}
}
</script>

<style lang="scss" scoped>
.resources-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
	
	.category-filter {
		margin: 20rpx 0;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
		
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
		margin-bottom: 20rpx;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
		
		.sort-picker {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10rpx 20rpx;
			background-color: #f5f5f5;
			border-radius: 30rpx;
			
			.sort-text {
				font-size: 26rpx;
				color: #333;
			}
			
			.sort-icon {
				font-size: 24rpx;
				color: #666;
				margin-left: 10rpx;
			}
		}
	}
	
	.resources-list {
		.resource-item {
			background: #fff;
			border-radius: 16rpx;
			padding: 20rpx;
			margin-bottom: 20rpx;
			box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
			
			.resource-header {
				display: flex;
				margin-bottom: 20rpx;
				
				.file-preview {
					position: relative;
					width: 120rpx;
					height: 120rpx;
					margin-right: 20rpx;
					border-radius: 12rpx;
					overflow: hidden;
					
					.thumbnail-image {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}
					
					.file-type-overlay {
						position: absolute;
						bottom: 0;
						left: 0;
						right: 0;
						padding: 4rpx;
						background: rgba(0, 0, 0, 0.5);
						color: #fff;
						font-size: 24rpx;
						text-align: center;
					}
				}
				
				.resource-info {
					flex: 1;
					
					.resource-title {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
						margin-bottom: 10rpx;
					}
					
					.resource-tags {
						display: flex;
						flex-wrap: wrap;
						gap: 10rpx;
						
						.tag {
							font-size: 24rpx;
							color: #007aff;
							background: rgba(0, 122, 255, 0.1);
							padding: 4rpx 12rpx;
							border-radius: 20rpx;
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
					align-items: center;
					gap: 20rpx;
					
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
						color: #666;
					}
				}
			}
			
			.resource-description {
				.description-text {
					font-size: 28rpx;
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
		border-radius: 50%;
		background: rgba(0, 122, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 25rpx rgba(0, 122, 255, 0.15);
		z-index: 100;
		transition: all 0.3s ease;
		
		.upload-icon {
			width: 60rpx;
			height: 60rpx;
		}
		
		&:active {
			transform: scale(0.95);
			background: rgba(0, 122, 255, 0.2);
		}
	}
	
	.load-more {
		padding: 20rpx;
		text-align: center;
		
		.load-more-btn {
			display: inline-block;
			padding: 10rpx 30rpx;
			font-size: 28rpx;
			color: #666;
			background: #f5f5f5;
			border-radius: 30rpx;
			
			&:active {
				opacity: 0.8;
			}
		}
	}
}
</style>