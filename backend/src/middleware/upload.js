const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 确保上传目录存在
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 头像上传配置
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars')
    createUploadDir(uploadDir)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：用户手机号_时间戳.扩展名
    const ext = path.extname(file.originalname)
    const filename = `${req.user.phone_number}_${Date.now()}${ext}`
    cb(null, filename)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('只能上传图片文件'), false)
  }
}

// 头像上传中间件
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single('avatar')

// 资源文件上传配置
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resources')
    createUploadDir(uploadDir)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_原文件名
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${safeName}`
    cb(null, filename)
  }
})

// 资源文件上传中间件
const uploadResource = multer({
  storage: resourceStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
}).array('files', 10) // 最多10个文件

// 通用文件过滤器（用于资源上传）
const resourceFileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'), false)
  }
}

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制'
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      })
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }

  next(error)
}

module.exports = {
  uploadAvatar,
  uploadResource,
  handleUploadError
}