const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const UserAchievement = sequelize.define('UserAchievement', {
  achievement_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '成就ID'
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
  achievement_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '成就类型'
  },
  achievement_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '成就名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '成就描述'
  },
  icon: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '成就图标'
  },
  earned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '获得时间'
  }
}, {
  tableName: 'user_achievements',
  timestamps: false,
  indexes: [
    {
      fields: ['user_phone']
    },
    {
      fields: ['achievement_type']
    },
    {
      fields: ['earned_at']
    }
  ]
})

module.exports = UserAchievement