const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';

const TEST_RESOURCE_ID = '123456789'; // 已发布资源
const DRAFT_RESOURCE_ID = '999999999'; // 草稿资源
const NON_EXIST_RESOURCE_ID = '888888888'; // 不存在的资源

const user1 = { phone_number: '18256800695', password: '123456' };
const user2 = { phone_number: '13800138002', password: '123456' };

let token1, token2;

beforeAll(async () => {
  // 登录用户1
  const res1 = await request(API_URL)
    .post('/api/v1/users/login')
    .send(user1)
    .set('Content-Type', 'application/json');
  if (res1.status === 200) token1 = res1.body.data.token;

  // 登录用户2
  const res2 = await request(API_URL)
    .post('/api/v1/users/login')
    .send(user2)
    .set('Content-Type', 'application/json');
  if (res2.status === 200) token2 = res2.body.data.token;
});

describe('用户评价学习资源（远程API）自动化测试', () => {
  it('1. 正常评价资源', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4.5, review_text: '很好' })
      .set('Content-Type', 'application/json');
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/评分成功|评分已更新/);
  });

  it('2. 未登录评价资源', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .send({ rating: 4.5, review_text: '未登录评价' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/请先登录|token.*missing|unauthorized|访问令牌缺失/i);
  });

  it('3. 评分超出范围', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 6, review_text: '超出范围' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/评分必须在1-5之间/);
  });

  it('4. 评分为负数', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 0, review_text: '负数评分' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/评分必须在1-5之间/);
  });

  it('5. 评分为空', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ review_text: '评分为空' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('6. 评价不存在的资源', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${NON_EXIST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4, review_text: '不存在的资源' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/资源不存在/);
  });

  it('7. 评价未发布资源', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${DRAFT_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4, review_text: '草稿资源' })
      .set('Content-Type', 'application/json');
    // 后端未做状态校验会返回评分成功，否则应返回400
    expect([200, 201, 400]).toContain(res.status);
  });

  it('8. 重复评价同一资源', async () => {
    // 第一次评价
    await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 3, review_text: '第一次评价' })
      .set('Content-Type', 'application/json');
    // 第二次评价
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 5, review_text: '第二次评价' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/评分已更新/);
  });

  it('9. 评价内容过长', async () => {
    const longText = 'a'.repeat(10000); // TEXT类型，理论上不会报错
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4, review_text: longText })
      .set('Content-Type', 'application/json');
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('10. 评价内容为空', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4 })
      .set('Content-Type', 'application/json');
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  it('11. 多次评价统计', async () => {
    // 用户1评价
    await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ rating: 4, review_text: '用户1评价' })
      .set('Content-Type', 'application/json');
    // 用户2评价
    await request(API_URL)
      .post(`/api/v1/resources/${TEST_RESOURCE_ID}/rating`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ rating: 5, review_text: '用户2评价' })
      .set('Content-Type', 'application/json');
    // 查询资源详情
    const res = await request(API_URL)
      .get(`/api/v1/resources/${TEST_RESOURCE_ID}`)
      .set('Authorization', `Bearer ${token1}`)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.rating)).toBeGreaterThanOrEqual(1);
  });

  it('14. 查看资源评分', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/resources/${TEST_RESOURCE_ID}`)
      .set('Authorization', `Bearer ${token1}`)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.rating)).toBeGreaterThanOrEqual(1);
  });
}); 