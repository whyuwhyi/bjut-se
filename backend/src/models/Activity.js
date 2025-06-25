const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Activity = sequelize.define('Activity', {
  activity_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的活动唯一标识符'
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
  activity_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200]
    },
    comment: '活动名称'
  },
  activity_address: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: '活动地点'
  },
  activity_description: {
    type: DataTypes.STRING(5000),
    allowNull: true,
    comment: '活动详细描述'
  },
  registration_fee: {
    type: DataTypes.DECIMAL(7, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    },
    comment: '报名费用'
  },
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 9999
    },
    comment: '最大参与人数'
  },
  current_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '当前已报名人数'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '活动开始时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '活动结束时间'
  },
  registration_deadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '报名截止时间'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
    defaultValue: 'draft',
    comment: '活动状态'
  }
}, {
  tableName: 'community_activities',
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
      fields: ['start_time']
    }
  ]
})

module.exports = Activity