const express = require('express')
const router = express.Router()
const PostController = require('../controllers/PostController')
const { auth: authMiddleware } = require('../middleware/auth')

router.get('/', PostController.getAllPosts)

// 搜索相关路由
router.get('/search/suggestions', PostController.getSearchSuggestions)
router.get('/search/filter-options', PostController.getFilterOptions)

router.get('/tags', PostController.getAllTags)

router.get('/:id', PostController.getPostById)

router.get('/:id/comments', PostController.getPostComments)

router.post('/', authMiddleware, PostController.createPost)

router.post('/:id/comments', authMiddleware, PostController.createComment)

router.post('/:postId/favorite', authMiddleware, PostController.toggleFavorite)

router.get('/:postId/favorite-status', authMiddleware, PostController.checkFavoriteStatus)

router.delete('/:id', authMiddleware, PostController.deletePost)

module.exports = router