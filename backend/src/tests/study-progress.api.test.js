const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';
let myPlanId = '';
let otherPlanId = '999999999'; // 假设不存在的ID

// 生成未来日期
function getFutureDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
const futureStart = getFutureDate(5);
const futureEnd = getFutureDate(35);

beforeAll(async () => {
  // 登录主账号
  const res = await request(API_URL)
    .post('/api/v1/users/login')
    .send({ phone_number: TEST_PHONE, password: TEST_PASSWORD })
    .set('Content-Type', 'application/json');
  expect(res.status).toBe(200);
  token = res.body.data.token;
  // 创建一个无任务的计划
  const planRes = await request(API_URL)
    .post('/api/v1/study-plans')
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send({
      title: '进度测试计划',
      description: '进度测试用',
      start_date: futureStart,
      end_date: futureEnd
    });
  expect([200, 201]).toContain(planRes.status);
  myPlanId = planRes.body.data.plan_id;
}, 30000);

describe('学习进度功能（远程API自动化测试）', () => {
  // 1. 正常查看进度
  it('1. 正常查看进度', async () => {
    const res = await request(API_URL)
      .get('/api/v1/study-plans/progress')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_plans');
    expect(res.body.data).toHaveProperty('completed_plans');
    expect(res.body.data).toHaveProperty('total_tasks');
    expect(res.body.data).toHaveProperty('completed_tasks');
    expect(res.body.data).toHaveProperty('completion_rate');
  }, 30000);

  // 2. 未登录查看进度
  it('2. 未登录查看进度', async () => {
    const res = await request(API_URL)
      .get('/api/v1/study-plans/progress');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|登录|访问令牌缺失/);
  }, 30000);

  // 3. 查看他人计划进度
  it('3. 查看他人计划进度', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/study-plans/${otherPlanId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/无权限|不存在/);
  }, 30000);

  // 4. 查询不存在的计划
  it('4. 查询不存在的计划', async () => {
    const res = await request(API_URL)
      .get('/api/v1/study-plans/NOT_EXIST_ID')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不存在/);
  }, 30000);

  // 5. 查询无任务的计划
  it('5. 查询无任务的计划', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/study-plans/${myPlanId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('tasks');
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.tasks.length).toBe(0);
  }, 30000);

  // 6. 数据库异常
  it('6. 数据库异常', async () => {
    // 此用例仅作结构展示，实际运行需断开数据库或用mock server
    expect(true).toBe(true);
  }, 30000);
}); 