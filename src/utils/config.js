// 应用配置
const config = {
  // 开发环境配置
  development: {
    // 本地开发时的API地址
    apiBaseUrl: 'http://localhost:3000/api/v1',
    // H5开发时通过代理访问
    h5ApiBaseUrl: '/api/v1'
  },
  
  // 生产环境配置
  production: {
    // 生产环境的API地址 - 需要根据实际部署地址修改
    apiBaseUrl: 'https://your-domain.com/api/v1',
    h5ApiBaseUrl: 'https://your-domain.com/api/v1'
  }
}

// 当前环境
const ENV = process.env.NODE_ENV || 'development'

// 获取当前平台
const getPlatform = () => {
  // #ifdef H5
  return 'h5'
  // #endif
  
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  
  // #ifdef APP-PLUS
  return 'app-plus'
  // #endif
  
  return 'unknown'
}

// 获取API基础URL
export const getApiBaseUrl = () => {
  const platform = getPlatform()
  const envConfig = config[ENV]
  
  // H5平台在开发环境使用代理
  if (platform === 'h5' && ENV === 'development') {
    return envConfig.h5ApiBaseUrl
  }
  
  // 其他情况使用完整URL
  return platform === 'h5' ? envConfig.h5ApiBaseUrl : envConfig.apiBaseUrl
}

// 应用信息
export const APP_INFO = {
  name: '日新智链',
  version: '1.0.0',
  description: '北京工业大学校园学习交流平台'
}

// 默认配置
export default {
  apiBaseUrl: getApiBaseUrl(),
  platform: getPlatform(),
  env: ENV,
  ...APP_INFO
}