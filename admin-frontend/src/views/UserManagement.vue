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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="viewUser(row)">详情</el-button>
            <el-dropdown 
              v-if="currentUser?.phone_number !== row.phone_number"
              @command="(command) => handleAction(command, row)"
            >
              <el-button type="primary" size="small">
                操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <!-- 状态操作 -->
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
                  
                  <el-dropdown-item divided command="separator" disabled>
                    ── 角色管理 ──
                  </el-dropdown-item>
                  
                  <!-- 角色操作 -->
                  <el-dropdown-item
                    v-if="row.role === 'user'"
                    command="promote"
                    :disabled="row.status !== 'active'"
                  >
                    设为管理员
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.role === 'admin'"
                    command="demote"
                  >
                    取消管理员
                  </el-dropdown-item>
                  
                  <el-dropdown-item divided command="separator" disabled>
                    ── 账户管理 ──
                  </el-dropdown-item>
                  
                  <!-- 其他操作 -->
                  <el-dropdown-item
                    command="resetPassword"
                  >
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    :disabled="row.role === 'admin'"
                  >
                    删除用户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-tag v-else type="warning" size="small">当前用户</el-tag>
          </el-button-group>
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

    <!-- 用户详情对话框 -->
    <el-dialog v-model="userDetailVisible" title="用户详情" width="800px">
      <div v-if="selectedUserDetail" class="user-detail">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="手机号">{{ selectedUserDetail.user.phone_number }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedUserDetail.user.name }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ selectedUserDetail.user.nickname || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUserDetail.user.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="selectedUserDetail.user.role === 'admin' ? 'danger' : 'info'">
              {{ selectedUserDetail.user.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedUserDetail.user.status === 'active' ? 'success' : selectedUserDetail.user.status === 'inactive' ? 'warning' : 'danger'">
              {{ getStatusText(selectedUserDetail.user.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(selectedUserDetail.user.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="个人简介">{{ selectedUserDetail.user.bio || '未设置' }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="统计信息" :column="4" border style="margin-top: 20px;">
          <el-descriptions-item label="发布资源">{{ selectedUserDetail.stats.resourceCount }}</el-descriptions-item>
          <el-descriptions-item label="已审核资源">{{ selectedUserDetail.stats.publishedResourceCount }}</el-descriptions-item>
          <el-descriptions-item label="发布帖子">{{ selectedUserDetail.stats.postCount }}</el-descriptions-item>
          <el-descriptions-item label="活跃帖子">{{ selectedUserDetail.stats.activePostCount }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="400px">
      <el-form :model="resetPasswordForm" label-width="100px">
        <el-form-item label="用户">
          <el-input :value="selectedUser?.name + ' (' + selectedUser?.phone_number + ')'" disabled />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码（6-32位）"
            maxlength="32"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            maxlength="32"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmResetPassword">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { getUsers, updateUserStatus, updateUserRole, resetUserPassword, deleteUser, getUserDetail, getUserProfile } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { User } from '@/types'
import { Search, ArrowDown } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const users = ref<User[]>([])
const currentUser = ref<User | null>(null)
const selectedUser = ref<User | null>(null)
const selectedUserDetail = ref<any>(null)
const userDetailVisible = ref(false)
const resetPasswordVisible = ref(false)

const filters = reactive({
  role: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const resetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
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

const viewUser = async (user: User) => {
  try {
    const response = await getUserDetail(user.phone_number)
    selectedUserDetail.value = response.data.data
    userDetailVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户详情失败')
  }
}

const handleAction = async (command: string, user: User) => {
  // 过滤分隔符
  if (command === 'separator') return
  
  selectedUser.value = user
  
  // 状态操作
  const statusActions: Record<string, { status: string; text: string }> = {
    enable: { status: 'active', text: '启用' },
    disable: { status: 'inactive', text: '禁用' },
    ban: { status: 'banned', text: '封禁' },
    unban: { status: 'active', text: '解封' }
  }
  
  if (statusActions[command]) {
    await handleStatusAction(command, user, statusActions[command])
    return
  }
  
  // 角色操作
  if (command === 'promote') {
    await handleRoleAction(user, 'admin', '设为管理员')
  } else if (command === 'demote') {
    await handleRoleAction(user, 'user', '取消管理员')
  }
  
  // 其他操作
  else if (command === 'resetPassword') {
    handleResetPassword(user)
  } else if (command === 'delete') {
    await handleDeleteUser(user)
  }
}

const handleStatusAction = async (command: string, user: User, action: { status: string; text: string }) => {
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

const handleRoleAction = async (user: User, role: string, actionText: string) => {
  try {
    const warningText = role === 'admin' 
      ? `确定要将用户 ${user.name || user.phone_number} 设为管理员吗？\n\n警告：管理员拥有系统最高权限，请谨慎操作！`
      : `确定要取消用户 ${user.name || user.phone_number} 的管理员权限吗？`
    
    await ElMessageBox.confirm(warningText, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: role === 'admin' ? 'error' : 'warning'
    })
    
    await updateUserRole(user.phone_number, role)
    ElMessage.success(`${actionText}成功`)
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${actionText}失败`)
    }
  }
}

const handleResetPassword = (user: User) => {
  selectedUser.value = user
  resetPasswordForm.newPassword = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordVisible.value = true
}

const confirmResetPassword = async () => {
  if (!resetPasswordForm.newPassword) {
    ElMessage.error('请输入新密码')
    return
  }
  
  if (resetPasswordForm.newPassword.length < 6) {
    ElMessage.error('密码至少6位')
    return
  }
  
  if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 ${selectedUser.value?.name || selectedUser.value?.phone_number} 的密码吗？`,
      '确认重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await resetUserPassword(selectedUser.value!.phone_number, resetPasswordForm.newPassword)
    ElMessage.success('密码重置成功')
    resetPasswordVisible.value = false
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '重置密码失败')
    }
  }
}

const handleDeleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要永久删除用户 ${user.name || user.phone_number} 吗？\n\n警告：此操作不可恢复，将永久删除用户及其所有相关数据（资源、帖子、评论等）！`,
      '确认永久删除用户',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await deleteUser(user.phone_number)
    ElMessage.success('用户及其所有相关数据已永久删除')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除用户失败')
    }
  }
}

// 监听过滤器变化
watch([() => filters.role, () => filters.status], () => {
  pagination.page = 1
  loadUsers()
})

const loadCurrentUser = async () => {
  try {
    const response = await getUserProfile()
    currentUser.value = response.data.data
  } catch (error: any) {
    console.error('获取当前用户信息失败:', error)
  }
}

onMounted(() => {
  loadCurrentUser()
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