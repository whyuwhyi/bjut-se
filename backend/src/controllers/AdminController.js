const { User, Resource, Post, Notification, Comment, Collection, UserFollow, ResourceReport, PostReport, Feedback } = require('../models');
const { Op } = require('sequelize');

class AdminController {
  // 管理面板数据
  static async getDashboard(req, res) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      
      const stats = {
        // 基础统计
        users: await User.count(),
        resources: await Resource.count(),
        posts: await Post.count(),
        pendingResources: await Resource.count({ where: { status: 'pending' } }),
        activeUsers: await User.count({ where: { status: 'active' } }),
        publishedResources: await Resource.count({ where: { status: 'published' } }),
        
        // 通知统计
        totalNotifications: await Notification.count(),
        todayNotifications: await Notification.count({
          where: {
            created_at: {
              [Op.gte]: today
            }
          }
        }),
        weekNotifications: await Notification.count({
          where: {
            created_at: {
              [Op.gte]: thisWeekStart
            }
          }
        }),
        unreadNotifications: await Notification.count({ where: { is_read: false } }),
        
        // 反馈统计
        totalFeedbacks: await Feedback.count(),
        pendingFeedbacks: await Feedback.count({ where: { status: 'pending' } }),
        processingFeedbacks: await Feedback.count({ where: { status: 'processing' } }),
        resolvedFeedbacks: await Feedback.count({ where: { status: 'resolved' } }),
        todayFeedbacks: await Feedback.count({
          where: {
            created_at: {
              [Op.gte]: today
            }
          }
        }),
        
        // 其他统计
        totalComments: await Comment.count(),
        totalCollections: await Collection.count()
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

      // 不能修改自己的状态
      if (req.user.phone_number === phone) {
        return res.status(403).json({
          success: false,
          message: '不能修改自己的状态'
        });
      }

      // 不能修改其他管理员的状态
      if (user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: '不能修改管理员的状态'
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

  // 删除用户
  static async deleteUser(req, res) {
    try {
      const { phone } = req.params;

      const user = await User.findByPk(phone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 不能删除管理员账户
      if (user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: '不能删除管理员账户'
        });
      }

      // 不能删除自己
      if (req.user.phone_number === phone) {
        return res.status(403).json({
          success: false,
          message: '不能删除自己的账户'
        });
      }

      // 记录删除操作
      console.log(`Admin ${req.user.phone_number} permanently deleted user ${phone} (${user.name})`);

      // 开始级联删除用户相关的所有数据
      console.log(`Starting cascade deletion for user ${phone}...`);

      // 1. 删除用户的资源
      const resources = await Resource.findAll({ where: { publisher_phone: phone } });
      for (const resource of resources) {
        await resource.destroy();
      }
      console.log(`Deleted ${resources.length} resources`);

      // 2. 删除用户的帖子
      const posts = await Post.findAll({ where: { author_phone: phone } });
      for (const post of posts) {
        await post.destroy();
      }
      console.log(`Deleted ${posts.length} posts`);

      // 3. 删除用户的评论
      const comments = await Comment.findAll({ where: { author_phone: phone } });
      for (const comment of comments) {
        await comment.destroy();
      }
      console.log(`Deleted ${comments.length} comments`);

      // 4. 删除用户的收藏
      const collections = await Collection.findAll({ where: { user_phone: phone } });
      for (const collection of collections) {
        await collection.destroy();
      }
      console.log(`Deleted ${collections.length} collections`);

      // 5. 删除关注关系（作为关注者）
      const followings = await UserFollow.findAll({ where: { follower_phone: phone } });
      for (const follow of followings) {
        await follow.destroy();
      }
      console.log(`Deleted ${followings.length} following relationships`);

      // 7. 删除关注关系（作为被关注者）
      const followers = await UserFollow.findAll({ where: { following_phone: phone } });
      for (const follow of followers) {
        await follow.destroy();
      }
      console.log(`Deleted ${followers.length} follower relationships`);

      // 8. 删除用户的通知（作为接收者）
      const receivedNotifications = await Notification.findAll({ where: { receiver_phone: phone } });
      for (const notification of receivedNotifications) {
        await notification.destroy();
      }
      console.log(`Deleted ${receivedNotifications.length} received notifications`);

      // 9. 删除用户发送的通知（作为发送者，如果存在）
      const sentNotifications = await Notification.findAll({ where: { sender_phone: phone } });
      for (const notification of sentNotifications) {
        await notification.destroy();
      }
      console.log(`Deleted ${sentNotifications.length} sent notifications`);

      // 10. 最后删除用户记录
      await user.destroy();
      console.log(`User ${phone} and all associated data deleted successfully`);

      res.json({
        success: true,
        message: '用户及其所有相关数据删除成功'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: '删除用户失败'
      });
    }
  }

  // 更新用户角色
  static async updateUserRole(req, res) {
    try {
      const { phone } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: '无效的用户角色'
        });
      }

