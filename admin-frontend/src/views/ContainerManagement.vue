<template>
  <div class="container-management">
    <div class="page-header">
      <h1>容器管理</h1>
      <div class="header-actions">
        <el-button @click="refreshContainers" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="showSystemStats" type="primary">
          <el-icon><Monitor /></el-icon>
          系统信息
        </el-button>
      </div>
    </div>

    <!-- 容器列表 -->
    <div class="containers-grid">
      <div 
        v-for="container in containers" 
        :key="container.id"
        class="container-card"
        :class="{ 'running': container.status === 'running', 'stopped': container.status === 'exited' }"
      >
        <div class="container-header">
          <div class="container-info">
            <h3>{{ container.name }}</h3>
            <span class="container-id">{{ container.id }}</span>
          </div>
          <div class="container-status">
            <el-tag 
              :type="getStatusType(container.status)" 
              size="small"
            >
              {{ container.status }}
            </el-tag>
          </div>
        </div>

        <div class="container-details">
          <p><strong>镜像:</strong> {{ container.image }}</p>
          <p><strong>状态:</strong> {{ container.state }}</p>
          <p><strong>创建时间:</strong> {{ formatDate(container.created) }}</p>
          
          <!-- 端口映射 -->
          <div v-if="container.ports && container.ports.length" class="ports">
            <strong>端口:</strong>
            <span v-for="port in container.ports" :key="port.PrivatePort" class="port-tag">
              {{ port.PublicPort || port.PrivatePort }}:{{ port.PrivatePort }}
            </span>
          </div>

          <!-- 资源使用情况 -->
          <div v-if="container.stats" class="stats">
            <div class="stat-item">
              <span>内存使用:</span>
              <span>{{ formatBytes(container.stats.memory_usage) }} / {{ formatBytes(container.stats.memory_limit) }}</span>
            </div>
          </div>
        </div>

        <div class="container-actions">
          <el-button-group>
            <el-button 
              v-if="container.status !== 'running'" 
              @click="startContainer(container.id)"
              type="success" 
              size="small"
              :loading="actionLoading[container.id]"
            >
              <el-icon><VideoPlay /></el-icon>
              启动
            </el-button>
            <el-button 
              v-if="container.status === 'running'" 
              @click="stopContainer(container.id)"
              type="warning" 
              size="small"
              :loading="actionLoading[container.id]"
            >
              <el-icon><VideoPause /></el-icon>
              停止
            </el-button>
            <el-button 
              @click="restartContainer(container.id)"
              type="primary" 
              size="small"
              :loading="actionLoading[container.id]"
            >
              <el-icon><RefreshRight /></el-icon>
              重启
            </el-button>
            <el-button 
              @click="showContainerDetail(container)"
              size="small"
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button 
              @click="showContainerLogs(container)"
              size="small"
            >
              <el-icon><Document /></el-icon>
              日志
            </el-button>
            <el-button 
              v-if="isDbContainer(container)"
              @click="showDatabaseOperations(container)"
              type="info" 
              size="small"
            >
              <el-icon><Coin /></el-icon>
              数据库
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 容器详情弹窗 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="容器详情" 
      width="80%"
      top="5vh"
    >
      <div v-if="selectedContainer" class="container-detail">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="基本信息" name="info">
            <div class="info-grid">
              <div class="info-item">
                <strong>容器ID:</strong> {{ selectedContainer.Id }}
              </div>
              <div class="info-item">
                <strong>名称:</strong> {{ selectedContainer.Name }}
              </div>
              <div class="info-item">
                <strong>镜像:</strong> {{ selectedContainer.Config?.Image }}
              </div>
              <div class="info-item">
                <strong>状态:</strong> {{ selectedContainer.State?.Status }}
              </div>
              <div class="info-item">
                <strong>重启策略:</strong> {{ selectedContainer.HostConfig?.RestartPolicy?.Name }}
              </div>
              <div class="info-item">
                <strong>网络模式:</strong> {{ selectedContainer.HostConfig?.NetworkMode }}
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="环境变量" name="env">
            <div class="env-list">
              <div v-for="env in selectedContainer.Config?.Env" :key="env" class="env-item">
                {{ env }}
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="挂载点" name="mounts">
            <el-table :data="selectedContainer.Mounts" style="width: 100%">
              <el-table-column prop="Source" label="源路径" />
              <el-table-column prop="Destination" label="目标路径" />
              <el-table-column prop="Mode" label="模式" />
              <el-table-column prop="Type" label="类型" />
            </el-table>
          </el-tab-pane>
          
          <el-tab-pane label="实时日志" name="logs">
            <div class="logs-container">
              <el-input
                v-model="containerLogs"
                type="textarea"
                :rows="20"
                readonly
                class="logs-textarea"
              />
              <div class="logs-actions">
                <el-button @click="refreshLogs" size="small">刷新日志</el-button>
                <el-input-number 
                  v-model="logLines" 
                  :min="10" 
                  :max="1000" 
                  size="small"
                  controls-position="right"
                />
                <span>行数</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 数据库操作弹窗 -->
    <el-dialog 
      v-model="dbDialogVisible" 
      title="数据库操作" 
      width="80%"
      top="5vh"
    >
      <div class="database-operations">
        <el-tabs v-model="dbActiveTab" type="border-card">
          <el-tab-pane label="数据库浏览" name="browse">
            <div class="database-browser">
              <div class="browser-layout">
                <!-- 左侧数据库和表列表 -->
                <div class="sidebar">
                  <div class="database-list">
                    <h4>数据库列表</h4>
                    <el-button 
                      @click="loadDatabases" 
                      size="small" 
                      :loading="databasesLoading"
                      style="margin-bottom: 10px; width: 100%;"
                    >
                      刷新数据库
                    </el-button>
                    <div 
                      v-for="database in databases" 
                      :key="database"
                      class="database-item"
                      :class="{ active: selectedDatabase === database }"
                      @click="selectDatabase(database)"
                    >
                      <el-icon><FolderOpened /></el-icon>
                      {{ database }}
                    </div>
                  </div>
                  
                  <div v-if="selectedDatabase" class="table-list">
                    <h4>表列表 ({{ selectedDatabase }})</h4>
                    <div class="table-stats">
                      共 {{ tables.length }} 个表
                    </div>
                    <div 
                      v-for="table in tables" 
                      :key="table.name"
                      class="table-item"
                      :class="{ active: selectedTable === table.name }"
                      @click="selectTable(table.name)"
                    >
                      <div class="table-info">
                        <div class="table-name">
                          <el-icon><Grid /></el-icon>
                          {{ table.name }}
                        </div>
                        <div class="table-meta">
                          {{ table.rows }} 行 | {{ formatBytes(table.size) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 右侧表内容 -->
                <div class="content-area">
                  <div v-if="selectedDatabase && selectedTable" class="table-content">
                    <div class="content-header">
                      <h4>{{ selectedDatabase }}.{{ selectedTable }}</h4>
                      <div class="content-actions">
                        <el-button @click="loadTableStructure" size="small">
                          <el-icon><List /></el-icon>
                          表结构
                        </el-button>
                        <el-button @click="loadTableData" size="small" type="primary">
                          <el-icon><View /></el-icon>
                          查看数据
                        </el-button>
                      </div>
                    </div>
                    
                    <!-- 表结构视图 -->
                    <div v-if="showStructure && tableStructure.length" class="structure-view">
                      <h5>表结构</h5>
                      <el-table :data="tableStructure" border style="width: 100%">
                        <el-table-column prop="field" label="字段名" width="150" />
                        <el-table-column prop="type" label="类型" width="120" />
                        <el-table-column prop="null" label="允许空值" width="100" />
                        <el-table-column prop="key" label="键类型" width="100" />
                        <el-table-column prop="default" label="默认值" width="120" />
                        <el-table-column prop="extra" label="额外" />
                      </el-table>
                    </div>
                    
                    <!-- 表数据视图 -->
                    <div v-if="showData && tableData.length" class="data-view">
                      <div class="data-header">
                        <h5>表数据</h5>
                        <div class="data-pagination">
                          <el-pagination
                            v-model:current-page="currentPage"
                            v-model:page-size="pageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            :total="totalRows"
                            layout="total, sizes, prev, pager, next, jumper"
                            @size-change="handleSizeChange"
                            @current-change="handleCurrentChange"
                          />
                        </div>
                      </div>
                      <el-table 
                        :data="tableData" 
                        border 
                        style="width: 100%"
                        max-height="400"
                      >
                        <el-table-column 
                          v-for="column in tableColumns" 
                          :key="column"
                          :prop="column"
                          :label="column"
                          show-overflow-tooltip
                          min-width="120"
                        />
                      </el-table>
                    </div>
                    
                    <!-- 空状态 -->
                    <div v-if="!showStructure && !showData" class="empty-content">
                      <p>选择一个操作来查看表结构或数据</p>
                    </div>
                  </div>
                  
                  <div v-else class="empty-state">
                    <p>请先选择数据库和表</p>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="SQL执行" name="execute">
            <div class="sql-executor">
              <div class="sql-input">
                <el-input
                  v-model="sqlCommand"
                  type="textarea"
                  :rows="6"
                  placeholder="输入SQL命令（支持SELECT, SHOW, INSERT, UPDATE, DELETE等）"
                />
              </div>
              <div class="sql-actions">
                <el-input 
                  v-model="targetDatabase" 
                  placeholder="数据库名（默认: wechat_education）"
                  style="width: 200px; margin-right: 10px;"
                />
                <el-button 
                  @click="executeSqlCommand" 
                  type="primary"
                  :loading="sqlLoading"
                >
                  执行SQL
                </el-button>
                <el-button @click="clearSqlResult">清空结果</el-button>
              </div>
              <div class="sql-result">
                <h4>执行结果:</h4>
                <el-input
                  v-model="sqlResult"
                  type="textarea"
                  :rows="15"
                  readonly
                  class="result-textarea"
                />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="数据一致性检查" name="consistency">
            <div class="consistency-check">
              <div class="check-actions">
                <el-button 
                  @click="checkDatabaseConsistency" 
                  type="primary"
                  :loading="consistencyLoading"
                >
                  <el-icon><Search /></el-icon>
                  执行一致性检查
                </el-button>
              </div>
              <div v-if="consistencyResults" class="check-results">
                <h4>检查结果:</h4>
                <div v-for="(check, key) in consistencyResults.checks" :key="key" class="check-item">
                  <h5>{{ key }}:</h5>
                  <p><strong>查询:</strong> {{ check.query }}</p>
                  <p v-if="check.result"><strong>结果:</strong> {{ check.result }}</p>
                  <p v-if="check.error" class="error"><strong>错误:</strong> {{ check.error }}</p>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 系统信息弹窗 -->
    <el-dialog 
      v-model="systemDialogVisible" 
      title="Docker系统信息" 
      width="70%"
    >
      <div v-if="systemStats" class="system-stats">
        <el-descriptions title="Docker信息" :column="2" border>
          <el-descriptions-item label="Docker版本">
            {{ systemStats.version?.Version }}
          </el-descriptions-item>
          <el-descriptions-item label="API版本">
            {{ systemStats.version?.ApiVersion }}
          </el-descriptions-item>
          <el-descriptions-item label="容器总数">
            {{ systemStats.info?.Containers }}
          </el-descriptions-item>
          <el-descriptions-item label="运行中容器">
            {{ systemStats.info?.ContainersRunning }}
          </el-descriptions-item>
          <el-descriptions-item label="暂停容器">
            {{ systemStats.info?.ContainersPaused }}
          </el-descriptions-item>
          <el-descriptions-item label="停止容器">
            {{ systemStats.info?.ContainersStopped }}
          </el-descriptions-item>
          <el-descriptions-item label="镜像数量">
            {{ systemStats.info?.Images }}
          </el-descriptions-item>
          <el-descriptions-item label="系统架构">
            {{ systemStats.info?.Architecture }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Monitor,
  VideoPlay,
  VideoPause,
  RefreshRight,
  View,
  Document,
  Coin,
  Search,
  FolderOpened,
  Grid,
  List
} from '@element-plus/icons-vue'
import * as adminApi from '@/api/admin'

interface Container {
  id: string
  name: string
  image: string
  status: string
  state: string
  created: Date
  ports: any[]
  mounts: any[]
  env: string[]
  stats: any
  labels: any
  networkMode: string
  restartPolicy: any
}

const containers = ref<Container[]>([])
const loading = ref(false)
const actionLoading = reactive<{ [key: string]: boolean }>({})

// 对话框状态
const detailDialogVisible = ref(false)
const dbDialogVisible = ref(false)
const systemDialogVisible = ref(false)

// 选中的容器和详情
const selectedContainer = ref<any>(null)
const activeTab = ref('info')
const containerLogs = ref('')
const logLines = ref(100)

// 数据库操作
const dbActiveTab = ref('browse')
const sqlCommand = ref('')
const targetDatabase = ref('wechat_education')
const sqlResult = ref('')
const sqlLoading = ref(false)
const consistencyLoading = ref(false)
const consistencyResults = ref<any>(null)

// 数据库浏览
const databases = ref<string[]>([])
const tables = ref<any[]>([])
const selectedDatabase = ref('')
const selectedTable = ref('')
const tableStructure = ref<any[]>([])
const tableData = ref<any[]>([])
const tableColumns = ref<string[]>([])
const databasesLoading = ref(false)
const tablesLoading = ref(false)
const showStructure = ref(false)
const showData = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalRows = ref(0)

// 系统信息
const systemStats = ref<any>(null)

onMounted(() => {
  loadContainers()
})

const loadContainers = async () => {
  loading.value = true
  try {
    const response = await adminApi.getContainers()
    containers.value = response.data.data
  } catch (error: any) {
    ElMessage.error('加载容器列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const refreshContainers = () => {
  loadContainers()
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'running': return 'success'
    case 'exited': return 'info'
    case 'paused': return 'warning'
    default: return 'danger'
  }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const isDbContainer = (container: Container) => {
  return container.image.includes('mysql') || 
         container.name.includes('mysql') ||
         container.name.includes('database') ||
         container.name.includes('db')
}

const startContainer = async (id: string) => {
  actionLoading[id] = true
  try {
    await adminApi.startContainer(id)
    ElMessage.success('容器启动成功')
    await loadContainers()
  } catch (error: any) {
    ElMessage.error('启动容器失败: ' + error.message)
  } finally {
    actionLoading[id] = false
  }
}

const stopContainer = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要停止此容器吗？', '确认操作', {
      type: 'warning'
    })
    
    actionLoading[id] = true
    await adminApi.stopContainer(id)
    ElMessage.success('容器停止成功')
    await loadContainers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('停止容器失败: ' + error.message)
    }
  } finally {
    actionLoading[id] = false
  }
}

