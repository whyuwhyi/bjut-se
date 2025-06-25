# 部署指南

## 开发环境部署

### 1. 本地开发

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd wechat_software

# 2. 启动开发环境（一键启动）
./dev.sh

# 3. 访问应用
# 前端H5: http://localhost:8080
# 后端API: http://localhost:3000
```

### 2. 手动启动

#### 前端开发
```bash
# 安装依赖
npm install

# 启动H5开发服务器
npm run dev:h5

# 构建H5生产版本
npm run build:h5
```

#### 后端开发
```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库等信息

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

## 生产环境部署

### 1. 云服务器部署（推荐）

#### 服务器要求
- Ubuntu 20.04+ / CentOS 8+
- 2GB+ RAM
- 20GB+ 磁盘空间
- Docker & Docker Compose

#### 部署步骤

```bash
# 1. 登录服务器
ssh root@your-server-ip

# 2. 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 创建部署目录
sudo mkdir -p /opt/wechat-education
cd /opt/wechat-education

# 5. 克隆项目代码
git clone <your-repo-url> .

# 6. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置生产环境参数

# 7. 启动服务
./deploy.sh deploy

# 8. 检查服务状态
./deploy.sh status
```

#### 环境变量配置
```bash
# .env 文件示例
NODE_ENV=production

# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=wechat_education
MYSQL_USER=appuser
MYSQL_PASSWORD=your_secure_app_password

# JWT配置
JWT_SECRET=your_very_secure_jwt_secret_key

# 端口配置
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
BACKEND_PORT=3000
```

### 2. GitHub Actions自动部署

#### 配置Repository Secrets

在GitHub仓库的Settings > Secrets中添加以下密钥：

```
SERVER_HOST=your.server.ip.address
SERVER_USER=root
SERVER_SSH_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
SERVER_PORT=22 (可选，默认22)
```

#### 自动部署流程

1. 推送代码到`main`分支
2. GitHub Actions自动运行测试
3. 构建Docker镜像并推送到GitHub Container Registry
4. SSH到服务器执行部署脚本
5. 自动健康检查和回滚

## 服务管理

### 常用命令

```bash
# 查看服务状态
./deploy.sh status
docker-compose ps

# 查看日志
./deploy.sh logs
docker-compose logs -f [service_name]

# 重启服务
./deploy.sh restart
docker-compose restart [service_name]

# 停止服务
./deploy.sh stop
docker-compose down

# 更新应用
git pull
docker-compose build
docker-compose up -d

# 数据库备份
docker-compose exec mysql mysqldump -u root -p wechat_education > backup_$(date +%Y%m%d).sql

# 数据库恢复
docker-compose exec -i mysql mysql -u root -p wechat_education < backup_file.sql
```

### 监控和维护

#### 日志管理
```bash
# 查看应用日志
docker-compose logs -f backend
docker-compose logs -f nginx

# 清理日志
docker system prune -f
```

#### 性能监控
```bash
# 查看资源使用
docker stats

# 查看磁盘使用
df -h
docker system df
```

#### 安全更新
```bash
# 更新系统
sudo apt update && sudo apt upgrade

# 更新Docker镜像
docker-compose pull
docker-compose up -d
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库状态
docker-compose logs mysql

# 重启数据库
docker-compose restart mysql
```

#### 2. 前端页面无法访问
```bash
# 检查Nginx状态
docker-compose logs nginx

# 检查端口是否被占用
netstat -tulpn | grep :80
```

#### 3. API请求失败
```bash
# 检查后端日志
docker-compose logs backend

# 检查后端健康状态
curl http://localhost:3000/api/v1/health
```

#### 4. 内存不足
```bash
# 清理无用镜像
docker image prune -f

# 清理无用容器
docker container prune -f

# 清理无用数据卷
docker volume prune -f
```

### 性能优化

#### 1. 数据库优化
```sql
-- 在MySQL中执行
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
```

#### 2. 应用优化
```bash
# 启用Redis缓存
docker-compose up -d redis

# 配置Nginx缓存
# 编辑 nginx/conf.d/default.conf
```

## 备份和恢复

### 自动备份脚本
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD wechat_education > $BACKUP_DIR/db_$DATE.sql

# 文件备份
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
```

### 定时备份
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点自动备份
0 2 * * * /opt/wechat-education/backup.sh
```

## 扩展部署

### 多服务器部署
1. 使用Docker Swarm或Kubernetes
2. 分离数据库服务器
3. 使用负载均衡器
4. 配置CDN加速

### HTTPS配置
```bash
# 使用Let's Encrypt
sudo apt install certbot

# 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 配置Nginx HTTPS
# 编辑 nginx/conf.d/default.conf 添加SSL配置
```

## 联系支持

如有部署问题，请：
1. 查看日志文件
2. 检查GitHub Issues
3. 联系开发团队