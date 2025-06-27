const express = require('express')
const ResourceController = require('../controllers/ResourceController')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 公开路由
router.get('/', ResourceController.getResources)
router.get('/:id', ResourceController.getResourceById)

// 需要认证的路由
router.post('/', auth, ResourceController.createResource)
router.post('/:resourceId/favorite', auth, ResourceController.toggleFavorite)
router.post('/:resourceId/submit-review', auth, ResourceController.submitForReview)

// 下载路由
router.get('/:resourceId/files/:fileId/download', auth, ResourceController.downloadResource)

// 管理员路由（需要管理员权限）
router.get('/pending', auth, ResourceController.getPendingResources)
router.post('/:resourceId/review', auth, ResourceController.reviewResource)

module.exports = router