const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ResourceType = sequelize.define('ResourceType', {
  type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '资源类型ID'
  },
  type_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 50]
    },
    comment: '资源类型名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '类型描述'
  }
}, {
  tableName: 'resource_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

module.exports = ResourceType