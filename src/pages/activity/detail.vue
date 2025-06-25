<template>
	<view class="activity-detail-container">
		<!-- 活动头图 -->
		<view class="activity-header">
			<image class="activity-poster" :src="activity.posterUrl || '/static/images/default-activity.jpg'" mode="aspectFill"></image>
			<view class="header-overlay">
				<view class="activity-status" :class="activity.status">
					{{ getStatusText(activity.status) }}
				</view>
				<view class="activity-actions">
					<view class="action-btn" @click="shareActivity">
						<text class="action-icon">📤</text>
					</view>
					<view class="action-btn" @click="favoriteActivity">
						<text class="action-icon" :class="{ favorited: activity.isFavorited }">
							{{ activity.isFavorited ? '❤️' : '🤍' }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 活动基本信息 -->
		<view class="activity-info">
			<text class="activity-title">{{ activity.title }}</text>
			
			<view class="activity-meta">
				<view class="meta-item">
					<text class="meta-icon">🏢</text>
					<text class="meta-text">{{ activity.organizerName }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">📍</text>
					<text class="meta-text">{{ activity.location }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">🕒</text>
					<text class="meta-text">{{ formatDateTime(activity.startTime) }}</text>
				</view>
				<view class="meta-item" v-if="activity.endTime">
					<text class="meta-icon">⏰</text>
					<text class="meta-text">结束：{{ formatDateTime(activity.endTime) }}</text>
				</view>
			</view>
			
			<view class="activity-tags">
				<text class="tag" v-for="(tag, index) in activity.tags" :key="index">{{ tag }}</text>
			</view>
		</view>

		<!-- 报名信息 -->
		<view class="registration-info">
			<view class="registration-header">
				<text class="section-title">报名信息</text>
				<view class="registration-progress">
					<text class="progress-text">
						{{ activity.currentParticipants }}/{{ activity.maxParticipants || '∞' }}
					</text>
					<view class="progress-bar" v-if="activity.maxParticipants">
						<view 
							class="progress-fill" 
							:style="{ width: getProgressWidth() + '%' }"
						></view>
					</view>
				</view>
			</view>
			
			<view class="registration-details">
				<view class="detail-item">
					<text class="detail-label">报名截止：</text>
					<text class="detail-value">{{ formatDateTime(activity.registrationDeadline) }}</text>
				</view>
				<view class="detail-item" v-if="activity.fee">
					<text class="detail-label">活动费用：</text>
					<text class="detail-value fee">¥{{ activity.fee }}</text>
				</view>
				<view class="detail-item" v-if="activity.requirements">
					<text class="detail-label">报名要求：</text>
					<text class="detail-value">{{ activity.requirements }}</text>
				</view>
			</view>
		</view>

		<!-- 活动详情 -->
		<view class="activity-description">
			<view class="section-header">
				<text class="section-title">活动详情</text>
			</view>
			<view class="description-content">
				<text class="description-text">{{ activity.description }}</text>
				
				<!-- 活动图片 -->
				<view class="activity-images" v-if="activity.images && activity.images.length">
					<image 
						class="activity-image" 
						v-for="(image, index) in activity.images" 
						:key="index"
						:src="image"
						mode="aspectFill"
						@click="previewImage(index)"
					></image>
				</view>
			</view>
		</view>

		<!-- 活动流程 -->
		<view class="activity-schedule" v-if="activity.schedule && activity.schedule.length">
			<view class="section-header">
				<text class="section-title">活动安排</text>
			</view>
			<view class="schedule-list">
				<view class="schedule-item" v-for="(item, index) in activity.schedule" :key="index">
					<view class="schedule-time">{{ item.time }}</view>
					<view class="schedule-content">
						<text class="schedule-title">{{ item.title }}</text>
						<text class="schedule-desc" v-if="item.description">{{ item.description }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 参与者列表 -->
		<view class="participants-section">
			<view class="section-header">
				<text class="section-title">参与者 ({{ participants.length }})</text>
				<text class="view-all" @click="viewAllParticipants" v-if="participants.length > 6">
					查看全部
				</text>
			</view>
			<view class="participants-list">
				<view 
					class="participant-item" 
					v-for="(participant, index) in displayedParticipants" 
					:key="index"
				>
					<image class="participant-avatar" :src="participant.avatar || '/static/images/default-avatar.png'"></image>
					<text class="participant-name">{{ participant.name }}</text>
				</view>
			</view>
		</view>

		<!-- 相关活动 -->
		<view class="related-activities" v-if="relatedActivities.length">
			<view class="section-header">
				<text class="section-title">相关活动</text>
			</view>
			<scroll-view class="related-scroll" scroll-x="true">
				<view class="related-list">
					<view 
						class="related-item" 
						v-for="(item, index) in relatedActivities" 
						:key="index"
						@click="viewActivity(item)"
					>
						<image class="related-poster" :src="item.posterUrl || '/static/images/default-activity.jpg'"></image>
						<view class="related-info">
							<text class="related-title">{{ item.title }}</text>
							<text class="related-time">{{ formatDate(item.startTime) }}</text>
							<text class="related-location">📍 {{ item.location }}</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部操作栏 -->
		<view class="bottom-actions">
			<view class="action-info">
				<text class="action-price" v-if="activity.fee">¥{{ activity.fee }}</text>
				<text class="action-price free" v-else>免费</text>
				<text class="action-deadline">报名截止：{{ formatDeadline(activity.registrationDeadline) }}</text>
			</view>
			<button 
				class="register-btn" 
				:class="{ 
					registered: isRegistered, 
					disabled: !canRegister 
				}"
				@click="handleRegistration"
				:disabled="!canRegister"
			>
				{{ getRegisterButtonText() }}
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			activityId: '',
			activity: {
				id: 1,
				title: '人工智能前沿技术讲座',
				description: '本次讲座将邀请人工智能领域的知名专家，为大家分享最新的AI技术发展趋势、应用案例以及未来展望。\n\n讲座内容包括：\n• 深度学习最新进展\n• 计算机视觉应用实例\n• 自然语言处理技术发展\n• AI在各行业的应用前景\n• 互动问答环节\n\n适合对人工智能感兴趣的同学参加，欢迎大家积极报名！',
				organizerName: '计算机学院学生会',
				location: '学术报告厅A101',
				startTime: new Date('2025-06-25 14:00:00'),
				endTime: new Date('2025-06-25 16:30:00'),
				registrationDeadline: new Date('2025-06-24 18:00:00'),
				maxParticipants: 200,
				currentParticipants: 156,
				fee: 0,
				requirements: '计算机相关专业学生优先',
				status: 'published', // draft, published, ongoing, completed, cancelled
				tags: ['讲座', '人工智能', '学术', '免费'],
				posterUrl: '',
				images: [],
				isFavorited: false,
				schedule: [
					{
						time: '14:00-14:10',
						title: '开场致辞',
						description: '主持人介绍活动流程和嘉宾'
					},
					{
						time: '14:10-15:00',
						title: '主题演讲：AI技术发展趋势',
						description: '专家分享人工智能最新发展动态'
					},
					{
						time: '15:00-15:15',
						title: '茶歇时间',
						description: '自由交流，提供茶点'
					},
					{
						time: '15:15-16:00',
						title: '应用案例分享',
						description: '具体项目案例深度解析'
					},
					{
						time: '16:00-16:30',
						title: '互动问答',
						description: '现场提问与专家互动'
					}
				]
			},
			participants: [
				{ id: 1, name: '张同学', avatar: '' },
				{ id: 2, name: '李同学', avatar: '' },
				{ id: 3, name: '王同学', avatar: '' },
				{ id: 4, name: '赵同学', avatar: '' },
				{ id: 5, name: '陈同学', avatar: '' },
				{ id: 6, name: '刘同学', avatar: '' },
				{ id: 7, name: '周同学', avatar: '' },
				{ id: 8, name: '吴同学', avatar: '' }
			],
			relatedActivities: [
				{
					id: 2,
					title: '编程竞赛选拔赛',
					startTime: new Date('2025-06-28'),
					location: '机房B203',
					posterUrl: ''
				},
				{
					id: 3,
					title: '创业分享会',
					startTime: new Date('2025-06-30'),
					location: '创业园会议室',
					posterUrl: ''
				}
			],
			isRegistered: false
		}
	},
	
	computed: {
		displayedParticipants() {
			return this.participants.slice(0, 6)
		},
		
		canRegister() {
			const now = new Date()
			return this.activity.status === 'published' && 
				   now < this.activity.registrationDeadline &&
				   (!this.activity.maxParticipants || this.activity.currentParticipants < this.activity.maxParticipants)
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.activityId = options.id
			this.loadActivityDetail()
		}
	},
	
	methods: {
		async loadActivityDetail() {
			try {
				uni.showLoading({ title: '加载中...' })
				// 模拟API调用
				setTimeout(() => {
					uni.hideLoading()
					// 检查用户是否已报名
					this.checkRegistrationStatus()
				}, 1000)
			} catch (error) {
				uni.hideLoading()
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		checkRegistrationStatus() {
			// 模拟检查报名状态
			this.isRegistered = false
		},
		
		getStatusText(status) {
			const statusMap = {
				draft: '草稿',
				published: '报名中',
				ongoing: '进行中',
				completed: '已结束',
				cancelled: '已取消'
			}
			return statusMap[status] || status
		},
		
		getProgressWidth() {
			if (!this.activity.maxParticipants) return 0
			return Math.min(100, (this.activity.currentParticipants / this.activity.maxParticipants) * 100)
		},
		
		getRegisterButtonText() {
			if (this.isRegistered) return '已报名'
			if (!this.canRegister) {
				if (new Date() >= this.activity.registrationDeadline) return '报名已截止'
				if (this.activity.currentParticipants >= this.activity.maxParticipants) return '名额已满'
				return '暂不可报名'
			}
			return '立即报名'
		},
		
		handleRegistration() {
			if (!this.canRegister) return
			
			if (this.isRegistered) {
				// 取消报名
				uni.showModal({
					title: '确认取消',
					content: '确定要取消报名吗？',
					success: (res) => {
						if (res.confirm) {
							this.cancelRegistration()
						}
					}
				})
			} else {
				// 确认报名
				this.confirmRegistration()
			}
		},
		
		confirmRegistration() {
			uni.showModal({
				title: '确认报名',
				content: `确定要报名参加"${this.activity.title}"吗？`,
				success: (res) => {
					if (res.confirm) {
						this.registerActivity()
					}
				}
			})
		},
		
		registerActivity() {
			uni.showLoading({ title: '报名中...' })
			
			// 模拟报名过程
			setTimeout(() => {
				uni.hideLoading()
				this.isRegistered = true
				this.activity.currentParticipants++
				
				uni.showToast({
					title: '报名成功',
					icon: 'success'
				})
			}, 1500)
		},
		
		cancelRegistration() {
			uni.showLoading({ title: '取消中...' })
			
			// 模拟取消报名
			setTimeout(() => {
				uni.hideLoading()
				this.isRegistered = false
				this.activity.currentParticipants--
				
				uni.showToast({
					title: '已取消报名',
					icon: 'success'
				})
			}, 1000)
		},
		
		shareActivity() {
			uni.showActionSheet({
				itemList: ['分享给好友', '复制链接', '生成海报'],
				success: (res) => {
					const actions = ['分享给好友', '复制链接', '生成海报']
					uni.showToast({
						title: actions[res.tapIndex],
						icon: 'none'
					})
				}
			})
		},
		
		favoriteActivity() {
			this.activity.isFavorited = !this.activity.isFavorited
			uni.showToast({
				title: this.activity.isFavorited ? '已收藏' : '已取消收藏',
				icon: 'none'
			})
		},
		
		viewAllParticipants() {
			uni.navigateTo({
				url: `./participants?id=${this.activityId}`
			})
		},
		
		viewActivity(activity) {
			uni.navigateTo({
				url: `./detail?id=${activity.id}`
			})
		},
		
		previewImage(index) {
			uni.previewImage({
				urls: this.activity.images,
				current: index
			})
		},
		
		formatDateTime(date) {
			return date.toLocaleString('zh-CN', {
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			})
		},
		
		formatDate(date) {
			return date.toLocaleDateString('zh-CN', {
				month: '2-digit',
				day: '2-digit'
			})
		},
		
		formatDeadline(date) {
			const now = new Date()
			const diff = date - now
			const hours = Math.ceil(diff / (1000 * 60 * 60))
			
			if (hours <= 0) return '已截止'
			if (hours <= 24) return `${hours}小时后`
			
			const days = Math.ceil(hours / 24)
			return `${days}天后`
		}
	}
}
</script>

<style lang="scss" scoped>
.activity-detail-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 160rpx;
}

.activity-header {
	position: relative;
	height: 400rpx;
	
	.activity-poster {
		width: 100%;
		height: 100%;
	}
	
	.header-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 30rpx;
		
		.activity-status {
			padding: 8rpx 20rpx;
			border-radius: 20rpx;
			font-size: 24rpx;
			color: white;
			
			&.published {
				background: #4caf50;
			}
			
			&.ongoing {
				background: #ff9800;
			}
			
			&.completed {
				background: #9e9e9e;
			}
			
			&.cancelled {
				background: #f44336;
			}
		}
		
		.activity-actions {
			display: flex;
			gap: 15rpx;
			
			.action-btn {
				width: 60rpx;
				height: 60rpx;
				background: rgba(0, 0, 0, 0.5);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				
				.action-icon {
					font-size: 32rpx;
					
					&.favorited {
						color: #ff4757;
					}
				}
			}
		}
	}
}