const restartContainer = async (id: string) => {
  actionLoading[id] = true
  try {
    await adminApi.restartContainer(id)
    ElMessage.success('容器重启成功')
    await loadContainers()
  } catch (error: any) {
    ElMessage.error('重启容器失败: ' + error.message)
  } finally {
    actionLoading[id] = false
  }
}

const showContainerDetail = async (container: Container) => {
  try {
    const response = await adminApi.getContainerDetail(container.id)
    selectedContainer.value = response.data.data
    detailDialogVisible.value = true
    activeTab.value = 'info'
    
    // 加载日志
    await refreshLogs()
  } catch (error: any) {
    ElMessage.error('获取容器详情失败: ' + error.message)
  }
}

const showContainerLogs = async (container: Container) => {
  selectedContainer.value = { id: container.id, name: container.name }
  detailDialogVisible.value = true
  activeTab.value = 'logs'
  await refreshLogs()
}

const refreshLogs = async () => {
  if (!selectedContainer.value) return
  
  try {
    const response = await adminApi.getContainerLogs(selectedContainer.value.Id || selectedContainer.value.id, logLines.value)
    containerLogs.value = response.data.data.logs
  } catch (error: any) {
    ElMessage.error('获取容器日志失败: ' + error.message)
  }
}

const showDatabaseOperations = (container: Container) => {
  selectedContainer.value = container
  dbDialogVisible.value = true
  dbActiveTab.value = 'browse'
  
  // 重置状态
  databases.value = []
  tables.value = []
  selectedDatabase.value = ''
  selectedTable.value = ''
  showStructure.value = false
  showData.value = false
  
  // 自动加载数据库列表
  loadDatabases()
}

