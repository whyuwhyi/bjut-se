const { Op } = require('sequelize')

/**
 * 智能搜索工具类
 * 支持多字段加权搜索、模糊匹配、相关性评分、拼音搜索、同义词匹配
 */
class SearchHelper {
  constructor() {
    // 搜索字段权重配置
    this.resourceWeights = {
      resource_name: 3.0,     // 资源名称权重最高
      description: 1.5,       // 描述权重中等  
      category_name: 2.0,     // 分类名称权重较高
      publisher_name: 1.0     // 发布者名称权重较低
    }
    
    this.postWeights = {
      title: 3.0,             // 帖子标题权重最高
      content: 1.5,           // 内容权重中等
      tag_name: 2.5,          // 标签权重较高
      author_name: 1.0        // 作者名称权重较低
    }

    // 同义词映射表
    this.synonyms = {
      '算法': ['algorithm', '算法题', '算法设计', '数据结构'],
      '编程': ['programming', '代码', 'coding', '开发', '程序设计'],
      '数据库': ['database', 'db', 'mysql', 'sql', '数据存储'],
      '前端': ['frontend', 'web前端', 'html', 'css', 'javascript', 'react', 'vue'],
      '后端': ['backend', '服务端', 'server', 'api', 'nodejs', 'java', 'python'],
      '机器学习': ['ml', 'machine learning', 'ai', '人工智能', '深度学习'],
      '网络': ['network', '计算机网络', '网络协议', 'tcp', 'http'],
      '操作系统': ['os', 'operating system', 'linux', 'windows', '系统编程']
    }

    // 常见拼写错误映射
    this.typoCorrections = {
      'algorthm': 'algorithm',
      'programing': 'programming',
      'databse': 'database',
      'javascirpt': 'javascript',
      'machien': 'machine'
    }

    // 缓存已计算的相似度
    this.similarityCache = new Map()
  }