.activity-info {
	background: white;
	padding: 40rpx 30rpx;
	
	.activity-title {
		display: block;
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		line-height: 1.3;
		margin-bottom: 30rpx;
	}
	
	.activity-meta {
		margin-bottom: 25rpx;
		
		.meta-item {
			display: flex;
			align-items: center;
			margin-bottom: 15rpx;
			
			.meta-icon {
				font-size: 28rpx;
				margin-right: 15rpx;
				width: 35rpx;
			}
			
			.meta-text {
				font-size: 26rpx;
				color: #333;
			}
		}
	}
	
	.activity-tags {
		.tag {
			display: inline-block;
			padding: 8rpx 16rpx;
			background: #e3f2fd;
			color: #1976d2;
			border-radius: 20rpx;
			font-size: 22rpx;
			margin-right: 15rpx;
		}
	}
}

.registration-info, .activity-description, .activity-schedule, .participants-section, .related-activities {
	background: white;
	margin: 20rpx 0;
	padding: 30rpx;
	
	.section-header, .registration-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 25rpx;
		
		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}
}

.registration-progress {
	display: flex;
	align-items: center;
	
	.progress-text {
		font-size: 24rpx;
		color: #666;
		margin-right: 15rpx;
	}
	
	.progress-bar {
		width: 120rpx;
		height: 8rpx;
		background: #e0e0e0;
		border-radius: 4rpx;
		overflow: hidden;
		
		.progress-fill {
			height: 100%;
			background: #4caf50;
			transition: width 0.3s;
		}
	}
}

