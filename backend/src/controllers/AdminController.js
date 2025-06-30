const { User, Resource, Post, Notification } = require('../models');
const { Op } = require('sequelize');

class AdminController {
  // 管理面板数据
  static async getDashboard(req, res) {
    try {
      const stats = {
        users: await User.count(),
        resources: await Resource.count(),
        posts: await Post.count(),
        pendingResources: await Resource.count({ where: { status: 'pending' } }),
        activeUsers: await User.count({ where: { status: 'active' } }),
        publishedResources: await Resource.count({ where: { status: 'published' } })
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: '获取管理面板数据失败'
      });
    }
  }

  // 获取用户列表
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, role, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { phone_number: { [Op.like]: `%${search}%` } }
        ];
      }
      if (role) {
        where.role = role;
      }
      if (status) {
        where.status = status;
      }

      const users = await User.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        attributes: ['phone_number', 'name', 'nickname', 'email', 'role', 'status', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          total: users.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败'
      });
    }
  }

  // 更新用户状态
  static async updateUserStatus(req, res) {
    try {
      const { phone } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'banned'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的用户状态'
        });
      }

      const user = await User.findByPk(phone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 不能修改管理员状态
      if (user.role === 'admin' && req.user.phone_number !== phone) {
        return res.status(403).json({
          success: false,
          message: '不能修改其他管理员的状态'
        });
      }

      await user.update({ status });

      res.json({
        success: true,
        message: '用户状态更新成功'
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: '更新用户状态失败'
      });
    }
  }

  // 获取待审核资源
  static async getPendingResources(req, res) {
    try {
      const resources = await Resource.findAll({
        where: { status: 'pending' },
        include: [{
          model: User,
          as: 'publisher',
          attributes: ['name', 'phone_number']
        }],
        order: [['created_at', 'ASC']]
      });

      res.json({
        success: true,
        data: resources
      });
    } catch (error) {
      console.error('Get pending resources error:', error);
      res.status(500).json({
        success: false,
        message: '获取待审核资源失败'
      });
    }
  }

  // 审核资源
  static async reviewResource(req, res) {
    try {
      const { id } = req.params;
      const { action, comment } = req.body; // action: 'approve' | 'reject'

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: '无效的审核操作'
        });
      }

      const resource = await Resource.findByPk(id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }

      if (resource.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '资源已审核，无法重复审核'
        });
      }

      const status = action === 'approve' ? 'published' : 'rejected';
      
      await resource.update({
        status,
        reviewer_phone: req.user.phone_number,
        review_comment: comment,
        reviewed_at: new Date()
      });

      res.json({
        success: true,
        message: `资源${action === 'approve' ? '审核通过' : '审核拒绝'}`
      });
    } catch (error) {
      console.error('Review resource error:', error);
      res.status(500).json({
        success: false,
        message: '资源审核失败'
      });
    }
  }

  // 发布系统通知
  static async createSystemNotification(req, res) {
    try {
      const { title, content, priority = 'medium', target_users = [] } = req.body;

      // 如果没有指定目标用户，则发送给所有用户
      let receivers = target_users;
      if (receivers.length === 0) {
        const allUsers = await User.findAll({
          attributes: ['phone_number'],
          where: { status: 'active' }
        });
        receivers = allUsers.map(user => user.phone_number);
      }

      // 批量创建通知
      const notifications = receivers.map(phone => ({
        notification_id: `600${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 9),
        receiver_phone: phone,
        sender_phone: null,
        type: 'system',
        priority,
        title,
        content,
        action_type: 'none',
        is_read: false
      }));

      await Notification.bulkCreate(notifications);

      res.json({
        success: true,
        message: '系统通知发布成功',
        data: { sent_count: notifications.length }
      });
    } catch (error) {
      console.error('Create system notification error:', error);
      res.status(500).json({
        success: false,
        message: '发布系统通知失败'
      });
    }
  }

  // 获取统计数据
  static async getStatistics(req, res) {
    try {
      const { type = 'overview', period = '7d' } = req.query;

      // 计算时间范围
      const now = new Date();
      const periodDays = parseInt(period.replace('d', ''));
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const stats = {
        overview: {
          totalUsers: await User.count(),
          activeUsers: await User.count({ where: { status: 'active' } }),
          totalResources: await Resource.count(),
          publishedResources: await Resource.count({ where: { status: 'published' } }),
          totalPosts: await Post.count(),
          activePosts: await Post.count({ where: { status: 'active' } })
        },
        users: {
          newUsers: await User.count({
            where: {
              created_at: {
                [Op.gte]: startDate
              }
            }
          }),
          usersByRole: await User.findAll({
            attributes: ['role', [User.sequelize.fn('COUNT', User.sequelize.col('phone_number')), 'count']],
            group: ['role'],
            raw: true
          })
        },
        content: {
          newResources: await Resource.count({
            where: {
              created_at: {
                [Op.gte]: startDate
              }
            }
          }),
          newPosts: await Post.count({
            where: {
              created_at: {
                [Op.gte]: startDate
              }
            }
          }),
          pendingReviews: await Resource.count({ where: { status: 'pending' } })
        }
      };

      res.json({
        success: true,
        data: stats[type] || stats.overview
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  }

  // 获取举报的帖子
  static async getReportedPosts(req, res) {
    try {
      // 这里可以根据实际需求实现举报逻辑
      // 暂时返回所有帖子作为示例
      const posts = await Post.findAll({
        include: [{
          model: User,
          as: 'author',
          attributes: ['name', 'phone_number']
        }],
        order: [['created_at', 'DESC']],
        limit: 50
      });

      res.json({
        success: true,
        data: posts
      });
    } catch (error) {
      console.error('Get reported posts error:', error);
      res.status(500).json({
        success: false,
        message: '获取举报帖子失败'
      });
    }
  }

  // 隐藏帖子
  static async hidePost(req, res) {
    try {
      const { id } = req.params;

      const post = await Post.findByPk(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        });
      }

      await post.update({ status: 'hidden' });

      res.json({
        success: true,
        message: '帖子已隐藏'
      });
    } catch (error) {
      console.error('Hide post error:', error);
      res.status(500).json({
        success: false,
        message: '隐藏帖子失败'
      });
    }
  }
}

module.exports = AdminController;