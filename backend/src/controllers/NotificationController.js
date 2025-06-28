const { validationResult } = require('express-validator')
const { Notification, User } = require('../models')
const { Op } = require('sequelize')

class NotificationController {
  // 获取用户通知列表
  async getNotifications(req, res) {
    try {
      const phone_number = req.user.phone_number
      const { 
        page = 1, 
        limit = 20, 
        type, 
        is_read, 
        priority 
      } = req.query

      const offset = (page - 1) * limit
      const whereClause = { receiver_phone: phone_number }

      // 添加筛选条件
      if (type) {
        whereClause.type = type
      }
      if (is_read !== undefined) {
        whereClause.is_read = is_read === 'true'
      }
      if (priority) {
        whereClause.priority = priority
      }

      // 只显示未过期的通知
      whereClause[Op.or] = [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url'],
            required: false
          }
        ],
        order: [
          ['priority', 'DESC'], // 高优先级在前
          ['created_at', 'DESC'] // 最新的在前
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      // 获取未读消息数量
      const unreadCount = await Notification.count({
        where: {
          receiver_phone: phone_number,
          is_read: false,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      })

      res.json({
        success: true,
        message: '获取通知列表成功',
        data: {
          notifications: notifications.map(notification => ({
            notification_id: notification.notification_id,
            type: notification.type,
            priority: notification.priority,
            title: notification.title,
            content: notification.content,
            action_type: notification.action_type,
            action_url: notification.action_url,
            action_params: notification.action_params,
            is_read: notification.is_read,
            read_at: notification.read_at,
            created_at: notification.created_at,
            sender: notification.sender ? {
              name: notification.sender.name,
              nickname: notification.sender.nickname,
              avatar_url: notification.sender.avatar_url
            } : null
          })),
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          },
          unread_count: unreadCount
        }
      })
    } catch (error) {
      console.error('获取通知列表失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 获取通知详情
  async getNotificationDetail(req, res) {
    try {
      const { id } = req.params
      const phone_number = req.user.phone_number

      const notification = await Notification.findOne({
        where: {
          notification_id: id,
          receiver_phone: phone_number
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url'],
            required: false
          }
        ]
      })

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        })
      }

      res.json({
        success: true,
        message: '获取通知详情成功',
        data: {
          notification: {
            notification_id: notification.notification_id,
            type: notification.type,
            priority: notification.priority,
            title: notification.title,
            content: notification.content,
            action_type: notification.action_type,
            action_url: notification.action_url,
            action_params: notification.action_params,
            is_read: notification.is_read,
            read_at: notification.read_at,
            created_at: notification.created_at,
            sender: notification.sender ? {
              name: notification.sender.name,
              nickname: notification.sender.nickname,
              avatar_url: notification.sender.avatar_url
            } : null
          }
        }
      })
    } catch (error) {
      console.error('获取通知详情失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 标记通知为已读
  async markAsRead(req, res) {
    try {
      const { id } = req.params
      const phone_number = req.user.phone_number

      const notification = await Notification.findOne({
        where: {
          notification_id: id,
          receiver_phone: phone_number
        }
      })

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        })
      }

      await notification.update({
        is_read: true,
        read_at: new Date()
      })

      res.json({
        success: true,
        message: '标记已读成功'
      })
    } catch (error) {
      console.error('标记已读失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 标记所有通知为已读
  async markAllAsRead(req, res) {
    try {
      const phone_number = req.user.phone_number

      await Notification.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            receiver_phone: phone_number,
            is_read: false
          }
        }
      )

      res.json({
        success: true,
        message: '全部标记已读成功'
      })
    } catch (error) {
      console.error('全部标记已读失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 删除通知
  async deleteNotification(req, res) {
    try {
      const { id } = req.params
      const phone_number = req.user.phone_number

      const notification = await Notification.findOne({
        where: {
          notification_id: id,
          receiver_phone: phone_number
        }
      })

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        })
      }

      await notification.destroy()

      res.json({
        success: true,
        message: '删除通知成功'
      })
    } catch (error) {
      console.error('删除通知失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 获取未读通知数量
  async getUnreadCount(req, res) {
    try {
      const phone_number = req.user.phone_number

      const unreadCount = await Notification.count({
        where: {
          receiver_phone: phone_number,
          is_read: false,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      })

      res.json({
        success: true,
        message: '获取未读数量成功',
        data: {
          unread_count: unreadCount
        }
      })
    } catch (error) {
      console.error('获取未读数量失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 清理过期通知
  async cleanExpiredNotifications(req, res) {
    try {
      const phone_number = req.user.phone_number

      const deletedCount = await Notification.destroy({
        where: {
          receiver_phone: phone_number,
          expires_at: {
            [Op.lt]: new Date()
          }
        }
      })

      res.json({
        success: true,
        message: '清理过期通知成功',
        data: {
          deleted_count: deletedCount
        }
      })
    } catch (error) {
      console.error('清理过期通知失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }

  // 管理员发布系统通知（预留接口）
  async createSystemNotification(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入数据验证失败',
          errors: errors.array()
        })
      }

      const {
        target_users, // 目标用户列表，如果为空则发送给所有用户
        type = 'system',
        priority = 'medium',
        title,
        content,
        action_type = 'none',
        action_url,
        action_params,
        expires_at
      } = req.body

      // 生成通知ID
      const generateNotificationId = () => {
        return Math.floor(100000000 + Math.random() * 900000000).toString()
      }

      let targetUsers = target_users
      if (!targetUsers || targetUsers.length === 0) {
        // 如果没有指定目标用户，则发送给所有激活用户
        const allUsers = await User.findAll({
          where: { status: 'active' },
          attributes: ['phone_number']
        })
        targetUsers = allUsers.map(user => user.phone_number)
      }

      // 批量创建通知
      const notifications = targetUsers.map(phone => ({
        notification_id: generateNotificationId(),
        receiver_phone: phone,
        sender_phone: null, // 系统通知没有发送者
        type,
        priority,
        title,
        content,
        action_type,
        action_url,
        action_params,
        expires_at
      }))

      await Notification.bulkCreate(notifications)

      res.json({
        success: true,
        message: '系统通知发布成功',
        data: {
          sent_count: notifications.length
        }
      })
    } catch (error) {
      console.error('发布系统通知失败:', error)
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      })
    }
  }
}

module.exports = new NotificationController()