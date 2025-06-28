const express = require('express')
const CommentController = require('../controllers/CommentController')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 评论路由
router.post('/resources/:resourceId/comments', auth, CommentController.createComment)
router.get('/resources/:resourceId/comments', CommentController.getResourceComments)

module.exports = router