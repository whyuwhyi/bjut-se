const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ResourceTypeRelation = sequelize.define('ResourceTypeRelation', {
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
  type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'resource_types',
      key: 'type_id'
    },
    comment: '关联资源类型表'
  }
}, {
  tableName: 'resource_type_relations',
  timestamps: false,
  indexes: [
    {
      fields: ['resource_id']
    },
    {
      fields: ['type_id']
    },
    {
      unique: true,
      fields: ['resource_id', 'type_id']
    }
  ]
})

module.exports = ResourceTypeRelation