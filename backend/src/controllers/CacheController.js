const searchCache = require('../utils/RedisSearchCache')

class CacheController {
  /**
   * 获取缓存统计信息
   */
  async getStats(req, res) {
    try {
      const stats = await searchCache.getStats()
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('获取缓存统计失败:', error)
      res.status(500).json({
        success: false,
        message: '获取缓存统计失败',
        error: error.message
      })
    }
  }

  /**
   * 清除指定类型的缓存
   */
  async clearCache(req, res) {
    try {
      const { type } = req.params
      const validTypes = ['search', 'suggestion', 'filter', 'all']
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: '无效的缓存类型',
          validTypes
        })
      }
      
      if (type === 'all') {
        await searchCache.clear()
      } else {
        await searchCache.clearType(type)
      }
      
      res.json({
        success: true,
        message: `${type === 'all' ? '所有' : type}缓存已清除`
      })
    } catch (error) {
      console.error('清除缓存失败:', error)
      res.status(500).json({
        success: false,
        message: '清除缓存失败',
        error: error.message
      })
    }
  }

  /**
   * 预热缓存
   */
  async warmupCache(req, res) {
    try {
      await searchCache.warmup()
      
      res.json({
        success: true,
        message: '缓存预热完成'
      })
    } catch (error) {
      console.error('缓存预热失败:', error)
      res.status(500).json({
        success: false,
        message: '缓存预热失败',
        error: error.message
      })
    }
  }

  /**
   * 手动失效缓存
   */
  async invalidateCache(req, res) {
    try {
      const { entity, action = 'update' } = req.body
      const validEntities = ['resource', 'post', 'category', 'tag']
      
      if (!validEntities.includes(entity)) {
        return res.status(400).json({
          success: false,
          message: '无效的实体类型',
          validEntities
        })
      }
      
      await searchCache.invalidate(entity, action)
      
      res.json({
        success: true,
        message: `${entity} 相关缓存已失效`
      })
    } catch (error) {
      console.error('缓存失效操作失败:', error)
      res.status(500).json({
        success: false,
        message: '缓存失效操作失败',
        error: error.message
      })
    }
  }
}

module.exports = new CacheController()