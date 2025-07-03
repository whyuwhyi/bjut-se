const { DataTypes } = require('sequelize')
const { sequelize } = require('./index')

const HotKeywords = sequelize.define('HotKeywords', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '关键词ID'
  },
  keyword: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: '关键词'
  },
  search_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '搜索次数'
  },
  result_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '平均结果数量'
  },
  category: {
    type: DataTypes.ENUM('resource', 'post', 'mixed'),
    defaultValue: 'mixed',
    comment: '主要搜索类别'
  },
  last_searched_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '最后搜索时间'
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
  tableName: 'hot_keywords',
  timestamps: false, // 使用自定义的 created_at 和 updated_at
  indexes: [
    {
      name: 'idx_search_count',
      fields: [['search_count', 'DESC']]
    },
    {
      name: 'idx_last_searched',
      fields: [['last_searched_at', 'DESC']]
    },
    {
      name: 'idx_category',
      fields: ['category']
    }
  ],
  comment: '热门搜索关键词表'
})

module.exports = HotKeywords