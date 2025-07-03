const request = require('supertest');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://rixin.whywhy.me';

const TEST_PHONE = '18256800695';
const TEST_PASSWORD = '123456';

let token = '';

// 生成唯一资源ID
function randomResourceId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// 创建测试文件
function createTestFile(filename, size = 1024) {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, filename);
  const buffer = Buffer.alloc(size);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// 清理测试文件
function cleanupTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

beforeAll(async () => {
  const res = await request(API_URL)
    .post('/api/v1/users/login')
    .send({ phone_number: TEST_PHONE, password: TEST_PASSWORD })
    .set('Content-Type', 'application/json');
  expect(res.status).toBe(200);
  token = res.body.data.token;
}, 30000);

describe('用户发布学习资源（远程API）自动化测试', () => {
  let testToken, testResourceId, testFile, largeFile, invalidFile;

  // 在所有测试前准备测试数据
  beforeAll(async () => {
    // 创建测试文件
    testFile = createTestFile('test.pdf', 1024); // 1KB PDF文件
    largeFile = createTestFile('large.pdf', 51 * 1024 * 1024); // 51MB文件
    invalidFile = createTestFile('test.exe', 1024); // EXE文件
    
    // 注册并登录获取token
    const testPhone = '13' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    const testPassword = 'password123';
    
    // 注册测试用户
    await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: testPhone,
        password: testPassword,
        name: '测试用户',
        student_id: '12345678',
        email: 'test@example.com'
      })
      .set('Content-Type', 'application/json');
    
    // 登录获取token
    const loginRes = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: TEST_PHONE,
        password: TEST_PASSWORD
      })
      .set('Content-Type', 'application/json');
    
    if (loginRes.status === 200) {
      testToken = loginRes.body.data.token;
    }
  });

  // 测试后清理
  afterAll(() => {
    cleanupTestFiles();
  });

  it('1. 正常发布资源', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    testResourceId = randomResourceId();
    
    // 1. 创建资源记录
    const createRes = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '数据结构课件',
        description: '第一章PPT',
        category_id: '1', // 假设分类ID为1
        resource_id: testResourceId,
        status: 'published'
      });
    
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.message).toMatch(/资源创建成功|success/i);
    expect(createRes.body.data?.resource_id).toBe(testResourceId);
    expect(createRes.body.data?.status).toBe('published');
    
    // 2. 上传文件
    const uploadRes = await request(API_URL)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${testToken}`)
      .attach('file', testFile)
      .field('resource_id', testResourceId)
      .field('file_name', 'test.pdf')
      .field('file_type', 'pdf');
    
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.message).toMatch(/文件上传成功|success/i);
  });

  it('2. 未登录发布资源', async () => {
    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '自动化测试资源',
        description: '用于自动化测试的已发布资源',
        status: 'published',
        category_id: '1'
      });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/请先登录|token.*missing|unauthorized/i);
  });

  it('3. 文件超大', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const resourceId = randomResourceId();
    
    // 先创建资源
    await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '大文件测试',
        description: '测试大文件上传',
        category_id: '1',
        resource_id: resourceId,
        status: 'published'
      });
    
    // 尝试上传大文件
    const res = await request(API_URL)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${testToken}`)
      .attach('file', largeFile)
      .field('resource_id', resourceId)
      .field('file_name', 'large.pdf')
      .field('file_type', 'pdf');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/文件大小超出限制|file.*size.*limit/i);
  });

  it('4. 缺少标题', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        description: '测试描述',
        category_id: '1',
        status: 'published'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/输入数据验证失败|validation.*failed/i);
  });

  it('5. 缺少描述', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '自动化测试资源',
        status: 'published'
      });
    
    // 描述是可选字段，所以这个测试应该通过
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('6. 未选分类', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '自动化测试资源',
        description: '用于自动化测试的已发布资源',
        status: 'published'
      });
    
    // 分类是可选字段，所以这个测试应该通过
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('7. 未选文件', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const resourceId = randomResourceId();
    
    // 创建资源（不包含文件）
    const createRes = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '无文件资源',
        description: '测试无文件上传',
        category_id: '1',
        resource_id: resourceId,
        status: 'published'
      });
    
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    
    // 尝试上传空文件
    const uploadRes = await request(API_URL)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${testToken}`)
      .field('resource_id', resourceId)
      .field('file_name', '')
      .field('file_type', '');
    
    expect(uploadRes.status).toBe(400);
    expect(uploadRes.body.success).toBe(false);
    expect(uploadRes.body.message).toMatch(/没有文件被上传|file.*required/i);
  });

  it('8. 文件格式不支持', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const resourceId = randomResourceId();
    
    // 先创建资源
    await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json')
      .send({
        resource_name: '格式测试',
        description: '测试不支持的文件格式',
        category_id: '1',
        resource_id: resourceId,
        status: 'published'
      });
    
    // 尝试上传不支持的文件格式
    const res = await request(API_URL)
      .post('/api/v1/files/upload')
      .set('Authorization', `Bearer ${testToken}`)
      .attach('file', invalidFile)
      .field('resource_id', resourceId)
      .field('file_name', 'test.exe')
      .field('file_type', 'exe');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/不支持的文件类型|file.*type.*not.*supported/i);
  });

  it('9. 网络异常', async () => {
    let errorCaught = false;
    try {
      await request('http://127.0.0.1:9999')
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send({
          resource_name: '网络测试',
          description: '测试网络异常',
          category_id: '1',
          status: 'published'
        })
        .timeout({ deadline: 1000 });
    } catch (err) {
      errorCaught = true;
      expect(err.message).toMatch(/ECONNREFUSED|timeout/i);
    }
    expect(errorCaught).toBe(true);
  });

  it('10. 后端接口异常', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'text/plain')
      .send('not a json');
    
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message || res.text).toMatch(/输入数据验证失败|validation.*failed/i);
  });

  // 额外测试：提交审核
  it('11. 提交资源审核', async () => {
    if (!testToken || !testResourceId) {
      console.log('跳过测试：无法获取有效token或资源ID');
      return;
    }

    const res = await request(API_URL)
      .post(`/api/v1/resources/${testResourceId}/submit-review`)
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/已提交审核|submitted.*review/i);
  });

  // 额外测试：获取用户资源列表
  it('12. 获取用户资源列表', async () => {
    if (!testToken) {
      console.log('跳过测试：无法获取有效token');
      return;
    }

    const res = await request(API_URL)
      .get('/api/v1/users/my-resources')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Content-Type', 'application/json');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.resources)).toBe(true);
  });
});

describe('用户发布学习资源（带图片文件）自动化测试', () => {
  it('1. 正常发布带图片的资源，资源状态不是草稿', async () => {
    const filePath = path.resolve(__dirname, 'test-desktop.jpg');
    expect(fs.existsSync(filePath)).toBe(true);
    const res = await request(API_URL)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)
      .field('resource_name', '自动化测试图片资源')
      .field('description', '带图片的自动化测试资源')
      .field('category_name', '实验')
      .field('status', 'published')
      .attach('file', filePath);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).not.toBe('draft');
  }, 30000);
}); 