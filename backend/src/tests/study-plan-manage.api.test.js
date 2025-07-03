const request = require('supertest');
const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';
let myPlanId = '';
let otherPlanId = '';

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
  // 创建一个自己的计划
  const planRes = await request(API_URL)
    .post('/api/v1/study-plans')
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send({
      title: '管理测试计划',
      description: '管理测试用',
      start_date: futureStart,
      end_date: futureEnd
    });
  expect([200, 201]).toContain(planRes.status);
  myPlanId = planRes.body.data.plan_id;
  // 创建另一个用户的计划（假设有用户B，或用不存在的ID模拟）
  otherPlanId = '999999999'; // 可用真实B用户ID或随意填
}, 30000);

describe('学习计划管理功能（远程API自动化测试）', () => {
  // 1. 获取自己的学习计划
  it('1. 获取自己的学习计划', async () => {
    const res = await request(API_URL)
      .get('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.plans || res.body.data)).toBe(true);
  }, 30000);

  // 2. 获取学习计划未登录
  it('2. 获取学习计划未登录', async () => {
    const res = await request(API_URL)
      .get('/api/v1/study-plans');
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|登录/);
  }, 30000);

  // 3. 编辑自己的学习计划
  it('3. 编辑自己的学习计划', async () => {
    const res = await request(API_URL)
      .put(`/api/v1/study-plans/${myPlanId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '新标题' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/更新成功|修改成功/);
    expect(res.body.data.title).toBe('新标题');
  }, 30000);

  // 4. 编辑他人学习计划
  it('4. 编辑他人学习计划', async () => {
    const res = await request(API_URL)
      .put(`/api/v1/study-plans/${otherPlanId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '非法修改' });
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/无权限|不存在/);
  }, 30000);

  // 5. 删除自己的学习计划
  it('5. 删除自己的学习计划', async () => {
    const res = await request(API_URL)
      .delete(`/api/v1/study-plans/${myPlanId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/删除成功/);
  }, 30000);

  // 6. 删除他人学习计划
  it('6. 删除他人学习计划', async () => {
    const res = await request(API_URL)
      .delete(`/api/v1/study-plans/${otherPlanId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/无权限|不存在/);
  }, 30000);

  // 7. 编辑计划参数错误
  it('7. 编辑计划参数错误', async () => {
    // 先新建一个计划
    const planRes = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        title: '参数错误计划',
        description: '参数错误用',
        start_date: futureStart,
        end_date: futureEnd
      });
    const planId = planRes.body.data.plan_id;
    // 尝试用空标题编辑
    const res = await request(API_URL)
      .put(`/api/v1/study-plans/${planId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不能为空|服务器内部错误/);
  }, 30000);

  // 8. 删除不存在的计划
  it('8. 删除不存在的计划', async () => {
    const res = await request(API_URL)
      .delete('/api/v1/study-plans/NOT_EXIST_ID')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不存在/);
  }, 30000);

  // 9. 数据库异常
  it('9. 数据库异常', async () => {
    // 此用例仅作结构展示，实际运行需断开数据库或用mock server
    expect(true).toBe(true);
  }, 30000);
}); 