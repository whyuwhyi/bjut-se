<template>
	<view class="plan-detail-container">
		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view class="nav-left" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">计划详情</text>
			<view class="nav-right">
				<text class="edit-btn" @click="editPlan" v-if="planData">编辑</text>
			</view>
		</view>

		<view class="content" v-if="planData">
			<!-- 计划基本信息 -->
			<view class="plan-info-card">
				<view class="plan-header">
					<text class="plan-title">{{ planData.title }}</text>
					<view class="plan-status" :class="'status-' + planData.status">
						{{ getPlanStatusText(planData.status) }}
					</view>
				</view>
				
				<text class="plan-description">{{ planData.description }}</text>
				
				<view class="plan-progress">
					<view class="progress-info">
						<text class="progress-label">完成进度</text>
						<text class="progress-percent">{{ planData.progressPercent }}%</text>
					</view>
					<view class="progress-bar-container">
						<view 
							class="progress-bar-fill" 
							:style="{ width: planData.progressPercent + '%' }"
						></view>
					</view>
				</view>
				
				<view class="plan-meta">
					<view class="meta-row">
						<text class="meta-icon">📅</text>
						<text class="meta-text">{{ formatDateRange(planData.startDate, planData.endDate) }}</text>
					</view>
					<view class="meta-row">
						<text class="meta-icon">🎯</text>
						<text class="meta-text">{{ planData.tasks.length }}个任务</text>
					</view>
					<view class="meta-row">
						<text class="meta-icon">⏰</text>
						<text class="meta-text">剩余{{ getRemainingDays(planData.endDate) }}天</text>
					</view>
					<view class="meta-row">
						<text class="meta-icon">🏆</text>
						<text class="meta-text">优先级: {{ getPriorityText(planData.priority) }}</text>
					</view>
				</view>
			</view>

			<!-- 任务管理 -->
			<view class="tasks-section">
				<view class="section-header">
					<text class="section-title">学习任务</text>
					<view class="header-actions">
						<text class="add-task-btn" @click="addNewTask">+ 添加</text>
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
				</view>
				
				<view class="task-list">
					<view 
						class="task-item" 
						:class="{ completed: task.completed }"
						v-for="(task, index) in filteredTasks" 
						:key="task.id"
					>
						<view class="task-checkbox" @click="toggleTask(task)">
							<text class="checkbox-icon" v-if="task.completed">✓</text>
						</view>
						
						<view class="task-content" @click="editTask(task)">
							<text class="task-title">{{ task.title }}</text>
							<text class="task-description" v-if="task.description">{{ task.description }}</text>
							
							<view class="task-meta">
								<view class="task-priority" :class="'priority-' + task.priority">
									{{ getPriorityText(task.priority) }}
								</view>
								<text class="task-deadline" v-if="task.deadline">{{ formatDate(task.deadline) }}</text>
								<text class="task-status">{{ getTaskStatusText(task) }}</text>
							</view>
						</view>
						
						<view class="task-actions">
							<text class="action-btn edit-task" @click="editTask(task)">编辑</text>
							<text class="action-btn delete-task" @click="deleteTask(task)">删除</text>
						</view>
					</view>
				</view>
				
				<view class="empty-tasks" v-if="filteredTasks.length === 0">
					<text class="empty-text">暂无任务</text>
				</view>
			</view>

			<!-- 学习统计 -->
			<view class="stats-section">
				<view class="section-header">
					<text class="section-title">学习统计</text>
				</view>
				
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-number">{{ completedTasksCount }}</text>
						<text class="stat-label">已完成任务</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ totalTasksCount }}</text>
						<text class="stat-label">总任务数</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ overdueTasksCount }}</text>
						<text class="stat-label">逾期任务</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">{{ getRemainingDays(planData.endDate) }}</text>
						<text class="stat-label">剩余天数</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-else>
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 任务编辑弹窗 -->
		<view class="task-edit-mask" v-if="showTaskEditPopup" @click="closeTaskEditPopup">
			<view class="task-edit-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">{{ editingTask.id ? '编辑任务' : '新建任务' }}</text>
					<text class="popup-close" @click="closeTaskEditPopup">✕</text>
				</view>
				
				<view class="popup-content">
					<view class="form-item">
						<text class="form-label">任务名称</text>
						<input 
							class="form-input" 
							v-model="editingTask.title" 
							placeholder="请输入任务名称"
							maxlength="50"
						/>
					</view>
					
					<view class="form-item">
						<text class="form-label">任务描述</text>
						<textarea 
							class="form-textarea" 
							v-model="editingTask.description" 
							placeholder="请输入任务描述"
							maxlength="200"
						></textarea>
					</view>
					
					<view class="form-item">
						<text class="form-label">优先级</text>
						<picker :value="editingTask.priorityIndex" :range="priorityOptions" range-key="label" @change="onTaskPriorityChange">
							<view class="form-picker">
								<text class="picker-text">{{ priorityOptions[editingTask.priorityIndex].label }}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
					
					<view class="form-item">
						<text class="form-label">截止日期</text>
						<picker mode="date" :value="editingTask.deadline" @change="onTaskDeadlineChange">
							<view class="form-picker">
								<text class="picker-text">{{ editingTask.deadline || '选择日期' }}</text>
								<text class="picker-arrow">📅</text>
							</view>
						</picker>
					</view>
				</view>
				
				<view class="popup-actions">
					<button class="cancel-btn" @click="closeTaskEditPopup">取消</button>
					<button class="save-btn" @click="saveTask">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			planId: '',
			planData: null,
			selectedFilter: 0,
			showTaskEditPopup: false,
			taskFilters: [
				{ name: '全部', value: 'all' },
				{ name: '进行中', value: 'active' },
				{ name: '已完成', value: 'completed' },
				{ name: '已逾期', value: 'overdue' }
			],
			priorityOptions: [
				{ label: '高优先级', value: 'high' },
				{ label: '中优先级', value: 'medium' },
				{ label: '低优先级', value: 'low' }
			],
			editingTask: {
				id: '',
				title: '',
				description: '',
				priorityIndex: 1,
				deadline: ''
			}
		}
	},
	
	computed: {
		filteredTasks() {
			if (!this.planData) return [];
			const filter = this.taskFilters[this.selectedFilter];
			
			if (filter.value === 'all') {
				return this.planData.tasks;
			} else if (filter.value === 'completed') {
				return this.planData.tasks.filter(task => task.completed);
			} else if (filter.value === 'active') {
				const today = new Date().toISOString().split('T')[0];
				return this.planData.tasks.filter(task => !task.completed && (!task.deadline || today <= task.deadline));
			} else if (filter.value === 'overdue') {
				const today = new Date().toISOString().split('T')[0];
				return this.planData.tasks.filter(task => !task.completed && task.deadline && today > task.deadline);
			}
			
			return this.planData.tasks;
		},
		
		completedTasksCount() {
			return this.planData ? this.planData.tasks.filter(task => task.completed).length : 0;
		},
		
		totalTasksCount() {
			return this.planData ? this.planData.tasks.length : 0;
		},
		
		overdueTasksCount() {
			const today = new Date().toISOString().split('T')[0];
			return this.planData ? this.planData.tasks.filter(task => 
				!task.completed && task.deadline && today > task.deadline
			).length : 0;
		}
	},
	
	onLoad(options) {
		if (options.id) {
			this.planId = options.id;
			this.loadPlanDetail();
		}
	},
	
	methods: {
		goBack() {
			uni.navigateBack();
		},
		
		editPlan() {
			uni.navigateTo({
				url: `/pages/learning/create-plan?id=${this.planId}`
			});
		},
		
		async loadPlanDetail() {
			try {
				const token = uni.getStorageSync('token');
				if (!token) {
					uni.reLaunch({
						url: '/pages/login/login'
					});
					return;
				}
				
				const response = await uni.request({
					url: `http://localhost:3000/api/v1/study-plans/${this.planId}`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				});
				
				if (response.data.success) {
					const plan = response.data.data;
					this.planData = {
						id: plan.plan_id,
						title: plan.title,
						description: plan.description,
						status: plan.status,
						priority: plan.priority,
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
							createdAt: new Date(task.created_at)
						})) : []
					};
				}
			} catch (error) {
				console.error('加载计划详情失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			}
		},
		
		selectFilter(index) {
			this.selectedFilter = index;
		},
		
		async toggleTask(task) {
			try {
				const token = uni.getStorageSync('token');
				const newStatus = task.completed ? 'in_progress' : 'completed';
				
				const response = await uni.request({
					url: `http://localhost:3000/api/v1/study-plans/tasks/${task.id}/status`,
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
				}
			} catch (error) {
				console.error('更新任务状态失败:', error);
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				});
			}
		},
		
		addNewTask() {
			this.editingTask = {
				id: '',
				title: '',
				description: '',
				priorityIndex: 1,
				deadline: ''
			};
			this.showTaskEditPopup = true;
		},
		
		editTask(task) {
			const priorityIndex = this.priorityOptions.findIndex(p => p.value === task.priority);
			this.editingTask = {
				id: task.id,
				title: task.title,
				description: task.description,
				priorityIndex: priorityIndex !== -1 ? priorityIndex : 1, // 默认为中等优先级
				deadline: task.deadline
			};
			this.showTaskEditPopup = true;
		},
		
		closeTaskEditPopup() {
			this.showTaskEditPopup = false;
		},
		
		onTaskPriorityChange(e) {
			this.editingTask.priorityIndex = e.detail.value;
		},
		
		onTaskDeadlineChange(e) {
			this.editingTask.deadline = e.detail.value;
		},
		
		async saveTask() {
			if (!this.editingTask.title.trim()) {
				uni.showToast({
					title: '请输入任务名称',
					icon: 'none'
				});
				return;
			}
			
			try {
				const token = uni.getStorageSync('token');
				const taskData = {
					title: this.editingTask.title.trim(),
					description: this.editingTask.description.trim(),
					priority: this.priorityOptions[this.editingTask.priorityIndex].value,
					deadline: this.editingTask.deadline || null
				};
				
				if (this.editingTask.id) {
					// 编辑任务
					const response = await uni.request({
						url: `http://localhost:3000/api/v1/study-plans/tasks/${this.editingTask.id}`,
						method: 'PUT',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: taskData
					});
					
					if (response.data.success) {
						// 更新本地数据
						const taskIndex = this.planData.tasks.findIndex(t => t.id === this.editingTask.id);
						if (taskIndex !== -1) {
							Object.assign(this.planData.tasks[taskIndex], taskData);
						}
					}
				} else {
					// 新建任务
					const response = await uni.request({
						url: 'http://localhost:3000/api/v1/study-plans/tasks',
						method: 'POST',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: {
							...taskData,
							plan_id: this.planId
						}
					});
					
					if (response.data.success) {
						// 添加到本地数据
						this.planData.tasks.push({
							id: response.data.data.task_id,
							...taskData,
							completed: false,
							createdAt: new Date()
						});
					}
				}
				
				this.closeTaskEditPopup();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
			} catch (error) {
				console.error('保存任务失败:', error);
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				});
			}
		},
		
		async deleteTask(task) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除任务「${task.title}」吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const token = uni.getStorageSync('token');
							const response = await uni.request({
								url: `http://localhost:3000/api/v1/study-plans/tasks/${task.id}`,
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							});
							
							if (response.data.success) {
								// 从本地数据中移除
								const taskIndex = this.planData.tasks.findIndex(t => t.id === task.id);
								if (taskIndex !== -1) {
									this.planData.tasks.splice(taskIndex, 1);
								}
								this.updatePlanProgress();
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							}
						} catch (error) {
							console.error('删除任务失败:', error);
							uni.showToast({
								title: '删除失败',
								icon: 'none'
							});
						}
					}
				}
			});
		},
		
		async updatePlanProgress() {
			if (!this.planData) return;
			const completed = this.planData.tasks.filter(task => task.completed).length;
			const total = this.planData.tasks.length;
			const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
			
			// 更新本地状态
			this.planData.progressPercent = progressPercent;
			
			// 同步到服务器
			try {
				const token = uni.getStorageSync('token');
				await uni.request({
					url: `http://localhost:3000/api/v1/study-plans/${this.planId}`,
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
		
		getTaskStatusText(task) {
			if (task.completed) {
				return '已完成';
			} else if (task.deadline) {
				const today = new Date().toISOString().split('T')[0];
				if (today > task.deadline) {
					return '已逾期';
				} else {
					return '进行中';
				}
			} else {
				return '进行中';
			}
		},
		
		getRemainingDays(endDate) {
			const now = new Date();
			const end = new Date(endDate);
			const diff = end - now;
			const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
			return Math.max(0, days);
		},
		
		formatDate(date) {
			if (!date) return '';
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
			return `${start} - ${end}`;
		}
	}
}
</script>

<style lang="scss" scoped>
.plan-detail-container {
	min-height: 100vh;
	background: #f5f5f5;
}

.navbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 30rpx;
	background: white;
	border-bottom: 1rpx solid #f0f0f0;
	
	.nav-left {
		width: 80rpx;
		
		.back-icon {
			font-size: 36rpx;
			color: #007aff;
		}
	}
	
	.nav-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.nav-right {
		width: 80rpx;
		text-align: right;
		
		.edit-btn {
			font-size: 28rpx;
			color: #007aff;
		}
	}
}

.content {
	padding: 20rpx;
}

.plan-info-card {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.plan-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.plan-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
	flex: 1;
}

.plan-status {
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
	font-size: 22rpx;
	color: #fff;
	margin-left: 16rpx;
	
	&.status-active {
		background-color: #007aff;
	}
	
	&.status-completed {
		background-color: #34c759;
	}
	
	&.status-paused {
		background-color: #ff9500;
	}
	
	&.status-cancelled {
		background-color: #ff3b30;
	}
}

.plan-description {
	font-size: 28rpx;
	color: #666;
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
	color: #666;
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
	.meta-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 8rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
}

.meta-icon {
	font-size: 24rpx;
}

.meta-text {
	font-size: 24rpx;
	color: #666;
}

.tasks-section {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
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
	color: #333;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.add-task-btn {
	font-size: 26rpx;
	color: #007aff;
	padding: 8rpx 16rpx;
	background: #f0f8ff;
	border-radius: 20rpx;
}

.filter-tabs {
	display: flex;
	gap: 8rpx;
}

.filter-tab {
	padding: 6rpx 12rpx;
	font-size: 22rpx;
	color: #666;
	border-radius: 12rpx;
	background-color: #f0f0f0;
	
	&.active {
		color: #007aff;
		background-color: #e8f4fd;
	}
}

.task-list {
	.task-item {
		display: flex;
		align-items: flex-start;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		&.completed {
			opacity: 0.6;
		}
	}
}

.task-checkbox {
	width: 40rpx;
	height: 40rpx;
	border: 2rpx solid #ddd;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
	flex-shrink: 0;
	background-color: #fff;
	transition: all 0.3s ease;
}

.task-item.completed .task-checkbox {
	background-color: #007aff;
	border-color: #007aff;
}

.checkbox-icon {
	color: #fff;
	font-size: 24rpx;
	font-weight: bold;
}

.task-content {
	flex: 1;
	min-width: 0;
}

.task-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 8rpx;
}

