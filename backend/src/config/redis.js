module.exports = {
  // Redis连接配置
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000
  },

  // 缓存策略配置
  cache: {
    // 搜索结果缓存（15分钟）
    search: {
      ttl: 15 * 60,
      keyPrefix: 'search:result:'
    },
    
    // 搜索建议缓存（5分钟）
    suggestion: {
      ttl: 5 * 60,
      keyPrefix: 'search:suggestion:'
    },
    
    // 筛选选项缓存（30分钟）
    filter: {
      ttl: 30 * 60,
      keyPrefix: 'search:filter:'
    },
    
    // 热门关键词缓存（1小时）
    hotKeywords: {
      ttl: 60 * 60,
      keyPrefix: 'search:hot:'
    },
    
    // 用户会话缓存（24小时）
    session: {
      ttl: 24 * 60 * 60,
      keyPrefix: 'session:'
    }
  },

  // 统计配置
  stats: {
    keyPrefix: 'stats:',
    retention: 7 * 24 * 60 * 60 // 保留7天
  }
}