const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';
const USER_PHONE = '18256800695';
const USER_PASSWORD = '123456';
const ADMIN_PHONE = '13800138001';
const ADMIN_PASSWORD = '123456';

let userToken = '';
let adminToken = '';
let notificationId = '';

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

describe('用户通知功能（远程API自动化测试）', () => {
  beforeAll(async () => {
    userToken = await getToken(USER_PHONE, USER_PASSWORD);
    adminToken = await getToken(ADMIN_PHONE, ADMIN_PASSWORD);
  }, 30000);

  afterAll(async () => {
    await reconnectDB();
  });

  it('1. 普通用户登录后获取通知列表', async () => {
    const res = await request(API_URL)
      .get('/api/v1/notifications/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    if (res.body.data.list.length > 0) notificationId = res.body.data.list[0].id;
  });

  it('2. 普通用户未登录获取通知', async () => {
    const res = await request(API_URL)
      .get('/api/v1/notifications/my');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('3. 普通用户分页获取通知', async () => {
    const res = await request(API_URL)
      .get('/api/v1/notifications/my?page=2&pageSize=5')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
    expect(res.body.data.list.length).toBeLessThanOrEqual(5);
  });

  it('4. 普通用户获取通知详情', async () => {
    if (!notificationId) return;
    const res = await request(API_URL)
      .get(`/api/v1/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('title');
    expect(res.body.data).toHaveProperty('content');
  });

  it('5. 普通用户标记通知为已读', async () => {
    if (!notificationId) return;
    const res = await request(API_URL)
      .post(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('6. 普通用户批量标记为已读', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/batch/read')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ids: [notificationId] });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('7. 普通用户删除通知', async () => {
    if (!notificationId) return;
    const res = await request(API_URL)
      .delete(`/api/v1/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('8. 普通用户批量删除通知', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/batch/delete')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ids: [notificationId] });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('9. 普通用户未读通知数', async () => {
    const res = await request(API_URL)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.unreadCount).toBe('number');
  });

  it('10. 普通用户非法参数', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/batch/read')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ids: null });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('11. 普通用户越权操作', async () => {
    const res = await request(API_URL)
      .delete('/api/v1/notifications/other_user_notification_id')
      .set('Authorization', `Bearer ${userToken}`);
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('12. 管理员登录后发布通知', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '系统通知', content: '测试通知内容', type: 'system' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    if (res.body.data && res.body.data.id) notificationId = res.body.data.id;
  });

  it('13. 管理员未登录发布通知', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/publish')
      .send({ title: '未登录通知', content: '未登录内容', type: 'system' });
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('14. 管理员发布非法内容', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '', content: '', type: 'system' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('15. 管理员删除通知', async () => {
    if (!notificationId) return;
    const res = await request(API_URL)
      .delete(`/api/v1/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('16. 管理员批量删除通知', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/batch/delete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: [notificationId] });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('17. 管理员分页获取所有通知', async () => {
    const res = await request(API_URL)
      .get('/api/v1/notifications?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.list)).toBe(true);
  });

  it('18. 管理员获取通知详情', async () => {
    if (!notificationId) return;
    const res = await request(API_URL)
      .get(`/api/v1/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('title');
    expect(res.body.data).toHaveProperty('content');
  });

  it('19. 管理员非法参数', async () => {
    const res = await request(API_URL)
      .post('/api/v1/notifications/batch/delete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: null });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('20. 数据库异常', async () => {
    await disconnectDB();
    const res = await request(API_URL)
      .get('/api/v1/notifications/my')
      .set('Authorization', `Bearer ${userToken}`);
    expect([500, 503]).toContain(res.status);
    expect(res.body.success).toBe(false);
    await reconnectDB();
  });
}); 