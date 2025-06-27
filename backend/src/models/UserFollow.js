const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const UserFollow = sequelize.define('UserFollow', {
  follow_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的关注记录唯一标识符'
  },
  follower_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '关注者手机号（外键）'
  },
  following_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '被关注者手机号（外键）'
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled'),
    defaultValue: 'active',
    comment: '关注状态：active-关注中，cancelled-已取消'
  }
}, {
  tableName: 'user_follows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['follower_phone']
    },
    {
      fields: ['following_phone']
    },
    {
      unique: true,
      fields: ['follower_phone', 'following_phone']
    }
  ]
})

module.exports = UserFollow