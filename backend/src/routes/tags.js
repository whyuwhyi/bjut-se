const express = require('express')
const TagController = require('../controllers/TagController')

const router = express.Router()

// 标签路由
router.get('/', TagController.getAllTags)
router.get('/categories', TagController.getTagCategories)
router.get('/search', TagController.searchTags)

module.exports = router