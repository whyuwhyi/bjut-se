<template>
  <div class="feedback-management">
    <div class="header">
      <h1>反馈管理</h1>
      <div class="search-bar" v-if="activeTab === 'list'">
        <el-input
          v-model="searchText"
          placeholder="搜索反馈内容、联系方式或回复"
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
      <!-- 反馈列表标签页 -->
      <el-tab-pane label="反馈列表" name="list">
        <!-- 统计卡片 -->
        <div class="stats-cards" v-if="feedbackStats">
          <el-row :gutter="20">
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ feedbackStats.total_feedbacks }}</div>
                  <div class="stat-label">总反馈数</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ feedbackStats.today_feedbacks }}</div>
                  <div class="stat-label">今日新增</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ feedbackStats.week_feedbacks }}</div>
                  <div class="stat-label">本周新增</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ feedbackStats.pending_feedbacks }}</div>
                  <div class="stat-label">待处理</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ feedbackStats.processing_feedbacks }}</div>
                  <div class="stat-label">处理中</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="4">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ feedbackStats.resolved_feedbacks }}</div>
                  <div class="stat-label">已解决</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 筛选器 -->
        <div class="filters">
          <el-select v-model="filters.type" placeholder="反馈类型" clearable style="width: 120px">
            <el-option label="Bug报告" value="bug" />
            <el-option label="功能建议" value="feature" />
            <el-option label="界面问题" value="ui" />
            <el-option label="性能问题" value="performance" />
            <el-option label="内容问题" value="content" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-select v-model="filters.status" placeholder="处理状态" clearable style="width: 120px">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
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
          <el-button type="danger" :disabled="selectedFeedbacks.length === 0" @click="handleBatchDelete">
            批量删除 ({{ selectedFeedbacks.length }})
          </el-button>
        </div>

        <!-- 反馈列表 -->
        <el-table
          v-loading="feedbackLoading"
          :data="feedbacks"
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="user" label="用户" width="120">
            <template #default="{ row }">
              <div>{{ row.user?.name || row.user_phone }}</div>
              <div class="text-gray">{{ row.user_phone }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="反馈内容" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="content-preview">{{ row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="contact" label="联系方式" width="150" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="viewFeedback(row)">详情</el-button>
                <el-button 
                  v-if="row.status === 'pending'"
                  size="small" 
                  type="primary" 
                  @click="processFeedback(row)"
                >
                  处理
                </el-button>
                <el-popconfirm
                  title="确定要删除这个反馈吗？"
                  @confirm="deleteFeedback(row)"
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

      <!-- 反馈统计标签页 -->
      <el-tab-pane label="反馈统计" name="stats">
        <div class="stats-dashboard" v-if="feedbackStats">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h3>反馈概览</h3>
                </template>
                <div class="overview-grid">
                  <div class="overview-item">
                    <div class="overview-number">{{ feedbackStats.total_feedbacks }}</div>
                    <div class="overview-label">总反馈数</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-number">{{ feedbackStats.pending_feedbacks }}</div>
                    <div class="overview-label">待处理</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-number">{{ feedbackStats.processing_feedbacks }}</div>
                    <div class="overview-label">处理中</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-number">{{ feedbackStats.resolved_feedbacks }}</div>
                    <div class="overview-label">已解决</div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h3>处理效率</h3>
                </template>
                <div class="efficiency-info">
                  <div class="efficiency-item">
                    <div class="efficiency-label">今日新增</div>
                    <div class="efficiency-value">{{ feedbackStats.today_feedbacks }} 条</div>
                  </div>
                  <div class="efficiency-item">
                    <div class="efficiency-label">本周新增</div>
                    <div class="efficiency-value">{{ feedbackStats.week_feedbacks }} 条</div>
                  </div>
                  <div class="efficiency-item">
                    <div class="efficiency-label">解决率</div>
                    <div class="efficiency-value">{{ getResolutionRate() }}%</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 反馈详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="反馈详情" width="800px">
      <div v-if="selectedFeedback" class="feedback-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户">{{ selectedFeedback.user?.name || selectedFeedback.user_phone }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ selectedFeedback.user_phone }}</el-descriptions-item>
          <el-descriptions-item label="反馈类型">
            <el-tag :type="getTypeTagType(selectedFeedback.type)">{{ getTypeText(selectedFeedback.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTagType(selectedFeedback.status)">{{ getStatusText(selectedFeedback.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系方式" :span="2">{{ selectedFeedback.contact || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ formatDate(selectedFeedback.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="反馈内容" :span="2">
            <div class="feedback-content">{{ selectedFeedback.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedFeedback.images && selectedFeedback.images.length > 0" label="附图" :span="2">
            <div class="feedback-images">
              <el-image
                v-for="(image, index) in selectedFeedback.images"
                :key="index"
                :src="image"
                style="width: 100px; height: 100px; margin-right: 10px"
                fit="cover"
                :preview-src-list="selectedFeedback.images"
                :initial-index="index"
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedFeedback.reply" label="管理员回复" :span="2">
            <div class="feedback-reply">{{ selectedFeedback.reply }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedFeedback.replied_by" label="回复管理员">
            <el-tag size="small">{{ selectedFeedback.replied_by }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedFeedback.replied_at" label="回复时间">
            {{ formatDate(selectedFeedback.replied_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 处理反馈对话框 -->
    <el-dialog v-model="processDialogVisible" title="处理反馈" width="600px">
      <el-form
        ref="processFormRef"
        :model="processForm"
        :rules="processRules"
        label-width="100px"
      >
        <el-form-item label="处理状态" prop="status">
          <el-radio-group v-model="processForm.status">
            <el-radio-button label="processing">处理中</el-radio-button>
            <el-radio-button label="resolved">已解决</el-radio-button>
            <el-radio-button label="closed">已关闭</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复内容" prop="reply">
          <el-input
            v-model="processForm.reply"
            type="textarea"
            :rows="6"
            placeholder="请输入处理结果或回复内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="processing" @click="confirmProcess">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { 
  getAllFeedbacks, 
  getFeedbackStats,
  updateFeedbackStatus,
  deleteFeedbackBatch 
} from '@/api/admin'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { Feedback, FeedbackStats } from '@/types'

// 标签页和搜索
const activeTab = ref<'list' | 'stats'>('list')
const searchText = ref('')

// 反馈列表相关
const feedbackLoading = ref(false)
const feedbacks = ref<Feedback[]>([])
const feedbackStats = ref<FeedbackStats | null>(null)
const selectedFeedbacks = ref<Feedback[]>([])
const selectedFeedback = ref<Feedback | null>(null)
const detailDialogVisible = ref(false)

// 处理反馈相关
const processDialogVisible = ref(false)
const processing = ref(false)
const processFormRef = ref<FormInstance>()
const processForm = reactive({
  status: 'processing',
  reply: ''
})

const processRules: FormRules = {
  status: [
    { required: true, message: '请选择处理状态', trigger: 'change' }
  ],
  reply: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 10, max: 1000, message: '回复内容长度在 10 到 1000 个字符', trigger: 'blur' }
  ]
}

// 筛选和分页
const filters = reactive({
  type: '',
  status: ''
})
const dateRange = ref<[string, string] | null>(null)
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 加载反馈列表
const loadFeedbacks = async () => {
  feedbackLoading.value = true
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
    if (filters.status) {
      params.status = filters.status
    }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    const response = await getAllFeedbacks(params)
    const data = response.data.data!
    feedbacks.value = data.feedbacks
    pagination.total = data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取反馈列表失败')
  } finally {
    feedbackLoading.value = false
  }
}

// 加载反馈统计
const loadFeedbackStats = async () => {
  try {
    const response = await getFeedbackStats()
    feedbackStats.value = response.data.data!
  } catch (error: any) {
    console.error('获取反馈统计失败:', error)
  }
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'list') {
    loadFeedbacks()
    loadFeedbackStats()
  } else if (tabName === 'stats') {
    loadFeedbackStats()
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadFeedbacks()
}

const handleReset = () => {
  searchText.value = ''
  filters.type = ''
  filters.status = ''
  dateRange.value = null
  pagination.page = 1
  loadFeedbacks()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadFeedbacks()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadFeedbacks()
}

const handleSelectionChange = (selection: Feedback[]) => {
  selectedFeedbacks.value = selection
}

const viewFeedback = (feedback: Feedback) => {
  selectedFeedback.value = feedback
  detailDialogVisible.value = true
}

const processFeedback = (feedback: Feedback) => {
  selectedFeedback.value = feedback
  processForm.status = 'processing'
  processForm.reply = ''
  processDialogVisible.value = true
}

const confirmProcess = async () => {
  if (!processFormRef.value || !selectedFeedback.value) return
  
  try {
    await processFormRef.value.validate()
    
    processing.value = true
    
    await updateFeedbackStatus(
      selectedFeedback.value.id,
      processForm.status,
      processForm.reply
    )
    
    ElMessage.success('反馈处理成功')
    processDialogVisible.value = false
    loadFeedbacks()
    loadFeedbackStats()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    processing.value = false
  }
}

const deleteFeedback = async (feedback: Feedback) => {
  try {
    await deleteFeedbackBatch([feedback.id])
    ElMessage.success('删除成功')
    loadFeedbacks()
    loadFeedbackStats()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedFeedbacks.value.length === 0) {
    ElMessage.warning('请选择要删除的反馈')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFeedbacks.value.length} 条反馈吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedFeedbacks.value.map(f => f.id)
    await deleteFeedbackBatch(ids)
    ElMessage.success(`成功删除 ${ids.length} 条反馈`)
    selectedFeedbacks.value = []
    loadFeedbacks()
    loadFeedbackStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 工具方法
const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    bug: 'Bug报告',
    feature: '功能建议',
    ui: '界面问题',
    performance: '性能问题',
    content: '内容问题',
    other: '其他'
  }
  return texts[type] || type
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    bug: 'danger',
    feature: 'primary',
    ui: 'warning',
    performance: 'info',
    content: 'success',
    other: ''
  }
  return types[type] || ''
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return texts[status] || status
}

const getStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success',
    closed: 'info'
  }
  return types[status] || ''
}

const getResolutionRate = () => {
  if (!feedbackStats.value || feedbackStats.value.total_feedbacks === 0) return 0
  return Math.round((feedbackStats.value.resolved_feedbacks / feedbackStats.value.total_feedbacks) * 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 监听筛选条件变化
watch([() => filters.type, () => filters.status, dateRange], () => {
  pagination.page = 1
  loadFeedbacks()
})

onMounted(() => {
  if (activeTab.value === 'list') {
    loadFeedbacks()
    loadFeedbackStats()
  }
})
</script>

<style scoped>
.feedback-management {
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

/* 反馈列表 */
.content-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-gray {
  color: #909399;
  font-size: 12px;
}

/* 分页 */
.pagination {
  margin-top: 20px;
  text-align: center;
}

/* 统计面板 */
.stats-dashboard {
  margin-top: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.overview-item {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.overview-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}

.efficiency-info {
  padding: 20px 0;
}

.efficiency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.efficiency-item:last-child {
  border-bottom: none;
}

.efficiency-label {
  font-size: 14px;
  color: #606266;
}

.efficiency-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

/* 反馈详情 */
.feedback-detail {
  padding: 20px 0;
}

.feedback-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.feedback-reply {
  background-color: #e6f7ff;
  padding: 15px;
  border-radius: 8px;
  line-height: 1.6;
  border-left: 4px solid #409eff;
}

.feedback-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .filters {
    flex-wrap: wrap;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>