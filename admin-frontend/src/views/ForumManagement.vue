<template>
  <div class="forum-management">
    <div class="header">
      <h1>论坛管理</h1>
      <div class="header-actions">
        <div class="search-bar">
          <el-input
            v-model="filters.search"
            placeholder="搜索帖子标题或内容"
            style="width: 300px"
            clearable
            @keyup.enter="loadPosts"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="loadPosts">搜索</el-button>
        </div>
        <el-button @click="loadPosts" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="filters">
      <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 120px">
        <el-option label="正常" value="active" />
        <el-option label="已隐藏" value="hidden" />
        <el-option label="已删除" value="deleted" />
      </el-select>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="帖子列表" name="posts">
        <!-- 帖子表格 -->
        <el-table
          :data="posts"
          v-loading="loading"
          style="width: 100%"
          empty-text="暂无帖子数据"
        >
          <el-table-column prop="post_id" label="帖子ID" width="100" />
          <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip />
          <el-table-column label="作者" width="120">
            <template #default="{ row }">
              {{ row.author?.name || row.author_phone }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="统计" width="120">
            <template #default="{ row }">
              <div class="stats">
                <span>浏览: {{ row.view_count }}</span><br>
                <span>评论: {{ row.comment_count }}</span><br>
                <span>收藏: {{ row.collection_count }}</span><br>
                <span>举报: {{ row.report_count }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="发布时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="viewDetails(row)">详情</el-button>
                <el-button
                  v-if="row.status === 'active'"
                  type="warning"
                  size="small"
                  @click="handleStatusChange(row, 'hidden')"
                >
                  隐藏
                </el-button>
                <el-button
                  v-if="row.status === 'hidden'"
                  type="success"
                  size="small"
                  @click="handleStatusChange(row, 'active')"
                >
                  恢复
                </el-button>
                <el-button
                  v-if="['active', 'hidden'].includes(row.status)"
                  type="danger"
                  size="small"
                  @click="handleStatusChange(row, 'deleted')"
                >
                  删除
                </el-button>
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
            @size-change="loadPosts"
            @current-change="loadPosts"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`举报管理 (${reportCount})`" name="reports">
        <!-- 举报列表 -->
        <el-table
          :data="reports"
          v-loading="reportLoading"
          style="width: 100%"
          empty-text="暂无举报数据"
        >
          <el-table-column prop="report_id" label="举报ID" width="100" />
          <el-table-column label="帖子信息" min-width="250">
            <template #default="{ row }">
              <div v-if="row.post">
                <div><strong>{{ row.post.title }}</strong></div>
                <div class="text-gray">{{ row.post.post_id }}</div>
                <div class="text-gray">作者: {{ row.post.author?.name }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="举报者" width="120">
            <template #default="{ row }">
              {{ row.reporter?.name || row.reporter_phone }}
            </template>
          </el-table-column>
          <el-table-column label="举报原因" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getReasonText(row.reason) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="详细描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'pending' ? 'warning' : 'success'"
                size="small"
              >
                {{ row.status === 'pending' ? '待处理' : '已处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="举报时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'pending'"
                type="primary"
                size="small"
                @click="handleReport(row)"
              >
                处理
              </el-button>
              <span v-else class="text-gray">已处理</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- 举报分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="reportPagination.page"
            v-model:page-size="reportPagination.limit"
            :page-sizes="[10, 20, 50]"
            :total="reportPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadReports"
            @current-change="loadReports"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 状态更改确认对话框 -->
    <el-dialog
      v-model="statusDialog.visible"
      :title="getStatusActionTitle(statusDialog.action)"
      width="500px"
    >
      <div v-if="statusDialog.post">
        <p>确定要{{ getStatusActionText(statusDialog.action) }}以下帖子吗？</p>
        <div class="post-details">
          <p><strong>帖子标题:</strong> {{ statusDialog.post.title }}</p>
          <p><strong>作者:</strong> {{ statusDialog.post.author?.name || statusDialog.post.author_phone }}</p>
          <p><strong>发布时间:</strong> {{ formatDate(statusDialog.post.created_at) }}</p>
        </div>
        
        <el-form ref="statusFormRef" :model="statusForm" v-if="statusDialog.action !== 'active'">
          <el-form-item label="操作原因" prop="reason">
            <el-input
              v-model="statusForm.reason"
              type="textarea"
              :rows="3"
              :placeholder="`请说明${getStatusActionText(statusDialog.action)}原因`"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="statusDialog.visible = false">取消</el-button>
        <el-button
          :type="getStatusActionType(statusDialog.action)"
          :loading="statusLoading"
          @click="confirmStatusChange"
        >
          确认{{ getStatusActionText(statusDialog.action) }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 举报处理对话框 -->
    <el-dialog
      v-model="reportDialog.visible"
      title="处理举报"
      width="600px"
    >
      <div v-if="reportDialog.report">
        <div class="report-details">
          <h4>举报信息</h4>
          <p><strong>举报原因:</strong> {{ getReasonText(reportDialog.report.reason) }}</p>
          <p><strong>举报者:</strong> {{ reportDialog.report.reporter?.name || reportDialog.report.reporter_phone }}</p>
          <p><strong>举报时间:</strong> {{ formatDate(reportDialog.report.created_at) }}</p>
          <div v-if="reportDialog.report.description">
            <p><strong>详细描述:</strong></p>
            <div class="description">{{ reportDialog.report.description }}</div>
          </div>
          
          <h4 style="margin-top: 20px;">被举报帖子</h4>
          <p><strong>帖子标题:</strong> {{ reportDialog.report.post?.title }}</p>
          <p><strong>作者:</strong> {{ reportDialog.report.post?.author?.name }}</p>
          <div v-if="reportDialog.report.post?.content">
            <p><strong>帖子内容:</strong></p>
            <div class="description">{{ getContentPreview(reportDialog.report.post.content, 200) }}</div>
          </div>
        </div>
        
        <el-form ref="reportFormRef" :model="reportForm">
          <el-form-item label="处理方式" prop="action" required>
            <el-radio-group v-model="reportForm.action">
              <el-radio value="hide_post">隐藏帖子</el-radio>
              <el-radio value="delete_post">删除帖子</el-radio>
              <el-radio value="ignore">忽略举报</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="处理结果" prop="result" required>
            <el-input
              v-model="reportForm.result"
              type="textarea"
              :rows="3"
              placeholder="请说明处理结果"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="reportDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="reportLoading"
          @click="confirmReportHandle"
        >
          确认处理
        </el-button>
      </template>
    </el-dialog>

    <!-- 帖子详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="帖子详情"
      width="800px"
      :destroy-on-close="true"
    >
      <div v-if="detailDialog.post" class="post-detail">
        <div class="post-header">
          <h2>{{ detailDialog.post.title }}</h2>
          <div class="post-meta">
            <span>作者: {{ detailDialog.post.author?.name || detailDialog.post.author_phone }}</span>
            <span>发布时间: {{ formatDate(detailDialog.post.created_at) }}</span>
            <el-tag :type="getStatusType(detailDialog.post.status)" size="small">
              {{ getStatusText(detailDialog.post.status) }}
            </el-tag>
          </div>
        </div>
        
        <div class="post-content">
          <div class="content-text">{{ detailDialog.post.content }}</div>
        </div>
        
        <div class="post-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="浏览次数" :value="detailDialog.post.view_count" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="评论数" :value="detailDialog.post.comment_count" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="收藏数" :value="detailDialog.post.collection_count" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="举报数" :value="detailDialog.post.report_count" />
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getAllPosts, updatePostStatus, getPostReports, handlePostReport } from '@/api/admin'
import type { Post } from '@/types'

const loading = ref(false)
const statusLoading = ref(false)
const reportLoading = ref(false)
const activeTab = ref('posts')

const posts = ref([])
const reports = ref([])

const filters = reactive({
  status: '',
  search: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const reportPagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const statusDialog = reactive({
  visible: false,
  action: '',
  post: null
})

const reportDialog = reactive({
  visible: false,
  report: null
})

const detailDialog = reactive({
  visible: false,
  post: null
})

const statusForm = reactive({
  reason: ''
})

const reportForm = reactive({
  action: '',
  result: ''
})

const statusFormRef = ref<FormInstance>()
const reportFormRef = ref<FormInstance>()

const reportCount = computed(() => {
  return reports.value.filter(r => r.status === 'pending').length
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getContentPreview = (content: string, maxLength: number = 100) => {
  if (!content) return ''
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
}

const getStatusType = (status: string) => {
  const types = {
    active: 'success',
    hidden: 'warning',
    deleted: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    active: '正常',
    hidden: '已隐藏',
    deleted: '已删除'
  }
  return texts[status] || status
}

const getReasonText = (reason: string) => {
  const texts = {
    inappropriate: '内容不当',
    spam: '垃圾信息',
    offensive: '冒犯性内容',
    harassment: '骚扰他人',
    false_info: '虚假信息',
    other: '其他'
  }
  return texts[reason] || reason
}

const getStatusActionTitle = (action: string) => {
  const titles = {
    active: '恢复帖子',
    hidden: '隐藏帖子',
    deleted: '删除帖子'
  }
  return titles[action] || '更改状态'
}

const getStatusActionText = (action: string) => {
  const texts = {
    active: '恢复',
    hidden: '隐藏',
    deleted: '删除'
  }
  return texts[action] || '更改'
}

const getStatusActionType = (action: string) => {
  const types = {
    active: 'success',
    hidden: 'warning',
    deleted: 'danger'
  }
  return types[action] || 'primary'
}

const loadPosts = async () => {
  loading.value = true
  try {
    const response = await getAllPosts({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
      search: filters.search
    })
    posts.value = response.data.data.posts || []
    pagination.total = response.data.data.total || 0
    
    ElMessage.success('帖子列表加载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '加载帖子列表失败')
  } finally {
    loading.value = false
  }
}

const loadReports = async () => {
  reportLoading.value = true
  try {
    const response = await getPostReports({
      page: reportPagination.page,
      limit: reportPagination.limit,
      status: 'pending'
    })
    reports.value = response.data.data.reports || []
    reportPagination.total = response.data.data.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载举报列表失败')
  } finally {
    reportLoading.value = false
  }
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'posts') {
    loadPosts()
  } else if (tabName === 'reports') {
    loadReports()
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.search = ''
  pagination.page = 1
  loadPosts()
}

const handleStatusChange = (post: any, action: string) => {
  statusDialog.post = post
  statusDialog.action = action
  statusDialog.visible = true
  statusForm.reason = ''
}

const confirmStatusChange = async () => {
  if (!statusDialog.post) return
  
  try {
    await ElMessageBox.confirm(
      `确定要${getStatusActionText(statusDialog.action)}这个帖子吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    statusLoading.value = true
    
    await updatePostStatus(
      statusDialog.post.post_id,
      statusDialog.action,
      statusForm.reason || undefined
    )
    
    ElMessage.success(`帖子${getStatusActionText(statusDialog.action)}成功`)
    statusDialog.visible = false
    loadPosts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    statusLoading.value = false
  }
}

const handleReport = (report: any) => {
  reportDialog.report = report
  reportDialog.visible = true
  reportForm.action = ''
  reportForm.result = ''
}

const confirmReportHandle = async () => {
  if (!reportDialog.report) return
  
  if (!reportForm.action || !reportForm.result) {
    ElMessage.error('请填写完整的处理信息')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要处理这个举报吗？',
      '确认处理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    reportLoading.value = true
    
    await handlePostReport(reportDialog.report.report_id, reportForm.action, reportForm.result)
    
    ElMessage.success('举报处理成功')
    reportDialog.visible = false
    loadReports()
    loadPosts() // 刷新帖子列表以反映可能的状态变化
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '处理举报失败')
    }
  } finally {
    reportLoading.value = false
  }
}

const viewDetails = (post: any) => {
  detailDialog.post = post
  detailDialog.visible = true
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.forum-management {
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}


.content-preview {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.stats {
  font-size: 12px;
  color: #606266;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.post-details, .report-details {
  margin-bottom: 20px;
}

.post-details p, .report-details p {
  margin: 8px 0;
  color: #606266;
}

.description {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  max-height: 150px;
  overflow-y: auto;
  margin-top: 5px;
}

.text-gray {
  color: #909399;
  font-size: 12px;
}

.report-details h4 {
  color: #303133;
  margin: 15px 0 10px 0;
  font-size: 16px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 5px;
}

.post-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.post-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.post-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.post-meta {
  display: flex;
  gap: 20px;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.post-content {
  margin-bottom: 20px;
}

.content-text {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-stats {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .search-bar {
    justify-content: center;
  }
  
  .filters {
    flex-wrap: wrap;
  }
  
  
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>