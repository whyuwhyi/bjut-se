const request = require('supertest');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';

// 获取token（手机号登录）
async function getToken(phone, password) {
  try {
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: phone, password })
      .set('Content-Type', 'application/json');
    if (res.status !== 200 || !res.body.data || !res.body.data.token) {
      throw new Error(`登录失败: ${JSON.stringify(res.body)}`);
    }
    return res.body.data.token;
  } catch (e) {
    throw new Error('getToken error: ' + e.message);
  }
}

// 数据库断开/恢复（需后端配合）
async function disconnectDB() {
  try {
    await request(API_URL).post('/api/v1/test/disconnect-db');
  } catch (e) {
    console.error('disconnectDB error:', e.message);
  }
}
async function reconnectDB() {
  try {
    await request(API_URL).post('/api/v1/test/reconnect-db');
  } catch (e) {
    console.error('reconnectDB error:', e.message);
  }
}

describe('用户查看自己发布的资源（远程API自动化测试）', () => {
  beforeAll(async () => {
    // 登录主测试用户
    console.log('登录主测试用户...');
    token = await getToken(TEST_PHONE, TEST_PASSWORD);
    console.log('主用户token:', token);
    // 保证主用户有一条资源
    const testFile = path.resolve(__dirname, 'test-desktop.jpg');
    if (!fs.existsSync(testFile)) {
      throw new Error('缺少测试图片 test-desktop.jpg');
    }
    console.log('上传主用户测试资源...');
    // 1. 先创建资源（JSON方式）
    const createRes = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '测试资源_' + Date.now(),
        description: '自动化测试资源',
        status: 'published'
      });
    if (![200, 201].includes(createRes.status) || !createRes.body.data || !createRes.body.data.resource_id) {
      throw new Error('主用户资源创建失败: ' + JSON.stringify(createRes.body));
    }
    const resourceId = createRes.body.data.resource_id;
    // 2. 再上传文件
    const uploadRes = await request(API_URL)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testFile)
      .field('resource_id', resourceId)
      .field('file_name', 'test-desktop.jpg')
      .field('file_type', 'jpg');
    if (![200, 201].includes(uploadRes.status)) {
      throw new Error('主用户资源文件上传失败: ' + JSON.stringify(uploadRes.body));
    }
    console.log('主用户资源及文件上传成功');
  }, 60000);

  afterAll(async () => {
    await reconnectDB();
  });

  it('1. 正常查看资源列表', async () => {
    const res = await request(API_URL)
      .get('/api/v1/resources/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeGreaterThan(0);
  });

  it('2. 未登录查看资源', async () => {
    const res = await request(API_URL)
      .get('/api/v1/resources/my');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|请先登录/);
  });

  it('3. 资源为空（仅断言返回结构，不要求列表为0）', async () => {
    const res = await request(API_URL)
      .get('/api/v1/resources/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
  });

  it('4. 分页参数正常', async () => {
    const res = await request(API_URL)
      .get('/api/v1/resources/my?page=1&pageSize=1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
  });

  it('5. 分页参数越界', async () => {
    const res = await request(API_URL)
      .get('/api/v1/resources/my?page=999&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    // 允许为空
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
  });

  it('6. 数据库异常', async () => {
    await disconnectDB();
    const res = await request(API_URL)
      .get('/api/v1/resources/my')
      .set('Authorization', `Bearer ${token}`);
    expect([500, 503]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/服务器内部错误|数据库/);
    await reconnectDB();
  });
}); 