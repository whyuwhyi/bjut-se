<template>
  <div class="resource-management">
    <div class="header">
      <h1>资源管理</h1>
      <div class="header-actions">
        <div class="search-bar">
          <el-input
            v-model="filters.search"
            placeholder="搜索资源名称或描述"
            style="width: 300px"
            clearable
            @keyup.enter="loadResources"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="loadResources">搜索</el-button>
        </div>
        <el-button @click="loadResources" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="filters">
      <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 120px" @change="handleFilterChange">
        <el-option label="草稿" value="draft" />
        <el-option label="待审核" value="pending" />
        <el-option label="已发布" value="published" />
        <el-option label="已拒绝" value="rejected" />
        <el-option label="已归档" value="archived" />
      </el-select>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="资源列表" name="resources">
        <!-- 资源表格 -->
        <el-table
          :data="resources"
          v-loading="loading"
          style="width: 100%"
          empty-text="暂无资源数据"
        >
          <el-table-column prop="resource_id" label="资源ID" width="100" />
          <el-table-column prop="resource_name" label="资源名称" min-width="200" show-overflow-tooltip />
          <el-table-column label="发布者" width="120">
            <template #default="{ row }">
              {{ row.publisher?.name || row.publisher_phone }}
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
                <span>下载: {{ row.download_count }}</span><br>
                <span>举报: {{ row.report_count }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="viewDetails(row)">详情</el-button>
                <el-dropdown
                  v-if="row.status === 'pending'"
                  @command="(command) => handleReview(row, command)"
                  size="small"
                >
                  <el-button size="small" type="primary">
                    审核<el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="approve">通过</el-dropdown-item>
                      <el-dropdown-item command="reject">拒绝</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button
                  v-if="['published', 'pending'].includes(row.status)"
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
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
            @size-change="loadResources"
            @current-change="loadResources"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`资源审核 (${pendingCount})`" name="review">
        <!-- 待审核资源列表 -->
        <el-table
          :data="pendingResources"
          v-loading="reviewLoading"
          style="width: 100%"
          empty-text="暂无待审核资源"
        >
          <el-table-column prop="resource_id" label="资源ID" width="100" />
          <el-table-column prop="resource_name" label="资源名称" min-width="250" show-overflow-tooltip />
          <el-table-column label="发布者" width="120">
            <template #default="{ row }">
              {{ row.publisher?.name || row.publisher_phone }}
            </template>
          </el-table-column>
          <el-table-column label="分类" width="100">
            <template #default="{ row }">
              {{ row.category?.category_name || '未分类' }}
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="200">
            <template #default="{ row }">
              <div class="description-preview">
                {{ getContentPreview(row.description, 100) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="文件信息" width="120">
            <template #default="{ row }">
              <div v-if="row.files && row.files.length > 0" class="file-info">
                <div v-for="file in row.files.slice(0, 2)" :key="file.file_id" class="file-item">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.file_name }}</span>
                </div>
                <div v-if="row.files.length > 2" class="text-gray">
                  +{{ row.files.length - 2 }} 个文件
                </div>
              </div>
              <span v-else class="text-gray">无文件</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="viewResourceDetail(row)">详情</el-button>
                <el-dropdown @command="(command) => handleReviewAction(row, command)">
                  <el-button type="success" size="small">
                    审核
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="approve">
                        <el-icon><Check /></el-icon>
                        通过
                      </el-dropdown-item>
                      <el-dropdown-item command="reject">
                        <el-icon><Close /></el-icon>
                        拒绝
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 审核分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="reviewPagination.page"
            v-model:page-size="reviewPagination.limit"
            :page-sizes="[10, 20, 50]"
            :total="reviewPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadPendingResources"
            @current-change="loadPendingResources"
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
          <el-table-column label="资源信息" min-width="200">
            <template #default="{ row }">
              <div v-if="row.resource">
                <div><strong>{{ row.resource.resource_name }}</strong></div>
                <div class="text-gray">{{ row.resource.resource_id }}</div>
                <div class="text-gray">发布者: {{ row.resource.publisher?.name }}</div>
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

    <!-- 审核对话框 -->
    <el-dialog
      v-model="reviewDialog.visible"
      :title="reviewDialog.action === 'approve' ? '通过审核' : '拒绝审核'"
      width="500px"
    >
      <div v-if="reviewDialog.resource">
        <div class="resource-details">
          <p><strong>资源名称:</strong> {{ reviewDialog.resource.resource_name }}</p>
          <p><strong>资源ID:</strong> {{ reviewDialog.resource.resource_id }}</p>
          <p><strong>发布者:</strong> {{ reviewDialog.resource.publisher?.name || reviewDialog.resource.publisher_phone }}</p>
          <div v-if="reviewDialog.resource.description">
            <p><strong>资源描述:</strong></p>
            <div class="description">{{ reviewDialog.resource.description }}</div>
          </div>
        </div>
        
        <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRules">
          <el-form-item
            label="审核意见"
            prop="comment"
            :rules="reviewDialog.action === 'reject' ? [{ required: true, message: '拒绝审核必须填写原因', trigger: 'blur' }] : []"
          >
            <el-input
              v-model="reviewForm.comment"
              type="textarea"
              :rows="4"
              :placeholder="reviewDialog.action === 'approve' ? '可选：填写通过意见' : '必填：请说明拒绝原因'"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="reviewDialog.visible = false">取消</el-button>
        <el-button
          :type="reviewDialog.action === 'approve' ? 'success' : 'danger'"
          :loading="reviewLoading"
          @click="confirmReview"
        >
          确认{{ reviewDialog.action === 'approve' ? '通过' : '拒绝' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialog.visible"
      title="删除资源"
      width="500px"
    >
      <div v-if="deleteDialog.resource">
        <p>确定要删除以下资源吗？</p>
        <div class="resource-details">
          <p><strong>资源名称:</strong> {{ deleteDialog.resource.resource_name }}</p>
          <p><strong>发布者:</strong> {{ deleteDialog.resource.publisher?.name || deleteDialog.resource.publisher_phone }}</p>
        </div>
        
        <el-form ref="deleteFormRef" :model="deleteForm">
          <el-form-item label="删除原因" prop="reason">
            <el-input
              v-model="deleteForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请说明删除原因"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="deleteDialog.visible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="deleteLoading"
          @click="confirmDelete"
        >
          确认删除
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
          
          <h4 style="margin-top: 20px;">被举报资源</h4>
          <p><strong>资源名称:</strong> {{ reportDialog.report.resource?.resource_name }}</p>
          <p><strong>发布者:</strong> {{ reportDialog.report.resource?.publisher?.name }}</p>
        </div>
        
        <el-form ref="reportFormRef" :model="reportForm">
          <el-form-item label="处理方式" prop="action" required>
            <el-radio-group v-model="reportForm.action">
              <el-radio value="accept">接受举报并删除资源</el-radio>
              <el-radio value="reject">拒绝举报</el-radio>
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

    <!-- 资源详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="资源详情"
      width="800px"
      :destroy-on-close="true"
    >
      <div v-if="detailDialog.resource" class="resource-detail">
        <div class="resource-header">
          <h2>{{ detailDialog.resource.resource_name }}</h2>
          <div class="resource-meta">
            <span>发布者: {{ detailDialog.resource.publisher?.name || detailDialog.resource.publisher_phone }}</span>
            <span>提交时间: {{ formatDate(detailDialog.resource.created_at) }}</span>
            <el-tag :type="getStatusType(detailDialog.resource.status)" size="small">
              {{ getStatusText(detailDialog.resource.status) }}
            </el-tag>
          </div>
        </div>
        
        <div class="resource-content">
          <div v-if="detailDialog.resource.description" class="content-section">
            <h4>资源描述</h4>
            <div class="content-text">{{ detailDialog.resource.description }}</div>
          </div>
          
          <div v-if="detailDialog.resource.files && detailDialog.resource.files.length > 0" class="content-section">
            <h4>附件文件</h4>
            <div class="file-list">
              <div v-for="file in detailDialog.resource.files" :key="file.file_id" class="file-item-detail">
                <el-icon><Document /></el-icon>
                <span class="file-name">{{ file.file_name }}</span>
                <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
                <span class="file-type">{{ file.file_type }}</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Download"
                  @click="downloadFile(file)"
                >
                  下载
                </el-button>
              </div>
            </div>
          </div>
          
          <div v-if="detailDialog.resource.category" class="content-section">
            <h4>分类信息</h4>
            <el-tag>{{ detailDialog.resource.category.category_name }}</el-tag>
          </div>
        </div>
        
        <div class="resource-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="浏览次数" :value="detailDialog.resource.view_count || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="下载次数" :value="detailDialog.resource.download_count || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="收藏次数" :value="detailDialog.resource.collection_count || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="举报次数" :value="detailDialog.resource.report_count || 0" />
            </el-col>
          </el-row>
        </div>
        
        <div v-if="detailDialog.resource.status === 'pending'" class="resource-actions">
          <h4>审核操作</h4>
          <div class="action-buttons">
            <el-button
              type="success"
              @click="handleQuickReview(detailDialog.resource, 'approve')"
            >
              <el-icon><Check /></el-icon>
              通过审核
            </el-button>
            <el-button
              type="danger"
              @click="handleQuickReview(detailDialog.resource, 'reject')"
            >
              <el-icon><Close /></el-icon>
              拒绝审核
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Refresh, Document, Check, Close, Search, Download, ArrowDown } from '@element-plus/icons-vue'
import { getAllResources, deleteResource, reviewResource, getResourceReports, handleResourceReport, getPendingResources } from '@/api/admin'
import type { Resource } from '@/types'

const loading = ref(false)
const reviewLoading = ref(false)
const deleteLoading = ref(false)
const reportLoading = ref(false)
const activeTab = ref('resources')

const resources = ref([])
const pendingResources = ref([])
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

const reviewPagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const reviewDialog = reactive({
  visible: false,
  action: '',
  resource: null
})

const deleteDialog = reactive({
  visible: false,
  resource: null
})

const reportDialog = reactive({
  visible: false,
  report: null
})

const detailDialog = reactive({
  visible: false,
  resource: null
})

const reviewForm = reactive({
  comment: ''
})

const deleteForm = reactive({
  reason: ''
})

const reportForm = reactive({
  action: '',
  result: ''
})

const reviewFormRef = ref<FormInstance>()
const deleteFormRef = ref<FormInstance>()
const reportFormRef = ref<FormInstance>()

const reviewRules = {
  comment: [
    { max: 500, message: '审核意见不能超过500字', trigger: 'blur' }
  ]
}

const reportCount = computed(() => {
  return reports.value.filter(r => r.status === 'pending').length
})

const pendingCount = computed(() => {
  return pendingResources.value.length
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getContentPreview = (content: string, maxLength: number = 100) => {
  if (!content) return ''
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getStatusType = (status: string) => {
  const types = {
    draft: 'info',
    pending: 'warning',
    published: 'success',
    rejected: 'danger',
    archived: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    rejected: '已拒绝',
    archived: '已归档'
  }
  return texts[status] || status
}

const getReasonText = (reason: string) => {
  const texts = {
    inappropriate: '内容不当',
    copyright: '版权问题',
    spam: '垃圾信息',
    offensive: '冒犯性内容',
    other: '其他'
  }
  return texts[reason] || reason
}

const loadResources = async () => {
  loading.value = true
  try {
    const response = await getAllResources({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
      search: filters.search
    })
    resources.value = response.data.data.resources || []
    pagination.total = response.data.data.total || 0
    
    ElMessage.success('资源列表加载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '加载资源列表失败')
  } finally {
    loading.value = false
  }
}

const loadReports = async () => {
  reportLoading.value = true
  try {
    const response = await getResourceReports({
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

const loadPendingResources = async () => {
  reviewLoading.value = true
  try {
    const response = await getPendingResources()
    pendingResources.value = response.data.data || []
    reviewPagination.total = pendingResources.value.length
  } catch (error: any) {
    ElMessage.error(error.message || '加载待审核资源失败')
  } finally {
    reviewLoading.value = false
  }
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'resources') {
    loadResources()
  } else if (tabName === 'review') {
    loadPendingResources()
  } else if (tabName === 'reports') {
    loadReports()
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.search = ''
  pagination.page = 1
  loadResources()
}

const handleFilterChange = () => {
  pagination.page = 1
  loadResources()
}

const handleReview = (resource: any, action: 'approve' | 'reject') => {
  reviewDialog.resource = resource
  reviewDialog.action = action
  reviewDialog.visible = true
  reviewForm.comment = ''
}

const confirmReview = async () => {
  if (!reviewDialog.resource) return
  
  if (reviewDialog.action === 'reject') {
    if (!reviewFormRef.value) return
    try {
      await reviewFormRef.value.validate()
    } catch {
      return
    }
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要${reviewDialog.action === 'approve' ? '通过' : '拒绝'}这个资源吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    reviewLoading.value = true
    
    await reviewResource(
      reviewDialog.resource.resource_id,
      reviewDialog.action,
      reviewForm.comment || undefined
    )
    
    const actionText = reviewDialog.action === 'approve' ? '通过' : '拒绝'
    ElMessage.success(`审核${actionText}成功`)
    
    reviewDialog.visible = false
    loadResources()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核操作失败')
    }
  } finally {
    reviewLoading.value = false
  }
}

const handleDelete = (resource: any) => {
  deleteDialog.resource = resource
  deleteDialog.visible = true
  deleteForm.reason = ''
}

const confirmDelete = async () => {
  if (!deleteDialog.resource) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个资源吗？此操作不可恢复！',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deleteLoading.value = true
    
    await deleteResource(deleteDialog.resource.resource_id, deleteForm.reason)
    
    ElMessage.success('资源删除成功')
    deleteDialog.visible = false
    loadResources()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除资源失败')
    }
  } finally {
    deleteLoading.value = false
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
    
    await handleResourceReport(reportDialog.report.report_id, reportForm.action, reportForm.result)
    
    ElMessage.success('举报处理成功')
    reportDialog.visible = false
    loadReports()
    loadResources() // 刷新资源列表以反映可能的删除
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '处理举报失败')
    }
  } finally {
    reportLoading.value = false
  }
}

const viewDetails = (resource: any) => {
  detailDialog.resource = resource
  detailDialog.visible = true
}

const viewResourceDetail = (resource: any) => {
  detailDialog.resource = resource
  detailDialog.visible = true
}

const handleQuickReview = (resource: any, action: 'approve' | 'reject') => {
  reviewDialog.resource = resource
  reviewDialog.action = action
  reviewDialog.visible = true
  reviewForm.comment = ''
}

const handleReviewAction = (resource: any, action: 'approve' | 'reject') => {
  reviewDialog.resource = resource
  reviewDialog.action = action
  reviewDialog.visible = true
  reviewForm.comment = ''
}

const downloadFile = (file: any) => {
  // 使用原有的下载API路由：/api/v1/resources/:resourceId/files/:fileId/download
  const downloadUrl = `/api/v1/resources/${detailDialog.resource.resource_id}/files/${file.file_id}/download`
  
  // 创建临时链接下载
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = file.file_name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('开始下载文件')
}

onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resource-management {
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


.stats {
  font-size: 12px;
  color: #606266;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.resource-details, .report-details {
  margin-bottom: 20px;
}

.resource-details p, .report-details p {
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
  max-height: 100px;
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
  
}

/* 资源审核相关样式 */
.description-preview {
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.file-info {
  font-size: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
  color: #606266;
}

.file-item .el-icon {
  font-size: 14px;
}

/* 资源详情对话框样式 */
.resource-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.resource-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.resource-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.resource-meta {
  display: flex;
  gap: 20px;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.resource-content {
  margin-bottom: 20px;
}

.content-section {
  margin-bottom: 20px;
}

.content-section h4 {
  color: #303133;
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
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

.file-list {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
}

.file-item-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.file-item-detail:last-child {
  border-bottom: none;
}

.file-name {
  flex: 1;
  color: #303133;
  font-weight: 500;
}

.file-size, .file-type {
  color: #909399;
  font-size: 12px;
  min-width: 60px;
}

.file-item-detail .el-button {
  margin-left: 10px;
}

.resource-stats {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  margin-bottom: 20px;
}

.resource-actions {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.resource-actions h4 {
  color: #303133;
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
}
</style>