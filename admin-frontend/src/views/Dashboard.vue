<template>
  <div class="dashboard">
    <h1 class="dashboard-title">管理面板</h1>
    
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :lg="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon user-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats?.users || 0 }}</h3>
                <p>总用户数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon resource-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats?.resources || 0 }}</h3>
                <p>资源总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon post-icon">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats?.posts || 0 }}</h3>
                <p>帖子总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon notification-icon">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats?.totalNotifications || 0 }}</h3>
                <p>通知总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon feedback-icon">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats?.totalFeedbacks || 0 }}</h3>
                <p>反馈总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6" :lg="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ (stats?.pendingResources || 0) + (stats?.pendingFeedbacks || 0) }}</h3>
                <p>待处理任务</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="dashboard-content">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <h3>用户活跃统计</h3>
              </div>
            </template>
            <div class="active-stats">
              <div class="stat-item">
                <span class="label">活跃用户:</span>
                <span class="value">{{ stats?.activeUsers || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">已发布资源:</span>
                <span class="value">{{ stats?.publishedResources || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">总评论数:</span>
                <span class="value">{{ stats?.totalComments || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">总收藏数:</span>
                <span class="value">{{ stats?.totalCollections || 0 }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <h3>通知与反馈</h3>
              </div>
            </template>
            <div class="active-stats">
              <div class="stat-item">
                <span class="label">今日通知:</span>
                <span class="value">{{ stats?.todayNotifications || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">未读通知:</span>
                <span class="value">{{ stats?.unreadNotifications || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">今日反馈:</span>
                <span class="value">{{ stats?.todayFeedbacks || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">待处理反馈:</span>
                <span class="value">{{ stats?.pendingFeedbacks || 0 }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        
      </el-row>
      
      <!-- 处理状态概览 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :xs="24">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <h3>处理状态概览</h3>
              </div>
            </template>
            <div class="status-overview">
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :lg="6">
                  <div class="status-item">
                    <div class="status-header">
                      <el-icon class="status-icon pending"><Clock /></el-icon>
                      <span class="status-title">待审核资源</span>
                    </div>
                    <div class="status-value">{{ stats?.pendingResources || 0 }}</div>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="6">
                  <div class="status-item">
                    <div class="status-header">
                      <el-icon class="status-icon processing"><Loading /></el-icon>
                      <span class="status-title">处理中反馈</span>
                    </div>
                    <div class="status-value">{{ stats?.processingFeedbacks || 0 }}</div>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="6">
                  <div class="status-item">
                    <div class="status-header">
                      <el-icon class="status-icon resolved"><Check /></el-icon>
                      <span class="status-title">已解决反馈</span>
                    </div>
                    <div class="status-value">{{ stats?.resolvedFeedbacks || 0 }}</div>
                  </div>
                </el-col>
                <el-col :xs="24" :sm="12" :lg="6">
                  <div class="status-item">
                    <div class="status-header">
                      <el-icon class="status-icon week"><Calendar /></el-icon>
                      <span class="status-title">本周通知</span>
                    </div>
                    <div class="status-value">{{ stats?.weekNotifications || 0 }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboard } from '@/api/admin'
import { ElMessage } from 'element-plus'
import type { DashboardStats } from '@/types'
import {
  User,
  Document,
  EditPen,
  Clock,
  Bell,
  ChatDotRound,
  ChatLineRound,
  Loading,
  Check,
  Calendar
} from '@element-plus/icons-vue'

const stats = ref<DashboardStats | null>(null)
const loading = ref(false)

const loadDashboard = async () => {
  loading.value = true
  try {
    const response = await getDashboard()
    stats.value = response.data.data!
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard-title {
  margin: 0 0 30px 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.stats-cards {
  margin-bottom: 30px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.resource-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.post-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.notification-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.feedback-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-info h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.content-card {
  margin-bottom: 20px;
  height: 260px;
}

.content-card .el-card__body {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.active-stats {
  padding: 10px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.stat-item .label {
  color: #606266;
  font-size: 14px;
}

.stat-item .value {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}


/* 处理状态概览 */
.status-overview {
  padding: 20px 0;
}

.status-item {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.status-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.status-icon {
  font-size: 20px;
  margin-right: 8px;
}

.status-icon.pending {
  color: #e6a23c;
}

.status-icon.processing {
  color: #409eff;
}

.status-icon.resolved {
  color: #67c23a;
}

.status-icon.week {
  color: #f56c6c;
}

.status-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.status-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

@media (max-width: 768px) {
  .dashboard-content .el-col {
    margin-bottom: 20px;
  }
  
  .status-item {
    margin-bottom: 10px;
  }
  
  .status-value {
    font-size: 24px;
  }
}
</style>