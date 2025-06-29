<template>
	<view class="learning-container">
		<!-- 顶部操作栏 -->
		<view class="top-actions">
			<view class="plan-selector">
				<picker @change="onPlanChange" :value="selectedPlanIndex" :range="planOptions" range-key="name">
					<view class="selector-trigger">
						<text class="current-plan">{{ currentPlanName }}</text>
						<text class="dropdown-icon">⌄</text>
					</view>
				</picker>
			</view>
			<view class="plan-actions">
				<button class="edit-btn" @click="editCurrentPlan" v-if="currentPlan">
					<text class="edit-icon">✏️</text>
				</button>
			</view>
		</view>

		<!-- 当前计划概览 -->
		<view class="current-plan-overview" v-if="currentPlan">
			<view class="plan-header">
				<text class="plan-title" @click="viewPlanDetail">{{ currentPlan.title }}</text>
				<view class="plan-status" :class="'status-' + currentPlan.status">
					{{ getPlanStatusText(currentPlan.status) }}
				</view>
			</view>
			<text class="plan-description">{{ currentPlan.description }}</text>
			
			<view class="plan-progress">
				<view class="progress-info">
					<text class="progress-label">完成进度</text>
					<text class="progress-percent">{{ currentPlan.progressPercent }}%</text>
				</view>
				<view class="progress-bar-container">
					<view 
						class="progress-bar-fill" 
						:style="{ width: currentPlan.progressPercent + '%' }"
					></view>
				</view>
			</view>
			
			<view class="plan-meta">
				<view class="meta-item">
					<text class="meta-icon">📅</text>
					<text class="meta-text">{{ formatDateRange(currentPlan.startDate, currentPlan.endDate) }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">🎯</text>
					<text class="meta-text">{{ currentPlan.tasks.length }}个任务</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">⏰</text>
					<text class="meta-text">剩余{{ getRemainingDays(currentPlan.endDate) }}天</text>
				</view>
			</view>
		</view>

		<!-- 任务列表 -->
		<view class="tasks-section">
			<view class="section-header">
				<text class="section-title">学习任务</text>
				<view class="filter-tabs">
					<text 
						class="filter-tab" 
						:class="{ active: selectedFilter === index }"
						v-for="(filter, index) in taskFilters" 
						:key="index"
						@click="selectFilter(index)"
					>
						{{ filter.name }}
					</text>
				</view>
			</view>
			
			<view class="task-list">
				<view 
					class="task-item" 
					:class="{ completed: task.completed }"
					v-for="(task, index) in filteredTasks" 
					:key="index"
					@click="viewTask(task)"
				>
					<view class="task-checkbox" @click.stop="toggleTask(task)">
						<text class="checkbox-icon" v-if="task.completed">✓</text>
					</view>
					
					<view class="task-content">
						<text class="task-title">{{ task.title }}</text>
						<text class="task-description">{{ task.description }}</text>
						
						<view class="task-meta">
							<view class="task-priority" :class="'priority-' + task.priority">
								{{ getPriorityText(task.priority) }}
							</view>
							<text class="task-deadline" v-if="task.deadline">{{ formatDate(task.deadline) }}</text>
							<view class="task-tags">
								<text 
									class="task-tag" 
									v-for="tag in task.tags" 
									:key="tag"
								>
									{{ tag }}
								</text>
							</view>
						</view>
						
						<!-- 子任务进度 -->
						<view class="subtask-progress" v-if="task.subtasks && task.subtasks.length > 0">
							<text class="progress-text">
								{{ task.subtasks.filter(s => s.completed).length }}/{{ task.subtasks.length }} 子任务完成
							</text>
							<view class="mini-progress-bar">
								<view 
									class="mini-progress-fill" 
									:style="{ width: getSubtaskProgress(task) + '%' }"
								></view>
							</view>
						</view>
					</view>
					
					<text class="task-arrow">›</text>
				</view>
			</view>
		</view>

		<!-- 学习统计 -->
		<view class="stats-section">
			<view class="section-header">
				<text class="section-title">学习统计</text>
			</view>
			
			<view class="stats-grid">
				<view class="stat-item">
					<text class="stat-number">{{ getTotalPlansCount() }}</text>
					<text class="stat-label">总计划数</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ getActivePlansCount() }}</text>
					<text class="stat-label">进行中</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ getCompletedPlansCount() }}</text>
					<text class="stat-label">已完成</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ getTotalTasksCount() }}</text>
					<text class="stat-label">总任务数</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ getCompletedTasksCount() }}</text>
					<text class="stat-label">已完成任务</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ getTaskCompletionRate() }}%</text>
					<text class="stat-label">任务完成率</text>
				</view>
			</view>
		</view>

		<!-- 新建计划按钮 -->
		<view class="create-btn" @click="createNewPlan">
			<text class="create-icon">➕</text>
		</view>
		
		
	</view>
