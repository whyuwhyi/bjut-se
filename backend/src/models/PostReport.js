const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostReport = sequelize.define('PostReport', {
  report_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    comment: '举报记录ID'
  },
  post_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    comment: '被举报帖子ID'
  },
  reporter_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '举报者手机号'
  },
  reason: {
    type: DataTypes.ENUM('inappropriate', 'spam', 'offensive', 'harassment', 'false_info', 'other'),
    allowNull: false,
    comment: '举报原因'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '详细描述'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '处理状态'
  },
  processed_by: {
    type: DataTypes.STRING(11),
    allowNull: true,
    comment: '处理人手机号'
  },
  process_result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '处理结果说明'
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  }
}, {
  tableName: 'post_reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  comment: '帖子举报表'
});

// 生成举报记录ID的静态方法
PostReport.generateReportId = function() {
  return '7' + Math.random().toString().slice(2, 9).padEnd(8, '0');
};

module.exports = PostReport;