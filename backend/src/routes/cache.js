const express = require('express')
const CacheController = require('../controllers/CacheController')
const cacheCleanupService = require('../services/CacheCleanupService')
const redisSearchCache = require('../utils/RedisSearchCache')
const { auth } = require('../middleware/auth')
const { adminAuth } = require('../middleware/adminAuth')

const router = express.Router()

// 所有缓存管理接口都需要管理员权限
router.use(auth, adminAuth)

// 获取缓存统计信息
router.get('/stats', CacheController.getStats)

// 清除指定类型的缓存
router.delete('/clear/:type', CacheController.clearCache)

// 预热缓存
router.post('/warmup', CacheController.warmupCache)

// 手动失效缓存
router.post('/invalidate', CacheController.invalidateCache)

// 获取缓存清理服务状态
router.get('/cleanup/status', (req, res) => {
  try {
    const status = cacheCleanupService.getStatus()
    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取缓存清理状态失败',
      error: error.message
    })
  }
})

// 手动触发缓存清理
router.post('/cleanup/manual', async (req, res) => {
  try {
    await cacheCleanupService.manualCleanup()
    res.json({
      success: true,
      message: '手动缓存清理完成'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '手动缓存清理失败',
      error: error.message
    })
  }
})

// 清理所有搜索缓存
router.post('/cleanup/all', async (req, res) => {
  try {
    await cacheCleanupService.clearAllSearchCache()
    res.json({
      success: true,
      message: '已清理所有搜索缓存'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清理所有搜索缓存失败',
      error: error.message
    })
  }
})

module.exports = router