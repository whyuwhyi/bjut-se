<template>
	<view class="messages-container">
		<!-- 标签切换 -->
		<view class="tab-bar">
			<view class="tab-item" 
				v-for="(tab, index) in tabs" 
				:key="index"
				:class="{ 'active': currentTab === tab.key }"
				@click="switchTab(tab.key)">
				<text class="tab-text">{{ tab.name }}</text>
				<view class="tab-badge" v-if="tab.count > 0">{{ tab.count }}</view>
			</view>
		</view>

		<!-- 私信消息 -->
		<view class="message-list" v-if="currentTab === 'messages'">
			<view class="message-item" v-for="(message, index) in messageList" :key="index" @click="openChat(message)">
				<image class="user-avatar" :src="message.avatar || require('@/static/images/default-avatar.png')" mode="aspectFill"></image>
				<view class="message-info">
					<view class="message-header">
						<text class="user-name">{{ message.userName }}</text>
						<text class="message-time">{{ formatTime(message.lastTime) }}</text>
					</view>
					<text class="message-content" :class="{ 'unread': message.unreadCount > 0 }">{{ message.lastMessage }}</text>
				</view>
				<view class="unread-badge" v-if="message.unreadCount > 0">{{ message.unreadCount }}</view>
			</view>
		</view>

		<!-- 系统通知 -->
		<view class="notification-list" v-if="currentTab === 'notifications'">
			<view class="notification-item" v-for="(notification, index) in notificationList" :key="index" @click="viewNotification(notification)">
				<view class="notification-icon" :class="'icon-' + notification.type">
					<text class="icon-emoji">{{ getNotificationIcon(notification.type) }}</text>
				</view>
				<view class="notification-info">
					<text class="notification-title">{{ notification.title }}</text>
					<text class="notification-content">{{ notification.content }}</text>
					<text class="notification-time">{{ formatTime(notification.createTime) }}</text>
				</view>
				<view class="unread-dot" v-if="!notification.isRead"></view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-if="getCurrentList().length === 0">
			<text class="empty-icon">{{ currentTab === 'messages' ? '💬' : '🔔' }}</text>
			<text class="empty-text">{{ currentTab === 'messages' ? '暂无私信消息' : '暂无系统通知' }}</text>
			<text class="empty-desc">{{ currentTab === 'messages' ? '开始与其他用户互动吧' : '系统消息会显示在这里' }}</text>
		</view>

		<!-- 浮动操作按钮 -->
		<view class="fab" v-if="currentTab === 'messages'" @click="startNewChat">
			<text class="fab-icon">✉️</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentTab: 'messages',
			tabs: [
				{ key: 'messages', name: '私信', count: 3 },
				{ key: 'notifications', name: '通知', count: 5 }
			],
			messageList: [],
			notificationList: []
		}
	},
	
	onLoad() {
		this.loadMessages()
		this.loadNotifications()
	},
	
	onPullDownRefresh() {
		this.loadMessages()
		this.loadNotifications()
		setTimeout(() => {
			uni.stopPullDownRefresh()
		}, 1000)
	},
	
	methods: {
		async loadMessages() {
			try {
				// 模拟数据，实际应调用云函数
				this.messageList = [
					{
						id: 1,
						userName: '李教授',
						avatar: '',
						lastMessage: '关于你提交的作业，有几个问题需要讨论',
						lastTime: new Date('2025-06-21 10:30:00'),
						unreadCount: 2
					},
					{
						id: 2,
						userName: '张同学',
						avatar: '',
						lastMessage: '谢谢你分享的学习资料！',
						lastTime: new Date('2025-06-20 15:20:00'),
						unreadCount: 1
					},
					{
						id: 3,
						userName: '王老师',
						avatar: '',
						lastMessage: '明天的讲座记得参加',
						lastTime: new Date('2025-06-19 09:45:00'),
						unreadCount: 0
					}
				]
			} catch (error) {
				console.error('加载私信失败:', error)
			}
		},
		
		async loadNotifications() {
			try {
				// 模拟数据，实际应调用云函数
				this.notificationList = [
					{
						id: 1,
						type: 'like',
						title: '获得新赞',
						content: '你的讨论"关于数据库设计的几个问题"收到了3个赞',
						createTime: new Date('2025-06-21 14:20:00'),
						isRead: false
					},
					{
						id: 2,
						type: 'comment',
						title: '新的回复',
						content: '李同学回复了你的讨论',
						createTime: new Date('2025-06-21 11:15:00'),
						isRead: false
					},
					{
						id: 3,
						type: 'follow',
						title: '新的关注者',
						content: '张教授关注了你',
						createTime: new Date('2025-06-20 16:30:00'),
						isRead: false
					},
					{
						id: 4,
						type: 'system',
						title: '系统维护通知',
						content: '系统将于今晚22:00-24:00进行维护，期间可能无法正常使用',
						createTime: new Date('2025-06-20 10:00:00'),
						isRead: true
					}
				]
			} catch (error) {
				console.error('加载通知失败:', error)
			}
		},
		
		switchTab(tabKey) {
			this.currentTab = tabKey
		},
		
		getCurrentList() {
			return this.currentTab === 'messages' ? this.messageList : this.notificationList
		},
		
		openChat(message) {
			uni.navigateTo({
				url: `/pages/chat/chat?userId=${message.id}&userName=${message.userName}`
			})
		},
		
		viewNotification(notification) {
			if (!notification.isRead) {
				notification.isRead = true
				// 更新未读数量
				const notificationTab = this.tabs.find(tab => tab.key === 'notifications')
				if (notificationTab.count > 0) {
					notificationTab.count--
				}
			}
			
			if (notification.type === 'system') {
				uni.navigateTo({
					url: `/pages/notification/detail?id=${notification.id}`
				})
			} else {
				uni.showToast({
					title: '已查看',
					icon: 'success'
				})
			}
		},
		
		startNewChat() {
			uni.navigateTo({
				url: '/pages/profile/select-user'
			})
		},
		
		getNotificationIcon(type) {
			const iconMap = {
				'like': '❤️',
				'comment': '💬',
				'follow': '👥',
				'system': '🔔',
				'activity': '🎯',
				'resource': '📚'
			}
			return iconMap[type] || '📢'
		},
		
		formatTime(time) {
			const now = new Date()
			const diff = now - time
			const day = 24 * 60 * 60 * 1000
			
			if (diff < 60 * 60 * 1000) {
				const minutes = Math.floor(diff / (60 * 1000))
				return minutes > 0 ? `${minutes}分钟前` : '刚刚'
			} else if (diff < day) {
				const hours = Math.floor(diff / (60 * 60 * 1000))
				return `${hours}小时前`
			} else if (diff < 7 * day) {
				return `${Math.floor(diff / day)}天前`
			} else {
				return time.toLocaleDateString()
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.messages-container {
	background: #f5f5f5;
	min-height: 100vh;
}

.tab-bar {
	background: white;
	display: flex;
	border-bottom: 1rpx solid #f0f0f0;
	
	.tab-item {
		flex: 1;
		padding: 30rpx 20rpx;
		text-align: center;
		position: relative;
		
		&.active {
			border-bottom: 4rpx solid #007aff;
			
			.tab-text {
				color: #007aff;
				font-weight: bold;
			}
		}
		
		.tab-text {
			font-size: 30rpx;
			color: #666;
		}
		
		.tab-badge {
			position: absolute;
			top: 20rpx;
			right: 30rpx;
			background: #ff3b30;
			color: white;
			font-size: 20rpx;
			padding: 4rpx 8rpx;
			border-radius: 12rpx;
			min-width: 20rpx;
			text-align: center;
		}
	}
}

.message-list {
	.message-item {
		background: white;
		padding: 30rpx;
		margin-bottom: 2rpx;
		display: flex;
		align-items: center;
		position: relative;
		
		.user-avatar {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			margin-right: 30rpx;
		}
		
		.message-info {
			flex: 1;
			
			.message-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10rpx;
				
				.user-name {
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
				}
				
				.message-time {
					font-size: 24rpx;
					color: #999;
				}
			}
			
			.message-content {
				font-size: 26rpx;
				color: #666;
				
				&.unread {
					color: #333;
					font-weight: bold;
				}
			}
		}
		
		.unread-badge {
			background: #ff3b30;
			color: white;
			font-size: 20rpx;
			padding: 4rpx 8rpx;
			border-radius: 12rpx;
			min-width: 20rpx;
			text-align: center;
		}
	}
}

.notification-list {
	.notification-item {
		background: white;
		padding: 30rpx;
		margin-bottom: 2rpx;
		display: flex;
		align-items: flex-start;
		position: relative;
		
		.notification-icon {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 30rpx;
			
			&.icon-like {
				background: #ff3b30;
			}
			
			&.icon-comment {
				background: #007aff;
			}
			
			&.icon-follow {
				background: #5ac725;
			}
			
			&.icon-system {
				background: #ff9500;
			}
			
			.icon-emoji {
				font-size: 28rpx;
			}
		}
		
		.notification-info {
			flex: 1;
			
			.notification-title {
				display: block;
				font-size: 30rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 10rpx;
			}
			
			.notification-content {
				display: block;
				font-size: 26rpx;
				color: #666;
				margin-bottom: 10rpx;
			}
			
			.notification-time {
				font-size: 24rpx;
				color: #999;
			}
		}
		
		.unread-dot {
			width: 12rpx;
			height: 12rpx;
			background: #ff3b30;
			border-radius: 50%;
			position: absolute;
			top: 30rpx;
			right: 30rpx;
		}
	}
}

.empty-state {
	text-align: center;
	padding: 120rpx 60rpx;
	
	.empty-icon {
		display: block;
		font-size: 120rpx;
		margin-bottom: 30rpx;
	}
	
	.empty-text {
		display: block;
		font-size: 32rpx;
		color: #666;
		margin-bottom: 15rpx;
	}
	
	.empty-desc {
		font-size: 26rpx;
		color: #999;
	}
}

.fab {
	position: fixed;
	bottom: 160rpx;
	right: 40rpx;
	width: 100rpx;
	height: 100rpx;
	background: #007aff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 16rpx rgba(0, 122, 255, 0.3);
	
	.fab-icon {
		font-size: 36rpx;
		color: white;
	}
}
</style>