      const user = await User.findByPk(phone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 不能修改自己的角色
      if (req.user.phone_number === phone) {
        return res.status(403).json({
          success: false,
          message: '不能修改自己的角色'
        });
      }

      // 如果要设置为管理员，需要额外验证
      if (role === 'admin') {
        // 验证用户状态必须是active
        if (user.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: '只有状态正常的用户才能设置为管理员'
          });
        }
      }

      await user.update({ role });

      // 记录操作日志（可选）
      console.log(`Admin ${req.user.phone_number} changed user ${phone} role to ${role}`);

      res.json({
        success: true,
        message: `用户角色已更新为${role === 'admin' ? '管理员' : '普通用户'}`
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: '更新用户角色失败'
      });
    }
  }

  // 重置用户密码
  static async resetUserPassword(req, res) {
    try {
      const { phone } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '新密码至少6位'
        });
      }

      const user = await User.findByPk(phone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 不能重置其他管理员的密码
      if (user.role === 'admin' && req.user.phone_number !== phone) {
        return res.status(403).json({
          success: false,
          message: '不能重置其他管理员的密码'
        });
      }

      await user.update({ password: newPassword });

      // 记录操作日志
      console.log(`Admin ${req.user.phone_number} reset password for user ${phone}`);

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: '重置密码失败'
      });
    }
  }

  // 获取用户详细信息
  static async getUserDetail(req, res) {
    try {
      const { phone } = req.params;

      const user = await User.findByPk(phone, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Resource,
            as: 'publishedResources',
            attributes: ['resource_id', 'resource_name', 'status', 'created_at'],
            limit: 5,
            order: [['created_at', 'DESC']]
          },
          {
            model: Post,
            as: 'posts',
            attributes: ['post_id', 'title', 'status', 'created_at'],
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 获取用户统计信息
      const stats = {
        resourceCount: await Resource.count({ where: { publisher_phone: phone } }),
        postCount: await Post.count({ where: { author_phone: phone } }),
        publishedResourceCount: await Resource.count({ 
          where: { publisher_phone: phone, status: 'published' } 
        }),
        activePostCount: await Post.count({ 
          where: { author_phone: phone, status: 'active' } 
        })
      };

      res.json({
        success: true,
        data: {
          user: user.toSafeJSON(),
          stats
        }
      });
    } catch (error) {
      console.error('Get user detail error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户详情失败'
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

  // 获取所有资源（支持多状态筛选）
  static async getAllResources(req, res) {
    try {
      const { page = 1, limit = 20, status, category, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        if (status.includes(',')) {
          where.status = { [Op.in]: status.split(',') };
        } else {
          where.status = status;
        }
      }
      if (category) {
        where.category_id = category;
      }
      if (search) {
        where[Op.or] = [
          { resource_name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const resources = await Resource.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'publisher',
            attributes: ['name', 'phone_number']
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['name', 'phone_number']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          resources: resources.rows,
          total: resources.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all resources error:', error);
      res.status(500).json({
        success: false,
        message: '获取资源列表失败'
      });
    }
  }

  // 删除资源（设为archived状态）
  static async deleteResource(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const resource = await Resource.findByPk(id, {
        include: [{ model: User, as: 'publisher', attributes: ['name', 'phone_number'] }]
      });
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }

      await resource.update({ 
        status: 'archived',
        review_comment: reason || '管理员删除',
        reviewer_phone: req.user.phone_number,
        reviewed_at: new Date()
      });

      // 新增：删除资源后自减用户资源数
      if (resource.publisher_phone) {
        await User.decrement('resource_count', { where: { phone_number: resource.publisher_phone }, min: 0 })
      }

      // 发送通知给资源发布者
      await Notification.create({
        notification_id: `600${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 9),
        receiver_phone: resource.publisher_phone,
        sender_phone: null,
        type: 'resource',
        priority: 'medium',
        title: '资源被删除',
        content: `您的资源「${resource.resource_name}」已被管理员删除。${reason ? `原因：${reason}` : ''}`,
        action_type: 'none',
        is_read: false
      });

      res.json({
        success: true,
        message: '资源删除成功'
      });
    } catch (error) {
      console.error('Delete resource error:', error);
      res.status(500).json({
        success: false,
        message: '删除资源失败'
      });
    }
  }

  // 获取资源举报列表
  static async getResourceReports(req, res) {
    try {
      const { page = 1, limit = 20, status = 'pending' } = req.query;
      const offset = (page - 1) * limit;

      const reports = await ResourceReport.findAndCountAll({
        where: { status },
        include: [
          {
            model: Resource,
            as: 'resource',
            attributes: ['resource_id', 'resource_name', 'publisher_phone'],
            include: [{
              model: User,
              as: 'publisher',
              attributes: ['name', 'phone_number']
            }]
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['name', 'phone_number']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          reports: reports.rows,
          total: reports.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get resource reports error:', error);
      res.status(500).json({
        success: false,
        message: '获取资源举报列表失败'
      });
    }
  }

  // 处理资源举报
  static async handleResourceReport(req, res) {
    try {
      const { reportId } = req.params;
      const { action, result } = req.body; // action: 'accept' | 'reject'

      const report = await ResourceReport.findByPk(reportId, {
        include: [
          { model: Resource, as: 'resource' },
          { model: User, as: 'reporter', attributes: ['name', 'phone_number'] }
        ]
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在'
        });
      }

      await report.update({
        status: 'processed',
        processed_by: req.user.phone_number,
        process_result: result,
        processed_at: new Date()
      });

      // 如果接受举报，则删除资源
      if (action === 'accept' && report.resource) {
        await report.resource.update({
          status: 'archived',
          review_comment: `因举报被删除：${result}`,
          reviewer_phone: req.user.phone_number,
          reviewed_at: new Date()
        });
      }

      // 发送通知给举报者
      await Notification.create({
        notification_id: `600${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 9),
        receiver_phone: report.reporter_phone,
        sender_phone: null,
        type: 'system',
        priority: 'low',
        title: '举报处理完成',
        content: `您举报的资源已处理完成。处理结果：${result}`,
        action_type: 'none',
        is_read: false
      });

      res.json({
        success: true,
        message: '举报处理完成'
      });
    } catch (error) {
      console.error('Handle resource report error:', error);
      res.status(500).json({
        success: false,
        message: '处理举报失败'
      });
    }
  }

  // 获取所有帖子
  static async getAllPosts(req, res) {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        if (status.includes(',')) {
          where.status = { [Op.in]: status.split(',') };
        } else {
          where.status = status;
        }
      }
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } }
        ];
      }

      const posts = await Post.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['name', 'phone_number']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          posts: posts.rows,
          total: posts.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all posts error:', error);
      res.status(500).json({
        success: false,
        message: '获取帖子列表失败'
      });
    }
  }

  // 更新帖子状态
  static async updatePostStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!['active', 'hidden', 'deleted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的帖子状态'
        });
      }

      const post = await Post.findByPk(id, {
        include: [{ model: User, as: 'author', attributes: ['name', 'phone_number'] }]
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        });
      }

      await post.update({ status });

      // 如果隐藏或删除帖子，发送通知给作者
      if (status !== 'active') {
        const actionText = status === 'hidden' ? '隐藏' : '删除';
        await Notification.create({
          notification_id: `600${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 9),
          receiver_phone: post.author_phone,
          sender_phone: null,
          type: 'system',
          priority: 'medium',
          title: `帖子被${actionText}`,
          content: `您的帖子「${post.title}」已被管理员${actionText}。${reason ? `原因：${reason}` : ''}`,
          action_type: 'none',
          is_read: false
        });
      }

      res.json({
        success: true,
        message: '帖子状态更新成功'
      });
    } catch (error) {
      console.error('Update post status error:', error);
      res.status(500).json({
        success: false,
        message: '更新帖子状态失败'
      });
    }
  }

  // 获取帖子举报列表
  static async getPostReports(req, res) {
    try {
      const { page = 1, limit = 20, status = 'pending' } = req.query;
      const offset = (page - 1) * limit;

      const reports = await PostReport.findAndCountAll({
        where: { status },
        include: [
          {
            model: Post,
            as: 'post',
            attributes: ['post_id', 'title', 'author_phone'],
            include: [{
              model: User,
              as: 'author',
              attributes: ['name', 'phone_number']
            }]
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['name', 'phone_number']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          reports: reports.rows,
          total: reports.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get post reports error:', error);
      res.status(500).json({
        success: false,
        message: '获取帖子举报列表失败'
      });
    }
  }

  // 处理帖子举报
  static async handlePostReport(req, res) {
    try {
      const { reportId } = req.params;
      const { action, result } = req.body; // action: 'hide_post' | 'delete_post' | 'ignore'

      const report = await PostReport.findByPk(reportId, {
        include: [
          { model: Post, as: 'post' },
          { model: User, as: 'reporter', attributes: ['name', 'phone_number'] }
        ]
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在'
        });
      }

      await report.update({
        status: 'processed',
        processed_by: req.user.phone_number,
        process_result: result,
        processed_at: new Date()
      });

      // 根据处理动作更新帖子状态
      if (report.post) {
        if (action === 'hide_post') {
          await report.post.update({ status: 'hidden' });
        } else if (action === 'delete_post') {
          await report.post.update({ status: 'deleted' });
        }
      }

      // 发送通知给举报者
      await Notification.create({
        notification_id: `600${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 9),
        receiver_phone: report.reporter_phone,
        sender_phone: null,
        type: 'system',
        priority: 'low',
        title: '举报处理完成',
        content: `您举报的帖子已处理完成。处理结果：${result}`,
        action_type: 'none',
        is_read: false
      });

      res.json({
        success: true,
        message: '举报处理完成'
      });
    } catch (error) {
      console.error('Handle post report error:', error);
      res.status(500).json({
        success: false,
        message: '处理举报失败'
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

  // 获取所有通知列表（管理员功能）
  static async getAllNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type, priority, search, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      // 搜索条件
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } }
        ];
      }

      // 类型筛选
      if (type) {
        where.type = type;
      }

      // 优先级筛选
      if (priority) {
        where.priority = priority;
      }

      // 时间范围筛选
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          where.created_at[Op.lte] = new Date(end_date + ' 23:59:59');
        }
      }

      const notifications = await Notification.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['name', 'phone_number'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      // 统计每个通知的接收用户数和已读数
      const notificationsWithStats = await Promise.all(
        notifications.rows.map(async (notification) => {
          const notificationData = notification.toJSON();
          
          // 获取接收这个通知的总用户数
          const totalReceivers = await Notification.count({
            where: {
              title: notification.title,
              content: notification.content,
              created_at: notification.created_at
            }
          });

          // 获取已读用户数
          const readCount = await Notification.count({
            where: {
              title: notification.title,
              content: notification.content,
              created_at: notification.created_at,
              is_read: true
            }
          });

          return {
            ...notificationData,
            total_receivers: totalReceivers,
            read_count: readCount,
            read_rate: totalReceivers > 0 ? Math.round((readCount / totalReceivers) * 100) : 0
          };
        })
      );

      // 去重处理（根据标题、内容和创建时间）
      const uniqueNotifications = notificationsWithStats.reduce((acc, current) => {
        const existing = acc.find(item => 
          item.title === current.title && 
          item.content === current.content && 
          new Date(item.created_at).getTime() === new Date(current.created_at).getTime()
        );
        
        if (!existing) {
          acc.push(current);
        }
        
        return acc;
      }, []);

      res.json({
        success: true,
        data: {
          notifications: uniqueNotifications,
          total: uniqueNotifications.length,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all notifications error:', error);
      res.status(500).json({
        success: false,
        message: '获取通知列表失败'
      });
    }
  }

  // 获取通知统计信息
  static async getNotificationStats(req, res) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());

      const stats = {
        total_notifications: await Notification.count({
          distinct: true,
          col: 'notification_id'
        }),
        today_sent: await Notification.count({
          where: {
            created_at: {
              [Op.gte]: startOfDay
            }
          },
          distinct: true,
          col: 'notification_id'
        }),
        week_sent: await Notification.count({
          where: {
            created_at: {
              [Op.gte]: startOfWeek
            }
          },
          distinct: true,
          col: 'notification_id'
        }),
        unread_count: await Notification.count({
          where: {
            is_read: false
          }
        }),
        total_users: await User.count({
          where: {
            status: 'active'
          }
        })
      };

      // 计算平均阅读率
      const totalSent = await Notification.count();
      const totalRead = await Notification.count({
        where: {
          is_read: true
        }
      });
      
      stats.average_read_rate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({
        success: false,
        message: '获取通知统计失败'
      });
    }
  }

  // 删除通知（管理员功能）
  static async deleteNotificationBatch(req, res) {
    try {
      const { notification_ids } = req.body;

      if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的通知ID列表'
        });
      }

      const deletedCount = await Notification.destroy({
        where: {
          notification_id: {
            [Op.in]: notification_ids
          }
        }
      });

      res.json({
        success: true,
        message: '批量删除通知成功',
        data: {
          deleted_count: deletedCount
        }
      });
    } catch (error) {
      console.error('Delete notification batch error:', error);
      res.status(500).json({
        success: false,
        message: '批量删除通知失败'
      });
    }
  }

  // 反馈管理
  static async getAllFeedbacks(req, res) {
    try {
      const { page = 1, limit = 20, type, status, search, start_date, end_date } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      // 类型筛选
      if (type) {
        where.type = type;
      }

      // 状态筛选
      if (status) {
        where.status = status;
      }

      // 搜索条件
      if (search) {
        where[Op.or] = [
          { content: { [Op.like]: `%${search}%` } },
          { contact: { [Op.like]: `%${search}%` } },
          { reply: { [Op.like]: `%${search}%` } }
        ];
      }

      // 时间范围筛选
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          where.created_at[Op.lte] = new Date(end_date + ' 23:59:59');
        }
      }

      const feedbacks = await Feedback.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'phone_number'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      // 处理images字段
      const processedFeedbacks = feedbacks.rows.map(feedback => {
        const feedbackData = feedback.toJSON();
        feedbackData.images = feedbackData.images ? JSON.parse(feedbackData.images) : [];
        return feedbackData;
      });

      res.json({
        success: true,
        data: {
          feedbacks: processedFeedbacks,
          total: feedbacks.count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get feedbacks error:', error);
      res.status(500).json({
        success: false,
        message: '获取反馈列表失败'
      });
    }
  }

  static async getFeedbackStats(req, res) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));

      const [
        totalFeedbacks,
        todayFeedbacks,
        weekFeedbacks,
        pendingFeedbacks,
        processingFeedbacks,
        resolvedFeedbacks
      ] = await Promise.all([
        Feedback.count(),
        Feedback.count({
          where: {
            created_at: {
              [Op.gte]: today
            }
          }
        }),
        Feedback.count({
          where: {
            created_at: {
              [Op.gte]: thisWeekStart
            }
          }
        }),
        Feedback.count({ where: { status: 'pending' } }),
        Feedback.count({ where: { status: 'processing' } }),
        Feedback.count({ where: { status: 'resolved' } })
      ]);

      res.json({
        success: true,
        data: {
          total_feedbacks: totalFeedbacks,
          today_feedbacks: todayFeedbacks,
          week_feedbacks: weekFeedbacks,
          pending_feedbacks: pendingFeedbacks,
          processing_feedbacks: processingFeedbacks,
          resolved_feedbacks: resolvedFeedbacks
        }
      });
    } catch (error) {
      console.error('Get feedback stats error:', error);
      res.status(500).json({
        success: false,
        message: '获取反馈统计失败'
      });
    }
  }

  static async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reply } = req.body;

      if (!['pending', 'processing', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }

      const feedback = await Feedback.findByPk(id);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: '反馈记录不存在'
        });
      }

      const updateData = { status };
      if (reply !== undefined) {
        updateData.reply = reply;
      }

      await feedback.update(updateData);

      res.json({
        success: true,
        message: '反馈状态更新成功'
      });
    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({
        success: false,
        message: '更新反馈状态失败'
      });
    }
  }

  static async deleteFeedbackBatch(req, res) {
    try {
      const { feedback_ids } = req.body;

      if (!Array.isArray(feedback_ids) || feedback_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的反馈ID列表'
        });
      }

      const deletedCount = await Feedback.destroy({
        where: {
          id: {
            [Op.in]: feedback_ids
          }
        }
      });

      res.json({
        success: true,
        data: {
          deleted_count: deletedCount
        },
        message: `成功删除 ${deletedCount} 条反馈记录`
      });
    } catch (error) {
      console.error('Delete feedback batch error:', error);
      res.status(500).json({
        success: false,
        message: '批量删除反馈失败'
      });
    }
  }
}

module.exports = AdminController;