const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PostTag = sequelize.define('PostTag', {
  tag_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    comment: '9位数字的标签唯一标识符'
  },
  tag_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '标签名称，1-50个字符'
  },
  tag_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#007aff',
    comment: '标签颜色（十六进制）'
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数统计'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '标签状态'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'post_tags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_0900_ai_ci'
})

module.exports = PostTag