.registration-details {
	.detail-item {
		display: flex;
		margin-bottom: 15rpx;
		
		.detail-label {
			font-size: 26rpx;
			color: #666;
			width: 180rpx;
		}
		
		.detail-value {
			font-size: 26rpx;
			color: #333;
			flex: 1;
			
			&.fee {
				color: #ff9800;
				font-weight: bold;
			}
		}
	}
}

.description-content {
	.description-text {
		font-size: 28rpx;
		color: #333;
		line-height: 1.6;
		white-space: pre-line;
		margin-bottom: 25rpx;
	}
	
	.activity-images {
		display: flex;
		flex-wrap: wrap;
		gap: 15rpx;
		
		.activity-image {
			width: 200rpx;
			height: 200rpx;
			border-radius: 12rpx;
		}
	}
}

.schedule-list {
	.schedule-item {
		display: flex;
		padding: 25rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		.schedule-time {
			width: 160rpx;
			font-size: 24rpx;
			color: #007aff;
			font-weight: bold;
		}
		
		.schedule-content {
			flex: 1;
			
			.schedule-title {
				display: block;
				font-size: 28rpx;
				color: #333;
				font-weight: bold;
				margin-bottom: 8rpx;
			}
			
			.schedule-desc {
				font-size: 24rpx;
				color: #666;
				line-height: 1.4;
			}
		}
	}
}

