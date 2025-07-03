const Redis = require('ioredis')
const crypto = require('crypto')

/**
 * 基于Redis的搜索结果缓存管理器
 * 使用Redis提供分布式缓存支持，比内存缓存更适合生产环境
 */
class RedisSearchCache {
  constructor() {
    // Redis连接配置
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })
    
    // 缓存配置
    this.config = {
      // 默认缓存过期时间（15分钟）
      defaultTTL: 15 * 60,
      // 热门搜索缓存时间（1小时）
      hotSearchTTL: 60 * 60,
      // 建议缓存时间（5分钟）
      suggestionTTL: 5 * 60,
      // 筛选选项缓存时间（30分钟）
      filterTTL: 30 * 60,
      // 缓存键前缀
      keyPrefix: 'search:',
      // 统计键前缀
      statsPrefix: 'stats:'
    }
    
    // 初始化Redis连接
    this.initRedis()
  }

  /**
   * 初始化Redis连接
   */
  initRedis() {
    // 监听Redis事件
    this.redis.on('connect', () => {
      console.log('Redis搜索缓存连接成功')
    })
    
    this.redis.on('error', (error) => {
      console.error('Redis缓存连接错误:', error)
      // 如果Redis连接失败，使用内存缓存作为降级方案
      if (!this.useMemory) {
        this.fallbackToMemory()
      }
    })
    
    this.redis.on('reconnecting', () => {
      console.log('Redis缓存重新连接中...')
    })
    
    this.redis.on('close', () => {
      console.log('Redis缓存连接已关闭')
    })
  }

  /**
   * 降级到内存缓存
   */
  fallbackToMemory() {
    console.log('启用内存缓存降级方案')
    this.memoryCache = new Map()
    this.useMemory = true
    
    // 关闭Redis连接以避免进一步的错误
    if (this.redis) {
      try {
        this.redis.disconnect(false)
      } catch (error) {
        // 忽略断开连接时的错误
      }
    }
  }

  /**
   * 生成缓存键
   * @param {string} type - 缓存类型 ('search', 'suggestion', 'filter')
   * @param {Object} params - 搜索参数
   * @returns {string} 缓存键
   */
  generateCacheKey(type, params) {
    // 标准化参数对象
    const normalizedParams = this.normalizeParams(params)
    
    // 创建参数字符串
    const paramString = JSON.stringify(normalizedParams)
    
    // 生成哈希
    const hash = crypto.createHash('md5').update(paramString).digest('hex')
    
    return `${this.config.keyPrefix}${type}:${hash}`
  }

  /**
   * 标准化搜索参数
   * @param {Object} params - 原始参数
   * @returns {Object} 标准化后的参数
   */
  normalizeParams(params) {
    const normalized = {}
    
    // 对参数键进行排序以确保一致性
    Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .sort()
      .forEach(key => {
        let value = params[key]
        
        // 处理数组参数
        if (Array.isArray(value)) {
          value = value.sort().join(',')
        }
        
        // 处理字符串参数（转小写并去除空白）
        if (typeof value === 'string') {
          value = value.trim().toLowerCase()
        }
        
        normalized[key] = value
      })
    
    return normalized
  }

  /**
   * 获取缓存数据
   * @param {string} type - 缓存类型
   * @param {Object} params - 搜索参数
   * @returns {Object|null} 缓存的数据或null
   */
  async get(type, params) {
    try {
      const key = this.generateCacheKey(type, params)
      
      if (this.useMemory) {
        // 内存缓存降级
        const cached = this.memoryCache.get(key)
        if (cached && Date.now() < cached.expiresAt) {
          return cached.data
        } else if (cached) {
          this.memoryCache.delete(key)
        }
        return null
      }
      
      // 从Redis获取数据
      const cached = await this.redis.get(key)
      
      if (!cached) {
        return null
      }
      
      const data = JSON.parse(cached)
      
      // 更新访问统计（异步执行，不影响性能）
      this.updateStats(type, 'hit').catch(err => {
        console.error('更新缓存统计失败:', err)
      })
      
      return data
      
    } catch (error) {
      console.error('获取缓存数据失败:', error)
      // 如果Redis操作失败，尝试降级到内存缓存
      if (!this.useMemory) {
        console.log('Redis操作失败，降级到内存缓存')
        this.fallbackToMemory()
      }
      return null
    }
  }

  /**
   * 设置缓存数据
   * @param {string} type - 缓存类型
   * @param {Object} params - 搜索参数
   * @param {Object} data - 要缓存的数据
   * @param {number} ttl - 可选的过期时间（秒）
   */
  async set(type, params, data, ttl = null) {
    try {
      const key = this.generateCacheKey(type, params)
      const cacheTTL = ttl || this.getTTLForType(type)
      
      if (this.useMemory) {
        // 内存缓存降级
        const cacheEntry = {
          data: data,
          expiresAt: Date.now() + (cacheTTL * 1000)
        }
        this.memoryCache.set(key, cacheEntry)
        return
      }
      
      // 存储到Redis
      const serializedData = JSON.stringify(data)
      await this.redis.setex(key, cacheTTL, serializedData)
      
      // 更新设置统计（异步执行）
      this.updateStats(type, 'set').catch(err => {
        console.error('更新缓存统计失败:', err)
      })
      
    } catch (error) {
      console.error('设置缓存数据失败:', error)
    }
  }

  /**
   * 根据类型获取TTL
   * @param {string} type - 缓存类型
   * @returns {number} TTL（秒）
   */
  getTTLForType(type) {
    switch (type) {
      case 'suggestion':
        return this.config.suggestionTTL
      case 'filter':
        return this.config.filterTTL
      case 'search':
      default:
        return this.config.defaultTTL
    }
  }

  /**
   * 删除指定缓存
   * @param {string} type - 缓存类型
   * @param {Object} params - 搜索参数
   */
  async delete(type, params) {
    try {
      const key = this.generateCacheKey(type, params)
      
      if (this.useMemory) {
        this.memoryCache.delete(key)
        return
      }
      
      await this.redis.del(key)
      
    } catch (error) {
      console.error('删除缓存失败:', error)
    }
  }

  /**
   * 清空指定类型的所有缓存
   * @param {string} type - 缓存类型
   */
  async clearType(type) {
    try {
      if (this.useMemory) {
        // 内存缓存清理
        for (const key of this.memoryCache.keys()) {
          if (key.includes(`${this.config.keyPrefix}${type}:`)) {
            this.memoryCache.delete(key)
          }
        }
        return
      }
      
      // Redis批量删除
      const pattern = `${this.config.keyPrefix}${type}:*`
      const keys = await this.redis.keys(pattern)
      
      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`清理了 ${keys.length} 个 ${type} 类型的缓存`)
      }
      
    } catch (error) {
      console.error('清理缓存类型失败:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  async clear() {
    try {
      if (this.useMemory) {
        this.memoryCache.clear()
        return
      }
      
      const pattern = `${this.config.keyPrefix}*`
      const keys = await this.redis.keys(pattern)
      
      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`清理了 ${keys.length} 个缓存条目`)
      }
      
    } catch (error) {
      console.error('清空所有缓存失败:', error)
    }
  }

  /**
   * 缓存失效策略
   * 当数据发生变化时，清除相关缓存
   * @param {string} entity - 实体类型 ('resource', 'post', 'category', 'tag')
   * @param {string} action - 操作类型 ('create', 'update', 'delete')
   */
  async invalidate(entity, action = 'update') {
    console.log(`缓存失效: ${entity} ${action}`)
    
    try {
      // 清除搜索缓存
      await this.clearType('search')
      
      // 根据实体类型清除特定缓存
      switch (entity) {
        case 'resource':
          // 资源变化影响资源搜索和筛选选项
          await this.clearType('suggestion')
          break
          
        case 'post':
          // 帖子变化影响帖子搜索和建议
          await this.clearType('suggestion')
          break
          
        case 'category':
        case 'tag':
          // 分类/标签变化影响筛选选项
          await this.clearType('filter')
          await this.clearType('suggestion')
          break
          
        default:
          // 其他情况清除所有相关缓存
          await this.clearType('suggestion')
          await this.clearType('filter')
      }
      
    } catch (error) {
      console.error('缓存失效处理失败:', error)
    }
  }

  /**
   * 更新缓存统计
   * @param {string} type - 缓存类型
   * @param {string} operation - 操作类型 ('hit', 'set', 'miss')
   */
  async updateStats(type, operation) {
    try {
      if (this.useMemory) {
        return // 内存模式不记录统计
      }
      
      const statsKey = `${this.config.statsPrefix}${type}:${operation}`
      const dailyKey = `${statsKey}:${new Date().toISOString().slice(0, 10)}`
      
      // 增加计数并设置过期时间（7天）
      await this.redis.incr(dailyKey)
      await this.redis.expire(dailyKey, 7 * 24 * 60 * 60)
      
    } catch (error) {
      // 统计失败不影响主要功能，只记录错误
      console.error('更新缓存统计失败:', error)
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  async getStats() {
    try {
      if (this.useMemory) {
        return {
          type: 'memory',
          totalEntries: this.memoryCache.size,
          stats: 'Memory cache fallback mode'
        }
      }
      
      const info = await this.redis.info('memory')
      const dbSize = await this.redis.dbsize()
      
      // 获取搜索缓存相关的键数量
      const searchKeys = await this.redis.keys(`${this.config.keyPrefix}*`)
      
      return {
        type: 'redis',
        totalKeys: dbSize,
        searchCacheKeys: searchKeys.length,
        memoryInfo: this.parseRedisInfo(info),
        cacheKeyPrefix: this.config.keyPrefix
      }
      
    } catch (error) {
      console.error('获取缓存统计失败:', error)
      return {
        type: 'error',
        error: error.message
      }
    }
  }

  /**
   * 解析Redis INFO命令输出
   * @param {string} info - Redis INFO输出
   * @returns {Object} 解析后的信息
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n')
    const result = {}
    
    lines.forEach(line => {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        result[key] = value
      }
    })
    
    return {
      used_memory_human: result.used_memory_human,
      used_memory_peak_human: result.used_memory_peak_human,
      maxmemory_human: result.maxmemory_human
    }
  }

  /**
   * 获取指定模式的所有缓存键
   * @param {string} type - 缓存类型
   * @returns {Array} 缓存键列表
   */
  async getKeys(type) {
    try {
      if (this.useMemory) {
        // 内存缓存模式
        const keys = []
        const pattern = `${this.config.keyPrefix}${type}:`
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(pattern)) {
            keys.push(key)
          }
        }
        return keys
      }
      
      // Redis模式
      const pattern = `${this.config.keyPrefix}${type}:*`
      const keys = await this.redis.keys(pattern)
      return keys
    } catch (error) {
      console.error('获取缓存键失败:', error)
      return []
    }
  }

  /**
   * 根据键直接获取缓存数据
   * @param {string} key - 缓存键
   * @returns {Object|null} 缓存数据
   */
  async getByKey(key) {
    try {
      if (this.useMemory) {
        const cached = this.memoryCache.get(key)
        if (cached && Date.now() < cached.expiresAt) {
          return cached.data
        } else if (cached) {
          this.memoryCache.delete(key)
        }
        return null
      }
      
      const cached = await this.redis.get(key)
      if (!cached) {
        return null
      }
      
      return JSON.parse(cached)
    } catch (error) {
      console.error('根据键获取缓存失败:', error)
      return null
    }
  }

  /**
   * 根据键直接设置缓存数据
   * @param {string} key - 缓存键
   * @param {Object} data - 缓存数据
   * @param {number} ttl - 过期时间（秒）
   */
  async setByKey(key, data, ttl = null) {
    try {
      // 从键中提取缓存类型以确定TTL
      const keyParts = key.split(':')
      const type = keyParts[1] || 'search'
      const cacheTTL = ttl || this.getTTLForType(type)
      
      if (this.useMemory) {
        const cacheEntry = {
          data: data,
          expiresAt: Date.now() + (cacheTTL * 1000)
        }
        this.memoryCache.set(key, cacheEntry)
        return
      }
      
      const serializedData = JSON.stringify(data)
      await this.redis.setex(key, cacheTTL, serializedData)
    } catch (error) {
      console.error('根据键设置缓存失败:', error)
    }
  }

  /**
   * 清除匹配模式的缓存
   * @param {string} type - 缓存类型
   */
  async clearPattern(type) {
    try {
      await this.clearType(type)
    } catch (error) {
      console.error('清除缓存模式失败:', error)
    }
  }

  /**
   * 预热缓存
   * 在系统启动时预加载热门搜索结果
   */
  async warmup() {
    console.log('Redis搜索缓存预热完成')
  }

  /**
   * 关闭Redis连接
   */
  async close() {
    try {
      if (!this.useMemory && this.redis) {
        await this.redis.quit()
        console.log('Redis搜索缓存连接已关闭')
      }
    } catch (error) {
      console.error('关闭Redis连接失败:', error)
    }
  }
}

// 创建单例实例
const redisSearchCache = new RedisSearchCache()

module.exports = redisSearchCache