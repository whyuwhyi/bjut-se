const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';

// 生成唯一手机号/学号
function randomPhone() {
  return '13' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
}
function randomStudentId() {
  return Math.floor(10000000 + Math.random() * 89999999).toString();
}

describe('用户注册接口（远程API）自动化测试', () => {
  let phone, studentId;

  beforeEach(() => {
    phone = randomPhone();
    studentId = randomStudentId();
  });

  it('1. 正常注册用户', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: phone,
        password: 'password123',
        name: '张三',
        student_id: studentId,
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/注册成功|success/i);
    expect(res.body.data?.token).toBeDefined();
  });

  it('2. 手机号已存在', async () => {
    // 先注册一次
    await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: phone,
        password: 'password123',
        name: '张三',
        student_id: studentId,
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    // 再注册同手机号
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: phone,
        password: 'password123',
        name: '李四',
        student_id: randomStudentId(),
        email: 'lisi@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/用户已存在|exist/i);
  });

  it('3. 手机号格式错误', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: '1234567890',
        password: 'password123',
        name: '张三',
        student_id: randomStudentId(),
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/手机号格式不正确|phone.*invalid/i);
  });

  it('4. 密码长度不足', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: '123',
        name: '张三',
        student_id: randomStudentId(),
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/密码长度必须在6-32位之间|password.*length/i);
  });

  it('5. 密码长度超长', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: '123456789012345678901234567890123',
        name: '张三',
        student_id: randomStudentId(),
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/密码长度必须在6-32位之间|password.*length/i);
  });

  it('6. 缺少必填字段（姓名）', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: 'password123',
        student_id: randomStudentId(),
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/姓名长度必须在1-50个字符之间|name.*length/i);
  });

  it('7. 学号格式错误', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: 'password123',
        name: '张三',
        student_id: 'invalid',
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/学号格式不正确|student.*invalid/i);
  });

  it('8. 学号已被使用', async () => {
    const sid = randomStudentId();
    // 先注册一次
    await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: 'password123',
        name: '张三',
        student_id: sid,
        email: 'zhangsan@example.com'
      })
      .set('Content-Type', 'application/json');
    // 再注册同学号
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: 'password123',
        name: '李四',
        student_id: sid,
        email: 'lisi@example.com'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/学号已被使用|student.*used/i);
  });

  it('9. 邮箱格式错误', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: randomPhone(),
        password: 'password123',
        name: '张三',
        student_id: randomStudentId(),
        email: 'invalid-email'
      })
      .set('Content-Type', 'application/json');
    expect(res.body.message).toMatch(/邮箱格式不正确|email.*invalid/i);
  });

  it('10. 网络异常', async () => {
    let errorCaught = false;
    try {
      await request('http://127.0.0.1:9999')
        .post('/api/v1/users/register')
        .send({
          phone_number: randomPhone(),
          password: 'password123',
          name: '张三',
          student_id: randomStudentId(),
          email: 'zhangsan@example.com'
        })
        .timeout({ deadline: 1000 });
    } catch (err) {
      errorCaught = true;
      expect(err.message).toMatch(/ECONNREFUSED|timeout/i);
    }
    expect(errorCaught).toBe(true);
  });

  it('11. 后端接口异常', async () => {
    const res = await request(API_URL)
      .post('/api/v1/users/register')
      .set('Content-Type', 'text/plain')
      .send('not a json');
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.message || res.text).toMatch(/注册失败|error|fail/i);
  });
}); 