const executeSqlCommand = async () => {
  if (!sqlCommand.value.trim()) {
    ElMessage.warning('请输入SQL命令')
    return
  }
  
  sqlLoading.value = true
  try {
    const response = await adminApi.executeDatabaseCommand({
      containerId: selectedContainer.value.id,
      command: sqlCommand.value,
      database: targetDatabase.value || 'wechat_education'
    })
    
    sqlResult.value = `执行时间: ${response.data.data.timestamp}\n` +
                     `命令: ${response.data.data.command}\n\n` +
                     `结果:\n${response.data.data.output}`
    
    ElMessage.success('SQL命令执行成功')
  } catch (error: any) {
    ElMessage.error('SQL命令执行失败: ' + error.message)
    sqlResult.value = `错误: ${error.message}`
  } finally {
    sqlLoading.value = false
  }
}

const clearSqlResult = () => {
  sqlResult.value = ''
  sqlCommand.value = ''
}

const checkDatabaseConsistency = async () => {
  consistencyLoading.value = true
  try {
    const response = await adminApi.checkDatabaseConsistency({
      containerId: selectedContainer.value.id
    })
    
    consistencyResults.value = response.data.data
    ElMessage.success('数据库一致性检查完成')
  } catch (error: any) {
    ElMessage.error('数据库一致性检查失败: ' + error.message)
  } finally {
    consistencyLoading.value = false
  }
}

