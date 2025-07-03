const express = require('express')
const userRoutes = require('./users')
const resourceRoutes = require('./resources')
const fileRoutes = require('./files')
const postRoutes = require('./posts')
const commentRoutes = require('./comments')
const ratingRoutes = require('./ratings')
const collectionRoutes = require('./collections')
const categoryRoutes = require('./categories')
const studyPlanRoutes = require('./studyPlans')
const notificationRoutes = require('./notifications')
const adminRoutes = require('./admin')
const reportRoutes = require('./reports')
const feedbackRoutes = require('./feedback')
const cacheRoutes = require('./cache')

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
router.use('/files', fileRoutes)
router.use('/posts', postRoutes)
router.use('/categories', categoryRoutes)
router.use('/study-plans', studyPlanRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin', adminRoutes)
router.use('/reports', reportRoutes)
router.use('/cache', cacheRoutes)
router.use('/', commentRoutes)
router.use('/', ratingRoutes)
router.use('/collections', collectionRoutes)
router.use('/feedback', feedbackRoutes)

module.exports = router