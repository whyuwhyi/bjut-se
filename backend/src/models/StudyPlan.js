const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const StudyPlan = sequelize.define('StudyPlan', {
  plan_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的计划唯一标识符'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '用户手机号（外键）'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    },
    comment: '计划标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '计划详细描述'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '开始日期'
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '结束日期'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
    defaultValue: 'active',
    comment: '计划状态'
  },
  progress_percent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '整体进度百分比'
  },
  plan_type: {
    type: DataTypes.STRING(50),
    defaultValue: '自定义计划',
    comment: '计划类型'
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
    comment: '优先级'
  }
}, {
  tableName: 'study_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_phone']
    },
    {
      fields: ['status']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['priority']
    }
  ]
})

module.exports = StudyPlan