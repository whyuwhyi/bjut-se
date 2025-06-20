# 日新智链平台 - 项目构建指南

## 🛠️ 环境准备

### 1. 安装开发工具
```bash
# 安装Node.js (版本 >= 12.0.0)
# 从 https://nodejs.org 下载安装

# 验证安装
node --version
npm --version
```

### 2. 下载开发工具
- **HBuilderX**: [下载地址](https://www.dcloud.io/hbuilderx.html) - 推荐使用
- **微信开发者工具**: [下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

## 📦 项目构建步骤

### 1. 初始化项目
```bash
# 进入项目目录
cd /home/whywhy/cs/bjut-softwore/wechat_software

# 安装依赖
npm install
```

### 2. 微信小程序配置

#### 申请小程序
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 选择"小程序" -> "立即注册"
3. 获取小程序的 AppID

#### 配置项目
编辑 `manifest.json`:
```json
{
  "mp-weixin": {
    "appid": "你的小程序AppID",
    "setting": {
      "urlCheck": false
    }
  }
}
```

### 3. 微信云开发配置

#### 开通云开发
1. 用微信开发者工具打开项目
2. 点击工具栏 "云开发" 按钮
3. 按提示开通云开发服务
4. 创建云开发环境，获取环境ID

#### 配置云环境
编辑 `App.vue`:
```javascript
wx.cloud.init({
  env: 'your-cloud-env-id', // 替换为你的云开发环境ID
  traceUser: true,
})
```

### 4. 部署云函数

在微信开发者工具中：
1. 右键 `cloudfunctions/user` 文件夹
2. 选择 "创建并部署：云端安装依赖"
3. 重复步骤1-2 部署其他云函数：
   - `cloudfunctions/resource`
   - `cloudfunctions/discussion`

### 5. 初始化数据库

在微信开发者工具的云开发控制台中创建以下集合：

#### 核心集合
- `users` - 用户信息
- `resources` - 学习资源
- `discussions` - 讨论帖子
- `notifications` - 通知消息
- `learning_records` - 学习记录
- `activities` - 活动信息

#### 关系集合
- `favorites` - 收藏记录
- `likes` - 点赞记录
- `ratings` - 评分记录
- `download_history` - 下载历史
- `activity_participants` - 活动参与记录

详细数据库结构请参考 `database/init.md` 文件。

## 🔧 运行项目

### 1. 在HBuilderX中运行
1. 用HBuilderX打开项目目录
2. 点击工具栏 "运行" -> "运行到小程序模拟器" -> "微信开发者工具"
3. 首次运行会自动打开微信开发者工具

### 2. 在微信开发者工具中运行
1. 打开微信开发者工具
2. 选择 "小程序" -> "导入项目"
3. 选择项目目录，填入AppID
4. 点击 "导入" 开始预览

### 3. 命令行构建
```bash
# 开发模式（热重载）
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```

## 📱 预览项目

### 模拟器预览
在微信开发者工具中可以直接在模拟器中预览应用效果

### 真机预览
1. 点击微信开发者工具的 "预览" 按钮
2. 用微信扫描生成的二维码
3. 在手机上体验真实效果

## 🏗️ 项目结构说明

项目包含以下核心文件和目录：

```
wechat_software/
├── App.vue                  # 应用入口文件
├── README.md               # 项目说明文档
├── babel.config.js         # Babel配置
├── cloudfunctions/         # 云函数目录
│   ├── discussion/         # 讨论管理云函数
│   ├── resource/          # 资源管理云函数
│   └── user/              # 用户管理云函数
├── database/              # 数据库初始化文档
├── doc/                   # 项目文档
│   ├── softwore_development_plan.md
│   └── softwore_requirement_specification.md
├── manifest.json          # 应用配置文件
├── node_modules/          # 依赖包目录
├── package-lock.json      # 依赖锁定文件
├── package.json           # 项目配置和依赖
├── pages/                 # 页面目录
│   ├── discussion/        # 讨论模块页面
│   ├── index/            # 首页
│   ├── login/            # 登录页
│   ├── profile/          # 个人中心
│   ├── register/         # 注册页
│   └── resources/        # 资源模块页面
├── pages.json            # 页面路由配置
├── postcss.config.js     # PostCSS配置
├── public/               # 公共资源
├── shims-uni.d.ts        # TypeScript声明文件
├── shims-vue.d.ts        # Vue TypeScript声明
├── src/                  # 源码目录
├── static/               # 静态资源
│   └── css/              # 样式文件
├── tsconfig.json         # TypeScript配置
└── utils/                # 工具函数
    ├── api.js            # API封装
    ├── auth.js           # 认证工具
    └── index.js          # 通用工具
```

## 🎯 核心功能模块

### 1. 用户管理模块
- **页面**: `pages/login/`, `pages/register/`, `pages/profile/`
- **云函数**: `cloudfunctions/user/`
- **功能**: 用户注册、登录、个人信息管理

### 2. 资源共享模块
- **页面**: `pages/resources/`
- **云函数**: `cloudfunctions/resource/`
- **功能**: 资源上传、下载、搜索、收藏

### 3. 讨论答疑模块
- **页面**: `pages/discussion/`
- **云函数**: `cloudfunctions/discussion/`
- **功能**: 发布讨论、回复互动、问答功能

### 4. 首页和导航
- **页面**: `pages/index/`
- **功能**: 内容聚合、快速导航、热门推荐

## ⚠️ 注意事项

### 必要配置
1. **AppID配置**: 必须使用真实的微信小程序AppID
2. **云开发环境**: 需要开通微信云开发服务
3. **网络权限**: 在manifest.json中配置网络请求域名
4. **基础库版本**: 确保微信基础库版本 >= 2.2.3

### 开发建议
1. **真机测试**: 某些功能需要在真机上测试效果
2. **调试工具**: 使用微信开发者工具的调试功能
3. **性能优化**: 注意小程序包大小限制（2MB）
4. **用户体验**: 考虑网络状况和设备性能差异

### 常见问题
1. **云函数调用失败**: 检查云开发环境ID配置
2. **页面不显示**: 检查pages.json路由配置
3. **样式问题**: 检查rpx单位使用和兼容性
4. **权限问题**: 检查数据库安全规则设置

## 🚀 快速开始

1. **克隆项目**: 获取项目代码
2. **安装依赖**: 运行 `npm install`
3. **配置AppID**: 在manifest.json中填入小程序AppID
4. **开通云开发**: 在微信开发者工具中开通云开发
5. **部署云函数**: 上传并部署所有云函数
6. **初始化数据库**: 创建所需的数据库集合
7. **运行项目**: 使用开发工具预览和调试
8. **真机测试**: 扫码在手机上测试功能

按照以上步骤，您就可以成功构建和运行日新智链平台了！

## 📞 技术支持

如果在构建过程中遇到问题，可以：
1. 查看项目文档 `doc/` 目录
2. 检查 `README.md` 中的详细说明
3. 参考微信小程序官方文档
4. 联系项目团队获取支持

---

**日新智链平台** - 让学习更简单，让知识更流动 🚀