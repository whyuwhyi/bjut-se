import config from './config.js'

/**
 * 统一的API请求工具类
 * 包含全局的身份验证检查和错误处理
 */
class RequestHelper {
  constructor() {
    this.baseURL = config.apiBaseUrl
  }

  /**
   * 发送HTTP请求
   * @param {Object} options 请求配置
   * @returns {Promise} 请求结果
   */
  async request(options = {}) {
    const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options

    // 构建完整的请求配置
    const requestConfig = {
      url: this.baseURL + url,
      method: method.toUpperCase(),
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      }
    }

    // 如果需要身份验证，添加token
    if (needAuth) {
      const token = uni.getStorageSync('token')
      if (token) {
        requestConfig.header['Authorization'] = `Bearer ${token}`
      }
    }

    try {
      const response = await uni.request(requestConfig)
      
      // 处理响应
      return this.handleResponse(response, options)
    } catch (error) {
      // 处理网络错误
      this.handleNetworkError(error)
      throw error
    }
  }

  /**
   * 处理API响应
   * @param {Object} response uni.request的响应对象
   * @param {Object} options 原始请求配置
   * @returns {Object} 处理后的响应数据
   */
  handleResponse(response, options) {
    const { data, statusCode } = response

    // 处理身份验证错误
    if (statusCode === 401) {
      this.handleAuthError(data, 'token_expired')
      throw new Error(data.message || '身份验证失败')
    }

    // 处理权限和状态错误
    if (statusCode === 403 || statusCode === 410) {
      this.handleAuthError(data, 'status_invalid')
      throw new Error(data.message || '访问被拒绝')
    }

    // 处理服务器错误
    if (statusCode >= 500) {
      this.handleServerError(data)
      throw new Error(data.message || '服务器内部错误')
    }

    // 处理客户端错误
    if (statusCode >= 400) {
      throw new Error(data.message || '请求失败')
    }

    // 返回正常的响应数据
    return data
  }

  /**
   * 处理身份验证错误
   * @param {Object} responseData 响应数据
   * @param {String} errorType 错误类型
   */
  handleAuthError(responseData, errorType) {
    console.warn('身份验证错误:', responseData)

    // 检查是否需要强制退出
    const shouldForceLogout = responseData.data?.forceLogout || errorType === 'token_expired'
    
    if (shouldForceLogout) {
      this.forceLogout(responseData)
    } else {
      // 显示错误信息
      this.showAuthErrorMessage(responseData)
    }
  }

  /**
   * 强制用户退出登录
   * @param {Object} responseData 响应数据
   */
  forceLogout(responseData) {
    // 清除本地存储的用户信息
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('currentUserPhone')

    let title = '登录已失效'
    let content = '您的登录状态已失效，请重新登录'

    // 根据具体的错误类型显示不同的提示
    if (responseData.data?.status) {
      switch (responseData.data.status) {
        case 'banned':
          title = '账户已被封禁'
          content = '您的账户已被封禁，已被强制退出系统'
          break
        case 'deleted':
          title = '账户已被删除'
          content = '您的账户已被删除，请重新注册'
          break
        case 'inactive':
          title = '账户已被停用'
          content = '您的账户已被停用，请联系管理员'
          break
        default:
          if (responseData.message) {
            content = responseData.message
          }
      }
    }

    // 显示提示并跳转到登录页面
    uni.showModal({
      title,
      content: content + (responseData.data?.contactAdmin ? '\n\n如有疑问请联系管理员' : ''),
      showCancel: false,
      confirmText: '重新登录',
      success: () => {
        // 跳转到登录页面
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
  }

  /**
   * 显示身份验证错误信息（不强制退出的情况）
   * @param {Object} responseData 响应数据
   */
  showAuthErrorMessage(responseData) {
    uni.showToast({
      title: responseData.message || '访问被拒绝',
      icon: 'none',
      duration: 3000
    })
  }

  /**
   * 处理服务器错误
   * @param {Object} responseData 响应数据
   */
  handleServerError(responseData) {
    console.error('服务器错误:', responseData)
    
    uni.showToast({
      title: '服务器繁忙，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  }

  /**
   * 处理网络错误
   * @param {Object} error 错误对象
   */
  handleNetworkError(error) {
    console.error('网络错误:', error)
    
    uni.showToast({
      title: '网络连接失败',
      icon: 'none',
      duration: 3000
    })
  }

  /**
   * GET请求
   * @param {String} url 请求地址
   * @param {Object} params 查询参数
   * @param {Object} options 其他配置
   * @returns {Promise} 请求结果
   */
  get(url, params = {}, options = {}) {
    // 构建查询字符串
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    const fullUrl = queryString ? `${url}?${queryString}` : url

    return this.request({
      url: fullUrl,
      method: 'GET',
      ...options
    })
  }

  /**
   * POST请求
   * @param {String} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 其他配置
   * @returns {Promise} 请求结果
   */
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  /**
   * PUT请求
   * @param {String} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 其他配置
   * @returns {Promise} 请求结果
   */
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  /**
   * DELETE请求
   * @param {String} url 请求地址
   * @param {Object} options 其他配置
   * @returns {Promise} 请求结果
   */
  delete(url, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      ...options
    })
  }

  /**
   * 上传文件
   * @param {String} url 上传地址
   * @param {String} filePath 文件路径
   * @param {Object} formData 表单数据
   * @param {Object} options 其他配置
   * @returns {Promise} 上传结果
   */
  upload(url, filePath, formData = {}, options = {}) {
    const { needAuth = true } = options
    
    const uploadConfig = {
      url: this.baseURL + url,
      filePath,
      name: 'file',
      formData
    }

    // 添加身份验证
    if (needAuth) {
      const token = uni.getStorageSync('token')
      if (token) {
        uploadConfig.header = {
          'Authorization': `Bearer ${token}`
        }
      }
    }

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        ...uploadConfig,
        success: (response) => {
          try {
            const data = JSON.parse(response.data)
            if (response.statusCode === 200 && data.success) {
              resolve(data)
            } else {
              this.handleResponse({ data, statusCode: response.statusCode }, options)
              reject(new Error(data.message || '上传失败'))
            }
          } catch (error) {
            reject(new Error('上传响应解析失败'))
          }
        },
        fail: (error) => {
          this.handleNetworkError(error)
          reject(error)
        }
      })
    })
  }
}

// 创建全局实例
const request = new RequestHelper()

export default request