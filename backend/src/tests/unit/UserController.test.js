const request = require('supertest')
const app = require('../../app')
const { User } = require('../../models')

describe('UserController', () => {
  describe('POST /api/v1/users/register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        phone_number: '13912345678',
        password: 'password123',
        name: '张三',
        student_id: '12345678',
        email: 'zhangsan@example.com'
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('注册成功')
      expect(response.body.data.user.phone_number).toBe(userData.phone_number)
      expect(response.body.data.user.name).toBe(userData.name)
      expect(response.body.data.user.password).toBeUndefined()
      expect(response.body.data.token).toBeDefined()
    })

    it('应该拒绝重复的手机号', async () => {
      // 先创建一个用户
      await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })

      const userData = {
        phone_number: '13912345678',
        password: 'password456',
        name: '李四'
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('用户已存在')
    })

    it('应该拒绝无效的手机号格式', async () => {
      const userData = {
        phone_number: '1234567890',
        password: 'password123',
        name: '张三'
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('输入数据验证失败')
    })

    it('应该拒绝重复的学号', async () => {
      // 先创建一个用户
      await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三',
        student_id: '12345678'
      })

      const userData = {
        phone_number: '13987654321',
        password: 'password456',
        name: '李四',
        student_id: '12345678'
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('学号已被使用')
    })
  })

  describe('POST /api/v1/users/login', () => {
    beforeEach(async () => {
      await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })
    })

    it('应该成功登录', async () => {
      const loginData = {
        phone_number: '13912345678',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('登录成功')
      expect(response.body.data.user.phone_number).toBe(loginData.phone_number)
      expect(response.body.data.token).toBeDefined()
    })

    it('应该拒绝错误的密码', async () => {
      const loginData = {
        phone_number: '13912345678',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('密码错误')
    })

    it('应该拒绝不存在的用户', async () => {
      const loginData = {
        phone_number: '13987654321',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('用户不存在')
    })
  })

  describe('GET /api/v1/users/profile', () => {
    let token
    let user

    beforeEach(async () => {
      // 创建用户并获取token
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          phone_number: '13912345678',
          password: 'password123',
          name: '张三'
        })

      token = response.body.data.token
      user = response.body.data.user
    })

    it('应该返回用户信息', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.phone_number).toBe(user.phone_number)
      expect(response.body.data.user.name).toBe(user.name)
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('应该拒绝无效的token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('无效的访问令牌')
    })

    it('应该拒绝缺失的token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('访问令牌缺失')
    })
  })
})