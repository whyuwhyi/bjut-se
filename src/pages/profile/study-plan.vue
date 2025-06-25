<template>
	<view class="study-plan-container">
		<!-- 顶部操作栏 -->
		<view class="top-actions">
			<view class="plan-selector">
				<picker @change="onPlanChange" :value="selectedPlanIndex" :range="planTypes" range-key="name">
					<view class="selector-trigger">
						<text class="current-plan">{{ planTypes[selectedPlanIndex].name }}</text>
						<text class="dropdown-icon">⌄</text>
					</view>
				</picker>
			</view>
			<button class="add-btn" @click="addNewPlan">
				<text class="add-icon">+</text>
				<text class="add-text">新建计划</text>
			</button>
		</view>

		<!-- 当前计划概览 -->
		<view class="current-plan-overview" v-if="currentPlan">
			<view class="plan-header">
				<text class="plan-title">{{ currentPlan.title }}</text>
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
							<text class="task-deadline">{{ formatDate(task.deadline) }}</text>
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

		<!-- 学习日历 -->
		<view class="calendar-section">
			<view class="section-header">
				<text class="section-title">学习日历</text>
				<view class="calendar-nav">
					<text class="nav-btn" @click="prevMonth">‹</text>
					<text class="current-month">{{ currentMonthText }}</text>
					<text class="nav-btn" @click="nextMonth">›</text>
				</view>
			</view>
			
			<view class="calendar-grid">
				<view class="weekday-header">
					<text class="weekday" v-for="day in weekdays" :key="day">{{ day }}</text>
				</view>
				<view class="calendar-body">
					<view 
						class="calendar-day" 
						:class="getDayClass(date)"
						v-for="date in calendarDates" 
						:key="date.key"
						@click="selectDate(date)"
					>
						<text class="day-number">{{ date.day }}</text>
						<view class="day-indicator" v-if="date.hasTask"></view>
					</view>
				</view>
			</view>
		</view>

		<!-- 新建计划弹窗 -->
		<uni-popup ref="planPopup" type="bottom">
			<view class="plan-form">
				<view class="form-header">
					<text class="form-title">新建学习计划</text>
					<text class="form-close" @click="closePlanForm">✕</text>
				</view>
				
				<view class="form-body">
					<view class="form-group">
						<text class="form-label">计划名称</text>
						<input class="form-input" v-model="newPlan.title" placeholder="输入计划名称" />
					</view>
					
					<view class="form-group">
						<text class="form-label">计划描述</text>
						<textarea class="form-textarea" v-model="newPlan.description" placeholder="描述学习目标和内容" />
					</view>
					
					<view class="form-row">
						<view class="form-group half">
							<text class="form-label">开始日期</text>
							<picker mode="date" @change="onStartDateChange">
								<view class="date-picker">{{ newPlan.startDate || '选择日期' }}</view>
							</picker>
						</view>
						<view class="form-group half">
							<text class="form-label">结束日期</text>
							<picker mode="date" @change="onEndDateChange">
								<view class="date-picker">{{ newPlan.endDate || '选择日期' }}</view>
							</picker>
						</view>
					</view>
					
					<view class="form-group">
						<text class="form-label">计划类型</text>
						<picker @change="onTypeChange" :value="newPlan.typeIndex" :range="planTypes" range-key="name">
							<view class="type-picker">{{ planTypes[newPlan.typeIndex].name }}</view>
						</picker>
					</view>
				</view>
				
				<view class="form-actions">
					<button class="cancel-btn" @click="closePlanForm">取消</button>
					<button class="submit-btn" @click="createPlan">创建计划</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				selectedPlanIndex: 0,
				selectedFilter: 0,
				currentMonth: new Date(),
				planTypes: [
					{ name: '前端开发学习', value: 'frontend' },
					{ name: '算法练习计划', value: 'algorithm' },
					{ name: '项目实战计划', value: 'project' },
					{ name: '考试复习计划', value: 'exam' }
				],
				taskFilters: [
					{ name: '全部', value: 'all' },
					{ name: '进行中', value: 'active' },
					{ name: '已完成', value: 'completed' },
					{ name: '已逾期', value: 'overdue' }
				],
				weekdays: ['日', '一', '二', '三', '四', '五', '六'],
				studyPlans: [
					{
						id: '1',
						title: '前端开发学习计划',
						description: '系统学习Vue.js、React等前端技术栈',
						status: 'active',
						progressPercent: 65,
						startDate: new Date('2025-06-01'),
						endDate: new Date('2025-08-31'),
						tasks: [
							{
								id: '1',
								title: '学习Vue.js基础',
								description: '掌握Vue.js组件、指令、生命周期等基础概念',
								completed: true,
								priority: 'high',
								deadline: new Date('2025-06-15'),
								tags: ['Vue.js', '前端'],
								subtasks: [
									{ id: '1-1', title: 'Vue实例和模板语法', completed: true },
									{ id: '1-2', title: '组件基础', completed: true },
									{ id: '1-3', title: '组件通信', completed: false }
								]
							},
							{
								id: '2',
								title: '实践Vue项目',
								description: '开发一个完整的Vue.js单页应用',
								completed: false,
								priority: 'high',
								deadline: new Date('2025-07-01'),
								tags: ['Vue.js', '实践', '项目'],
								subtasks: [
									{ id: '2-1', title: '项目初始化', completed: true },
									{ id: '2-2', title: '路由配置', completed: false },
									{ id: '2-3', title: '状态管理', completed: false }
								]
							}
						]
					}
				],
				newPlan: {
					title: '',
					description: '',
					startDate: '',
					endDate: '',
					typeIndex: 0
				}
			}
		},
		
		computed: {
			currentPlan() {
				return this.studyPlans[this.selectedPlanIndex] || null;
			},
			
			filteredTasks() {
				if (!this.currentPlan) return [];
				const filter = this.taskFilters[this.selectedFilter];
				
				if (filter.value === 'all') {
					return this.currentPlan.tasks;
				} else if (filter.value === 'completed') {
					return this.currentPlan.tasks.filter(task => task.completed);
				} else if (filter.value === 'active') {
					return this.currentPlan.tasks.filter(task => !task.completed && new Date() <= task.deadline);
				} else if (filter.value === 'overdue') {
					return this.currentPlan.tasks.filter(task => !task.completed && new Date() > task.deadline);
				}
				
				return this.currentPlan.tasks;
			},
			
			currentMonthText() {
				return this.currentMonth.toLocaleDateString('zh-CN', {
					year: 'numeric',
					month: 'long'
				});
			},
			
			calendarDates() {
				const year = this.currentMonth.getFullYear();
				const month = this.currentMonth.getMonth();
				const firstDay = new Date(year, month, 1);
				const lastDay = new Date(year, month + 1, 0);
				const startDate = new Date(firstDay);
				startDate.setDate(startDate.getDate() - firstDay.getDay());
				
				const dates = [];
				for (let i = 0; i < 42; i++) {
					const date = new Date(startDate);
					date.setDate(startDate.getDate() + i);
					
					dates.push({
						key: date.toDateString(),
						day: date.getDate(),
						isCurrentMonth: date.getMonth() === month,
						isToday: date.toDateString() === new Date().toDateString(),
						hasTask: this.hasTaskOnDate(date),
						date: date
					});
				}
				
				return dates;
			}
		},
		
		methods: {
			onPlanChange(e) {
				this.selectedPlanIndex = e.detail.value;
			},
			
			addNewPlan() {
				this.$refs.planPopup.open();
			},
			
			selectFilter(index) {
				this.selectedFilter = index;
			},
			
			toggleTask(task) {
				task.completed = !task.completed;
				// 更新计划进度
				this.updatePlanProgress();
			},
			
			viewTask(task) {
				uni.navigateTo({
					url: `/pages/profile/task-detail?id=${task.id}`
				});
			},
			
			updatePlanProgress() {
				if (!this.currentPlan) return;
				const completed = this.currentPlan.tasks.filter(task => task.completed).length;
				const total = this.currentPlan.tasks.length;
				this.currentPlan.progressPercent = Math.round((completed / total) * 100);
			},
			
			prevMonth() {
				const prev = new Date(this.currentMonth);
				prev.setMonth(prev.getMonth() - 1);
				this.currentMonth = prev;
			},
			
			nextMonth() {
				const next = new Date(this.currentMonth);
				next.setMonth(next.getMonth() + 1);
				this.currentMonth = next;
			},
			
			selectDate(date) {
				// 选择日期，可以查看当天的任务
				console.log('选择日期:', date.date);
			},
			
			hasTaskOnDate(date) {
				// 检查指定日期是否有任务
				if (!this.currentPlan) return false;
				return this.currentPlan.tasks.some(task => {
					const taskDate = new Date(task.deadline);
					return taskDate.toDateString() === date.toDateString();
				});
			},
			
			getDayClass(date) {
				const classes = [];
				if (!date.isCurrentMonth) classes.push('other-month');
				if (date.isToday) classes.push('today');
				if (date.hasTask) classes.push('has-task');
				return classes.join(' ');
			},
			
			onStartDateChange(e) {
				this.newPlan.startDate = e.detail.value;
			},
			
			onEndDateChange(e) {
				this.newPlan.endDate = e.detail.value;
			},
			
			onTypeChange(e) {
				this.newPlan.typeIndex = e.detail.value;
			},
			
			createPlan() {
				if (!this.newPlan.title.trim()) {
					uni.showToast({
						title: '请输入计划名称',
						icon: 'none'
					});
					return;
				}
				
				// 创建新计划
				const plan = {
					id: Date.now().toString(),
					title: this.newPlan.title,
					description: this.newPlan.description,
					status: 'active',
					progressPercent: 0,
					startDate: new Date(this.newPlan.startDate),
					endDate: new Date(this.newPlan.endDate),
					tasks: []
				};
				
				this.studyPlans.push(plan);
				this.selectedPlanIndex = this.studyPlans.length - 1;
				
				// 重置表单
				this.newPlan = {
					title: '',
					description: '',
					startDate: '',
					endDate: '',
					typeIndex: 0
				};
				
				this.closePlanForm();
				
				uni.showToast({
					title: '计划创建成功',
					icon: 'success'
				});
			},
			
			closePlanForm() {
				this.$refs.planPopup.close();
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
				return `${start} - ${end}`;
			}
		}
	}
