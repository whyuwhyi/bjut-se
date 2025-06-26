const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Category = sequelize.define('Category', {
  category_id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    comment: '分类ID'
  },
  category_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '分类名称'
  },
  category_value: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '分类值（用于API参数）'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '分类描述'
  },
  icon: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '分类图标'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态：active=启用, inactive=禁用'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['status', 'sort_order']
    },
    {
      fields: ['category_value']
    }
  ],
  comment: '资源分类表'
})

module.exports = Category