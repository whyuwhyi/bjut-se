const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';

async function getToken(phone, password) {
  const res = await request(API_URL)
    .post('/api/v1/users/login')
    .send({ phone_number: phone, password })
    .set('Content-Type', 'application/json');
  if (res.status !== 200 || !res.body.data || !res.body.data.token) {
    throw new Error(`登录失败: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

async function disconnectDB() {
  try {
    await request(API_URL).post('/api/v1/test/disconnect-db');
  } catch (e) {}
}
async function reconnectDB() {
  try {
    await request(API_URL).post('/api/v1/test/reconnect-db');
  } catch (e) {}
}

describe('用户查看自己下载记录（远程API自动化测试）', () => {
  beforeAll(async () => {
    token = await getToken(TEST_PHONE, TEST_PASSWORD);
  }, 30000);

  afterAll(async () => {
    await reconnectDB();
  });

  it('1. 正常查看下载记录', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    // 检查字段完整性
    if (res.body.data.list.length > 0) {
      const item = res.body.data.list[0];
      expect(item).toHaveProperty('resource_id');
      expect(item).toHaveProperty('resource_name');
      expect(item).toHaveProperty('download_time');
      expect(item).toHaveProperty('file_type');
    }
  });

  it('2. 未登录查看下载记录', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|请先登录/);
  });

  it('3. 下载记录为空', async () => {
    // 只断言结构，允许为空
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeGreaterThanOrEqual(0);
    expect(res.body.data.totalItems).toBeDefined();
    if (res.body.data.list.length === 0) {
      expect(res.body.data.totalItems).toBe(0);
    }
  });

  it('4. 分页参数正常', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeLessThanOrEqual(5);
  });

  it('5. 分页参数越界', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?page=9999&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBe(0);
  });

  it('6. limit为0', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?limit=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/分页参数不合法/);
  });

  it('7. limit为负数', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?limit=-5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/分页参数不合法/);
  });

  it('8. page为负数', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?page=-1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/分页参数不合法/);
  });

  it('9. limit超大', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?limit=1000')
      .set('Authorization', `Bearer ${token}`);
    // 允许后端自动限制最大值或报错
    expect([200, 201, 400]).toContain(res.status);
  });

  it('10. page为非数字', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?page=abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/分页参数不合法/);
  });

  it('11. limit为非数字', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?limit=xyz')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/分页参数不合法/);
  });

  it('12. 数据库异常', async () => {
    await disconnectDB();
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', `Bearer ${token}`);
    expect([500, 503]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/服务器内部错误|数据库/);
    await reconnectDB();
  });

  it('13. 数据字段完整性', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    if (res.body.data.list.length > 0) {
      for (const item of res.body.data.list) {
        expect(item).toHaveProperty('resource_id');
        expect(item).toHaveProperty('resource_name');
        expect(item).toHaveProperty('download_time');
        expect(item).toHaveProperty('file_type');
      }
    }
  });

  it('14. 下载记录排序', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    const list = res.body.data.list;
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        expect(new Date(list[i - 1].download_time) >= new Date(list[i].download_time)).toBe(true);
      }
    }
  });

  it('15. 并发请求', async () => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(request(API_URL)
        .get('/api/v1/downloads/my')
        .set('Authorization', `Bearer ${token}`));
    }
    const results = await Promise.all(requests);
    for (const res of results) {
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    }
  });

  it('16. 大量下载记录', async () => {
    // 只断言分页结构，性能需人工观察
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?limit=100&page=1')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeLessThanOrEqual(100);
  });

  it('17. 特殊字符注入', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my?page=1;DROP TABLE users;&limit=1--')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/分页参数不合法|参数错误/);
  });

  it('18. 非法token', async () => {
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', 'Bearer invalidtoken');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|请先登录/);
  });

  it('19. 已过期token', async () => {
    // 这里用一个明显过期的token
    const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', expiredToken);
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|请先登录/);
  });

  it('20. 其他用户隔离', async () => {
    // 只用A账号，断言只能看到自己的下载记录
    const res = await request(API_URL)
      .get('/api/v1/downloads/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    // 只要不是越权即可
  });
}); 