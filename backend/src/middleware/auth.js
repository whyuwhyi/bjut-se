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

// 可选认证中间件：如果有token则验证，没有token则继续
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      // 没有token时，直接继续，不设置req.user
      return next()
    }

    const decoded = jwt.verify(token, config.jwt.secret)
    const user = await User.findByPk(decoded.phone_number)

    if (user && user.status === 'active') {
      req.user = user
    }
    
    next()
  } catch (error) {
    // token无效时，不返回错误，继续执行，但不设置req.user
    next()
  }
}

module.exports = {
  authenticateToken: auth,
  auth,
  optionalAuth
}