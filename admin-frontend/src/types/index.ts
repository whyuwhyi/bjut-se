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
  // 基础统计
  users: number
  resources: number
  posts: number
  pendingResources: number
  activeUsers: number
  publishedResources: number
  
  // 通知统计
  totalNotifications: number
  todayNotifications: number
  weekNotifications: number
  unreadNotifications: number
  
  // 反馈统计
  totalFeedbacks: number
  pendingFeedbacks: number
  processingFeedbacks: number
  resolvedFeedbacks: number
  todayFeedbacks: number
  
  // 其他统计
  totalComments: number
  totalCollections: number
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

export interface Notification {
  notification_id: string
  type: 'system' | 'resource' | 'post' | 'follow' | 'comment' | 'like'
  priority: 'high' | 'medium' | 'low'
  title: string
  content: string
  action_type?: string
  action_url?: string
  action_params?: string
  is_read: boolean
  read_at?: string
  created_at: string
  sender?: {
    name: string
    phone_number: string
  }
  total_receivers?: number
  read_count?: number
  read_rate?: number
}

export interface NotificationStats {
  total_notifications: number
  today_sent: number
  week_sent: number
  unread_count: number
  total_users: number
  average_read_rate: number
}

export interface Feedback {
  id: number
  user_phone: string
  type: 'bug' | 'feature' | 'ui' | 'performance' | 'content' | 'other'
  content: string
  contact?: string
  images?: string[]
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  reply?: string
  created_at: string
  updated_at: string
  user?: {
    name: string
    phone_number: string
  }
}

export interface FeedbackStats {
  total_feedbacks: number
  today_feedbacks: number
  week_feedbacks: number
  pending_feedbacks: number
  processing_feedbacks: number
  resolved_feedbacks: number
}