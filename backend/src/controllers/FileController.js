const { File, Resource } = require('../models')
const idGenerator = require('../utils/IdGenerator')
const path = require('path')
const fs = require('fs')

class FileController {
  // 上传文件
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有文件被上传'
        })
      }

      const { resource_id, file_name, file_type } = req.body

      // 验证资源是否存在且属于当前用户
      const resource = await Resource.findOne({
        where: {
          resource_id,
          publisher_phone: req.user.phone_number
        }
      })

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在或无权限'
        })
      }

      // 生成文件ID
      const fileId = idGenerator.generateNumericId(9)

      // 创建文件记录
      const file = await File.create({
        file_id: fileId,
        resource_id,
        file_name: file_name || req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        storage_path: `files/${req.file.filename}`,
        storage_method: 'local'
      })

      res.status(201).json({
        success: true,
        message: '文件上传成功',
        data: file
      })
    } catch (error) {
      console.error('文件上传错误:', error)
      res.status(500).json({
        success: false,
        message: '文件上传失败',
        error: error.message
      })
    }
  }

  // 通用图片上传（不依赖resource_id）
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: '没有文件被上传' })
      }
      // 拼接图片URL
      const url = `/uploads/images/${req.file.filename}`
      res.json({ success: true, url })
    } catch (error) {
      res.status(500).json({ success: false, message: '图片上传失败', error: error.message })
    }
  }

  // 下载文件
  async downloadFile(req, res) {
    try {
      const { fileId } = req.params
      
      // 查找文件记录
      const file = await File.findOne({
        where: { file_id: fileId },
        include: [{
          model: Resource,
          as: 'resource',
          attributes: ['resource_id', 'status', 'publisher_phone']
        }]
      })

      if (!file) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        })
      }

      // 检查资源状态 - 只有已发布的资源或资源所有者/管理员可以下载
      const canDownload = 
        file.resource.status === 'published' || 
        file.resource.publisher_phone === req.user.phone_number ||
        req.user.role === 'admin'

      if (!canDownload) {
        return res.status(403).json({
          success: false,
          message: '无权限下载此文件'
        })
      }

      // 构建文件路径
      const filePath = path.join(process.cwd(), 'uploads', file.storage_path)
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: '文件不存在于服务器'
        })
      }

      // 更新下载次数
      await file.increment('download_count')

      // 设置响应头
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`)
      res.setHeader('Content-Type', file.file_type || 'application/octet-stream')
      
      // 发送文件
      res.sendFile(filePath)
      
      console.log(`User ${req.user.phone_number} downloaded file ${fileId}`)
    } catch (error) {
      console.error('File download error:', error)
      res.status(500).json({
        success: false,
        message: '文件下载失败',
        error: error.message
      })
    }
  }
}

module.exports = new FileController()