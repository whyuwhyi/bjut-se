const { User } = require('../models')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const config = require('../config/app')

class UserController {
  // 用户注册
  async register(req, res) {
    try {
      // 验证输入
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: errors.array()
        })
      }

      const { phone_number, password, name, student_id, email } = req.body

      // 检查用户是否已存在
      const existingUser = await User.findByPk(phone_number)
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '用户已存在'
        })
      }

      // 检查学号是否已被使用
      if (student_id) {
        const existingStudent = await User.findOne({
          where: { student_id }
        })
        if (existingStudent) {
          return res.status(409).json({
            success: false,
            message: '学号已被使用'
          })
        }
      }

      // 创建用户
      const user = await User.create({
        phone_number,
        password,
        name,
        student_id,
        email
      })

      // 生成JWT token
      const token = jwt.sign(
        { phone_number: user.phone_number },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: user.toSafeJSON(),
          token
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 用户登录
  async login(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: errors.array()
        })
      }

      const { phone_number, password } = req.body

      // 查找用户
      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '密码错误'
        })
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '账户已被禁用'
        })
      }

      // 生成JWT token
      const token = jwt.sign(
        { phone_number: user.phone_number },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: user.toSafeJSON(),
          token
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 获取用户信息
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeJSON()
        }
      })
    } catch (error) {
      console.error('Get profile error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 更新用户信息
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: errors.array()
        })
      }

      const { name, nickname, email, student_id } = req.body
      const phone_number = req.user.phone_number

      const user = await User.findByPk(phone_number)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        })
      }

      // 检查学号是否已被其他用户使用
      if (student_id && student_id !== user.student_id) {
        const existingStudent = await User.findOne({
          where: { student_id }
        })
        if (existingStudent) {
          return res.status(409).json({
            success: false,
            message: '学号已被使用'
          })
        }
      }

      // 更新用户信息
      await user.update({
        name: name || user.name,
        nickname: nickname || user.nickname,
        email: email || user.email,
        student_id: student_id || user.student_id
      })

      res.json({
        success: true,
        message: '更新成功',
        data: {
          user: user.toSafeJSON()
        }
      })
    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }
}

module.exports = new UserController()