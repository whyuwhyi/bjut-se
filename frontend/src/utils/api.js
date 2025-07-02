import config from './config.js'

// 获取token
const getToken = () => {
  return uni.getStorageSync('token')
}

// 通用请求方法
const request = (options) => {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${config.apiBaseUrl}${options.url}`,
      method: options.method || 'GET',
      header: headers,
      data: options.data,
      success: (response) => {
        if (response.statusCode === 401) {
          // 登录过期，清除token并跳转登录页
          uni.removeStorageSync('token')
          uni.removeStorageSync('user')
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          setTimeout(() => {
            uni.redirectTo({ url: '/pages/login/login' })
          }, 1000)
          reject(new Error('登录已过期，请重新登录'))
        } else {
          resolve(response)
        }
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

// 举报资源
export const reportResource = async (resourceId, reportData) => {
  try {
    const response = await request({
      url: `/reports/resources/${resourceId}`,
      method: 'POST',
      data: reportData
    })
    
    if (response.statusCode === 200) {
      return response.data
    } else {
      throw new Error(response.data?.message || '举报失败')
    }
  } catch (error) {
    console.error('举报资源失败:', error)
    throw error
  }
}

// 举报帖子
export const reportPost = async (postId, reportData) => {
  try {
    const response = await request({
      url: `/reports/posts/${postId}`,
      method: 'POST',
      data: reportData
    })
    
    if (response.statusCode === 200) {
      return response.data
    } else {
      throw new Error(response.data?.message || '举报失败')
    }
  } catch (error) {
    console.error('举报帖子失败:', error)
    throw error
  }
}

// 获取举报原因列表
export const getReportReasons = async (contentType) => {
  try {
    const response = await request({
      url: `/reports/reasons?type=${contentType}`,
      method: 'GET'
    })
    
    if (response.statusCode === 200) {
      return response.data
    } else {
      throw new Error(response.data?.message || '获取举报原因失败')
    }
  } catch (error) {
    console.error('获取举报原因失败:', error)
    throw error
  }
}