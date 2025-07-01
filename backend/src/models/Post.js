const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const User = require('./User')

const Post = sequelize.define('Post', {
  post_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    comment: '9位数字的帖子唯一标识符'
  },
  author_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '作者手机号（外键到用户表）'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '帖子标题，最多200个字符'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '帖子内容（支持Markdown格式）'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览次数'
  },
  collection_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '收藏次数'
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评论数量'
  },
  status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted'),
    defaultValue: 'active',
    comment: '帖子状态'
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
  tableName: 'posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4'
})

module.exports = Post