const showSystemStats = async () => {
  try {
    const response = await adminApi.getSystemStats()
    systemStats.value = response.data.data
    systemDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error('获取系统信息失败: ' + error.message)
  }
}

// 数据库浏览方法
const loadDatabases = async () => {
  if (!selectedContainer.value) return
  
  databasesLoading.value = true
  try {
    const response = await adminApi.getDatabases(selectedContainer.value.id)
    databases.value = response.data.data.databases
  } catch (error: any) {
    ElMessage.error('加载数据库列表失败: ' + error.message)
  } finally {
    databasesLoading.value = false
  }
}

const selectDatabase = async (database: string) => {
  selectedDatabase.value = database
  selectedTable.value = ''
  showStructure.value = false
  showData.value = false
  
  // 加载表列表
  try {
    tablesLoading.value = true
    const response = await adminApi.getTables(selectedContainer.value.id, database)
    tables.value = response.data.data.tables
  } catch (error: any) {
    ElMessage.error('加载表列表失败: ' + error.message)
  } finally {
    tablesLoading.value = false
  }
}

const selectTable = (tableName: string) => {
  selectedTable.value = tableName
  showStructure.value = false
  showData.value = false
}

const loadTableStructure = async () => {
  if (!selectedDatabase.value || !selectedTable.value) return
  
  try {
    const response = await adminApi.getTableStructure(
      selectedContainer.value.id, 
      selectedDatabase.value, 
      selectedTable.value
    )
    tableStructure.value = response.data.data.columns
    showStructure.value = true
    showData.value = false
  } catch (error: any) {
    ElMessage.error('加载表结构失败: ' + error.message)
  }
}

