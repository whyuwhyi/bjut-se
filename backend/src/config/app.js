require('dotenv').config()

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },

  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'png', 'gif']
  },

  // 分页配置
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // 缓存配置
  cache: {
    ttl: 300 // 5分钟
  },

  // 安全配置
  security: {
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000 // 15分钟
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || ''
  },

  // 邮件服务配置
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromPhone: process.env.TWILIO_FROM_PHONE || ''
  },

  // 腾讯云短信服务配置
  sms: {
    secretId: '你的腾讯云 SecretId',
    secretKey: '你的腾讯云 SecretKey',
    appId: '你的短信应用 ID',
    signName: '你的短信签名',
    templateId: '你的短信模板ID'
  },
}