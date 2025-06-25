<template>
	<view class="activity-container">
		<!-- 顶部筛选 -->
		<view class="filter-section">
			<view class="filter-tabs">
				<view 
					class="filter-tab" 
					:class="{ active: activeTab === index }"
					v-for="(tab, index) in filterTabs" 
					:key="index"
					@click="switchTab(index)"
				>
					<text class="tab-text">{{ tab.name }}</text>
				</view>
			</view>
		</view>

		<!-- 推荐活动轮播 -->
		<view class="featured-section" v-if="activeTab === 0">
			<text class="section-title">🔥 热门推荐</text>
			<swiper class="featured-swiper" indicator-dots="true" autoplay="true" interval="4000">
				<swiper-item v-for="(activity, index) in featuredActivities" :key="index">
					<view class="featured-item" @click="viewActivity(activity)">
						<image class="featured-image" :src="activity.coverImage" mode="aspectFill"></image>
						<view class="featured-overlay">
							<text class="featured-title">{{ activity.title }}</text>
							<text class="featured-desc">{{ activity.shortDesc }}</text>
						</view>
					</view>
				</swiper-item>
			</swiper>
		</view>

		<!-- 活动列表 -->
		<view class="activity-list">
			<view 
				class="activity-item" 
				v-for="(activity, index) in filteredActivities" 
				:key="index"
				@click="viewActivity(activity)"
			>
				<image class="activity-cover" :src="activity.coverImage" mode="aspectFill"></image>
				<view class="activity-content">
					<view class="activity-header">
						<text class="activity-title">{{ activity.title }}</text>
						<view class="activity-status" :class="'status-' + activity.status">
							{{ getStatusText(activity.status) }}
						</view>
					</view>
					
					<text class="activity-desc">{{ activity.description }}</text>
					
					<view class="activity-info">
						<view class="info-item">
							<text class="info-icon">🏫</text>
							<text class="info-text">{{ activity.organizer }}</text>
						</view>
						<view class="info-item">
							<text class="info-icon">📍</text>
							<text class="info-text">{{ activity.location }}</text>
						</view>
						<view class="info-item">
							<text class="info-icon">🕒</text>
							<text class="info-text">{{ formatDate(activity.startTime) }}</text>
						</view>
					</view>
					
					<view class="activity-meta">
						<view class="participant-count">
							<text class="participant-icon">👥</text>
							<text class="participant-text">{{ activity.participantCount }}/{{ activity.maxParticipants }}人</text>
						</view>
						<view class="activity-tags">
							<text class="activity-tag" v-for="tag in activity.tags" :key="tag">{{ tag }}</text>
						</view>
					</view>
					
					<view class="activity-actions">
						<button 
							class="join-btn" 
							:class="{ 
								'joined': activity.isJoined,
								'disabled': activity.status !== 'recruiting' || activity.participantCount >= activity.maxParticipants
							}"
							@click.stop="toggleJoin(activity)"
						>
							{{ getJoinButtonText(activity) }}
						</button>
						<button class="share-btn" @click.stop="shareActivity(activity)">
							<text class="share-icon">📤</text>
						</button>
					</view>
				</view>
			</view>
		</view>

		<!-- 发布活动按钮 -->
		<view class="create-btn" @click="createActivity">
			<text class="create-icon">➕</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			activeTab: 0,
			filterTabs: [
				{ name: '全部', value: 'all' },
				{ name: '进行中', value: 'ongoing' },
				{ name: '即将开始', value: 'upcoming' },
				{ name: '我参与的', value: 'joined' }
			],
			featuredActivities: [
				{
					id: 1,
					title: '第十届程序设计大赛',
					shortDesc: '展示编程技能，赢取丰厚奖品！',
					coverImage: require('@/static/logo.png')
				},
				{
					id: 2,
					title: '人工智能技术分享会',
					shortDesc: '深度学习前沿技术探讨',
					coverImage: require('@/static/logo.png')
				}
			],
			activities: [
				{
					id: 1,
					title: '第十届程序设计大赛',
					description: '面向全校学生的编程竞赛，包含算法设计、数据结构、软件开发等多个方向',
					organizer: '计算机学院',
					location: '教学楼A座机房',
					startTime: new Date('2025-06-25 14:00'),
					endTime: new Date('2025-06-25 18:00'),
					status: 'recruiting', // recruiting, ongoing, finished
					participantCount: 45,
					maxParticipants: 100,
					isJoined: false,
					coverImage: require('@/static/logo.png'),
					tags: ['编程', '竞赛', '算法']
				},
				{
					id: 2,
					title: '人工智能技术分享会',
					description: '邀请行业专家分享最新的AI技术发展趋势，包括机器学习、深度学习等内容',
					organizer: 'AI俱乐部',
					location: '学术报告厅',
					startTime: new Date('2025-06-22 19:00'),
					endTime: new Date('2025-06-22 21:00'),
					status: 'recruiting',
					participantCount: 128,
					maxParticipants: 200,
					isJoined: true,
					coverImage: require('@/static/logo.png'),
					tags: ['AI', '技术分享', '讲座']
				},
				{
					id: 3,
					title: '开源项目贡献Workshop',
					description: '学习如何参与开源项目，提升代码协作能力和开源社区影响力',
					organizer: '开源社团',
					location: '线上会议室',
					startTime: new Date('2025-06-20 15:00'),
					endTime: new Date('2025-06-20 17:30'),
					status: 'ongoing',
					participantCount: 67,
					maxParticipants: 80,
					isJoined: true,
					coverImage: require('@/static/logo.png'),
					tags: ['开源', '协作', 'Git']
				},
				{
					id: 4,
					title: '移动应用开发训练营',
					description: '从零开始学习移动应用开发，涵盖Android、iOS、跨平台开发等内容',
					organizer: '移动开发社',
					location: '实验楼B201',
					startTime: new Date('2025-06-15 09:00'),
					endTime: new Date('2025-06-19 17:00'),
					status: 'finished',
					participantCount: 30,
					maxParticipants: 30,
					isJoined: false,
					coverImage: require('@/static/logo.png'),
					tags: ['移动开发', '训练营', 'App']
				}
			],
			filteredActivities: []
		}
	},
	
	onLoad() {
		this.filteredActivities = this.activities
	},
	
	methods: {
		switchTab(index) {
			this.activeTab = index
			this.filterActivities()
		},
		
		filterActivities() {
			const tabValue = this.filterTabs[this.activeTab].value
			let filtered = this.activities
			
			switch (tabValue) {
				case 'ongoing':
					filtered = filtered.filter(item => item.status === 'ongoing')
					break
				case 'upcoming':
					filtered = filtered.filter(item => item.status === 'recruiting')
					break
				case 'joined':
					filtered = filtered.filter(item => item.isJoined)
					break
				default:
					break
			}
			
			this.filteredActivities = filtered
		},
		
		getStatusText(status) {
			const statusMap = {
				'recruiting': '报名中',
				'ongoing': '进行中',
				'finished': '已结束'
			}
			return statusMap[status] || '未知'
		},
		
		getJoinButtonText(activity) {
			if (activity.status === 'finished') {
				return '已结束'
			} else if (activity.participantCount >= activity.maxParticipants) {
				return '已满员'
			} else if (activity.isJoined) {
				return '已报名'
			} else {
				return '立即报名'
			}
		},
		
		toggleJoin(activity) {
			if (activity.status !== 'recruiting' || activity.participantCount >= activity.maxParticipants) {
				return
			}
			
			if (activity.isJoined) {
				uni.showModal({
					title: '确认取消',
					content: '您确定要取消报名这个活动吗？',
					success: (res) => {
						if (res.confirm) {
							activity.isJoined = false
							activity.participantCount--
							uni.showToast({
								title: '取消报名成功',
								icon: 'success'
							})
						}
					}
				})
			} else {
				activity.isJoined = true
				activity.participantCount++
				uni.showToast({
					title: '报名成功',
					icon: 'success'
				})
			}
		},
		
		shareActivity(activity) {
			uni.showActionSheet({
				itemList: ['分享到微信', '分享到QQ', '复制链接'],
				success: (res) => {
					uni.showToast({
						title: '分享成功',
						icon: 'success'
					})
				}
			})
		},
		
		viewActivity(activity) {
			uni.navigateTo({
				url: `./detail?id=${activity.id}`
			})
		},
		
		createActivity() {
			uni.navigateTo({
				url: './create'
			})
		},
		
		formatDate(date) {
			const month = date.getMonth() + 1
			const day = date.getDate()
			const hours = date.getHours()
			const minutes = date.getMinutes()
			return `${month}月${day}日 ${hours}:${minutes.toString().padStart(2, '0')}`
		}
	}
}
</script>

