<template>
  <div class="statistics">
    <div class="header">
      <h1>数据统计</h1>
      <div class="filters">
        <el-select v-model="selectedType" placeholder="选择统计类型" style="width: 150px">
          <el-option label="用户统计" value="users" />
          <el-option label="资源统计" value="resources" />
          <el-option label="帖子统计" value="posts" />
          <el-option label="活动统计" value="activities" />
        </el-select>
        <el-select v-model="selectedPeriod" placeholder="选择时间段" style="width: 120px">
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" @click="loadStatistics">查询</el-button>
      </div>
    </div>

    <div class="charts-container">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>用户增长趋势</h3>
                <el-tag>{{ selectedPeriod === 'today' ? '今日' : selectedPeriod === 'week' ? '本周' : selectedPeriod === 'month' ? '本月' : '全部' }}</el-tag>
              </div>
            </template>
            <div class="chart-placeholder">
              <el-empty description="图表功能开发中" />
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <h3>内容分布</h3>
                <el-tag>{{ selectedType === 'users' ? '用户' : selectedType === 'resources' ? '资源' : selectedType === 'posts' ? '帖子' : '活动' }}</el-tag>
              </div>
            </template>
            <div class="chart-placeholder">
              <el-empty description="图表功能开发中" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="stats-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>详细数据</h3>
            <el-button @click="exportData" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </template>
        
        <el-table :data="tableData" style="width: 100%" v-loading="loading">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="users" label="用户数" width="100" />
          <el-table-column prop="resources" label="资源数" width="100" />
          <el-table-column prop="posts" label="帖子数" width="100" />
          <el-table-column prop="downloads" label="下载数" width="100" />
          <el-table-column prop="views" label="浏览数" width="100" />
          <el-table-column prop="active_users" label="活跃用户">
            <template #default="{ row }">
              <el-tag type="success">{{ row.active_users }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="table-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <div class="summary-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card">
            <div class="summary-content">
              <div class="summary-icon users-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="summary-info">
                <h4>总用户数</h4>
                <p>{{ summaryData.totalUsers }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card">
            <div class="summary-content">
              <div class="summary-icon resources-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="summary-info">
                <h4>总资源数</h4>
                <p>{{ summaryData.totalResources }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card">
            <div class="summary-content">
              <div class="summary-icon posts-icon">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="summary-info">
                <h4>总帖子数</h4>
                <p>{{ summaryData.totalPosts }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="6">
          <el-card class="summary-card">
            <div class="summary-content">
              <div class="summary-icon downloads-icon">
                <el-icon><Download /></el-icon>
              </div>
              <div class="summary-info">
                <h4>总下载数</h4>
                <p>{{ summaryData.totalDownloads }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getStatistics } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { Download, User, Document, EditPen } from '@element-plus/icons-vue'

const loading = ref(false)
const exporting = ref(false)
const selectedType = ref('users')
const selectedPeriod = ref('month')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const tableData = ref([
  {
    date: '2024-01-01',
    users: 120,
    resources: 45,
    posts: 78,
    downloads: 234,
    views: 1234,
    active_users: 89
  },
  {
    date: '2024-01-02',
    users: 125,
    resources: 48,
    posts: 82,
    downloads: 267,
    views: 1456,
    active_users: 92
  },
  {
    date: '2024-01-03',
    users: 130,
    resources: 52,
    posts: 85,
    downloads: 289,
    views: 1567,
    active_users: 95
  }
])

const summaryData = reactive({
  totalUsers: 1250,
  totalResources: 456,
  totalPosts: 789,
  totalDownloads: 3456
})

const loadStatistics = async () => {
  loading.value = true
  try {
    const response = await getStatistics(selectedType.value, selectedPeriod.value)
    
    ElMessage.success('数据加载成功')
  } catch (error: any) {
    ElMessage.error(error.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const exportData = async () => {
  exporting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('数据导出成功')
  } catch (error: any) {
    ElMessage.error('数据导出失败')
  } finally {
    exporting.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadStatistics()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadStatistics()
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.statistics {
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

.filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
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
}

.chart-placeholder {
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-table {
  margin-bottom: 20px;
}

.table-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.summary-cards {
  margin-top: 20px;
}

.summary-card {
  height: 100px;
}

.summary-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.summary-icon {
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

.users-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.resources-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.posts-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.downloads-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.summary-info h4 {
  margin: 0 0 5px 0;
  color: #909399;
  font-size: 14px;
  font-weight: normal;
}

.summary-info p {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .filters {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .chart-card {
    height: 300px;
    margin-bottom: 20px;
  }
  
  .chart-placeholder {
    height: 210px;
  }
}
</style>