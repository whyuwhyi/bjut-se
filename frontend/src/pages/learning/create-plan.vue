<template>
	<view class="create-plan-container">
		<!-- 顶部导航栏 -->
		<view class="navbar">
			<view class="nav-left" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">{{ planData.id ? '编辑学习计划' : '新建学习计划' }}</text>
			<view class="nav-right">
				<text class="save-btn" @click="savePlan">保存</text>
			</view>
		</view>

		<!-- 表单内容 -->
		<view class="form-container">
			<!-- 计划名称 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-text">计划名称</text>
					<text class="required">*</text>
				</view>
				<input 
					class="plan-title-input" 
					v-model="planData.title" 
					placeholder="请输入学习计划名称"
					maxlength="50"
				/>
				<text class="char-count">{{ planData.title.length }}/50</text>
			</view>

			<!-- 计划描述 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-text">计划描述</text>
				</view>
				<textarea 
					class="plan-desc-input" 
					v-model="planData.description" 
					placeholder="请描述学习计划的目标和内容"
					maxlength="200"
				></textarea>
				<text class="char-count">{{ planData.description.length }}/200</text>
			</view>

			<!-- 计划类型 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-text">计划类型</text>
				</view>
				<picker :value="planData.typeIndex" :range="planTypes" range-key="label" @change="onTypeChange">
					<view class="picker-item">
						<text class="picker-text">{{ planTypes[planData.typeIndex].label }}</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
			</view>

			<!-- 优先级 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-text">优先级</text>
				</view>
				<picker :value="planData.priorityIndex" :range="priorityOptions" range-key="label" @change="onPriorityChange">
					<view class="picker-item">
						<text class="picker-text">{{ priorityOptions[planData.priorityIndex].label }}</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
			</view>

			<!-- 时间范围 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-text">时间范围</text>
					<text class="required">*</text>
				</view>
				<view class="date-range">
					<view class="date-item">
						<text class="date-label">开始日期</text>
						<picker mode="date" :value="planData.startDate" @change="onStartDateChange">
							<view class="date-picker">
								<text class="date-text">{{ planData.startDate || '选择日期' }}</text>
								<text class="date-icon">📅</text>
							</view>
						</picker>
					</view>
					<view class="date-separator">
						<text class="separator-line">—</text>
					</view>
					<view class="date-item">
						<text class="date-label">结束日期</text>
						<picker mode="date" :value="planData.endDate" @change="onEndDateChange">
							<view class="date-picker">
								<text class="date-text">{{ planData.endDate || '选择日期' }}</text>
								<text class="date-icon">📅</text>
							</view>
						</picker>
					</view>
				</view>
			</view>

			<!-- 学习任务 -->
			<view class="form-section">
				<view class="section-title">
					<text class="title-text">学习任务</text>
					<text class="add-task-btn" @click="addTask">+ 添加任务</text>
				</view>
				
				<view class="task-list" v-if="planData.tasks.length > 0">
					<view 
						class="task-item" 
						v-for="(task, index) in planData.tasks" 
						:key="index"
					>
						<view class="task-content">
							<input 
								class="task-title-input" 
								v-model="task.title" 
								placeholder="请输入任务名称"
								maxlength="50"
							/>
							<textarea 
								class="task-desc-input" 
								v-model="task.description" 
								placeholder="任务描述（可选）"
								maxlength="100"
							></textarea>
							<view class="task-meta">
								<picker :value="task.priorityIndex" :range="priorityOptions" range-key="label" @change="(e) => onTaskPriorityChange(e, index)">
									<view class="task-priority">
										<text class="priority-label">{{ priorityOptions[task.priorityIndex].label }}</text>
									</view>
								</picker>
								<picker mode="date" :value="task.deadline" @change="(e) => onTaskDeadlineChange(e, index)">
									<view class="task-deadline">
										<text class="deadline-label">{{ task.deadline || '无截止日期' }}</text>
									</view>
								</picker>
							</view>
						</view>
						<view class="task-actions">
							<text class="delete-task-btn" @click="removeTask(index)">删除</text>
						</view>
					</view>
				</view>
				
				<view class="empty-tasks" v-else>
					<text class="empty-text">暂无学习任务，点击上方按钮添加</text>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="bottom-actions">
			<button class="cancel-btn" @click="goBack">取消</button>
			<button class="save-btn" @click="savePlan">保存计划</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			planData: {
				title: '',
				description: '',
				typeIndex: 0,
				priorityIndex: 1,
				startDate: '',
				endDate: '',
				tasks: []
			},
			planTypes: [
				{ label: '自定义计划', value: 'custom' },
				{ label: '前端开发', value: 'frontend' },
				{ label: '后端开发', value: 'backend' },
				{ label: '算法练习', value: 'algorithm' },
				{ label: '考试复习', value: 'exam' },
				{ label: '项目实战', value: 'project' },
				{ label: '语言学习', value: 'language' }
			],
			priorityOptions: [
				{ label: '高优先级', value: 'high' },
				{ label: '中优先级', value: 'medium' },
				{ label: '低优先级', value: 'low' }
			]
		}
	},
	
	onLoad(options) {
		// 如果是编辑模式，加载现有计划数据
		if (options.id) {
			this.loadPlanData(options.id)
		} else {
			// 新建模式，设置默认开始日期为今天
			const today = new Date()
			this.planData.startDate = this.formatDate(today)
			
			// 设置默认结束日期为一个月后
			const nextMonth = new Date(today)
			nextMonth.setMonth(nextMonth.getMonth() + 1)
			this.planData.endDate = this.formatDate(nextMonth)
		}
	},
	
	methods: {
		goBack() {
			uni.navigateBack()
		},
		
		async loadPlanData(planId) {
			try {
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.reLaunch({
						url: '/pages/login/login'
					})
					return
				}
				
				const response = await uni.request({
					url: `${this.$config.apiBaseUrl}/study-plans/${planId}`,
					method: 'GET',
					header: {
						'Authorization': `Bearer ${token}`
					}
				})
				
				if (response.data.success) {
					const plan = response.data.data
					const typeIndex = this.planTypes.findIndex(t => t.value === plan.plan_type);
					const priorityIndex = this.priorityOptions.findIndex(p => p.value === plan.priority);
					
					this.planData = {
						id: plan.plan_id,
						title: plan.title,
						description: plan.description,
						typeIndex: typeIndex !== -1 ? typeIndex : 0,
						priorityIndex: priorityIndex !== -1 ? priorityIndex : 1,
						startDate: plan.start_date.split('T')[0],
						endDate: plan.end_date.split('T')[0],
						tasks: plan.tasks ? plan.tasks.map(task => {
							const taskPriorityIndex = this.priorityOptions.findIndex(p => p.value === task.priority);
							return {
								id: task.task_id,
								title: task.title,
								description: task.description,
								priorityIndex: taskPriorityIndex !== -1 ? taskPriorityIndex : 1,
								deadline: task.deadline ? task.deadline.split('T')[0] : ''
							};
						}) : []
					}
				}
			} catch (error) {
				console.error('加载计划数据失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			}
		},
		
		onTypeChange(e) {
			this.planData.typeIndex = e.detail.value
		},
		
		onPriorityChange(e) {
			this.planData.priorityIndex = e.detail.value
		},
		
		onStartDateChange(e) {
			this.planData.startDate = e.detail.value
			// 如果开始日期晚于结束日期，自动调整结束日期
			if (this.planData.endDate && this.planData.startDate > this.planData.endDate) {
				const startDate = new Date(this.planData.startDate)
				startDate.setMonth(startDate.getMonth() + 1)
				this.planData.endDate = this.formatDate(startDate)
			}
		},
		
		onEndDateChange(e) {
			this.planData.endDate = e.detail.value
		},
		
		addTask() {
			const newTask = {
				title: '',
				description: '',
				priorityIndex: 1,
				deadline: ''
			}
			this.planData.tasks.push(newTask)
		},
		
		removeTask(index) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个任务吗？',
				success: (res) => {
					if (res.confirm) {
						this.planData.tasks.splice(index, 1)
					}
				}
			})
		},
		
		onTaskPriorityChange(e, index) {
			this.planData.tasks[index].priorityIndex = e.detail.value
		},
		
		onTaskDeadlineChange(e, index) {
			this.planData.tasks[index].deadline = e.detail.value
		},
		
		validateForm() {
			if (!this.planData.title.trim()) {
				uni.showToast({
					title: '请输入计划名称',
					icon: 'none'
				})
				return false
			}
			
			if (!this.planData.startDate) {
				uni.showToast({
					title: '请选择开始日期',
					icon: 'none'
				})
				return false
			}
			
			if (!this.planData.endDate) {
				uni.showToast({
					title: '请选择结束日期',
					icon: 'none'
				})
				return false
			}
			
			if (this.planData.startDate > this.planData.endDate) {
				uni.showToast({
					title: '开始日期不能晚于结束日期',
					icon: 'none'
				})
				return false
			}
			
			// 验证任务
			for (let i = 0; i < this.planData.tasks.length; i++) {
				const task = this.planData.tasks[i]
				if (!task.title.trim()) {
					uni.showToast({
						title: `请输入第${i + 1}个任务的名称`,
						icon: 'none'
					})
					return false
				}
			}
			
			return true
		},
		
		async savePlan() {
			if (!this.validateForm()) {
				return
			}
			
			uni.showLoading({
				title: '保存中...'
			})
			
			try {
				// 准备提交数据
				const submitData = {
					title: this.planData.title.trim(),
					description: this.planData.description.trim(),
					planType: this.planTypes[this.planData.typeIndex].value,
					priority: this.priorityOptions[this.planData.priorityIndex].value,
					startDate: this.planData.startDate,
					endDate: this.planData.endDate,
					tasks: this.planData.tasks.map(task => ({
						title: task.title.trim(),
						description: task.description.trim(),
						priority: this.priorityOptions[task.priorityIndex].value,
						deadline: task.deadline || null
					})).filter(task => task.title) // 只提交有标题的任务
				}
				
				const token = uni.getStorageSync('token')
				if (!token) {
					uni.reLaunch({
						url: '/pages/login/login'
					})
					return
				}
				
				let planId = this.planData.id
				
				if (this.planData.id) {
					// 编辑模式 - 更新计划
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/study-plans/${this.planData.id}`,
						method: 'PUT',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: {
							title: submitData.title,
							description: submitData.description,
							start_date: submitData.startDate,
							end_date: submitData.endDate,
							plan_type: submitData.planType,
							priority: submitData.priority
						}
					})
					
					if (!response.data.success) {
						throw new Error(response.data.message || '更新失败')
					}
				} else {
					// 新建模式 - 创建计划
					const response = await uni.request({
						url: `${this.$config.apiBaseUrl}/study-plans`,
						method: 'POST',
						header: {
							'Authorization': `Bearer ${token}`,
							'Content-Type': 'application/json'
						},
						data: {
							title: submitData.title,
							description: submitData.description,
							start_date: submitData.startDate,
							end_date: submitData.endDate,
							plan_type: submitData.planType,
							priority: submitData.priority
						}
					})
					
					if (!response.data.success) {
						throw new Error(response.data.message || '保存失败')
					}
					
					planId = response.data.data.plan_id
				}
				
				// 处理任务 - 只在新建模式下创建任务，编辑模式下不处理任务
				if (!this.planData.id && submitData.tasks.length > 0) {
					for (const task of submitData.tasks) {
						await uni.request({
							url: `${this.$config.apiBaseUrl}/study-plans/tasks`,
							method: 'POST',
							header: {
								'Authorization': `Bearer ${token}`,
								'Content-Type': 'application/json'
							},
							data: {
								plan_id: planId,
								title: task.title,
								description: task.description,
								priority: task.priority,
								deadline: task.deadline
							}
						})
					}
				}
				
				uni.hideLoading()
				uni.showToast({
					title: this.planData.id ? '更新成功' : '保存成功',
					icon: 'success'
				})
				
				// 延迟返回，让用户看到成功提示
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
				
			} catch (error) {
				uni.hideLoading()
				console.error('保存计划失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				})
			}
		},
		
		formatDate(date) {
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
	}
}
</script>

<style lang="scss" scoped>
.create-plan-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	animation: gradientBG 15s ease infinite;
}

@keyframes gradientBG {
	0% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
	50% {
		background: linear-gradient(135deg, #FAEED1 0%, #FFF8DB 100%);
	}
	100% {
		background: linear-gradient(135deg, #FFF8DB 0%, #FAEED1 100%);
	}
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
		
		.save-btn {
			font-size: 28rpx;
			color: #007aff;
		}
	}
}

.form-container {
	padding: 20rpx;
}

.form-section {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	
	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
		
		.title-text {
			font-size: 30rpx;
			font-weight: bold;
			color: #333;
		}
		
		.required {
			color: #ff3b30;
			margin-left: 8rpx;
			font-size: 30rpx;
		}
		
		.add-task-btn {
			margin-left: auto;
			font-size: 26rpx;
			color: #007aff;
			padding: 8rpx 16rpx;
			background: #f0f8ff;
			border-radius: 20rpx;
		}
	}
	
	.char-count {
		display: block;
		text-align: right;
		font-size: 22rpx;
		color: #999;
		margin-top: 10rpx;
	}
}

.plan-title-input {
	width: 100%;
	font-size: 28rpx;
	border: 2rpx solid #f0f0f0;
	border-radius: 12rpx;
	padding: 20rpx;
	background: #fafafa;
}

.plan-desc-input {
	width: 100%;
	min-height: 120rpx;
	font-size: 28rpx;
	border: 2rpx solid #f0f0f0;
	border-radius: 12rpx;
	padding: 20rpx;
	background: #fafafa;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx;
	background: #fafafa;
	border-radius: 12rpx;
	
	.picker-text {
		font-size: 28rpx;
		color: #333;
	}
	
	.picker-arrow {
		font-size: 24rpx;
		color: #999;
	}
}

.date-range {
	display: flex;
	align-items: center;
	gap: 20rpx;
	
	.date-item {
		flex: 1;
		
		.date-label {
			display: block;
			font-size: 24rpx;
			color: #666;
			margin-bottom: 10rpx;
		}
		
		.date-picker {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20rpx;
			background: #fafafa;
			border-radius: 12rpx;
			
			.date-text {
				font-size: 28rpx;
				color: #333;
			}
			
			.date-icon {
				font-size: 24rpx;
			}
		}
	}
	
	.date-separator {
		.separator-line {
			font-size: 24rpx;
			color: #999;
		}
	}
}

.task-list {
	.task-item {
		border: 2rpx solid #f0f0f0;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		
		.task-content {
			padding: 20rpx;
			
			.task-title-input {
				width: 100%;
				font-size: 28rpx;
				border: none;
				margin-bottom: 15rpx;
				padding: 0;
				background: transparent;
			}
			
			.task-desc-input {
				width: 100%;
				min-height: 60rpx;
				font-size: 24rpx;
				border: none;
				margin-bottom: 15rpx;
				padding: 0;
				background: transparent;
				color: #666;
			}
			
			.task-meta {
				display: flex;
				gap: 20rpx;
				
				.task-priority, .task-deadline {
					flex: 1;
					padding: 10rpx 15rpx;
					background: #f8f8f8;
					border-radius: 8rpx;
					
					.priority-label, .deadline-label {
						font-size: 22rpx;
						color: #666;
					}
				}
			}
		}
		
		.task-actions {
			padding: 15rpx 20rpx;
			background: #fafafa;
			text-align: right;
			
			.delete-task-btn {
				font-size: 24rpx;
				color: #ff3b30;
			}
		}
	}
}

.empty-tasks {
	text-align: center;
	padding: 60rpx 0;
	
	.empty-text {
		font-size: 26rpx;
		color: #999;
	}
}

.bottom-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	padding: 20rpx;
	background: white;
	border-top: 1rpx solid #f0f0f0;
	
	.cancel-btn, .save-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 12rpx;
		font-size: 30rpx;
		border: none;
		
		&.cancel-btn {
			background: #f5f5f5;
			color: #666;
			margin-right: 15rpx;
		}
		
		&.save-btn {
			background: #007aff;
			color: white;
			margin-left: 15rpx;
		}
	}
}
</style>