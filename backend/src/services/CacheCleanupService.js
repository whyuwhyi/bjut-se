const redisSearchCache = require('../utils/RedisSearchCache')
const { Resource, Post } = require('../models')
const { Op } = require('sequelize')

class CacheCleanupService {
  constructor() {
    this.cleanupInterval = null
    // 每5分钟执行一次清理
    this.intervalTime = 5 * 60 * 1000
  }

  /**
   * 启动定时清理任务
   */
  start() {
    console.log('启动缓存清理服务')
    
    // 立即执行一次清理
    this.performCleanup()
    
    // 设置定时任务
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, this.intervalTime)
  }

  /**
   * 停止定时清理任务
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('缓存清理服务已停止')
    }
  }

  /**
   * 执行清理操作
   */
  async performCleanup() {
    try {
      console.log('开始执行缓存清理...')
      
      // 清理包含已删除资源的缓存
      await this.cleanupDeletedResourcesFromCache()
      
      // 清理包含已删除帖子的缓存
      await this.cleanupDeletedPostsFromCache()
      
      console.log('缓存清理完成')
    } catch (error) {
      console.error('缓存清理失败:', error)
    }
  }

  /**
   * 清理包含已删除资源的缓存
   */
  async cleanupDeletedResourcesFromCache() {
    try {
      // 获取所有已删除/归档的资源ID
      const deletedResources = await Resource.findAll({
        where: {
          status: { [Op.in]: ['archived', 'deleted'] }
        },
        attributes: ['resource_id']
      })

      if (deletedResources.length === 0) {
        return
      }

      const deletedIds = deletedResources.map(r => r.resource_id)
      console.log(`发现 ${deletedIds.length} 个已删除的资源`)

      // 获取所有搜索缓存键
      const cacheKeys = await redisSearchCache.getKeys('search')
      let cleanedCount = 0

      for (const key of cacheKeys) {
        const cachedData = await redisSearchCache.getByKey(key)
        
        if (cachedData && cachedData.resources && Array.isArray(cachedData.resources)) {
          // 检查缓存中是否包含已删除的资源
          const hasDeletedResources = cachedData.resources.some(resource => 
            deletedIds.includes(resource.id || resource.resource_id)
          )

          if (hasDeletedResources) {
            // 删除包含已删除资源的缓存
            await this.deleteCacheByKey(key)
            cleanedCount++
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`清理了 ${cleanedCount} 个包含已删除资源的缓存条目`)
      }
    } catch (error) {
      console.error('清理已删除资源缓存失败:', error)
    }
  }

  /**
   * 清理包含已删除帖子的缓存
   */
  async cleanupDeletedPostsFromCache() {
    try {
      // 获取所有已删除/归档的帖子ID
      const deletedPosts = await Post.findAll({
        where: {
          status: { [Op.in]: ['deleted', 'archived'] }
        },
        attributes: ['post_id']
      })

      if (deletedPosts.length === 0) {
        return
      }

      const deletedIds = deletedPosts.map(p => p.post_id)
      console.log(`发现 ${deletedIds.length} 个已删除的帖子`)

      // 获取所有搜索缓存键
      const cacheKeys = await redisSearchCache.getKeys('search')
      let cleanedCount = 0

      for (const key of cacheKeys) {
        const cachedData = await redisSearchCache.getByKey(key)
        
        if (cachedData && cachedData.posts && Array.isArray(cachedData.posts)) {
          // 检查缓存中是否包含已删除的帖子
          const hasDeletedPosts = cachedData.posts.some(post => 
            deletedIds.includes(post.id || post.post_id)
          )

          if (hasDeletedPosts) {
            // 删除包含已删除帖子的缓存
            await this.deleteCacheByKey(key)
            cleanedCount++
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`清理了 ${cleanedCount} 个包含已删除帖子的缓存条目`)
      }
    } catch (error) {
      console.error('清理已删除帖子缓存失败:', error)
    }
  }

  /**
   * 删除指定的缓存键
   */
  async deleteCacheByKey(key) {
    try {
      if (redisSearchCache.useMemory) {
        redisSearchCache.memoryCache.delete(key)
      } else {
        await redisSearchCache.redis.del(key)
      }
    } catch (error) {
      console.error(`删除缓存键 ${key} 失败:`, error)
    }
  }

  /**
   * 手动触发清理
   */
  async manualCleanup() {
    console.log('手动触发缓存清理')
    await this.performCleanup()
  }

  /**
   * 清理所有搜索缓存
   */
  async clearAllSearchCache() {
    try {
      await redisSearchCache.clearType('search')
      console.log('已清理所有搜索缓存')
    } catch (error) {
      console.error('清理所有搜索缓存失败:', error)
    }
  }

  /**
   * 获取清理服务状态
   */
  getStatus() {
    return {
      isRunning: !!this.cleanupInterval,
      intervalTime: this.intervalTime,
      nextCleanup: this.cleanupInterval ? 
        new Date(Date.now() + this.intervalTime).toISOString() : null
    }
  }
}

// 创建单例实例
const cacheCleanupService = new CacheCleanupService()

module.exports = cacheCleanupService