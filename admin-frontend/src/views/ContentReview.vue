<template>
  <div class="content-review">
    <div class="header">
      <h1>内容审核</h1>
      <el-button @click="loadPendingResources" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="待审核资源" name="resources">
        <div class="resource-list">
          <el-empty v-if="!loading && pendingResources.length === 0" description="暂无待审核资源" />
          
          <div v-else class="resource-grid">
            <el-card
              v-for="resource in pendingResources"
              :key="resource.resource_id"
              class="resource-card"
              shadow="hover"
            >
              <template #header>
                <div class="card-header">
                  <h3>{{ resource.resource_name }}</h3>
                  <el-tag type="warning">待审核</el-tag>
                </div>
              </template>
              
              <div class="resource-info">
                <p><strong>资源ID:</strong> {{ resource.resource_id }}</p>
                <p><strong>发布者:</strong> {{ resource.publisher?.name || resource.publisher_phone }}</p>
                <p><strong>提交时间:</strong> {{ formatDate(resource.created_at) }}</p>
                <p v-if="resource.description"><strong>描述:</strong></p>
                <div v-if="resource.description" class="description">
                  {{ resource.description }}
                </div>
              </div>
              
              <div class="actions">
                <el-button
                  type="success"
                  size="small"
                  @click="handleReview(resource, 'approve')"
                >
                  <el-icon><Check /></el-icon>
                  通过
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleReview(resource, 'reject')"
                >
                  <el-icon><Close /></el-icon>
                  拒绝
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="举报帖子" name="posts">
        <div class="posts-section">
          <el-alert
            title="功能开发中"
            type="info"
            description="举报帖子审核功能正在开发中，敬请期待"
            show-icon
            :closable="false"
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
        <p><strong>资源名称:</strong> {{ reviewDialog.resource.resource_name }}</p>
        <p><strong>发布者:</strong> {{ reviewDialog.resource.publisher?.name || reviewDialog.resource.publisher_phone }}</p>
        
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getPendingResources, reviewResource } from '@/api/admin'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import type { Resource } from '@/types'
import { Refresh, Check, Close } from '@element-plus/icons-vue'

const loading = ref(false)
const reviewLoading = ref(false)
const activeTab = ref('resources')
const pendingResources = ref<Resource[]>([])

const reviewDialog = reactive({
  visible: false,
  action: '' as 'approve' | 'reject',
  resource: null as Resource | null
})

const reviewForm = reactive({
  comment: ''
})

const reviewFormRef = ref<FormInstance>()

const reviewRules = {
  comment: [
    { max: 500, message: '审核意见不能超过500字', trigger: 'blur' }
  ]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadPendingResources = async () => {
  loading.value = true
  try {
    const response = await getPendingResources()
    pendingResources.value = response.data.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载待审核资源失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tabName: string) => {
  if (tabName === 'resources') {
    loadPendingResources()
  }
}

const handleReview = (resource: Resource, action: 'approve' | 'reject') => {
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
    loadPendingResources()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核操作失败')
    }
  } finally {
    reviewLoading.value = false
  }
}

onMounted(() => {
  loadPendingResources()
})
</script>

<style scoped>
.content-review {
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

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.resource-card {
  min-height: 250px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  margin-right: 10px;
}

.resource-info {
  margin-bottom: 20px;
}

.resource-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
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
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.posts-section {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .resource-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .actions {
    justify-content: center;
  }
}
</style>