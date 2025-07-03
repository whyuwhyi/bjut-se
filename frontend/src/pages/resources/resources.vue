<template>
	<view class="resources-container">
		<!-- 高级搜索组件 -->
		<AdvancedSearch 
			type="resource"
			placeholder="搜索学习资源..."
			:loading="loading"
			@search="handleAdvancedSearch"
		/>


		<!-- 资源列表 -->
		<scroll-view 
			class="resources-list"
			refresher-enabled="true"
			:refresher-triggered="refresherTriggered"
			@refresherrefresh="onRefresh"
		>
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
		</scroll-view>

		<!-- 上传按钮 -->
		<view class="upload-btn" @click="goToUpload">
			<image class="upload-icon" src="/static/icons/upload.png" mode="aspectFit"></image>
		</view>
		
		<!-- 调试按钮 -->
		<view class="debug-btn" @click="testUpdateStats" style="position: fixed; bottom: 200rpx; right: 40rpx; width: 100rpx; height: 100rpx; background: #ff6b6b; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 999;">
			<text style="color: white; font-size: 24rpx;">测试</text>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && !loading">
			<button class="load-more-btn" @click="loadResources()">加载更多</button>
		</view>
	</view>
</template>

<script>
import AdvancedSearch from '@/components/AdvancedSearch.vue'
import eventBus, { EVENTS } from '@/utils/eventBus'

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
			searchParams: {},
			refresherTriggered: false
		}
	},
	
	onLoad() {
		this.loadResources()
		this.initEventListeners()
	},
	
	onShow() {
		// 页面显示时重新加载资源列表，确保收藏状态同步
		this.page = 1
		this.loadResources(true)
	},
	
	onUnload() {
		this.removeEventListeners()
	},
	
	methods: {
		// 下拉刷新
		async onRefresh() {
			this.refresherTriggered = true
			this.page = 1
			await this.loadResources(true)
			this.refresherTriggered = false
		},
		
		// 处理高级搜索
		handleAdvancedSearch(searchParams) {
			this.searchParams = searchParams
			this.page = 1
			this.hasMore = true
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
					data: params,
					header: headers
				})
				
				if (response.statusCode === 200 && response.data.success) {
					const { resources, pagination } = response.data.data
					
					// 调试：打印原始数据
					console.log('原始资源数据:', resources)
					
					// 标准化资源数据，确保所有统计字段都存在且为响应式
					const normalizedResources = resources.map(resource => {
						const normalized = {
							...resource,
							// 确保统计字段都存在
							viewCount: resource.viewCount || resource.view_count || 0,
							downloadCount: resource.downloadCount || resource.download_count || 0,
							favoriteCount: resource.favoriteCount || resource.collection_count || 0,
							collection_count: resource.collection_count || resource.favoriteCount || 0,
							rating: parseFloat(resource.rating) || 0,
							// 确保ID字段存在
							id: resource.id || resource.resource_id,
							resource_id: resource.resource_id || resource.id
						}
						console.log('标准化后的资源:', normalized)
						return normalized
					})
					
					if (refresh) {
						this.resources = normalizedResources
					} else {
						this.resources = [...this.resources, ...normalizedResources]
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
		},
		
		// 初始化事件监听器
		initEventListeners() {
			eventBus.on(EVENTS.RESOURCE_FAVORITE_CHANGED, this.updateResourceFavorite)
			eventBus.on(EVENTS.RESOURCE_DOWNLOAD_CHANGED, this.updateResourceDownload)
			eventBus.on(EVENTS.RESOURCE_RATING_CHANGED, this.updateResourceRating)
			eventBus.on(EVENTS.RESOURCE_VIEW_CHANGED, this.updateResourceView)
		},
		
		// 移除事件监听器
		removeEventListeners() {
			eventBus.off(EVENTS.RESOURCE_FAVORITE_CHANGED, this.updateResourceFavorite)
			eventBus.off(EVENTS.RESOURCE_DOWNLOAD_CHANGED, this.updateResourceDownload)
			eventBus.off(EVENTS.RESOURCE_RATING_CHANGED, this.updateResourceRating)
			eventBus.off(EVENTS.RESOURCE_VIEW_CHANGED, this.updateResourceView)
		},
		
		// 更新资源收藏状态
		updateResourceFavorite(data) {
			const { resourceId, isFavorited, favoriteCount } = data
			const resourceIndex = this.resources.findIndex(r => 
				r.id === resourceId || r.resource_id === resourceId
			)
			if (resourceIndex !== -1) {
				const resource = this.resources[resourceIndex]
				this.$set(resource, 'isFavorited', isFavorited)
				this.$set(resource, 'favoriteCount', favoriteCount)
				this.$set(resource, 'collection_count', favoriteCount)
			}
		},
		
		// 更新资源下载数
		updateResourceDownload(data) {
			const { resourceId, downloadCount } = data
			const resourceIndex = this.resources.findIndex(r => 
				r.id === resourceId || r.resource_id === resourceId
			)
			if (resourceIndex !== -1) {
				this.$set(this.resources[resourceIndex], 'downloadCount', downloadCount)
			}
		},
		
		// 更新资源评分
		updateResourceRating(data) {
			const { resourceId, rating } = data
			const resourceIndex = this.resources.findIndex(r => 
				r.id === resourceId || r.resource_id === resourceId
			)
			if (resourceIndex !== -1) {
				this.$set(this.resources[resourceIndex], 'rating', rating)
			}
		},
		
		// 更新资源浏览数
		updateResourceView(data) {
			const { resourceId, viewCount } = data
			const resourceIndex = this.resources.findIndex(r => 
				r.id === resourceId || r.resource_id === resourceId
			)
			if (resourceIndex !== -1) {
				this.$set(this.resources[resourceIndex], 'viewCount', viewCount)
			}
		},
		
		// 刷新单个资源数据（从详情页面返回时调用）
		refreshResourceData(data) {
			const { resourceId, viewCount, downloadCount, favoriteCount, rating } = data
			const resourceIndex = this.resources.findIndex(r => 
				(r.id && r.id === resourceId) || 
				(r.resource_id && r.resource_id === resourceId)
			)
			
			if (resourceIndex !== -1) {
				const resource = this.resources[resourceIndex]
				
				// 使用 Vue.set 确保响应式更新
				if (viewCount !== undefined) {
					this.$set(resource, 'viewCount', viewCount)
				}
				if (downloadCount !== undefined) {
					this.$set(resource, 'downloadCount', downloadCount)
				}
				if (favoriteCount !== undefined) {
					this.$set(resource, 'favoriteCount', favoriteCount)
					this.$set(resource, 'collection_count', favoriteCount)
				}
				if (rating !== undefined) {
					this.$set(resource, 'rating', rating)
				}
				
				console.log('已更新资源数据:', resource)
			} else {
				console.log('未找到要更新的资源:', resourceId)
			}
		},
		
		// 测试方法：手动更新统计数据
		testUpdateStats() {
			if (this.resources.length > 0) {
				const resource = this.resources[0]
				console.log('更新前:', resource)
				
				// 模拟统计数据变化
				this.$set(resource, 'viewCount', (resource.viewCount || 0) + 10)
				this.$set(resource, 'downloadCount', (resource.downloadCount || 0) + 5)
				this.$set(resource, 'favoriteCount', (resource.favoriteCount || 0) + 2)
				this.$set(resource, 'collection_count', (resource.collection_count || 0) + 2)
				
				console.log('更新后:', resource)
				uni.showToast({
					title: '测试更新完成',
					icon: 'success'
				})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.resources-container {
	width: 100%;
	height: 100vh;
	padding: 20rpx;
	background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	animation: gradientBG 15s ease infinite;
	display: flex;
	flex-direction: column;
	align-items: center;
	overflow-y: auto;
	box-sizing: border-box;
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

.resources-list {
	width: 100%;
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
						word-wrap: break-word;
						word-break: break-all;
						overflow: hidden;
						text-overflow: ellipsis;
						display: -webkit-box;
						-webkit-line-clamp: 2;
						-webkit-box-orient: vertical;
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
					word-wrap: break-word;
					word-break: break-all;
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 3;
					-webkit-box-orient: vertical;
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
</style>