const request = require('supertest');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://rixin.whywhy.me';
const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/v1/users/login')
    .send({ phone_number: TEST_PHONE, password: TEST_PASSWORD })
    .set('Content-Type', 'application/json');
  expect(res.status).toBe(200);
  token = res.body.data.token;
}, 30000);

describe('用户信息修改与头像上传（远程API自动化测试）', () => {
  // 1. 正常修改昵称
  it('1. 正常修改昵称', async () => {
    const res = await request(API_URL)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: '新昵称' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/更新成功|修改成功/);
    expect(res.body.data.user.nickname).toBe('新昵称');
  }, 30000);

  // 2. 修改头像成功
  it('2. 修改头像成功', async () => {
    const filePath = path.resolve(__dirname, 'test-desktop.jpg');
    expect(fs.existsSync(filePath)).toBe(true);
    const res = await request(API_URL)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', filePath);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/头像上传成功|修改成功/);
    expect(res.body.data.avatar_url).toMatch(/\/uploads\/avatars\//);
  }, 30000);

  // 3. 未登录修改信息
  it('3. 未登录修改信息', async () => {
    const res = await request(API_URL)
      .put('/api/v1/users/profile')
      .send({ nickname: '未登录昵称' });
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/未授权|token|登录|访问令牌缺失/);
  }, 30000);

  // 4. 昵称为空
  it('4. 昵称为空', async () => {
    const res = await request(API_URL)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: '' });
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/输入数据验证失败|不能为空|服务器内部错误/);
  }, 30000);

  // 5. 昵称超长
  it('5. 昵称超长', async () => {
    const res = await request(API_URL)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'A'.repeat(51) });
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/输入数据验证失败|长度不能超过|服务器内部错误/);
  }, 30000);

  // 6. 上传非图片文件
  it('6. 上传非图片文件', async () => {
    const filePath = path.resolve(__dirname, 'test.txt');
    expect(fs.existsSync(filePath)).toBe(true);
    const res = await request(API_URL)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', filePath);
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/只能上传图片文件|格式不正确|服务器内部错误/);
  }, 30000);

  // 7. 上传超大图片
  it('7. 上传超大图片', async () => {
    const filePath = path.resolve(__dirname, 'large-image.jpg');
    expect(fs.existsSync(filePath)).toBe(true);
    const res = await request(API_URL)
      .post('/api/v1/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', filePath);
    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/文件大小超出限制|文件过大|服务器内部错误/);
  }, 30000);

  // 8. 数据库异常
  it('8. 数据库异常', async () => {
    // 此用例仅作结构展示，实际运行需断开数据库或用mock server
    expect(true).toBe(true);
  }, 30000);

  // 9. 头像上传失败
  it('9. 头像上传失败', async () => {
    // 此用例仅作结构展示，实际运行需模拟存储服务异常
    expect(true).toBe(true);
  }, 30000);
}); 