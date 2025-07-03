const express = require('express')
const ResourceController = require('../controllers/ResourceController')
const { auth } = require('../middleware/auth')
const { adminAuth } = require('../middleware/adminAuth')

const router = express.Router()

// 公开路由
router.get('/', auth, ResourceController.getResources)

// 管理员路由（需要管理员权限） - 具体路由必须在参数路由之前
router.get('/pending', auth, adminAuth, ResourceController.getPendingResources)

// 需要认证的路由
router.post('/', auth, ResourceController.createResource)
router.post('/:resourceId/favorite', auth, ResourceController.toggleFavorite)
router.get('/:resourceId/favorite-status', auth, ResourceController.checkFavoriteStatus)
router.post('/:resourceId/submit-review', auth, ResourceController.submitForReview)
router.post('/:resourceId/review', auth, adminAuth, ResourceController.reviewResource)
router.delete('/:id', auth, ResourceController.deleteResource)

// 下载路由 - 参数路由放在最后
router.get('/:resourceId/files/:fileId/download', auth, ResourceController.downloadResource)

// 资源详情路由 - 放在最后避免与其他路由冲突
router.get('/:id', ResourceController.getResourceById)

module.exports = router