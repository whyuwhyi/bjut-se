
const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VerificationCode = sequelize.define('VerificationCode', {
  phone_number: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: '手机号'
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    comment: '验证码'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '过期时间'
  },
  status: {
    type: DataTypes.ENUM('valid', 'used', 'expired'),
    defaultValue: 'valid',
    comment: '验证码状态'
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
  tableName: 'verification_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  charset: 'utf8mb4',
  collation: 'utf8mb4_0900_ai_ci'
})

module.exports = VerificationCode;