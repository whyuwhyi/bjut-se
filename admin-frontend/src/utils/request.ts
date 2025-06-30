import axios from 'axios'
import type { ApiResponse } from '@/types'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    
    // 如果响应成功，直接返回数据
    if (data.success) {
      return response
    }
    
    // 如果响应失败，抛出错误
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        window.location.href = '/admin/login'
        return Promise.reject(new Error('登录已过期，请重新登录'))
      }
      
      if (status === 403) {
        return Promise.reject(new Error('权限不足'))
      }
      
      return Promise.reject(new Error(data?.message || `请求错误 (${status})`))
    }
    
    return Promise.reject(new Error('网络错误'))
  }
)

export default request