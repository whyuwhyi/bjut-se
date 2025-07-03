<template>
	<view class="my-resources-container">
		<!-- 顶部统计 -->
		<view class="stats-header">
			<view class="stats-card">
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-value">{{ totalUploads }}</text>
						<text class="stat-label">上传总数</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ totalDownloads }}</text>
						<text class="stat-label">总下载量</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ totalViews }}</text>
						<text class="stat-label">总浏览量</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ avgRating.toFixed(1) }}</text>
						<text class="stat-label">平均评分</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 筛选和排序 -->
		<view class="filter-container">
			<view class="filter-section">
				<scroll-view class="filter-tabs" scroll-x="true" show-scrollbar="false">
					<view class="tabs-content">
						<text 
							class="filter-tab" 
							:class="{ active: selectedStatus === index }"
							v-for="(status, index) in statusFilters" 
							:key="index"
							@click="selectStatus(index)"
						>
							{{ status.name }}
						</text>
					</view>
				</scroll-view>
			</view>
			
			<view class="sort-controls">
				<picker @change="onSortChange" :value="selectedSort" :range="sortOptions" range-key="name">
					<view class="sort-trigger">
						<text class="sort-text">{{ sortOptions[selectedSort].name }}</text>
						<text class="sort-icon">⌄</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 资源列表 -->
		<view class="resources-list" v-if="filteredResources.length > 0">
			<view 
				class="resource-item" 
				:class="'status-' + resource.status"
				v-for="(resource, index) in filteredResources" 
				:key="index"
				@click="viewResource(resource)"
			>
				<!-- 资源图标和基本信息 -->
				<view class="resource-header">
					<view class="resource-icon">
						<text class="file-icon">{{ getFileIcon(resource.fileType) }}</text>
					</view>
					<view class="resource-info">
						<text class="resource-title">{{ resource.title }}</text>
						<text class="resource-filename">{{ resource.fileName }}</text>
						<view class="resource-meta">
							<text class="file-size">{{ formatFileSize(resource.fileSize) }}</text>
							<text class="upload-time">{{ formatTime(resource.uploadTime) }}</text>
						</view>
					</view>
					<view class="resource-status" :class="'status-' + resource.status">
						{{ getStatusText(resource.status) }}
					</view>
				</view>

				<!-- 资源描述 -->
				<text class="resource-desc" v-if="resource.description">{{ resource.description }}</text>

				<!-- 资源标签 -->
				<view class="resource-tags" v-if="resource.tags && resource.tags.length > 0">
					<text 
						class="resource-tag" 
						v-for="tag in resource.tags" 
						:key="tag"
					>
						{{ tag }}
					</text>
				</view>

				<!-- 统计数据 -->
				<view class="resource-stats">
					<view class="stat-group">
						<text class="stat-icon">📥</text>
						<text class="stat-text">{{ resource.downloadCount }}次下载</text>
					</view>
					<view class="stat-group">
						<text class="stat-icon">👀</text>
						<text class="stat-text">{{ resource.viewCount }}次浏览</text>
					</view>
					<view class="stat-group" v-if="resource.rating > 0">
						<text class="stat-icon">⭐</text>
						<text class="stat-text">{{ resource.rating.toFixed(1) }}分</text>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="resource-actions">
					<button class="action-btn secondary" @click.stop="editResource(resource)">
						<text class="btn-icon">✏️</text>
						<text class="btn-text">编辑</text>
					</button>
					<button class="action-btn secondary" @click.stop="shareResource(resource)">
						<text class="btn-icon">📤</text>
						<text class="btn-text">分享</text>
					</button>
					<button class="action-btn danger" @click.stop="handleDeleteClick(resource, $event)">
						<text class="btn-icon">🗑️</text>
						<text class="btn-text">删除</text>
					</button>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-icon">📚</text>
			<text class="empty-title">还没有上传资源</text>
			<text class="empty-desc">分享你的学习资料，帮助更多同学</text>
			<button class="upload-btn" @click="goUpload">上传资源</button>
		</view>

		<!-- 浮动上传按钮 -->
		<view class="floating-upload" @click="goUpload" v-if="filteredResources.length > 0">
			<text class="upload-icon">+</text>
		</view>

	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedStatus: 0,
				selectedSort: 0,
				statusFilters: [
					{ name: '全部', value: 'all' },
					{ name: '已通过', value: 'approved' },
					{ name: '审核中', value: 'pending' },
					{ name: '已拒绝', value: 'rejected' },
					{ name: '草稿', value: 'draft' }
				],
				sortOptions: [
					{ name: '最新上传', value: 'upload_time_desc' },
					{ name: '下载量', value: 'download_count_desc' },
					{ name: '浏览量', value: 'view_count_desc' },
					{ name: '评分', value: 'rating_desc' }
				],
				myResources: [],
				resourceToDelete: null
			}
		},
		
		computed: {
			filteredResources() {
				let resources = [...this.myResources]; // 创建副本避免修改原数组
				
				// 状态筛选
				const statusFilter = this.statusFilters[this.selectedStatus];
				if (statusFilter && statusFilter.value !== 'all') {
					resources = resources.filter(r => {
						return r.status === statusFilter.value;
					});
				}
				
				// 排序
				const sort = this.sortOptions[this.selectedSort];
				if (sort) {
					resources.sort((a, b) => {
						switch (sort.value) {
							case 'upload_time_desc':
								return new Date(b.uploadTime) - new Date(a.uploadTime);
							case 'download_count_desc':
								return b.downloadCount - a.downloadCount;
							case 'view_count_desc':
								return b.viewCount - a.viewCount;
							case 'rating_desc':
								return b.rating - a.rating;
							default:
								return 0;
						}
					});
				}
				
				return resources;
			},
			
			totalUploads() {
				return this.myResources.length;
			},
			
			totalDownloads() {
				return this.myResources.reduce((sum, r) => sum + r.downloadCount, 0);
			},
			
			totalViews() {
				return this.myResources.reduce((sum, r) => sum + r.viewCount, 0);
			},
			
			avgRating() {
				const ratedResources = this.myResources.filter(r => r.rating > 0);
				if (ratedResources.length === 0) return 0;
				return ratedResources.reduce((sum, r) => sum + r.rating, 0) / ratedResources.length;
			},
			
		},
		
		onLoad() {
			this.loadResources()
		},
		
		onShow() {
			this.loadResources()
		},

		methods: {
			async loadResources() {
				try {
					const token = uni.getStorageSync('token')
					if (!token) {
						uni.redirectTo({
							url: '/pages/login/login'
						})
						return
					}
					
					uni.showLoading({ title: '加载中...' })
					
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/users/my-resources`,
						method: 'GET',
						header: {
							'Authorization': `Bearer ${token}`
						},
						data: {
							page: 1,
							limit: 50
						}
					})
					
					if (response.statusCode === 200 && response.data && response.data.success) {
						const backendResources = response.data.data?.resources || [];
						
						// 直接转换数据
						this.myResources = backendResources.map(resource => {
							return {
								id: resource.resource_id,
								title: resource.resource_name,
								description: resource.description,
								status: this.mapBackendStatus(resource.status),
								uploadTime: resource.created_at,
								downloadCount: resource.download_count || 0,
								viewCount: resource.view_count || 0,
								rating: parseFloat(resource.rating) || 0,
								files: resource.files || [],
								fileName: resource.files && resource.files.length > 0 ? resource.files[0].file_name : '',
								fileType: resource.files && resource.files.length > 0 ? this.getFileTypeFromName(resource.files[0].file_name) : '',
								fileSize: resource.files && resource.files.length > 0 ? resource.files[0].file_size : 0,
								tags: []
							}
						});
						
						// 强制更新视图
						this.$forceUpdate();
					} else {
						this.myResources = []
						uni.showToast({
							title: response.data?.message || '加载失败',
							icon: 'none'
						})
					}
					
					uni.hideLoading()
				} catch (error) {
					this.myResources = []
					uni.hideLoading()
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					})
				}
			},
			
			mapBackendStatus(status) {
				const statusMap = {
					'published': 'approved',
					'pending': 'pending',
					'rejected': 'rejected',
					'draft': 'draft'
				}
				return statusMap[status] || 'draft'
			},
			
			getFileTypeFromName(fileName) {
				if (!fileName) return ''
				const ext = fileName.split('.').pop()
				return ext ? ext.toLowerCase() : ''
			},
			
			
			selectStatus(index) {
				this.selectedStatus = index;
			},
			
			onSortChange(e) {
				this.selectedSort = e.detail.value;
			},
			
			viewResource(resource) {
				uni.navigateTo({
					url: `/pages/resources/detail?id=${resource.id}`
				});
			},
			
			editResource(resource) {
				uni.navigateTo({
					url: `/pages/resources/edit?id=${resource.id}`
				});
			},
			
			shareResource(resource) {
				uni.share({
					provider: 'weixin',
					type: 0,
					title: resource.title,
					summary: resource.description,
					success: () => {
						uni.showToast({
							title: '分享成功',
							icon: 'success'
						});
					}
				});
			},
			
			handleDeleteClick(resource, event) {
				// 阻止事件冒泡和默认行为
				if (event) {
					event.stopPropagation();
					event.preventDefault();
				}
				
				// 调用删除方法
				this.deleteResource(resource);
			},
			
			deleteResource(resource) {
				this.resourceToDelete = resource;
				
				// 使用系统原生确认对话框
				uni.showModal({
					title: '确认删除',
					content: '删除后无法恢复，确定要删除这个资源吗？',
					success: (res) => {
						if (res.confirm) {
							this.confirmDelete();
						}
					}
				});
			},
			
			async confirmDelete() {
				if (!this.resourceToDelete) return;

				try {
					const token = uni.getStorageSync('token');
					if (!token) {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						});
						return;
					}

					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/resources/${this.resourceToDelete.id}`,
						method: 'DELETE',
						header: {
							'Authorization': `Bearer ${token}`
						}
					});

					if (response.statusCode === 200 && response.data && response.data.success) {
						// 从本地列表中移除
						const index = this.myResources.findIndex(r => r.id === this.resourceToDelete.id);
						if (index > -1) {
							this.myResources.splice(index, 1);
						}
						
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
					} else {
						uni.showToast({
							title: response.data?.message || '删除失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					});
				}

				this.resourceToDelete = null;
			},
			
			goUpload() {
				uni.navigateTo({
					url: '/pages/resources/upload'
				});
			},
			
			getFileIcon(fileType) {
				const icons = {
					pdf: '📄',
					doc: '📝',
					docx: '📝',
					xls: '📊',
					xlsx: '📊',
					ppt: '📊',
					pptx: '📊',
					txt: '📄',
					md: '📝',
					zip: '📦',
					rar: '📦',
					jpg: '🖼️',
					jpeg: '🖼️',
					png: '🖼️',
					gif: '🖼️',
					mp4: '🎬',
					avi: '🎬',
					mp3: '🎵'
				};
				return icons[fileType.toLowerCase()] || '📄';
			},
			
			getStatusText(status) {
				const texts = {
					approved: '已通过',
					pending: '审核中',
					rejected: '已拒绝'
				};
				return texts[status] || '未知';
			},
			
			formatFileSize(bytes) {
				if (bytes === 0) return '0 B';
				const k = 1024;
				const sizes = ['B', 'KB', 'MB', 'GB'];
				const i = Math.floor(Math.log(bytes) / Math.log(k));
				return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
			},
			
			formatTime(date) {
				return new Date(date).toLocaleDateString('zh-CN', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				});
			}
		},
		
		onPullDownRefresh() {
			// 下拉刷新
			setTimeout(() => {
				uni.stopPullDownRefresh();
			}, 1000);
		}
	}
