const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const StudyTask = sequelize.define('StudyTask', {
  task_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的任务唯一标识符'
  },
  plan_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'study_plans',
      key: 'plan_id'
    },
    comment: '关联学习计划表'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    },
    comment: '任务标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '任务描述'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '截止日期'
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
    comment: '任务优先级'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
    comment: '任务状态'
  },
  estimated_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    },
    comment: '预估学习时长（小时）'
  },
  actual_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '实际学习时长（小时）'
  }
}, {
  tableName: 'study_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['plan_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['deadline']
    }
  ]
})

module.exports = StudyTask