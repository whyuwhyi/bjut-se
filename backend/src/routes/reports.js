const express = require('express');
const ReportController = require('../controllers/ReportController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 所有举报相关路由都需要登录
router.use(auth);

// 举报资源
router.post('/resources/:resourceId', ReportController.reportResource);

// 举报帖子
router.post('/posts/:postId', ReportController.reportPost);

// 获取我的举报记录
router.get('/my-reports', ReportController.getMyReports);

// 获取举报原因选项
router.get('/reasons', ReportController.getReportReasons);

// 撤销举报
router.delete('/:reportId', ReportController.cancelReport);

module.exports = router;