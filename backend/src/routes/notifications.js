const express = require('express')
const NotificationController = require('../controllers/NotificationController')
const { auth } = require('../middleware/auth')
const { body } = require('express-validator')

const router = express.Router()

// 用户通知相关路由（需要认证）
router.get('/', auth, NotificationController.getNotifications)
router.get('/unread-count', auth, NotificationController.getUnreadCount)
router.get('/:id', auth, NotificationController.getNotificationDetail)
router.patch('/:id/read', auth, NotificationController.markAsRead)
router.patch('/mark-all-read', auth, NotificationController.markAllAsRead)
router.delete('/:id', auth, NotificationController.deleteNotification)
router.delete('/expired/clean', auth, NotificationController.cleanExpiredNotifications)

// 管理员系统通知路由（预留，需要管理员权限）
// TODO: 添加管理员权限验证中间件
const validateCreateNotification = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  body('content')
    .isLength({ min: 1, max: 5000 })
    .withMessage('内容长度必须在1-5000个字符之间'),
  body('type')
    .optional()
    .isIn(['system', 'study', 'interaction', 'resource', 'announcement'])
    .withMessage('通知类型无效'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('优先级无效'),
  body('action_type')
    .optional()
    .isIn(['none', 'navigate', 'external_link'])
    .withMessage('动作类型无效'),
  body('action_url')
    .optional()
    .isLength({ max: 500 })
    .withMessage('动作URL长度不能超过500个字符'),
  body('target_users')
    .optional()
    .isArray()
    .withMessage('目标用户必须是数组格式'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('过期时间格式无效')
]

router.post('/admin/system', auth, validateCreateNotification, NotificationController.createSystemNotification)

module.exports = router