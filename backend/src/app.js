const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const config = require('./config/app')
const { sequelize } = require('./models')
const routes = require('./routes')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 压缩中间件
app.use(compression())

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
})
app.use('/api', limiter)

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// API路由
app.use('/api/v1', routes)

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '微信小程序教育资源分享平台API',
    version: '1.0.0',
    documentation: '/api/v1/health'
  })
})

// 404处理
app.use(notFound)

// 错误处理
app.use(errorHandler)

// 数据库连接和服务器启动
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate()
    console.log('数据库连接成功')

    // 同步数据库模型（开发环境）
    if (config.server.env === 'development') {
      await sequelize.sync({ alter: true })
      console.log('数据库模型同步完成')
      console.log('测试数据请通过database/init/02-init-test-data.sql文件初始化')
    }

    // 启动服务器
    const server = app.listen(config.server.port, config.server.host, () => {
      console.log(`服务器运行在 http://${config.server.host}:${config.server.port}`)
      console.log(`环境: ${config.server.env}`)
    })

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，正在关闭服务器...')
      server.close(() => {
        console.log('服务器已关闭')
        sequelize.close()
        process.exit(0)
      })
    })

  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer()
}

module.exports = app