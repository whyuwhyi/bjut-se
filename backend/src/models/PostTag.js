const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PostTag = sequelize.define('PostTag', {
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
    comment: '标签名称，1-50个字符'
  },
  tag_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#007aff',
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    },
    comment: '标签颜色（十六进制）'
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '使用次数统计'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '标签状态'
  }
}, {
  tableName: 'post_tags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tag_name']
    },
    {
      fields: ['usage_count']
    },
    {
      fields: ['status']
    }
  ]
})

module.exports = PostTag