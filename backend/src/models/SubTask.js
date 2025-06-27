const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SubTask = sequelize.define('SubTask', {
  subtask_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '子任务ID'
  },
  task_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'study_tasks',
      key: 'task_id'
    },
    comment: '关联学习任务表'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    },
    comment: '子任务标题'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已完成'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  }
}, {
  tableName: 'sub_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['task_id']
    },
    {
      fields: ['sort_order']
    }
  ]
})

module.exports = SubTask