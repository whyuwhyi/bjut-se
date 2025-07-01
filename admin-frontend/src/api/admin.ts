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
export const createSystemNotification = (data: NotificationForm) => {
  return request.post<ApiResponse<{ sent_count: number }>>('/admin/notifications/system', data)
}

// 统计数据
export const getStatistics = (type?: string, period?: string) => {
  return request.get<ApiResponse>('/admin/statistics', {
    params: { type, period }
  })
}