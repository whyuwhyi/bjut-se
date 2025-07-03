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

// 容器管理相关接口
export interface Container {
  id: string
  name: string
  image: string
  status: string
  state: string
  created: Date
  ports: ContainerPort[]
  mounts?: ContainerMount[]
  env?: string[]
  stats?: ContainerStats
  labels?: { [key: string]: string }
  networkMode?: string
  restartPolicy?: ContainerRestartPolicy
  error?: string
}

export interface ContainerPort {
  PrivatePort: number
  PublicPort?: number
  Type: string
  IP?: string
}

export interface ContainerMount {
  Source: string
  Destination: string
  Mode: string
  Type: string
  RW: boolean
}

export interface ContainerStats {
  cpu_usage?: any
  memory_usage?: number
  memory_limit?: number
  network?: any
  blkio_stats?: any
}

export interface ContainerRestartPolicy {
  Name: string
  MaximumRetryCount?: number
}

export interface ContainerDetail {
  Id: string
  Name: string
  Image: string
  Config: {
    Image: string
    Env: string[]
    ExposedPorts?: { [key: string]: any }
    WorkingDir?: string
    Entrypoint?: string[]
    Cmd?: string[]
  }
  State: {
    Status: string
    Running: boolean
    Paused: boolean
    Restarting: boolean
    OOMKilled: boolean
    Dead: boolean
    Pid: number
    ExitCode: number
    Error: string
    StartedAt: string
    FinishedAt: string
  }
  HostConfig: {
    NetworkMode: string
    RestartPolicy: ContainerRestartPolicy
    Memory?: number
    CpuShares?: number
    Binds?: string[]
    PortBindings?: { [key: string]: any }
  }
  NetworkSettings: {
    Networks: { [key: string]: any }
    Ports?: { [key: string]: any }
    IPAddress?: string
    Gateway?: string
  }
  Mounts: ContainerMount[]
  logs?: string
  stats?: any
}

export interface SystemStats {
  info: {
    Architecture: string
    Containers: number
    ContainersRunning: number
    ContainersPaused: number
    ContainersStopped: number
    Images: number
    Driver: string
    KernelVersion: string
    OperatingSystem: string
    OSType: string
    NCPU: number
    MemTotal: number
    DockerRootDir: string
    Name: string
    ServerVersion: string
  }
  version: {
    Version: string
    ApiVersion: string
    MinAPIVersion: string
    GitCommit: string
    GoVersion: string
    Os: string
    Arch: string
    BuildTime: string
  }
  timestamp: string
}

export interface DatabaseExecuteRequest {
  containerId: string
  command: string
  database?: string
}

export interface DatabaseExecuteResponse {
  command: string
  output: string
  timestamp: string
}

export interface DatabaseConsistencyRequest {
  containerId: string
}

export interface DatabaseConsistencyResponse {
  checks: {
    [key: string]: {
      query: string
      result?: string
      error?: string
    }
  }
  timestamp: string
}

// 数据库浏览相关接口
export interface DatabaseTable {
  name: string
  rows: number
  size: number
  created: string | null
}

export interface TableColumn {
  field: string
  type: string
  null: string
  key: string
  default: string | null
  extra: string
}

export interface DatabaseListResponse {
  databases: string[]
  timestamp: string
}

export interface TableListResponse {
  database: string
  tables: DatabaseTable[]
  timestamp: string
}

export interface TableStructureResponse {
  database: string
  table: string
  columns: TableColumn[]
  timestamp: string
}

export interface TableDataResponse {
  database: string
  table: string
  rows: any[]
  total: number
  page: number
  limit: number
  timestamp: string
}