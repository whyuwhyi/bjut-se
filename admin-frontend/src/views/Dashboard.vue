<template>
  <div class="dashboard">
    <h1 class="dashboard-title">管理面板</h1>
    
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
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
        
        <el-col :xs="12" :sm="6">
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
        
        <el-col :xs="12" :sm="6">
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
        
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stats?.pendingResources || 0 }}</h3>
                <p>待审核资源</p>
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
                <h3>活跃统计</h3>
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
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <h3>快捷操作</h3>
              </div>
            </template>
            <div class="quick-actions">
              <el-button type="primary" @click="$router.push('/users')">
                <el-icon><User /></el-icon>
                用户管理
              </el-button>
              <el-button type="success" @click="$router.push('/content-review')">
                <el-icon><Document /></el-icon>
                内容审核
              </el-button>
              <el-button type="warning" @click="$router.push('/notifications')">
                <el-icon><Bell /></el-icon>
                发送通知
              </el-button>
              <el-button type="info" @click="$router.push('/statistics')">
                <el-icon><PieChart /></el-icon>
                数据统计
              </el-button>
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
  PieChart
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
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.active-stats {
  padding: 10px 0;
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

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-actions .el-button {
  flex: 1;
  min-width: calc(50% - 5px);
}

@media (max-width: 768px) {
  .quick-actions .el-button {
    min-width: 100%;
  }
}
</style>