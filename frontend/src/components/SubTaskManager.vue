<template>
	<view class="subtask-manager">
		<!-- 子任务列表 -->
		<view class="subtask-list" v-if="subtasks.length > 0">
			<view 
				class="subtask-item" 
				:class="{ completed: subtask.completed, overdue: isOverdue(subtask), high: subtask.priority === 'high' }"
				v-for="(subtask, index) in sortedSubtasks" 
				:key="subtask.subtask_id"
			>
				<!-- 拖拽手柄 -->
				<view class="drag-handle" v-if="allowReorder">
					<text class="drag-icon">☰</text>
				</view>
				
				<!-- 完成状态复选框 -->
				<view class="subtask-checkbox" @click="toggleSubtask(subtask)">
					<text class="checkbox-icon" v-if="subtask.completed">✓</text>
				</view>
				
				<!-- 子任务内容 -->
				<view class="subtask-content" @click="editSubtask(subtask)">
					<view class="subtask-header">
						<text class="subtask-title">{{ subtask.title }}</text>
						<view class="subtask-meta">
							<view class="priority-badge" :class="'priority-' + subtask.priority">
								{{ getPriorityText(subtask.priority) }}
							</view>
							<text class="estimated-time" v-if="subtask.estimated_minutes">
								{{ formatEstimatedTime(subtask.estimated_minutes) }}
							</text>
						</view>
					</view>
					
					<text class="subtask-description" v-if="subtask.description">
						{{ subtask.description }}
					</text>
					
					<view class="subtask-footer">
						<text class="deadline-text" v-if="subtask.deadline">
							📅 {{ formatDate(subtask.deadline) }}
							<text class="overdue-text" v-if="isOverdue(subtask)">（已逾期）</text>
						</text>
						<text class="completion-status" v-if="subtask.completed">
							✅ 已完成
						</text>
					</view>
					
					<text class="subtask-notes" v-if="subtask.notes">
						💡 {{ subtask.notes }}
					</text>
				</view>
				
				<!-- 操作按钮 -->
				<view class="subtask-actions" v-if="allowEdit">
					<text class="action-btn edit-btn" @click.stop="editSubtask(subtask)">编辑</text>
					<text class="action-btn delete-btn" @click.stop="deleteSubtask(subtask)">删除</text>
				</view>
			</view>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-subtasks" v-else>
			<text class="empty-icon">📝</text>
			<text class="empty-text">暂无子任务</text>
			<text class="empty-hint">点击下方按钮添加子任务来细化任务管理</text>
		</view>
		
		<!-- 添加按钮 -->
		<view class="add-subtask-btn" @click="addSubtask" v-if="allowAdd">
			<text class="add-icon">+</text>
			<text class="add-text">添加子任务</text>
		</view>
		
		<!-- 统计信息 -->
		<view class="subtask-stats" v-if="subtasks.length > 0 && showStats">
			<view class="stats-row">
				<view class="stat-item">
					<text class="stat-number">{{ completedCount }}</text>
					<text class="stat-label">已完成</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ totalCount }}</text>
					<text class="stat-label">总数</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ progressPercent }}%</text>
					<text class="stat-label">进度</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{ overdueCount }}</text>
					<text class="stat-label">逾期</text>
				</view>
			</view>
			<view class="progress-bar">
				<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
			</view>
		</view>
		
		<!-- 子任务编辑弹窗 -->
		<view class="subtask-edit-mask" v-if="showEditDialog" @click="closeEditDialog">
			<view class="subtask-edit-dialog" @click.stop>
				<view class="dialog-header">
					<text class="dialog-title">{{ editingSubtask.subtask_id ? '编辑子任务' : '新建子任务' }}</text>
					<text class="dialog-close" @click="closeEditDialog">✕</text>
				</view>
				
				<view class="dialog-content">
					<!-- 子任务标题 -->
					<view class="form-group">
						<text class="form-label">标题 *</text>
						<input 
							class="form-input" 
							v-model="editingSubtask.title" 
							placeholder="请输入子任务标题"
							maxlength="200"
						/>
					</view>
					
					<!-- 子任务描述 -->
					<view class="form-group">
						<text class="form-label">描述</text>
						<textarea 
							class="form-textarea" 
							v-model="editingSubtask.description" 
							placeholder="详细描述子任务内容（可选）"
							maxlength="5000"
						></textarea>
					</view>
					
					<!-- 优先级和预计时间 -->
					<view class="form-row">
						<view class="form-group half">
							<text class="form-label">优先级</text>
							<picker :value="editingSubtask.priorityIndex" :range="priorityOptions" range-key="label" @change="onPriorityChange">
								<view class="form-picker">
									<text class="picker-text">{{ priorityOptions[editingSubtask.priorityIndex].label }}</text>
									<text class="picker-arrow">></text>
								</view>
							</picker>
						</view>
						
						<view class="form-group half">
							<text class="form-label">预计时间</text>
							<input 
								class="form-input" 
								type="number" 
								v-model="editingSubtask.estimated_minutes" 
								placeholder="分钟"
							/>
						</view>
					</view>
					
					<!-- 截止日期 -->
					<view class="form-group">
						<text class="form-label">截止日期</text>
						<picker mode="date" :value="editingSubtask.deadline" @change="onDeadlineChange">
							<view class="form-picker">
								<text class="picker-text">{{ editingSubtask.deadline || '选择日期（可选）' }}</text>
								<text class="picker-arrow">📅</text>
							</view>
						</picker>
						<text class="deadline-constraint" v-if="taskTimeRange">
							时间范围：{{ taskTimeRange }}
						</text>
					</view>
					
					<!-- 备注 -->
					<view class="form-group">
						<text class="form-label">备注</text>
						<textarea 
							class="form-textarea" 
							v-model="editingSubtask.notes" 
							placeholder="添加备注信息（可选）"
							maxlength="2000"
						></textarea>
					</view>
				</view>
				
				<view class="dialog-actions">
					<button class="cancel-btn" @click="closeEditDialog">取消</button>
					<button class="save-btn" @click="saveSubtask">保存</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'SubTaskManager',
	props: {
		// 主任务ID
		taskId: {
			type: String,
			required: true
		},
		// 子任务列表
		subtasks: {
			type: Array,
			default: () => []
		},
		// 主任务的时间范围（用于约束子任务截止日期）
		taskTimeRange: {
			type: String,
			default: ''
		},
		// 是否允许添加
		allowAdd: {
			type: Boolean,
			default: true
		},
		// 是否允许编辑
		allowEdit: {
			type: Boolean,
			default: true
		},
		// 是否允许重新排序
		allowReorder: {
			type: Boolean,
			default: true
		},
		// 是否显示统计信息
		showStats: {
			type: Boolean,
			default: true
		}
	},
	
	data() {
		return {
			showEditDialog: false,
			priorityOptions: [
				{ label: '低优先级', value: 'low' },
				{ label: '中优先级', value: 'medium' },
				{ label: '高优先级', value: 'high' }
			],
			editingSubtask: this.getEmptySubtask()
		}
	},
	
	computed: {
		// 按排序顺序和优先级排序的子任务
		sortedSubtasks() {
			return [...this.subtasks].sort((a, b) => {
				// 首先按sort_order排序
				if (a.sort_order !== b.sort_order) {
					return a.sort_order - b.sort_order
				}
				// 然后按优先级排序（高优先级在前）
				const priorityOrder = { high: 3, medium: 2, low: 1 }
				return priorityOrder[b.priority] - priorityOrder[a.priority]
			})
		},
		
		// 统计信息
		totalCount() {
			return this.subtasks.length
		},
		
		completedCount() {
			return this.subtasks.filter(st => st.completed).length
		},
		
		overdueCount() {
			return this.subtasks.filter(st => this.isOverdue(st)).length
		},
		
		progressPercent() {
			if (this.totalCount === 0) return 0
			return Math.round((this.completedCount / this.totalCount) * 100)
		}
	},
	
	methods: {
		// 获取空的子任务对象
		getEmptySubtask() {
			return {
				subtask_id: null,
				title: '',
				description: '',
				priorityIndex: 1, // 默认中优先级
				estimated_minutes: 0,
				deadline: '',
				notes: '',
				completed: false,
				sort_order: 0
			}
		},
		
		// 添加子任务
		addSubtask() {
			this.editingSubtask = this.getEmptySubtask()
			this.showEditDialog = true
		},
		
		// 编辑子任务
		editSubtask(subtask) {
			if (!this.allowEdit) return
			
			const priorityIndex = this.priorityOptions.findIndex(p => p.value === subtask.priority)
			this.editingSubtask = {
				subtask_id: subtask.subtask_id,
				title: subtask.title,
				description: subtask.description || '',
				priorityIndex: priorityIndex !== -1 ? priorityIndex : 1,
				estimated_minutes: subtask.estimated_minutes || 0,
				deadline: subtask.deadline || '',
				notes: subtask.notes || '',
				completed: subtask.completed,
				sort_order: subtask.sort_order
			}
			this.showEditDialog = true
		},
		
		// 切换子任务完成状态
		async toggleSubtask(subtask) {
			try {
				this.$emit('toggle-subtask', subtask)
			} catch (error) {
				console.error('切换子任务状态失败:', error)
				uni.showToast({
					title: '操作失败',
					icon: 'none'
				})
			}
		},
		
		// 删除子任务
		deleteSubtask(subtask) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除子任务「${subtask.title}」吗？`,
				success: (res) => {
					if (res.confirm) {
						this.$emit('delete-subtask', subtask)
					}
				}
			})
		},
		
		// 保存子任务
		async saveSubtask() {
			if (!this.validateSubtask()) {
				return
			}
			
			const subtaskData = {
				title: this.editingSubtask.title.trim(),
				description: this.editingSubtask.description.trim(),
				priority: this.priorityOptions[this.editingSubtask.priorityIndex].value,
				estimated_minutes: parseInt(this.editingSubtask.estimated_minutes) || 0,
				deadline: this.editingSubtask.deadline || null,
				notes: this.editingSubtask.notes.trim()
			}
			
			if (this.editingSubtask.subtask_id) {
				// 编辑模式
				this.$emit('update-subtask', {
					subtask_id: this.editingSubtask.subtask_id,
					...subtaskData
				})
			} else {
				// 新建模式
				this.$emit('create-subtask', subtaskData)
			}
			
			this.closeEditDialog()
		},
		
		// 验证子任务数据
		validateSubtask() {
			if (!this.editingSubtask.title.trim()) {
				uni.showToast({
					title: '请输入子任务标题',
					icon: 'none'
				})
				return false
			}
			
			if (this.editingSubtask.title.length > 200) {
				uni.showToast({
					title: '标题不能超过200个字符',
					icon: 'none'
				})
				return false
			}
			
			if (this.editingSubtask.estimated_minutes < 0 || this.editingSubtask.estimated_minutes > 10080) {
				uni.showToast({
					title: '预计时间应在0-10080分钟之间',
					icon: 'none'
				})
				return false
			}
			
			return true
		},
		
		// 关闭编辑对话框
		closeEditDialog() {
			this.showEditDialog = false
			this.editingSubtask = this.getEmptySubtask()
		},
		
		// 优先级选择器变化
		onPriorityChange(e) {
			this.editingSubtask.priorityIndex = e.detail.value
		},
		
		// 截止日期选择器变化
		onDeadlineChange(e) {
			this.editingSubtask.deadline = e.detail.value
		},
		
		// 检查是否逾期
		isOverdue(subtask) {
			if (!subtask.deadline || subtask.completed) return false
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			return new Date(subtask.deadline) < today
		},
		
		// 获取优先级文本
		getPriorityText(priority) {
			const texts = {
				high: '高',
				medium: '中',
				low: '低'
			}
			return texts[priority] || '中'
		},
		
		// 格式化预计时间
		formatEstimatedTime(minutes) {
			if (!minutes || minutes === 0) return ''
			
			const hours = Math.floor(minutes / 60)
			const mins = minutes % 60
			
			if (hours === 0) return `${mins}分钟`
			if (mins === 0) return `${hours}小时`
			return `${hours}小时${mins}分钟`
		},
		
		// 格式化日期
		formatDate(date) {
			if (!date) return ''
			return new Date(date).toLocaleDateString('zh-CN', {
				month: '2-digit',
				day: '2-digit'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.subtask-manager {
	width: 100%;
}

.subtask-list {
	.subtask-item {
		display: flex;
		align-items: flex-start;
		padding: 20rpx;
		background: white;
		border-radius: 12rpx;
		margin-bottom: 16rpx;
		border: 2rpx solid #f0f0f0;
		transition: all 0.3s ease;
		
		&.completed {
			opacity: 0.7;
			background: #f8f9fa;
			
			.subtask-title {
				text-decoration: line-through;
				color: #999;
			}
		}
		
		&.overdue {
			border-color: #ff3b30;
			background: linear-gradient(to right, #fff5f5, #ffffff);
		}
		
		&.high {
			border-left: 6rpx solid #ff3b30;
		}
	}
}

.drag-handle {
	margin-right: 16rpx;
	padding: 8rpx;
	color: #ccc;
	
	.drag-icon {
		font-size: 24rpx;
	}
}

.subtask-checkbox {
	width: 36rpx;
	height: 36rpx;
	border: 2rpx solid #ddd;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 16rpx;
	flex-shrink: 0;
	background: white;
	transition: all 0.3s ease;
}

.subtask-item.completed .subtask-checkbox {
	background-color: #34c759;
	border-color: #34c759;
}

.checkbox-icon {
	color: white;
	font-size: 20rpx;
	font-weight: bold;
}

.subtask-content {
	flex: 1;
	min-width: 0;
}

.subtask-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 8rpx;
}

.subtask-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	line-height: 1.4;
	flex: 1;
}

.subtask-meta {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-left: 12rpx;
}

.priority-badge {
	padding: 2rpx 8rpx;
	border-radius: 6rpx;
	font-size: 20rpx;
	color: white;
	
	&.priority-high {
		background: #ff3b30;
	}
	
	&.priority-medium {
		background: #ff9500;
	}
	
	&.priority-low {
		background: #34c759;
	}
}

.estimated-time {
	font-size: 20rpx;
	color: #666;
	background: #f0f0f0;
	padding: 2rpx 6rpx;
	border-radius: 4rpx;
}

.subtask-description {
	font-size: 24rpx;
	color: #666;
	line-height: 1.4;
	margin-bottom: 8rpx;
}

.subtask-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}

.deadline-text {
	font-size: 22rpx;
	color: #999;
	
	.overdue-text {
		color: #ff3b30;
		font-weight: bold;
	}
}

.completion-status {
	font-size: 22rpx;
	color: #34c759;
}

.subtask-notes {
	font-size: 22rpx;
	color: #666;
	background: #f8f9fa;
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	border-left: 4rpx solid #007aff;
}

.subtask-actions {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-left: 12rpx;
}

.action-btn {
	font-size: 20rpx;
	padding: 6rpx 12rpx;
	border-radius: 6rpx;
	text-align: center;
	min-width: 60rpx;
	
	&.edit-btn {
		color: #007aff;
		background: #f0f8ff;
	}
	
	&.delete-btn {
		color: #ff3b30;
		background: #fff0f0;
	}
}

.empty-subtasks {
	text-align: center;
	padding: 80rpx 20rpx;
	
	.empty-icon {
		font-size: 64rpx;
		display: block;
		margin-bottom: 16rpx;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #999;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.empty-hint {
		font-size: 24rpx;
		color: #ccc;
		display: block;
	}
}

.add-subtask-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24rpx;
	background: linear-gradient(135deg, #f0f8ff, #e8f4fd);
	border: 2rpx dashed #007aff;
	border-radius: 12rpx;
	margin-top: 16rpx;
	
	.add-icon {
		font-size: 32rpx;
		color: #007aff;
		margin-right: 8rpx;
	}
	
	.add-text {
		font-size: 28rpx;
		color: #007aff;
	}
}

.subtask-stats {
	background: linear-gradient(135deg, #f8f9fa, #e9ecef);
	border-radius: 12rpx;
	padding: 20rpx;
	margin-top: 20rpx;
	
	.stats-row {
		display: flex;
		justify-content: space-around;
		margin-bottom: 16rpx;
	}
	
	.stat-item {
		text-align: center;
		
		.stat-number {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			color: #007aff;
			margin-bottom: 4rpx;
		}
		
		.stat-label {
			font-size: 22rpx;
			color: #666;
		}
	}
	
	.progress-bar {
		height: 8rpx;
		background: #e0e0e0;
		border-radius: 4rpx;
		overflow: hidden;
		
		.progress-fill {
			height: 100%;
			background: linear-gradient(to right, #007aff, #34c759);
			transition: width 0.3s ease;
		}
	}
}

.subtask-edit-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
}

.subtask-edit-dialog {
	background: white;
	border-radius: 16rpx;
	width: 100%;
	max-width: 600rpx;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.dialog-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.dialog-close {
		font-size: 28rpx;
		color: #666;
		padding: 8rpx;
	}
}

.dialog-content {
	flex: 1;
	padding: 30rpx;
	overflow-y: auto;
}

.form-group {
	margin-bottom: 24rpx;
	
	&.half {
		width: 48%;
	}
	
	&:last-child {
		margin-bottom: 0;
	}
}

.form-row {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
}

.form-label {
	display: block;
	font-size: 26rpx;
	color: #333;
	margin-bottom: 12rpx;
}

.form-input, .form-textarea {
	width: 100%;
	padding: 20rpx;
	font-size: 28rpx;
	border: 2rpx solid #f0f0f0;
	border-radius: 8rpx;
	background: #fafafa;
}

.form-textarea {
	min-height: 100rpx;
	resize: none;
}

.form-picker {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background: #fafafa;
	border: 2rpx solid #f0f0f0;
	border-radius: 8rpx;
	
	.picker-text {
		font-size: 28rpx;
		color: #333;
	}
	
	.picker-arrow {
		font-size: 24rpx;
		color: #999;
	}
}

.deadline-constraint {
	font-size: 22rpx;
	color: #999;
	margin-top: 8rpx;
}

.dialog-actions {
	display: flex;
	padding: 20rpx 30rpx 30rpx;
	gap: 20rpx;
}

.cancel-btn, .save-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 8rpx;
	font-size: 28rpx;
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