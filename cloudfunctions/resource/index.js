// 资源管理云函数
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
      case 'uploadResource':
        return await uploadResource(data, wxContext)
      case 'getResourceList':
        return await getResourceList(data, wxContext)
      case 'getResourceDetail':
        return await getResourceDetail(data, wxContext)
      case 'downloadResource':
        return await downloadResource(data, wxContext)
      case 'toggleFavorite':
        return await toggleFavorite(data, wxContext)
      case 'rateResource':
        return await rateResource(data, wxContext)
      case 'searchResources':
        return await searchResources(data, wxContext)
      case 'getUserResources':
        return await getUserResources(data, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('资源云函数错误:', error)
    return {
      success: false,
      message: '服务器错误'
    }
  }
}

// 上传资源
async function uploadResource(data, wxContext) {
  const { 
    title, 
    description, 
    category, 
    courseId, 
    difficulty, 
    tags, 
    shareScope,
    fileName,
    fileSize,
    fileType,
    fileUrl,
    uploaderId 
  } = data
  
  const resourceData = {
    title,
    description,
    category,
    courseId: courseId || '',
    difficulty: difficulty || '',
    tags: tags || [],
    shareScope: shareScope || 'public',
    fileName,
    fileSize,
    fileType,
    fileUrl,
    uploaderId,
    uploaderName: '', // 需要从用户表获取
    downloadCount: 0,
    viewCount: 0,
    rating: 0,
    ratingCount: 0,
    status: 'approved', // 教师上传直接通过，学生需要审核
    uploadTime: new Date(),
    updateTime: new Date()
  }
  
  // 获取上传者信息
  const userResult = await db.collection('users').doc(uploaderId).get()
  if (userResult.data) {
    resourceData.uploaderName = userResult.data.realName || userResult.data.username
    if (userResult.data.role === 'student') {
      resourceData.status = 'pending' // 学生上传需要审核
    }
  }
  
  const result = await db.collection('resources').add({
    data: resourceData
  })
  
  if (result._id) {
    return {
      success: true,
      message: '上传成功',
      resourceId: result._id
    }
  } else {
    return {
      success: false,
      message: '上传失败'
    }
  }
}

// 获取资源列表
async function getResourceList(data, wxContext) {
  const { 
    page = 1, 
    pageSize = 10, 
    category = 'all', 
    sort = 'time',
    keyword = '',
    fileTypes = [],
    difficulties = []
  } = data
  
  let query = db.collection('resources').where({
    status: 'approved'
  })
  
  // 分类筛选
  if (category !== 'all') {
    query = query.where({
      category: category
    })
  }
  
  // 文件类型筛选
  if (fileTypes.length > 0) {
    query = query.where({
      fileType: _.in(fileTypes)
    })
  }
  
  // 难度筛选
  if (difficulties.length > 0) {
    query = query.where({
      difficulty: _.in(difficulties)
    })
  }
  
  // 关键词搜索
  if (keyword) {
    query = query.where({
      title: new RegExp(keyword, 'i')
    })
  }
  
  // 排序
  let orderBy = 'uploadTime'
  let order = 'desc'
  
  if (sort === 'download') {
    orderBy = 'downloadCount'
  } else if (sort === 'rating') {
    orderBy = 'rating'
  }
  
  const result = await query
    .orderBy(orderBy, order)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取资源详情
async function getResourceDetail(data, wxContext) {
  const { resourceId, userId } = data
  
  const resourceResult = await db.collection('resources').doc(resourceId).get()
  
  if (!resourceResult.data) {
    return {
      success: false,
      message: '资源不存在'
    }
  }
  
  // 增加浏览次数
  await db.collection('resources').doc(resourceId).update({
    data: {
      viewCount: _.inc(1)
    }
  })
  
  // 检查是否已收藏
  let isFavorite = false
  if (userId) {
    const favoriteResult = await db.collection('favorites').where({
      userId: userId,
      resourceId: resourceId
    }).get()
    isFavorite = favoriteResult.data.length > 0
  }
  
  const resource = resourceResult.data
  resource.isFavorite = isFavorite
  
  return {
    success: true,
    data: resource
  }
}

// 下载资源
async function downloadResource(data, wxContext) {
  const { resourceId, userId } = data
  
  // 增加下载次数
  await db.collection('resources').doc(resourceId).update({
    data: {
      downloadCount: _.inc(1)
    }
  })
  
  // 记录下载历史
  await db.collection('download_history').add({
    data: {
      userId: userId,
      resourceId: resourceId,
      downloadTime: new Date()
    }
  })
  
  // 获取下载链接
  const resourceResult = await db.collection('resources').doc(resourceId).get()
  
  return {
    success: true,
    downloadUrl: resourceResult.data.fileUrl
  }
}

// 切换收藏状态
async function toggleFavorite(data, wxContext) {
  const { resourceId, userId } = data
  
  const existingFavorite = await db.collection('favorites').where({
    userId: userId,
    resourceId: resourceId
  }).get()
  
  if (existingFavorite.data.length > 0) {
    // 取消收藏
    await db.collection('favorites').doc(existingFavorite.data[0]._id).remove()
    return {
      success: true,
      isFavorite: false,
      message: '已取消收藏'
    }
  } else {
    // 添加收藏
    await db.collection('favorites').add({
      data: {
        userId: userId,
        resourceId: resourceId,
        createTime: new Date()
      }
    })
    return {
      success: true,
      isFavorite: true,
      message: '已收藏'
    }
  }
}

// 评分资源
async function rateResource(data, wxContext) {
  const { resourceId, userId, rating } = data
  
  // 检查是否已评分
  const existingRating = await db.collection('ratings').where({
    userId: userId,
    resourceId: resourceId
  }).get()
  
  if (existingRating.data.length > 0) {
    // 更新评分
    await db.collection('ratings').doc(existingRating.data[0]._id).update({
      data: {
        rating: rating,
        updateTime: new Date()
      }
    })
  } else {
    // 添加评分
    await db.collection('ratings').add({
      data: {
        userId: userId,
        resourceId: resourceId,
        rating: rating,
        createTime: new Date()
      }
    })
  }
  
  // 更新资源平均评分
  const ratingsResult = await db.collection('ratings').where({
    resourceId: resourceId
  }).get()
  
  const totalRating = ratingsResult.data.reduce((sum, item) => sum + item.rating, 0)
  const avgRating = totalRating / ratingsResult.data.length
  
  await db.collection('resources').doc(resourceId).update({
    data: {
      rating: avgRating,
      ratingCount: ratingsResult.data.length
    }
  })
  
  return {
    success: true,
    message: '评分成功',
    avgRating: avgRating
  }
}

// 搜索资源
async function searchResources(data, wxContext) {
  const { keyword, page = 1, pageSize = 10 } = data
  
  const result = await db.collection('resources')
    .where({
      status: 'approved',
      title: new RegExp(keyword, 'i')
    })
    .orderBy('uploadTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取用户上传的资源
async function getUserResources(data, wxContext) {
  const { userId, page = 1, pageSize = 10 } = data
  
  const result = await db.collection('resources')
    .where({
      uploaderId: userId
    })
    .orderBy('uploadTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    success: true,
    data: result.data
  }
}