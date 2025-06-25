# 🚀 快速部署指南

## 步骤1：准备云服务器

```bash
# 1. 登录你的云服务器
ssh root@your-server-ip

# 2. 安装Docker
curl -fsSL https://get.docker.com | sh

# 3. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 创建部署用户
useradd -m github-deploy
usermod -aG docker github-deploy

# 5. 生成SSH密钥
su - github-deploy
ssh-keygen -t rsa -b 4096 -C "github-deploy"
# 按3次回车（使用默认设置）

# 6. 设置SSH认证
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 7. 显示私钥（复制到GitHub Secrets）
cat ~/.ssh/id_rsa
```

## 步骤2：配置GitHub Secrets

在GitHub仓库 **Settings > Secrets and variables > Actions** 中添加：

| Secret名称 | 值 | 说明 |
|-----------|---|-----|
| `SERVER_HOST` | `your-server-ip` | 云服务器IP地址 |
| `SERVER_USER` | `github-deploy` | SSH用户名 |
| `SERVER_SSH_KEY` | `私钥内容` | 上面生成的完整私钥 |

## 步骤3：推送代码触发部署

```bash
# 在本地项目目录
git add .
git commit -m "Initial deployment setup"
git push origin main
```

## 步骤4：监控部署

1. **查看GitHub Actions**：
   - 进入GitHub仓库页面
   - 点击 "Actions" 标签
   - 查看 "Simple Deploy" 工作流状态

2. **服务器端监控**：
```bash
# 登录服务器查看
ssh github-deploy@your-server-ip
cd /opt/wechat-education/current

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试健康检查
curl http://localhost/health
```

## 🎯 部署完成后的访问

- **H5应用**: `http://your-server-ip`
- **API健康检查**: `http://your-server-ip/api/v1/health`
- **用户注册**: `http://your-server-ip/api/v1/users/register`
- **用户登录**: `http://your-server-ip/api/v1/users/login`

## 📱 测试登录

在H5界面测试：
- 手机号: `13912345678`
- 密码: `password123`

## 🔄 后续更新

每次代码更新，只需要：
```bash
git add .
git commit -m "你的更新说明"
git push origin main
```

GitHub Actions会自动：
1. 构建新版本
2. 部署到服务器
3. 执行健康检查
4. 发送部署通知

## 🛠️ 故障排除

### 部署失败检查清单

1. **GitHub Secrets是否正确配置**
2. **服务器SSH连接是否正常**
3. **服务器Docker服务是否运行**
4. **服务器端口80是否开放**

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs backend
docker-compose logs nginx

# 清理并重新部署
docker-compose down
docker-compose up -d --build

# 检查端口
sudo netstat -tulpn | grep :80
```

## ⚡ 手动部署（备用方案）

如果GitHub Actions部署失败，可以手动部署：

```bash
# 登录服务器
ssh github-deploy@your-server-ip

# 手动部署
cd /opt/wechat-education
git clone https://github.com/your-username/wechat_software.git manual-deploy
cd manual-deploy

# 生成依赖文件
npm install
cd backend && npm install && cd ..

# 创建环境配置
cp .env.production .env

# 启动服务
docker-compose up -d --build
```

## 🎉 成功标志

部署成功后，你会看到：
- GitHub Actions显示绿色 ✅
- `curl http://your-server-ip/health` 返回 "healthy"
- 可以访问H5界面进行登录注册

## 📞 需要帮助？

如果遇到问题：
1. 检查GitHub Actions日志
2. 检查服务器Docker日志
3. 确认服务器防火墙设置
4. 验证SSH连接配置

现在你可以直接开始部署了！🚀