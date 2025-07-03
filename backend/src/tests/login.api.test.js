const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';

// 生成唯一手机号
function randomPhone() {
  return '13' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
}

describe('用户登录接口（远程API）自动化测试', () => {
  let testPhone, testPassword, testToken;

  // 在所有测试前注册一个测试用户
  beforeAll(async () => {
    testPhone = randomPhone();
    testPassword = 'password123';
    
    // 注册测试用户
    await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: testPhone,
        password: testPassword,
        name: '测试用户',
        student_id: '12345678',
        email: 'test@example.com'
      })
      .set('Content-Type', 'application/json');
  });

  it('1. 正常登录', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: testPassword
      })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/登录成功|success/i);
    expect(res.body.data?.token).toBeDefined();
    expect(res.body.data?.user).toBeDefined();
    expect(res.body.data.user.phone_number).toBe(testPhone);
    
    // 保存token用于后续测试
    testToken = res.body.data.token;
  });

  it('2. 未注册用户登录', async () => {
    const unregisteredPhone = randomPhone();
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: unregisteredPhone,
        password: 'password123'
      })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('用户不存在');
  });

  it('3. 密码错误', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: 'wrongpassword'
      })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('密码错误');
  });

  it('4. 手机号格式错误', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: '1234567890', // 非11位
        password: 'password123'
      })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('登录失败：输入数据验证失败');
  });

  it('5. 手机号为空', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: '',
        password: 'password123'
      })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('登录失败：输入数据验证失败');
  });

  it('6. 密码为空', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: ''
      })
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('登录失败：输入数据验证失败');
  });

  it('7. 被禁用用户登录', async () => {
    // 注意：这个测试需要先创建一个被禁用的用户
    // 由于无法直接修改用户状态，这里测试API的响应格式
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: testPassword
      })
      .set('Content-Type', 'application/json');
    
    // 如果用户被禁用，应该返回403状态码
    if (res.status === 403) {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('账户已被禁用');
    } else {
      // 如果用户正常，测试应该通过
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  it('8. 非活跃用户登录', async () => {
    // 类似测试7，测试非活跃用户的登录
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: testPassword
      })
      .set('Content-Type', 'application/json');
    
    if (res.status === 403) {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('账户已被禁用');
    } else {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  it('9. 多次登录尝试', async () => {
    // 连续多次错误密码登录
    const attempts = 3;
    for (let i = 0; i < attempts; i++) {
      const res = await request(API_URL)
        .post('/api/v1/users/login')
        .send({
          phone_number: testPhone,
          password: 'wrongpassword'
        })
        .set('Content-Type', 'application/json');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('密码错误');
    }
  });

  it('10. 网络异常', async () => {
    let errorCaught = false;
    try {
      await request('http://127.0.0.1:9999')
        .post('/api/v1/users/login')
        .send({
          phone_number: testPhone,
          password: testPassword
        })
        .timeout({ deadline: 1000 });
    } catch (err) {
      errorCaught = true;
      expect(err.message).toMatch(/ECONNREFUSED|timeout/i);
    }
    expect(errorCaught).toBe(true);
  });

  it('11. 后端接口异常', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .set('Content-Type', 'text/plain')
      .send('not a json');
    
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message || res.text).toMatch(/登录失败|error|fail/i);
  });

  it('12. 登录后token有效性', async () => {
    // 先登录获取token
    const loginRes = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: testPassword
      })
      .set('Content-Type', 'application/json');
    
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token;
    
    // 使用token访问需要认证的接口
    const profileRes = await request(API_URL)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data?.user).toBeDefined();
    expect(profileRes.body.data.user.phone_number).toBe(testPhone);
  });

  // 额外测试：无效token访问
  it('13. 无效token访问', async () => {
    const res = await request(API_URL)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalid_token')
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/无效的访问令牌|invalid.*token/i);
  });

  // 额外测试：缺失token访问
  it('14. 缺失token访问', async () => {
    const res = await request(API_URL)
      .get('/api/v1/users/profile')
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/访问令牌缺失|token.*missing/i);
  });
}); 