</script>

<style scoped>
	.study-plan-container {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding-bottom: 40rpx;
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

	.add-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 24rpx;
		background-color: #007aff;
		color: #ffffff;
		border-radius: 24rpx;
		font-size: 26rpx;
		border: none;
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
		color: #333333;
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

	/* 日历部分 */
	.calendar-section {
		margin: 16rpx 32rpx;
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	.calendar-nav {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.nav-btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background-color: #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #666666;
	}

	.current-month {
		font-size: 28rpx;
		color: #333333;
		font-weight: 500;
	}

	.calendar-grid {
		margin-top: 24rpx;
	}

	.weekday-header {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: 16rpx;
	}

	.weekday {
		text-align: center;
		font-size: 24rpx;
		color: #999999;
		padding: 16rpx 0;
	}

	.calendar-body {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2rpx;
	}

	.calendar-day {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		border-radius: 8rpx;
		cursor: pointer;
	}

	.calendar-day.other-month .day-number {
		color: #cccccc;
	}

	.calendar-day.today {
		background-color: #007aff;
		color: #ffffff;
	}

	.calendar-day.has-task::after {
		content: '';
		position: absolute;
		bottom: 8rpx;
		width: 8rpx;
		height: 8rpx;
		background-color: #ff3b30;
		border-radius: 50%;
	}

	.day-number {
		font-size: 24rpx;
		color: #333333;
	}

	/* 新建计划表单 */
	.plan-form {
		background-color: #ffffff;
		border-radius: 16rpx 16rpx 0 0;
		max-height: 80vh;
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}

	.form-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
	}

	.form-close {
		font-size: 32rpx;
		color: #666666;
		padding: 8rpx;
	}

	.form-body {
		padding: 32rpx;
		max-height: 50vh;
		overflow-y: auto;
	}

	.form-group {
		margin-bottom: 32rpx;
	}

	.form-group.half {
		flex: 1;
	}

	.form-row {
		display: flex;
		gap: 24rpx;
	}

	.form-label {
		font-size: 28rpx;
		color: #333333;
		margin-bottom: 16rpx;
		display: block;
	}

	.form-input, .form-textarea {
		width: 100%;
		padding: 24rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #333333;
		background-color: #f8f9fa;
	}

	.form-textarea {
		height: 120rpx;
		resize: none;
	}

	.date-picker, .type-picker {
		padding: 24rpx;
		border: 1rpx solid #e0e0e0;
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #333333;
		background-color: #f8f9fa;
	}

	.form-actions {
		display: flex;
		gap: 24rpx;
		padding: 32rpx;
		border-top: 1rpx solid #e0e0e0;
	}

	.cancel-btn, .submit-btn {
		flex: 1;
		padding: 24rpx;
		border-radius: 12rpx;
		font-size: 28rpx;
		border: none;
	}

	.cancel-btn {
		background-color: #f0f0f0;
		color: #666666;
	}

	.submit-btn {
		background-color: #007aff;
		color: #ffffff;
	}
</style>