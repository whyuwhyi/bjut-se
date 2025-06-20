// 身份验证工具类
class AuthService {
  
  // 检查用户是否已登录
  static isLoggedIn() {
    try {
      const userInfo = uni.getStorageSync('userInfo')
      const token = uni.getStorageSync('token')
      return !!(userInfo && token)
    } catch (error) {
      console.error('检查登录状态失败:', error)
      return false
    }
  }
  
  // 获取当前用户信息
  static getCurrentUser() {
    try {
      const userInfo = uni.getStorageSync('userInfo')
      return userInfo || null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }
  
  // 获取当前用户ID
  static getCurrentUserId() {
    const user = this.getCurrentUser()
    return user ? user._id : null
  }
  
  // 获取当前用户角色
  static getCurrentUserRole() {
    const user = this.getCurrentUser()
    return user ? user.role : null
  }
  
  // 检查用户权限
  static hasPermission(requiredRole) {
    const userRole = this.getCurrentUserRole()
    
    const roleHierarchy = {
      'student': 1,
      'teacher': 2,
      'admin': 3
    }
    
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    
    return userLevel >= requiredLevel
  }
  
  // 检查是否为学生
  static isStudent() {
    return this.getCurrentUserRole() === 'student'
  }
  
  // 检查是否为教师
  static isTeacher() {
    return this.getCurrentUserRole() === 'teacher'
  }
  
  // 检查是否为管理员
  static isAdmin() {
    return this.getCurrentUserRole() === 'admin'
  }
  
  // 保存用户信息
  static saveUserInfo(userInfo, token) {
    try {
      uni.setStorageSync('userInfo', userInfo)
      uni.setStorageSync('token', token)
      return true
    } catch (error) {
      console.error('保存用户信息失败:', error)
      return false
    }
  }
  
  // 更新用户信息
  static updateUserInfo(updates) {
    try {
      const currentUser = this.getCurrentUser()
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates }
        uni.setStorageSync('userInfo', updatedUser)
        return true
      }
      return false
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return false
    }
  }
  
  // 清除用户信息
  static clearUserInfo() {
    try {
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('token')
      return true
    } catch (error) {
      console.error('清除用户信息失败:', error)
      return false
    }
  }
  
  // 重定向到登录页面
  static redirectToLogin() {
    uni.reLaunch({
      url: '/pages/login/login'
    })
  }
  
  // 检查登录状态，未登录则重定向
  static requireAuth() {
    if (!this.isLoggedIn()) {
      this.redirectToLogin()
      return false
    }
    return true
  }
  
  // 检查权限，无权限则显示提示
  static requirePermission(requiredRole, showToast = true) {
    if (!this.requireAuth()) {
      return false
    }
    
    if (!this.hasPermission(requiredRole)) {
      if (showToast) {
        uni.showToast({
          title: '权限不足',
          icon: 'none'
        })
      }
      return false
    }
    
    return true
  }
  
  // 获取用户token
  static getToken() {
    try {
      return uni.getStorageSync('token') || null
    } catch (error) {
      console.error('获取token失败:', error)
      return null
    }
  }
  
  // 验证token是否有效（简化版）
  static isTokenValid() {
    const token = this.getToken()
    if (!token) return false
    
    // 这里可以加入token过期检查逻辑
    // 例如检查JWT的过期时间
    
    return true
  }
  
  // 刷新token（如果需要）
  static async refreshToken() {
    // 这里可以实现token刷新逻辑
    // 例如调用刷新token的API
    return true
  }
  
  // 登出
  static logout() {
    this.clearUserInfo()
    this.redirectToLogin()
  }
  
  // 获取用户显示名称
  static getUserDisplayName() {
    const user = this.getCurrentUser()
    if (!user) return '未知用户'
    
    return user.realName || user.username || '未知用户'
  }
  
  // 获取用户头像
  static getUserAvatar() {
    const user = this.getCurrentUser()
    return user && user.avatar ? user.avatar : '/static/images/default-avatar.png'
  }
  
  // 格式化用户角色显示
  static formatUserRole(role) {
    const roleMap = {
      'student': '学生',
      'teacher': '教师',
      'admin': '管理员'
    }
    return roleMap[role] || '用户'
  }
  
  // 检查用户是否完善了基本信息
  static isProfileComplete() {
    const user = this.getCurrentUser()
    if (!user) return false
    
    // 检查必要字段是否完整
    const requiredFields = ['realName', 'email']
    
    for (let field of requiredFields) {
      if (!user[field] || user[field].trim() === '') {
        return false
      }
    }
    
    return true
  }
  
  // 提示完善个人信息
  static promptCompleteProfile() {
    uni.showModal({
      title: '完善个人信息',
      content: '请先完善您的个人信息',
      confirmText: '去完善',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/profile/edit'
          })
        }
      }
    })
  }
}

export default AuthService