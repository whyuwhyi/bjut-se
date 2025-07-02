import request from '@/utils/request'
import type { 
  ApiResponse, 
  DashboardStats, 
  User, 
  Resource, 
  Post, 
  PaginatedResponse,
  NotificationForm,
  Notification,
  NotificationStats
} from '@/types'

// 认证相关
export const login = (phone_number: string, password: string) => {
  return request.post<ApiResponse<{ token: string; user: User }>>('/users/login', {
    phone_number,
    password
  })
}

export const getUserProfile = () => {
  return request.get<ApiResponse<User>>('/users/profile')
}

// 管理面板
export const getDashboard = () => {
  return request.get<ApiResponse<DashboardStats>>('/admin/dashboard')
}

// 用户管理
export const getUsers = (params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
}) => {
  return request.get<PaginatedResponse<User>>('/admin/users', { params })
}

export const getUserDetail = (phone: string) => {
  return request.get<ApiResponse<{ user: User; stats: any }>>(`/admin/users/${phone}`)
}

export const updateUserStatus = (phone: string, status: string) => {
  return request.put<ApiResponse>(`/admin/users/${phone}/status`, { status })
}

export const updateUserRole = (phone: string, role: string) => {
  return request.put<ApiResponse>(`/admin/users/${phone}/role`, { role })
}

export const resetUserPassword = (phone: string, newPassword: string) => {
  return request.post<ApiResponse>(`/admin/users/${phone}/reset-password`, { newPassword })
}

export const deleteUser = (phone: string) => {
  return request.delete<ApiResponse>(`/admin/users/${phone}`)
}

// 资源管理
export const getAllResources = (params?: {
  page?: number
  limit?: number
  status?: string
  category?: string
  search?: string
}) => {
  return request.get<PaginatedResponse<Resource>>('/admin/resources', { params })
}

export const getPendingResources = () => {
  return request.get<ApiResponse<Resource[]>>('/admin/resources/pending')
}

export const reviewResource = (id: string, action: 'approve' | 'reject', comment?: string) => {
  return request.post<ApiResponse>(`/admin/resources/${id}/review`, {
    action,
    comment
  })
}

export const deleteResource = (id: string, reason?: string) => {
  return request.delete<ApiResponse>(`/admin/resources/${id}`, {
    data: { reason }
  })
}

// 资源举报管理
export const getResourceReports = (params?: {
  page?: number
  limit?: number
  status?: string
}) => {
  return request.get<PaginatedResponse<any>>('/admin/resources/reports', { params })
}

export const handleResourceReport = (reportId: string, action: string, result: string) => {
  return request.post<ApiResponse>(`/admin/resources/reports/${reportId}/handle`, {
    action,
    result
  })
}

// 论坛管理
export const getAllPosts = (params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) => {
  return request.get<PaginatedResponse<Post>>('/admin/posts', { params })
}

export const updatePostStatus = (id: string, status: string, reason?: string) => {
  return request.put<ApiResponse>(`/admin/posts/${id}/status`, {
    status,
    reason
  })
}

// 帖子举报管理
export const getPostReports = (params?: {
  page?: number
  limit?: number
  status?: string
}) => {
  return request.get<PaginatedResponse<any>>('/admin/posts/reports', { params })
}

export const handlePostReport = (reportId: string, action: string, result: string) => {
  return request.post<ApiResponse>(`/admin/posts/reports/${reportId}/handle`, {
    action,
    result
  })
}

// 旧API兼容性
export const getReportedPosts = () => {
  return request.get<ApiResponse<Post[]>>('/admin/posts/reported')
}

export const hidePost = (id: string) => {
  return request.post<ApiResponse>(`/admin/posts/${id}/hide`)
}

// 通知管理
export const getAllNotifications = (params?: {
  page?: number
  limit?: number
  type?: string
  priority?: string
  search?: string
  start_date?: string
  end_date?: string
}) => {
  return request.get<ApiResponse<{
    notifications: Notification[]
    total: number
    page: number
    limit: number
  }>>('/admin/notifications', { params })
}

export const getNotificationStats = () => {
  return request.get<ApiResponse<NotificationStats>>('/admin/notifications/stats')
}

export const createSystemNotification = (data: NotificationForm) => {
  return request.post<ApiResponse<{ sent_count: number }>>('/admin/notifications/system', data)
}

export const deleteNotificationBatch = (notification_ids: string[]) => {
  return request.delete<ApiResponse<{ deleted_count: number }>>('/admin/notifications/batch', {
    data: { notification_ids }
  })
}

// 反馈管理
export const getAllFeedbacks = (params?: {
  page?: number
  limit?: number
  type?: string
  status?: string
  search?: string
  start_date?: string
  end_date?: string
}) => {
  return request.get<ApiResponse<{
    feedbacks: Feedback[]
    total: number
    page: number
    limit: number
  }>>('/admin/feedbacks', { params })
}

export const getFeedbackStats = () => {
  return request.get<ApiResponse<FeedbackStats>>('/admin/feedbacks/stats')
}

export const updateFeedbackStatus = (id: number, status: string, reply?: string) => {
  return request.put<ApiResponse>(`/admin/feedbacks/${id}/status`, { status, reply })
}

export const deleteFeedbackBatch = (feedback_ids: number[]) => {
  return request.delete<ApiResponse<{ deleted_count: number }>>('/admin/feedbacks/batch', {
    data: { feedback_ids }
  })
}

// 统计数据
export const getStatistics = (type?: string, period?: string) => {
  return request.get<ApiResponse>('/admin/statistics', {
    params: { type, period }
  })
}