const express = require('express')
const CommentController = require('../controllers/CommentController')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 评论路由
router.post('/resources/:resourceId/comments', auth, CommentController.createComment)
router.get('/resources/:resourceId/comments', CommentController.getResourceComments)
router.post('/comments/:commentId/like', auth, CommentController.likeComment)

module.exports = router