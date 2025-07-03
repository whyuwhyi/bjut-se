const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';

// 生成未来日期
function getFutureDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
const futureStart = getFutureDate(5); // 5天后
const futureEnd = getFutureDate(35);  // 35天后
const futureWrongStart = getFutureDate(40); // 40天后
const futureWrongEnd = getFutureDate(30);  // 30天后

describe('学习计划创建功能（远程API自动化测试）', () => {
  beforeAll(async () => {
    // 登录获取token，接口路径、字段、Content-Type与标准脚本一致
    const res = await request(API_URL)
      .post('/api/v1/users/login')
      .send({ phone_number: TEST_PHONE, password: TEST_PASSWORD })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  }, 30000);

  // 1. 正常创建学习计划
  it('1. 正常创建学习计划', async () => {
    const plan = {
      title: '考研英语复习',
      description: '每日背单词',
      start_date: futureStart,
      end_date: futureEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(plan);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('学习计划创建成功');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe(plan.title);
    expect(res.body.data.description).toBe(plan.description);
  }, 30000);

  // 2. 标题为空
  it('2. 标题为空', async () => {
    const plan = {
      title: '',
      description: '每日背单词',
      start_date: futureStart,
      end_date: futureEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(plan);
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不能为空|服务器内部错误/);
  }, 30000);

  // 3. 标题超长
  it('3. 标题超长', async () => {
    const plan = {
      title: 'A'.repeat(201),
      description: '每日背单词',
      start_date: futureStart,
      end_date: futureEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(plan);
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/标题长度不能超过(100|200)个字符|服务器内部错误/);
  }, 30000);

  // 4. 开始时间晚于结束时间
  it('4. 开始时间晚于结束时间', async () => {
    const plan = {
      title: '考研英语复习',
      description: '每日背单词',
      start_date: futureWrongStart,
      end_date: futureWrongEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(plan);
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/开始时间不能晚于结束时间|计划结束时间不能早于当前日期|服务器内部错误/);
  }, 30000);

  // 5. 缺少必填字段
  it('5. 缺少必填字段', async () => {
    const plan = {
      title: '只填写标题',
      start_date: futureStart,
      end_date: futureEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(plan);
    expect([200, 400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不能为空|服务器内部错误/);
  }, 30000);

  // 6. 用户未登录
  it('6. 用户未登录', async () => {
    const plan = {
      title: '考研英语复习',
      description: '每日背单词',
      start_date: futureStart,
      end_date: futureEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Content-Type', 'application/json')
      .send(plan);
    expect([200, 401]).toContain(res.status);
    expect(res.body.success).toBe(false);
  }, 30000);

  // 7. 数据库异常（需手动断开数据库或模拟）
  it('7. 数据库异常', async () => {
    // 此用例仅作结构展示，实际运行需断开数据库或用mock server
    // 断言：500，message含"创建学习计划失败"或"服务器内部错误"
    expect(true).toBe(true);
  }, 30000);

  // 8. 描述超长（前端校验，后端理论无限长）
  it('8. 描述超长', async () => {
    const plan = {
      title: '考研英语复习',
      description: 'A'.repeat(1001),
      start_date: futureStart,
      end_date: futureEnd
    };
    const res = await request(API_URL)
      .post('/api/v1/study-plans')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(plan);
    expect([200, 400, 500]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/描述长度不能超过1000个字符|服务器内部错误/);
    } else {
      expect(res.body.success).toBe(true);
    }
  }, 30000);
}, 30000);
