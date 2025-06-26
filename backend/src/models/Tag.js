const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Tag = sequelize.define('Tag', {
  tag_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的标签唯一标识符'
  },
  tag_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    },
    comment: '标签名称'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '标签分类'
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '使用次数'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '标签状态'
  }
}, {
  tableName: 'tags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tag_name']
    },
    {
      fields: ['category']
    },
    {
      fields: ['usage_count']
    }
  ]
})

module.exports = Tag