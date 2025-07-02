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
router.get('/resources', AdminController.getAllResources);
router.get('/resources/pending', AdminController.getPendingResources);
router.post('/resources/:id/review', [
  param('id').isLength({ min: 9, max: 9 }).withMessage('资源ID格式不正确'),
  body('action').isIn(['approve', 'reject']).withMessage('操作类型无效'),
  body('comment').optional().isLength({ max: 500 }).withMessage('审核意见不能超过500字符')
], AdminController.reviewResource);
router.delete('/resources/:id', [
  param('id').isLength({ min: 9, max: 9 }).withMessage('资源ID格式不正确'),
  body('reason').optional().isLength({ max: 500 }).withMessage('删除原因不能超过500字符')
], AdminController.deleteResource);

// 资源举报管理
router.get('/resources/reports', AdminController.getResourceReports);
router.post('/resources/reports/:reportId/handle', [
  param('reportId').isLength({ min: 9, max: 9 }).withMessage('举报ID格式不正确'),
  body('action').isIn(['accept', 'reject']).withMessage('处理动作无效'),
  body('result').isLength({ min: 1, max: 500 }).withMessage('处理结果必须在1-500字符之间')
], AdminController.handleResourceReport);

// 论坛管理
router.get('/posts', AdminController.getAllPosts);
router.put('/posts/:id/status', [
  param('id').isLength({ min: 9, max: 9 }).withMessage('帖子ID格式不正确'),
  body('status').isIn(['active', 'hidden', 'deleted']).withMessage('帖子状态无效'),
  body('reason').optional().isLength({ max: 500 }).withMessage('操作原因不能超过500字符')
], AdminController.updatePostStatus);

// 帖子举报管理
router.get('/posts/reports', AdminController.getPostReports);
router.post('/posts/reports/:reportId/handle', [
  param('reportId').isLength({ min: 9, max: 9 }).withMessage('举报ID格式不正确'),
  body('action').isIn(['hide_post', 'delete_post', 'ignore']).withMessage('处理动作无效'),
  body('result').isLength({ min: 1, max: 500 }).withMessage('处理结果必须在1-500字符之间')
], AdminController.handlePostReport);

// 旧路由兼容性（可能被其他地方使用）
router.get('/posts/reported', AdminController.getReportedPosts);
router.post('/posts/:id/hide', [
  param('id').isLength({ min: 9, max: 9 }).withMessage('帖子ID格式不正确')
], AdminController.hidePost);

// 通知管理
router.get('/notifications', AdminController.getAllNotifications);
router.get('/notifications/stats', AdminController.getNotificationStats);
router.post('/notifications/system', [
  body('title').isLength({ min: 1, max: 200 }).withMessage('标题长度必须在1-200个字符之间'),
  body('content').isLength({ min: 1, max: 2000 }).withMessage('内容长度必须在1-2000个字符之间'),
  body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('优先级无效'),
  body('target_users').optional().isArray().withMessage('目标用户必须是数组格式')
], AdminController.createSystemNotification);
router.delete('/notifications/batch', [
  body('notification_ids').isArray({ min: 1 }).withMessage('通知ID列表不能为空'),
  body('notification_ids.*').isLength({ min: 9, max: 9 }).withMessage('通知ID格式不正确')
], AdminController.deleteNotificationBatch);

// 反馈管理
router.get('/feedbacks', AdminController.getAllFeedbacks);
router.get('/feedbacks/stats', AdminController.getFeedbackStats);
router.put('/feedbacks/:id/status', [
  param('id').isInt().withMessage('反馈ID必须是整数'),
  body('status').isIn(['pending', 'processing', 'resolved', 'closed']).withMessage('反馈状态无效'),
  body('reply').optional().isLength({ max: 1000 }).withMessage('回复内容不能超过1000字符')
], AdminController.updateFeedbackStatus);
router.delete('/feedbacks/batch', [
  body('feedback_ids').isArray({ min: 1 }).withMessage('反馈ID列表不能为空'),
  body('feedback_ids.*').isInt().withMessage('反馈ID必须是整数')
], AdminController.deleteFeedbackBatch);

// 统计数据
router.get('/statistics', AdminController.getStatistics);

module.exports = router;