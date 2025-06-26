const { Tag } = require('../models')
const { Op } = require('sequelize')

class TagController {
  // 获取所有标签
  async getAllTags(req, res) {
    try {
      const { category, limit = 50 } = req.query

      const where = {
        status: 'active'
      }

      if (category) {
        where.category = category
      }

      const tags = await Tag.findAll({
        where,
        order: [['usage_count', 'DESC'], ['tag_name', 'ASC']],
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: tags
      })
    } catch (error) {
      console.error('获取标签列表错误:', error)
      res.status(500).json({
        success: false,
        message: '获取标签列表失败',
        error: error.message
      })
    }
  }

  // 获取标签分类
  async getTagCategories(req, res) {
    try {
      const categories = await Tag.findAll({
        attributes: [
          'category',
          [Tag.sequelize.fn('COUNT', Tag.sequelize.col('tag_id')), 'count']
        ],
        where: {
          status: 'active',
          category: {
            [Op.ne]: null
          }
        },
        group: ['category'],
        order: [['category', 'ASC']]
      })

      res.json({
        success: true,
        data: categories
      })
    } catch (error) {
      console.error('获取标签分类错误:', error)
      res.status(500).json({
        success: false,
        message: '获取标签分类失败',
        error: error.message
      })
    }
  }

  // 搜索标签
  async searchTags(req, res) {
    try {
      const { keyword, limit = 20 } = req.query

      if (!keyword) {
        return res.json({
          success: true,
          data: []
        })
      }

      const tags = await Tag.findAll({
        where: {
          status: 'active',
          tag_name: {
            [Op.like]: `%${keyword}%`
          }
        },
        order: [['usage_count', 'DESC'], ['tag_name', 'ASC']],
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: tags
      })
    } catch (error) {
      console.error('搜索标签错误:', error)
      res.status(500).json({
        success: false,
        message: '搜索标签失败',
        error: error.message
      })
    }
  }
}

module.exports = new TagController()