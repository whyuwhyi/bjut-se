# 日新智链平台

北京工业大学校园学习交流微信小程序

## 项目简介

日新智链平台是一个专为北京工业大学师生设计的校园学习交流微信小程序，致力于打造"以学习者为中心"的智能化校园学习社区。平台通过整合分散的校园信息资源，提供一站式的学习、交流、成长服务，促进知识共享和协作学习。

## 核心功能

### 🔐 用户管理

- 用户注册登录
- 个人信息管理
- 多角色支持（学生、教师、管理员）
- 微信快捷登录

### 📚 学习资源模块

#### 核心功能
- **资源浏览**: 支持分类筛选和搜索
- **资源发布**: 带审核流程的资源发布系统
- **资源下载**: 安全的文件下载功能
- **资源收藏**: 个人收藏管理
- **资源评价**: 5星评分系统和用户评论
- **资源分享**: 社交分享功能

#### 筛选功能
- **分类选择**: 课件、作业、实验、考试、项目、论文
- **实时搜索**: 支持标题和描述内容搜索
- **排序功能**: 支持按时间、下载量、评分等排序

#### 数据结构
- **分类系统**: 数据库驱动的分类管理
- **审核流程**: 发布→待审核→已发布/已拒绝
- **关联管理**: 资源-分类一对多关联

### 💬 论坛交流

- 帖子发布功能
- 评论回复系统
- 标签分类管理
- Markdown编辑支持
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

### 📖 学习管理

- **学习计划制定**: 创建个性化学习计划
- **任务管理**: 支持任务分解和子任务管理
- **进度跟踪**: 可视化学习进度和完成率
- **学习记录**: 自动记录学习活动和时长
- **目标设定**: 设定学习目标和截止时间
- **成就系统**: 学习成就和等级奖励
- **数据统计**: 学习时长、活动统计和趋势分析

## 技术架构

### 前端技术栈

- **框架**: uni-app (Vue.js 2.x)
- **UI 组件**: uni-ui
- **样式**: SCSS
- **状态管理**: Vuex
- **路由**: uni-app 内置路由

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
│   │   ├── forum/         # 论坛模块
│   │   ├── notification/   # 通知模块
│   │   ├── learning/       # 学习管理模块
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
- MySQL 8.0 (可选，Docker 中已包含)
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

# 等待数据库启动完成，然后初始化测试数据
# 测试数据会通过 database/init/02-init-test-data.sql 自动初始化

# 启动开发服务器
npm run dev

# 或启动生产服务器
npm start
```

### 测试账号

系统会自动创建以下测试账号（密码均为 `123456`）：

- **13800138001** - 张教授
- **13800138002** - 李同学  
- **13800138003** - 王老师

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

### 学习资源相关

```
GET  /resources                    # 获取资源列表（支持多参数筛选）
POST /resources                    # 创建资源
GET  /resources/:id               # 获取资源详情
POST /resources/:id/favorite      # 收藏/取消收藏
POST /resources/:id/submit-review # 提交审核
GET  /resources/:id/download/:fileId # 下载文件
```


### 分类相关

```
GET  /categories        # 获取所有分类
GET  /categories/options # 获取分类选项（用于下拉框）
GET  /categories/:value # 根据分类值获取分类信息
```

### 学习管理相关

```
GET  /study-plans           # 获取学习计划列表
POST /study-plans           # 创建学习计划
GET  /study-plans/progress  # 获取学习进度统计
GET  /study-plans/:id       # 获取学习计划详情
PUT  /study-plans/:id       # 更新学习计划
DELETE /study-plans/:id     # 删除学习计划

POST /study-plans/tasks     # 创建学习任务
GET  /study-plans/tasks/:id # 获取任务详情
PUT  /study-plans/tasks/:id # 更新任务信息
PATCH /study-plans/tasks/:id/status # 更新任务状态
DELETE /study-plans/tasks/:id # 删除任务

POST /study-plans/tasks/:task_id/subtasks # 添加子任务
PUT  /study-plans/subtasks/:subtask_id    # 更新子任务
DELETE /study-plans/subtasks/:subtask_id  # 删除子任务
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

**SE2025-Team-03**

- 高家中
- 李星原
- 余意
- 李桉弛
- 姚忠宝
- 江依山

## 项目时间线

- **2025 年 6 月 21 日-22 日**: 项目准备与设计
- **2025 年 6 月 23 日-26 日**: 基础开发
- **2025 年 6 月 27 日-7 月 1 日**: 功能开发
- **2025 年 7 月 2 日-4 日**: 集成测试与部署

## 联系方式

- **项目指导**: 软件工程课程组
- **技术支持**: <support@bjut.edu.cn>
- **问题反馈**: [GitHub Issues](https://github.com/SE2024-Team-01/wechat_software/issues)

## 致谢

感谢北京工业大学软件学院提供的学习平台和技术支持，感谢所有参与项目开发和测试的同学和老师们。

---

**日新智链平台** - 让学习更简单，让知识更流动 🚀
