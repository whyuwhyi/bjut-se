const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';

// 获取管理员token
async function getAdminToken() {
  const res = await request(API_URL)
    .post('/api/v1/users/login')
    .send({ phone_number: '13800138001', password: '123456' })
    .set('Content-Type', 'application/json');
  if (res.status === 200) {
    return res.body.data.token;
  } else {
    throw new Error('管理员登录失败: ' + JSON.stringify(res.body));
  }
}

describe('用户发布帖子（远程API）自动化测试', () => {
  let token;

  beforeAll(async () => {
    token = await getAdminToken();
    console.log('管理员token:', token);
  });

  test('1. 正常发布帖子', async () => {
    const res = await request(API_URL)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: '测试帖子标题',
        content: '这是帖子内容'
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('post_id');
  });

  test('2. 未登录发布', async () => {
    const res = await request(API_URL)
      .post('/api/v1/posts')
      .set('Content-Type', 'application/json')
      .send({
        title: '未登录发帖',
        content: '内容'
      });
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('3. 缺少标题', async () => {
    const res = await request(API_URL)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        content: '只有内容没有标题'
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/标题/);
  });

  test('4. 缺少内容', async () => {
    const res = await request(API_URL)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: '只有标题没有内容'
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/内容/);
  });

  test('5. 内容超长', async () => {
    const longContent = 'a'.repeat(5001);
    const res = await request(API_URL)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: '超长内容测试',
        content: longContent
      });
    expect([400, 413]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/内容过长/);
  });

  test('6. 网络异常', async () => {
    // 自动化脚本无法直接断网，建议用 mock 工具模拟
    // 这里只做伪代码提示
    // expect(网络异常).toBe(true);
  });

  test('7. 发布后刷新', async () => {
    // 先发帖
    const res = await request(API_URL)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: '刷新列表测试',
        content: '刷新后应在顶部'
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);

    // 获取帖子列表
    const listRes = await request(API_URL)
      .get('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    console.log('帖子列表返回：', listRes.body.data);
    // 自动判断结构
    if (Array.isArray(listRes.body.data)) {
      expect(listRes.body.data[0].title).toBe('刷新列表测试');
    } else if (listRes.body.data && Array.isArray(listRes.body.data.posts)) {
      expect(listRes.body.data.posts[0].title).toBe('刷新列表测试');
    } else {
      throw new Error('帖子列表返回结构异常: ' + JSON.stringify(listRes.body.data));
    }
  });
}); 