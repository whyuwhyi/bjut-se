const request = require('supertest')
const app = require('../../app')
const { User } = require('../../models')

describe('Authentication Integration Tests', () => {
  describe('完整的用户认证流程', () => {
    it('应该完成注册->登录->获取信息->更新信息的完整流程', async () => {
      // 1. 注册用户
      const registerData = {
        phone_number: '13912345678',
        password: 'password123',
        name: '张三',
        student_id: '12345678',
        email: 'zhangsan@example.com'
      }

      const registerResponse = await request(app)
        .post('/api/v1/users/register')
        .send(registerData)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      const token = registerResponse.body.data.token

      // 2. 使用token获取用户信息
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(profileResponse.body.data.user.phone_number).toBe(registerData.phone_number)
      expect(profileResponse.body.data.user.name).toBe(registerData.name)

      // 3. 更新用户信息
      const updateData = {
        name: '张三丰',
        nickname: '太极宗师'
      }

      const updateResponse = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(updateResponse.body.data.user.name).toBe(updateData.name)
      expect(updateResponse.body.data.user.nickname).toBe(updateData.nickname)

      // 4. 验证数据库中的数据
      const userInDb = await User.findByPk(registerData.phone_number)
      expect(userInDb.name).toBe(updateData.name)
      expect(userInDb.nickname).toBe(updateData.nickname)

      // 5. 重新登录验证
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          phone_number: registerData.phone_number,
          password: registerData.password
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      expect(loginResponse.body.data.user.name).toBe(updateData.name)
    })

    it('应该处理并发注册请求', async () => {
      const registerPromises = []
      
      // 同时发起5个注册请求，只有第一个应该成功
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/v1/users/register')
          .send({
            phone_number: '13912345678',
            password: 'password123',
            name: `用户${i}`
          })
        registerPromises.push(promise)
      }

      const responses = await Promise.allSettled(registerPromises)
      
      // 只有一个请求应该成功（201），其他应该失败（409）
      const successResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 201
      )
      const conflictResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 409
      )

      expect(successResponses).toHaveLength(1)
      expect(conflictResponses).toHaveLength(4)
    })
  })

  describe('错误处理', () => {
    it('应该正确处理无效的token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('无效的访问令牌')
    })

    it('应该正确处理被禁用的用户', async () => {
      // 创建用户
      const user = await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })

      // 获取token
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          phone_number: '13912345678',
          password: 'password123'
        })

      const token = loginResponse.body.data.token

      // 禁用用户
      await user.update({ status: 'banned' })

      // 尝试使用token访问
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('账户已被禁用')
    })
  })
})