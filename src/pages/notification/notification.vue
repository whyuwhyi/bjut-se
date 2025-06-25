<template>
	<view class="notification-container">
		<!-- 顶部筛选区域 -->
		<view class="filter-section">
			<scroll-view class="filter-scroll" scroll-x="true">
				<view class="filter-list">
					<view 
						class="filter-item" 
						:class="{ active: selectedType === index }"
						v-for="(type, index) in notificationTypes" 
						:key="index"
						@click="selectType(index)"
					>
						<text class="filter-text">{{ type.name }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 通知列表 -->
		<view class="notification-list">
			<view 
				class="notification-item" 
				v-for="(item, index) in filteredNotifications" 
				:key="index"
				@click="viewNotification(item)"
			>
				<!-- 未读标识 -->
				<view class="unread-dot" v-if="!item.isRead"></view>
				
				<!-- 通知图标 -->
				<view class="notification-icon" :class="'icon-' + item.type">
					<text class="icon-emoji">{{ getNotificationIcon(item.type) }}</text>
				</view>
				
				<!-- 通知内容 -->
				<view class="notification-content">
					<view class="notification-header">
						<text class="notification-title">{{ item.title }}</text>
						<view class="notification-tag" :class="'tag-' + item.priority">{{ getPriorityText(item.priority) }}</view>
					</view>
					<text class="notification-desc">{{ item.content }}</text>
					<view class="notification-meta">
						<text class="notification-time">{{ formatTime(item.createTime) }}</text>
						<text class="notification-sender" v-if="item.senderName">{{ item.senderName }}</text>
					</view>
				</view>
				
				<!-- 箭头 -->
				<text class="arrow-icon">›</text>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="filteredNotifications.length === 0">
			<text class="empty-icon">📭</text>
			<text class="empty-text">暂无通知</text>
		</view>

		<!-- 加载更多 -->
		<view class="load-more" v-if="hasMore && filteredNotifications.length > 0">
			<text class="load-text" @click="loadMore">加载更多</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedType: 0,
				notificationTypes: [
					{ name: '全部', value: 'all' },
					{ name: '系统公告', value: 'system' },
					{ name: '学习提醒', value: 'study' },
					{ name: '互动消息', value: 'interaction' },
					{ name: '活动通知', value: 'activity' }
				],
				notifications: [
					{
						id: '1',
						type: 'system',
						priority: 'high',
						title: '系统维护通知',
						content: '系统将于今晚22:00-23:00进行维护，期间可能无法正常使用，请提前做好准备。',
						senderName: '系统管理员',
						isRead: false,
						createTime: new Date('2025-06-20 15:30:00')
					},
					{
						id: '2',
						type: 'study',
						priority: 'medium',
						title: '作业提醒',
						content: '您有一份《软件工程》作业即将到期，请及时完成提交。',
						senderName: '教务系统',
						isRead: false,
						createTime: new Date('2025-06-20 14:20:00')
					},
					{
						id: '3',
						type: 'interaction',
						priority: 'low',
						title: '收到新回复',
						content: '您发布的问题"关于Vue组件通信的问题"收到了新的回复。',
						senderName: '李同学',
						isRead: true,
						createTime: new Date('2025-06-20 11:45:00')
					},
					{
						id: '4',
						type: 'activity',
						priority: 'medium',
						title: '活动报名开始',
						content: '计算机学院"编程竞赛"开始报名，名额有限，先到先得。',
						senderName: '计算机学院',
						isRead: true,
						createTime: new Date('2025-06-19 16:00:00')
					}
				],
				hasMore: false
			}
		},
		computed: {
			filteredNotifications() {
				if (this.selectedType === 0) {
					return this.notifications;
				}
				const typeValue = this.notificationTypes[this.selectedType].value;
				return this.notifications.filter(item => item.type === typeValue);
			}
		},
		methods: {
			selectType(index) {
				this.selectedType = index;
			},
			
			viewNotification(item) {
				// 标记为已读
				if (!item.isRead) {
					item.isRead = true;
					// 这里应该调用API更新已读状态
				}
				
				// 跳转到通知详情页
				uni.navigateTo({
					url: `/pages/notification/detail?id=${item.id}`
				});
			},
			
			getNotificationIcon(type) {
				const icons = {
					system: '⚙️',
					study: '📚',
					interaction: '💬',
					activity: '🎯'
				};
				return icons[type] || '📢';
			},
			
			getPriorityText(priority) {
				const texts = {
					high: '重要',
					medium: '一般',
					low: '普通'
				};
				return texts[priority] || '一般';
			},
			
			formatTime(date) {
				const now = new Date();
				const diff = now - date;
				const minutes = Math.floor(diff / (1000 * 60));
				const hours = Math.floor(diff / (1000 * 60 * 60));
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (minutes < 1) {
					return '刚刚';
				} else if (minutes < 60) {
					return `${minutes}分钟前`;
				} else if (hours < 24) {
					return `${hours}小时前`;
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return date.toLocaleDateString();
				}
			},
			
			loadMore() {
				// 加载更多通知
				console.log('加载更多通知');
			}
		},
		
		onLoad() {
			// 页面加载时获取通知列表
			this.loadNotifications();
		},
		
		onShow() {
			// 页面显示时刷新通知状态
			this.refreshNotifications();
		},
		
		onPullDownRefresh() {
			// 下拉刷新
			this.refreshNotifications();
			setTimeout(() => {
				uni.stopPullDownRefresh();
			}, 1000);
		}
	}
