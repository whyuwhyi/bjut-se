import request from '@/utils/request'
import type { 
  ApiResponse, 
  DashboardStats, 
  User, 
  Resource, 
  Post, 
  PaginatedResponse,
  NotificationForm 
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

export const updateUserStatus = (phone: string, status: string) => {
  return request.put<ApiResponse>(`/admin/users/${phone}/status`, { status })
}

// 资源管理
export const getPendingResources = () => {
  return request.get<ApiResponse<Resource[]>>('/admin/resources/pending')
}

export const reviewResource = (id: string, action: 'approve' | 'reject', comment?: string) => {
  return request.post<ApiResponse>(`/admin/resources/${id}/review`, {
    action,
    comment
  })
}

// 帖子管理
export const getReportedPosts = () => {
  return request.get<ApiResponse<Post[]>>('/admin/posts/reported')
}

export const hidePost = (id: string) => {
  return request.post<ApiResponse>(`/admin/posts/${id}/hide`)
}

// 通知管理
export const createSystemNotification = (data: NotificationForm) => {
  return request.post<ApiResponse<{ sent_count: number }>>('/admin/notifications/system', data)
}

// 统计数据
export const getStatistics = (type?: string, period?: string) => {
  return request.get<ApiResponse>('/admin/statistics', {
    params: { type, period }
  })
}