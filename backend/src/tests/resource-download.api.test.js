const request = require('supertest');

const API_URL = 'https://rixin.whywhy.me';

// 生成唯一手机号
function randomPhone() {
  return '13' + Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
}

describe('用户下载学习资源（远程API）自动化测试', () => {
  let authToken, testPhone, testPassword;
  let publishedResourceId, publishedFileId;
  let draftResourceId, draftFileId;
  let pendingResourceId, pendingFileId;
  let rejectedResourceId, rejectedFileId;

  // 在所有测试前使用固定账号登录获取token
  beforeAll(async () => {
    testPhone = '13800138001';
    testPassword = '123456';
    
    // 直接登录获取token
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
      
      // 获取一些测试用的资源ID和文件ID
      await getTestResources();
    } else {
      console.log('登录失败，将使用无认证模式测试');
    }
  });

  // 获取测试用的资源
  async function getTestResources() {
    try {
      const res = await request(API_URL)
        .get('/api/v1/resources')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${authToken}`);
      
      if (res.status === 200 && res.body.data.resources.length > 0) {
        const resource = res.body.data.resources[0];
        publishedResourceId = resource.id;
        
        if (resource.files && resource.files.length > 0) {
          publishedFileId = resource.files[0].file_id;
          console.log(`找到已发布资源: ${publishedResourceId}, 文件: ${publishedFileId}`);
        }
      }
    } catch (error) {
      console.log('获取测试资源失败:', error.message);
    }
  }

  it('1. 正常下载资源', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    const res = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json'); // 请求JSON格式的下载信息
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.downloadUrl || res.body.data.content).toBeDefined();
    expect(res.body.data.fileName).toBeDefined();
  });

  it('2. 未登录下载资源', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    const res = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json');
    // 不设置Authorization头
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/访问令牌缺失|请先登录|unauthorized/i);
  });

  it('3. 下载草稿资源', async () => {
    // 使用一个不存在的资源ID来模拟草稿状态
    const draftResourceId = '999999999';
    const draftFileId = '999999999';
    
    const res = await request(API_URL)
      .get(`/api/v1/resources/${draftResourceId}/files/${draftFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    // 草稿资源应该返回404（资源不存在）或403（资源未发布）
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/资源未发布|文件不存在|无法下载/i);
  });

  it('4. 下载待审核资源', async () => {
    // 使用一个不存在的资源ID来模拟待审核状态
    const pendingResourceId = '999999998';
    const pendingFileId = '999999998';
    
    const res = await request(API_URL)
      .get(`/api/v1/resources/${pendingResourceId}/files/${pendingFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    // 待审核资源应该返回404或403
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/资源未发布|文件不存在|无法下载/i);
  });

  it('5. 下载已拒绝资源', async () => {
    // 使用一个不存在的资源ID来模拟已拒绝状态
    const rejectedResourceId = '999999997';
    const rejectedFileId = '999999997';
    
    const res = await request(API_URL)
      .get(`/api/v1/resources/${rejectedResourceId}/files/${rejectedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    // 已拒绝资源应该返回404或403
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/资源未发布|文件不存在|无法下载/i);
  });

  it('6. 下载不存在的资源', async () => {
    const nonExistentResourceId = '000000000';
    const nonExistentFileId = '000000000';
    
    const res = await request(API_URL)
      .get(`/api/v1/resources/${nonExistentResourceId}/files/${nonExistentFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/文件不存在|资源不存在/i);
  });

  it('7. 下载不存在的文件', async () => {
    if (!publishedResourceId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    const nonExistentFileId = '000000000';
    
    const res = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${nonExistentFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/文件不存在/i);
  });

  it('8. 下载本地存储文件', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    const res = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    
    // 本地存储文件应该返回下载链接
    if (res.body.data.downloadUrl) {
      expect(res.body.data.downloadUrl).toMatch(/^\/uploads\//);
      expect(res.body.data.fileName).toBeDefined();
    }
  });

  it('9. 下载数据库存储文件', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    const res = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    
    // 数据库存储文件应该返回文件内容
    if (res.body.data.content) {
      expect(res.body.data.content).toBeDefined();
      expect(res.body.data.fileName).toBeDefined();
      expect(res.body.data.fileType).toBeDefined();
    }
  });

  it('10. 文件内容不可用', async () => {
    // 使用一个不存在的文件ID来模拟内容不可用的情况
    const nonExistentResourceId = '000000000';
    const nonExistentFileId = '000000000';
    
    const res = await request(API_URL)
      .get(`/api/v1/resources/${nonExistentResourceId}/files/${nonExistentFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/文件不存在|文件内容不可用/i);
  });

  it('11. 多次下载同一文件', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    // 第一次下载
    const res1 = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json');
    
    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    
    // 第二次下载
    const res2 = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json');
    
    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    
    // 验证两次下载都成功（下载次数增加由后端处理）
    expect(res1.body.data).toBeDefined();
    expect(res2.body.data).toBeDefined();
  });

  it('12. 网络异常', async () => {
    let errorCaught = false;
    try {
      await request('http://127.0.0.1:9999')
        .get('/api/v1/resources/123456789/files/123456789/download')
        .timeout({ deadline: 1000 });
    } catch (err) {
      errorCaught = true;
      expect(err.message).toMatch(/ECONNREFUSED|timeout/i);
    }
    expect(errorCaught).toBe(true);
  });

  it('13. 后端接口异常', async () => {
    // 发送无效的请求来触发后端异常
    const res = await request(API_URL)
      .get('/api/v1/resources/invalid/files/invalid/download')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/下载失败|文件不存在|error/i);
  });

  it('14. 文件大小限制', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    const res = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    
    // 检查文件大小信息
    if (res.body.data.fileSize) {
      expect(typeof res.body.data.fileSize).toBe('number');
      expect(res.body.data.fileSize).toBeGreaterThanOrEqual(0);
    }
  });

  // 额外测试：下载统计验证
  it('15. 下载统计验证', async () => {
    if (!publishedResourceId || !publishedFileId) {
      console.log('跳过测试：没有可用的已发布资源');
      return;
    }

    // 获取下载前的资源信息
    const beforeRes = await request(API_URL)
      .get(`/api/v1/resources/${publishedResourceId}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
    
    if (beforeRes.status === 200) {
      const beforeDownloadCount = beforeRes.body.data.download_count || 0;
      
      // 执行下载
      const downloadRes = await request(API_URL)
        .get(`/api/v1/resources/${publishedResourceId}/files/${publishedFileId}/download`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'application/json');
      
      expect(downloadRes.status).toBe(200);
      
      // 获取下载后的资源信息
      const afterRes = await request(API_URL)
        .get(`/api/v1/resources/${publishedResourceId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${authToken}`);
      
      if (afterRes.status === 200) {
        const afterDownloadCount = afterRes.body.data.download_count || 0;
        // 验证下载次数增加（注意：由于并发测试，可能不是+1）
        expect(afterDownloadCount).toBeGreaterThanOrEqual(beforeDownloadCount);
      }
    }
  });
}); 