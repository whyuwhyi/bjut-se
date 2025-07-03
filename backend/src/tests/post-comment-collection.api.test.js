const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

// 用于测试的帖子ID（需保证存在）
let postId = '';
let token = '';

describe('帖子评论与收藏功能（远程API自动化测试）', () => {
  beforeAll(async () => {
    // 登录获取token
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: TEST_PHONE, password: TEST_PASSWORD })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    token = res.body.data.token;
    // 获取一条存在的帖子ID
    const postRes = await request(API_URL)
      .get('/api/v1/posts?page=1&limit=1')
      .set('Content-Type', 'application/json');
    expect(postRes.status).toBe(200);
    expect(postRes.body.data.posts.length).toBeGreaterThan(0);
    postId = postRes.body.data.posts[0].post_id;
  });

  // 1. 成功评论帖子
  it('1. 成功评论帖子', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ content: '自动化测试评论内容' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('发表评论成功');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.content).toBe('自动化测试评论内容');
  });

  // 2. 未登录评论
  it('2. 未登录评论', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Content-Type', 'application/json')
      .send({ content: '未登录评论' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 3. 帖子不存在
  it('3. 帖子不存在', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/posts/NOT_EXIST_ID/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ content: '评论内容' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('帖子不存在');
  });

  // 4. 评论内容为空
  it('4. 评论内容为空', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ content: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('评论内容不能为空');
  });

  // 5. 成功收藏帖子
  it('5. 成功收藏帖子', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/posts/${postId}/favorite`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ type: 'post' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.isCollected).toBe(true);
    expect(res.body.message).toBe('收藏成功');
  });

  // 6. 取消收藏帖子
  it('6. 取消收藏帖子', async () => {
    // 再次调用即为取消收藏
    const res = await request(API_URL)
      .post(`/api/v1/posts/${postId}/favorite`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ type: 'post' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.isCollected).toBe(false);
    expect(res.body.message).toBe('取消收藏成功');
  });

  // 7. 收藏不存在的帖子
  it('7. 收藏不存在的帖子', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/posts/NOT_EXIST_ID/favorite`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ type: 'post' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('帖子不存在');
  });

  // 8. 评论内容超长
  it('8. 评论内容超长', async () => {
    const longContent = 'A'.repeat(10001); // 假设后端有长度限制
    const res = await request(API_URL)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ content: longContent });
    expect([400, 413]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/内容过长|超出|长度/);
  });
}); 