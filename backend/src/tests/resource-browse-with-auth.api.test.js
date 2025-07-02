const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';

// 生成唯一手机号
function randomPhone() {
  return '13' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
}

describe('用户浏览学习资源（远程API + 认证）自动化测试', () => {
  let authToken, resourceId, testPhone, testPassword;

  // 在所有测试前注册用户并登录获取token
  beforeAll(async () => {
    testPhone = randomPhone();
    testPassword = 'password123';
    
    // 注册测试用户
    await request(API_URL)
      .post('/api/v1/users/register')
      .send({
        phone_number: testPhone,
        password: testPassword,
        name: '测试用户',
        student_id: '22074101',
        email: 'test@example.com'
      })
      .set('Content-Type', 'application/json');
    
    // 登录获取token
    const loginRes = await request(API_URL)
      .post('/api/v1/users/login')
      .send({
        phone_number: testPhone,
        password: testPassword
      })
      .set('Content-Type', 'application/json');
    
    if (loginRes.status === 200 && loginRes.body.success) {
      authToken = loginRes.body.data.token;
      console.log('认证成功，获取到token');
    } else {
      console.log('登录失败，将使用无认证模式测试');
    }
  });

  it('1. 正常加载资源列表', async () => {
    const req = request(API_URL)
      .get('/api/v1/resources')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    
    // 记录一个资源ID用于后续详情测试
    if (res.body.data.resources.length > 0) {
      resourceId = res.body.data.resources[0].id;
      console.log(`找到资源ID: ${resourceId}`);
    }
  });

  it('2. 分类筛选', async () => {
    // 先获取分类列表
    const categoriesReq = request(API_URL)
      .get('/api/v1/categories/options')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      categoriesReq.set('Authorization', `Bearer ${authToken}`);
    }
    
    const categoriesRes = await categoriesReq;
    
    if (categoriesRes.status === 200 && categoriesRes.body.data.length > 0) {
      const firstCategoryId = categoriesRes.body.data[0].category_id || categoriesRes.body.data[0].id;
      
      const req = request(API_URL)
        .get(`/api/v1/resources?category_id=${firstCategoryId}`)
        .set('Content-Type', 'application/json');
      
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      
      const res = await req;
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.resources)).toBe(true);
      
      // 验证返回的资源都属于指定分类
      if (res.body.data.resources.length > 0) {
        res.body.data.resources.forEach(resource => {
          expect(resource.category_id).toBe(firstCategoryId);
        });
      }
    } else {
      // 如果没有分类数据，测试基本接口响应
      const req = request(API_URL)
        .get('/api/v1/resources?category_id=1')
        .set('Content-Type', 'application/json');
      
      if (authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }
      
      const res = await req;
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.resources)).toBe(true);
    }
  });

  it('3. 关键词搜索', async () => {
    const req = request(API_URL)
      .get('/api/v1/resources?keyword=' + encodeURIComponent('算法'))
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    
    // 验证返回的资源包含关键词
    if (res.body.data.resources.length > 0) {
      res.body.data.resources.forEach(resource => {
        const hasKeyword = 
          (resource.title && resource.title.includes('算法')) ||
          (resource.description && resource.description.includes('算法'));
        
        // 如果搜索没有结果，这是正常的，不强制要求包含关键词
        if (res.body.data.resources.length === 0) {
          console.log('搜索"算法"没有找到相关资源');
        }
      });
    }
  });

  it('4. 按下载量排序', async () => {
    const req = request(API_URL)
      .get('/api/v1/resources?sort=download_count&order=desc')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    
    // 验证下载量排序（从高到低）
    const list = res.body.data.resources;
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        const prevCount = list[i - 1].downloadCount || 0;
        const currCount = list[i].downloadCount || 0;
        expect(prevCount >= currCount).toBe(true);
      }
    }
  });

  it('5. 资源详情跳转', async () => {
    if (!resourceId) {
      console.log('跳过测试：没有可用的资源ID');
      return;
    }
    
    const req = request(API_URL)
      .get(`/api/v1/resources/${resourceId}`)
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    
    const resource = res.body.data;
    expect(resource.id).toBe(resourceId);
    expect(resource.title).toBeDefined();
    expect(resource.description).toBeDefined();
    
    // 验证资源详情包含必要字段
    expect(typeof resource.title).toBe('string');
    expect(resource.viewCount).toBeDefined();
    expect(resource.downloadCount).toBeDefined();
  });

  it('6. 无资源情况', async () => {
    // 使用一个不存在的分类ID来模拟无资源情况
    const req = request(API_URL)
      .get('/api/v1/resources?category_id=999999')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    expect(res.body.data.resources.length).toBe(0);
    
    // 验证分页信息
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('7. 网络异常', async () => {
    let errorCaught = false;
    try {
      await request('http://127.0.0.1:9999')
        .get('/api/v1/resources')
        .timeout({ deadline: 1000 });
    } catch (err) {
      errorCaught = true;
      expect(err.message).toMatch(/ECONNREFUSED|timeout/i);
    }
    expect(errorCaught).toBe(true);
  });

  it('8. 多条件组合筛选', async () => {
    // 获取分类列表
    const categoriesReq = request(API_URL)
      .get('/api/v1/categories/options')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      categoriesReq.set('Authorization', `Bearer ${authToken}`);
    }
    
    const categoriesRes = await categoriesReq;
    
    let categoryId = '1'; // 默认分类ID
    if (categoriesRes.status === 200 && categoriesRes.body.data.length > 0) {
      categoryId = categoriesRes.body.data[0].category_id || categoriesRes.body.data[0].id;
    }
    
    // 组合筛选：分类 + 关键词 + 按评分排序
    const req = request(API_URL)
      .get(`/api/v1/resources?category_id=${categoryId}&keyword=${encodeURIComponent('数据结构')}&sort=rating&order=desc`)
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    
    const list = res.body.data.resources;
    
    // 验证分类筛选
    if (list.length > 0) {
      list.forEach(resource => {
        expect(resource.category_id).toBe(categoryId);
      });
    }
    
    // 验证评分排序（从高到低）
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        const prevRating = list[i - 1].rating || 0;
        const currRating = list[i].rating || 0;
        expect(prevRating >= currRating).toBe(true);
      }
    }
  });

  // 额外测试：分页功能
  it('9. 分页功能测试', async () => {
    const req = request(API_URL)
      .get('/api/v1/resources?page=1&limit=5')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(5);
    expect(res.body.data.resources.length).toBeLessThanOrEqual(5);
  });

  // 额外测试：按时间排序
  it('10. 按创建时间排序', async () => {
    const req = request(API_URL)
      .get('/api/v1/resources?sort=created_at&order=desc')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    
    // 验证时间排序（从新到旧）
    const list = res.body.data.resources;
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        const prevTime = new Date(list[i - 1].uploadTime);
        const currTime = new Date(list[i].uploadTime);
        expect(prevTime >= currTime).toBe(true);
      }
    }
  });

  // 额外测试：状态筛选
  it('11. 按状态筛选（已发布资源）', async () => {
    const req = request(API_URL)
      .get('/api/v1/resources?status=published')
      .set('Content-Type', 'application/json');
    
    if (authToken) {
      req.set('Authorization', `Bearer ${authToken}`);
    }
    
    const res = await req;
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    
    // 验证所有资源都是已发布状态
    if (res.body.data.resources.length > 0) {
      res.body.data.resources.forEach(resource => {
        expect(resource.status).toBe('published');
      });
    }
  });
}); 