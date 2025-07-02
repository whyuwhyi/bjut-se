<template>
  <div class="notification-management">
    <div class="header">
      <h1>通知管理</h1>
      <div class="search-bar" v-if="activeTab === 'list'">
        <el-input
          v-model="searchText"
          placeholder="搜索通知标题或内容"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 通知列表标签页 -->
      <el-tab-pane label="通知列表" name="list">
        <!-- 统计卡片 -->
        <div class="stats-cards" v-if="notificationStats">
          <el-row :gutter="20">
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ notificationStats.total_notifications }}</div>
                  <div class="stat-label">总通知数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ notificationStats.today_sent }}</div>
                  <div class="stat-label">今日发送</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ notificationStats.week_sent }}</div>
                  <div class="stat-label">本周发送</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ notificationStats.unread_count }}</div>
                  <div class="stat-label">未读数量</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ notificationStats.total_users }}</div>
                  <div class="stat-label">活跃用户</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ notificationStats.average_read_rate }}%</div>
                  <div class="stat-label">平均阅读率</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 筛选器 -->
        <div class="filters">
          <el-select v-model="filters.type" placeholder="通知类型" clearable style="width: 120px">
            <el-option label="系统通知" value="system" />
            <el-option label="资源通知" value="resource" />
            <el-option label="帖子通知" value="post" />
            <el-option label="关注通知" value="follow" />
            <el-option label="评论通知" value="comment" />
          </el-select>
          <el-select v-model="filters.priority" placeholder="优先级" clearable style="width: 120px">
            <el-option label="高优先级" value="high" />
            <el-option label="中优先级" value="medium" />
            <el-option label="低优先级" value="low" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 300px"
          />
          <el-button @click="handleReset">重置</el-button>
          <el-button type="danger" :disabled="selectedNotifications.length === 0" @click="handleBatchDelete">
            批量删除 ({{ selectedNotifications.length }})
          </el-button>
        </div>

        <!-- 通知列表 -->
        <el-table
          v-loading="notificationLoading"
          :data="notifications"
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="标题" width="200" show-overflow-tooltip />
          <el-table-column prop="content" label="内容" width="250" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="content-preview">{{ row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityTagType(row.priority)">{{ getPriorityText(row.priority) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="total_receivers" label="发送用户" width="100" align="center" />
          <el-table-column prop="read_count" label="已读用户" width="100" align="center" />
          <el-table-column prop="read_rate" label="阅读率" width="100" align="center">
            <template #default="{ row }">
              <span :class="getReadRateClass(row.read_rate)">{{ row.read_rate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="发送时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="viewNotification(row)">详情</el-button>
                <el-popconfirm
                  title="确定要删除这个通知吗？"
                  @confirm="deleteNotification(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-tab-pane>

      <!-- 发送通知标签页 -->
      <el-tab-pane label="发送通知" name="send">
        <el-card class="send-card">
          <template #header>
            <div class="card-header">
              <h3>发送系统通知</h3>
            </div>
          </template>
          
          <el-form
            ref="notificationFormRef"
            :model="notificationForm"
            :rules="notificationRules"
            label-width="100px"
            class="notification-form"
          >
            <el-form-item label="通知标题" prop="title">
              <el-input
                v-model="notificationForm.title"
                placeholder="请输入通知标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="通知内容" prop="content">
              <el-input
                v-model="notificationForm.content"
                type="textarea"
                :rows="6"
                placeholder="请输入通知内容"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="优先级" prop="priority">
              <el-radio-group v-model="notificationForm.priority">
                <el-radio-button label="low">低</el-radio-button>
                <el-radio-button label="medium">中</el-radio-button>
                <el-radio-button label="high">高</el-radio-button>
              </el-radio-group>
              <div class="priority-hint">
                <el-text size="small" type="info">
                  高优先级通知会优先显示给用户
                </el-text>
              </div>
            </el-form-item>
            
            <el-form-item label="发送范围">
              <el-radio-group v-model="sendType" @change="handleSendTypeChange">
                <el-radio-button label="all">全体用户</el-radio-button>
                <el-radio-button label="specific">指定用户</el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="sendType === 'specific'" label="目标用户" prop="target_users">
              <el-select
                v-model="notificationForm.target_users"
                multiple
                filterable
                remote
                reserve-keyword
                placeholder="输入手机号搜索用户"
                :remote-method="searchUsers"
                :loading="userSearchLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="user in searchResults"
                  :key="user.phone_number"
                  :label="`${user.name || user.phone_number} (${user.phone_number})`"
                  :value="user.phone_number"
                />
              </el-select>
              <div class="user-hint">
                <el-text size="small" type="info">
                  可输入手机号或姓名搜索用户，支持多选
                </el-text>
              </div>
            </el-form-item>
            
            <el-form-item>
              <div class="form-actions">
                <el-button @click="resetForm">重置</el-button>
                <el-button type="primary" :loading="sending" @click="sendNotification">
                  {{ sending ? '发送中...' : '发送通知' }}
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 通知详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="通知详情" width="800px">
      <div v-if="selectedNotification" class="notification-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题">{{ selectedNotification.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTagType(selectedNotification.type)">{{ getTypeText(selectedNotification.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityTagType(selectedNotification.priority)">{{ getPriorityText(selectedNotification.priority) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ formatDate(selectedNotification.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="发送用户数">{{ selectedNotification.total_receivers }}</el-descriptions-item>
          <el-descriptions-item label="已读用户数">{{ selectedNotification.read_count }}</el-descriptions-item>
          <el-descriptions-item label="阅读率" :span="2">
            <span :class="getReadRateClass(selectedNotification.read_rate)">{{ selectedNotification.read_rate }}%</span>
          </el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="notification-content">{{ selectedNotification.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { 
  createSystemNotification, 
  getUsers, 
  getAllNotifications, 
  getNotificationStats,
  deleteNotificationBatch 
} from '@/api/admin'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { NotificationForm, User, Notification, NotificationStats } from '@/types'

// 发送通知相关
const notificationFormRef = ref<FormInstance>()
const sending = ref(false)
const userSearchLoading = ref(false)
const sendType = ref<'all' | 'specific'>('all')
const searchResults = ref<User[]>([])

// 标签页和搜索
const activeTab = ref<'list' | 'send'>('list')
const searchText = ref('')

// 通知列表相关
const notificationLoading = ref(false)
const notifications = ref<Notification[]>([])
const notificationStats = ref<NotificationStats | null>(null)
const selectedNotifications = ref<Notification[]>([])
const selectedNotification = ref<Notification | null>(null)
const detailDialogVisible = ref(false)

// 筛选和分页
const filters = reactive({
  type: '',
  priority: ''
})
const dateRange = ref<[string, string] | null>(null)
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const notificationForm = reactive<NotificationForm>({
  title: '',
  content: '',
  priority: 'medium',
  target_users: []
})

const notificationRules: FormRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 5, max: 1000, message: '内容长度在 5 到 1000 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  target_users: [
    {
      validator: (rule, value, callback) => {
        if (sendType.value === 'specific' && (!value || value.length === 0)) {
          callback(new Error('请至少选择一个目标用户'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const handleSendTypeChange = (type: 'all' | 'specific') => {
  if (type === 'all') {
    notificationForm.target_users = []
  }
}

const searchUsers = async (query: string) => {
  if (!query) {
    searchResults.value = []
    return
  }
  
  userSearchLoading.value = true
  try {
    const response = await getUsers({
      search: query,
      limit: 20
    })
    const data = response.data.data!
    searchResults.value = data.users || []
  } catch (error: any) {
    ElMessage.error(error.message || '搜索用户失败')
  } finally {
    userSearchLoading.value = false
  }
}

const sendNotification = async () => {
  if (!notificationFormRef.value) return
  
  try {
    await notificationFormRef.value.validate()
    
    sending.value = true
    
    const formData = { ...notificationForm }
    if (sendType.value === 'all') {
      delete formData.target_users
    }
    
    const response = await createSystemNotification(formData)
    const sentCount = response.data.data?.sent_count || 0
    
    ElMessage.success(`通知发送成功，共发送给 ${sentCount} 个用户`)
    resetForm()
    
    // 如果当前在通知列表标签页，刷新数据
    if (activeTab.value === 'list') {
      loadNotifications()
      loadNotificationStats()
    }
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    sending.value = false
  }
}

const resetForm = () => {
  if (!notificationFormRef.value) return
  
  notificationFormRef.value.resetFields()
  notificationForm.title = ''
  notificationForm.content = ''
  notificationForm.priority = 'medium'
  notificationForm.target_users = []
  sendType.value = 'all'
  searchResults.value = []
}

// 通知列表相关方法
const loadNotifications = async () => {
  notificationLoading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit
    }
    
    if (searchText.value) {
      params.search = searchText.value
    }
    if (filters.type) {
      params.type = filters.type
    }
    if (filters.priority) {
      params.priority = filters.priority
    }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    const response = await getAllNotifications(params)
    const data = response.data.data!
    notifications.value = data.notifications
    pagination.total = data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取通知列表失败')
  } finally {
    notificationLoading.value = false
  }
}

const loadNotificationStats = async () => {
  try {
    const response = await getNotificationStats()
    notificationStats.value = response.data.data!
  } catch (error: any) {
    console.error('获取通知统计失败:', error)
  }
}


const handleTabChange = (tabName: string) => {
  if (tabName === 'list') {
    loadNotifications()
    loadNotificationStats()
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadNotifications()
}

const handleReset = () => {
  searchText.value = ''
  filters.type = ''
  filters.priority = ''
  dateRange.value = null
  pagination.page = 1
  loadNotifications()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadNotifications()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadNotifications()
}

const handleSelectionChange = (selection: Notification[]) => {
  selectedNotifications.value = selection
}

const viewNotification = (notification: Notification) => {
  selectedNotification.value = notification
  detailDialogVisible.value = true
}

const deleteNotification = async (notification: Notification) => {
  try {
    await deleteNotificationBatch([notification.notification_id])
    ElMessage.success('删除成功')
    loadNotifications()
    loadNotificationStats()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedNotifications.value.length === 0) {
    ElMessage.warning('请选择要删除的通知')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedNotifications.value.length} 条通知吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedNotifications.value.map(n => n.notification_id)
    await deleteNotificationBatch(ids)
    ElMessage.success(`成功删除 ${ids.length} 条通知`)
    selectedNotifications.value = []
    loadNotifications()
    loadNotificationStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 工具方法
const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    system: '系统',
    resource: '资源',
    post: '帖子',
    follow: '关注',
    comment: '评论',
    like: '点赞'
  }
  return texts[type] || type
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    system: 'danger',
    resource: 'success',
    post: 'info',
    follow: 'warning',
    comment: 'primary',
    like: ''
  }
  return types[type] || ''
}

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority] || priority
}

const getPriorityTagType = (priority: string) => {
  const types: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || ''
}

const getReadRateClass = (rate: number) => {
  if (rate >= 80) return 'read-rate-high'
  if (rate >= 50) return 'read-rate-medium'
  return 'read-rate-low'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 监听筛选条件变化
watch([() => filters.type, () => filters.priority, dateRange], () => {
  pagination.page = 1
  loadNotifications()
})

// 原有的发送通知方法保持不变，但在成功后刷新列表

onMounted(() => {
  if (activeTab.value === 'list') {
    loadNotifications()
    loadNotificationStats()
  }
})
</script>

<style scoped>
.notification-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.search-bar {
  display: flex;
  gap: 10px;
}

.send-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.notification-form {
  max-width: 600px;
}

.priority-hint {
  margin-top: 5px;
}

.user-hint {
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 筛选器 */
.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

/* 通知列表 */
.content-preview {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.read-rate-high {
  color: #67c23a;
  font-weight: bold;
}

.read-rate-medium {
  color: #e6a23c;
  font-weight: bold;
}

.read-rate-low {
  color: #f56c6c;
  font-weight: bold;
}

/* 分页 */
.pagination {
  margin-top: 20px;
  text-align: center;
}

/* 通知详情 */
.notification-detail {
  padding: 20px 0;
}

.notification-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

:deep(.el-select) {
  width: 100%;
}

@media (max-width: 768px) {
  .notification-form {
    max-width: 100%;
  }
  
  .form-actions {
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>