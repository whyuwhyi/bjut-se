const express = require('express')
const UserController = require('../controllers/UserController')
const { auth, optionalAuth } = require('../middleware/auth')
const { uploadAvatar, handleUploadError } = require('../middleware/upload')
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validators')

const router = express.Router()

// 公开路由
router.post('/register', validateRegister, UserController.register)
router.post('/login', validateLogin, UserController.login)

// 用户公开信息查看（可选认证，支持未登录访问）
router.get('/:phone/profile', optionalAuth, UserController.getUserProfile)

// 验证码相关路由
router.post('/send-verification-code', UserController.sendVerificationCode);
router.post('/verify-code', UserController.verifyCode);

// 需要认证的路由
router.get('/profile', auth, UserController.getProfile)
router.put('/profile', auth, validateUpdateProfile, UserController.updateProfile)

// 隐私设置
router.put('/privacy-settings', auth, UserController.updatePrivacySettings)

// 头像上传
router.post('/avatar', auth, uploadAvatar, handleUploadError, UserController.uploadAvatar)

// 用户内容管理
router.get('/my-resources', auth, UserController.getUserResources)
router.get('/my-posts', auth, UserController.getUserPosts)
router.get('/my-collections', auth, UserController.getUserCollections)

// 社交功能
router.get('/following', auth, UserController.getUserFollowing)
router.get('/followers', auth, UserController.getUserFollowers)
router.post('/follow/:following_phone', auth, UserController.toggleFollow)

// 用户统计
router.get('/stats', auth, UserController.getUserStats)

module.exports = router