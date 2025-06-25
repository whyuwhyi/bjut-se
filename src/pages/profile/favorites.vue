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
		</view>

		<!-- 收藏列表 -->
		<view class="favorites-list" v-if="filteredFavorites.length > 0">
			<view 
				class="favorite-item" 
				v-for="(item, index) in filteredFavorites" 
				:key="index"
				@click="viewItem(item)"
			>
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
				<view class="item-actions">
					<view class="action-btn" @click.stop="shareItem(item)">
						<text class="action-icon">📤</text>
					</view>
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

		<!-- 确认删除弹窗 -->
		<uni-popup ref="deletePopup" type="dialog">
			<uni-popup-dialog 
				type="warn" 
				title="确认删除" 
				content="确定要删除这些收藏吗？删除后无法恢复。"
				:before-close="true"
				@confirm="confirmDelete"
				@close="closeDeleteDialog"
			></uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedType: 0,
				selectedItems: [],
				favoriteTypes: [
					{ name: '全部', value: 'all', count: 25 },
					{ name: '资源', value: 'resource', count: 12 },
					{ name: '讨论', value: 'discussion', count: 8 },
					{ name: '活动', value: 'activity', count: 5 }
				],
				favorites: [
					{
						id: '1',
						type: 'resource',
						title: 'Vue.js 完整教程',
						description: 'Vue.js从入门到精通的完整学习资料',
						author: '李老师',
						favoriteTime: new Date('2025-06-19 14:30:00'),
						tags: ['Vue.js', '前端', '教程'],
						url: '/pages/resources/detail?id=1'
					},
					{
						id: '2',
						type: 'discussion',
						title: '关于React Hooks的深度解析',
						description: '详细讲解React Hooks的使用方法和最佳实践',
						author: '张同学',
						favoriteTime: new Date('2025-06-18 16:45:00'),
						tags: ['React', '前端', 'Hooks'],
						url: '/pages/discussion/detail?id=2'
					},
					{
						id: '3',
						type: 'activity',
						title: '编程马拉松大赛',
						description: '24小时编程挑战，展示你的技术实力',
						author: '计算机学院',
						favoriteTime: new Date('2025-06-17 09:20:00'),
						tags: ['编程', '竞赛', '活动'],
						url: '/pages/activity/detail?id=3'
					},
					{
						id: '4',
						type: 'resource',
						title: 'Python数据分析实战',
						description: '使用Python进行数据分析的实战案例集合',
						author: '王教授',
						favoriteTime: new Date('2025-06-16 11:15:00'),
						tags: ['Python', '数据分析', '实战'],
						url: '/pages/resources/detail?id=4'
					},
					{
						id: '5',
						type: 'discussion',
						title: '算法面试题解析',
						description: '常见算法面试题的详细解答和思路分析',
						author: '刘同学',
						favoriteTime: new Date('2025-06-15 20:30:00'),
						tags: ['算法', '面试', '编程'],
						url: '/pages/discussion/detail?id=5'
					}
				],
				itemToDelete: null
			}
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
			selectType(index) {
				this.selectedType = index;
			},
			
			viewItem(item) {
				uni.navigateTo({
					url: item.url
				});
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
				this.itemToDelete = item;
				this.$refs.deletePopup.open();
			},
			
			confirmDelete() {
				if (this.itemToDelete) {
					const index = this.favorites.findIndex(f => f.id === this.itemToDelete.id);
					if (index > -1) {
						this.favorites.splice(index, 1);
						this.updateCounts();
						uni.showToast({
							title: '取消收藏成功',
							icon: 'success'
						});
					}
				}
				this.closeDeleteDialog();
			},
			
			closeDeleteDialog() {
				this.$refs.deletePopup.close();
				this.itemToDelete = null;
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
				this.selectedItems = [];
			},
			
			batchShare() {
				// 批量分享逻辑
				uni.showToast({
					title: `分享了${this.selectedItems.length}个收藏`,
					icon: 'success'
				});
				this.cancelSelection();
			},
			
			batchDelete() {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除选中的${this.selectedItems.length}个收藏吗？`,
					success: (res) => {
						if (res.confirm) {
							// 删除选中的收藏
							this.selectedItems.forEach(item => {
								const index = this.favorites.findIndex(f => f.id === item.id);
								if (index > -1) {
									this.favorites.splice(index, 1);
								}
							});
							this.updateCounts();
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							});
							this.cancelSelection();
						}
					}
				});
			},
			
			updateCounts() {
				// 更新各类型的数量
				this.favoriteTypes[0].count = this.favorites.length;
				this.favoriteTypes[1].count = this.favorites.filter(f => f.type === 'resource').length;
				this.favoriteTypes[2].count = this.favorites.filter(f => f.type === 'discussion').length;
				this.favoriteTypes[3].count = this.favorites.filter(f => f.type === 'activity').length;
			},
			
			goExplore() {
				uni.switchTab({
					url: '/pages/index/index'
				});
			},
			
			getTypeIcon(type) {
				const icons = {
					resource: '📚',
					discussion: '💬',
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
		},
		
		onLoad() {
			this.updateCounts();
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
	.favorites-container {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 160rpx;
	}

	/* 筛选栏 */
	.filter-section {
		background-color: #ffffff;
		padding: 20rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}

	.filter-scroll {
		white-space: nowrap;
	}

	.filter-list {
		display: flex;
		gap: 20rpx;
	}

	.filter-item {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 12rpx 20rpx;
		background-color: #f0f0f0;
		border-radius: 24rpx;
		transition: all 0.3s ease;
	}

	.filter-item.active {
		background-color: #007aff;
		color: #ffffff;
	}

	.filter-text {
		font-size: 26rpx;
		color: inherit;
	}

	.filter-count {
		font-size: 22rpx;
		opacity: 0.8;
	}

	/* 收藏列表 */
	.favorites-list {
		padding: 32rpx;
	}

	.favorite-item {
		display: flex;
		align-items: flex-start;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.favorite-item:active {
		transform: scale(0.98);
		background-color: #f8f8f8;
	}

	.item-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		flex-shrink: 0;
	}

	.item-icon.icon-resource {
		background-color: #e8f4fd;
	}

	.item-icon.icon-discussion {
		background-color: #f0f9ff;
	}

	.item-icon.icon-activity {
		background-color: #f8f0ff;
	}

	.icon-emoji {
		font-size: 36rpx;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
		display: block;
		margin-bottom: 8rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-desc {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.4;
		display: block;
		margin-bottom: 16rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: 16rpx;
		flex-wrap: wrap;
	}

	.item-author {
		font-size: 24rpx;
		color: #999999;
	}

	.item-time {
		font-size: 24rpx;
		color: #999999;
	}

	.item-tags {
		display: flex;
		gap: 8rpx;
	}

	.item-tag {
		padding: 4rpx 8rpx;
		background-color: #f0f0f0;
		border-radius: 8rpx;
		font-size: 20rpx;
		color: #666666;
	}

	.item-actions {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		margin-left: 16rpx;
	}

	.action-btn {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background-color: #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.action-btn:active {
		background-color: #e0e0e0;
	}

	.action-icon {
		font-size: 24rpx;
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