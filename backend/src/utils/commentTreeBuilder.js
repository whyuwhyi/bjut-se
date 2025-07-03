const { Comment, User } = require('../models')

/**
 * 递归构建无限级嵌套回复树
 */
class CommentTreeBuilder {
  /**
   * 构建评论树结构
   * @param {string} postId - 帖子ID（可选）
   * @param {string} resourceId - 资源ID（可选）
   * @param {number} limit - 分页限制
   * @param {number} offset - 分页偏移
   * @returns {Promise<Object>} 包含评论树的结果
   */
  static async buildCommentTree(postId = null, resourceId = null, limit = 20, offset = 0) {
    try {
      // 构建查询条件
      const whereCondition = {
        status: 'active',
        parent_comment_id: null // 只获取顶级评论
      }
      
      if (postId) {
        whereCondition.post_id = postId
      }
      
      if (resourceId) {
        whereCondition.resource_id = resourceId
      }

      // 获取顶级评论
      const { count, rows: topLevelComments } = await Comment.findAndCountAll({
        where: whereCondition,
        include: [{
          model: User,
          as: 'author',
          attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      // 为每个顶级评论递归构建回复树
      const commentsWithReplies = await Promise.all(
        topLevelComments.map(async (comment) => {
          const commentData = comment.toJSON()
          
          // 统一字段命名，兼容前端
          commentData.userName = commentData.author ? 
            (commentData.author.nickname || commentData.author.name || '') : ''
          commentData.userPhone = commentData.author ? commentData.author.phone_number : ''
          commentData.userAvatar = commentData.author ? commentData.author.avatar_url : ''
          commentData.createTime = commentData.created_at
          
          commentData.replies = await this.buildNestedReplies(comment.comment_id)
          return commentData
        })
      )

      return {
        comments: commentsWithReplies,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('构建评论树失败:', error)
      throw error
    }
  }

  /**
   * 递归构建嵌套回复
   * @param {number} parentCommentId - 父评论ID
   * @param {number} depth - 当前深度（用于防止无限递归）
   * @returns {Promise<Array>} 嵌套回复数组
   */
  static async buildNestedReplies(parentCommentId, depth = 0) {
    // 防止过深递归（最大50层）
    if (depth > 50) {
      console.warn('评论嵌套层级过深，已停止递归')
      return []
    }

    try {
      // 获取当前评论的直接回复
      const replies = await Comment.findAll({
        where: {
          parent_comment_id: parentCommentId,
          status: 'active'
        },
        include: [{
          model: User,
          as: 'author',
          attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
        }],
        order: [['created_at', 'ASC']] // 回复按时间正序排列
      })

      // 为每个回复递归构建子回复并添加reply_to_name
      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => {
          const replyData = reply.toJSON()
          
          // 统一字段命名，兼容前端
          replyData.userName = replyData.author ? 
            (replyData.author.nickname || replyData.author.name || '') : ''
          replyData.userPhone = replyData.author ? replyData.author.phone_number : ''
          replyData.userAvatar = replyData.author ? replyData.author.avatar_url : ''
          replyData.createTime = replyData.created_at
          
          // 设置reply_to_name和被回复的内容
          if (reply.parent_comment_id) {
            const parent = await Comment.findByPk(reply.parent_comment_id, {
              include: [{
                model: User,
                as: 'author',
                attributes: ['nickname', 'name']
              }]
            })
            replyData.replyToName = parent && parent.author ? 
              (parent.author.nickname || parent.author.name || '') : ''
            // 添加被回复的内容，截取前50个字符
            replyData.replyToContent = parent ? 
              (parent.content.length > 50 ? parent.content.substring(0, 50) + '...' : parent.content) : ''
          } else {
            replyData.replyToName = ''
            replyData.replyToContent = ''
          }

          // 递归构建子回复
          replyData.replies = await this.buildNestedReplies(reply.comment_id, depth + 1)
          
          return replyData
        })
      )

      return repliesWithNested
    } catch (error) {
      console.error('构建嵌套回复失败:', error)
      return []
    }
  }

  /**
   * 获取评论的完整路径（用于显示回复链）
   * @param {number} commentId - 评论ID
   * @returns {Promise<Array>} 评论路径数组
   */
  static async getCommentPath(commentId) {
    try {
      const path = []
      let currentComment = await Comment.findByPk(commentId, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['nickname', 'name']
        }]
      })

      while (currentComment) {
        path.unshift({
          comment_id: currentComment.comment_id,
          author_name: currentComment.author ? 
            (currentComment.author.nickname || currentComment.author.name) : '',
          content: currentComment.content.substring(0, 50) + '...'
        })

        if (currentComment.parent_comment_id) {
          currentComment = await Comment.findByPk(currentComment.parent_comment_id, {
            include: [{
              model: User,
              as: 'author',
              attributes: ['nickname', 'name']
            }]
          })
        } else {
          break
        }
      }

      return path
    } catch (error) {
      console.error('获取评论路径失败:', error)
      return []
    }
  }
}

module.exports = CommentTreeBuilder