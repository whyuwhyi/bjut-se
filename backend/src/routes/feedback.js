const express = require('express')
const router = express.Router()
const FeedbackController = require('../controllers/FeedbackController')
const { auth } = require('../middleware/auth')

// 提交反馈
router.post('/', auth, FeedbackController.createFeedback)
// 获取我的反馈
router.get('/my', auth, FeedbackController.getMyFeedback)

module.exports = router 