</script>

<style scoped>
	.notification-container {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	/* 筛选区域 */
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
		padding: 12rpx 24rpx;
		background-color: #f0f0f0;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: #666666;
		transition: all 0.3s ease;
	}

	.filter-item.active {
		background-color: #007aff;
		color: #ffffff;
	}

	/* 通知列表 */
	.notification-list {
		padding: 20rpx;
	}

	.notification-item {
		position: relative;
		display: flex;
		align-items: flex-start;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.notification-item:active {
		transform: scale(0.98);
		background-color: #f8f8f8;
	}

	.unread-dot {
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		width: 16rpx;
		height: 16rpx;
		background-color: #ff3b30;
		border-radius: 50%;
	}

	.notification-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		flex-shrink: 0;
	}

	.notification-icon.icon-system {
		background-color: #e8f4fd;
	}

	.notification-icon.icon-study {
		background-color: #fff2e8;
	}

	.notification-icon.icon-interaction {
		background-color: #f0f9ff;
	}

	.notification-icon.icon-activity {
		background-color: #f8f0ff;
	}

	.icon-emoji {
		font-size: 36rpx;
	}

	.notification-content {
		flex: 1;
		min-width: 0;
	}

	.notification-header {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
		gap: 16rpx;
	}

	.notification-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.notification-tag {
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		font-size: 20rpx;
		color: #ffffff;
		flex-shrink: 0;
	}

	.notification-tag.tag-high {
		background-color: #ff3b30;
	}

	.notification-tag.tag-medium {
		background-color: #ff9500;
	}

	.notification-tag.tag-low {
		background-color: #34c759;
	}

	.notification-desc {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.5;
		margin-bottom: 12rpx;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}

	.notification-meta {
		display: flex;
		align-items: center;
		gap: 20rpx;
		font-size: 24rpx;
		color: #999999;
	}

	.arrow-icon {
		font-size: 32rpx;
		color: #cccccc;
		margin-left: 16rpx;
		align-self: center;
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

	.empty-text {
		font-size: 28rpx;
		color: #999999;
	}

	/* 加载更多 */
	.load-more {
		padding: 40rpx;
		text-align: center;
	}

	.load-text {
		font-size: 28rpx;
		color: #007aff;
		padding: 20rpx;
	}
</style>