const express = require('express')
const router = express.Router()
const PostController = require('../controllers/PostController')
const authMiddleware = require('../middleware/auth')

router.get('/', PostController.getAllPosts)

router.get('/tags', PostController.getAllTags)

router.get('/:id', PostController.getPostById)

router.get('/:id/comments', PostController.getPostComments)

router.post('/', authMiddleware, PostController.createPost)

router.post('/:id/comments', authMiddleware, PostController.createComment)

module.exports = router