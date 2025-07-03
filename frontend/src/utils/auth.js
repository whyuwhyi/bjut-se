import request from './request.js'

/**
 * 身份验证工具类
 */
class AuthHelper {
  constructor() {
    this.checkInterval = null
    this.isChecking = false
  }

  /**
   * 检查用户是否已登录
   * @returns {Boolean} 是否已登录
   */
  isLoggedIn() {
    const token = uni.getStorageSync('token')
    const userInfo = uni.getStorageSync('userInfo')
    return !!(token && userInfo)
  }

  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息
   */
  getCurrentUser() {
    return uni.getStorageSync('userInfo') || null
  }

  /**
   * 获取当前用户token
   * @returns {String|null} token
   */
  getToken() {
    return uni.getStorageSync('token') || null
  }

  /**
   * 退出登录
   */
  logout() {
    // 停止定期检查
    this.stopPeriodicCheck()
    
    // 清除本地存储
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('currentUserPhone')
    
    // 跳转到登录页面
    uni.reLaunch({
      url: '/pages/login/login'
    })
  }

  /**
   * 验证当前用户的身份状态
   * @returns {Promise<Boolean>} 验证结果
   */
  async validateUserStatus() {
    if (this.isChecking) {
      return true // 避免重复检查
    }

    if (!this.isLoggedIn()) {
      return false
    }

    try {
      this.isChecking = true
      
      // 调用获取用户信息的API来验证身份状态
      const response = await request.get('/users/profile')
      
      if (response.success) {
        // 更新本地存储的用户信息
        uni.setStorageSync('userInfo', response.data.user)
        return true
      } else {
        // API返回失败，可能是token过期或用户状态异常
        this.logout()
        return false
      }
    } catch (error) {
      console.error('用户状态验证失败:', error)
      // 验证失败，强制退出（request.js中已经处理了具体的错误类型）
      return false
    } finally {
      this.isChecking = false
    }
  }

  /**
   * 启动定期的身份验证检查
   * @param {Number} interval 检查间隔（毫秒），默认5分钟
   */
  startPeriodicCheck(interval = 5 * 60 * 1000) {
    // 先清除现有的定时器
    this.stopPeriodicCheck()
    
    // 立即执行一次检查
    this.validateUserStatus()
    
    // 设置定期检查
    this.checkInterval = setInterval(() => {
      this.validateUserStatus()
    }, interval)
  }

  /**
   * 停止定期的身份验证检查
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * 页面可见性变化时的检查
   * 当用户切换回应用时检查身份状态
   */
  onAppShow() {
    if (this.isLoggedIn()) {
      this.validateUserStatus()
    }
  }

  /**
   * 应用隐藏时停止检查
   */
  onAppHide() {
    // 可以选择在应用隐藏时停止检查以节省资源
    // this.stopPeriodicCheck()
  }

  /**
   * 路由守卫：检查页面是否需要登录
   * @param {String} path 页面路径
   * @returns {Boolean} 是否允许访问
   */
  routeGuard(path) {
    // 定义不需要登录的页面
    const publicPages = [
      '/pages/login/login',
      '/pages/register/register',
      '/pages/index/index' // 首页可能允许未登录用户访问
    ]

    // 如果是公开页面，直接允许访问
    if (publicPages.some(page => path.includes(page))) {
      return true
    }

    // 其他页面需要登录
    if (!this.isLoggedIn()) {
      uni.showModal({
        title: '需要登录',
        content: '请先登录后再访问此页面',
        showCancel: false,
        confirmText: '去登录',
        success: () => {
          uni.reLaunch({
            url: '/pages/login/login'
          })
        }
      })
      return false
    }

    return true
  }

  /**
   * 网络状态检查
   * 当网络恢复时重新验证用户状态
   */
  onNetworkStatusChange() {
    uni.onNetworkStatusChange((res) => {
      if (res.isConnected && this.isLoggedIn()) {
        // 网络恢复时重新验证用户状态
        setTimeout(() => {
          this.validateUserStatus()
        }, 1000) // 延迟1秒避免网络刚恢复时的不稳定
      }
    })
  }

  /**
   * 初始化身份验证系统
   */
  init() {
    // 启动定期检查
    if (this.isLoggedIn()) {
      this.startPeriodicCheck()
    }

    // 监听网络状态变化
    this.onNetworkStatusChange()

    console.log('身份验证系统已初始化')
  }
}

// 创建全局实例
const auth = new AuthHelper()

export default auth