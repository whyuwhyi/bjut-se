const express = require('express');
const AdminController = require('../controllers/AdminController');
const { auth } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { body, param } = require('express-validator');

const router = express.Router();

// 所有管理员路由都需要先登录再验证管理员权限
router.use(auth);
router.use(adminAuth);

// 管理面板
router.get('/dashboard', AdminController.getDashboard);

// 用户管理
router.get('/users', AdminController.getUsers);
router.get('/users/:phone', [
  param('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确')
], AdminController.getUserDetail);
router.put('/users/:phone/status', [
  param('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('status').isIn(['active', 'inactive', 'banned']).withMessage('用户状态无效')
], AdminController.updateUserStatus);
router.put('/users/:phone/role', [
  param('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('role').isIn(['user', 'admin']).withMessage('用户角色无效')
], AdminController.updateUserRole);
router.post('/users/:phone/reset-password', [
  param('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('newPassword').isLength({ min: 6, max: 32 }).withMessage('密码长度必须在6-32个字符之间')
], AdminController.resetUserPassword);
router.delete('/users/:phone', [
  param('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确')
], AdminController.deleteUser);

// 资源管理
router.get('/resources/pending', AdminController.getPendingResources);
router.post('/resources/:id/review', [
  param('id').isLength({ min: 9, max: 9 }).withMessage('资源ID格式不正确'),
  body('action').isIn(['approve', 'reject']).withMessage('操作类型无效'),
  body('comment').optional().isLength({ max: 500 }).withMessage('审核意见不能超过500字符')
], AdminController.reviewResource);

// 帖子管理
router.get('/posts/reported', AdminController.getReportedPosts);
router.post('/posts/:id/hide', [
  param('id').isLength({ min: 9, max: 9 }).withMessage('帖子ID格式不正确')
], AdminController.hidePost);

// 通知管理
router.post('/notifications/system', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('标题长度必须在1-200个字符之间'),
  body('content').isLength({ min: 1, max: 2000 }).withMessage('内容长度必须在1-2000个字符之间'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('优先级无效'),
  body('target_users').optional().isArray().withMessage('目标用户必须是数组格式')
], AdminController.createSystemNotification);

// 统计数据
router.get('/statistics', AdminController.getStatistics);

module.exports = router;