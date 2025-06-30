export interface User {
  phone_number: string
  name: string
  nickname?: string
  email?: string
  role: 'user' | 'admin'
  status: 'active' | 'inactive' | 'banned'
  created_at: string
}

export interface Resource {
  resource_id: string
  publisher_phone: string
  resource_name: string
  description?: string
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived'
  reviewer_phone?: string
  review_comment?: string
  reviewed_at?: string
  created_at: string
  publisher?: User
}

export interface Post {
  post_id: string
  author_phone: string
  title: string
  content: string
  view_count: number
  comment_count: number
  collection_count: number
  status: 'active' | 'hidden' | 'deleted'
  created_at: string
  author?: User
}

export interface DashboardStats {
  users: number
  resources: number
  posts: number
  pendingResources: number
  activeUsers: number
  publishedResources: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> extends ApiResponse<{
  [key: string]: T[]
  total: number
  page: number
  limit: number
}> {}

export interface LoginForm {
  phone_number: string
  password: string
}

export interface NotificationForm {
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  target_users?: string[]
}