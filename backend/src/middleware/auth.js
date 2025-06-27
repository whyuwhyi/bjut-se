const jwt = require('jsonwebtoken')
const { User } = require('../models')
const config = require('../config/app')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      })
    }

    const decoded = jwt.verify(token, config.jwt.secret)
    const user = await User.findByPk(decoded.phone_number)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      })
    }

    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
}

module.exports = {
  authenticateToken: auth,
  auth
}