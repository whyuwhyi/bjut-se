<template>
	<view class="favorites-container">
		<!-- 顶部筛选栏 -->
		<view class="filter-section">
			<scroll-view class="filter-scroll" scroll-x="true">
				<view class="filter-list">
					<view 
						class="filter-item" 
						:class="{ active: selectedType === index }"
						v-for="(type, index) in favoriteTypes" 
						:key="index"
						@click="selectType(index)"
					>
						<text class="filter-text">{{ type.name }}</text>
						<text class="filter-count">({{ type.count }})</text>
					</view>
				</view>
			</scroll-view>
			<button v-if="filteredFavorites.length > 0" class="select-btn" @click="toggleSelectMode">
				{{ isSelectMode ? '取消' : '选择' }}
			</button>
		</view>

		<!-- 收藏列表 -->
		<view class="favorites-list" v-if="filteredFavorites.length > 0">
			<view 
				class="favorite-item" 
				:class="{ 'select-mode': isSelectMode, 'selected': isSelected(item) }"
				v-for="(item, index) in filteredFavorites" 
				:key="index"
				@click="handleItemClick(item)"
				@longpress="handleLongPress(item)"
			>
				<!-- 选择框 -->
				<view class="select-checkbox" v-if="isSelectMode" @click.stop="toggleSelection(item)">
					<text class="checkbox-icon">{{ isSelected(item) ? '☑️' : '⬜' }}</text>
				</view>
				
				<!-- 左侧图标 -->
				<view class="item-icon" :class="'icon-' + item.type">
					<text class="icon-emoji">{{ getTypeIcon(item.type) }}</text>
				</view>
				
				<!-- 内容区域 -->
				<view class="item-content">
					<text class="item-title">{{ item.title }}</text>
					<text class="item-desc">{{ item.description }}</text>
					<view class="item-meta">
						<text class="item-author">{{ item.author }}</text>
						<text class="item-time">{{ formatTime(item.favoriteTime) }}</text>
						<view class="item-tags">
							<text 
								class="item-tag" 
								v-for="tag in item.tags" 
								:key="tag"
							>
								{{ tag }}
							</text>
						</view>
					</view>
				</view>
				
				<!-- 右侧操作 -->
				<view class="item-actions delete-bottom">
					<view class="action-btn" @click.stop="removeFavorite(item)">
						<text class="action-icon">🗑️</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<text class="empty-icon">⭐</text>
			<text class="empty-title">暂无收藏</text>
			<text class="empty-desc">快去收藏一些喜欢的内容吧</text>
			<button class="explore-btn" @click="goExplore">去探索</button>
		</view>

		<!-- 批量操作 -->
		<view class="batch-actions" v-if="selectedItems.length > 0">
			<view class="batch-info">
				<text class="selected-count">已选择 {{ selectedItems.length }} 项</text>
			</view>
			<view class="batch-buttons">
				<button class="batch-btn cancel" @click="cancelSelection">取消</button>
				<button class="batch-btn share" @click="batchShare">分享</button>
				<button class="batch-btn delete" @click="batchDelete">删除</button>
			</view>
		</view>

	</view>
</template>

