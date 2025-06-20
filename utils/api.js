// API工具类 - 封装云函数调用
class ApiService {
  
  // 用户相关API
  static async registerUser(userData) {
    return await this.callCloudFunction('user', 'register', userData)
  }
  
  static async loginUser(loginData) {
    return await this.callCloudFunction('user', 'login', loginData)
  }
  
  static async getUserInfo(userId) {
    return await this.callCloudFunction('user', 'getUserInfo', { userId })
  }
  
  static async updateProfile(userId, updateData) {
    return await this.callCloudFunction('user', 'updateProfile', { userId, updateData })
  }
  
  static async uploadAvatar(userId, avatarUrl) {
    return await this.callCloudFunction('user', 'uploadAvatar', { userId, avatarUrl })
  }
  
  // 资源相关API
  static async uploadResource(resourceData) {
    return await this.callCloudFunction('resource', 'uploadResource', resourceData)
  }
  
  static async getResourceList(params) {
    return await this.callCloudFunction('resource', 'getResourceList', params)
  }
  
  static async getResourceDetail(resourceId, userId) {
    return await this.callCloudFunction('resource', 'getResourceDetail', { resourceId, userId })
  }
  
  static async downloadResource(resourceId, userId) {
    return await this.callCloudFunction('resource', 'downloadResource', { resourceId, userId })
  }
  
  static async toggleFavorite(resourceId, userId) {
    return await this.callCloudFunction('resource', 'toggleFavorite', { resourceId, userId })
  }
  
  static async rateResource(resourceId, userId, rating) {
    return await this.callCloudFunction('resource', 'rateResource', { resourceId, userId, rating })
  }
  
  static async searchResources(keyword, page = 1, pageSize = 10) {
    return await this.callCloudFunction('resource', 'searchResources', { keyword, page, pageSize })
  }
  
  static async getUserResources(userId, page = 1, pageSize = 10) {
    return await this.callCloudFunction('resource', 'getUserResources', { userId, page, pageSize })
  }
  
  // 讨论相关API
  static async createPost(postData) {
    return await this.callCloudFunction('discussion', 'createPost', postData)
  }
  
  static async getDiscussionList(params) {
    return await this.callCloudFunction('discussion', 'getDiscussionList', params)
  }
  
  static async getDiscussionDetail(discussionId, userId) {
    return await this.callCloudFunction('discussion', 'getDiscussionDetail', { discussionId, userId })
  }
  
  static async replyPost(replyData) {
    return await this.callCloudFunction('discussion', 'replyPost', replyData)
  }
  
  static async toggleLike(targetId, targetType, userId) {
    return await this.callCloudFunction('discussion', 'toggleLike', { targetId, targetType, userId })
  }
  
  static async markResolved(discussionId, userId) {
    return await this.callCloudFunction('discussion', 'markResolved', { discussionId, userId })
  }
  
  static async getUserPosts(userId, page = 1, pageSize = 10) {
    return await this.callCloudFunction('discussion', 'getUserPosts', { userId, page, pageSize })
  }
  
  static async searchDiscussions(keyword, page = 1, pageSize = 10) {
    return await this.callCloudFunction('discussion', 'searchDiscussions', { keyword, page, pageSize })
  }
  
  // 通知相关API
  static async getNotificationList(userId, page = 1, pageSize = 10) {
    return await this.callCloudFunction('notification', 'getList', { userId, page, pageSize })
  }
  
  static async markNotificationRead(notificationId, userId) {
    return await this.callCloudFunction('notification', 'markRead', { notificationId, userId })
  }
  
  static async markAllNotificationsRead(userId) {
    return await this.callCloudFunction('notification', 'markAllRead', { userId })
  }
  
  // 学习记录相关API
  static async getLearningRecord(userId, page = 1, pageSize = 10) {
    return await this.callCloudFunction('learning', 'getRecord', { userId, page, pageSize })
  }
  
  static async addLearningRecord(recordData) {
    return await this.callCloudFunction('learning', 'addRecord', recordData)
  }
  
  static async getLearningStats(userId) {
    return await this.callCloudFunction('learning', 'getStats', { userId })
  }
  
  // 活动相关API
  static async getActivityList(params) {
    return await this.callCloudFunction('activity', 'getList', params)
  }
  
  static async getActivityDetail(activityId, userId) {
    return await this.callCloudFunction('activity', 'getDetail', { activityId, userId })
  }
  
  static async joinActivity(activityId, userId) {
    return await this.callCloudFunction('activity', 'join', { activityId, userId })
  }
  
  static async cancelActivity(activityId, userId) {
    return await this.callCloudFunction('activity', 'cancel', { activityId, userId })
  }
  
  // 统计相关API
  static async getUserStats(userId) {
    return await this.callCloudFunction('stats', 'getUserStats', { userId })
  }
  
  // 通用云函数调用方法
  static async callCloudFunction(name, action, data = {}) {
    try {
      const result = await wx.cloud.callFunction({
        name: name,
        data: {
          action: action,
          data: data
        }
      })
      
      if (result.result) {
        return result.result
      } else {
        return {
          success: false,
          message: '调用失败'
        }
      }
    } catch (error) {
      console.error(`云函数调用失败 [${name}.${action}]:`, error)
      return {
        success: false,
        message: '网络错误'
      }
    }
  }
  
  // 文件上传到云存储
  static async uploadFile(filePath, cloudPath) {
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })
      
      return {
        success: true,
        fileID: result.fileID,
        statusCode: result.statusCode
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      return {
        success: false,
        message: '上传失败'
      }
    }
  }
  
  // 从云存储删除文件
  static async deleteFile(fileIDList) {
    try {
      const result = await wx.cloud.deleteFile({
        fileList: fileIDList
      })
      
      return {
        success: true,
        deleteList: result.fileList
      }
    } catch (error) {
      console.error('文件删除失败:', error)
      return {
        success: false,
        message: '删除失败'
      }
    }
  }
  
  // 获取云存储文件下载链接
  static async getTempFileURL(fileIDList) {
    try {
      const result = await wx.cloud.getTempFileURL({
        fileList: fileIDList
      })
      
      return {
        success: true,
        fileList: result.fileList
      }
    } catch (error) {
      console.error('获取文件链接失败:', error)
      return {
        success: false,
        message: '获取链接失败'
      }
    }
  }
}

// 导出API服务
export default ApiService