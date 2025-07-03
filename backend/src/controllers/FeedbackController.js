const Feedback = require('../models/Feedback')
const { Op } = require('sequelize')

class FeedbackController {
  // 用户提交反馈
  static async createFeedback(req, res) {
    try {
      const { type, content, contact, images } = req.body
      const user_phone = req.user.phone_number
      if (!type || !content || content.length < 10) {
        return res.status(400).json({ success: false, message: '反馈内容不完整' })
      }
      const feedback = await Feedback.create({
        user_phone,
        type,
        content,
        contact,
        images: images ? JSON.stringify(images) : null
      })
      res.json({ success: true, data: feedback })
    } catch (error) {
      res.status(500).json({ success: false, message: '提交反馈失败', error: error.message })
    }
  }

  // 获取当前用户的反馈记录
  static async getMyFeedback(req, res) {
    try {
      const user_phone = req.user.phone_number
      const { User } = require('../models')
      
      const feedbacks = await Feedback.findAll({
        where: { user_phone },
        include: [
          {
            model: User,
            as: 'replier',
            attributes: ['name', 'nickname', 'phone_number'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      })
      
      // images字段转数组，并格式化回复者信息
      const result = feedbacks.map(fb => {
        const obj = fb.toJSON()
        obj.images = obj.images ? JSON.parse(obj.images) : []
        
        // 格式化回复者信息
        if (obj.replier) {
          obj.replierName = obj.replier.nickname || obj.replier.name || '管理员'
        }
        
        return obj
      })
      
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ success: false, message: '获取反馈失败', error: error.message })
    }
  }
}

module.exports = FeedbackController 