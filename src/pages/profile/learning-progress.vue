<template>
	<view class="learning-container">
		<!-- 顶部统计概览 -->
		<view class="stats-overview">
			<view class="overview-card">
				<text class="overview-title">学习概览</text>
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-value">{{ learningStats.totalStudyTime }}</text>
						<text class="stat-label">学习时长(小时)</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ learningStats.resourcesViewed }}</text>
						<text class="stat-label">浏览资源</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ learningStats.discussionsJoined }}</text>
						<text class="stat-label">参与讨论</text>
					</view>
					<view class="stat-item">
						<text class="stat-value">{{ learningStats.activitiesJoined }}</text>
						<text class="stat-label">参与活动</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 学习进度图表 -->
		<view class="progress-section">
			<view class="section-header">
				<text class="section-title">本周学习进度</text>
				<view class="time-filter">
					<text 
						class="filter-option" 
						:class="{ active: selectedPeriod === index }"
						v-for="(period, index) in timePeriods" 
						:key="index"
						@click="selectPeriod(index)"
					>
						{{ period }}
					</text>
				</view>
			</view>
			
			<!-- 学习时长图表 -->
			<view class="chart-container">
				<view class="chart-title">📊 每日学习时长</view>
				<view class="chart-content">
					<view class="chart-bars">
						<view 
							class="bar-item" 
							v-for="(day, index) in weeklyData" 
							:key="index"
						>
							<view 
								class="bar-fill" 
								:style="{ height: getBarHeight(day.minutes) + '%' }"
							></view>
							<text class="bar-value">{{ formatMinutes(day.minutes) }}</text>
							<text class="bar-label">{{ day.day }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 学习成就 -->
		<view class="achievements-section">
			<view class="section-header">
				<text class="section-title">学习成就</text>
				<text class="section-more" @click="viewAllAchievements">查看全部</text>
			</view>
			<scroll-view class="achievements-scroll" scroll-x="true">
				<view class="achievement-list">
					<view 
						class="achievement-item" 
						:class="{ unlocked: achievement.unlocked }"
						v-for="(achievement, index) in achievements" 
						:key="index"
						@click="viewAchievement(achievement)"
					>
						<text class="achievement-icon">{{ achievement.icon }}</text>
						<text class="achievement-name">{{ achievement.name }}</text>
						<text class="achievement-desc">{{ achievement.description }}</text>
						<view class="achievement-progress" v-if="!achievement.unlocked">
							<view 
								class="progress-bar" 
								:style="{ width: achievement.progress + '%' }"
							></view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 最近活动 -->
		<view class="recent-activities">
			<view class="section-header">
				<text class="section-title">最近活动</text>
				<text class="section-more" @click="viewAllActivities">查看全部</text>
			</view>
			<view class="activity-list">
				<view 
					class="activity-item" 
					v-for="(activity, index) in recentActivities" 
					:key="index"
					@click="viewActivity(activity)"
				>
					<view class="activity-icon" :class="'icon-' + activity.type">
						<text class="icon-emoji">{{ getActivityIcon(activity.type) }}</text>
					</view>
					<view class="activity-content">
						<text class="activity-title">{{ activity.title }}</text>
						<text class="activity-desc">{{ activity.description }}</text>
						<text class="activity-time">{{ formatTime(activity.createTime) }}</text>
					</view>
					<view class="activity-reward" v-if="activity.reward">
						<text class="reward-text">+{{ activity.reward }}经验</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 学习目标 -->
		<view class="goals-section">
			<view class="section-header">
				<text class="section-title">学习目标</text>
				<text class="section-more" @click="setGoals">设置目标</text>
			</view>
			<view class="goal-list">
				<view 
					class="goal-item" 
					v-for="(goal, index) in learningGoals" 
					:key="index"
				>
					<view class="goal-header">
						<text class="goal-title">{{ goal.title }}</text>
						<text class="goal-status" :class="goal.status">{{ getGoalStatusText(goal.status) }}</text>
					</view>
					<view class="goal-progress">
						<view class="progress-info">
							<text class="progress-text">{{ goal.current }}/{{ goal.target }}</text>
							<text class="progress-percent">{{ Math.round(goal.current / goal.target * 100) }}%</text>
						</view>
						<view class="progress-bar-container">
							<view 
								class="progress-bar-fill" 
								:style="{ width: Math.min(goal.current / goal.target * 100, 100) + '%' }"
							></view>
						</view>
					</view>
					<text class="goal-deadline">目标时间：{{ formatDate(goal.deadline) }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedPeriod: 0,
				timePeriods: ['本周', '本月', '本年'],
				learningStats: {
					totalStudyTime: 156,
					resourcesViewed: 89,
					discussionsJoined: 24,
					activitiesJoined: 12
				},
				weeklyData: [
					{ day: '周一', minutes: 120 },
					{ day: '周二', minutes: 90 },
					{ day: '周三', minutes: 150 },
					{ day: '周四', minutes: 80 },
					{ day: '周五', minutes: 200 },
					{ day: '周六', minutes: 45 },
					{ day: '周日', minutes: 110 }
				],
				achievements: [
					{
						id: '1',
						name: '初学者',
						description: '完成首次学习',
						icon: '🌱',
						unlocked: true,
						progress: 100
					},
					{
						id: '2',
						name: '勤奋学者',
						description: '连续学习7天',
						icon: '📚',
						unlocked: true,
						progress: 100
					},
					{
						id: '3',
						name: '讨论达人',
						description: '参与10次讨论',
						icon: '💬',
						unlocked: false,
						progress: 70
					},
					{
						id: '4',
						name: '资源分享者',
						description: '上传10个资源',
						icon: '📤',
						unlocked: false,
						progress: 40
					}
				],
				recentActivities: [
					{
						id: '1',
						type: 'view',
						title: '浏览了《Vue.js基础教程》',
						description: '学习前端开发知识',
						createTime: new Date('2025-06-20 14:30:00'),
						reward: 5
					},
					{
						id: '2',
						type: 'discussion',
						title: '参与讨论《关于React Hooks的使用》',
						description: '在讨论区发表了观点',
						createTime: new Date('2025-06-20 12:15:00'),
						reward: 10
					},
					{
						id: '3',
						type: 'upload',
						title: '上传了《JavaScript高级特性》',
						description: '分享学习资源',
						createTime: new Date('2025-06-20 09:45:00'),
						reward: 15
					},
					{
						id: '4',
						type: 'activity',
						title: '参与了《编程挑战赛》',
						description: '报名参加技能竞赛',
						createTime: new Date('2025-06-19 16:20:00'),
						reward: 20
					}
				],
				learningGoals: [
					{
						id: '1',
						title: '本月学习时长',
						current: 45,
						target: 80,
						status: 'active',
						deadline: new Date('2025-06-30')
					},
					{
						id: '2',
						title: '完成Vue.js课程',
						current: 8,
						target: 12,
						status: 'active',
						deadline: new Date('2025-07-15')
					},
					{
						id: '3',
						title: '参与讨论次数',
						current: 15,
						target: 20,
						status: 'active',
						deadline: new Date('2025-06-30')
					}
				]
			}
		},
		
		methods: {
			selectPeriod(index) {
				this.selectedPeriod = index;
				// 根据选择的时间段加载数据
				this.loadProgressData();
			},
			
			loadProgressData() {
				// 根据时间段加载对应的学习进度数据
				console.log('加载进度数据:', this.timePeriods[this.selectedPeriod]);
			},
			
			getBarHeight(minutes) {
				const maxMinutes = Math.max(...this.weeklyData.map(d => d.minutes));
				return (minutes / maxMinutes) * 100;
			},
			
			formatMinutes(minutes) {
				if (minutes < 60) {
					return minutes + '分';
				} else {
					const hours = Math.floor(minutes / 60);
					const mins = minutes % 60;
					return hours + 'h' + (mins > 0 ? mins + 'm' : '');
				}
			},
			
			viewAllAchievements() {
				uni.navigateTo({
					url: '/pages/profile/achievements'
				});
			},
			
			viewAchievement(achievement) {
				uni.showModal({
					title: achievement.name,
					content: achievement.description + '\n' + 
						(achievement.unlocked ? '已解锁' : `进度：${achievement.progress}%`),
					showCancel: false
				});
			},
			
			viewAllActivities() {
				uni.navigateTo({
					url: '/pages/profile/activities'
				});
			},
			
			viewActivity(activity) {
				// 查看活动详情
				console.log('查看活动:', activity);
			},
			
			setGoals() {
				uni.navigateTo({
					url: '/pages/profile/goals'
				});
			},
			
			getActivityIcon(type) {
				const icons = {
					view: '👀',
					discussion: '💬',
					upload: '📤',
					activity: '🎯',
					download: '📥',
					like: '👍'
				};
				return icons[type] || '📝';
			},
			
			getGoalStatusText(status) {
				const texts = {
					active: '进行中',
					completed: '已完成',
					paused: '已暂停',
					expired: '已过期'
				};
				return texts[status] || '未知';
			},
			
			formatTime(date) {
				const now = new Date();
				const diff = now - date;
				const hours = Math.floor(diff / (1000 * 60 * 60));
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (hours < 1) {
					return '刚刚';
				} else if (hours < 24) {
					return `${hours}小时前`;
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return date.toLocaleDateString();
				}
			},
			
			formatDate(date) {
				return date.toLocaleDateString('zh-CN', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				});
			}
		},
		
		onLoad() {
			this.loadProgressData();
		},
		
		onPullDownRefresh() {
			// 下拉刷新
			setTimeout(() => {
				this.loadProgressData();
				uni.stopPullDownRefresh();
			}, 1000);
		}
	}
