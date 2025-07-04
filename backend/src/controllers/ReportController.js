const { ResourceReport, PostReport, Resource, Post, User, Notification, Comment } = require('../models');

class ReportController {
  // 举报资源
  static async reportResource(req, res) {
    try {
      const { resourceId } = req.params;
      const { reason, description } = req.body;
      const reporterPhone = req.user.phone_number;

      // 验证举报原因
      const validReasons = ['inappropriate', 'copyright', 'spam', 'offensive', 'other'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: '无效的举报原因'
        });
      }

      // 检查资源是否存在
      const resource = await Resource.findOne({ where: { resource_id: resourceId } });
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }

      // 检查是否重复举报
      const existingReport = await ResourceReport.findOne({
        where: {
          resource_id: resourceId,
          reporter_phone: reporterPhone,
          status: 'pending'
        }
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: '您已经举报过此资源，请勿重复举报'
        });
      }

      // 创建举报记录
      const reportId = ResourceReport.generateReportId();
      const report = await ResourceReport.create({
        report_id: reportId,
        resource_id: resourceId,
        reporter_phone: reporterPhone,
        reason,
        description,
        status: 'pending'
      });

      // 更新资源的举报次数
      await Resource.increment('report_count', { where: { resource_id: resourceId } });

      res.json({
        success: true,
        message: '举报提交成功，我们会尽快处理',
        data: { report_id: reportId }
      });
    } catch (error) {
      console.error('Report resource error:', error);
      res.status(500).json({
        success: false,
        message: '提交举报失败'
      });
    }
  }

  // 举报帖子
  static async reportPost(req, res) {
    try {
      const { postId } = req.params;
      const { reason, description } = req.body;
      const reporterPhone = req.user.phone_number;

      // 验证举报原因
      const validReasons = ['inappropriate', 'spam', 'offensive', 'harassment', 'false_info', 'other'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: '无效的举报原因'
        });
      }

      // 检查帖子是否存在
      const post = await Post.findOne({ where: { post_id: postId } });
      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        });
      }

      // 检查是否重复举报
      const existingReport = await PostReport.findOne({
        where: {
          post_id: postId,
          reporter_phone: reporterPhone,
          status: 'pending'
        }
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: '您已经举报过此帖子，请勿重复举报'
        });
      }

      // 创建举报记录
      const reportId = PostReport.generateReportId();
      const report = await PostReport.create({
        report_id: reportId,
        post_id: postId,
        reporter_phone: reporterPhone,
        reason,
        description,
        status: 'pending'
      });

      // 更新帖子的举报次数
      await Post.increment('report_count', { where: { post_id: postId } });

      res.json({
        success: true,
        message: '举报提交成功，我们会尽快处理',
        data: { report_id: reportId }
      });
    } catch (error) {
      console.error('Report post error:', error);
      res.status(500).json({
        success: false,
        message: '提交举报失败'
      });
    }
  }

  // 举报评论（简化实现，不需要新数据库表）
  static async reportComment(req, res) {
    try {
      const { commentId } = req.params;
      const { reason, description } = req.body;
      const reporterPhone = req.user.phone_number;

      // 验证举报原因
      const validReasons = ['inappropriate', 'spam', 'offensive', 'harassment', 'other'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: '无效的举报原因'
        });
      }

      // 检查评论是否存在
      const comment = await Comment.findOne({ where: { comment_id: commentId } });
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '评论不存在'
        });
      }

      // 简化处理：直接返回成功，可以在后台记录日志
      console.log(`评论举报: 用户${reporterPhone}举报评论${commentId}，原因：${reason}，描述：${description}`);

      res.json({
        success: true,
        message: '举报提交成功，我们会尽快处理',
        data: { comment_id: commentId }
      });
    } catch (error) {
      console.error('Report comment error:', error);
      res.status(500).json({
        success: false,
        message: '提交举报失败'
      });
    }
  }

  // 获取我的举报记录
  static async getMyReports(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const offset = (page - 1) * limit;
      const reporterPhone = req.user.phone_number;

      let reports = [];
      let total = 0;

      if (type === 'resource' || !type) {
        // 获取资源举报记录
        const resourceReports = await ResourceReport.findAndCountAll({
          where: { reporter_phone: reporterPhone },
          include: [{
            model: Resource,
            as: 'resource',
            attributes: ['resource_id', 'resource_name', 'status'],
            include: [{
              model: User,
              as: 'publisher',
              attributes: ['name', 'phone_number']
            }]
          }],
          limit: type === 'resource' ? parseInt(limit) : 10,
          offset: type === 'resource' ? offset : 0,
          order: [['created_at', 'DESC']]
        });

        reports = reports.concat(resourceReports.rows.map(report => ({
          ...report.toJSON(),
          report_type: 'resource'
        })));
        total += resourceReports.count;
      }

      if (type === 'post' || !type) {
        // 获取帖子举报记录
        const postReports = await PostReport.findAndCountAll({
          where: { reporter_phone: reporterPhone },
          include: [{
            model: Post,
            as: 'post',
            attributes: ['post_id', 'title', 'status'],
            include: [{
              model: User,
              as: 'author',
              attributes: ['name', 'phone_number']
            }]
          }],
          limit: type === 'post' ? parseInt(limit) : 10,
          offset: type === 'post' ? offset : 0,
          order: [['created_at', 'DESC']]
        });

        reports = reports.concat(postReports.rows.map(report => ({
          ...report.toJSON(),
          report_type: 'post'
        })));
        total += postReports.count;
      }

      // 如果没有指定类型，按时间排序
      if (!type) {
        reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        reports = reports.slice(offset, offset + parseInt(limit));
      }

      res.json({
        success: true,
        data: {
          reports,
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get my reports error:', error);
      res.status(500).json({
        success: false,
        message: '获取举报记录失败'
      });
    }
  }

  // 获取举报原因选项
  static async getReportReasons(req, res) {
    try {
      const { type } = req.query; // 'resource' | 'post'

      const resourceReasons = [
        { value: 'inappropriate', label: '内容不当' },
        { value: 'copyright', label: '版权问题' },
        { value: 'spam', label: '垃圾信息' },
        { value: 'offensive', label: '冒犯性内容' },
        { value: 'other', label: '其他' }
      ];

      const postReasons = [
        { value: 'inappropriate', label: '内容不当' },
        { value: 'spam', label: '垃圾信息' },
        { value: 'offensive', label: '冒犯性内容' },
        { value: 'harassment', label: '骚扰他人' },
        { value: 'false_info', label: '虚假信息' },
        { value: 'other', label: '其他' }
      ];

      const reasons = type === 'post' ? postReasons : resourceReasons;

      res.json({
        success: true,
        data: reasons
      });
    } catch (error) {
      console.error('Get report reasons error:', error);
      res.status(500).json({
        success: false,
        message: '获取举报原因失败'
      });
    }
  }

  // 撤销举报（仅限pending状态）
  static async cancelReport(req, res) {
    try {
      const { reportId } = req.params;
      const { type } = req.query; // 'resource' | 'post'
      const reporterPhone = req.user.phone_number;

      let report;
      let Model = type === 'post' ? PostReport : ResourceReport;

      report = await Model.findOne({
        where: {
          report_id: reportId,
          reporter_phone: reporterPhone,
          status: 'pending'
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在或无法撤销'
        });
      }

      // 更新状态为已撤销
      await report.update({
        status: 'rejected',
        process_result: '用户主动撤销'
      });

      // 减少对应内容的举报次数
      if (type === 'post') {
        const post = await Post.findByPk(report.post_id);
        if (post && post.report_count > 0) {
          await post.decrement('report_count');
        }
      } else {
        const resource = await Resource.findByPk(report.resource_id);
        if (resource && resource.report_count > 0) {
          await resource.decrement('report_count');
        }
      }

      res.json({
        success: true,
        message: '举报已撤销'
      });
    } catch (error) {
      console.error('Cancel report error:', error);
      res.status(500).json({
        success: false,
        message: '撤销举报失败'
      });
    }
  }
}

module.exports = ReportController;