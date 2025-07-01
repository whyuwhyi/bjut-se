import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/components/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '管理面板' }
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('@/views/UserManagement.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'resources',
          name: 'ResourceManagement',
          component: () => import('@/views/ResourceManagement.vue'),
          meta: { title: '资源管理' }
        },
        {
          path: 'forum',
          name: 'ForumManagement',
          component: () => import('@/views/ForumManagement.vue'),
          meta: { title: '论坛管理' }
        },
        {
          path: 'notifications',
          name: 'NotificationSend',
          component: () => import('@/views/NotificationSend.vue'),
          meta: { title: '通知管理' }
        },
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import('@/views/Statistics.vue'),
          meta: { title: '数据统计' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 如果访问登录页且已登录，跳转到仪表板
  if (to.name === 'Login' && authStore.isAdmin()) {
    next('/dashboard')
    return
  }

  // 如果路由需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.token) {
      next('/login')
      return
    }

    // 如果有token但没有用户信息，尝试获取
    if (!authStore.user) {
      const success = await authStore.fetchUserProfile()
      if (!success) {
        next('/login')
        return
      }
    }

    // 检查管理员权限
    if (!authStore.isAdmin()) {
      next('/login')
      return
    }
  }

  next()
})

export default router