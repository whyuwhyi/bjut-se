const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const NotificationRead = sequelize.define('NotificationRead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  notification_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'notifications',
      key: 'notification_id'
    },
    comment: '通知ID'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '阅读时间'
  }
}, {
  tableName: 'notification_reads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_phone', 'notification_id'],
      name: 'unique_user_notification'
    },
    {
      fields: ['user_phone'],
      name: 'idx_user_phone'
    },
    {
      fields: ['notification_id'],
      name: 'idx_notification_id'
    }
  ]
})

module.exports = NotificationRead