const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const StudyRecord = sequelize.define('StudyRecord', {
  record_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '记录ID'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '用户手机号'
  },
  plan_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    references: {
      model: 'study_plans',
      key: 'plan_id'
    },
    comment: '关联学习计划（可选）'
  },
  task_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    references: {
      model: 'study_tasks',
      key: 'task_id'
    },
    comment: '关联学习任务（可选）'
  },
  resource_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    references: {
      model: 'resources',
      key: 'resource_id'
    },
    comment: '关联资源（可选）'
  },
  post_id: {
    type: DataTypes.STRING(9),
    allowNull: true,
    references: {
      model: 'posts',
      key: 'post_id'
    },
    comment: '关联帖子（可选）'
  },
  activity_type: {
    type: DataTypes.ENUM('resource_view', 'resource_download', 'task_complete', 'plan_create', 'post_view', 'post_create', 'comment_create'),
    allowNull: false,
    comment: '活动类型'
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '学习时长（分钟）'
  },
  experience_gained: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '获得经验值'
  },
  study_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '学习日期'
  }
}, {
  tableName: 'study_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_phone']
    },
    {
      fields: ['study_date']
    },
    {
      fields: ['activity_type']
    },
    {
      fields: ['plan_id']
    }
  ]
})

module.exports = StudyRecord