<style lang="scss" scoped>
.activity-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 160rpx;
}

.filter-section {
	background: white;
	padding: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.filter-tabs {
		display: flex;
		
		.filter-tab {
			flex: 1;
			text-align: center;
			padding: 20rpx;
			margin: 0 10rpx;
			border-radius: 30rpx;
			background: #f8f8f8;
			
			&.active {
				background: #007aff;
				
				.tab-text {
					color: white;
				}
			}
			
			.tab-text {
				font-size: 28rpx;
				color: #666;
			}
		}
	}
}

.featured-section {
	background: white;
	padding: 30rpx 20rpx;
	margin-bottom: 20rpx;
	
	.section-title {
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}
	
	.featured-swiper {
		height: 300rpx;
		border-radius: 20rpx;
		overflow: hidden;
		
		.featured-item {
			position: relative;
			height: 100%;
			
			.featured-image {
				width: 100%;
				height: 100%;
			}
			
			.featured-overlay {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				padding: 30rpx;
				background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
				color: white;
				
				.featured-title {
					display: block;
					font-size: 32rpx;
					font-weight: bold;
					margin-bottom: 10rpx;
				}
				
				.featured-desc {
					font-size: 26rpx;
					opacity: 0.9;
				}
			}
		}
	}
}

.activity-list {
	padding: 20rpx;
	
	.activity-item {
		background: white;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
		.activity-cover {
			width: 100%;
			height: 300rpx;
		}
		
		.activity-content {
			padding: 30rpx;
			
			.activity-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 20rpx;
				
				.activity-title {
					flex: 1;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					line-height: 1.4;
					margin-right: 20rpx;
				}
				
				.activity-status {
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
					font-size: 22rpx;
					color: white;
					
					&.status-recruiting {
						background: #4caf50;
					}
					
					&.status-ongoing {
						background: #ff9800;
					}
					
					&.status-finished {
						background: #9e9e9e;
					}
				}
			}
			
			.activity-desc {
				font-size: 28rpx;
				color: #666;
				line-height: 1.5;
				margin-bottom: 25rpx;
			}
			
			.activity-info {
				margin-bottom: 25rpx;
				
				.info-item {
					display: flex;
					align-items: center;
					margin-bottom: 15rpx;
					
					.info-icon {
						font-size: 26rpx;
						margin-right: 15rpx;
						width: 30rpx;
					}
					
					.info-text {
						font-size: 26rpx;
						color: #666;
					}
				}
			}
			
			.activity-meta {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 30rpx;
				
				.participant-count {
					display: flex;
					align-items: center;
					
					.participant-icon {
						font-size: 28rpx;
						margin-right: 10rpx;
					}
					
					.participant-text {
						font-size: 26rpx;
						color: #666;
					}
				}
				
				.activity-tags {
					display: flex;
					flex-wrap: wrap;
					
					.activity-tag {
						padding: 6rpx 12rpx;
						background: #e3f2fd;
						color: #1976d2;
						border-radius: 15rpx;
						font-size: 22rpx;
						margin-left: 10rpx;
						margin-bottom: 10rpx;
					}
				}
			}
			
			.activity-actions {
				display: flex;
				align-items: center;
				
				.join-btn {
					flex: 1;
					height: 80rpx;
					background: #007aff;
					color: white;
					border: none;
					border-radius: 40rpx;
					font-size: 28rpx;
					font-weight: bold;
					margin-right: 20rpx;
					
					&.joined {
						background: #4caf50;
					}
					
					&.disabled {
						background: #ccc;
					}
				}
				
				.share-btn {
					width: 80rpx;
					height: 80rpx;
					background: #f0f0f0;
					border: none;
					border-radius: 40rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					
					.share-icon {
						font-size: 32rpx;
						color: #666;
					}
				}
			}
		}
	}
}

.create-btn {
	position: fixed;
	right: 40rpx;
	bottom: 160rpx;
	width: 120rpx;
	height: 120rpx;
	background: linear-gradient(45deg, #667eea, #764ba2);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.4);
	z-index: 100;
	
	.create-icon {
		font-size: 40rpx;
		color: white;
	}
}
</style>