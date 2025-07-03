const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';
let resourceId = '';

describe('学习资源评论功能（远程API自动化测试）', () => {
  beforeAll(async () => {
    // 登录获取token
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: TEST_PHONE, password: TEST_PASSWORD })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    token = res.body.data.token;
    // 创建一个测试资源
    const resourceRes = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '自动化测试资源',
        description: '用于评论功能的自动化测试',
        // 如有必填分类等字段请补充
      });
    expect([200, 201]).toContain(resourceRes.status);
    expect(resourceRes.body.success).toBe(true);
    resourceId = resourceRes.body.data.resource_id || resourceRes.body.data.id;
    expect(resourceId).toBeDefined();
  }, 30000);

  // 1. 成功评论资源
  it('1. 成功评论资源', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/comments/resources/${resourceId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ comment_content: '自动化测试评论内容' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('评论成功');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.content).toBe('自动化测试评论内容');
  });

  // 2. 未登录评论
  it('2. 未登录评论', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/comments/resources/${resourceId}/comments`)
      .set('Content-Type', 'application/json')
      .send({ comment_content: '未登录评论' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 3. 资源不存在
  it('3. 资源不存在', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/comments/resources/NOT_EXIST_ID/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ comment_content: '评论内容' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('资源不存在');
  });

  // 4. 评论内容为空
  it('4. 评论内容为空', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/comments/resources/${resourceId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ comment_content: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不能为空/);
  });

  it('5. 评论内容超长', async () => {
    const longText = 'a'.repeat(100000); // TEXT类型，理论上不会报错
    const res = await request(API_URL)
      .post(`/api/v1/resources/${resourceId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comment_content: longText })
      .set('Content-Type', 'application/json');
    // TEXT类型，MySQL最大65535字节，超长可能报错
    expect([201, 500]).toContain(res.status);
  });

  it('6. 服务器异常', async () => {
    // 此用例需后端主动抛出500错误或用mock方式测试
    // 可用 mock 或 monkey-patch 方式在本地测试
  });
}, 30000); 