const loadTableData = async () => {
  if (!selectedDatabase.value || !selectedTable.value) return
  
  try {
    const response = await adminApi.getTableData(
      selectedContainer.value.id, 
      selectedDatabase.value, 
      selectedTable.value,
      currentPage.value,
      pageSize.value
    )
    
    const data = response.data.data
    tableData.value = data.rows
    totalRows.value = data.total
    
    // 提取列名
    if (data.rows.length > 0) {
      tableColumns.value = Object.keys(data.rows[0])
    }
    
    showData.value = true
    showStructure.value = false
  } catch (error: any) {
    ElMessage.error('加载表数据失败: ' + error.message)
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadTableData()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadTableData()
}
</script>

<style scoped>
.container-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.containers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.container-card {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  background: white;
  transition: all 0.3s;
}

.container-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.container-card.running {
  border-left: 4px solid #67c23a;
}

.container-card.stopped {
  border-left: 4px solid #909399;
}

.container-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.container-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.container-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.container-details {
  margin-bottom: 16px;
}

.container-details p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.ports {
  margin: 8px 0;
}

.port-tag {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 6px;
}

.stats {
  margin-top: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.container-actions {
  margin-top: 12px;
}

.container-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.env-list {
  max-height: 400px;
  overflow-y: auto;
}

.env-item {
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
  font-family: monospace;
  font-size: 13px;
}

.logs-container {
  position: relative;
}

.logs-textarea {
  font-family: monospace;
  font-size: 12px;
}

.logs-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.database-operations {
  max-height: 70vh;
  overflow-y: auto;
}

.sql-executor {
  padding: 16px;
}

.sql-input {
  margin-bottom: 16px;
}

.sql-actions {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.sql-result {
  margin-top: 16px;
}

.result-textarea {
  font-family: monospace;
  font-size: 12px;
}

.consistency-check {
  padding: 16px;
}

.check-actions {
  margin-bottom: 16px;
}

.check-results {
  margin-top: 16px;
}

.check-item {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.check-item h5 {
  margin: 0 0 8px 0;
  color: #303133;
}

.check-item p {
  margin: 4px 0;
  font-size: 13px;
}

.error {
  color: #f56c6c;
}

.system-stats {
  max-height: 60vh;
  overflow-y: auto;
}

/* 数据库浏览样式 */
.database-browser {
  height: 70vh;
  overflow: hidden;
}

.browser-layout {
  display: flex;
  height: 100%;
  gap: 16px;
}

.sidebar {
  width: 300px;
  border-right: 1px solid #ebeef5;
  padding-right: 16px;
  overflow-y: auto;
}

.content-area {
  flex: 1;
  overflow-y: auto;
}

.database-list, .table-list {
  margin-bottom: 20px;
}

.database-list h4, .table-list h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
}

.database-item, .table-item {
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.database-item:hover, .table-item:hover {
  background-color: #f5f7fa;
}

.database-item.active, .table-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
}

.table-info {
  flex: 1;
}

.table-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.table-meta {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.table-stats {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.table-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.content-header h4 {
  margin: 0;
  color: #303133;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.structure-view, .data-view {
  flex: 1;
  overflow: hidden;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.data-header h5 {
  margin: 0;
  color: #303133;
}

.empty-state, .empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}
</style>