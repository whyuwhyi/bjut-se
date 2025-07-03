const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';

// 生成唯一资源ID
function randomResourceId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

describe('用户分享学习资源（远程API）自动化测试', () => {
  let testToken, adminToken, testResourceId;

  beforeAll(async () => {
    // 直接登录普通用户（使用指定账号）
    const testPhone = '18256800695';
    const testPassword = '123456';
    const loginRes = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: testPhone, password: testPassword })
      .set('Content-Type', 'application/json');
    if (loginRes.status === 200) {
      testToken = loginRes.body.data.token;
      console.log('普通用户登录结果:', loginRes.body);
      console.log('testToken:', testToken);
    } else {
      console.log('普通用户登录失败:', loginRes.body);
    }

    // 登录管理员（使用数据库实际存在的账号）
    const adminRes = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: '13800138001', password: '123456' })
      .set('Content-Type', 'application/json');
    if (adminRes.status === 200) {
      adminToken = adminRes.body.data.token;
      console.log('管理员登录结果:', adminRes.body);
      console.log('adminToken:', adminToken);
    } else {
      console.log('管理员登录失败:', adminRes.body);
    }
  });

  it('1. 成功创建资源', async () => {
    testResourceId = randomResourceId();
    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '自动化测试资源',
        description: '自动化测试描述',
        category_id: '1',
        resource_id: testResourceId
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.resource_id).toBe(testResourceId);
    expect(res.body.data?.status).toBe('draft');
  });

  it('2. 未登录创建资源', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '未登录资源',
        description: '未登录描述',
        category_id: '1'
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('3. 缺少必填字段', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        description: '缺少标题',
        category_id: '1'
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. 重复资源ID', async () => {
    // 先用 testResourceId 创建过一次
    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '重复ID资源',
        description: '重复ID描述',
        category_id: '1',
        resource_id: testResourceId
      });
    expect([400, 409]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it('5. 提交审核成功', async () => {
    // 提交审核
    const res = await request(API_URL)
      .post(`/api/v1/resources/${testResourceId}/submit-review`)
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('6. 非草稿提交审核', async () => {
    // 再次提交审核，资源已不是draft
    const res = await request(API_URL)
      .post(`/api/v1/resources/${testResourceId}/submit-review`)
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('7. 审核资源不存在', async () => {
    const fakeId = randomResourceId();
    const res = await request(API_URL)
      .post(`/api/v1/resources/${fakeId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send({ action: 'approve' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
}); 