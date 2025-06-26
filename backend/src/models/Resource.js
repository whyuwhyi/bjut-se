const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Resource = sequelize.define('Resource', {
  resource_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的资源唯一标识符'
  },
  publisher_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '发布者手机号（外键）'
  },
  resource_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    },
    comment: '资源名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '资源描述'
  },
  collection_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '收藏次数'
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '评论数量'
  },
  rating: {
    type: DataTypes.DECIMAL(4, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 10
    },
    comment: '资源评分'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '浏览次数'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'published', 'rejected', 'archived'),
    defaultValue: 'draft',
    comment: '资源状态：draft-草稿，pending-待审核，published-已发布，rejected-已拒绝，archived-已归档'
  },
  // 审核信息
  reviewer_phone: {
    type: DataTypes.STRING(11),
    allowNull: true,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '审核者手机号（外键）'
  },
  review_comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核意见'
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  // 下载统计
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '下载次数'
  },
  // 分类信息
  category_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    references: {
      model: 'categories',
      key: 'category_id'
    },
    comment: '资源分类ID（外键）'
  }
}, {
  tableName: 'resources',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['publisher_phone']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
})

module.exports = Resource