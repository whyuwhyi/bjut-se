const { File, Resource } = require('../models')
const path = require('path')

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
      const fileId = Math.floor(100000000 + Math.random() * 900000000).toString()

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
}

module.exports = new FileController()