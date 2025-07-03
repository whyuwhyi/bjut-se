const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '用户手机号'
  },
  type: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '反馈类型（bug/feature/ui/performance/content/other）'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '反馈内容'
  },
  contact: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '联系方式（可选）'
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '图片URL数组，JSON字符串'
  },
  status: {
    type: DataTypes.STRING(16),
    defaultValue: 'pending',
    comment: '处理状态（pending/processing/resolved/closed）'
  },
  reply: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '管理员回复内容'
  },
  replied_by: {
    type: DataTypes.STRING(11),
    allowNull: true,
    comment: '回复管理员手机号'
  },
  replied_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '回复时间'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'feedbacks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4'
})

module.exports = Feedback 