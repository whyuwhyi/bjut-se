const Post = require('../models/Post')
const PostTag = require('../models/PostTag')
const PostTagRelation = require('../models/PostTagRelation')
const Comment = require('../models/Comment')
const User = require('../models/User')
const { Op } = require('sequelize')

class PostController {
  static generatePostId() {
    return 'POST' + Date.now().toString().slice(-5)
  }

  static generateTagId() {
    return 'TAG' + Date.now().toString().slice(-6)
  }

  static async getAllPosts(req, res) {
    try {
      const { page = 1, limit = 20, search, tag, sortBy = 'latest' } = req.query
      const offset = (page - 1) * limit

      let whereClause = { status: 'active' }
      let tagFilter = null
      
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } }
        ]
      }

      if (tag) {
        tagFilter = { tag_name: tag }
      }

      let orderClause = []
      switch (sortBy) {
        case 'view':
          orderClause = [['view_count', 'DESC']]
          break
        case 'collection':
          orderClause = [['collection_count', 'DESC']]
          break
        case 'comment':
          orderClause = [['comment_count', 'DESC']]
          break
        case 'latest':
        default:
          orderClause = [['created_at', 'DESC']]
          break
      }

      const posts = await Post.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          },
          {
            model: PostTag,
            as: 'tags',
            attributes: ['tag_id', 'tag_name', 'tag_color'],
            through: { attributes: [] },
            ...(tagFilter ? { where: tagFilter } : {})
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      })

      const totalPages = Math.ceil(posts.count / limit)

      res.status(200).json({
        success: true,
        message: '获取帖子列表成功',
        data: {
          posts: posts.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: posts.count,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('获取帖子列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取帖子列表失败',
        errors: [error.message]
      })
    }
  }

  static async getPostById(req, res) {
    try {
      const { id } = req.params

      const post = await Post.findOne({
        where: { post_id: id, status: 'active' },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          },
          {
            model: PostTag,
            as: 'tags',
            attributes: ['tag_id', 'tag_name', 'tag_color'],
            through: { attributes: [] }
          }
        ]
      })

      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        })
      }

      await post.increment('view_count')

      res.status(200).json({
        success: true,
        message: '获取帖子详情成功',
        data: post
      })
    } catch (error) {
      console.error('获取帖子详情失败:', error)
      res.status(500).json({
        success: false,
        message: '获取帖子详情失败',
        errors: [error.message]
      })
    }
  }

  static async createPost(req, res) {
    try {
      const { title, content, tags = [] } = req.body
      const authorPhone = req.user.phone_number

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: '标题和内容不能为空'
        })
      }

      const postId = PostController.generatePostId()

      const post = await Post.create({
        post_id: postId,
        author_phone: authorPhone,
        title,
        content,
        status: 'active'
      })

      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          let tag = await PostTag.findOne({ where: { tag_name: tagName } })
          
          if (!tag) {
            const tagId = PostController.generateTagId()
            tag = await PostTag.create({
              tag_id: tagId,
              tag_name: tagName,
              status: 'active'
            })
          }

          await PostTagRelation.create({
            post_id: postId,
            tag_id: tag.tag_id
          })

          await tag.increment('usage_count')
        }
      }

      const newPost = await Post.findOne({
        where: { post_id: postId },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          },
          {
            model: PostTag,
            as: 'tags',
            attributes: ['tag_id', 'tag_name', 'tag_color'],
            through: { attributes: [] }
          }
        ]
      })

      res.status(201).json({
        success: true,
        message: '发布帖子成功',
        data: newPost
      })
    } catch (error) {
      console.error('发布帖子失败:', error)
      res.status(500).json({
        success: false,
        message: '发布帖子失败',
        errors: [error.message]
      })
    }
  }

  static async getAllTags(req, res) {
    try {
      const tags = await PostTag.findAll({
        where: { status: 'active' },
        order: [['usage_count', 'DESC'], ['created_at', 'DESC']],
        attributes: ['tag_id', 'tag_name', 'tag_color', 'usage_count']
      })

      res.status(200).json({
        success: true,
        message: '获取标签列表成功',
        data: tags
      })
    } catch (error) {
      console.error('获取标签列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取标签列表失败',
        errors: [error.message]
      })
    }
  }

  static async getPostComments(req, res) {
    try {
      const { id } = req.params
      const { page = 1, limit = 20 } = req.query
      const offset = (page - 1) * limit

      const comments = await Comment.findAndCountAll({
        where: { 
          post_id: id, 
          status: 'active',
          parent_comment_id: null
        },
        attributes: ['comment_id', 'author_phone', 'post_id', 'resource_id', 'parent_comment_id', 'content', 'status', 'created_at', 'updated_at'],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      })

      const totalPages = Math.ceil(comments.count / limit)

      res.status(200).json({
        success: true,
        message: '获取评论列表成功',
        data: {
          comments: comments.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: comments.count,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('获取评论列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取评论列表失败',
        errors: [error.message]
      })
    }
  }

  static async createComment(req, res) {
    try {
      const { id } = req.params
      const { content, parent_comment_id } = req.body
      const authorPhone = req.user.phone_number

      if (!content) {
        return res.status(400).json({
          success: false,
          message: '评论内容不能为空'
        })
      }

      const post = await Post.findOne({ where: { post_id: id, status: 'active' } })
      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        })
      }

      const comment = await Comment.create({
        author_phone: authorPhone,
        post_id: id,
        content,
        parent_comment_id: parent_comment_id || null,
        status: 'active'
      })

      await post.increment('comment_count')

      const newComment = await Comment.findOne({
        where: { comment_id: comment.comment_id },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['phone_number', 'name', 'nickname', 'avatar_url']
          }
        ]
      })

      res.status(201).json({
        success: true,
        message: '发表评论成功',
        data: newComment
      })
    } catch (error) {
      console.error('发表评论失败:', error)
      res.status(500).json({
        success: false,
        message: '发表评论失败',
        errors: [error.message]
      })
    }
  }
}

module.exports = PostController