</template>

<script>
export default {
	data() {
		return {
			selectedPlanIndex: 0,
			selectedFilter: 0,
			taskFilters: [
				{ name: '全部', value: 'all' },
				{ name: '进行中', value: 'active' },
				{ name: '已完成', value: 'completed' },
				{ name: '已逾期', value: 'overdue' }
			],
			studyPlans: []
		}
	},
	
	computed: {
		currentPlan() {
			return this.studyPlans[this.selectedPlanIndex] || null;
		},
		
		currentPlanName() {
			return this.currentPlan ? this.currentPlan.title : '选择学习计划';
		},
		
		planOptions() {
			return this.studyPlans.map(plan => ({ name: plan.title, value: plan.id }));
		},
		
		filteredTasks() {
			if (!this.currentPlan) return [];
			const filter = this.taskFilters[this.selectedFilter];
			
			if (filter.value === 'all') {
				return this.currentPlan.tasks;
			} else if (filter.value === 'completed') {
				return this.currentPlan.tasks.filter(task => task.completed);
			} else if (filter.value === 'active') {
				const today = new Date().toISOString().split('T')[0];
				return this.currentPlan.tasks.filter(task => !task.completed && (!task.deadline || today <= task.deadline));
			} else if (filter.value === 'overdue') {
				const today = new Date().toISOString().split('T')[0];
				return this.currentPlan.tasks.filter(task => !task.completed && task.deadline && today > task.deadline);
			}
			
			return this.currentPlan.tasks;
		}
	},
	
	onLoad() {
		this.loadStudyPlans()
	},
	
	onShow() {
		// 页面显示时刷新数据
		this.loadStudyPlans()
	},
	
	methods: {
		onPlanChange(e) {
			this.selectedPlanIndex = e.detail.value;
		},
		
		editCurrentPlan() {
			if (!this.currentPlan) return
			uni.showActionSheet({
				itemList: ['编辑计划', '删除计划'],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.editPlan()
					} else if (res.tapIndex === 1) {
						this.deletePlan()
					}
				}
			})
		},
		
		editPlan() {
			// 跳转到编辑学习计划页面
			uni.navigateTo({
				url: `/pages/learning/create-plan?id=${this.currentPlan.id}`
			})
		},
		
		async deletePlan() {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除「${this.currentPlan.title}」吗？此操作不可恢复。`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const token = uni.getStorageSync('token')
							const response = await uni.request({
								url: `${this.$config.apiBaseUrl}/study-plans/${this.currentPlan.id}`,
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							})
							
							if (response.data.success) {
								this.studyPlans.splice(this.selectedPlanIndex, 1)
								if (this.studyPlans.length === 0) {
									this.selectedPlanIndex = -1
								} else {
									this.selectedPlanIndex = Math.min(this.selectedPlanIndex, this.studyPlans.length - 1)
								}
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								})
							} else {
								uni.showToast({
									title: response.data.message || '删除失败',
									icon: 'none'
								})
							}
						} catch (error) {
							console.error('删除计划失败:', error)
							uni.showToast({
								title: '删除失败',
								icon: 'none'
							})
						}
					}
				}
			})
		},
		
		selectFilter(index) {
			this.selectedFilter = index;
		},
		
		
		async loadStudyPlans() {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.reLaunch({
						url: '/pages/login/login'
					})
					return
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					this.studyPlans = response.data.data.plans.map(plan => ({
						id: plan.plan_id,
						title: plan.title,
						description: plan.description,
						status: plan.status,
						progressPercent: plan.progress_percent || 0,
						startDate: new Date(plan.start_date),
						endDate: new Date(plan.end_date),
						tasks: plan.tasks ? plan.tasks.map(task => ({
							id: task.task_id,
							title: task.title,
							description: task.description,
							completed: task.status === 'completed',
							priority: task.priority,
							deadline: task.deadline ? task.deadline.split('T')[0] : null,
							tags: task.tags ? JSON.parse(task.tags) : [],
							subtasks: task.subtasks || []
						})) : []
					}))
					
					// 如果有计划但没有选中任何计划，默认选中第一个
					if (this.studyPlans.length > 0 && this.selectedPlanIndex === -1) {
						this.selectedPlanIndex = 0
					}
				}
			} catch (error) {
				console.error('加载学习计划失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		
		async toggleTask(task) {
			try {
				const token = uni.getStorageSync('token');
				const newStatus = task.completed ? 'in_progress' : 'completed';
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans/tasks/${task.id}/status`,
					method: 'PATCH',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						status: newStatus
					}
				});
				
				if (response.data.success) {
					task.completed = !task.completed;
					this.updatePlanProgress();
					uni.showToast({
						title: task.completed ? '任务已完成' : '任务已重新激活',
						icon: 'success'
					});
				} else {
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					});
				}
			} catch (error) {
				console.error('更新任务状态失败:', error);
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				});
			}
		},
		
		viewTask(task) {
			uni.navigateTo({
				url: `/pages/learning/plan-detail?id=${this.currentPlan.id}`
			});
		},
		
		viewPlanDetail() {
			if (!this.currentPlan) return;
			uni.navigateTo({
				url: `/pages/learning/plan-detail?id=${this.currentPlan.id}`
			});
		},
		
		async updatePlanProgress() {
			if (!this.currentPlan) return;
			const completed = this.currentPlan.tasks.filter(task => task.completed).length;
			const total = this.currentPlan.tasks.length;
			const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
			
			// 更新本地状态
			this.currentPlan.progressPercent = progressPercent;
			
			// 同步到服务器
			try {
				const token = uni.getStorageSync('token');
				await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans/${this.currentPlan.id}`,
					method: 'PUT',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						progress_percent: progressPercent
					}
				});
			} catch (error) {
				console.error('同步计划进度失败:', error);
			}
		},
		
		createNewPlan() {
			// 跳转到新建学习计划页面
			uni.navigateTo({
				url: '/pages/learning/create-plan'
			})
		},
		
		
		
		
		getTotalPlansCount() {
			return this.studyPlans.length;
		},
		
		getActivePlansCount() {
			return this.studyPlans.filter(plan => plan.status === 'active').length;
		},
		
		getCompletedPlansCount() {
			return this.studyPlans.filter(plan => plan.status === 'completed').length;
		},
		
		getTotalTasksCount() {
			return this.studyPlans.reduce((total, plan) => total + plan.tasks.length, 0);
		},
		
		getCompletedTasksCount() {
			return this.studyPlans.reduce((total, plan) => 
				total + plan.tasks.filter(task => task.completed).length, 0
			);
		},
		
		getTaskCompletionRate() {
			const total = this.getTotalTasksCount();
			const completed = this.getCompletedTasksCount();
			return total > 0 ? Math.round((completed / total) * 100) : 0;
		},
		
		getPlanStatusText(status) {
			const texts = {
				active: '进行中',
				completed: '已完成',
				paused: '已暂停',
				cancelled: '已取消'
			};
			return texts[status] || '未知';
		},
		
		getPriorityText(priority) {
			const texts = {
				high: '高优先级',
				medium: '中优先级',
				low: '低优先级'
			};
			return texts[priority] || '普通';
		},
		
		getSubtaskProgress(task) {
			if (!task.subtasks || task.subtasks.length === 0) return 0;
			const completed = task.subtasks.filter(s => s.completed).length;
			return Math.round((completed / task.subtasks.length) * 100);
		},
		
		getRemainingDays(endDate) {
			const now = new Date();
			const end = new Date(endDate);
			const diff = end - now;
			const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
			return Math.max(0, days);
		},
		
		formatDate(date) {
			return new Date(date).toLocaleDateString('zh-CN', {
				month: '2-digit',
				day: '2-digit'
			});
		},
		
		formatDateRange(startDate, endDate) {
			const start = new Date(startDate).toLocaleDateString('zh-CN', {
				month: '2-digit',
				day: '2-digit'
			});
			const end = new Date(endDate).toLocaleDateString('zh-CN', {
				month: '2-digit',
				day: '2-digit'
			});
			return `${start} - ${end}`
		},
		
		formatDateForPicker(date) {
			if (!date) return ''
			const d = new Date(date)
			const year = d.getFullYear()
			const month = String(d.getMonth() + 1).padStart(2, '0')
			const day = String(d.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
	}
}
</script>

<style lang="scss" scoped>
.learning-container {
	background: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 160rpx;
}

/* 顶部操作栏 */
.top-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx;
	background-color: #ffffff;
	border-bottom: 1rpx solid #e0e0e0;
}

.plan-selector .selector-trigger {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.current-plan {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
}

.dropdown-icon {
	font-size: 24rpx;
	color: #666666;
}

.plan-actions {
	display: flex;
	gap: 12rpx;
}

.edit-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: #f0f0f0;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	
	.edit-icon {
		font-size: 28rpx;
	}
}

/* 当前计划概览 */
.current-plan-overview {
	margin: 32rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 32rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.plan-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.plan-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #007aff;
	text-decoration: underline;
	text-decoration-color: rgba(0, 122, 255, 0.3);
}

.plan-status {
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
	font-size: 22rpx;
	color: #ffffff;
}

.plan-status.status-active {
	background-color: #007aff;
}

.plan-status.status-completed {
	background-color: #34c759;
}

.plan-description {
	font-size: 28rpx;
	color: #666666;
	line-height: 1.5;
	margin-bottom: 24rpx;
}

.plan-progress {
	margin-bottom: 24rpx;
}

.progress-info {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.progress-label {
	font-size: 26rpx;
	color: #666666;
}

.progress-percent {
	font-size: 26rpx;
	color: #007aff;
	font-weight: 600;
}

.progress-bar-container {
	height: 12rpx;
	background-color: #f0f0f0;
	border-radius: 6rpx;
	overflow: hidden;
}

.progress-bar-fill {
	height: 100%;
	background: linear-gradient(to right, #667eea, #764ba2);
	transition: width 0.3s ease;
}

.plan-meta {
	display: flex;
	gap: 32rpx;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.meta-icon {
	font-size: 24rpx;
}

.meta-text {
	font-size: 24rpx;
	color: #666666;
}

/* 任务部分 */
.tasks-section {
	margin: 16rpx 32rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 32rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333333;
}

.filter-tabs {
	display: flex;
	gap: 16rpx;
}

.filter-tab {
	padding: 8rpx 16rpx;
	font-size: 24rpx;
	color: #666666;
	border-radius: 16rpx;
	background-color: #f0f0f0;
}

.filter-tab.active {
	color: #007aff;
	background-color: #e8f4fd;
}

.task-list {
	margin-top: 16rpx;
}

.task-item {
	display: flex;
	align-items: flex-start;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	transition: opacity 0.3s ease;
}

.task-item.completed {
	opacity: 0.6;
}

.task-item:last-child {
	border-bottom: none;
}

.task-checkbox {
	width: 40rpx;
	height: 40rpx;
	border: 2rpx solid #ddd;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	flex-shrink: 0;
	background-color: #ffffff;
	transition: all 0.3s ease;
}

.task-item.completed .task-checkbox {
	background-color: #007aff;
	border-color: #007aff;
}

.checkbox-icon {
	color: #ffffff;
	font-size: 24rpx;
	font-weight: bold;
}

.task-content {
	flex: 1;
	min-width: 0;
}

.task-title {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
	display: block;
	margin-bottom: 8rpx;
}

.task-item.completed .task-title {
	text-decoration: line-through;
}

.task-description {
	font-size: 24rpx;
	color: #666666;
	display: block;
	margin-bottom: 12rpx;
}

.task-meta {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 12rpx;
}

.task-priority {
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 20rpx;
	color: #ffffff;
}

.task-priority.priority-high {
	background-color: #ff3b30;
}

.task-priority.priority-medium {
	background-color: #ff9500;
}

.task-priority.priority-low {
	background-color: #34c759;
}

.task-deadline {
	font-size: 22rpx;
	color: #999999;
}

.task-tags {
	display: flex;
	gap: 8rpx;
}

.task-tag {
	padding: 4rpx 8rpx;
	background-color: #f0f0f0;
	border-radius: 8rpx;
	font-size: 20rpx;
	color: #666666;
}

.subtask-progress {
	margin-top: 12rpx;
}

.progress-text {
	font-size: 22rpx;
	color: #666666;
	margin-bottom: 8rpx;
	display: block;
}

.mini-progress-bar {
	height: 4rpx;
	background-color: #f0f0f0;
	border-radius: 2rpx;
	overflow: hidden;
}

.mini-progress-fill {
	height: 100%;
	background-color: #007aff;
	transition: width 0.3s ease;
}

.task-arrow {
	font-size: 24rpx;
	color: #cccccc;
	margin-left: 16rpx;
	align-self: center;
}

/* 学习统计部分 */
.stats-section {
	margin: 16rpx 32rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 32rpx;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
	margin-top: 20rpx;
}

.stat-item {
	text-align: center;
	padding: 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.stat-number {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: #007aff;
	margin-bottom: 8rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #666;
}

/* 创建按钮 */
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