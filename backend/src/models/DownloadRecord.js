const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const DownloadRecord = sequelize.define('DownloadRecord', {
  download_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的下载记录唯一标识符'
  },
  user_phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    references: {
      model: 'users',
      key: 'phone_number'
    },
    comment: '下载者手机号（外键）'
  },
  resource_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'resources',
      key: 'resource_id'
    },
    comment: '资源ID（外键）'
  },
  file_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'files',
      key: 'file_id'
    },
    comment: '文件ID（外键）'
  },
  download_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '下载文件大小（字节）'
  },
  download_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '下载耗时（毫秒）'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '下载IP地址（支持IPv6）'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理字符串'
  },
  status: {
    type: DataTypes.ENUM('completed', 'failed', 'cancelled'),
    defaultValue: 'completed',
    comment: '下载状态'
  }
}, {
  tableName: 'download_records',
  timestamps: true,
  createdAt: 'downloaded_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_phone']
    },
    {
      fields: ['resource_id']
    },
    {
      fields: ['downloaded_at']
    }
  ]
})

module.exports = DownloadRecord