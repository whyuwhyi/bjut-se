const { validationResult } = require('express-validator')
const { Notification, User, NotificationRead } = require('../models')
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
      
      // 构建查询条件：包含个人通知和广播通知
      const whereClause = {
        [Op.or]: [
          { receiver_phone: phone_number }, // 个人通知
          { receiver_phone: null }          // 广播通知
        ]
      }

      // 添加筛选条件
      if (type) {
        whereClause.type = type
      }
      if (priority) {
        whereClause.priority = priority
      }

      // 只显示未过期的通知
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      ]

      // 查询通知并左连接已读状态
      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: NotificationRead,
            as: 'readByUsers',
            where: { user_phone: phone_number },
            required: false // LEFT JOIN
          }
        ],
        order: [
          ['priority', 'DESC'], // 高优先级在前
          ['created_at', 'DESC'] // 最新的在前
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      // 获取未读消息数量（包含个人通知和未读的广播通知）
      const personalUnreadCount = await Notification.count({
        where: {
          receiver_phone: phone_number,
          is_read: false,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      });
      
      // 获取未读的广播通知数量
      const broadcastNotifications = await Notification.findAll({
        where: {
          receiver_phone: null,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        },
        include: [
          {
            model: NotificationRead,
            as: 'readByUsers',
            where: { user_phone: phone_number },
            required: false
          }
        ]
      });
      
      const unreadBroadcastCount = broadcastNotifications.filter(n => 
        !n.readByUsers || n.readByUsers.length === 0
      ).length;
      
      const unreadCount = personalUnreadCount + unreadBroadcastCount;

      res.json({
        success: true,
        message: '获取通知列表成功',
        data: {
          notifications: notifications.map(notification => {
            const isBroadcast = notification.receiver_phone === null;
            const isRead = isBroadcast 
              ? notification.readByUsers && notification.readByUsers.length > 0
              : notification.is_read;
            const readAt = isBroadcast
              ? (notification.readByUsers && notification.readByUsers.length > 0 
                 ? notification.readByUsers[0].read_at : null)
              : notification.read_at;

            // 如果有is_read筛选条件，过滤结果
            if (is_read !== undefined) {
              const shouldBeRead = is_read === 'true';
              if (isRead !== shouldBeRead) {
                return null; // 稍后过滤掉
              }
            }
            
            return {
              notification_id: notification.notification_id,
              type: notification.type,
              priority: notification.priority,
              title: notification.title,
              content: notification.content,
              action_type: notification.action_type,
              action_url: notification.action_url,
              action_params: notification.action_params,
              is_read: isRead,
              read_at: readAt,
              created_at: notification.created_at,
              is_broadcast: isBroadcast
            };
          }).filter(n => n !== null), // 过滤掉不符合is_read条件的通知
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
          [Op.or]: [
            { receiver_phone: phone_number }, // 个人通知
            { receiver_phone: null }          // 广播通知
          ]
        },
        include: [
          {
            model: NotificationRead,
            as: 'readByUsers',
            where: { user_phone: phone_number },
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

      const isBroadcast = notification.receiver_phone === null;
      const isRead = isBroadcast 
        ? notification.readByUsers && notification.readByUsers.length > 0
        : notification.is_read;
      const readAt = isBroadcast
        ? (notification.readByUsers && notification.readByUsers.length > 0 
           ? notification.readByUsers[0].read_at : null)
        : notification.read_at;

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
            is_read: isRead,
            read_at: readAt,
            created_at: notification.created_at,
            is_broadcast: isBroadcast
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
          [Op.or]: [
            { receiver_phone: phone_number }, // 个人通知
            { receiver_phone: null }          // 广播通知
          ]
        }
      })

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        })
      }

      const isBroadcast = notification.receiver_phone === null;
      
      if (isBroadcast) {
        // 广播通知：在notification_reads表中记录已读状态
        const [readRecord, created] = await NotificationRead.findOrCreate({
          where: {
            user_phone: phone_number,
            notification_id: id
          },
          defaults: {
            read_at: new Date()
          }
        });
        
        if (!created) {
          // 如果已存在记录，更新读取时间
          await readRecord.update({ read_at: new Date() });
        }
      } else {
        // 个人通知：直接更新通知记录
        await notification.update({
          is_read: true,
          read_at: new Date()
        })
      }

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

      // 标记所有个人通知为已读
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

      // 获取所有未读的广播通知
      const broadcastNotifications = await Notification.findAll({
        where: {
          receiver_phone: null,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        },
        include: [
          {
            model: NotificationRead,
            as: 'readByUsers',
            where: { user_phone: phone_number },
            required: false
          }
        ]
      });

      // 为未读的广播通知创建已读记录
      const unreadBroadcastIds = broadcastNotifications
        .filter(n => !n.readByUsers || n.readByUsers.length === 0)
        .map(n => n.notification_id);

      if (unreadBroadcastIds.length > 0) {
        const readRecords = unreadBroadcastIds.map(notificationId => ({
          user_phone: phone_number,
          notification_id: notificationId,
          read_at: new Date()
        }));
        
        await NotificationRead.bulkCreate(readRecords, {
          ignoreDuplicates: true
        });
      }

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

      // 获取个人通知未读数量
      const personalUnreadCount = await Notification.count({
        where: {
          receiver_phone: phone_number,
          is_read: false,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        }
      });
      
      // 获取未读的广播通知数量
      const broadcastNotifications = await Notification.findAll({
        where: {
          receiver_phone: null,
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        },
        include: [
          {
            model: NotificationRead,
            as: 'readByUsers',
            where: { user_phone: phone_number },
            required: false
          }
        ]
      });
      
      const unreadBroadcastCount = broadcastNotifications.filter(n => 
        !n.readByUsers || n.readByUsers.length === 0
      ).length;
      
      const unreadCount = personalUnreadCount + unreadBroadcastCount;

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
        // 如果没有指定目标用户，则创建广播通知（receiver_phone为null）
        const notificationData = {
          notification_id: generateNotificationId(),
          receiver_phone: null, // 广播通知
          type,
          priority,
          title,
          content,
          action_type,
          action_url,
          action_params,
          expires_at
        };
        
        await Notification.create(notificationData);
        
        res.json({
          success: true,
          message: '广播通知发布成功',
          data: {
            sent_count: 1,
            is_broadcast: true
          }
        });
      } else {
        // 批量创建个人通知
        const notifications = targetUsers.map(phone => ({
          notification_id: generateNotificationId(),
          receiver_phone: phone,
          type,
          priority,
          title,
          content,
          action_type,
          action_url,
          action_params,
          expires_at
        }));

        await Notification.bulkCreate(notifications);

        res.json({
          success: true,
          message: '系统通知发布成功',
          data: {
            sent_count: notifications.length,
            is_broadcast: false
          }
        });
      }
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