.participants-list {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	
	.participant-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 80rpx;
		
		.participant-avatar {
			width: 60rpx;
			height: 60rpx;
			border-radius: 50%;
			margin-bottom: 8rpx;
		}
		
		.participant-name {
			font-size: 20rpx;
			color: #666;
			text-align: center;
		}
	}
}

.related-scroll {
	white-space: nowrap;
	
	.related-list {
		display: flex;
		
		.related-item {
			display: flex;
			flex-direction: column;
			width: 280rpx;
			margin-right: 20rpx;
			
			.related-poster {
				width: 100%;
				height: 160rpx;
				border-radius: 12rpx;
				margin-bottom: 15rpx;
			}
			
			.related-info {
				.related-title {
					display: block;
					font-size: 26rpx;
					color: #333;
					margin-bottom: 8rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				
				.related-time, .related-location {
					font-size: 22rpx;
					color: #666;
					margin-bottom: 5rpx;
				}
			}
		}
	}
}

.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	border-top: 1rpx solid #e0e0e0;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	
	.action-info {
		flex: 1;
		
		.action-price {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #ff9800;
			
			&.free {
				color: #4caf50;
			}
		}
		
		.action-deadline {
			font-size: 22rpx;
			color: #666;
		}
	}
	
	.register-btn {
		width: 200rpx;
		height: 70rpx;
		background: #007aff;
		color: white;
		border: none;
		border-radius: 35rpx;
		font-size: 28rpx;
		
		&.registered {
			background: #9e9e9e;
		}
		
		&.disabled {
			background: #ccc;
		}
	}
}

.view-all {
	font-size: 26rpx;
	color: #007aff;
}
</style>