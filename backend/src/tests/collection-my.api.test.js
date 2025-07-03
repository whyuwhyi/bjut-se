const request = require('supertest');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';

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

describe('用户查看自己收藏的资源/帖子（远程API自动化测试）', () => {
  beforeAll(async () => {
    // 登录主测试用户
    token = await getToken(TEST_PHONE, TEST_PASSWORD);
  }, 30000);

  afterAll(async () => {
    await reconnectDB();
  });

  it('1. 正常查看收藏列表', async () => {
    const res = await request(API_URL)
      .get('/api/v1/collections/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    // 允许为空或有内容
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
  });

  it('2. 未登录查看收藏', async () => {
    const res = await request(API_URL)
      .get('/api/v1/collections/my');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|请先登录/);
  });

  it('3. 收藏为空', async () => {
    // 只断言结构，允许为空
    const res = await request(API_URL)
      .get('/api/v1/collections/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
  });

  it('4. 分页参数正常', async () => {
    const res = await request(API_URL)
      .get('/api/v1/collections/my?page=2&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
  });

  it('5. 分页参数越界', async () => {
    const res = await request(API_URL)
      .get('/api/v1/collections/my?page=999&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
  });

  it('6. 数据库异常', async () => {
    await disconnectDB();
    const res = await request(API_URL)
      .get('/api/v1/collections/my')
      .set('Authorization', `Bearer ${token}`);
    expect([500, 503]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/服务器内部错误|数据库/);
    await reconnectDB();
  });
}); 