<script>
	import config from '@/utils/config'
	
	export default {
		data() {
			return {
				selectedType: 0,
				selectedItems: [],
				isSelectMode: false,
				favoriteTypes: [
					{ name: '全部', value: 'all', count: 0 },
					{ name: '资源', value: 'resource', count: 0 },
					{ name: '帖子', value: 'post', count: 0 }
				],
				favorites: [],
				itemToDelete: null
			}
		},
		
		onLoad() {
			this.loadFavorites()
		},
		
		onShow() {
			this.loadFavorites()
		},
		
		onPullDownRefresh() {
			this.loadFavorites().finally(() => {
				uni.stopPullDownRefresh()
			})
		},
		
		computed: {
			filteredFavorites() {
				const type = this.favoriteTypes[this.selectedType];
				if (type.value === 'all') {
					return this.favorites;
				}
				return this.favorites.filter(item => item.type === type.value);
			}
		},
		
		methods: {
			async loadFavorites() {
				try {
					const token = uni.getStorageSync('token')
					if (!token) {
						uni.reLaunch({
							url: '/pages/login/login'
						})
						return
					}
					
					const response = await uni.request({
						url: `${config.apiBaseUrl}/users/my-collections`,
						method: 'GET',
						header: {
							'Authorization': `Bearer ${token}`
						},
						data: {
							page: 1,
							limit: 100
						}
					})
					
					if (response.data.success) {
						this.favorites = response.data.data.collections.map(item => ({
							id: item.collection_id,
							type: item.collection_type,
							title: this.getItemTitle(item),
							description: this.getItemDescription(item),
							author: this.getItemAuthor(item),
							favoriteTime: new Date(item.created_at),
							tags: [],
							contentId: item.content_id,
							url: item.collection_type === 'resource' 
								? `/pages/resources/detail?id=${item.content_id}`
								: `/pages/forum/detail?id=${item.content_id}`
						}))
						this.updateCounts()
					} else {
						this.favorites = []
						this.updateCounts()
					}
				} catch (error) {
					console.error('加载收藏失败:', error)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
					this.favorites = []
					this.updateCounts()
				}
			},
			
			getItemTitle(item) {
				if (item.resource) {
					return item.resource.resource_name
				} else if (item.post) {
					return item.post.title
				}
				return '未知标题'
			},
			
			getItemDescription(item) {
				if (item.resource) {
					return item.resource.description || '暂无描述'
				} else if (item.post) {
					// 简化的内容提取，实际可能需要更复杂的处理
					return item.post.content ? item.post.content.substring(0, 100) + '...' : '暂无内容'
				}
				return '暂无描述'
			},
			
			getItemAuthor(item) {
				if (item.resource && item.resource.publisher) {
					return item.resource.publisher.nickname || item.resource.publisher.name
				} else if (item.post && item.post.author) {
					return item.post.author.nickname || item.post.author.name
				}
				return '未知作者'
			},
			
			selectType(index) {
				this.selectedType = index;
			},
			
			viewItem(item) {
				uni.navigateTo({
					url: item.url
				});
			},
			
			toggleSelectMode() {
				this.isSelectMode = !this.isSelectMode
				if (!this.isSelectMode) {
					this.selectedItems = []
				}
			},
			
			handleItemClick(item) {
				if (this.isSelectMode) {
					this.toggleSelection(item)
				} else {
					this.viewItem(item)
				}
			},
			
			handleLongPress(item) {
				if (!this.isSelectMode) {
					this.isSelectMode = true
				}
				this.toggleSelection(item)
			},
			
			isSelected(item) {
				return this.selectedItems.some(selected => selected.id === item.id)
			},
			
			shareItem(item) {
				uni.share({
					provider: 'weixin',
					type: 0,
					title: item.title,
					summary: item.description,
					success: () => {
						uni.showToast({
							title: '分享成功',
							icon: 'success'
						});
					}
				});
			},
			
			removeFavorite(item) {
				uni.showModal({
					title: '取消收藏',
					content: '确定要取消收藏这个内容吗？',
					success: (res) => {
						if (res.confirm) {
							this.doRemoveFavorite(item)
						}
					}
				})
			},
			
			async doRemoveFavorite(item) {
				try {
					const token = uni.getStorageSync('token')
					
					const response = await uni.request({
						url: `${config.apiBaseUrl}/collections/${item.contentId}`,
						method: 'DELETE',
						header: {
							'Authorization': `Bearer ${token}`
						},
						data: {
							collection_type: item.type
						}
					})
					
					if (response.data.success) {
						// 从本地列表中移除
						const index = this.favorites.findIndex(f => f.id === item.id)
						if (index > -1) {
							this.favorites.splice(index, 1)
							this.updateCounts()
						}
						
						uni.showToast({
							title: '取消收藏成功',
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: response.data.message || '操作失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('取消收藏失败:', error)
					uni.showToast({
						title: '网络错误',
						icon: 'none'
					})
				}
			},
			
			
			toggleSelection(item) {
				const index = this.selectedItems.findIndex(s => s.id === item.id);
				if (index > -1) {
					this.selectedItems.splice(index, 1);
				} else {
					this.selectedItems.push(item);
				}
			},
			
			cancelSelection() {
				this.selectedItems = []
				this.isSelectMode = false
			},
			
			batchShare() {
				// 批量分享逻辑
				uni.showToast({
					title: `分享了${this.selectedItems.length}个收藏`,
					icon: 'success'
				});
				this.cancelSelection();
			},
			
			async batchDelete() {
				if (this.selectedItems.length === 0) return
				
				uni.showModal({
					title: '确认删除',
					content: `确定要删除选中的${this.selectedItems.length}个收藏吗？`,
					success: async (res) => {
						if (res.confirm) {
							try {
								const token = uni.getStorageSync('token')
								const deletePromises = this.selectedItems.map(item => 
									uni.request({
										url: `${config.apiBaseUrl}/collections/${item.contentId}`,
										method: 'DELETE',
										header: {
											'Authorization': `Bearer ${token}`
										},
										data: {
											collection_type: item.type
										}
									})
								)
								
								await Promise.all(deletePromises)
								
								// 从本地列表中移除
								this.selectedItems.forEach(item => {
									const index = this.favorites.findIndex(f => f.id === item.id)
									if (index > -1) {
										this.favorites.splice(index, 1)
									}
								})
								
								this.updateCounts()
								uni.showToast({
									title: '批量删除成功',
									icon: 'success'
								})
								this.cancelSelection()
							} catch (error) {
								console.error('批量删除收藏失败:', error)
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			
			updateCounts() {
				// 更新各类型的数量
				this.favoriteTypes[0].count = this.favorites.length;
				this.favoriteTypes[1].count = this.favorites.filter(f => f.type === 'resource').length;
				this.favoriteTypes[2].count = this.favorites.filter(f => f.type === 'post').length;
			},
			
			goExplore() {
				uni.switchTab({
					url: '/pages/index/index'
				});
			},
			
			getTypeIcon(type) {
				const icons = {
					resource: '📚',
					post: '💬',
					activity: '🎯'
				};
				return icons[type] || '📄';
			},
			
			formatTime(date) {
				const now = new Date();
				const diff = now - date;
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (days === 0) {
					return '今天';
				} else if (days === 1) {
					return '昨天';
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return date.toLocaleDateString('zh-CN', {
						month: '2-digit',
						day: '2-digit'
					});
				}
			}
		}
	}
</script>

<style scoped>
	.favorites-container {
		min-height: 100vh;
		padding-bottom: 120rpx; /* 为底部操作栏留出空间 */
		position: relative;
		
		&::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: -1;
			background-color: #FAEED1;
			background-image: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
			background-size: 400% 400%;
			animation: gradientBG 15s ease infinite;
		}
	}

	@keyframes gradientBG {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.filter-section {
		position: sticky;
		top: 0;
		z-index: 100;
		background-color: #ffffff;
		border-bottom: 1rpx solid #f0f0f0;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		padding-right: 20rpx;
		
		.filter-scroll {
			flex: 1;
			white-space: nowrap;
			padding: 16rpx 20rpx;
		}
		
		.filter-list {
			display: inline-flex;
			gap: 16rpx;
		}
		
		.filter-item {
			display: inline-flex;
			align-items: center;
			padding: 12rpx 24rpx;
			border-radius: 24rpx;
			background-color: #f5f5f5;
			transition: all 0.3s ease;
			
			&.active {
				background-color: #007aff;
				
				.filter-text, .filter-count {
					color: #ffffff;
				}
			}
			
			.filter-text {
				font-size: 28rpx;
				color: #333333;
				margin-right: 8rpx;
			}
			
			.filter-count {
				font-size: 24rpx;
				color: #666666;
			}
		}

		.select-btn {
			padding: 12rpx 24rpx;
			font-size: 28rpx;
			color: #007aff;
			background: none;
			border: none;
			min-width: 120rpx;
			text-align: center;
			
			&:after {
				border: none;
			}
		}
	}

	.favorites-list {
		padding: 20rpx;
		
		.favorite-item {
			position: relative;
			display: flex;
			align-items: flex-start;
			gap: 20rpx;
			padding: 24rpx;
			margin-bottom: 20rpx;
			background-color: #ffffff;
			border-radius: 16rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
			transition: all 0.3s ease;
			
			&.select-mode {
				padding-left: 80rpx;
			}
			
			&.selected {
				background-color: #f0f7ff;
				border: 2rpx solid #007aff;
			}
			
			.select-checkbox {
				position: absolute;
				left: 24rpx;
				top: 50%;
				transform: translateY(-50%);
				width: 40rpx;
				height: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: 1;
				
				.checkbox-icon {
					font-size: 36rpx;
					line-height: 1;
				}
			}
			
			.item-icon {
				width: 80rpx;
				height: 80rpx;
				border-radius: 16rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				background-color: #f5f5f5;
				
				&.icon-resource {
					background-color: #e8f4fd;
				}
				
				&.icon-post {
					background-color: #f0f9ff;
				}
				
				.icon-emoji {
					font-size: 36rpx;
					line-height: 1;
				}
			}
			
			.item-content {
				flex: 1;
				min-width: 0;
				padding-right: 80rpx;
				
				.item-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333333;
					margin-bottom: 8rpx;
					@include text-ellipsis;
				}
				
				.item-desc {
					font-size: 28rpx;
					color: #666666;
					line-height: 1.4;
					margin-bottom: 16rpx;
					@include multi-ellipsis(2);
				}
				
				.item-meta {
					display: flex;
					align-items: center;
					gap: 16rpx;
					flex-wrap: wrap;
					
					.item-author, .item-time {
						font-size: 24rpx;
						color: #999999;
					}
					
					.item-tags {
						display: flex;
						gap: 8rpx;
						flex-wrap: wrap;
						
						.item-tag {
							padding: 4rpx 12rpx;
							background-color: #f5f5f5;
							border-radius: 12rpx;
							font-size: 22rpx;
							color: #666666;
						}
					}
				}
			}
			
			.item-actions.delete-bottom {
				position: absolute;
				right: 24rpx;
				top: 50%;
				transform: translateY(-50%);
				margin-left: 0;
				z-index: 2;
				
				.action-btn {
					width: 64rpx;
					height: 64rpx;
					border-radius: 32rpx;
					background-color: #f5f5f5;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.3s ease;
					
					&:active {
						background-color: #e0e0e0;
					}
					
					.action-icon {
						font-size: 32rpx;
						line-height: 1;
					}
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

	.explore-btn {
		padding: 20rpx 40rpx;
		background-color: #007aff;
		color: #ffffff;
		border-radius: 24rpx;
		font-size: 28rpx;
		border: none;
	}

	/* 批量操作 */
	.batch-actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #ffffff;
		border-top: 1rpx solid #e0e0e0;
		padding: 24rpx 32rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
	}

	.batch-info {
		flex: 1;
	}

	.selected-count {
		font-size: 28rpx;
		color: #333333;
	}

	.batch-buttons {
		display: flex;
		gap: 16rpx;
	}

	.batch-btn {
		padding: 16rpx 24rpx;
		border-radius: 20rpx;
		font-size: 26rpx;
		border: none;
	}

	.batch-btn.cancel {
		background-color: #f0f0f0;
		color: #666666;
	}

	.batch-btn.share {
		background-color: #34c759;
		color: #ffffff;
	}

	.batch-btn.delete {
		background-color: #ff3b30;
		color: #ffffff;
	}
</style>