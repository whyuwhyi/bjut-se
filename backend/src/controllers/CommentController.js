const { Comment, User, Resource } = require('../models')

class CommentController {
  // 创建评论
  async createComment(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params
      const { comment_content, parent_comment_id } = req.body

      // 检查资源是否存在
      const resource = await Resource.findByPk(resourceId)
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      // 创建评论
      const comment = await Comment.create({
        author_phone: userPhone,
        resource_id: resourceId,
        parent_comment_id: parent_comment_id || null,
        content: comment_content,
        status: 'active'
      })

      // 更新资源评论数量
      await resource.increment('comment_count')

      // 返回完整的评论信息
      const fullComment = await Comment.findByPk(comment.comment_id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['name', 'nickname', 'avatar_url']
        }]
      })

      res.status(201).json({
        success: true,
        message: '评论成功',
        data: fullComment
      })
    } catch (error) {
      console.error('创建评论错误:', error)
      res.status(500).json({
        success: false,
        message: '评论失败',
        error: error.message
      })
    }
  }

  // 获取资源评论列表
  async getResourceComments(req, res) {
    try {
      const { resourceId } = req.params
      const { page = 1, limit = 10 } = req.query

      const offset = (page - 1) * limit

      const { count, rows } = await Comment.findAndCountAll({
        where: {
          resource_id: resourceId,
          status: 'active',
          parent_comment_id: null // 只获取顶级评论
        },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['name', 'nickname', 'avatar_url']
          },
          {
            model: Comment,
            as: 'replies',
            include: [{
              model: User,
              as: 'author',
              attributes: ['name', 'nickname', 'avatar_url']
            }]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      // 为每条回复补充 reply_to_name 字段
      for (const comment of rows) {
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            if (reply.parent_comment_id) {
              const parent = await Comment.findByPk(reply.parent_comment_id, {
                include: [{ model: User, as: 'author', attributes: ['nickname', 'name'] }]
              })
              reply.dataValues.reply_to_name = parent && parent.author ? (parent.author.nickname || parent.author.name || '') : ''
            } else {
              reply.dataValues.reply_to_name = ''
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          comments: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      console.error('获取评论列表错误:', error)
      res.status(500).json({
        success: false,
        message: '获取评论失败',
        error: error.message
      })
    }
  }

}

module.exports = new CommentController()