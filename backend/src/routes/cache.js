const express = require('express')
const CacheController = require('../controllers/CacheController')
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

module.exports = router