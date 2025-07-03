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
			searchParams: {}
		}
	},
	
	onLoad() {
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