  /**
   * 构建资源搜索条件
   * @param {string} searchTerm 搜索关键词
   * @param {Object} options 搜索选项
   * @returns {Object} Sequelize查询条件对象
   */
  buildResourceSearchCondition(searchTerm, options = {}) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return {}
    }

    const keywords = this.extractKeywords(searchTerm)
    console.log('资源搜索关键词:', keywords)
    const searchConditions = []
    
    // 为每个关键词构建搜索条件
    keywords.forEach(keyword => {
      const keywordConditions = []
      
      // 资源名称搜索（精确匹配和模糊匹配）
      keywordConditions.push({
        resource_name: { [Op.like]: `%${keyword}%` }
      })
      
      // 描述搜索
      keywordConditions.push({
        description: { [Op.like]: `%${keyword}%` }
      })

      // 如果启用了关联搜索，添加分类和发布者搜索
      if (options.includeRelated !== false) {
        // 通过include在查询中处理关联表搜索
        keywordConditions.push({
          '$category.category_name$': { [Op.like]: `%${keyword}%` }
        })
        
        keywordConditions.push({
          '$publisher.nickname$': { [Op.like]: `%${keyword}%` }
        })
        
        keywordConditions.push({
          '$publisher.name$': { [Op.like]: `%${keyword}%` }
        })
      }

      searchConditions.push({
        [Op.or]: keywordConditions
      })
    })

    if (searchConditions.length === 0) {
      console.log('资源搜索条件为空')
      return {}
    }
    
    const result = searchConditions.length > 1 
      ? { [Op.and]: searchConditions }
      : searchConditions[0]
    
    console.log('资源搜索条件:', JSON.stringify(result, null, 2))
    return result
  }

  /**
   * 构建帖子搜索条件
   * @param {string} searchTerm 搜索关键词
   * @param {Object} options 搜索选项
   * @returns {Object} Sequelize查询条件对象
   */
  buildPostSearchCondition(searchTerm, options = {}) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return {}
    }

    const keywords = this.extractKeywords(searchTerm)
    console.log('帖子搜索关键词:', keywords)
    const searchConditions = []
    
    keywords.forEach(keyword => {
      const keywordConditions = []
      
      // 帖子标题搜索
      keywordConditions.push({
        title: { [Op.like]: `%${keyword}%` }
      })
      
      // 帖子内容搜索
      keywordConditions.push({
        content: { [Op.like]: `%${keyword}%` }
      })

      // 如果启用了关联搜索，添加标签和作者搜索
      if (options.includeRelated !== false) {
        // 标签搜索
        keywordConditions.push({
          '$tags.tag_name$': { [Op.like]: `%${keyword}%` }
        })
        
        // 作者搜索
        keywordConditions.push({
          '$author.nickname$': { [Op.like]: `%${keyword}%` }
        })
        
        keywordConditions.push({
          '$author.name$': { [Op.like]: `%${keyword}%` }
        })
      }

      searchConditions.push({
        [Op.or]: keywordConditions
      })
    })

    if (searchConditions.length === 0) {
      console.log('帖子搜索条件为空')
      return {}
    }
    
    const result = searchConditions.length > 1 
      ? { [Op.and]: searchConditions }
      : searchConditions[0]
    
    console.log('帖子搜索条件:', JSON.stringify(result, null, 2))
    return result
  }

  /**
   * 构建帖子关联搜索条件（用于标签和作者搜索）
   * @param {string} searchTerm 搜索词
   * @returns {Object} 关联搜索条件
   */
  buildPostRelatedSearchCondition(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return {}
    }
    
    const keywords = this.extractKeywords(searchTerm)
    const searchConditions = []

    keywords.forEach(keyword => {
      const keywordConditions = [
        // 标签搜索
        { '$tags.tag_name$': { [Op.like]: `%${keyword}%` } },
        // 作者搜索
        { '$author.nickname$': { [Op.like]: `%${keyword}%` } },
        { '$author.name$': { [Op.like]: `%${keyword}%` } }
      ]

      searchConditions.push({
        [Op.or]: keywordConditions
      })
    })

    if (searchConditions.length === 0) {
      return {}
    }
    
    return searchConditions.length > 1 
      ? { [Op.and]: searchConditions }
      : searchConditions[0]
  }

  /**
   * 提取搜索关键词（增强版）
   * @param {string} searchTerm 原始搜索词
   * @returns {Array} 关键词数组
   */
  extractKeywords(searchTerm) {
    if (!searchTerm) return []
    
    // 清理搜索词：去除多余空格，转换为小写
    const cleaned = searchTerm.trim().toLowerCase()
    
    // 按空格分割关键词，过滤空字符串
    let keywords = cleaned.split(/\s+/).filter(word => word.length > 0)
    
    // 拼写纠错
    keywords = keywords.map(word => this.typoCorrections[word] || word)
    
    // 暂时禁用同义词扩展，只使用原始关键词
    // TODO: 可以在后续版本中重新启用更精确的同义词匹配
    /*
    // 扩展同义词
    const expandedKeywords = [...keywords]
    keywords.forEach(keyword => {
      const synonymList = this.findSynonyms(keyword)
      expandedKeywords.push(...synonymList)
    })
    
    // 去重并限制关键词数量（防止过于复杂的查询）
    return [...new Set(expandedKeywords)].slice(0, 15)
    */
    
    // 返回原始关键词
    return keywords.slice(0, 10) // 限制关键词数量
  }

  /**
   * 查找同义词
   * @param {string} word 单词
   * @returns {Array} 同义词数组
   */
  findSynonyms(word) {
    const synonyms = []
    
    // 直接查找
    if (this.synonyms[word]) {
      synonyms.push(...this.synonyms[word])
    }
    
    // 反向查找
    for (const [key, values] of Object.entries(this.synonyms)) {
      if (values.includes(word) && key !== word) {
        synonyms.push(key)
        // 添加同组的其他同义词
        synonyms.push(...values.filter(v => v !== word))
      }
    }
    
    return [...new Set(synonyms)]
  }

  /**
   * 计算字符串相似度（Levenshtein距离）
   * @param {string} str1 字符串1
   * @param {string} str2 字符串2
   * @returns {number} 相似度 (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0
    
    const cacheKey = `${str1}_${str2}`
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey)
    }
    
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0) return len2 === 0 ? 1 : 0
    if (len2 === 0) return 0
    
    // 创建距离矩阵
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0))
    
    // 初始化矩阵
    for (let i = 0; i <= len1; i++) matrix[i][0] = i
    for (let j = 0; j <= len2; j++) matrix[0][j] = j
    
    // 填充矩阵
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,        // 删除
          matrix[i][j - 1] + 1,        // 插入
          matrix[i - 1][j - 1] + cost  // 替换
        )
      }
    }
    
    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)
    const similarity = 1 - (distance / maxLen)
    
    this.similarityCache.set(cacheKey, similarity)
    return similarity
  }

  /**
   * 模糊匹配增强
   * @param {string} text 待匹配文本
   * @param {string} keyword 关键词
   * @returns {Object} 匹配结果 {isMatch, score, matchType}
   */
  fuzzyMatch(text, keyword) {
    if (!text || !keyword) return { isMatch: false, score: 0, matchType: 'none' }
    
    const lowerText = text.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    
    // 1. 完全匹配
    if (lowerText === lowerKeyword) {
      return { isMatch: true, score: 1.0, matchType: 'exact' }
    }
    
    // 2. 包含匹配
    if (lowerText.includes(lowerKeyword)) {
      const score = lowerKeyword.length / lowerText.length
      return { isMatch: true, score: score * 0.9, matchType: 'contains' }
    }
    
    // 3. 开头匹配
    if (lowerText.startsWith(lowerKeyword)) {
      const score = lowerKeyword.length / lowerText.length
      return { isMatch: true, score: score * 0.8, matchType: 'prefix' }
    }
    
    // 4. 相似度匹配
    const similarity = this.calculateSimilarity(lowerText, lowerKeyword)
    if (similarity >= 0.7) {
      return { isMatch: true, score: similarity * 0.6, matchType: 'similar' }
    }
    
    // 5. 部分词匹配（对于较长的文本）
    if (lowerText.length > 10) {
      const words = lowerText.split(/\s+/)
      for (const word of words) {
        const wordSimilarity = this.calculateSimilarity(word, lowerKeyword)
        if (wordSimilarity >= 0.8) {
          return { isMatch: true, score: wordSimilarity * 0.5, matchType: 'partial' }
        }
      }
    }
    
    return { isMatch: false, score: 0, matchType: 'none' }
  }

  /**
   * 构建高级筛选条件
   * @param {Object} filters 筛选条件
   * @returns {Object} Sequelize查询条件对象
   */
  buildAdvancedFilters(filters = {}) {
    const conditions = {}
    
    // 分类筛选（支持多分类）
    if (filters.categories) {
      const categoryList = Array.isArray(filters.categories) 
        ? filters.categories 
        : filters.categories.split(',').filter(c => c.trim())
      
      if (categoryList.length > 0) {
        conditions.category_id = { [Op.in]: categoryList }
      }
    }
    
    // 状态筛选
    if (filters.status) {
      const statusList = Array.isArray(filters.status)
        ? filters.status
        : [filters.status]
      conditions.status = { [Op.in]: statusList }
    }
    
    // 时间范围筛选
    if (filters.dateFrom || filters.dateTo) {
      const dateConditions = {}
      if (filters.dateFrom) {
        dateConditions[Op.gte] = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo)
        dateTo.setHours(23, 59, 59, 999) // 设置为当天结束时间
        dateConditions[Op.lte] = dateTo
      }
      conditions.created_at = dateConditions
    }
    
    // 评分范围筛选
    if (filters.minRating || filters.maxRating) {
      const ratingConditions = {}
      if (filters.minRating) {
        ratingConditions[Op.gte] = parseFloat(filters.minRating)
      }
      if (filters.maxRating) {
        ratingConditions[Op.lte] = parseFloat(filters.maxRating)
      }
      conditions.rating = ratingConditions
    }
    
    // 浏览量范围筛选
    if (filters.minViews || filters.maxViews) {
      const viewConditions = {}
      if (filters.minViews) {
        viewConditions[Op.gte] = parseInt(filters.minViews)
      }
      if (filters.maxViews) {
        viewConditions[Op.lte] = parseInt(filters.maxViews)
      }
      conditions.view_count = viewConditions
    }

    return conditions
  }

  /**
   * 构建帖子标签筛选条件
   * @param {string|Array} tags 标签名称或数组
   * @param {string} logic 逻辑关系：'AND' 或 'OR'
   * @returns {Object} 筛选条件
   */
  buildTagFilters(tags, logic = 'OR') {
    if (!tags) return {}
    
    const tagList = Array.isArray(tags) 
      ? tags 
      : tags.split(',').map(t => t.trim()).filter(t => t)
    
    if (tagList.length === 0) return {}
    
    if (logic === 'AND') {
      // AND逻辑：帖子必须包含所有指定标签
      return {
        '$tags.tag_name$': { [Op.in]: tagList }
      }
    } else {
      // OR逻辑：帖子包含任一指定标签
      return {
        '$tags.tag_name$': { [Op.in]: tagList }
      }
    }
  }

  /**
   * 构建智能排序条件
   * @param {string} sortBy 排序字段
   * @param {string} sortOrder 排序方向
   * @param {string} searchTerm 搜索词（用于相关性排序）
   * @returns {Array} Sequelize排序条件数组
   */
  buildSortCondition(sortBy = 'relevance', sortOrder = 'DESC', searchTerm = '') {
    const order = []
    
    switch (sortBy) {
      case 'relevance':
        // 相关性排序：有搜索词时按相关性，无搜索词时按时间
        if (searchTerm) {
          // 简化的相关性排序：按照匹配字段的权重排序
          // 这里可以根据需要实现更复杂的相关性算法
          order.push(['created_at', 'DESC'])
        } else {
          order.push(['created_at', 'DESC'])
        }
        break
      case 'latest':
        order.push(['created_at', sortOrder])
        break
      case 'oldest':
        order.push(['created_at', 'ASC'])
        break
      case 'download':
        order.push(['download_count', sortOrder])
        break
      case 'view':
        order.push(['view_count', sortOrder])
        break
      case 'rating':
        order.push(['rating', sortOrder])
        break
      case 'collection':
        order.push(['collection_count', sortOrder])
        break
      case 'comment':
        order.push(['comment_count', sortOrder])
        break
      case 'name':
        order.push(['resource_name', sortOrder])
        break
      case 'title':
        order.push(['title', sortOrder])
        break
      default:
        order.push(['created_at', 'DESC'])
        break
    }
    
    return order
  }

  /**
   * 计算搜索结果相关性评分（增强版）
   * @param {Object} item 搜索结果项
   * @param {string} searchTerm 搜索词
   * @param {string} type 类型：'resource' 或 'post'
   * @returns {number} 相关性评分
   */
  calculateRelevanceScore(item, searchTerm, type = 'resource') {
    if (!searchTerm) return 0
    
    const originalKeywords = searchTerm.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0)
    const weights = type === 'resource' ? this.resourceWeights : this.postWeights
    let totalScore = 0
    let maxFieldScore = 0
    
    // 为每个原始关键词计算匹配分数
    originalKeywords.forEach(keyword => {
      let keywordScore = 0
      
      if (type === 'resource') {
        // 资源相关性评分 - 使用模糊匹配
        if (item.resource_name) {
          const match = this.fuzzyMatch(item.resource_name, keyword)
          if (match.isMatch) {
            const fieldScore = weights.resource_name * match.score
            keywordScore += fieldScore
            maxFieldScore = Math.max(maxFieldScore, fieldScore)
          }
        }
        
        if (item.description) {
          const match = this.fuzzyMatch(item.description, keyword)
          if (match.isMatch) {
            keywordScore += weights.description * match.score
          }
        }
        
        if (item.category_name) {
          const match = this.fuzzyMatch(item.category_name, keyword)
          if (match.isMatch) {
            keywordScore += weights.category_name * match.score
          }
        }
        
        if (item.publisher_name) {
          const match = this.fuzzyMatch(item.publisher_name, keyword)
          if (match.isMatch) {
            keywordScore += weights.publisher_name * match.score
          }
        }
      } else {
        // 帖子相关性评分 - 使用模糊匹配
        if (item.title) {
          const match = this.fuzzyMatch(item.title, keyword)
          if (match.isMatch) {
            const fieldScore = weights.title * match.score
            keywordScore += fieldScore
            maxFieldScore = Math.max(maxFieldScore, fieldScore)
          }
        }
        
        if (item.content) {
          const match = this.fuzzyMatch(item.content, keyword)
          if (match.isMatch) {
            keywordScore += weights.content * match.score
          }
        }
        
        if (item.tags && item.tags.length > 0) {
          let bestTagMatch = 0
          item.tags.forEach(tag => {
            const match = this.fuzzyMatch(tag.tag_name, keyword)
            if (match.isMatch) {
              bestTagMatch = Math.max(bestTagMatch, match.score)
            }
          })
          if (bestTagMatch > 0) {
            keywordScore += weights.tag_name * bestTagMatch
          }
        }
        
        if (item.author_name) {
          const match = this.fuzzyMatch(item.author_name, keyword)
          if (match.isMatch) {
            keywordScore += weights.author_name * match.score
          }
        }
      }
      
      totalScore += keywordScore
    })
    
    // 多关键词匹配奖励
    const keywordCoverage = originalKeywords.length > 1 ? 
      this.calculateKeywordCoverage(item, originalKeywords, type) : 1
    
    // 标题/名称完全匹配奖励
    const exactMatchBonus = this.calculateExactMatchBonus(item, searchTerm, type)
    
    // 热度指标调整评分
    const popularityBoost = this.calculatePopularityBoost(item, type)
    
    // 时效性评分（越新的内容评分越高）
    const freshnessBoost = this.calculateFreshnessBoost(item)
    
    // 综合评分
    const finalScore = (totalScore * keywordCoverage + exactMatchBonus + popularityBoost + freshnessBoost)
    
    return Math.max(0, finalScore)
  }

  /**
   * 计算关键词覆盖率
   * @param {Object} item 项目数据
   * @param {Array} keywords 关键词数组
   * @param {string} type 类型
   * @returns {number} 覆盖率加成 (1.0-2.0)
   */
  calculateKeywordCoverage(item, keywords, type) {
    let matchedKeywords = 0
    
    keywords.forEach(keyword => {
      let hasMatch = false
      
      if (type === 'resource') {
        hasMatch = [item.resource_name, item.description, item.category_name, item.publisher_name]
          .some(field => field && this.fuzzyMatch(field, keyword).isMatch)
      } else {
        hasMatch = [item.title, item.content, item.author_name]
          .some(field => field && this.fuzzyMatch(field, keyword).isMatch) ||
          (item.tags && item.tags.some(tag => this.fuzzyMatch(tag.tag_name, keyword).isMatch))
      }
      
      if (hasMatch) matchedKeywords++
    })
    
    const coverage = matchedKeywords / keywords.length
    return 1 + coverage * 0.5 // 最多50%的加成
  }

  /**
   * 计算精确匹配奖励
   * @param {Object} item 项目数据
   * @param {string} searchTerm 搜索词
   * @param {string} type 类型
   * @returns {number} 精确匹配奖励分数
   */
  calculateExactMatchBonus(item, searchTerm, type) {
    const cleanTerm = searchTerm.trim().toLowerCase()
    let bonus = 0
    
    if (type === 'resource') {
      if (item.resource_name && item.resource_name.toLowerCase() === cleanTerm) {
        bonus += 2.0
      }
      if (item.category_name && item.category_name.toLowerCase() === cleanTerm) {
        bonus += 1.0
      }
    } else {
      if (item.title && item.title.toLowerCase() === cleanTerm) {
        bonus += 2.0
      }
      if (item.tags && item.tags.some(tag => tag.tag_name.toLowerCase() === cleanTerm)) {
        bonus += 1.5
      }
    }
    
    return bonus
  }

  /**
   * 计算时效性加成
   * @param {Object} item 项目数据
   * @returns {number} 时效性加成分数
   */
  calculateFreshnessBoost(item) {
    if (!item.created_at && !item.upload_time && !item.uploadTime) return 0
    
    const createdAt = new Date(item.created_at || item.upload_time || item.uploadTime)
    const now = new Date()
    const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24)
    
    if (daysDiff < 7) return 0.3        // 一周内
    if (daysDiff < 30) return 0.2       // 一月内
    if (daysDiff < 90) return 0.1       // 三月内
    return 0
  }

  /**
   * 计算热度加成
   * @param {Object} item 项目数据
   * @param {string} type 类型
   * @returns {number} 热度加成分数
   */
  calculatePopularityBoost(item, type) {
    let boost = 0
    
    // 浏览量加成
    if (item.view_count) {
      boost += Math.log10(item.view_count + 1) * 0.1
    }
    
    // 收藏数加成
    if (item.collection_count) {
      boost += Math.log10(item.collection_count + 1) * 0.2
    }
    
    if (type === 'resource') {
      // 下载量加成
      if (item.download_count) {
        boost += Math.log10(item.download_count + 1) * 0.3
      }
      
      // 评分加成
      if (item.rating) {
        boost += (item.rating / 5) * 0.2
      }
    } else {
      // 评论数加成
      if (item.comment_count) {
        boost += Math.log10(item.comment_count + 1) * 0.2
      }
    }
    
    return boost
  }

  /**
   * 高亮搜索关键词
   * @param {string} text 原始文本
   * @param {string} searchTerm 搜索词
   * @param {string} highlightTag 高亮标签
   * @returns {string} 高亮后的文本
   */
  highlightKeywords(text, searchTerm, highlightTag = 'mark') {
    if (!text || !searchTerm) return text
    
    const keywords = this.extractKeywords(searchTerm)
    let highlightedText = text
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi')
      highlightedText = highlightedText.replace(
        regex, 
        `<${highlightTag}>$1</${highlightTag}>`
      )
    })
    
    return highlightedText
  }

  /**
   * 生成搜索建议
   * @param {string} searchTerm 搜索词
   * @param {Array} searchHistory 搜索历史
   * @param {Array} hotKeywords 热门关键词
   * @returns {Array} 搜索建议列表
   */
  generateSearchSuggestions(searchTerm, searchHistory = [], hotKeywords = []) {
    const suggestions = []
    
    if (!searchTerm) {
      // 无搜索词时返回热门关键词和搜索历史
      return [
        ...hotKeywords.slice(0, 5),
        ...searchHistory.slice(0, 3)
      ]
    }
    
    const lowerSearch = searchTerm.toLowerCase()
    
    // 从热门关键词中查找匹配项
    hotKeywords.forEach(keyword => {
      if (keyword.toLowerCase().includes(lowerSearch)) {
        suggestions.push(keyword)
      }
    })
    
    // 从搜索历史中查找匹配项
    searchHistory.forEach(term => {
      if (term.toLowerCase().includes(lowerSearch) && !suggestions.includes(term)) {
        suggestions.push(term)
      }
    })
    
    return suggestions.slice(0, 8)
  }
}

module.exports = new SearchHelper()