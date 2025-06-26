const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ResourceTag = sequelize.define('ResourceTag', {
  relation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '关联记录唯一标识符'
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
  tag_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'tags',
      key: 'tag_id'
    },
    comment: '关联标签表'
  }
}, {
  tableName: 'resource_tags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['resource_id']
    },
    {
      fields: ['tag_id']
    },
    {
      unique: true,
      fields: ['resource_id', 'tag_id']
    }
  ]
})

module.exports = ResourceTag