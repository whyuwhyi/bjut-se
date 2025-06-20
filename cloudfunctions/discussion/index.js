// 讨论管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  
  try {
    switch (action) {
      case 'createPost':
        return await createPost(data, wxContext)
      case 'getDiscussionList':
        return await getDiscussionList(data, wxContext)
      case 'getDiscussionDetail':
        return await getDiscussionDetail(data, wxContext)
      case 'replyPost':
        return await replyPost(data, wxContext)
      case 'toggleLike':
        return await toggleLike(data, wxContext)
      case 'markResolved':
        return await markResolved(data, wxContext)
      case 'getUserPosts':
        return await getUserPosts(data, wxContext)
      case 'searchDiscussions':
        return await searchDiscussions(data, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('讨论云函数错误:', error)
    return {
      success: false,
      message: '服务器错误'
    }
  }
}

// 创建讨论帖子
async function createPost(data, wxContext) {
  const {
    title,
    content,
    type,
    category,
    courseId,
    tags,
    images,
    isQuestion,
    authorId
  } = data
  
  // 获取作者信息
  const authorResult = await db.collection('users').doc(authorId).get()
  if (!authorResult.data) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const postData = {
    parentId: null, // 主帖的父ID为null
    title: title || '',
    content,
    type: type || 'discussion',
    category: category || 'study',
    courseId: courseId || '',
    tags: tags || [],
    images: images || [],
    isQuestion: isQuestion || false,
    isResolved: false,
    authorId,
    authorName: authorResult.data.realName || authorResult.data.username,
    authorAvatar: authorResult.data.avatar || '',
    likeCount: 0,
    replyCount: 0,
    viewCount: 0,
    status: 'normal',
    createTime: new Date(),
    updateTime: new Date()
  }
  
  const result = await db.collection('discussions').add({
    data: postData
  })
  
  if (result._id) {
    return {
      success: true,
      message: '发布成功',
      postId: result._id
    }
  } else {
    return {
      success: false,
      message: '发布失败'
    }
  }
}

// 获取讨论列表
async function getDiscussionList(data, wxContext) {
  const {
    page = 1,
    pageSize = 10,
    category = 'all',
    sort = 'time',
    keyword = '',
    types = [],
    status = []
  } = data
  
  let query = db.collection('discussions').where({
    parentId: null, // 只查询主帖
    status: 'normal'
  })
  
  // 分类筛选
  if (category !== 'all') {
    query = query.where({
      category: category
    })
  }
  
  // 类型筛选
  if (types.length > 0) {
    query = query.where({
      type: _.in(types)
    })
  }
  
  // 状态筛选
  if (status.length > 0) {
    if (status.includes('resolved')) {
      query = query.where({
        isResolved: true
      })
    }
    if (status.includes('unresolved')) {
      query = query.where({
        isQuestion: true,
        isResolved: false
      })
    }
  }
  
  // 关键词搜索
  if (keyword) {
    query = query.where({
      title: new RegExp(keyword, 'i')
    })
  }
  
  // 排序
  let orderBy = 'createTime'
  let order = 'desc'
  
  if (sort === 'hot') {
    orderBy = 'replyCount'
  } else if (sort === 'featured') {
    // 可以根据点赞数等指标排序
    orderBy = 'likeCount'
  }
  
  const result = await query
    .orderBy(orderBy, order)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 获取每个讨论的最新回复
  for (let discussion of result.data) {
    const latestReplyResult = await db.collection('discussions')
      .where({
        parentId: discussion._id
      })
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    
    if (latestReplyResult.data.length > 0) {
      discussion.latestReply = latestReplyResult.data[0]
    }
  }
  
  return {
    success: true,
    data: result.data
  }
}

// 获取讨论详情
async function getDiscussionDetail(data, wxContext) {
  const { discussionId, userId } = data
  
  const discussionResult = await db.collection('discussions').doc(discussionId).get()
  
  if (!discussionResult.data) {
    return {
      success: false,
      message: '讨论不存在'
    }
  }
  
  // 增加浏览次数
  await db.collection('discussions').doc(discussionId).update({
    data: {
      viewCount: _.inc(1)
    }
  })
  
  // 获取回复列表
  const repliesResult = await db.collection('discussions')
    .where({
      parentId: discussionId
    })
    .orderBy('createTime', 'asc')
    .get()
  
  // 检查是否已点赞
  let isLiked = false
  if (userId) {
    const likeResult = await db.collection('likes').where({
      userId: userId,
      targetId: discussionId,
      targetType: 'discussion'
    }).get()
    isLiked = likeResult.data.length > 0
  }
  
  const discussion = discussionResult.data
  discussion.isLiked = isLiked
  discussion.replies = repliesResult.data
  
  return {
    success: true,
    data: discussion
  }
}

// 回复帖子
async function replyPost(data, wxContext) {
  const {
    parentId,
    content,
    images,
    authorId,
    replyToId // 回复特定回复的ID
  } = data
  
  // 获取作者信息
  const authorResult = await db.collection('users').doc(authorId).get()
  if (!authorResult.data) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const replyData = {
    parentId,
    replyToId: replyToId || null,
    content,
    images: images || [],
    type: 'reply',
    authorId,
    authorName: authorResult.data.realName || authorResult.data.username,
    authorAvatar: authorResult.data.avatar || '',
    likeCount: 0,
    status: 'normal',
    createTime: new Date()
  }
  
  const result = await db.collection('discussions').add({
    data: replyData
  })
  
  if (result._id) {
    // 更新主帖回复数
    await db.collection('discussions').doc(parentId).update({
      data: {
        replyCount: _.inc(1),
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '回复成功',
      replyId: result._id
    }
  } else {
    return {
      success: false,
      message: '回复失败'
    }
  }
}

// 切换点赞状态
async function toggleLike(data, wxContext) {
  const { targetId, targetType, userId } = data
  
  const existingLike = await db.collection('likes').where({
    userId: userId,
    targetId: targetId,
    targetType: targetType
  }).get()
  
  if (existingLike.data.length > 0) {
    // 取消点赞
    await db.collection('likes').doc(existingLike.data[0]._id).remove()
    
    // 减少点赞数
    await db.collection('discussions').doc(targetId).update({
      data: {
        likeCount: _.inc(-1)
      }
    })
    
    return {
      success: true,
      isLiked: false,
      message: '已取消点赞'
    }
  } else {
    // 添加点赞
    await db.collection('likes').add({
      data: {
        userId: userId,
        targetId: targetId,
        targetType: targetType,
        createTime: new Date()
      }
    })
    
    // 增加点赞数
    await db.collection('discussions').doc(targetId).update({
      data: {
        likeCount: _.inc(1)
      }
    })
    
    return {
      success: true,
      isLiked: true,
      message: '已点赞'
    }
  }
}

// 标记问题已解决
async function markResolved(data, wxContext) {
  const { discussionId, userId } = data
  
  // 检查是否为帖子作者
  const discussionResult = await db.collection('discussions').doc(discussionId).get()
  
  if (!discussionResult.data) {
    return {
      success: false,
      message: '讨论不存在'
    }
  }
  
  if (discussionResult.data.authorId !== userId) {
    return {
      success: false,
      message: '只有作者可以标记为已解决'
    }
  }
  
  await db.collection('discussions').doc(discussionId).update({
    data: {
      isResolved: true,
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '已标记为已解决'
  }
}

// 获取用户发布的帖子
async function getUserPosts(data, wxContext) {
  const { userId, page = 1, pageSize = 10 } = data
  
  const result = await db.collection('discussions')
    .where({
      authorId: userId,
      parentId: null // 只查询主帖
    })
    .orderBy('createTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: result.data
  }
}

// 搜索讨论
async function searchDiscussions(data, wxContext) {
  const { keyword, page = 1, pageSize = 10 } = data
  
  const result = await db.collection('discussions')
    .where({
      parentId: null,
      status: 'normal',
      title: new RegExp(keyword, 'i')
    })
    .orderBy('createTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: result.data
  }
}