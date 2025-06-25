const { User } = require('../../models')

describe('User Model', () => {
  describe('创建用户', () => {
    it('应该成功创建用户', async () => {
      const userData = {
        phone_number: '13912345678',
        password: 'password123',
        name: '张三',
        student_id: '12345678',
        email: 'zhangsan@example.com'
      }

      const user = await User.create(userData)

      expect(user.phone_number).toBe(userData.phone_number)
      expect(user.name).toBe(userData.name)
      expect(user.student_id).toBe(userData.student_id)
      expect(user.email).toBe(userData.email)
      expect(user.password).not.toBe(userData.password) // 密码应该被加密
      expect(user.status).toBe('active') // 默认状态
      expect(user.gender).toBe('U') // 默认性别
    })

    it('应该自动加密密码', async () => {
      const userData = {
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      }

      const user = await User.create(userData)
      
      expect(user.password).not.toBe(userData.password)
      expect(user.password.length).toBeGreaterThan(50) // bcrypt hash length
    })

    it('应该验证手机号格式', async () => {
      const userData = {
        phone_number: '1234567890', // 无效格式
        password: 'password123',
        name: '张三'
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('应该验证学号格式', async () => {
      const userData = {
        phone_number: '13912345678',
        password: 'password123',
        name: '张三',
        student_id: 'invalid' // 无效格式
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('应该验证邮箱格式', async () => {
      const userData = {
        phone_number: '13912345678',
        password: 'password123',
        name: '张三',
        email: 'invalid-email' // 无效格式
      }

      await expect(User.create(userData)).rejects.toThrow()
    })

    it('应该要求必填字段', async () => {
      const userData = {
        phone_number: '13912345678'
        // 缺少password和name
      }

      await expect(User.create(userData)).rejects.toThrow()
    })
  })

  describe('密码验证', () => {
    let user

    beforeEach(async () => {
      user = await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })
    })

    it('应该验证正确的密码', async () => {
      const isValid = await user.validatePassword('password123')
      expect(isValid).toBe(true)
    })

    it('应该拒绝错误的密码', async () => {
      const isValid = await user.validatePassword('wrongpassword')
      expect(isValid).toBe(false)
    })
  })

  describe('toSafeJSON方法', () => {
    it('应该移除密码字段', async () => {
      const user = await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })

      const safeData = user.toSafeJSON()
      
      expect(safeData.password).toBeUndefined()
      expect(safeData.phone_number).toBe('13912345678')
      expect(safeData.name).toBe('张三')
    })
  })

  describe('更新用户', () => {
    it('应该在更新密码时重新加密', async () => {
      const user = await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })

      const originalPassword = user.password

      await user.update({
        password: 'newpassword123'
      })

      expect(user.password).not.toBe(originalPassword)
      expect(user.password).not.toBe('newpassword123')
      
      const isValid = await user.validatePassword('newpassword123')
      expect(isValid).toBe(true)
    })

    it('应该在更新其他字段时不影响密码', async () => {
      const user = await User.create({
        phone_number: '13912345678',
        password: 'password123',
        name: '张三'
      })

      const originalPassword = user.password

      await user.update({
        name: '李四'
      })

      expect(user.password).toBe(originalPassword)
      expect(user.name).toBe('李四')
    })
  })
})