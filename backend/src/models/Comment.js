const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const User = require('./User')

const Comment = sequelize.define('Comment', {
  comment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '评论唯一标识符'
  },
  author_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '评论作者手机号（外键到用户表）'
  },
  post_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    references: {
      model: 'posts',
      key: 'post_id'
    },
    comment: '关联帖子ID（如果是帖子评论）'
  },
  resource_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    references: {
      model: 'resources',
      key: 'resource_id'
    },
    comment: '关联资源ID（如果是资源评论）'
  },
  parent_comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'comment_id'
    },
    comment: '父评论ID（用于回复）'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  },
  status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted'),
    defaultValue: 'active',
    comment: '评论状态'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['author_phone']
    },
    {
      fields: ['post_id']
    },
    {
      fields: ['resource_id']
    },
    {
      fields: ['parent_comment_id']
    }
  ]
})

module.exports = Comment