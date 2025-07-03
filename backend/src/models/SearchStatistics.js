const { DataTypes } = require('sequelize')
const { sequelize } = require('./index')

const SearchStatistics = sequelize.define('SearchStatistics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '统计ID'
  },
  search_term: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '搜索关键词'
  },
  search_type: {
    type: DataTypes.ENUM('resource', 'post', 'mixed'),
    allowNull: false,
    comment: '搜索类型'
  },
  search_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '搜索次数'
  },
  result_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '搜索结果数量'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: true,
    comment: '搜索用户（可为空表示游客搜索）'
  },
  search_filters: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '搜索筛选条件'
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应时间（毫秒）'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '首次搜索时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '最后搜索时间'
  }
}, {
  tableName: 'search_statistics',
  timestamps: false, // 使用自定义的 created_at 和 updated_at
  indexes: [
    {
      name: 'idx_search_term',
      fields: ['search_term']
    },
    {
      name: 'idx_search_type',
      fields: ['search_type']
    },
    {
      name: 'idx_search_count',
      fields: ['search_count']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    }
  ],
  comment: '搜索统计表'
})

module.exports = SearchStatistics