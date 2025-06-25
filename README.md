# 🚀 日新智链平台

> 北京工业大学校园学习交流微信小程序 / H5应用

[![部署状态](https://github.com/your-username/wechat_software/workflows/Simple%20Deploy/badge.svg)](https://github.com/your-username/wechat_software/actions)

## 📖 项目简介

日新智链平台是一个专为北京工业大学师生设计的校园学习交流应用，致力于打造"以学习者为中心"的智能化校园学习社区。平台通过整合分散的校园信息资源，提供一站式的学习、交流、成长服务，促进知识共享和协作学习。

**当前版本**: 最小可运行程序（MVP），包含完整的用户注册登录功能和自动化部署流程。

## ✨ 核心功能

### 🔐 用户管理（已实现）
- ✅ 用户注册登录（手机号作为主键）
- ✅ JWT身份认证
- ✅ 密码加密存储
- ✅ 个人信息管理

### 📚 扩展功能（UI原型已完成）
- 📖 学习资源上传下载
- 💬 学术讨论发布答疑
- 📢 消息通知推送
- 📊 学习轨迹记录
- 🎯 社团活动管理

## 🛠️ 技术架构

### 前端技术栈
- **框架**: uni-app (Vue.js 2.x) - 支持H5、微信小程序等多端
- **样式**: SCSS
- **构建**: HBuilderX / Vue CLI

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **ORM**: Sequelize
- **数据库**: MySQL 8.0
- **缓存**: Redis 7
- **认证**: JWT
- **测试**: Jest + Supertest

### DevOps
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx
- **CI/CD**: GitHub Actions
- **自动部署**: SSH + Docker

## 📁 项目结构

```
wechat_software/
├── 📱 src/                        # uni-app前端源码
│   ├── pages/                     # 页面组件
│   │   ├── login/                 # 登录页 ✅
│   │   ├── register/              # 注册页 ✅
│   │   ├── index/                 # 首页
│   │   ├── resources/             # 资源管理
│   │   ├── discussion/            # 讨论区
│   │   ├── activity/              # 活动中心
│   │   └── profile/               # 个人中心
│   ├── static/                    # 静态资源
│   ├── utils/                     # 工具函数
│   └── App.vue                    # 应用入口
├── 🖥️ backend/                    # Node.js后端
│   ├── src/
│   │   ├── controllers/           # 控制器 ✅
│   │   ├── models/                # 数据模型 ✅
│   │   ├── routes/                # 路由配置 ✅
│   │   ├── middleware/            # 中间件 ✅
│   │   ├── config/                # 配置文件 ✅
│   │   └── tests/                 # 测试文件 ✅
│   └── Dockerfile                 # 后端容器配置
├── 🌐 nginx/                      # Web服务器配置
├── 🗄️ database/                   # 数据库脚本
├── 📚 doc/                        # 项目文档
├── 🤖 .github/workflows/          # CI/CD配置
├── 🐳 docker-compose.yml          # 服务编排
├── 🚀 dev.sh                      # 开发启动脚本
└── 🚀 deploy.sh                   # 生产部署脚本
```

## 🚀 快速开始

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/your-username/wechat_software.git
cd wechat_software

# 2. 一键启动开发环境
./dev.sh

# 3. 访问应用
# 前端H5: http://localhost:8080
# 后端API: http://localhost:3000
```

### 云服务器部署（自动化）

#### 步骤1: 准备云服务器
```bash
# 登录服务器
ssh root@your-server-ip

# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建部署用户
useradd -m github-deploy
usermod -aG docker github-deploy

# 生成SSH密钥
su - github-deploy
ssh-keygen -t rsa -b 4096 -C "github-deploy"
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 显示私钥（复制保存）
cat ~/.ssh/id_rsa
```

#### 步骤2: 配置GitHub Secrets
在GitHub仓库 **Settings > Secrets and variables > Actions** 中添加：

| Secret名称 | 值 | 说明 |
|-----------|---|-----|
| `SERVER_HOST` | `your-server-ip` | 云服务器IP |
| `SERVER_USER` | `github-deploy` | SSH用户名 |
| `SERVER_SSH_KEY` | `私钥内容` | SSH私钥 |

#### 步骤3: 推送代码自动部署
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions会自动：
1. 🧪 运行测试
2. 🔨 构建Docker镜像  
3. 🚀 部署到服务器
4. ✅ 执行健康检查
5. 📢 发送部署通知

## 🎯 部署后访问

- **H5应用**: `http://your-server-ip`
- **API健康检查**: `http://your-server-ip/api/v1/health`
- **用户注册**: `http://your-server-ip/api/v1/users/register`
- **用户登录**: `http://your-server-ip/api/v1/users/login`

### 测试账号
- 手机号: `13912345678`
- 密码: `password123`

## 📖 API文档

### 基础信息
- **Base URL**: `http://your-server-ip/api/v1`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

### 核心接口

#### 健康检查
```http
GET /health
```

#### 用户注册
```http
POST /users/register
Content-Type: application/json

{
  "phone_number": "13912345678",
  "name": "张三",
  "password": "password123",
  "student_id": "12345678",  // 可选
  "email": "user@example.com"  // 可选
}
```

#### 用户登录
```http
POST /users/login
Content-Type: application/json

{
  "phone_number": "13912345678",
  "password": "password123"
}
```

#### 获取用户信息
```http
GET /users/profile
Authorization: Bearer <jwt_token>
```

### 响应格式
```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "errors": []
}
```

## 🛠️ 开发指南

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0 (Docker中包含)
- Redis 7 (Docker中包含)

### 开发命令

#### 前端开发
```bash
# H5开发模式
npm run dev:h5

# H5生产构建
npm run build:h5

# 微信小程序开发
npm run dev:mp-weixin
```

#### 后端开发
```bash
cd backend

# 开发模式（热重载）
npm run dev

# 生产模式
npm start

# 运行测试
npm test

# 代码检查
npm run lint
```

#### Docker部署
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 数据库设计

项目采用手机号作为用户主键的设计，支持学号可选填：

```sql
-- 用户表主要字段
users (
  phone_number VARCHAR(11) PRIMARY KEY,  -- 手机号主键
  student_id VARCHAR(20) UNIQUE,         -- 学号（可空）
  name VARCHAR(50) NOT NULL,             -- 真实姓名
  password VARCHAR(255) NOT NULL,        -- 加密密码
  email VARCHAR(100),                    -- 邮箱（可空）
  status ENUM('active', 'inactive', 'banned'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

详细设计参见：[数据库设计文档](doc/database_design.md)

## 🔧 配置管理

### 环境变量

开发环境：
```bash
cp .env.example .env
# 编辑 .env 配置本地开发参数
```

生产环境：
```bash
cp .env.production .env
# 配置生产环境参数：
# - 数据库密码
# - JWT密钥
# - 服务端口等
```

### 前端配置
前端使用 `src/utils/config.js` 管理不同环境的API地址：
- 开发环境：通过代理访问 `/api/v1`
- 生产环境：直接访问完整URL

## 🚨 故障排除

### 常见问题

1. **部署失败**
   - 检查GitHub Secrets配置
   - 验证服务器SSH连接
   - 确认Docker服务运行状态

2. **API请求失败**
   - 检查后端服务状态：`docker-compose logs backend`
   - 验证数据库连接：`docker-compose logs mysql`
   - 测试健康检查：`curl http://localhost/health`

3. **前端页面无法访问**
   - 检查Nginx状态：`docker-compose logs nginx`
   - 验证端口开放：`netstat -tulpn | grep :80`

### 服务管理命令

```bash
# 查看所有服务状态
docker-compose ps

# 重启指定服务
docker-compose restart backend

# 查看实时日志
docker-compose logs -f backend nginx

# 进入容器调试
docker-compose exec backend sh

# 数据库备份
docker-compose exec mysql mysqldump -u root -p wechat_education > backup.sql
```

## 🔄 持续集成/部署

项目配置了完整的CI/CD流程：

### GitHub Actions工作流

1. **测试流程** (`test`)
   - 安装依赖
   - 运行单元测试
   - 运行集成测试
   - 代码质量检查

2. **构建流程** (`build`)
   - 构建前端H5应用
   - 构建Docker镜像
   - 推送到GitHub Container Registry

3. **部署流程** (`deploy`)
   - SSH连接服务器
   - 拉取最新代码
   - 更新Docker镜像
   - 滚动部署
   - 健康检查
   - 自动回滚

### 部署策略
- **零停机部署**：通过Docker容器滚动更新
- **自动回滚**：部署失败时自动恢复上一版本
- **健康检查**：确保新版本正常运行
- **版本管理**：保留最近3个版本的备份

## 👥 项目团队

**SE2024-Team-01**
- 高家中 - 前端组长 + UI设计师
- 李星原 - 后端开发工程师  
- 余意 - 全栈开发工程师
- 李桉弛 - 后端组长 + 数据库工程师
- 姚忠宝 - 业务开发工程师
- 江依山 - 项目经理 + 架构师

## 📅 项目时间线

- **2025年6月21日-22日**: 项目准备与设计
- **2025年6月23日-26日**: 基础开发
- **2025年6月27日-7月1日**: 功能开发  
- **2025年7月2日-4日**: 集成测试与部署

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

感谢北京工业大学软件学院提供的学习平台和技术支持，感谢所有参与项目开发和测试的同学和老师们。

## 📞 支持与反馈

- **项目指导**: 软件工程课程组
- **技术支持**: support@bjut.edu.cn  
- **问题反馈**: [GitHub Issues](https://github.com/your-username/wechat_software/issues)

---

<div align="center">

**🌟 日新智链平台 - 让学习更简单，让知识更流动 🚀**

[![Stars](https://img.shields.io/github/stars/your-username/wechat_software.svg)](https://github.com/your-username/wechat_software/stargazers)
[![Issues](https://img.shields.io/github/issues/your-username/wechat_software.svg)](https://github.com/your-username/wechat_software/issues)
[![License](https://img.shields.io/github/license/your-username/wechat_software.svg)](LICENSE)

</div>