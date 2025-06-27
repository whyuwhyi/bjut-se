const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const UserLevel = sequelize.define('UserLevel', {
  user_phone: {
    type: DataTypes.STRING(11),
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '用户手机号'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    },
    comment: '用户等级'
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '经验值'
  },
  next_level_exp: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 1
    },
    comment: '下一级所需经验'
  }
}, {
  tableName: 'user_levels',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['level']
    },
    {
      fields: ['experience']
    }
  ]
})

module.exports = UserLevel