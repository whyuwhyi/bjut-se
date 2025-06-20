// 用户管理云函数
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
      case 'register':
        return await register(data, wxContext)
      case 'login':
        return await login(data, wxContext)
      case 'getUserInfo':
        return await getUserInfo(data, wxContext)
      case 'updateProfile':
        return await updateProfile(data, wxContext)
      case 'uploadAvatar':
        return await uploadAvatar(data, wxContext)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('用户云函数错误:', error)
    return {
      success: false,
      message: '服务器错误'
    }
  }
}

// 用户注册
async function register(data, wxContext) {
  const { studentId, realName, email, password, role, college, major, grade } = data
  
  // 检查学号是否已存在
  const existingUser = await db.collection('users').where({
    studentId: studentId
  }).get()
  
  if (existingUser.data.length > 0) {
    return {
      success: false,
      message: '学号已被注册'
    }
  }
  
  // 创建用户
  const userData = {
    studentId,
    realName,
    email,
    password, // 实际应该加密存储
    role: role || 'student',
    college,
    major,
    grade,
    openid: wxContext.OPENID,
    avatar: '',
    status: 'active',
    createTime: new Date(),
    lastLogin: new Date(),
    loginCount: 1
  }
  
  const result = await db.collection('users').add({
    data: userData
  })
  
  if (result._id) {
    return {
      success: true,
      message: '注册成功',
      userId: result._id
    }
  } else {
    return {
      success: false,
      message: '注册失败'
    }
  }
}

// 用户登录
async function login(data, wxContext) {
  const { username, password } = data
  
  // 查找用户
  const userResult = await db.collection('users').where({
    studentId: username
  }).get()
  
  if (userResult.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const user = userResult.data[0]
  
  // 验证密码（实际应该比较加密后的密码）
  if (user.password !== password) {
    return {
      success: false,
      message: '密码错误'
    }
  }
  
  // 更新登录信息
  await db.collection('users').doc(user._id).update({
    data: {
      lastLogin: new Date(),
      loginCount: _.inc(1)
    }
  })
  
  // 返回用户信息（不包括密码）
  delete user.password
  
  return {
    success: true,
    message: '登录成功',
    userInfo: user,
    token: generateToken(user._id) // 实际应该生成JWT token
  }
}

// 获取用户信息
async function getUserInfo(data, wxContext) {
  const { userId } = data
  
  const userResult = await db.collection('users').doc(userId).get()
  
  if (userResult.data) {
    delete userResult.data.password
    return {
      success: true,
      userInfo: userResult.data
    }
  } else {
    return {
      success: false,
      message: '用户不存在'
    }
  }
}

// 更新用户资料
async function updateProfile(data, wxContext) {
  const { userId, updateData } = data
  
  // 不允许更新敏感字段
  delete updateData.password
  delete updateData.openid
  delete updateData.createTime
  
  updateData.updateTime = new Date()
  
  const result = await db.collection('users').doc(userId).update({
    data: updateData
  })
  
  return {
    success: true,
    message: '更新成功'
  }
}

// 上传头像
async function uploadAvatar(data, wxContext) {
  const { userId, avatarUrl } = data
  
  const result = await db.collection('users').doc(userId).update({
    data: {
      avatar: avatarUrl,
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '头像更新成功',
    avatarUrl: avatarUrl
  }
}

// 生成token（简化版）
function generateToken(userId) {
  return `token_${userId}_${Date.now()}`
}