const express = require('express')
const RatingController = require('../controllers/RatingController')
const auth = require('../middleware/auth')

const router = express.Router()

// 评分路由
router.post('/resources/:resourceId/rating', auth, RatingController.createOrUpdateRating)
router.get('/resources/:resourceId/ratings', RatingController.getResourceRatings)
router.get('/resources/:resourceId/my-rating', auth, RatingController.getUserRating)

module.exports = router