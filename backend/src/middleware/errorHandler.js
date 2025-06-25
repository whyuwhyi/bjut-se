const { ValidationError, DatabaseError } = require('sequelize')

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Sequelize 验证错误
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors.map(error => ({
        field: error.path,
        message: error.message
      }))
    })
  }

  // Sequelize 数据库错误
  if (err instanceof DatabaseError) {
    return res.status(500).json({
      success: false,
      message: '数据库操作失败'
    })
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '访问令牌已过期'
    })
  }

  // 404 错误
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: '资源不存在'
    })
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
}

// 404 处理
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
}

module.exports = {
  errorHandler,
  notFound
}