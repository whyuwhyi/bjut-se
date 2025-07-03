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

describe('资源批量操作（远程API自动化测试）', () => {
  let ownResourceIds = [];
  let otherResourceId = '';
  let deletedResourceId = '';
  let favoriteResourceIds = [];

  beforeAll(async () => {
    token = await getToken(TEST_PHONE, TEST_PASSWORD);
    // 创建3个自己的资源
    ownResourceIds = [];
    for (let i = 0; i < 3; i++) {
      const res = await request(API_URL)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({
          resource_name: '批量测试资源_' + Date.now() + '_' + i,
          description: '批量操作自动化测试',
          status: 'published'
        });
      if (res.body.data && res.body.data.resource_id) {
        ownResourceIds.push(res.body.data.resource_id);
      }
    }
    // 假设有一个他人资源ID和一个已删除资源ID（需根据实际情况补充）
    otherResourceId = 'other_resource_id';
    deletedResourceId = 'deleted_resource_id';
    // 假设有3个可用于收藏的资源ID
    favoriteResourceIds = ownResourceIds.slice(0, 2);
  }, 30000);

  afterAll(async () => {
    await reconnectDB();
  });

  it('1. 正常批量删除资源', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: ownResourceIds });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/删除成功/);
  });

  it('2. 未登录批量操作', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .send({ resource_ids: ownResourceIds });
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|请先登录/);
  });

  it('3. 批量删除部分无权限', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: [ownResourceIds[0], ownResourceIds[1], otherResourceId] });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/部分资源无权限删除/);
  });

  it('4. 批量删除不存在资源', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: [ownResourceIds[0], deletedResourceId] });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/部分资源不存在/);
  });

  it('5. 批量删除全部无权限', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: [otherResourceId, otherResourceId, otherResourceId] });
    expect([200, 201, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/无权限删除所选资源/);
  });

  it('6. 批量删除空列表', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/请选择要删除的资源/);
  });

  it('7. 批量删除超大数量', async () => {
    const ids = Array.from({ length: 1000 }, (_, i) => 'id_' + i);
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: ids });
    expect([400, 413]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/操作过多|最大数量/);
  });

  it('8. 批量删除参数非法', async () => {
    const cases = [null, '', 123, {}, 'abc'];
    for (const param of cases) {
      const res = await request(API_URL)
        .post('/api/v1/resources/batch-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ resource_ids: param });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/参数错误/);
    }
  });

  it('9. 并发批量删除', async () => {
    const ids = [ownResourceIds[0]];
    const reqs = [];
    for (let i = 0; i < 3; i++) {
      reqs.push(request(API_URL)
        .post('/api/v1/resources/batch-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ resource_ids: ids }));
    }
    const results = await Promise.all(reqs);
    for (const res of results) {
      expect([200, 201]).toContain(res.status);
      expect(res.body.message).toMatch(/部分资源已被删除|已被删除/);
    }
  });

  it('10. 数据库异常', async () => {
    await disconnectDB();
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: ownResourceIds });
    expect([500, 503]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/服务器内部错误|数据库/);
    await reconnectDB();
  });

  it('11. 批量删除后数据一致', async () => {
    const res = await request(API_URL)
      .get('/api/v1/resources/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    for (const id of ownResourceIds) {
      expect(res.body.data.list.map(r => r.resource_id)).not.toContain(id);
    }
  });

  it('12. 批量删除后关联清理', async () => {
    // 这里只能断言接口返回，实际关联清理需后端配合验证
    // 假设有接口 /api/v1/comments/by-resource/:id
    for (const id of ownResourceIds) {
      const res = await request(API_URL)
        .get(`/api/v1/comments/by-resource/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data.list.length).toBe(0);
      }
    }
  });

  it('13. 批量收藏资源', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-favorite')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: favoriteResourceIds });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/收藏成功/);
  });

  it('14. 批量取消收藏', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-unfavorite')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: favoriteResourceIds });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/取消收藏成功/);
  });

  it('15. 批量操作频率限制', async () => {
    const ids = ownResourceIds.slice(0, 1);
    for (let i = 0; i < 5; i++) {
      await request(API_URL)
        .post('/api/v1/resources/batch-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ resource_ids: ids });
    }
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: ids });
    expect([429, 400]).toContain(res.status);
    expect(res.body.message).toMatch(/操作过于频繁|请稍后再试/);
  });

  it('16. 批量操作后消息通知', async () => {
    // 这里只能断言接口返回，实际通知需后端配合验证
    // 假设有接口 /api/v1/notifications/my
    const res = await request(API_URL)
      .get('/api/v1/notifications/my')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    // 可断言通知内容包含"删除"或"收藏"
  });

  it('17. 批量操作后权限校验', async () => {
    // 删除/收藏后再次操作同一资源
    const res = await request(API_URL)
      .post('/api/v1/resources/batch-delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ resource_ids: ownResourceIds });
    expect([400, 404]).toContain(res.status);
    expect(res.body.message).toMatch(/资源不存在|已删除/);
  });

  it('18. 批量操作后日志记录', async () => {
    // 这里只能断言接口返回，实际日志需后台人工查验
    // 假设有接口 /api/v1/admin/operation-logs
    const res = await request(API_URL)
      .get('/api/v1/admin/operation-logs')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.data.list)).toBe(true);
    }
  });
}); 