.task-item.completed .task-title {
	text-decoration: line-through;
}

.task-description {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 12rpx;
}

.task-meta {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-wrap: wrap;
}

.task-priority {
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	font-size: 20rpx;
	color: #fff;
	
	&.priority-high {
		background-color: #ff3b30;
	}
	
	&.priority-medium {
		background-color: #ff9500;
	}
	
	&.priority-low {
		background-color: #34c759;
	}
}

.task-deadline {
	font-size: 22rpx;
	color: #999;
}

.task-status {
	font-size: 22rpx;
	color: #007aff;
}

.task-actions {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-left: 16rpx;
}

.action-btn {
	font-size: 22rpx;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	text-align: center;
	
	&.edit-task {
		color: #007aff;
		background: #f0f8ff;
	}
	
	&.delete-task {
		color: #ff3b30;
		background: #fff0f0;
	}
}

.empty-tasks {
	text-align: center;
	padding: 60rpx 0;
	color: #999;
}

.stats-section {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
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

.loading {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 400rpx;
}

.loading-text {
	font-size: 28rpx;
	color: #666;
}

.task-edit-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.task-edit-popup {
	background: white;
	border-radius: 20rpx 20rpx 0 0;
	max-height: 80vh;
	width: 100%;
	max-width: 750rpx;
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.popup-close {
	font-size: 28rpx;
	color: #666;
	padding: 8rpx;
}

.popup-content {
	padding: 30rpx;
	max-height: 60vh;
	overflow-y: auto;
}

.form-item {
	margin-bottom: 30rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 12rpx;
}

.form-input, .form-textarea {
	width: 100%;
	padding: 20rpx;
	font-size: 28rpx;
	border: 2rpx solid #f0f0f0;
	border-radius: 12rpx;
	background: #fafafa;
}

.form-textarea {
	min-height: 120rpx;
}

.form-picker {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background: #fafafa;
	border-radius: 12rpx;
	border: 2rpx solid #f0f0f0;
}

.picker-text {
	font-size: 28rpx;
	color: #333;
}

.picker-arrow {
	font-size: 24rpx;
	color: #999;
}

.popup-actions {
	display: flex;
	padding: 20rpx 30rpx 30rpx;
	gap: 20rpx;
}

.cancel-btn, .save-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 30rpx;
	border: none;
}

.cancel-btn {
	background: #f5f5f5;
	color: #666;
}

.save-btn {
	background: #007aff;
	color: white;
}
</style>