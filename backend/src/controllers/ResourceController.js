const { Resource, User, File, Collection, Comment, Rating, Category, Notification } = require('../models')
const idGenerator = require('../utils/IdGenerator')
const searchHelper = require('../utils/SearchHelper')
const searchCache = require('../utils/RedisSearchCache')
const NotificationService = require('../services/NotificationService')
const cacheCleanupService = require('../services/CacheCleanupService')
const { Op } = require('sequelize')

class ResourceController {
  // 获取资源列表（支持智能搜索、高级筛选、排序）
  async getResources(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        categories,
        sortBy = 'relevance',
        sortOrder = 'DESC',
        search,
        status = 'published',
        // 新增高级筛选参数
        dateFrom,
        dateTo,
        minRating,
        maxRating,
        minViews,
        maxViews,
        fileTypes
      } = req.query

      const userPhone = req.user?.phone_number // 获取当前用户手机号（如果已登录）
      
      // 构建缓存键参数（排除用户相关信息）
      const cacheParams = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        categories,
        sortBy,
        sortOrder,
        search,
        status,
        dateFrom,
        dateTo,
        minRating: minRating ? parseFloat(minRating) : undefined,
        maxRating: maxRating ? parseFloat(maxRating) : undefined,
        minViews: minViews ? parseInt(minViews) : undefined,
        maxViews: maxViews ? parseInt(maxViews) : undefined,
        fileTypes
      }
      
      // 尝试从缓存获取结果
      const cachedResult = await searchCache.get('search', cacheParams)
      if (cachedResult) {
        // 需要为缓存结果添加用户特定的收藏状态
        let resourcesWithFavorites = cachedResult.resources
        if (userPhone && cachedResult.resources.length > 0) {
          try {
            // 获取用户的收藏记录
            const userCollections = await Collection.findAll({
              where: {
                user_phone: userPhone,
                collection_type: 'resource',
                status: 'active'
              },
              attributes: ['content_id']
            })
            
            const collectedIds = userCollections.map(c => c.content_id)
            
            resourcesWithFavorites = cachedResult.resources.map(resource => ({
              ...resource,
              isFavorited: collectedIds.includes(resource.id || resource.resource_id)
            }))
          } catch (error) {
            console.error('添加收藏状态失败:', error)
            resourcesWithFavorites = cachedResult.resources.map(r => ({ ...r, isFavorited: false }))
          }
        } else {
          resourcesWithFavorites = cachedResult.resources.map(r => ({ ...r, isFavorited: false }))
        }
        
        return res.json({
          success: true,
          data: {
            ...cachedResult,
            resources: resourcesWithFavorites
          }
        })
      }
      const offset = (page - 1) * limit
      const where = { 
        status: { [Op.notIn]: ['archived', 'deleted'] } 
      }
      const include = [
        {
          model: User,
          as: 'publisher',
          attributes: ['name', 'nickname', 'avatar_url']
        },
        {
          model: File,
          as: 'files',
          attributes: ['file_id', 'file_name', 'file_type', 'file_size']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'category_name', 'category_value', 'icon']
        }
      ]

      // 智能搜索条件 - 使用JOIN查询支持关联表搜索
      if (search) {
        const searchCondition = searchHelper.buildResourceSearchCondition(search, {
          includeRelated: true // 启用关联表搜索，配合subQuery: false使用
        })
        if (searchCondition && (Object.keys(searchCondition).length > 0 || Object.getOwnPropertySymbols(searchCondition).length > 0)) {
          Object.assign(where, searchCondition)
        }
      }

      // 高级筛选条件
      const advancedFilters = searchHelper.buildAdvancedFilters({
        categories,
        status: [status],
        dateFrom,
        dateTo,
        minRating,
        maxRating,
        minViews,
        maxViews
      })
      Object.assign(where, advancedFilters)

      // 文件类型筛选
      if (fileTypes) {
        const typeList = fileTypes.split(',').map(t => t.trim()).filter(t => t)
        if (typeList.length > 0) {
          include[1].where = {
            file_type: { [Op.in]: typeList }
          }
          include[1].required = true
        }
      }

      // 智能排序处理
      const order = searchHelper.buildSortCondition(sortBy, sortOrder, search)

      const { count, rows } = await Resource.findAndCountAll({
        where,
        include,
        order,
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true, // 避免JOIN重复计数
        subQuery: false // 禁用子查询，使用JOIN查询
      })

      // 如果用户已登录，获取收藏状态
      let userCollections = []
      if (userPhone) {
        const collections = await Collection.findAll({
          where: {
            user_phone: userPhone,
            collection_type: 'resource',
            status: 'active'
          },
          attributes: ['content_id']
        })
        userCollections = collections.map(c => c.content_id)
      }

      // 格式化返回数据并计算相关性评分
      let resources = rows.map(resource => {
        const data = resource.toJSON()
        const formatted = {
          id: data.resource_id,
          title: data.resource_name,
          description: data.description,
          uploaderName: data.publisher?.nickname || data.publisher?.name || '匿名用户',
          uploadTime: data.created_at,
          viewCount: data.view_count,
          downloadCount: data.download_count,
          rating: parseFloat(data.rating),
          isFavorited: userCollections.includes(data.resource_id),
          files: data.files || [],
          category: data.category?.category_name || '未分类',
          collection_count: data.collection_count || 0,
          // 新增字段
          publisherAvatar: data.publisher?.avatar_url,
          categoryInfo: data.category,
          fileCount: data.files?.length || 0
        }

        // 计算相关性评分（如果有搜索词）
        if (search) {
          formatted.relevanceScore = searchHelper.calculateRelevanceScore({
            resource_name: data.resource_name,
            description: data.description,
            category_name: data.category?.category_name,
            publisher_name: data.publisher?.nickname || data.publisher?.name,
            view_count: data.view_count,
            download_count: data.download_count,
            collection_count: data.collection_count,
            rating: data.rating
          }, search, 'resource')

          // 高亮搜索关键词
          formatted.titleHighlighted = searchHelper.highlightKeywords(formatted.title, search)
          formatted.descriptionHighlighted = searchHelper.highlightKeywords(formatted.description, search)
        }

        return formatted
      })

      // 如果有搜索词且按相关性排序，重新排序结果
      if (search && sortBy === 'relevance') {
        resources.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      }

      const responseData = {
        resources,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
      
      // 将结果存储到缓存（不包含用户特定的收藏状态）
      const cacheData = {
        resources: resources.map(r => ({ ...r, isFavorited: undefined })),
        pagination: responseData.pagination
      }
      await searchCache.set('search', cacheParams, cacheData)

      res.json({
        success: true,
        data: responseData
      })
    } catch (error) {
      console.error('获取资源列表错误:', error)
      res.status(500).json({
        success: false,
        message: '获取资源列表失败',
        error: error.message
      })
    }
  }

  // 获取单个资源详情
  async getResourceById(req, res) {
    try {
      const { id } = req.params

      const resource = await Resource.findOne({
        where: { 
          resource_id: id,
          status: { [Op.notIn]: ['archived', 'deleted'] }
        },
        include: [
          {
            model: User,
            as: 'publisher',
            attributes: ['name', 'nickname', 'avatar_url']
          },
          {
            model: File,
            as: 'files'
          },
          {
            model: Category,
            as: 'category',
            attributes: ['category_id', 'category_name', 'category_value', 'icon']
          },
          {
            model: Comment,
            as: 'comments',
            include: [{
              model: User,
              as: 'author',
              attributes: ['name', 'nickname', 'avatar_url']
            }],
            where: { status: 'active' },
            required: false
          },
          {
            model: Rating,
            as: 'ratings',
            include: [{
              model: User,
              as: 'user',
              attributes: ['name', 'nickname']
            }]
          }
        ]
      })

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      // 增加浏览次数
      await resource.increment('view_count')
      
      // 重新获取资源最新数据
      await resource.reload()
      
      // 更新缓存中的统计数据而不是清除整个缓存
      try {
        await updateResourceStatsInCache(id, { viewCount: resource.view_count })
      } catch (cacheError) {
        console.error('更新缓存失败，降级清除缓存:', cacheError)
        await searchCache.invalidate('resource', 'update')
      }

      // 格式化返回数据
      const data = resource.toJSON()
      const formatted = {
        ...data,
        category: data.category?.category_name || '未分类'
      }

      res.json({
        success: true,
        data: formatted
      })
    } catch (error) {
      console.error('获取资源详情错误:', error)
      res.status(500).json({
        success: false,
        message: '获取资源详情失败',
        error: error.message
      })
    }
  }

  // 创建资源
  async createResource(req, res) {
    try {
      const userPhone = req.user.phone_number
      const {
        resource_name,
        description,
        resource_id,
        category_id
      } = req.body

      // 生成资源ID（如果没有提供）
      const finalResourceId = resource_id || idGenerator.generateResourceId()

      const resource = await Resource.create({
        resource_id: finalResourceId,
        publisher_phone: userPhone,
        resource_name,
        description,
        category_id,
        status: 'draft'
      })
      // 新增：发布资源后自增用户资源数
      await User.increment('resource_count', { where: { phone_number: userPhone } })

      // 清除相关缓存
      await searchCache.invalidate('resource', 'create')

      res.status(201).json({
        success: true,
        message: '资源创建成功',
        data: resource
      })
    } catch (error) {
      console.error('创建资源错误:', error)
      res.status(500).json({
        success: false,
        message: '创建资源失败',
        error: error.message
      })
    }
  }

  // 收藏/取消收藏资源
  async toggleFavorite(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params

      // 检查资源是否存在
      const resource = await Resource.findByPk(resourceId)
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      // 查找现有收藏记录
      const existingCollection = await Collection.findOne({
        where: {
          user_phone: userPhone,
          content_id: resourceId,
          collection_type: 'resource'
        }
      })

      let isFavorited = false
      let message = ''

      if (existingCollection) {
        if (existingCollection.status === 'active') {
          // 取消收藏
          await existingCollection.update({ status: 'cancelled' })
          await resource.decrement('collection_count')
          message = '已取消收藏'
        } else {
          // 重新收藏
          await existingCollection.update({ status: 'active' })
          await resource.increment('collection_count')
          isFavorited = true
          message = '已收藏'
        }
      } else {
        // 新增收藏
        const collectionId = idGenerator.generateCollectionId()
        await Collection.create({
          collection_id: collectionId,
          user_phone: userPhone,
          content_id: resourceId,
          collection_type: 'resource',
          status: 'active'
        })
        await resource.increment('collection_count')
        isFavorited = true
        message = '已收藏'
      }

      // 重新获取资源最新的收藏数
      await resource.reload()
      
      // 更新缓存中的收藏统计数据
      try {
        await updateResourceStatsInCache(resourceId, { 
          collection_count: resource.collection_count,
          favoriteCount: resource.collection_count
        })
      } catch (cacheError) {
        console.error('更新收藏缓存失败:', cacheError)
      }

      res.json({
        success: true,
        message,
        data: {
          isFavorited,
          collection_count: resource.collection_count
        }
      })
    } catch (error) {
      console.error('收藏操作错误:', error)
      res.status(500).json({
        success: false,
        message: '收藏操作失败',
        error: error.message
      })
    }
  }

  // 提交审核
  async submitForReview(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params

      const resource = await Resource.findOne({
        where: {
          resource_id: resourceId,
          publisher_phone: userPhone
        }
      })

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在或无权限'
        })
      }

      if (resource.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: '只有草稿状态的资源可以提交审核'
        })
      }

      await resource.update({ status: 'pending' })

      res.json({
        success: true,
        message: '已提交审核，请等待管理员审核'
      })
    } catch (error) {
      console.error('提交审核错误:', error)
      res.status(500).json({
        success: false,
        message: '提交审核失败',
        error: error.message
      })
    }
  }

  // 生成资源ID
  generateResourceId() {
    return idGenerator.generateResourceId()
  }

  // 审核资源（管理员功能）
  async reviewResource(req, res) {
    try {
      const { resourceId } = req.params
      const { action, comment } = req.body // action: 'approve' | 'reject'
      const reviewerPhone = req.user.phone_number

      const resource = await Resource.findOne({
        where: { resource_id: resourceId },
        include: [{
          model: User,
          as: 'publisher',
          attributes: ['phone_number', 'name', 'nickname']
        }]
      })
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      if (resource.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '只有待审核状态的资源可以进行审核'
        })
      }

      const newStatus = action === 'approve' ? 'published' : 'rejected'
      
      await resource.update({
        status: newStatus,
        reviewer_phone: reviewerPhone,
        review_comment: comment,
        reviewed_at: new Date(),
        category_id: resource.category_id
      })

      // 发送通知给资源发布者
      const notificationId = idGenerator.generateNotificationId()
      const isApproved = action === 'approve'
      
      await Notification.create({
        notification_id: notificationId,
        receiver_phone: resource.publisher_phone,
        type: 'system',
        priority: isApproved ? 'medium' : 'high',
        title: isApproved ? '资源审核通过' : '资源审核被拒绝',
        content: isApproved 
          ? `您的资源"${resource.resource_name}"已通过审核并发布。${comment ? `审核意见：${comment}` : ''}`
          : `您的资源"${resource.resource_name}"审核未通过。${comment ? `拒绝原因：${comment}` : ''}`,
        action_type: 'navigate',
        action_url: `/pages/resources/detail?id=${resource.resource_id}`,
        action_params: { resourceId: resource.resource_id }
      })

      // 清除相关缓存
      await searchCache.invalidate('resource', 'update')

      // 如果资源审核通过，异步推送通知给关注者
      if (action === 'approve') {
        try {
          await NotificationService.notifyFollowersAboutNewContent(
            resource.publisher_phone,
            'resource',
            resource.resource_id,
            resource.resource_name
          )
        } catch (notificationError) {
          // 通知推送失败不影响审核结果
          console.error('推送关注者通知失败:', notificationError)
        }
      }
      
      res.json({
        success: true,
        message: action === 'approve' ? '资源审核通过' : '资源已拒绝',
        data: { status: newStatus }
      })
    } catch (error) {
      console.error('审核资源错误:', error)
      res.status(500).json({
        success: false,
        message: '审核资源失败',
        error: error.message
      })
    }
  }

  // 获取待审核资源列表（管理员功能）
  async getPendingResources(req, res) {
    try {
      const {
        page = 1,
        limit = 10
      } = req.query

      const offset = (page - 1) * limit

      const { count, rows } = await Resource.findAndCountAll({
        where: { status: 'pending' },
        include: [
          {
            model: User,
            as: 'publisher',
            attributes: ['name', 'nickname', 'phone_number']
          },
          {
            model: File,
            as: 'files',
            attributes: ['file_id', 'file_name', 'file_type', 'file_size']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['category_id', 'category_name', 'category_value', 'icon']
          }
        ],
        order: [['created_at', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      // 格式化返回数据
      const resources = rows.map(resource => {
        const data = resource.toJSON()
        return {
          id: data.resource_id,
          title: data.resource_name,
          description: data.description,
          uploaderName: data.publisher?.nickname || data.publisher?.name || '匿名用户',
          uploadTime: data.created_at,
          viewCount: data.view_count,
          downloadCount: data.download_count,
          rating: parseFloat(data.rating),
          files: data.files || [],
          category: data.category?.category_name || '未分类',
          collection_count: data.collection_count || 0,
          status: data.status
        }
      })

      res.json({
        success: true,
        data: {
          resources,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      })
    } catch (error) {
      console.error('获取待审核资源错误:', error)
      res.status(500).json({
        success: false,
        message: '获取待审核资源失败',
        error: error.message
      })
    }
  }

  // 下载资源文件
  async downloadResource(req, res) {
    const path = require('path')
    const fs = require('fs')
    
    try {
      const { resourceId, fileId } = req.params
      const userPhone = req.user?.phone_number

      // 查找资源和文件
      const resource = await Resource.findOne({
        where: { resource_id: resourceId },
        include: [{
          model: File,
          as: 'files',
          where: { file_id: fileId }
        }]
      })

      if (!resource || !resource.files.length) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        })
      }

      // 权限检查：管理员可以下载任何状态的资源，普通用户只能下载已发布的资源或自己的资源
      const isAdmin = req.user?.role === 'admin'
      const isOwner = req.user?.phone_number === resource.publisher_phone
      const isPublished = resource.status === 'published'
      
      if (!isPublished && !isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: '资源未发布，无法下载'
        })
      }

      const file = resource.files[0]

      // 增加下载统计
      await Promise.all([
        resource.increment('download_count'),
        file.increment('download_count')
      ])
      
      // 重新获取资源最新的下载数
      await resource.reload()
      
      // 更新缓存中的统计数据
      try {
        await updateResourceStatsInCache(resourceId, { downloadCount: resource.download_count })
      } catch (cacheError) {
        console.error('更新下载缓存失败:', cacheError)
      }

      // 记录下载记录
      if (userPhone) {
        // 这里可以创建下载记录表，暂时省略
      }

      // 根据存储方式返回文件
      if (file.storage_method === 'local') {
        // 检查请求头，如果是API请求则返回下载信息，如果是直接访问则返回文件流
        const acceptHeader = req.headers.accept || ''
        
        if (acceptHeader.includes('application/json')) {
          // API请求，返回下载信息
          res.json({
            success: true,
            data: {
              downloadUrl: `/uploads/${file.storage_path}`,
              fileName: file.file_name,
              fileSize: file.file_size
            }
          })
        } else {
          // 其他情况都返回文件流（包括 application/octet-stream 或默认情况）
          const filePath = path.join(process.cwd(), 'uploads', file.storage_path)
          
          // 检查文件是否存在
          if (!fs.existsSync(filePath)) {
            return res.status(404).json({
              success: false,
              message: '文件不存在'
            })
          }
          
          // 设置响应头
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`)
          res.setHeader('Content-Type', file.file_type || 'application/octet-stream')
          res.setHeader('Content-Length', file.file_size)
          
          // 创建文件流并发送
          const fileStream = fs.createReadStream(filePath)
          fileStream.pipe(res)
          
          fileStream.on('error', (error) => {
            console.error('文件流错误:', error)
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: '文件读取失败'
              })
            }
          })
        }
      } else if (file.storage_method === 'table' && file.content) {
        // 直接返回文件内容
        res.json({
          success: true,
          data: {
            content: file.content,
            fileName: file.file_name,
            fileType: file.file_type
          }
        })
      } else {
        res.status(404).json({
          success: false,
          message: '文件内容不可用'
        })
      }
    } catch (error) {
      console.error('下载资源错误:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: '下载失败',
          error: error.message
        })
      }
    }
  }

  // 删除资源
  async deleteResource(req, res) {
    try {
      const { id } = req.params
      const userPhone = req.user.phone_number

      // 查找资源
      const resource = await Resource.findOne({
        where: { 
          resource_id: id,
          status: { [Op.in]: ['draft', 'pending', 'published', 'rejected'] }
        }
      })

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        })
      }

      // 验证权限：只能删除自己的资源
      if (resource.publisher_phone !== userPhone) {
        return res.status(403).json({
          success: false,
          message: '您没有权限删除这个资源'
        })
      }

      // 软删除：将状态改为archived
      await resource.update({ status: 'archived' })

      // 清除相关缓存
      await searchCache.invalidate('resource', 'delete')

      // 触发缓存清理
      try {
        await cacheCleanupService.manualCleanup()
        console.log('用户删除资源后触发缓存清理完成')
      } catch (cleanupError) {
        console.error('触发缓存清理失败:', cleanupError)
      }

      res.status(200).json({
        success: true,
        message: '删除资源成功'
      })
    } catch (error) {
      console.error('删除资源失败:', error)
      res.status(500).json({
        success: false,
        message: '删除资源失败',
        errors: [error.message]
      })
    }
  }


  // 检查收藏状态
  async checkFavoriteStatus(req, res) {
    try {
      const userPhone = req.user.phone_number
      const { resourceId } = req.params

      const collection = await Collection.findOne({
        where: {
          user_phone: userPhone,
          content_id: resourceId,
          collection_type: 'resource',
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
  async getSearchSuggestions(req, res) {
    try {
      const { q: searchTerm } = req.query
      
      // 这里可以从数据库获取热门搜索关键词和用户搜索历史
      // 暂时使用模拟数据
      const hotKeywords = [
        '数据结构', '算法', '计算机网络', '操作系统', '数据库',
        '机器学习', '深度学习', '前端开发', '后端开发', 'Python'
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
  async getFilterOptions(req, res) {
    try {
      // 获取所有分类
      const categories = await Category.findAll({
        where: { status: 'active' },
        attributes: ['category_id', 'category_name', 'icon'],
        order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
      })

      // 获取文件类型统计
      const fileTypes = await File.findAll({
        attributes: ['file_type'],
        group: ['file_type'],
        raw: true
      })

      // 获取评分范围
      const ratingRange = await Resource.findOne({
        attributes: [
          [require('sequelize').fn('MIN', require('sequelize').col('rating')), 'minRating'],
          [require('sequelize').fn('MAX', require('sequelize').col('rating')), 'maxRating']
        ],
        raw: true
      })

      res.json({
        success: true,
        data: {
          categories: categories.map(cat => ({
            id: cat.category_id,
            name: cat.category_name,
            icon: cat.icon
          })),
          fileTypes: fileTypes.map(ft => ft.file_type).filter(Boolean),
          ratingRange: {
            min: parseFloat(ratingRange?.minRating || 0),
            max: parseFloat(ratingRange?.maxRating || 5)
          },
          sortOptions: [
            { value: 'relevance', label: '相关性' },
            { value: 'latest', label: '最新发布' },
            { value: 'download', label: '下载最多' },
            { value: 'rating', label: '评分最高' },
            { value: 'view', label: '浏览最多' },
            { value: 'collection', label: '收藏最多' }
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

  // 生成收藏ID
  generateCollectionId() {
    return idGenerator.generateResourceId()
  }
  
  // 为资源列表添加用户收藏状态
  async addFavoriteStatus(resources, userPhone) {
    if (!userPhone || !resources.length) {
      return resources.map(r => ({ ...r, isFavorited: false }))
    }
    
    try {
      // 获取用户的收藏记录
      const userCollections = await Collection.findAll({
        where: {
          user_phone: userPhone,
          collection_type: 'resource',
          status: 'active'
        },
        attributes: ['content_id']
      })
      
      const collectedIds = userCollections.map(c => c.content_id)
      
      return resources.map(resource => ({
        ...resource,
        isFavorited: collectedIds.includes(resource.id || resource.resource_id)
      }))
    } catch (error) {
      console.error('添加收藏状态失败:', error)
      return resources.map(r => ({ ...r, isFavorited: false }))
    }
  }

}

// 辅助函数：更新缓存中的资源统计数据
async function updateResourceStatsInCache(resourceId, statsUpdate) {
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
      if (cachedData && cachedData.resources && Array.isArray(cachedData.resources)) {
        let updated = false
        const updatedResources = cachedData.resources.map(resource => {
          if (resource.id === resourceId || resource.resource_id === resourceId) {
            updated = true
            return {
              ...resource,
              ...statsUpdate
            }
          }
          return resource
        })
        
        if (updated) {
          // 更新缓存中的数据
          await searchCache.setByKey(key, {
            ...cachedData,
            resources: updatedResources
          })
          updatedCount++
        }
      }
    }
    
    console.log(`成功更新了 ${updatedCount} 个缓存条目的统计数据`)
  } catch (error) {
    console.error('更新缓存统计数据失败:', error)
    // 如果更新失败，降级为清除相关缓存
    try {
      await searchCache.clearPattern('search')
      console.log('降级清除了搜索缓存')
    } catch (clearError) {
      console.error('清除缓存也失败了:', clearError)
    }
  }
}

module.exports = new ResourceController()