</script>

<style scoped>
	.learning-container {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 40rpx;
	}

	/* 统计概览 */
	.stats-overview {
		padding: 32rpx;
	}

	.overview-card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	.overview-title {
		font-size: 36rpx;
		font-weight: 600;
		color: #333333;
		margin-bottom: 32rpx;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32rpx;
	}

	.stat-item {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 48rpx;
		font-weight: 700;
		color: #007aff;
		margin-bottom: 8rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: #666666;
	}

	/* 进度部分 */
	.progress-section {
		margin: 16rpx 32rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
	}

	.section-more {
		font-size: 28rpx;
		color: #007aff;
	}

	.time-filter {
		display: flex;
		gap: 16rpx;
	}

	.filter-option {
		padding: 8rpx 16rpx;
		font-size: 26rpx;
		color: #666666;
		border-radius: 20rpx;
		background-color: #f0f0f0;
	}

	.filter-option.active {
		color: #007aff;
		background-color: #e8f4fd;
	}

	.chart-container {
		margin-top: 24rpx;
	}

	.chart-title {
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 24rpx;
	}

	.chart-bars {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 200rpx;
		padding: 0 16rpx;
	}

	.bar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		position: relative;
	}

	.bar-fill {
		width: 24rpx;
		background: linear-gradient(to top, #007aff, #5ac8fa);
		border-radius: 12rpx 12rpx 0 0;
		margin-bottom: 8rpx;
		min-height: 8rpx;
	}

	.bar-value {
		font-size: 20rpx;
		color: #666666;
		margin-bottom: 8rpx;
	}

	.bar-label {
		font-size: 22rpx;
		color: #999999;
	}

	/* 成就部分 */
	.achievements-section {
		margin: 16rpx 32rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	.achievements-scroll {
		white-space: nowrap;
	}

	.achievement-list {
		display: flex;
		gap: 24rpx;
		padding: 16rpx 0;
	}

	.achievement-item {
		flex-shrink: 0;
		width: 200rpx;
		padding: 24rpx;
		background-color: #f8f9fa;
		border-radius: 16rpx;
		text-align: center;
		border: 2rpx solid transparent;
	}

	.achievement-item.unlocked {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border-color: #667eea;
	}

	.achievement-icon {
		font-size: 48rpx;
		display: block;
		margin-bottom: 16rpx;
	}

	.achievement-name {
		font-size: 28rpx;
		font-weight: 600;
		display: block;
		margin-bottom: 8rpx;
	}

	.achievement-desc {
		font-size: 22rpx;
		opacity: 0.8;
		display: block;
		margin-bottom: 16rpx;
	}

	.achievement-progress {
		height: 6rpx;
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 3rpx;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background-color: #007aff;
		transition: width 0.3s ease;
	}

	/* 最近活动 */
	.recent-activities {
		margin: 16rpx 32rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	.activity-list {
		margin-top: 16rpx;
	}

	.activity-item {
		display: flex;
		align-items: flex-start;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		flex-shrink: 0;
	}

	.activity-icon.icon-view {
		background-color: #e8f4fd;
	}

	.activity-icon.icon-discussion {
		background-color: #f0f9ff;
	}

	.activity-icon.icon-upload {
		background-color: #fff2e8;
	}

	.activity-icon.icon-activity {
		background-color: #f8f0ff;
	}

	.icon-emoji {
		font-size: 28rpx;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-title {
		font-size: 28rpx;
		color: #333333;
		font-weight: 500;
		display: block;
		margin-bottom: 8rpx;
	}

	.activity-desc {
		font-size: 24rpx;
		color: #666666;
		display: block;
		margin-bottom: 8rpx;
	}

	.activity-time {
		font-size: 22rpx;
		color: #999999;
	}

	.activity-reward {
		padding: 6rpx 12rpx;
		background-color: #e8f5e8;
		border-radius: 12rpx;
		margin-left: 16rpx;
	}

	.reward-text {
		font-size: 22rpx;
		color: #34c759;
		font-weight: 500;
	}

	/* 学习目标 */
	.goals-section {
		margin: 16rpx 32rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	.goal-list {
		margin-top: 16rpx;
	}

	.goal-item {
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.goal-item:last-child {
		border-bottom: none;
	}

	.goal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}

	.goal-title {
		font-size: 28rpx;
		color: #333333;
		font-weight: 500;
	}

	.goal-status {
		padding: 4rpx 12rpx;
		border-radius: 12rpx;
		font-size: 22rpx;
		color: #ffffff;
	}

	.goal-status.active {
		background-color: #007aff;
	}

	.goal-status.completed {
		background-color: #34c759;
	}

	.goal-progress {
		margin-bottom: 12rpx;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 8rpx;
	}

	.progress-text {
		font-size: 24rpx;
		color: #666666;
	}

	.progress-percent {
		font-size: 24rpx;
		color: #007aff;
		font-weight: 500;
	}

	.progress-bar-container {
		height: 8rpx;
		background-color: #f0f0f0;
		border-radius: 4rpx;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(to right, #667eea, #764ba2);
		transition: width 0.3s ease;
	}

	.goal-deadline {
		font-size: 22rpx;
		color: #999999;
	}
</style>