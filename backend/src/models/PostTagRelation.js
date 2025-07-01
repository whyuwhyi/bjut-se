const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PostTagRelation = sequelize.define('PostTagRelation', {
  relation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '关联记录唯一标识符'
  },
  post_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    comment: '关联帖子表'
  },
  tag_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    comment: '关联标签表'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'post_tag_relations',
  timestamps: false,
  charset: 'utf8mb4',
  indexes: [
    {
      unique: true,
      fields: ['post_id', 'tag_id']
    }
  ]
})

module.exports = PostTagRelation