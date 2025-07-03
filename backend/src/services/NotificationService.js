const { Notification, User, UserFollow } = require('../models')
const idGenerator = require('../utils/IdGenerator')
const { Op } = require('sequelize')

/**
 * 通知推送服务
 * 负责处理各种类型的通知推送逻辑
 */
class NotificationService {
  
  /**
   * 关注用户发布新内容时推送通知
   * @param {string} authorPhone - 内容发布者手机号
   * @param {string} contentType - 内容类型 ('post' | 'resource')
   * @param {string} contentId - 内容ID
   * @param {string} contentTitle - 内容标题
   * @param {Object} options - 可选参数
   */
  async notifyFollowersAboutNewContent(authorPhone, contentType, contentId, contentTitle, options = {}) {
    try {
      // 获取作者信息
      const author = await User.findByPk(authorPhone)
      if (!author) {
        console.warn(`NotificationService: Author not found: ${authorPhone}`)
        return
      }

      // 获取所有关注该用户的粉丝
      const followers = await UserFollow.findAll({
        where: {
          following_phone: authorPhone,
          status: 'active'
        },
        include: [{
          model: User,
          as: 'follower',
          attributes: ['phone_number', 'nickname']
        }]
      })

      if (followers.length === 0) {
        console.log(`NotificationService: No followers found for user ${authorPhone}`)
        return
      }

      // 生成通知数据
      const notificationType = contentType === 'post' ? 'follow_post' : 'follow_resource'
      const contentTypeText = contentType === 'post' ? '帖子' : '资源'
      const authorName = author.nickname || author.name || '用户'

      const notifications = followers.map(follow => ({
        notification_id: idGenerator.generateNotificationId(),
        receiver_phone: follow.follower_phone,
        type: 'interaction', // 统一归类为互动类型
        priority: options.priority || 'medium',
        title: `关注用户发布了新${contentTypeText}`,
        content: `${authorName}发布了新${contentTypeText}：《${contentTitle}》`,
        action_type: 'navigate',
        action_url: contentType === 'post' 
          ? `/pages/forum/detail?id=${contentId}`
          : `/pages/resources/detail?id=${contentId}`,
        related_user_phone: authorPhone,
        related_content_id: contentId,
        related_content_type: contentType,
        is_read: false
      }))

      // 批量创建通知
      await this.createBulkNotifications(notifications)
      
      console.log(`NotificationService: Successfully notified ${followers.length} followers about new ${contentType} by ${authorPhone}`)
      
      return {
        success: true,
        notified_count: followers.length,
        content_type: contentType,
        content_id: contentId
      }

    } catch (error) {
      console.error('NotificationService: Error in notifyFollowersAboutNewContent:', error)
      throw error
    }
  }

  /**
   * 新粉丝关注时推送通知
   * @param {string} followerPhone - 关注者手机号
   * @param {string} followingPhone - 被关注者手机号
   */
  async notifyNewFollower(followerPhone, followingPhone) {
    try {
      // 防止自己关注自己的通知
      if (followerPhone === followingPhone) {
        return
      }

      // 获取关注者信息
      const follower = await User.findByPk(followerPhone)
      if (!follower) {
        console.warn(`NotificationService: Follower not found: ${followerPhone}`)
        return
      }

      const followerName = follower.nickname || follower.name || '用户'

      const notification = {
        notification_id: idGenerator.generateNotificationId(),
        receiver_phone: followingPhone,
        type: 'interaction', // 统一归类为互动类型
        priority: 'low',
        title: '新的关注者',
        content: `${followerName}开始关注您了！`,
        action_type: 'navigate',
        action_url: `/pages/profile/user-detail?phone=${followerPhone}`,
        related_user_phone: followerPhone,
        related_content_id: null,
        related_content_type: null,
        is_read: false
      }

      await Notification.create(notification)
      
      console.log(`NotificationService: Successfully notified ${followingPhone} about new follower ${followerPhone}`)
      
      return {
        success: true,
        follower_phone: followerPhone,
        following_phone: followingPhone
      }

    } catch (error) {
      console.error('NotificationService: Error in notifyNewFollower:', error)
      throw error
    }
  }

  /**
   * 内容被评论时推送通知
   * @param {string} contentAuthorPhone - 内容作者手机号
   * @param {string} commenterPhone - 评论者手机号
   * @param {string} contentType - 内容类型 ('post' | 'resource')
   * @param {string} contentId - 内容ID
   * @param {string} contentTitle - 内容标题
   */
  async notifyContentCommented(contentAuthorPhone, commenterPhone, contentType, contentId, contentTitle) {
    try {
      // 防止自己评论自己内容的通知
      if (contentAuthorPhone === commenterPhone) {
        return
      }

      // 获取评论者信息
      const commenter = await User.findByPk(commenterPhone)
      if (!commenter) {
        console.warn(`NotificationService: Commenter not found: ${commenterPhone}`)
        return
      }

      const commenterName = commenter.nickname || commenter.name || '用户'
      const contentTypeText = contentType === 'post' ? '帖子' : '资源'

      const notification = {
        notification_id: idGenerator.generateNotificationId(),
        receiver_phone: contentAuthorPhone,
        type: 'interaction', // 统一归类为互动类型
        priority: 'low',
        title: `您的${contentTypeText}收到新评论`,
        content: `${commenterName}评论了您的${contentTypeText}：《${contentTitle}》`,
        action_type: 'navigate',
        action_url: contentType === 'post' 
          ? `/pages/forum/detail?id=${contentId}`
          : `/pages/resources/detail?id=${contentId}`,
        related_user_phone: commenterPhone,
        related_content_id: contentId,
        related_content_type: contentType,
        is_read: false
      }

      await Notification.create(notification)
      
      console.log(`NotificationService: Successfully notified ${contentAuthorPhone} about comment on ${contentType} ${contentId}`)
      
      return {
        success: true,
        content_author: contentAuthorPhone,
        commenter: commenterPhone,
        content_type: contentType,
        content_id: contentId
      }

    } catch (error) {
      console.error('NotificationService: Error in notifyContentCommented:', error)
      throw error
    }
  }