</script>

<style scoped>
	.my-resources-container {
		min-height: 100vh;
		padding: 32rpx;
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
		animation: gradientBG 15s ease infinite;
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

	.stats-header {
		margin-bottom: 32rpx;
		padding: 0;
		
		.stats-card {
			background-color: #ffffff;
			border-radius: 16rpx;
			padding: 32rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
			
			.stats-grid {
				display: grid;
				grid-template-columns: repeat(4, 1fr);
				gap: 24rpx;
				
				.stat-item {
					text-align: center;
					
					.stat-value {
						display: block;
						font-size: 36rpx;
						font-weight: bold;
						color: #333333;
						margin-bottom: 8rpx;
					}
					
					.stat-label {
						font-size: 24rpx;
						color: #666666;
					}
				}
			}
		}
	}

	.filter-container {
		display: flex;
		align-items: center;
		gap: 24rpx;
		margin-bottom: 32rpx;
	}

	.filter-section {
		flex: 1;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 20rpx 0;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
		
		.filter-tabs {
			width: 100%;
			white-space: nowrap;
			
			.tabs-content {
				display: inline-flex;
				padding: 0 20rpx;
				
				.filter-tab {
					font-size: 28rpx;
					color: #666666;
					padding: 12rpx 24rpx;
					border-radius: 24rpx;
					transition: all 0.3s ease;
					margin-right: 16rpx;
					
					&:last-child {
						margin-right: 0;
					}
					
					&.active {
						background-color: #007aff;
						color: #ffffff;
					}
				}
			}
		}
	}

	.sort-controls {
		flex-shrink: 0;
		
		.sort-trigger {
			display: flex;
			align-items: center;
			gap: 8rpx;
			padding: 12rpx 24rpx;
			background-color: #f0f0f0;
			border-radius: 24rpx;
			transition: all 0.3s ease;
			
			&:active {
				opacity: 0.8;
			}
			
			.sort-text {
				font-size: 26rpx;
				color: #333333;
			}
			
			.sort-icon {
				font-size: 24rpx;
				color: #666666;
			}
		}
	}

	.resources-list {
		margin: 0;
		padding: 0;
		
		.resource-item {
			background-color: #ffffff;
			border-radius: 16rpx;
			padding: 32rpx;
			margin-bottom: 24rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
			transition: all 0.3s ease;
			border-left: 6rpx solid transparent;
		}
		
		.resource-actions {
			display: flex;
			gap: 24rpx;
			margin-top: 24rpx;
			
			.action-btn {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 12rpx;
				padding: 16rpx 24rpx;
				border-radius: 12rpx;
				font-size: 24rpx;
				border: none;
				
				&.secondary {
					background-color: #f0f0f0;
					color: #666666;
				}
				
				&.danger {
					background-color: #ff3b30;
					color: #ffffff;
				}
				
				.btn-icon {
					font-size: 24rpx;
				}
				
				.btn-text {
					font-size: 24rpx;
				}
			}
		}
	}

	/* 空状态 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 60rpx;
		text-align: center;
	}

	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
		opacity: 0.6;
	}

	.empty-title {
		font-size: 32rpx;
		color: #333333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}

	.empty-desc {
		font-size: 28rpx;
		color: #666666;
		margin-bottom: 48rpx;
	}

	.upload-btn {
		padding: 20rpx 40rpx;
		background-color: #007aff;
		color: #ffffff;
		border-radius: 24rpx;
		font-size: 28rpx;
		border: none;
	}

	/* 浮动上传按钮 */
	.floating-upload {
		position: fixed;
		bottom: 40rpx;
		right: 40rpx;
		width: 120rpx;
		height: 120rpx;
		background-color: #007aff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.3);
		z-index: 999;
	}

	.upload-icon {
		font-size: 48rpx;
		color: #ffffff;
		font-weight: 300;
	}

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

	.resource-desc {
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
</style>