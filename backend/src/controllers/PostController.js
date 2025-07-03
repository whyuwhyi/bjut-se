const Post = require('../models/Post')
const PostTag = require('../models/PostTag')
const PostTagRelation = require('../models/PostTagRelation')
const Comment = require('../models/Comment')
const User = require('../models/User')
const Collection = require('../models/Collection')
const { Op } = require('sequelize')
const idGenerator = require('../utils/IdGenerator')
const searchHelper = require('../utils/SearchHelper')
const searchCache = require('../utils/RedisSearchCache')
const CommentTreeBuilder = require('../utils/commentTreeBuilder')
const NotificationService = require('../services/NotificationService')

class PostController {

  static async getAllPosts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        tag, 
        tags,
        sortBy = 'relevance',
        sortOrder = 'DESC',
        // 新增高级筛选参数
        dateFrom,
        dateTo,
        minViews,
        maxViews,
        tagLogic = 'OR'
      } = req.query
      
      // 构建缓存键参数
      const cacheParams = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search,
        tag,
        tags,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        minViews: minViews ? parseInt(minViews) : undefined,
        maxViews: maxViews ? parseInt(maxViews) : undefined,
        tagLogic
      }
      
      // 尝试从缓存获取结果
      const cachedResult = await searchCache.get('search', cacheParams)
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult
        })
      }
      
      const offset = (page - 1) * limit
      let whereClause = { status: 'active' }
      
      // 智能搜索条件 - 使用JOIN查询支持关联表搜索
      if (search) {
        const searchCondition = searchHelper.buildPostSearchCondition(search, {
          includeRelated: true // 启用关联表搜索，配合subQuery: false使用
        })
        if (searchCondition && (Object.keys(searchCondition).length > 0 || Object.getOwnPropertySymbols(searchCondition).length > 0)) {
          Object.assign(whereClause, searchCondition)
        }
      }

      // 高级筛选条件
      const advancedFilters = searchHelper.buildAdvancedFilters({
        dateFrom,
        dateTo,
        minViews,
        maxViews
      })
      Object.assign(whereClause, advancedFilters)

      // 标签筛选逻辑
      let tagFilter = null
      if (tag) {
        tagFilter = { tag_name: tag }
      } else if (tags) {
        tagFilter = searchHelper.buildTagFilters(tags, tagLogic)
      }
      // 注意：搜索条件中的标签搜索已经通过主查询的where条件处理了

      // 智能排序条件
      const orderClause = searchHelper.buildSortCondition(sortBy, sortOrder, search)

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
        distinct: true,
        subQuery: false // 禁用子查询，使用JOIN查询支持关联表搜索
      })

      const totalPages = Math.ceil(posts.count / limit)

      // 格式化返回数据并计算相关性评分
      let formattedPosts = posts.rows.map(post => {
        const data = post.toJSON()
        const formatted = {
          ...data,
          // 新增字段
          authorAvatar: data.author?.avatar_url,
          tagCount: data.tags?.length || 0
        }

        // 计算相关性评分（如果有搜索词）
        if (search) {
          formatted.relevanceScore = searchHelper.calculateRelevanceScore({
            title: data.title,
            content: data.content,
            tags: data.tags,
            author_name: data.author?.nickname || data.author?.name,
            view_count: data.view_count,
            collection_count: data.collection_count,
            comment_count: data.comment_count
          }, search, 'post')

          // 高亮搜索关键词
          formatted.titleHighlighted = searchHelper.highlightKeywords(formatted.title, search)
          formatted.contentHighlighted = searchHelper.highlightKeywords(formatted.content, search)
        }

        return formatted
      })

      // 如果有搜索词且按相关性排序，重新排序结果
      if (search && sortBy === 'relevance') {
        formattedPosts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      }

      const responseData = {
        posts: formattedPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: posts.count,
          itemsPerPage: parseInt(limit)
        }
      }
      
      // 将结果存储到缓存
      await searchCache.set('search', cacheParams, responseData)

      res.status(200).json({
        success: true,
        message: '获取帖子列表成功',
        data: responseData
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
      
      // 重新获取帖子最新数据
      await post.reload()
      
      // 更新缓存中的统计数据
      try {
        await updatePostStatsInCache(id, { viewCount: post.view_count, view_count: post.view_count })
      } catch (cacheError) {
        console.error('更新帖子浏览缓存失败:', cacheError)
      }

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

      const postId = idGenerator.generatePostId()

      const post = await Post.create({
        post_id: postId,
        author_phone: authorPhone,
        title,
        content,
        status: 'active'
      })

      await User.increment('post_count', { where: { phone_number: authorPhone } })

      if (tags && tags.length > 0) {
        // 验证所有标签都存在且为活跃状态
        const validTags = await PostTag.findAll({
          where: { 
            tag_name: { [Op.in]: tags },
            status: 'active'
          }
        })

        // 检查是否有无效标签
        const validTagNames = validTags.map(tag => tag.tag_name)
        const invalidTags = tags.filter(tagName => !validTagNames.includes(tagName))
        
        if (invalidTags.length > 0) {
          return res.status(400).json({
            success: false,
            message: `标签不存在或已禁用: ${invalidTags.join(', ')}`
          })
        }

        // 为帖子添加标签关联
        for (const tag of validTags) {
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

      // 清除相关缓存
      await searchCache.invalidate('post', 'create')

      // 异步推送通知给关注者
      try {
        await NotificationService.notifyFollowersAboutNewContent(
          authorPhone,
          'post',
          postId,
          title
        )
      } catch (notificationError) {
        // 通知推送失败不影响帖子发布成功
        console.error('推送关注者通知失败:', notificationError)
      }

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

      // 使用CommentTreeBuilder构建无限级嵌套回复
      const result = await CommentTreeBuilder.buildCommentTree(id, null, limit, offset)

      res.status(200).json({
        success: true,
        message: '获取评论列表成功',
        data: result
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

  static async deletePost(req, res) {
    try {
      const { id } = req.params
      const userPhone = req.user.phone_number

      // 查找帖子
      const post = await Post.findOne({
        where: { 
          post_id: id,
          status: { [Op.in]: ['active', 'hidden'] }
        }
      })

      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在或已被删除'
        })
      }

      // 验证权限：只能删除自己的帖子
      if (post.author_phone !== userPhone) {
        return res.status(403).json({
          success: false,
          message: '您没有权限删除这个帖子'
        })
      }

      // 软删除：将状态改为deleted
      await post.update({ status: 'deleted' })

      // 递减帖子计数（由于查询条件已确保帖子状态为active/hidden，所以安全递减）
      await User.decrement('post_count', { where: { phone_number: userPhone }, min: 0 })

      // 清除相关缓存
      await searchCache.invalidate('post', 'delete')

      res.status(200).json({
        success: true,
        message: '删除帖子成功'
      })
    } catch (error) {
      console.error('删除帖子失败:', error)
      res.status(500).json({
        success: false,
        message: '删除帖子失败',
        errors: [error.message]
      })
    }
  }

  // 切换收藏状态
  static async toggleFavorite(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { postId } = req.params
      const { type = 'post' } = req.body

      // 检查帖子是否存在
      const post = await Post.findOne({ where: { post_id: postId } })
      if (!post) {
        return res.status(404).json({
          success: false,
          message: '帖子不存在'
        })
      }

      // 查找现有收藏记录
      const existingCollection = await Collection.findOne({
        where: {
          user_phone: userPhone,
          content_id: postId,
          collection_type: 'post'
        }
      })

      let isCollected = false

      if (existingCollection) {
        // 如果已收藏，切换状态
        if (existingCollection.status === 'active') {
          await existingCollection.update({ status: 'cancelled' })
          isCollected = false
          // 更新收藏计数
          await Post.decrement('collection_count', { where: { post_id: postId } })
        } else {
          await existingCollection.update({ status: 'active' })
          isCollected = true
          // 更新收藏计数
          await Post.increment('collection_count', { where: { post_id: postId } })
        }
      } else {
        // 如果没有收藏记录，创建新的
        const collectionId = idGenerator.generateCollectionId()
        await Collection.create({
          collection_id: collectionId,
          user_phone: userPhone,
          content_id: postId,
          collection_type: 'post',
          status: 'active'
        })
        isCollected = true
        // 更新收藏计数
        await Post.increment('collection_count', { where: { post_id: postId } })
      }
      
      // 重新获取帖子最新数据
      await post.reload()
      
      // 更新缓存中的收藏统计数据
      try {
        await updatePostStatsInCache(postId, { 
          collection_count: post.collection_count,
          favoriteCount: post.collection_count
        })
      } catch (cacheError) {
        console.error('更新帖子收藏缓存失败:', cacheError)
      }

      res.json({
        success: true,
        message: isCollected ? '收藏成功' : '取消收藏成功',
        data: {
          isCollected,
          collection_count: post.collection_count
        }
      })
    } catch (error) {
      console.error('切换收藏状态错误:', error)
      res.status(500).json({
        success: false,
        message: '操作失败',
        error: error.message
      })
    }
  }

  // 检查收藏状态
  static async checkFavoriteStatus(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { postId } = req.params

      const collection = await Collection.findOne({
        where: {
          user_phone: userPhone,
          content_id: postId,
          collection_type: 'post',
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

  // 获取搜索建议
  static async getSearchSuggestions(req, res) {
    try {
      const { q: searchTerm } = req.query
      
      // 获取热门搜索关键词（可以从数据库统计）
      const hotKeywords = [
        '学习方法', '考试技巧', '编程', '算法', '数据结构',
        '就业指导', '实习经验', '项目分享', '技术讨论', '生活分享'
      ]
      
      const searchHistory = [] // 可以从用户session或数据库获取
      
      const suggestions = searchHelper.generateSearchSuggestions(
        searchTerm, 
        searchHistory, 
        hotKeywords
      )
      
      res.json({
        success: true,
        data: {
          suggestions,
          hotKeywords: hotKeywords.slice(0, 5)
        }
      })
    } catch (error) {
      console.error('获取搜索建议错误:', error)
      res.status(500).json({
        success: false,
        message: '获取搜索建议失败',
        error: error.message
      })
    }
  }

  // 获取高级筛选选项
  static async getFilterOptions(req, res) {
    try {
      // 获取所有标签
      const tags = await PostTag.findAll({
        where: { status: 'active' },
        attributes: ['tag_id', 'tag_name', 'tag_color', 'usage_count'],
        order: [['usage_count', 'DESC'], ['tag_name', 'ASC']]
      })

      // 获取作者统计（可选）
      const topAuthors = await User.findAll({
        attributes: ['phone_number', 'name', 'nickname', 'post_count'],
        where: { post_count: { [Op.gt]: 0 } },
        order: [['post_count', 'DESC']],
        limit: 10
      })

      res.json({
        success: true,
        data: {
          tags: tags.map(tag => ({
            id: tag.tag_id,
            name: tag.tag_name,
            color: tag.tag_color,
            count: tag.usage_count
          })),
          topAuthors: topAuthors.map(author => ({
            phone: author.phone_number,
            name: author.nickname || author.name,
            postCount: author.post_count
          })),
          tagLogicOptions: [
            { value: 'OR', label: '包含任一标签' },
            { value: 'AND', label: '包含所有标签' }
          ],
          sortOptions: [
            { value: 'relevance', label: '相关性' },
            { value: 'latest', label: '最新发布' },
            { value: 'view', label: '浏览最多' },
            { value: 'collection', label: '收藏最多' },
            { value: 'comment', label: '评论最多' }
          ]
        }
      })
    } catch (error) {
      console.error('获取筛选选项错误:', error)
      res.status(500).json({
        success: false,
        message: '获取筛选选项失败',
        error: error.message
      })
    }
  }
}

// 辅助函数：更新缓存中的帖子统计数据
async function updatePostStatsInCache(postId, statsUpdate) {
  try {
    // 获取所有搜索缓存键
    const cacheKeys = await searchCache.getKeys('search')
    
    if (cacheKeys.length === 0) {
      console.log('没有找到相关缓存，跳过更新')
      return
    }
    
    let updatedCount = 0
    
    for (const key of cacheKeys) {
      const cachedData = await searchCache.getByKey(key)
      if (cachedData && cachedData.posts && Array.isArray(cachedData.posts)) {
        let updated = false
        const updatedPosts = cachedData.posts.map(post => {
          if (post.id === postId || post.post_id === postId) {
            updated = true
            return {
              ...post,
              ...statsUpdate
            }
          }
          return post
        })
        
        if (updated) {
          // 更新缓存中的数据
          await searchCache.setByKey(key, {
            ...cachedData,
            posts: updatedPosts
          })
          updatedCount++
        }
      }
    }
    
    console.log(`成功更新了 ${updatedCount} 个帖子缓存条目的统计数据`)
  } catch (error) {
    console.error('更新帖子缓存统计数据失败:', error)
    // 如果更新失败，降级为清除相关缓存
    try {
      await searchCache.clearPattern('search')
      console.log('降级清除了搜索缓存')
    } catch (clearError) {
      console.error('清除缓存也失败了:', clearError)
    }
  }
}

module.exports = PostController