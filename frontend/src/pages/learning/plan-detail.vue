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
				
				<!-- 加权进度显示 -->
				<view class="plan-progress" v-if="weightedProgress !== null">
					<view class="progress-info">
						<text class="progress-label">加权进度（考虑优先级）</text>
						<text class="progress-percent">{{ weightedProgress }}%</text>
					</view>
					<view class="progress-bar-container">
						<view 
							class="progress-bar-fill weighted" 
							:style="{ width: weightedProgress + '%' }"
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
						:class="{ completed: task.completed, expanded: task.expanded }"
						v-for="(task, index) in filteredTasks" 
						:key="task.id"
					>
						<view class="task-header">
							<view class="task-checkbox" @click="toggleTask(task)">
								<text class="checkbox-icon" v-if="task.completed">✓</text>
							</view>
							
							<view class="task-main" @click="toggleTaskExpansion(task)">
								<view class="task-content">
									<text class="task-title">{{ task.title }}</text>
									<text class="task-description" v-if="task.description">{{ task.description }}</text>
									
									<view class="task-meta">
										<view class="task-priority" :class="'priority-' + task.priority">
											{{ getPriorityText(task.priority) }}
										</view>
										<text class="task-deadline" v-if="task.deadline">{{ formatDate(task.deadline) }}</text>
										<text class="task-status">{{ getTaskStatusText(task) }}</text>
									</view>
									
									<!-- 子任务进度简要信息 -->
									<view class="subtask-summary" v-if="task.subtasks && task.subtasks.length > 0">
										<text class="summary-text">
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
								
								<view class="task-expand-icon">
									<text class="expand-arrow" :class="{ expanded: task.expanded }">▼</text>
								</view>
							</view>
							
							<view class="task-actions">
								<text class="action-btn edit-task" @click="editTask(task)">编辑</text>
								<text class="action-btn delete-task" @click="deleteTask(task)">删除</text>
							</view>
						</view>
						
						<!-- 子任务管理区域 -->
						<view class="subtasks-container" v-if="task.expanded">
							<view class="subtasks-header">
								<text class="subtasks-title">子任务</text>
								<view class="subtask-actions">
									<text class="add-subtask-btn" @click="addSubtask(task)">+ 添加子任务</text>
									<text class="subtask-stats-btn" @click="showSubtaskStats(task)">📊 统计</text>
								</view>
							</view>
							
							<view class="subtask-list" v-if="task.subtasks && task.subtasks.length > 0">
								<view 
									class="subtask-item" 
									:class="{ completed: subtask.completed, overdue: isSubtaskOverdue(subtask) }"
									v-for="(subtask, subtaskIndex) in task.subtasks" 
									:key="subtask.id"
								>
									<view class="subtask-drag-handle">⋮⋮</view>
									
									<view class="subtask-checkbox" @click="toggleSubtask(task, subtask)">
										<text class="checkbox-icon" v-if="subtask.completed">✓</text>
									</view>
									
									<view class="subtask-content" @click="editSubtask(task, subtask)">
										<text class="subtask-title">{{ subtask.title }}</text>
										<text class="subtask-description" v-if="subtask.description">{{ subtask.description }}</text>
										
										<view class="subtask-meta">
											<view class="subtask-priority" :class="'priority-' + subtask.priority">
												{{ getPriorityText(subtask.priority) }}
											</view>
											<text class="subtask-deadline" v-if="subtask.deadline">📅 {{ formatDate(subtask.deadline) }}</text>
											<text class="subtask-estimate" v-if="subtask.estimated_minutes">⏱ {{ formatEstimatedTime(subtask.estimated_minutes) }}</text>
											<text class="subtask-overdue" v-if="isSubtaskOverdue(subtask)">⚠️ 已逾期</text>
										</view>
									</view>
									
									<view class="subtask-actions">
										<text class="action-btn edit-subtask" @click="editSubtask(task, subtask)">✏️</text>
										<text class="action-btn delete-subtask" @click="deleteSubtask(task, subtask)">🗑️</text>
									</view>
								</view>
							</view>
							
							<view class="empty-subtasks" v-else>
								<text class="empty-text">暂无子任务，点击上方"添加子任务"开始</text>
							</view>
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

		<!-- 子任务编辑弹窗 -->
		<view class="subtask-edit-mask" v-if="showSubtaskEditPopup" @click="closeSubtaskEditPopup">
			<view class="subtask-edit-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">{{ editingSubtask.id ? '编辑子任务' : '新建子任务' }}</text>
					<text class="popup-close" @click="closeSubtaskEditPopup">✕</text>
				</view>
				
				<view class="popup-content">
					<view class="form-item">
						<text class="form-label">子任务名称 *</text>
						<input 
							class="form-input" 
							v-model="editingSubtask.title" 
							placeholder="请输入子任务名称"
							maxlength="200"
						/>
					</view>
					
					<view class="form-item">
						<text class="form-label">详细描述</text>
						<textarea 
							class="form-textarea" 
							v-model="editingSubtask.description" 
							placeholder="请输入详细描述（可选）"
							maxlength="5000"
						></textarea>
					</view>
					
					<view class="form-item">
						<text class="form-label">优先级</text>
						<picker :value="editingSubtask.priorityIndex" :range="priorityOptions" range-key="label" @change="onSubtaskPriorityChange">
							<view class="form-picker">
								<text class="picker-text">{{ priorityOptions[editingSubtask.priorityIndex].label }}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
					
					<view class="form-item">
						<text class="form-label">截止日期</text>
						<picker 
							mode="date" 
							:value="editingSubtask.deadline" 
							:start="planData.startDate.toISOString().split('T')[0]"
							:end="editingSubtask.parentTask ? editingSubtask.parentTask.deadline : planData.endDate.toISOString().split('T')[0]"
							@change="onSubtaskDeadlineChange"
						>
							<view class="form-picker">
								<text class="picker-text">{{ editingSubtask.deadline || '选择日期（可选）' }}</text>
								<text class="picker-arrow">📅</text>
							</view>
						</picker>
					</view>
					
					<view class="form-item">
						<text class="form-label">预计时间（分钟）</text>
						<input 
							class="form-input" 
							v-model="editingSubtask.estimated_minutes" 
							placeholder="预计完成时间（分钟）"
							type="number"
							min="0"
							max="10080"
						/>
					</view>
					
					<view class="form-item">
						<text class="form-label">备注</text>
						<textarea 
							class="form-textarea" 
							v-model="editingSubtask.notes" 
							placeholder="备注信息（可选）"
							maxlength="2000"
						></textarea>
					</view>
				</view>
				
				<view class="popup-actions">
					<button class="cancel-btn" @click="closeSubtaskEditPopup">取消</button>
					<button class="save-btn" @click="saveSubtask">保存</button>
				</view>
			</view>
		</view>

		<!-- 子任务统计弹窗 -->
		<view class="stats-mask" v-if="showStatsPopup" @click="closeStatsPopup">
			<view class="stats-popup" @click.stop>
				<view class="popup-header">
					<text class="popup-title">子任务统计</text>
					<text class="popup-close" @click="closeStatsPopup">✕</text>
				</view>
				
				<view class="popup-content">
					<view class="stats-detail" v-if="subtaskStats">
						<view class="stats-overview">
							<view class="overview-item">
								<text class="overview-number">{{ subtaskStats.total }}</text>
								<text class="overview-label">总计</text>
							</view>
							<view class="overview-item">
								<text class="overview-number">{{ subtaskStats.completed }}</text>
								<text class="overview-label">已完成</text>
							</view>
							<view class="overview-item">
								<text class="overview-number">{{ subtaskStats.pending }}</text>
								<text class="overview-label">进行中</text>
							</view>
							<view class="overview-item">
								<text class="overview-number">{{ subtaskStats.overdue }}</text>
								<text class="overview-label">已逾期</text>
							</view>
						</view>
						
						<view class="progress-comparison">
							<view class="progress-item">
								<text class="progress-title">普通进度</text>
								<view class="progress-bar-container">
									<view class="progress-bar-fill" :style="{ width: subtaskStats.progress + '%' }"></view>
								</view>
								<text class="progress-text">{{ subtaskStats.progress }}%</text>
							</view>
							<view class="progress-item">
								<text class="progress-title">加权进度</text>
								<view class="progress-bar-container">
									<view class="progress-bar-fill weighted" :style="{ width: subtaskStats.weightedProgress + '%' }"></view>
								</view>
								<text class="progress-text">{{ subtaskStats.weightedProgress }}%</text>
							</view>
						</view>
						
						<view class="priority-breakdown">
							<text class="breakdown-title">优先级分布</text>
							<view class="priority-items">
								<view class="priority-item">
									<view class="priority-badge priority-high"></view>
									<text class="priority-text">高优先级：{{ subtaskStats.priority.high }}个</text>
								</view>
								<view class="priority-item">
									<view class="priority-badge priority-medium"></view>
									<text class="priority-text">中优先级：{{ subtaskStats.priority.medium }}个</text>
								</view>
								<view class="priority-item">
									<view class="priority-badge priority-low"></view>
									<text class="priority-text">低优先级：{{ subtaskStats.priority.low }}个</text>
								</view>
							</view>
						</view>
						
						<view class="time-estimation">
							<text class="estimation-title">时间统计</text>
							<view class="estimation-items">
								<view class="estimation-item">
									<text class="estimation-label">总预计时间</text>
									<text class="estimation-value">{{ formatMinutesToTime(subtaskStats.estimatedTime.total) }}</text>
								</view>
								<view class="estimation-item">
									<text class="estimation-label">已完成时间</text>
									<text class="estimation-value">{{ formatMinutesToTime(subtaskStats.estimatedTime.completed) }}</text>
								</view>
								<view class="estimation-item">
									<text class="estimation-label">剩余时间</text>
									<text class="estimation-value">{{ formatMinutesToTime(subtaskStats.estimatedTime.remaining) }}</text>
								</view>
							</view>
						</view>
					</view>
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
			showSubtaskEditPopup: false,
			showStatsPopup: false,
			subtaskStats: null,
			weightedProgress: null,
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
			},
			editingSubtask: {
				id: '',
				title: '',
				description: '',
				priorityIndex: 1,
				deadline: '',
				estimated_minutes: 0,
				notes: '',
				parentTask: null
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
					url: `${this.$config.apiBaseUrl}/study-plans/${this.planId}`,
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
							createdAt: new Date(task.created_at),
							expanded: false,
							subtasks: task.subtasks ? task.subtasks.map(subtask => ({
								id: subtask.subtask_id,
								title: subtask.title,
								description: subtask.description,
								completed: subtask.completed,
								priority: subtask.priority,
								deadline: subtask.deadline,
								estimated_minutes: subtask.estimated_minutes || 0,
								notes: subtask.notes,
								sort_order: subtask.sort_order
							})) : []
						})) : []
					};
					
					this.calculateWeightedProgress();
				}
			} catch (error) {
				console.error('加载计划详情失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			}
		},
		
		// 计算加权进度
		calculateWeightedProgress() {
			if (!this.planData || this.planData.tasks.length === 0) {
				this.weightedProgress = 0;
				return;
			}
			
			let totalWeight = 0;
			let completedWeight = 0;
			
			this.planData.tasks.forEach(task => {
				const taskWeight = this.getPriorityWeight(task.priority);
				totalWeight += taskWeight;
				
				if (task.subtasks && task.subtasks.length > 0) {
					// 如果有子任务，根据子任务的加权完成度计算
					let subtaskTotalWeight = 0;
					let subtaskCompletedWeight = 0;
					
					task.subtasks.forEach(subtask => {
						const subtaskWeight = this.getPriorityWeight(subtask.priority);
						subtaskTotalWeight += subtaskWeight;
						if (subtask.completed) {
							subtaskCompletedWeight += subtaskWeight;
						}
					});
					
					const subtaskProgress = subtaskTotalWeight > 0 ? subtaskCompletedWeight / subtaskTotalWeight : 0;
					completedWeight += taskWeight * subtaskProgress;
				} else {
					// 没有子任务，直接根据任务完成状态计算
					if (task.completed) {
						completedWeight += taskWeight;
					}
				}
			});
			
			this.weightedProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
		},
		
		getPriorityWeight(priority) {
			const weights = {
				high: 3,
				medium: 2,
				low: 1
			};
			return weights[priority] || 1;
		},
		
		toggleTaskExpansion(task) {
			task.expanded = !task.expanded;
		},
		
		selectFilter(index) {
			this.selectedFilter = index;
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
					this.calculateWeightedProgress();
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
		
		async toggleSubtask(task, subtask) {
			try {
				const token = uni.getStorageSync('token');
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans/subtasks/${subtask.id}`,
					method: 'PUT',
					header: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					data: {
						completed: !subtask.completed
					}
				});
				
				if (response.data.success) {
					subtask.completed = !subtask.completed;
					this.calculateWeightedProgress();
					uni.showToast({
						title: subtask.completed ? '子任务已完成' : '子任务已重新激活',
						icon: 'success'
					});
				}
			} catch (error) {
				console.error('更新子任务状态失败:', error);
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
				priorityIndex: priorityIndex !== -1 ? priorityIndex : 1,
				deadline: task.deadline
			};
			this.showTaskEditPopup = true;
		},
		
		addSubtask(task) {
			this.editingSubtask = {
				id: '',
				title: '',
				description: '',
				priorityIndex: 1,
				deadline: '',
				estimated_minutes: 0,
				notes: '',
				parentTask: task
			};
			this.showSubtaskEditPopup = true;
		},
		
		editSubtask(task, subtask) {
			const priorityIndex = this.priorityOptions.findIndex(p => p.value === subtask.priority);
			this.editingSubtask = {
				id: subtask.id,
				title: subtask.title,
				description: subtask.description,
				priorityIndex: priorityIndex !== -1 ? priorityIndex : 1,
				deadline: subtask.deadline,
				estimated_minutes: subtask.estimated_minutes,
				notes: subtask.notes,
				parentTask: task
			};
			this.showSubtaskEditPopup = true;
		},
		
		async showSubtaskStats(task) {
			try {
				const token = uni.getStorageSync('token');
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans/tasks/${task.id}/subtasks/stats`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				});
				
				if (response.data.success) {
					this.subtaskStats = response.data.data;
					this.showStatsPopup = true;
				}
			} catch (error) {
				console.error('获取子任务统计失败:', error);
				uni.showToast({
					title: '获取统计失败',
					icon: 'none'
				});
			}
		},
		
		closeTaskEditPopup() {
			this.showTaskEditPopup = false;
		},
		
		closeSubtaskEditPopup() {
			this.showSubtaskEditPopup = false;
		},
		
		closeStatsPopup() {
			this.showStatsPopup = false;
		},
		
		onTaskPriorityChange(e) {
			this.editingTask.priorityIndex = e.detail.value;
		},
		
		onTaskDeadlineChange(e) {
			this.editingTask.deadline = e.detail.value;
		},
		
		onSubtaskPriorityChange(e) {
			this.editingSubtask.priorityIndex = e.detail.value;
		},
		
		onSubtaskDeadlineChange(e) {
			this.editingSubtask.deadline = e.detail.value;
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
						url: `${this.$config.apiBaseUrl}/study-plans/tasks/${this.editingTask.id}`,
						method: 'PUT',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: taskData
					});
					
					if (response.data.success) {
						const taskIndex = this.planData.tasks.findIndex(t => t.id === this.editingTask.id);
						if (taskIndex !== -1) {
							Object.assign(this.planData.tasks[taskIndex], taskData);
						}
					}
				} else {
					// 新建任务
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/study-plans/tasks`,
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
						this.planData.tasks.push({
							id: response.data.data.task_id,
							...taskData,
							completed: false,
							createdAt: new Date(),
							expanded: false,
							subtasks: []
						});
					}
				}
				
				this.closeTaskEditPopup();
				this.calculateWeightedProgress();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
			} catch (error) {
				console.error('保存任务失败:', error);
				if (error.response && error.response.data && error.response.data.errorCode) {
					uni.showToast({
						title: error.response.data.message || '保存失败',
						icon: 'none'
					});
				} else {
					uni.showToast({
						title: '保存失败',
						icon: 'none'
					});
				}
			}
		},
		
		async saveSubtask() {
			if (!this.editingSubtask.title.trim()) {
				uni.showToast({
					title: '请输入子任务名称',
					icon: 'none'
				});
				return;
			}
			
			try {
				const token = uni.getStorageSync('token');
				const subtaskData = {
					title: this.editingSubtask.title.trim(),
					description: this.editingSubtask.description.trim(),
					priority: this.priorityOptions[this.editingSubtask.priorityIndex].value,
					deadline: this.editingSubtask.deadline || null,
					estimated_minutes: parseInt(this.editingSubtask.estimated_minutes) || 0,
					notes: this.editingSubtask.notes.trim()
				};
				
				if (this.editingSubtask.id) {
					// 编辑子任务
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/study-plans/subtasks/${this.editingSubtask.id}`,
						method: 'PUT',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: subtaskData
					});
					
					if (response.data.success) {
						const task = this.editingSubtask.parentTask;
						const subtaskIndex = task.subtasks.findIndex(s => s.id === this.editingSubtask.id);
						if (subtaskIndex !== -1) {
							Object.assign(task.subtasks[subtaskIndex], subtaskData);
						}
					}
				} else {
					// 新建子任务
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/study-plans/tasks/${this.editingSubtask.parentTask.id}/subtasks`,
						method: 'POST',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: subtaskData
					});
					
					if (response.data.success) {
						this.editingSubtask.parentTask.subtasks.push({
							id: response.data.data.subtask_id,
							...subtaskData,
							completed: false,
							sort_order: response.data.data.sort_order
						});
					}
				}
				
				this.closeSubtaskEditPopup();
				this.calculateWeightedProgress();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
			} catch (error) {
				console.error('保存子任务失败:', error);
				if (error.response && error.response.data && error.response.data.errorCode) {
					uni.showToast({
						title: error.response.data.message || '保存失败',
						icon: 'none'
					});
				} else {
					uni.showToast({
						title: '保存失败',
						icon: 'none'
					});
				}
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
								url: `${this.$config.apiBaseUrl}/study-plans/tasks/${task.id}`,
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							});
							
							if (response.data.success) {
								const taskIndex = this.planData.tasks.findIndex(t => t.id === task.id);
								if (taskIndex !== -1) {
									this.planData.tasks.splice(taskIndex, 1);
								}
								this.updatePlanProgress();
								this.calculateWeightedProgress();
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
		
		async deleteSubtask(task, subtask) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除子任务「${subtask.title}」吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							const token = uni.getStorageSync('token');
							const response = await uni.request({
								url: `${this.$config.apiBaseUrl}/study-plans/subtasks/${subtask.id}`,
								method: 'DELETE',
								header: {
									'Authorization': `Bearer ${token}`
								}
							});
							
							if (response.data.success) {
								const subtaskIndex = task.subtasks.findIndex(s => s.id === subtask.id);
								if (subtaskIndex !== -1) {
									task.subtasks.splice(subtaskIndex, 1);
								}
								this.calculateWeightedProgress();
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
							}
						} catch (error) {
							console.error('删除子任务失败:', error);
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
			
			this.planData.progressPercent = progressPercent;
			
			try {
				const token = uni.getStorageSync('token');
				await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans/${this.planId}`,
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
		
		getSubtaskProgress(task) {
			if (!task.subtasks || task.subtasks.length === 0) return 0;
			const completed = task.subtasks.filter(s => s.completed).length;
			return Math.round((completed / task.subtasks.length) * 100);
		},
		
		isSubtaskOverdue(subtask) {
			if (!subtask.deadline || subtask.completed) return false;
			const today = new Date().toISOString().split('T')[0];
			return today > subtask.deadline;
		},
		
		formatEstimatedTime(minutes) {
			if (!minutes || minutes === 0) return '未设置';
			
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			
			if (hours === 0) {
				return `${mins}分钟`;
			} else if (mins === 0) {
				return `${hours}小时`;
			} else {
				return `${hours}小时${mins}分钟`;
			}
		},
		
		formatMinutesToTime(minutes) {
			if (!minutes || minutes === 0) return '0分钟';
			
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			
			if (hours === 0) {
				return `${mins}分钟`;
			} else if (mins === 0) {
				return `${hours}小时`;
			} else {
				return `${hours}小时${mins}分钟`;
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
	
	&.weighted {
		background: linear-gradient(to right, #f093fb, #f5576c);
	}
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
		border-bottom: 1rpx solid #f0f0f0;
		
		&:last-child {
			border-bottom: none;
		}
		
		&.completed {
			opacity: 0.6;
		}
		
		&.expanded {
			background: #fafafa;
			border-radius: 12rpx;
			margin-bottom: 16rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
		}
	}
}

.task-header {
	display: flex;
	align-items: flex-start;
	padding: 20rpx 0;
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

.task-main {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: flex-start;
	cursor: pointer;
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
	margin-bottom: 8rpx;
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

.subtask-summary {
	margin-top: 8rpx;
	
	.summary-text {
		font-size: 22rpx;
		color: #666;
		display: block;
		margin-bottom: 6rpx;
	}
	
	.mini-progress-bar {
		height: 4rpx;
		background-color: #f0f0f0;
		border-radius: 2rpx;
		overflow: hidden;
		
		.mini-progress-fill {
			height: 100%;
			background-color: #007aff;
			transition: width 0.3s ease;
		}
	}
}

.task-expand-icon {
	margin-left: 16rpx;
	padding: 8rpx;
	
	.expand-arrow {
		font-size: 20rpx;
		color: #999;
		transition: transform 0.3s ease;
		
		&.expanded {
			transform: rotate(180deg);
		}
	}
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
	
	&.edit-subtask {
		color: #007aff;
		background: transparent;
		font-size: 28rpx;
		padding: 4rpx;
	}
	
	&.delete-subtask {
		color: #ff3b30;
		background: transparent;
		font-size: 28rpx;
		padding: 4rpx;
	}
}

.subtasks-container {
	padding: 20rpx;
	background: white;
	border-radius: 12rpx;
	margin: 16rpx 0 0 56rpx;
	border-left: 4rpx solid #007aff;
}

.subtasks-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
	
	.subtasks-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #333;
	}
	
	.subtask-actions {
		display: flex;
		gap: 12rpx;
		
		.add-subtask-btn, .subtask-stats-btn {
			font-size: 22rpx;
			padding: 6rpx 12rpx;
			border-radius: 12rpx;
			background: #f0f8ff;
			color: #007aff;
		}
	}
}

.subtask-list {
	.subtask-item {
		display: flex;
		align-items: flex-start;
		padding: 12rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
		
		&:last-child {
			border-bottom: none;
		}
		
		&.completed {
			opacity: 0.6;
		}
		
		&.overdue {
			background: #fff5f5;
			border-radius: 8rpx;
			padding: 12rpx;
		}
	}
}

.subtask-drag-handle {
	font-size: 20rpx;
	color: #ccc;
	margin-right: 8rpx;
	cursor: move;
}

.subtask-checkbox {
	width: 32rpx;
	height: 32rpx;
	border: 2rpx solid #ddd;
	border-radius: 6rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	flex-shrink: 0;
	background-color: #fff;
	transition: all 0.3s ease;
}

.subtask-item.completed .subtask-checkbox {
	background-color: #007aff;
	border-color: #007aff;
}

.subtask-content {
	flex: 1;
	min-width: 0;
	cursor: pointer;
}

.subtask-title {
	font-size: 24rpx;
	color: #333;
	display: block;
	margin-bottom: 6rpx;
}

.subtask-item.completed .subtask-title {
	text-decoration: line-through;
}

.subtask-description {
	font-size: 22rpx;
	color: #666;
	display: block;
	margin-bottom: 8rpx;
}

.subtask-meta {
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex-wrap: wrap;
}

.subtask-priority {
	padding: 2rpx 6rpx;
	border-radius: 6rpx;
	font-size: 18rpx;
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

.subtask-deadline, .subtask-estimate {
	font-size: 20rpx;
	color: #999;
}

.subtask-overdue {
	font-size: 20rpx;
	color: #ff3b30;
}

.subtask-actions {
	display: flex;
	gap: 8rpx;
	margin-left: 12rpx;
}

.empty-subtasks, .empty-tasks {
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

// 弹窗样式
.task-edit-mask, .subtask-edit-mask, .stats-mask {
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

.task-edit-popup, .subtask-edit-popup, .stats-popup {
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

// 统计弹窗专用样式
.stats-detail {
	.stats-overview {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16rpx;
		margin-bottom: 30rpx;
		
		.overview-item {
			text-align: center;
			padding: 16rpx;
			background: #f8f9fa;
			border-radius: 12rpx;
			
			.overview-number {
				display: block;
				font-size: 32rpx;
				font-weight: bold;
				color: #007aff;
				margin-bottom: 6rpx;
			}
			
			.overview-label {
				font-size: 22rpx;
				color: #666;
			}
		}
	}
	
	.progress-comparison {
		margin-bottom: 30rpx;
		
		.progress-item {
			margin-bottom: 20rpx;
			
			.progress-title {
				font-size: 26rpx;
				color: #333;
				margin-bottom: 8rpx;
				display: block;
			}
			
			.progress-text {
				font-size: 24rpx;
				color: #007aff;
				margin-top: 8rpx;
				display: block;
				text-align: right;
			}
		}
	}
	
	.priority-breakdown {
		margin-bottom: 30rpx;
		
		.breakdown-title {
			font-size: 28rpx;
			color: #333;
			margin-bottom: 16rpx;
			display: block;
		}
		
		.priority-items {
			.priority-item {
				display: flex;
				align-items: center;
				margin-bottom: 12rpx;
				
				.priority-badge {
					width: 16rpx;
					height: 16rpx;
					border-radius: 50%;
					margin-right: 12rpx;
					
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
				
				.priority-text {
					font-size: 24rpx;
					color: #666;
				}
			}
		}
	}
	
	.time-estimation {
		.estimation-title {
			font-size: 28rpx;
			color: #333;
			margin-bottom: 16rpx;
			display: block;
		}
		
		.estimation-items {
			.estimation-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 12rpx 0;
				border-bottom: 1rpx solid #f0f0f0;
				
				&:last-child {
					border-bottom: none;
				}
				
				.estimation-label {
					font-size: 24rpx;
					color: #666;
				}
				
				.estimation-value {
					font-size: 24rpx;
					color: #333;
					font-weight: 500;
				}
			}
		}
	}
}
</style>