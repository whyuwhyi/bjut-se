import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import { login, getUserProfile } from '@/api/admin'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))
  const loading = ref(false)

  // 初始化用户信息
  const initUser = () => {
    const savedUser = localStorage.getItem('admin_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        logout()
      }
    }
  }

  // 登录
  const loginUser = async (phone_number: string, password: string) => {
    loading.value = true
    try {
      const response = await login(phone_number, password)
      const { token: newToken, user: userData } = response.data.data!
      
      // 检查是否为管理员
      if (userData.role !== 'admin') {
        throw new Error('只有管理员可以访问后台')
      }

      token.value = newToken
      user.value = userData

      // 保存到本地存储
      localStorage.setItem('admin_token', newToken)
      localStorage.setItem('admin_user', JSON.stringify(userData))

      return true
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchUserProfile = async () => {
    if (!token.value) return false

    try {
      const response = await getUserProfile()
      const userData = response.data.data!
      
      // 再次检查管理员权限
      if (userData.role !== 'admin') {
        throw new Error('权限不足')
      }

      user.value = userData
      localStorage.setItem('admin_user', JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      logout()
      return false
    }
  }

  // 登出
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  // 检查是否已登录且为管理员
  const isAdmin = () => {
    return token.value && user.value && user.value.role === 'admin'
  }

  // 初始化
  initUser()

  return {
    user,
    token,
    loading,
    loginUser,
    fetchUserProfile,
    logout,
    isAdmin
  }
})