  /**
   * 内容被收藏时推送通知
   * @param {string} contentAuthorPhone - 内容作者手机号
   * @param {string} collectorPhone - 收藏者手机号
   * @param {string} contentType - 内容类型 ('post' | 'resource')
   * @param {string} contentId - 内容ID
   * @param {string} contentTitle - 内容标题
   */
  async notifyContentLiked(contentAuthorPhone, collectorPhone, contentType, contentId, contentTitle) {
    try {
      // 防止自己收藏自己内容的通知
      if (contentAuthorPhone === collectorPhone) {
        return
      }

      // 获取收藏者信息
      const collector = await User.findByPk(collectorPhone)
      if (!collector) {
        console.warn(`NotificationService: Collector not found: ${collectorPhone}`)
        return
      }

      const collectorName = collector.nickname || collector.name || '用户'
      const contentTypeText = contentType === 'post' ? '帖子' : '资源'

      const notification = {
        notification_id: idGenerator.generateNotificationId(),
        receiver_phone: contentAuthorPhone,
        type: 'interaction', // 统一归类为互动类型
        priority: 'low',
        title: `您的${contentTypeText}被收藏`,
        content: `${collectorName}收藏了您的${contentTypeText}：《${contentTitle}》`,
        action_type: 'navigate',
        action_url: contentType === 'post' 
          ? `/pages/forum/detail?id=${contentId}`
          : `/pages/resources/detail?id=${contentId}`,
        related_user_phone: collectorPhone,
        related_content_id: contentId,
        related_content_type: contentType,
        is_read: false
      }

      await Notification.create(notification)
      
      console.log(`NotificationService: Successfully notified ${contentAuthorPhone} about like on ${contentType} ${contentId}`)
      
      return {
        success: true,
        content_author: contentAuthorPhone,
        collector: collectorPhone,
        content_type: contentType,
        content_id: contentId
      }

    } catch (error) {
      console.error('NotificationService: Error in notifyContentLiked:', error)
      throw error
    }
  }

  /**
   * 批量创建通知
   * @param {Array} notifications - 通知数据数组
   */
  async createBulkNotifications(notifications) {
    try {
      if (!notifications || notifications.length === 0) {
        return
      }

      // 去重检查：避免重复通知
      const deduplicatedNotifications = await this.deduplicateNotifications(notifications)
      
      if (deduplicatedNotifications.length === 0) {
        console.log('NotificationService: All notifications were duplicates, skipping creation')
        return
      }

      await Notification.bulkCreate(deduplicatedNotifications)
      
      console.log(`NotificationService: Successfully created ${deduplicatedNotifications.length} notifications`)
      
      return {
        success: true,
        created_count: deduplicatedNotifications.length,
        skipped_count: notifications.length - deduplicatedNotifications.length
      }

    } catch (error) {
      console.error('NotificationService: Error in createBulkNotifications:', error)
      throw error
    }
  }

  /**
   * 通知去重检查
   * @param {Array} notifications - 通知数据数组
   * @returns {Array} 去重后的通知数组
   */
  async deduplicateNotifications(notifications) {
    try {
      const uniqueNotifications = []

      for (const notification of notifications) {
        // 检查是否已存在相同的通知（24小时内）
        const existingNotification = await Notification.findOne({
          where: {
            receiver_phone: notification.receiver_phone,
            type: notification.type,
            related_user_phone: notification.related_user_phone,
            related_content_id: notification.related_content_id,
            related_content_type: notification.related_content_type,
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
            }
          }
        })

        if (!existingNotification) {
          uniqueNotifications.push(notification)
        } else {
          console.log(`NotificationService: Duplicate notification skipped for ${notification.receiver_phone}`)
        }
      }

      return uniqueNotifications

    } catch (error) {
      console.error('NotificationService: Error in deduplicateNotifications:', error)
      // 如果去重检查失败，返回原始数组（保证通知能够发送）
      return notifications
    }
  }

  /**
   * 创建系统通知
   * @param {Object} notificationData - 通知数据
   */
  async createSystemNotification(notificationData) {
    try {
      const notification = {
        notification_id: idGenerator.generateNotificationId(),
        receiver_phone: notificationData.receiver_phone || null, // null表示广播通知
        type: notificationData.type || 'system',
        priority: notificationData.priority || 'medium',
        title: notificationData.title,
        content: notificationData.content,
        action_type: notificationData.action_type || 'none',
        action_url: notificationData.action_url || null,
        action_params: notificationData.action_params || null,
        expires_at: notificationData.expires_at || null,
        is_read: false
      }

      const result = await Notification.create(notification)
      
      console.log(`NotificationService: Successfully created system notification ${result.notification_id}`)
      
      return {
        success: true,
        notification_id: result.notification_id
      }

    } catch (error) {
      console.error('NotificationService: Error in createSystemNotification:', error)
      throw error
    }
  }
}

module.exports = new NotificationService()