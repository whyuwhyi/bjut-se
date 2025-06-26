const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const File = sequelize.define('File', {
  file_id: {
    type: DataTypes.STRING(9),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [9, 9]
    },
    comment: '9位数字的文件唯一标识符'
  },
  resource_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    references: {
      model: 'resources',
      key: 'resource_id'
    },
    comment: '关联资源表'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    },
    comment: '文件名称'
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '文件大小（字节）'
  },
  file_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '文件类型/MIME类型'
  },
  storage_path: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '文件存储路径'
  },
  storage_method: {
    type: DataTypes.ENUM('local', 'cloud', 'table'),
    allowNull: false,
    defaultValue: 'local',
    comment: '文件存储方式'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: '文件内容（用于文本文件）'
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '下载次数'
  }
}, {
  tableName: 'files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['resource_id']
    }
  ]
})

module.exports = File