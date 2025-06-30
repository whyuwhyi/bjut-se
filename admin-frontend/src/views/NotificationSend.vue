<template>
  <div class="notification-send">
    <div class="header">
      <h1>通知管理</h1>
    </div>

    <el-card class="send-card">
      <template #header>
        <div class="card-header">
          <h3>发送系统通知</h3>
        </div>
      </template>
      
      <el-form
        ref="notificationFormRef"
        :model="notificationForm"
        :rules="notificationRules"
        label-width="100px"
        class="notification-form"
      >
        <el-form-item label="通知标题" prop="title">
          <el-input
            v-model="notificationForm.title"
            placeholder="请输入通知标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="通知内容" prop="content">
          <el-input
            v-model="notificationForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入通知内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="notificationForm.priority">
            <el-radio-button label="low">低</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="high">高</el-radio-button>
          </el-radio-group>
          <div class="priority-hint">
            <el-text size="small" type="info">
              高优先级通知会优先显示给用户
            </el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="发送范围">
          <el-radio-group v-model="sendType" @change="handleSendTypeChange">
            <el-radio-button label="all">全体用户</el-radio-button>
            <el-radio-button label="specific">指定用户</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="sendType === 'specific'" label="目标用户" prop="target_users">
          <el-select
            v-model="notificationForm.target_users"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="输入手机号搜索用户"
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="user in searchResults"
              :key="user.phone_number"
              :label="`${user.name || user.phone_number} (${user.phone_number})`"
              :value="user.phone_number"
            />
          </el-select>
          <div class="user-hint">
            <el-text size="small" type="info">
              可输入手机号或姓名搜索用户，支持多选
            </el-text>
          </div>
        </el-form-item>
        
        <el-form-item>
          <div class="form-actions">
            <el-button @click="resetForm">重置</el-button>
            <el-button type="primary" :loading="sending" @click="sendNotification">
              {{ sending ? '发送中...' : '发送通知' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <h3>发送历史</h3>
          <el-text size="small" type="info">显示最近发送的系统通知</el-text>
        </div>
      </template>
      
      <div class="history-placeholder">
        <el-empty description="发送历史功能开发中" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createSystemNotification, getUsers } from '@/api/admin'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { NotificationForm, User } from '@/types'

const notificationFormRef = ref<FormInstance>()
const sending = ref(false)
const userSearchLoading = ref(false)
const sendType = ref<'all' | 'specific'>('all')
const searchResults = ref<User[]>([])

const notificationForm = reactive<NotificationForm>({
  title: '',
  content: '',
  priority: 'medium',
  target_users: []
})

const notificationRules: FormRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 5, max: 1000, message: '内容长度在 5 到 1000 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  target_users: [
    {
      validator: (rule, value, callback) => {
        if (sendType.value === 'specific' && (!value || value.length === 0)) {
          callback(new Error('请至少选择一个目标用户'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const handleSendTypeChange = (type: 'all' | 'specific') => {
  if (type === 'all') {
    notificationForm.target_users = []
  }
}

const searchUsers = async (query: string) => {
  if (!query) {
    searchResults.value = []
    return
  }
  
  userSearchLoading.value = true
  try {
    const response = await getUsers({
      search: query,
      limit: 20
    })
    const data = response.data.data!
    searchResults.value = data.users || []
  } catch (error: any) {
    ElMessage.error(error.message || '搜索用户失败')
  } finally {
    userSearchLoading.value = false
  }
}

const sendNotification = async () => {
  if (!notificationFormRef.value) return
  
  try {
    await notificationFormRef.value.validate()
    
    sending.value = true
    
    const formData = { ...notificationForm }
    if (sendType.value === 'all') {
      delete formData.target_users
    }
    
    const response = await createSystemNotification(formData)
    const sentCount = response.data.data?.sent_count || 0
    
    ElMessage.success(`通知发送成功，共发送给 ${sentCount} 个用户`)
    resetForm()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    sending.value = false
  }
}

const resetForm = () => {
  if (!notificationFormRef.value) return
  
  notificationFormRef.value.resetFields()
  notificationForm.title = ''
  notificationForm.content = ''
  notificationForm.priority = 'medium'
  notificationForm.target_users = []
  sendType.value = 'all'
  searchResults.value = []
}
</script>

<style scoped>
.notification-send {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.send-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.notification-form {
  max-width: 600px;
}

.priority-hint {
  margin-top: 5px;
}

.user-hint {
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}

.history-card {
  margin-top: 20px;
}

.history-placeholder {
  padding: 40px 0;
  text-align: center;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

:deep(.el-select) {
  width: 100%;
}

@media (max-width: 768px) {
  .notification-form {
    max-width: 100%;
  }
  
  .form-actions {
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>