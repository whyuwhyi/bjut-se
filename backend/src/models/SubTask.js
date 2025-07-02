const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SubTask = sequelize.define('SubTask', {
  subtask_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '子任务ID'
  },
  task_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'study_tasks',
      key: 'task_id'
    },
    comment: '关联学习任务表'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    },
    comment: '子任务标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 5000] // 限制描述长度
    },
    comment: '详细描述'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已完成'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '排序顺序'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isAfterToday(value) {
        // 只在创建时验证，更新时由中间件处理
        if (value && this.isNewRecord) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (new Date(value) < today) {
            throw new Error('子任务截止日期不能早于今天')
          }
        }
      }
    },
    comment: '截止日期'
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
    validate: {
      isIn: [['high', 'medium', 'low']]
    },
    comment: '优先级：high-高优先级，medium-中优先级，low-低优先级'
  },
  estimated_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10080 // 最大一周时间（7*24*60分钟）
    },
    comment: '预计完成时间(分钟)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000] // 限制备注长度
    },
    comment: '备注'
  }
}, {
  tableName: 'sub_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['task_id']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['deadline']
    },
    {
      fields: ['completed']
    }
  ],
  hooks: {
    // 验证子任务完成状态变更时的时间记录
    beforeUpdate: async (subtask, options) => {
      // 如果完成状态发生变化，记录时间
      if (subtask.changed('completed')) {
        const now = new Date()
        
        if (subtask.completed) {
          // 任务被标记为完成
          subtask.completed_at = now
        } else {
          // 任务被标记为未完成
          subtask.completed_at = null
        }
      }
    },
    
    // 在创建前自动设置排序
    beforeCreate: async (subtask, options) => {
      if (subtask.sort_order === 0 || subtask.sort_order === null) {
        // 自动设置为该任务下子任务的最大排序 + 1
        const maxOrder = await SubTask.max('sort_order', {
          where: { task_id: subtask.task_id }
        })
        subtask.sort_order = (maxOrder || 0) + 1
      }
    }
  }
})

// 实例方法：检查是否过期
SubTask.prototype.isOverdue = function() {
  if (!this.deadline || this.completed) {
    return false
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(this.deadline) < today
}

// 实例方法：获取优先级权重
SubTask.prototype.getPriorityWeight = function() {
  const weights = {
    high: 3,
    medium: 2,
    low: 1
  }
  return weights[this.priority] || 1
}

// 实例方法：格式化估算时间
SubTask.prototype.getFormattedEstimatedTime = function() {
  if (!this.estimated_minutes || this.estimated_minutes === 0) {
    return '未设置'
  }
  
  const hours = Math.floor(this.estimated_minutes / 60)
  const minutes = this.estimated_minutes % 60
  
  if (hours === 0) {
    return `${minutes}分钟`
  } else if (minutes === 0) {
    return `${hours}小时`
  } else {
    return `${hours}小时${minutes}分钟`
  }
}

// 实例方法：获取剩余天数
SubTask.prototype.getRemainingDays = function() {
  if (!this.deadline) {
    return null
  }
  
  const today = new Date()
  const deadline = new Date(this.deadline)
  const diffTime = deadline - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// 类方法：获取任务的子任务统计
SubTask.getTaskStats = async function(taskId) {
  const subtasks = await this.findAll({
    where: { task_id: taskId }
  })
  
  const total = subtasks.length
  const completed = subtasks.filter(st => st.completed).length
  const pending = total - completed
  
  // 按优先级统计
  const highPriority = subtasks.filter(st => st.priority === 'high').length
  const mediumPriority = subtasks.filter(st => st.priority === 'medium').length
  const lowPriority = subtasks.filter(st => st.priority === 'low').length
  
  // 计算加权进度
  let totalWeight = 0
  let completedWeight = 0
  
  subtasks.forEach(st => {
    const weight = st.getPriorityWeight()
    totalWeight += weight
    if (st.completed) {
      completedWeight += weight
    }
  })
  
  const weightedProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
  
  // 时间统计
  const totalEstimatedMinutes = subtasks.reduce((sum, st) => sum + (st.estimated_minutes || 0), 0)
  const completedEstimatedMinutes = subtasks
    .filter(st => st.completed)
    .reduce((sum, st) => sum + (st.estimated_minutes || 0), 0)
  
  // 过期任务统计
  const overdue = subtasks.filter(st => st.isOverdue()).length
  
  return {
    total,
    completed,
    pending,
    overdue,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    weightedProgress,
    priority: {
      high: highPriority,
      medium: mediumPriority,
      low: lowPriority
    },
    estimatedTime: {
      total: totalEstimatedMinutes,
      completed: completedEstimatedMinutes,
      remaining: totalEstimatedMinutes - completedEstimatedMinutes
    }
  }
}

// 类方法：批量更新排序
SubTask.updateOrder = async function(taskId, subtasksOrder) {
  const transaction = await sequelize.transaction()
  
  try {
    const updatePromises = subtasksOrder.map(({ subtask_id, sort_order }) =>
      this.update(
        { sort_order },
        { 
          where: { subtask_id, task_id: taskId },
          transaction 
        }
      )
    )
    
    await Promise.all(updatePromises)
    await transaction.commit()
    
    return true
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

module.exports = SubTask