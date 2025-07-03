const express = require('express')
const CollectionController = require('../controllers/CollectionController')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 收藏管理路由 - 挂载在 /collections 下
router.delete('/:contentId', auth, CollectionController.removeCollection)

module.exports = router