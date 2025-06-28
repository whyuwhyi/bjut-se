const { Collection, Resource, Post } = require('../models')

class CollectionController {
  // 切换收藏状态（收藏/取消收藏）
  async toggleCollection(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params
      const { type = 'resource' } = req.body
      

      // 验证收藏类型
      if (!['post', 'resource'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: '收藏类型无效'
        })
      }

      // 检查内容是否存在
      if (type === 'resource') {
        const resource = await Resource.findByPk(resourceId)
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: '资源不存在'
          })
        }
      } else if (type === 'post') {
        const post = await Post.findOne({ where: { post_id: resourceId } })
        if (!post) {
          return res.status(404).json({
            success: false,
            message: '帖子不存在'
          })
        }
      }

      // 查找现有收藏记录
      const existingCollection = await Collection.findOne({
        where: {
          user_phone: userPhone,
          content_id: resourceId,
          collection_type: type
        }
      })

      let isCollected = false

      if (existingCollection) {
        // 如果已收藏，切换状态
        if (existingCollection.status === 'active') {
          await existingCollection.update({ status: 'cancelled' })
          isCollected = false
          // 更新收藏计数
          if (type === 'resource') {
            await Resource.decrement('collection_count', { where: { resource_id: resourceId } })
          } else if (type === 'post') {
            await Post.decrement('collection_count', { where: { post_id: resourceId } })
          }
        } else {
          await existingCollection.update({ status: 'active' })
          isCollected = true
          // 更新收藏计数
          if (type === 'resource') {
            await Resource.increment('collection_count', { where: { resource_id: resourceId } })
          } else if (type === 'post') {
            await Post.increment('collection_count', { where: { post_id: resourceId } })
          }
        }
      } else {
        // 如果没有收藏记录，创建新的
        const collectionId = Math.floor(100000000 + Math.random() * 900000000).toString()
        await Collection.create({
          collection_id: collectionId,
          user_phone: userPhone,
          content_id: resourceId,
          collection_type: type,
          status: 'active'
        })
        isCollected = true
        // 更新收藏计数
        if (type === 'resource') {
          await Resource.increment('collection_count', { where: { resource_id: resourceId } })
        } else if (type === 'post') {
          await Post.increment('collection_count', { where: { post_id: resourceId } })
        }
      }

      res.json({
        success: true,
        message: isCollected ? '收藏成功' : '取消收藏成功',
        data: {
          isCollected
        }
      })
    } catch (error) {
      console.error('切换收藏状态错误:', {
        error: error.message,
        stack: error.stack,
        userPhone: req.user?.phone_number,
        resourceId: req.params.resourceId,
        type: req.body?.type,
        url: req.originalUrl
      })
      res.status(500).json({
        success: false,
        message: '操作失败',
        error: error.message
      })
    }
  }

  // 检查收藏状态
  async checkCollectionStatus(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params
      const { type = 'resource' } = req.query

      const collection = await Collection.findOne({
        where: {
          user_phone: userPhone,
          content_id: resourceId,
          collection_type: type,
          status: 'active'
        }
      })

      res.json({
        success: true,
        data: {
          isCollected: !!collection
        }
      })
    } catch (error) {
      console.error('检查收藏状态错误:', error)
      res.status(500).json({
        success: false,
        message: '检查收藏状态失败',
        error: error.message
      })
    }
  }

  // 获取用户收藏列表
  async getUserCollections(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { type, page = 1, limit = 10 } = req.query

      const whereClause = {
        user_phone: userPhone,
        status: 'active'
      }

      if (type && ['post', 'resource'].includes(type)) {
        whereClause.collection_type = type
      }

      const offset = (page - 1) * limit

      const { count, rows } = await Collection.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      res.json({
        success: true,
        data: {
          collections: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      console.error('获取收藏列表错误:', error)
      res.status(500).json({
        success: false,
        message: '获取收藏列表失败',
        error: error.message
      })
    }
  }

  // 生成收藏ID
  generateCollectionId() {
    return String(Math.floor(100000000 + Math.random() * 900000000))
  }
}

module.exports = new CollectionController()