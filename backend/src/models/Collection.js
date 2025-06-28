const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Collection = sequelize.define('Collection', {
  collection_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的收藏记录唯一标识符'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '收藏者手机号（外键）'
  },
  content_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    comment: '被收藏内容的唯一标识符'
  },
  collection_type: {
    type: DataTypes.ENUM('post', 'resource'),
    allowNull: false,
    comment: '收藏内容类型'
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled'),
    defaultValue: 'active',
    comment: '收藏状态'
  }
}, {
  tableName: 'collections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_phone']
    },
    {
      fields: ['content_id', 'collection_type']
    },
    {
      unique: true,
      fields: ['user_phone', 'content_id', 'collection_type']
    }
  ]
})

module.exports = Collection