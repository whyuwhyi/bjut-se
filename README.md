# 日新智链平台

北京工业大学校园学习交流微信小程序

## 项目简介

日新智链平台是一个专为北京工业大学师生设计的校园学习交流微信小程序，致力于打造"以学习者为中心"的智能化校园学习社区。平台通过整合分散的校园信息资源，提供一站式的学习、交流、成长服务，促进知识共享和协作学习。

## 核心功能

### 🔐 用户管理
- 用户注册登录（学号/工号认证）
- 个人信息管理
- 多角色支持（学生、教师、管理员）
- 微信快捷登录

### 📚 资源共享
- 学习资源上传下载
- 多媒体文件支持
- 智能分类和标签
- 高级搜索筛选
- 资源评分和收藏

### 💬 讨论答疑
- 学术讨论发布
- 在线问答互助
- 实时回复互动
- 问题解决状态管理
- 内容点赞和评价

### 📢 通知公告
- 个性化消息推送
- 重要公告发布
- 系统通知管理
- 消息分类处理

### 📊 学习记录
- 自动学习轨迹记录
- 个人成长档案管理
- 学习数据统计分析
- 电子成长报告

### 🎉 社团活动
- 校园活动信息发布
- 在线报名参与
- 活动签到管理
- 社团信息展示

## 技术架构

### 前端技术栈
- **框架**: uni-app (Vue.js 2.x)
- **UI组件**: uni-ui
- **样式**: SCSS
- **状态管理**: Vuex
- **路由**: uni-app内置路由

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **ORM**: Sequelize
- **数据库**: MySQL 8.0
- **缓存**: Redis 7
- **认证**: JWT
- **测试**: Jest + Supertest

### 开发工具
- **IDE**: HBuilderX / 微信开发者工具
- **版本控制**: Git
- **包管理**: npm

## 项目结构

```
wechat_software/
├── src/                      # 微信小程序前端
│   ├── pages/               # 页面文件
│   │   ├── index/          # 首页
│   │   ├── login/          # 登录页
│   │   ├── register/       # 注册页
│   │   ├── resources/      # 资源模块
│   │   ├── discussion/     # 讨论模块
│   │   ├── notification/   # 通知模块
│   │   ├── activity/       # 活动模块
│   │   └── profile/        # 个人中心
│   ├── static/             # 静态资源
│   ├── utils/              # 工具函数
│   ├── App.vue             # 应用入口
│   └── pages.json          # 页面配置
├── backend/                 # Node.js 后端
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   └── tests/          # 测试文件
│   ├── Dockerfile          # Docker镜像配置
│   └── package.json        # 后端依赖
├── database/               # 数据库相关
│   └── init/              # 初始化脚本
├── nginx/                  # Nginx配置
├── doc/                    # 项目文档
├── docker-compose.yml      # Docker编排
├── deploy.sh              # 部署脚本
└── README.md              # 项目说明
```

## 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0 (可选，Docker中已包含)
- HBuilderX 或微信开发者工具（前端开发）

### 1. 克隆项目
```bash
git clone <repository-url>
cd wechat_software
```

### 2. 配置环境
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库密码、JWT密钥等
```

### 3. 使用 Docker 部署（推荐）
```bash
# 完整部署
./deploy.sh deploy

# 或者分步执行
./deploy.sh start      # 启动服务
./deploy.sh status     # 查看状态
./deploy.sh logs       # 查看日志
./deploy.sh stop       # 停止服务
```

### 4. 手动部署后端
```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动数据库（MySQL + Redis）
docker-compose up -d mysql redis

# 启动开发服务器
npm run dev

# 或启动生产服务器
npm start
```

### 5. 前端开发
```bash
# 在微信开发者工具中打开 src 目录
# 或使用 HBuilderX 打开项目
```

## API 文档

### 基础信息
- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON

### 健康检查
```
GET /health
```

### 用户相关
```
POST /users/register    # 用户注册
POST /users/login       # 用户登录
GET  /users/profile     # 获取用户信息
PUT  /users/profile     # 更新用户信息
```

### 响应格式
```json
{
  "success": true|false,
  "message": "描述信息",
  "data": {}, // 成功时的数据
  "errors": [] // 失败时的错误详情
}
```

## 项目团队

**SE2024-Team-01**
- 高家中 - 前端组长 + UI设计师
- 李星原 - 后端开发工程师
- 余意 - 全栈开发工程师
- 李桉弛 - 后端组长 + 数据库工程师
- 姚忠宝 - 业务开发工程师
- 江依山 - 项目经理 + 架构师

## 项目时间线

- **2025年6月21日-22日**: 项目准备与设计
- **2025年6月23日-26日**: 基础开发
- **2025年6月27日-7月1日**: 功能开发
- **2025年7月2日-4日**: 集成测试与部署

## 联系方式

- **项目指导**: 软件工程课程组
- **技术支持**: support@bjut.edu.cn
- **问题反馈**: [GitHub Issues](https://github.com/SE2024-Team-01/wechat_software/issues)

## 许可证

本项目采用 MIT 许可证

## 致谢

感谢北京工业大学软件学院提供的学习平台和技术支持，感谢所有参与项目开发和测试的同学和老师们。

---

**日新智链平台** - 让学习更简单，让知识更流动 🚀
