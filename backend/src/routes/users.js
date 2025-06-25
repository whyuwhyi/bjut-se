const express = require('express')
const UserController = require('../controllers/UserController')
const auth = require('../middleware/auth')
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validators')

const router = express.Router()

// 公开路由
router.post('/register', validateRegister, UserController.register)
router.post('/login', validateLogin, UserController.login)

// 需要认证的路由
router.get('/profile', auth, UserController.getProfile)
router.put('/profile', auth, validateUpdateProfile, UserController.updateProfile)

module.exports = router