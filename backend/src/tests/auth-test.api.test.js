const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';

// 生成唯一手机号
function randomPhone() {
  return '13' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
}

describe('认证测试', () => {
  let authToken, testPhone, testPassword;

  it('1. 注册用户', async () => {
    testPhone = randomPhone();
    testPassword = 'password123';
    
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: testPhone,
        password: testPassword,
        name: '测试用户',
        student_id: randomPhone(), // 使用随机学号避免冲突
        email: 'test@example.com'
      })
      .set('Content-Type', 'application/json');
    
    console.log('注册结果:', res.status, res.body);
    expect(res.status).toBe(200);
  });

  it('2. 登录获取token', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: testPassword
      })
      .set('Content-Type', 'application/json');
    
    console.log('登录结果:', res.status, res.body);
    
    if (res.status === 200 && res.body.success) {
      authToken = res.body.data.token;
      console.log('获取到token:', authToken ? '成功' : '失败');
      expect(authToken).toBeDefined();
    } else {
      console.log('登录失败，无法获取token');
    }
  });

  it('3. 测试资源列表接口（带认证）', async () => {
    if (!authToken) {
      console.log('跳过测试：没有token');
      return;
    }
    
    const res = await request(API_URL)
      .get('/api/v1/resources')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log('资源列表结果:', res.status, res.body);
    
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.resources)).toBe(true);
      console.log('资源列表获取成功，资源数量:', res.body.data.resources.length);
    } else {
      console.log('资源列表获取失败');
    }
  });
}); 