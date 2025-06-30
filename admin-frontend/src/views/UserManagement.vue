<template>
  <div class="user-management">
    <div class="header">
      <h1>用户管理</h1>
      <div class="search-bar">
        <el-input
          v-model="searchText"
          placeholder="搜索用户手机号或姓名"
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

    <div class="filters">
      <el-select v-model="filters.role" placeholder="选择角色" clearable style="width: 120px">
        <el-option label="普通用户" value="user" />
        <el-option label="管理员" value="admin" />
      </el-select>
      <el-select v-model="filters.status" placeholder="选择状态" clearable style="width: 120px">
        <el-option label="正常" value="active" />
        <el-option label="禁用" value="inactive" />
        <el-option label="封禁" value="banned" />
      </el-select>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="users"
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column prop="phone_number" label="手机号" width="120" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="role" label="角色" width="80">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'active' ? 'success' : row.status === 'inactive' ? 'warning' : 'danger'"
          >
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180" sortable="custom">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-dropdown @command="(command) => handleAction(command, row)">
            <el-button type="primary" size="small">
              操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="row.status === 'active'"
                  command="disable"
                  :disabled="row.role === 'admin'"
                >
                  禁用
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 'inactive'"
                  command="enable"
                >
                  启用
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status !== 'banned'"
                  command="ban"
                  :disabled="row.role === 'admin'"
                >
                  封禁
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="row.status === 'banned'"
                  command="unban"
                >
                  解封
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { getUsers, updateUserStatus } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { User } from '@/types'
import { Search, ArrowDown } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const users = ref<User[]>([])

const filters = reactive({
  role: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    banned: '封禁'
  }
  return statusMap[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchText.value || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined
    }
    
    const response = await getUsers(params)
    const data = response.data.data!
    
    users.value = data.users || []
    pagination.total = data.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const handleReset = () => {
  searchText.value = ''
  filters.role = ''
  filters.status = ''
  pagination.page = 1
  loadUsers()
}

const handleSortChange = () => {
  loadUsers()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadUsers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadUsers()
}

const handleAction = async (command: string, user: User) => {
  const actionMap: Record<string, { status: string; text: string }> = {
    enable: { status: 'active', text: '启用' },
    disable: { status: 'inactive', text: '禁用' },
    ban: { status: 'banned', text: '封禁' },
    unban: { status: 'active', text: '解封' }
  }
  
  const action = actionMap[command]
  if (!action) return
  
  try {
    await ElMessageBox.confirm(
      `确定要${action.text}用户 ${user.name || user.phone_number} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await updateUserStatus(user.phone_number, action.status)
    ElMessage.success(`${action.text}成功`)
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action.text}失败`)
    }
  }
}

// 监听过滤器变化
watch([() => filters.role, () => filters.status], () => {
  pagination.page = 1
  loadUsers()
})

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
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
</style>