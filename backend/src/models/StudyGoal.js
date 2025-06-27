const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const StudyGoal = sequelize.define('StudyGoal', {
  goal_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的目标唯一标识符'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '用户手机号'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    },
    comment: '目标标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '目标描述'
  },
  target_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: '目标数值'
  },
  current_value: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '当前进度'
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: '次',
    comment: '计量单位'
  },
  goal_type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom'),
    allowNull: false,
    comment: '目标类型'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '截止日期'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused', 'expired'),
    defaultValue: 'active',
    comment: '目标状态'
  }
}, {
  tableName: 'study_goals',
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
      fields: ['goal_type']
    },
    {
      fields: ['deadline']
    }
  ]
})

module.exports = StudyGoal