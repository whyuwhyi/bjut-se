const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    comment: '9位数字的通知唯一标识符'
  },
  receiver_phone: {
    type: DataTypes.STRING(11),
    allowNull: true,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '接收者手机号（为空表示广播通知，面向全体用户）'
  },
  type: {
    type: DataTypes.ENUM('system', 'study', 'interaction', 'resource', 'announcement', 'follow_post', 'follow_resource', 'comment_reply', 'content_liked', 'content_commented', 'new_follower'),
    allowNull: false,
    comment: '通知类型：system-系统通知，study-学习相关，interaction-互动通知，resource-资源相关，announcement-公告，follow_post-关注用户发布帖子，follow_resource-关注用户发布资源，comment_reply-评论回复，content_liked-内容被收藏，content_commented-内容被评论，new_follower-新关注者'
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
    comment: '优先级'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '通知标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '通知内容'
  },
  action_type: {
    type: DataTypes.ENUM('none', 'navigate', 'external_link'),
    defaultValue: 'none',
    comment: '动作类型：none-无动作，navigate-跳转页面，external_link-外部链接'
  },
  action_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '动作URL（页面路径或外部链接）'
  },
  action_params: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '动作参数（JSON格式）'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已读'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '阅读时间'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间（可选）'
  },
  related_user_phone: {
    type: DataTypes.STRING(11),
    allowNull: true,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '相关用户手机号（如：内容发布者、评论者）'
  },
  related_content_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    comment: '相关内容ID（如：帖子ID、资源ID）'
  },
  related_content_type: {
    type: DataTypes.ENUM('post', 'resource', 'comment'),
    allowNull: true,
    comment: '相关内容类型'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['receiver_phone']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['priority', 'created_at']
    }
  ]
})

module.exports = Notification