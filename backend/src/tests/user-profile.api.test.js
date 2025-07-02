const request = require('supertest')
const app = require('../app')
const { User } = require('../models')

describe('User Profile API Tests', () => {
  let testUser1, testUser2, authToken

  beforeEach(async () => {
    // 创建测试用户1
    testUser1 = await User.create({
      phone_number: '13800138001',
      name: '测试用户1',
      nickname: '昵称1',
      password: 'hashedpassword123',
      email: 'test1@example.com',
      student_id: '20230001',
      bio: '这是测试用户1的个人简介',
      avatar_url: '/uploads/avatars/user1.jpg',
      status: 'active',
      post_count: 5,
      resource_count: 3,
      follower_count: 10,
      following_count: 8
    })

    // 创建测试用户2
    testUser2 = await User.create({
      phone_number: '13800138002',
      name: '测试用户2',
      nickname: '昵称2',
      password: 'hashedpassword123',
      email: 'test2@example.com',
      student_id: 'S202300002',
      bio: '这是测试用户2的个人简介',
      avatar_url: '/uploads/avatars/user2.jpg',
      status: 'active',
      post_count: 3,
      resource_count: 7,
      follower_count: 5,
      following_count: 12
    })

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/v1/users/login')
      .send({
        phone_number: '13800138001',
        password: 'hashedpassword123'
      })
    
    authToken = loginResponse.body.data.token
  })

  afterEach(async () => {
    // 清理测试数据
    await User.destroy({ where: { phone_number: ['13800138001', '13800138002'] } })
  })

  describe('GET /api/v1/users/:phone/profile', () => {
    test('应该能够获取其他用户的公开信息（未登录）', async () => {
      const response = await request(app)
        .get('/api/v1/users/13800138002/profile')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        phone_number: '13800138002',
        name: '测试用户2',
        nickname: '昵称2',
        bio: '这是测试用户2的个人简介',
        avatar_url: '/uploads/avatars/user2.jpg',
        post_count: 3,
        resource_count: 7,
        follower_count: 5,
        following_count: 12
      })
      
      // 不应该包含私密信息
      expect(response.body.data.user.email).toBeUndefined()
      expect(response.body.data.user.student_id).toBeUndefined()
      expect(response.body.data.isFollowing).toBe(false)
    })

    test('应该能够获取其他用户的公开信息（已登录）', async () => {
      const response = await request(app)
        .get('/api/v1/users/13800138002/profile')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        phone_number: '13800138002',
        name: '测试用户2',
        nickname: '昵称2',
        bio: '这是测试用户2的个人简介'
      })
      
      // 应该包含关注状态
      expect(response.body.data.isFollowing).toBe(false)
      
      // 不应该包含私密信息
      expect(response.body.data.user.email).toBeUndefined()
      expect(response.body.data.user.student_id).toBeUndefined()
    })

    test('用户查看自己的信息应该包含私密字段', async () => {
      const response = await request(app)
        .get('/api/v1/users/13800138001/profile')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        phone_number: '13800138001',
        name: '测试用户1',
        email: 'test1@example.com',
        student_id: '20230001'
      })
    })

    test('查询不存在的用户应该返回404', async () => {
      const response = await request(app)
        .get('/api/v1/users/99999999999/profile')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('用户不存在')
    })

    test('查询被禁用用户应该返回404', async () => {
      // 禁用用户2
      await testUser2.update({ status: 'banned' })

      const response = await request(app)
        .get('/api/v1/users/13800138002/profile')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('用户不存在')
    })
  })
})