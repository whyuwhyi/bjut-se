const express = require('express')
const CollectionController = require('../controllers/CollectionController')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 收藏路由
router.post('/resources/:resourceId/favorite', auth, CollectionController.toggleCollection)
router.get('/resources/:resourceId/favorite-status', auth, CollectionController.checkCollectionStatus)
router.post('/posts/:resourceId/favorite', auth, CollectionController.toggleCollection)
router.get('/posts/:resourceId/favorite-status', auth, CollectionController.checkCollectionStatus)
router.get('/collections', auth, CollectionController.getUserCollections)
router.delete('/:contentId', auth, CollectionController.removeCollection)


module.exports = router