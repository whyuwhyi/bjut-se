<template>
	<view class="messages-container">
		<!-- 页面头部 -->
		<view class="header-section">
			<view class="header-title">
				<text class="title-text">消息通知</text>
				<view class="unread-badge" v-if="unreadCount > 0">
					<text class="badge-text">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
				</view>
			</view>
			<view class="header-actions">
				<text class="action-btn" @click="markAllAsRead" v-if="unreadCount > 0">全部已读</text>
				<text class="action-btn" @click="cleanExpired">清理过期</text>
			</view>
		</view>

		<!-- 筛选标签 -->
		<view class="filter-section">
			<scroll-view class="filter-scroll" scroll-x="true">
				<view class="filter-list">
					<view 
						class="filter-item" 
						:class="{ active: selectedType === item.value }"
						v-for="item in typeFilters" 
						:key="item.value"
						@click="selectType(item.value)"
					>
						<text class="filter-icon">{{ item.icon }}</text>
						<text class="filter-text">{{ item.label }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 通知列表 -->
		<view class="messages-list" v-if="notifications.length > 0">
			<view 
				class="message-item" 
				:class="{ 'unread': !notification.is_read }"
				v-for="notification in notifications" 
				:key="notification.notification_id"
				@click="handleNotificationClick(notification)"
			>
				<!-- 消息图标和类型 -->
				<view class="message-icon">
					<text class="icon-text">{{ getTypeIcon(notification.type) }}</text>
					<view class="priority-dot" :class="'priority-' + notification.priority"></view>
				</view>

				<!-- 消息内容 -->
				<view class="message-content">
					<view class="message-header">
						<text class="message-title">{{ notification.title }}</text>
						<text class="message-time">{{ formatTime(notification.created_at) }}</text>
					</view>
					<text class="message-text">{{ notification.content }}</text>
					<view class="message-meta" v-if="notification.sender">
						<text class="sender-name">来自：{{ notification.sender.nickname || notification.sender.name }}</text>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="message-actions">
					<view class="action-icon" @click.stop="deleteNotification(notification)">
						<text class="delete-icon">🗑️</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else-if="!loading">
			<text class="empty-icon">📭</text>
			<text class="empty-title">暂无消息</text>
			<text class="empty-desc">您目前没有收到任何通知消息</text>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && notifications.length > 0">
			<text class="load-text" @click="loadMore">加载更多</text>
		</view>

		<!-- 加载状态 -->
		<view class="loading-state" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			notifications: [],
			unreadCount: 0,
			selectedType: 'all',
			currentPage: 1,
			hasMore: true,
			loading: false,
			typeFilters: [
				{ value: 'all', label: '全部', icon: '📋' },
				{ value: 'system', label: '系统', icon: '⚙️' },
				{ value: 'study', label: '学习', icon: '📚' },
				{ value: 'interaction', label: '互动', icon: '💬' },
				{ value: 'resource', label: '资源', icon: '📁' },
				{ value: 'announcement', label: '公告', icon: '📢' }
			]
		}
	},
	
	onLoad() {
		this.loadNotifications()
		this.loadUnreadCount()
	},
	
	onShow() {
		// 页面显示时刷新未读数量
		this.loadUnreadCount()
	},
	
	onPullDownRefresh() {
		this.refreshNotifications()
	},
	
	onReachBottom() {
		if (this.hasMore && !this.loading) {
			this.loadMore()
		}
	},
	
	methods: {
		async loadNotifications(reset = true) {
			try {
				if (reset) {
					this.currentPage = 1
					this.notifications = []
				}
				
				this.loading = true
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.redirectTo({
						url: '/pages/login/login'
					})
					return
				}
				
				const params = {
					page: this.currentPage,
					limit: 20
				}
				
				if (this.selectedType !== 'all') {
					params.type = this.selectedType
				}
				
				const response = await uni.request({
					url: 'http://localhost:3000/api/v1/notifications',
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					},
					data: params
				})
				
				if (response.data.success) {
					const data = response.data.data
					if (reset) {
						this.notifications = data.notifications
					} else {
						this.notifications = [...this.notifications, ...data.notifications]
					}
					
					this.hasMore = data.pagination.current_page < data.pagination.total_pages
					this.unreadCount = data.unread_count
				}
			} catch (error) {
				console.error('加载通知失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
			}
		},
		
		async loadUnreadCount() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) return
				
				const response = await uni.request({
					url: 'http://localhost:3000/api/v1/notifications/unread-count',
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					this.unreadCount = response.data.data.unread_count
				}
			} catch (error) {
				console.error('获取未读数量失败:', error)
			}
		},
		
		async refreshNotifications() {
			await this.loadNotifications(true)
			await this.loadUnreadCount()
		},
		
		loadMore() {
			if (this.hasMore && !this.loading) {
				this.currentPage++
				this.loadNotifications(false)
			}
		},
		
		selectType(type) {
			this.selectedType = type
			this.loadNotifications(true)
		},
		
		async handleNotificationClick(notification) {
			// 如果未读，先标记为已读
			if (!notification.is_read) {
				await this.markAsRead(notification.notification_id)
				notification.is_read = true
				notification.read_at = new Date()
				this.unreadCount = Math.max(0, this.unreadCount - 1)
			}
			
			// 处理跳转动作
			if (notification.action_type === 'navigate' && notification.action_url) {
				uni.navigateTo({
					url: notification.action_url
				})
			} else if (notification.action_type === 'external_link' && notification.action_url) {
				// 可以打开外部链接或者显示详情
				uni.showModal({
					title: '外部链接',
					content: `是否打开链接：${notification.action_url}`,
					success: (res) => {
						if (res.confirm) {
							// 在真实环境中可以调用小程序的打开外部链接API
							console.log('打开外部链接:', notification.action_url)
						}
					}
				})
			} else {
				// 显示通知详情
				this.showNotificationDetail(notification)
			}
		},
		
		showNotificationDetail(notification) {
			uni.showModal({
				title: notification.title,
				content: notification.content,
				showCancel: false,
				confirmText: '知道了'
			})
		},
		
		async markAsRead(notificationId) {
			try {
				const token = uni.getStorageSync('token')
				await uni.request({
					url: `http://localhost:3000/api/v1/notifications/${notificationId}/read`,
					method: 'PATCH',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
			} catch (error) {
				console.error('标记已读失败:', error)
			}
		},
		
		async markAllAsRead() {
			try {
				const token = uni.getStorageSync('token')
				uni.showLoading({
					title: '处理中...'
				})
				
				const response = await uni.request({
					url: 'http://localhost:3000/api/v1/notifications/mark-all-read',
					method: 'PATCH',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					// 更新本地数据
					this.notifications.forEach(notification => {
						notification.is_read = true
						notification.read_at = new Date()
					})
					this.unreadCount = 0
					
					uni.showToast({
						title: '全部标记已读',
						icon: 'success'
					})
				}
			} catch (error) {
				console.error('全部标记已读失败:', error)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		async deleteNotification(notification) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这条通知吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							const token = uni.getStorageSync('token')
							const response = await uni.request({
								url: `http://localhost:3000/api/v1/notifications/${notification.notification_id}`,
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							})
							
							if (response.data.success) {
								// 从列表中移除
								const index = this.notifications.findIndex(n => n.notification_id === notification.notification_id)
								if (index > -1) {
									this.notifications.splice(index, 1)
								}
								
								// 如果是未读消息，减少未读计数
								if (!notification.is_read) {
									this.unreadCount = Math.max(0, this.unreadCount - 1)
								}
								
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
							}
						} catch (error) {
							console.error('删除通知失败:', error)
							uni.showToast({
								title: '删除失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		async cleanExpired() {
			uni.showModal({
				title: '清理过期通知',
				content: '确定要清理所有过期的通知吗？',
				success: async (res) => {
					if (res.confirm) {
						try {
							const token = uni.getStorageSync('token')
							const response = await uni.request({
								url: 'http://localhost:3000/api/v1/notifications/expired/clean',
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							})
							
							if (response.data.success) {
								const deletedCount = response.data.data.deleted_count
								if (deletedCount > 0) {
									uni.showToast({
										title: `清理了${deletedCount}条过期通知`,
										icon: 'success'
									})
									// 重新加载通知列表
									this.loadNotifications(true)
								} else {
									uni.showToast({
										title: '没有过期通知',
										icon: 'none'
									})
								}
							}
						} catch (error) {
							console.error('清理过期通知失败:', error)
							uni.showToast({
								title: '清理失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		getTypeIcon(type) {
			const icons = {
				system: '⚙️',
				study: '📚',
				interaction: '💬',
				resource: '📁',
				announcement: '📢'
			}
			return icons[type] || '📋'
		},
		
		formatTime(dateStr) {
			const date = new Date(dateStr)
			const now = new Date()
			const diff = now - date
			
			const minute = 60 * 1000
			const hour = 60 * minute
			const day = 24 * hour
			
			if (diff < minute) {
				return '刚刚'
			} else if (diff < hour) {
				return `${Math.floor(diff / minute)}分钟前`
			} else if (diff < day) {
				return `${Math.floor(diff / hour)}小时前`
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return date.toLocaleDateString('zh-CN', {
					month: '2-digit',
					day: '2-digit'
				})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.messages-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.header-section {
	background: white;
	padding: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
	
	.header-title {
		display: flex;
		align-items: center;
		
		.title-text {
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
			margin-right: 16rpx;
		}
		
		.unread-badge {
			background: #ff3b30;
			color: white;
			padding: 4rpx 12rpx;
			border-radius: 16rpx;
			min-width: 32rpx;
			text-align: center;
			
			.badge-text {
				font-size: 20rpx;
			}
		}
	}
	
	.header-actions {
		display: flex;
		gap: 20rpx;
		
		.action-btn {
			color: #007aff;
			font-size: 28rpx;
		}
	}
}

.filter-section {
	background: white;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	.filter-scroll {
		white-space: nowrap;
		
		.filter-list {
			display: flex;
			padding: 0 30rpx;
			gap: 24rpx;
			
			.filter-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 16rpx 20rpx;
				border-radius: 20rpx;
				background: #f8f8f8;
				min-width: 120rpx;
				
				&.active {
					background: #e8f4fd;
					
					.filter-text {
						color: #007aff;
					}
				}
				
				.filter-icon {
					font-size: 32rpx;
					margin-bottom: 8rpx;
				}
				
				.filter-text {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
	}
}

.messages-list {
	padding: 20rpx;
	
	.message-item {
		background: white;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 16rpx;
		display: flex;
		align-items: flex-start;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		position: relative;
		
		&.unread {
			border-left: 6rpx solid #007aff;
			
			&::before {
				content: '';
				position: absolute;
				top: 30rpx;
				right: 30rpx;
				width: 16rpx;
				height: 16rpx;
				border-radius: 50%;
				background: #ff3b30;
			}
		}
		
		.message-icon {
			position: relative;
			margin-right: 24rpx;
			
			.icon-text {
				font-size: 40rpx;
			}
			
			.priority-dot {
				position: absolute;
				bottom: -4rpx;
				right: -4rpx;
				width: 16rpx;
				height: 16rpx;
				border-radius: 50%;
				
				&.priority-high {
					background: #ff3b30;
				}
				
				&.priority-medium {
					background: #ff9500;
				}
				
				&.priority-low {
					background: #34c759;
				}
			}
		}
		
		.message-content {
			flex: 1;
			min-width: 0;
			
			.message-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 12rpx;
				
				.message-title {
					font-size: 30rpx;
					font-weight: 600;
					color: #333;
					flex: 1;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				
				.message-time {
					font-size: 22rpx;
					color: #999;
					margin-left: 16rpx;
					flex-shrink: 0;
				}
			}
			
			.message-text {
				font-size: 26rpx;
				color: #666;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
			}
			
			.message-meta {
				margin-top: 12rpx;
				
				.sender-name {
					font-size: 22rpx;
					color: #999;
				}
			}
		}
		
		.message-actions {
			margin-left: 16rpx;
			
			.action-icon {
				padding: 8rpx;
				
				.delete-icon {
					font-size: 24rpx;
					color: #ff3b30;
				}
			}
		}
	}
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 60rpx;
	text-align: center;
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: 32rpx;
		opacity: 0.6;
	}
	
	.empty-title {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 16rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #666;
	}
}

.load-more {
	text-align: center;
	padding: 30rpx;
	
	.load-text {
		color: #007aff;
		font-size: 28rpx;
	}
}

.loading-state {
	text-align: center;
	padding: 30rpx;
	
	.loading-text {
		color: #999;
		font-size: 28rpx;
	}
}
</style>