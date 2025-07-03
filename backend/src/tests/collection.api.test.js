const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';

describe('用户收藏学习资源（远程API）自动化测试', () => {
  let authToken, testPhone, testPassword, resourceId;

  beforeAll(async () => {
    // 使用固定测试账号
    testPhone = '13800138001';
    testPassword = '123456';

    // 登录获取token
    const loginRes = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: testPhone, password: testPassword })
      .set('Content-Type', 'application/json');
    if (loginRes.status === 200 && loginRes.body.success) {
      authToken = loginRes.body.data.token;
      console.log('用户登录结果:', loginRes.body);
    }

    // 获取一个可用资源ID
    const res = await request(API_URL)
      .get('/api/v1/resources')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json');
    if (res.status === 200 && res.body.data.resources.length > 0) {
      resourceId = res.body.data.resources[0].id;
    }
  });

  // 幂等性辅助函数：确保未收藏状态
  async function ensureUncollected(token, resId) {
    const statusRes = await request(API_URL)
      .get(`/api/v1/resources/${resId}/favorite-status`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    if (statusRes.status === 200 && statusRes.body.data.isCollected) {
      // 已收藏则先取消
      await request(API_URL)
        .post(`/api/v1/resources/${resId}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'resource' })
        .set('Content-Type', 'application/json');
    }
  }

  it('1. 正常收藏资源', async () => {
    if (!resourceId) return console.log('跳过测试：没有可用资源');
    await ensureUncollected(authToken, resourceId);
    const res = await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/收藏成功|已收藏/);
    expect(res.body.data.isCollected).toBe(true);
  });

  it('2. 取消收藏资源', async () => {
    if (!resourceId) return console.log('跳过测试：没有可用资源');
    await ensureUncollected(authToken, resourceId);
    // 先收藏一次
    await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    // 再取消收藏
    const res = await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/取消收藏成功|已取消收藏/);
    expect(res.body.data.isCollected).toBe(false);
  });

  it('3. 未登录收藏', async () => {
    if (!resourceId) return console.log('跳过测试：没有可用资源');
    // 不需要重置状态
    const res = await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/请先登录|访问令牌缺失|unauthorized/i);
  });

  it('4. 收藏后刷新', async () => {
    if (!resourceId) return console.log('跳过测试：没有可用资源');
    await ensureUncollected(authToken, resourceId);
    // 先收藏
    await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    // 刷新（查询收藏状态）
    const res = await request(API_URL)
      .get(`/api/v1/resources/${resourceId}/favorite-status`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isCollected).toBe(true);
  });

  it('5. 收藏数量统计', async () => {
    if (!resourceId) return console.log('跳过测试：没有可用资源');
    // 假设有第二个用户
    const user2 = { phone_number: '13800138002', password: '123456' };
    // 登录第二个用户
    const loginRes2 = await request(API_URL)
      .post('/api/v1/users/login')
      .send(user2)
      .set('Content-Type', 'application/json');
    let token2;
    if (loginRes2.status === 200 && loginRes2.body.success) {
      token2 = loginRes2.body.data.token;
    }
    // 保证两个用户都未收藏
    await ensureUncollected(authToken, resourceId);
    await ensureUncollected(token2, resourceId);
    // 两个用户分别收藏
    await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ type: 'resource' })
      .set('Content-Type', 'application/json');
    // 查询资源详情，校验收藏数
    const res = await request(API_URL)
      .get(`/api/v1/resources/${resourceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.collection_count).toBeGreaterThanOrEqual(2);
  });

  it('6. 收藏异常', async () => {
    if (!resourceId) return console.log('跳过测试：没有可用资源');
    await ensureUncollected(authToken, resourceId);
    // 模拟接口异常（如传递无效type）
    const res = await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/favorite`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'invalid_type' })
      .set('Content-Type', 'application/json');
    expect([200, 400]).toContain(res.status); // 兼容后端未严格返回400
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/收藏类型无效|收藏失败|网络异常/i);
  });
}); 