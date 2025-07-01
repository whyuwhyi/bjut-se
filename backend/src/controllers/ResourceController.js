const { Resource, User, File, Collection, Comment, Rating, ResourceType, Category } = require('../models')
const { Op } = require('sequelize')

class ResourceController {
  // 获取资源列表（支持分页、筛选、排序）
  async getResources(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        categories,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        search,
        status = 'published'
      } = req.query

      const userPhone = req.user?.phone_number // 获取当前用户手机号（如果已登录）
      const offset = (page - 1) * limit
      const where = { status }
      const include = [
        {
          model: User,
          as: 'publisher',
          attributes: ['name', 'nickname']
        },
        {
          model: File,
          as: 'files',
          attributes: ['file_id', 'file_name', 'file_type', 'file_size']
        }
      ]

      // 分类关联
      include.push({
        model: Category,
        as: 'category',
        attributes: ['category_id', 'category_name', 'category_value', 'icon']
      })

      // 搜索条件
      if (search) {
        where[Op.or] = [
          { resource_name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      }

      // 分类筛选
      if (categories) {
        const categoryList = categories.split(',')
        where.category_id = {
          [Op.in]: categoryList
        }
      }

      // 排序处理
      let order = []
      switch (sortBy) {
        case 'download':
          order = [['download_count', sortOrder]]
          break
        case 'rating':
          order = [['rating', sortOrder]]
          break
        case 'view':
          order = [['view_count', sortOrder]]
          break
        case 'latest':
        default:
          order = [['created_at', sortOrder]]
          break
      }

      const { count, rows } = await Resource.findAndCountAll({
        where,
        include,
        order,
        limit: parseInt(limit),
        offset: parseInt(offset)
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
          isFavorited: userCollections.includes(data.resource_id),
          files: data.files || [],
          category: data.category?.category_name || '未分类'
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

      const resource = await Resource.findByPk(id, {
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

      res.json({
        success: true,
        data: resource
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
        resource_id
      } = req.body

      // 生成资源ID（如果没有提供）
      const finalResourceId = resource_id || Math.floor(100000000 + Math.random() * 900000000).toString()

      const resource = await Resource.create({
        resource_id: finalResourceId,
        publisher_phone: userPhone,
        resource_name,
        description,
        status: 'draft'
      })

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
        const collectionId = Math.floor(100000000 + Math.random() * 900000000).toString()
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

      res.json({
        success: true,
        message,
        data: { isFavorited }
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
    return Math.floor(100000000 + Math.random() * 900000000).toString()
  }

  // 审核资源（管理员功能）
  async reviewResource(req, res) {
    try {
      const { resourceId } = req.params
      const { action, comment } = req.body // action: 'approve' | 'reject'
      const reviewerPhone = req.user.phone_number

      const resource = await Resource.findByPk(resourceId)
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
        reviewed_at: new Date()
      })

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
          }
        ],
        order: [['created_at', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      res.json({
        success: true,
        data: {
          resources: rows,
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

      if (resource.status !== 'published') {
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
          // 直接文件访问，返回文件流
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

  // 生成收藏ID
  generateCollectionId() {
    return Math.floor(100000000 + Math.random() * 900000000).toString()
  }
}

module.exports = new ResourceController()