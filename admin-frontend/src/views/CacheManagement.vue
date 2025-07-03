<template>
  <div class="cache-management">
    <div class="header">
      <h1>缓存管理</h1>
      <div class="header-actions">
        <el-button @click="refreshStats" :loading="loading" type="primary">
          <el-icon><Refresh /></el-icon>
          刷新统计
        </el-button>
        <el-button @click="warmupCache" :loading="warmingUp" type="warning">
          <el-icon><Lightning /></el-icon>
          预热缓存
        </el-button>
      </div>
    </div>

    <!-- 缓存统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>缓存类型</span>
            <el-tag :type="stats.type === 'redis' ? 'success' : 'warning'">
              {{ stats.type === 'redis' ? 'Redis' : '内存缓存' }}
            </el-tag>
          </div>
        </template>
        <div class="stat-content">
          <div class="stat-item">
            <span class="label">总键数量:</span>
            <span class="value">{{ stats.totalKeys || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="label">搜索缓存键:</span>
            <span class="value">{{ stats.searchCacheKeys || 0 }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" v-if="stats.memoryInfo">
        <template #header>
          <div class="card-header">
            <span>内存使用</span>
            <el-icon><Monitor /></el-icon>
          </div>
        </template>
        <div class="stat-content">
          <div class="stat-item">
            <span class="label">当前使用:</span>
            <span class="value">{{ stats.memoryInfo.used_memory_human || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="label">峰值使用:</span>
            <span class="value">{{ stats.memoryInfo.used_memory_peak_human || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="label">最大内存:</span>
            <span class="value">{{ stats.memoryInfo.maxmemory_human || 'N/A' }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>缓存操作</span>
            <el-icon><Operation /></el-icon>
          </div>
        </template>
        <div class="cache-actions">
          <el-button @click="clearCache('search')" type="info" size="small">
            清除搜索缓存
          </el-button>
          <el-button @click="clearCache('suggestion')" type="info" size="small">
            清除建议缓存
          </el-button>
          <el-button @click="clearCache('filter')" type="info" size="small">
            清除筛选缓存
          </el-button>
          <el-button @click="clearCache('all')" type="danger" size="small">
            清除所有缓存
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 缓存失效操作 -->
    <el-card class="invalidate-section">
      <template #header>
        <div class="card-header">
          <span>手动失效缓存</span>
          <el-icon><Delete /></el-icon>
        </div>
      </template>
      <div class="invalidate-form">
        <el-form :inline="true" :model="invalidateForm">
          <el-form-item label="实体类型">
            <el-select v-model="invalidateForm.entity" placeholder="选择实体类型">
              <el-option label="资源" value="resource" />
              <el-option label="帖子" value="post" />
              <el-option label="分类" value="category" />
              <el-option label="标签" value="tag" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="invalidateForm.action" placeholder="选择操作类型">
              <el-option label="创建" value="create" />
              <el-option label="更新" value="update" />
              <el-option label="删除" value="delete" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="invalidateCache" type="warning" :loading="invalidating">
              执行失效
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 操作日志 -->
    <el-card class="log-section">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <el-button @click="clearLogs" type="text" size="small">清空日志</el-button>
        </div>
      </template>
      <div class="logs">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          class="log-item"
          :class="log.type"
        >
          <span class="timestamp">{{ formatTime(log.timestamp) }}</span>
          <span class="message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="no-logs">
          暂无操作日志
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Lightning, Monitor, Operation, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'

export default {
  name: 'CacheManagement',
  components: {
    Refresh,
    Lightning,
    Monitor,
    Operation,
    Delete
  },
  setup() {
    const loading = ref(false)
    const warmingUp = ref(false)
    const invalidating = ref(false)
    
    const stats = reactive({
      type: 'unknown',
      totalKeys: 0,
      searchCacheKeys: 0,
      memoryInfo: null
    })
    
    const invalidateForm = reactive({
      entity: '',
      action: 'update'
    })
    
    const logs = ref([])
    
    // 添加日志
    const addLog = (message, type = 'info') => {
      logs.value.unshift({
        timestamp: new Date(),
        message,
        type
      })
      
      // 限制日志数量
      if (logs.value.length > 50) {
        logs.value = logs.value.slice(0, 50)
      }
    }
    
    // 获取缓存统计
    const refreshStats = async () => {
      try {
        loading.value = true
        const response = await request.get('/cache/stats')
        
        if (response.data.success) {
          Object.assign(stats, response.data.data)
          addLog('缓存统计刷新成功', 'success')
        }
      } catch (error) {
        console.error('获取缓存统计失败:', error)
        ElMessage.error('获取缓存统计失败')
        addLog('缓存统计刷新失败: ' + error.message, 'error')
      } finally {
        loading.value = false
      }
    }
    
    // 预热缓存
    const warmupCache = async () => {
      try {
        warmingUp.value = true
        const response = await request.post('/cache/warmup')
        
        if (response.data.success) {
          ElMessage.success('缓存预热成功')
          addLog('缓存预热完成', 'success')
          await refreshStats()
        }
      } catch (error) {
        console.error('缓存预热失败:', error)
        ElMessage.error('缓存预热失败')
        addLog('缓存预热失败: ' + error.message, 'error')
      } finally {
        warmingUp.value = false
      }
    }
    
    // 清除缓存
    const clearCache = async (type) => {
      try {
        await ElMessageBox.confirm(
          `确认清除${type === 'all' ? '所有' : type}缓存？`,
          '确认操作',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        
        const response = await request.delete(`/cache/clear/${type}`)
        
        if (response.data.success) {
          ElMessage.success(response.data.message)
          addLog(`清除${type === 'all' ? '所有' : type}缓存成功`, 'success')
          await refreshStats()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('清除缓存失败:', error)
          ElMessage.error('清除缓存失败')
          addLog('清除缓存失败: ' + error.message, 'error')
        }
      }
    }
    
    // 失效缓存
    const invalidateCache = async () => {
      if (!invalidateForm.entity) {
        ElMessage.warning('请选择实体类型')
        return
      }
      
      try {
        invalidating.value = true
        const response = await request.post('/cache/invalidate', {
          entity: invalidateForm.entity,
          action: invalidateForm.action
        })
        
        if (response.data.success) {
          ElMessage.success(response.data.message)
          addLog(`${invalidateForm.entity} ${invalidateForm.action} 缓存失效成功`, 'success')
          await refreshStats()
        }
      } catch (error) {
        console.error('缓存失效失败:', error)
        ElMessage.error('缓存失效失败')
        addLog('缓存失效失败: ' + error.message, 'error')
      } finally {
        invalidating.value = false
      }
    }
    
    // 清空日志
    const clearLogs = () => {
      logs.value = []
      addLog('日志已清空', 'info')
    }
    
    // 格式化时间
    const formatTime = (time) => {
      return new Date(time).toLocaleString()
    }
    
    onMounted(() => {
      refreshStats()
      addLog('缓存管理界面已加载', 'info')
    })
    
    return {
      loading,
      warmingUp,
      invalidating,
      stats,
      invalidateForm,
      logs,
      refreshStats,
      warmupCache,
      clearCache,
      invalidateCache,
      clearLogs,
      formatTime
    }
  }
}
</script>

<style lang="scss" scoped>
.cache-management {
  padding: 20px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      margin: 0;
      color: #333;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
    
    .stat-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }
      
      .stat-content {
        .stat-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          
          .label {
            color: #666;
          }
          
          .value {
            font-weight: bold;
            color: #333;
          }
        }
      }
      
      .cache-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .el-button {
          width: 100%;
        }
      }
    }
  }
  
  .invalidate-section,
  .log-section {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }
  }
  
  .invalidate-form {
    .el-form {
      align-items: flex-end;
    }
  }
  
  .logs {
    max-height: 300px;
    overflow-y: auto;
    
    .log-item {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      gap: 15px;
      
      &:last-child {
        border-bottom: none;
      }
      
      .timestamp {
        color: #999;
        font-size: 12px;
        white-space: nowrap;
        min-width: 140px;
      }
      
      .message {
        flex: 1;
        font-size: 14px;
      }
      
      &.success .message {
        color: #67c23a;
      }
      
      &.error .message {
        color: #f56c6c;
      }
      
      &.warning .message {
        color: #e6a23c;
      }
    }
    
    .no-logs {
      text-align: center;
      color: #999;
      padding: 20px;
    }
  }
}
</style>