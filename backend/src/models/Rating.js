const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Rating = sequelize.define('Rating', {
  rating_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '评分记录唯一标识符'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '评分者手机号（外键）'
  },
  resource_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'resources',
      key: 'resource_id'
    },
    comment: '关联资源表'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    comment: '评分（1-5分）'
  },
  review_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '评价文字内容'
  }
}, {
  tableName: 'ratings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_phone']
    },
    {
      fields: ['resource_id']
    },
    {
      unique: true,
      fields: ['user_phone', 'resource_id']
    }
  ]
})

module.exports = Rating