const { Category } = require('../models')

class CategoryController {
  // 获取所有分类
  async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll({
        where: { status: 'active' },
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
        attributes: ['category_id', 'category_name', 'category_value', 'description', 'icon', 'sort_order']
      })

      res.json({
        success: true,
        data: categories
      })
    } catch (error) {
      console.error('获取分类列表错误:', error)
      res.status(500).json({
        success: false,
        message: '获取分类列表失败',
        error: error.message
      })
    }
  }

  // 获取分类选项（用于下拉框）
  async getCategoryOptions(req, res) {
    try {
      const categories = await Category.findAll({
        where: { status: 'active' },
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
        attributes: ['category_id', 'category_value', 'category_name', 'icon']
      })

      // 格式化为前端需要的格式
      const options = categories.map(cat => ({
        value: cat.category_value,
        name: cat.category_name,
        icon: cat.icon,
        category_id: cat.category_id
      }))

      res.json({
        success: true,
        data: options
      })
    } catch (error) {
      console.error('获取分类选项错误:', error)
      res.status(500).json({
        success: false,
        message: '获取分类选项失败',
        error: error.message
      })
    }
  }

  // 根据分类值获取分类信息
  async getCategoryByValue(req, res) {
    try {
      const { value } = req.params

      const category = await Category.findOne({
        where: {
          category_value: value,
          status: 'active'
        }
      })

      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        })
      }

      res.json({
        success: true,
        data: category
      })
    } catch (error) {
      console.error('获取分类信息错误:', error)
      res.status(500).json({
        success: false,
        message: '获取分类信息失败',
        error: error.message
      })
    }
  }
}

module.exports = new CategoryController()