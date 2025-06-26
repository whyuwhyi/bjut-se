const express = require('express')
const userRoutes = require('./users')
const resourceRoutes = require('./resources')
const postRoutes = require('./posts')
const commentRoutes = require('./comments')
const ratingRoutes = require('./ratings')
const tagRoutes = require('./tags')
const categoryRoutes = require('./categories')

const router = express.Router()

// API版本和状态检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 注册各模块路由
router.use('/users', userRoutes)
router.use('/resources', resourceRoutes)
router.use('/posts', postRoutes)
router.use('/tags', tagRoutes)
router.use('/categories', categoryRoutes)
router.use('/', commentRoutes)
router.use('/', ratingRoutes)
// router.use('/activities', activityRoutes)  // 待创建

module.exports = router