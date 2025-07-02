const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const bcrypt = require('bcryptjs')

const User = sequelize.define('User', {
  phone_number: {
    type: DataTypes.STRING(11),
    primaryKey: true,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [11, 11],
      is: /^1[3-9]\d{9}$/
    },
    comment: '手机号（主键）'
  },
  student_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    validate: {
      isValidStudentId(value) {
        if (value && !/^(\d{8}|S\d{9})$/.test(value)) {
          throw new Error('学号格式不正确')
        }
      }
    },
    comment: '学号（可空）'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密）'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50]
    },
    comment: '真实姓名'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称'
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱地址'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '个人简介'
  },
  gender: {
    type: DataTypes.ENUM('M', 'F', 'U'),
    defaultValue: 'U',
    comment: '性别：M-男，F-女，U-未知'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
    comment: '用户角色'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned', 'deleted'),
    defaultValue: 'active',
    comment: '用户状态'
  },
  post_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '发帖数'
  },
  resource_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '资源数'
  },
  follower_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '粉丝数'
  },
  following_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '关注数'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['student_id']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12)
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 12)
      }
    }
  }
})

// 实例方法
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

User.prototype.toSafeJSON = function() {
  const values = { ...this.dataValues }
  delete values.password
  return values
}

module.exports = User