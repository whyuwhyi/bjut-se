const { Rating, User, Resource } = require('../models')
const { Op } = require('sequelize')

class RatingController {
  // 创建或更新评分
  async createOrUpdateRating(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params
      const { rating, review_text } = req.body

      // 验证评分范围
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: '评分必须在1-5之间'
        })
      }

      // 检查资源是否存在
      const resource = await Resource.findByPk(resourceId)
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      // 查找或创建评分记录
      const [ratingRecord, created] = await Rating.findOrCreate({
        where: {
          user_phone: userPhone,
          resource_id: resourceId
        },
        defaults: {
          rating,
          review_text
        }
      })

      // 如果不是新创建的，更新评分
      if (!created) {
        await ratingRecord.update({
          rating,
          review_text
        })
      }

      // 重新计算资源平均评分
      const result = await Rating.findOne({
        where: { resource_id: resourceId },
        attributes: [
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('rating')), 'avgRating'],
          [Rating.sequelize.fn('COUNT', Rating.sequelize.col('rating')), 'ratingCount']
        ]
      })

      if (result) {
        const avgRating = parseFloat(result.dataValues.avgRating || 0)
        await Resource.update(
          { rating: avgRating },
          { where: { resource_id: resourceId } }
        )
      }

      // 返回完整的评分信息
      const fullRating = await Rating.findByPk(ratingRecord.rating_id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['name', 'nickname']
        }]
      })

      res.status(created ? 201 : 200).json({
        success: true,
        message: created ? '评分成功' : '评分已更新',
        data: fullRating
      })
    } catch (error) {
      console.error('评分错误:', error)
      res.status(500).json({
        success: false,
        message: '评分失败',
        error: error.message
      })
    }
  }

  // 获取资源评分列表
  async getResourceRatings(req, res) {
    try {
      const { resourceId } = req.params
      const { page = 1, limit = 10 } = req.query

      const offset = (page - 1) * limit

      const { count, rows } = await Rating.findAndCountAll({
        where: { resource_id: resourceId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['name', 'nickname']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      res.json({
        success: true,
        data: {
          ratings: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      console.error('获取评分列表错误:', error)
      res.status(500).json({
        success: false,
        message: '获取评分失败',
        error: error.message
      })
    }
  }

  // 获取用户对资源的评分
  async getUserRating(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params

      const rating = await Rating.findOne({
        where: {
          user_phone: userPhone,
          resource_id: resourceId
        }
      })

      res.json({
        success: true,
        data: rating
      })
    } catch (error) {
      console.error('获取用户评分错误:', error)
      res.status(500).json({
        success: false,
        message: '获取用户评分失败',
        error: error.message
      })
    }
  }

  // 更新资源平均评分
  async updateResourceRating(resourceId) {
    try {
      const result = await Rating.findOne({
        where: { resource_id: resourceId },
        attributes: [
          [Rating.sequelize.fn('AVG', Rating.sequelize.col('rating')), 'avgRating'],
          [Rating.sequelize.fn('COUNT', Rating.sequelize.col('rating')), 'ratingCount']
        ]
      })

      if (result) {
        const avgRating = parseFloat(result.dataValues.avgRating || 0)
        await Resource.update(
          { rating: avgRating },
          { where: { resource_id: resourceId } }
        )
      }
    } catch (error) {
      console.error('更新资源评分错误:', error)
    }
  }
}

module.exports = new RatingController()