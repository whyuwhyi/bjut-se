# 微信小程序教育资源平台数据库设计文档

## 概述

本文档详细描述了微信小程序教育资源平台的数据库设计，包含用户管理、资源共享、学习管理、讨论交流、通知系统等核心功能模块的完整数据库表结构设计。学习管理模块支持完整的学习计划创建、任务管理、进度跟踪和经验值系统。

---

## 1. 核心业务表

### 1.1 用户表 (users)

用户系统的核心表，存储所有用户的基本信息和认证数据。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| phone_number | VARCHAR(11) | PRIMARY KEY | 11位手机号，以1开头（主键） |
| student_id | VARCHAR(20) | UNIQUE | 学号：8位数字或S+9位数字（可空） |
| password | VARCHAR(255) | NOT NULL | 加密后的密码 |
| name | VARCHAR(50) | NOT NULL | 真实姓名，1-50个字符 |
| nickname | VARCHAR(50) | | 昵称 |
| avatar_url | VARCHAR(500) | | 头像URL |
| email | VARCHAR(100) | | 邮箱地址 |
| gender | ENUM('M','F','U') | DEFAULT 'U' | 性别：M-男，F-女，U-未知 |
| role | ENUM('user','admin') | DEFAULT 'user' | 用户角色：user-普通用户，admin-管理员 |
| status | ENUM('active','inactive','banned') | DEFAULT 'active' | 用户状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**权限说明**:
- **user (普通用户)**: 可以注册、登录、发布资源、参与论坛讨论等基础功能
- **admin (管理员)**: 具备所有普通用户权限，同时可以审核资源、管理用户、发布系统通知、查看统计数据等管理功能

**业务规则**:
- 默认注册用户角色为 'user'
- 管理员账号需要手动设置或通过数据库初始化
- 管理员权限验证通过后端中间件实现
- 支持基于角色的访问控制 (RBAC)

---

## 2. 资源管理模块

### 2.1 资源分类表 (categories)

支持资源分类管理，分类可通过管理后台动态管理。资源分类是整个资源系统的核心组织方式，提供灵活的分类体系支持。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| category_id | VARCHAR(20) | PRIMARY KEY | 分类唯一标识符 |
| category_name | VARCHAR(50) | UNIQUE, NOT NULL | 分类名称，1-50个字符 |
| category_value | VARCHAR(50) | UNIQUE, NOT NULL | 分类值（用于API参数） |
| description | TEXT | | 分类描述 |
| icon | VARCHAR(10) | | 分类图标（支持emoji） |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序顺序 |
| status | ENUM('active','inactive') | NOT NULL, DEFAULT 'active' | 状态：active-启用，inactive-禁用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**分类系统特点：**
- **双重标识**: 既有用户友好的分类名称，也有系统内部使用的分类值
- **图标支持**: 支持emoji图标，提升用户体验
- **灵活排序**: 通过sort_order字段支持自定义排序
- **状态管理**: 支持启用/禁用分类，便于动态调整
- **管理界面**: 分类可通过管理后台进行创建、编辑、删除和排序

**预设分类示例：**
- 编程开发 (programming) 📚
- 设计素材 (design) 🎨  
- 学术论文 (academic) 📖
- 工具软件 (tools) 🛠️
- 其他资源 (others) 📦

### 2.2 资源表 (resources)

存储所有学习资源的核心信息和统计数据。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| resource_id | VARCHAR(9) | PRIMARY KEY | 9位数字的资源唯一标识符 |
| publisher_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 发布者手机号（外键到用户表） |
| resource_name | VARCHAR(100) | NOT NULL | 资源名称 |
| description | TEXT | | 资源描述 |
| collection_count | INT | DEFAULT 0 | 资源收藏次数，0-999999999 |
| comment_count | INT | DEFAULT 0 | 资源评论数量，0-999999999 |
| rating | DECIMAL(4,2) | DEFAULT 0.00 | 资源评分，1-5分 |
| view_count | INT | DEFAULT 0 | 浏览次数 |
| status | ENUM('draft','pending','published','rejected','archived') | DEFAULT 'draft' | 资源状态：draft-草稿，pending-待审核，published-已发布，rejected-已拒绝，archived-已归档 |
| reviewer_phone | VARCHAR(11) | FOREIGN KEY | 审核者手机号（外键到用户表） |
| review_comment | TEXT | | 审核意见 |
| reviewed_at | DATETIME | | 审核时间 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| category_id | VARCHAR(20) | FOREIGN KEY | 资源分类ID（外键到categories表） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**资源审核工作流：**
- **draft**: 草稿状态，用户编辑中
- **pending**: 提交审核，等待管理员处理
- **published**: 审核通过，公开展示
- **rejected**: 审核拒绝，需要修改
- **archived**: 已归档，不再展示

**分类关联：**
- 通过 `category_id` 字段关联到 `categories` 表
- 支持分类筛选和统计功能
- 当分类被删除时，相关资源的category_id设为NULL


### 2.3 文件表 (files)

存储资源关联的文件信息，支持多种存储方式。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| file_id | VARCHAR(9) | PRIMARY KEY | 9位数字的文件唯一标识符 |
| resource_id | VARCHAR(9) | FOREIGN KEY | 关联资源表 |
| file_name | VARCHAR(255) | NOT NULL | 文件名称，1-255个字符 |
| file_size | BIGINT | | 文件大小（字节） |
| file_type | VARCHAR(50) | | 文件类型/MIME类型 |
| storage_path | VARCHAR(1000) | | 文件存储路径 |
| storage_method | ENUM('local', 'cloud', 'table') | NOT NULL DEFAULT 'local' | 文件存储方式 |
| content | LONGTEXT | | 文件内容（用于文本文件） |
| download_count | INT | DEFAULT 0 | 下载次数 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**文件存储架构：**
- **本地存储**: 文件保存在Docker容器的持久化卷中
- **路径组织**: `/uploads/files/{resource_id}_{filename}.{ext}`
- **类型支持**: 支持文档、图片、音频、视频等多种文件类型
- **安全下载**: 通过JWT认证控制文件访问权限


---

## 3. 学习管理模块

### 3.1 学习计划表 (study_plans)

用户个人学习计划管理，支持制定和跟踪学习目标。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| plan_id | VARCHAR(9) | PRIMARY KEY | 9位数字的计划唯一标识符 |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号（外键到用户表） |
| title | VARCHAR(200) | NOT NULL | 计划标题，1-200个字符 |
| description | TEXT | | 计划详细描述 |
| start_date | DATE | NOT NULL | 开始日期 |
| end_date | DATE | NOT NULL | 结束日期 |
| status | ENUM('active','completed','paused','cancelled') | DEFAULT 'active' | 计划状态：active-进行中，completed-已完成，paused-已暂停，cancelled-已取消 |
| progress_percent | INT | DEFAULT 0 | 整体进度百分比，0-100 |
| plan_type | VARCHAR(50) | DEFAULT '自定义计划' | 计划类型（前端开发、算法练习、考试复习等） |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**业务特点：**
- 支持多种计划类型：自定义计划、前端开发、后端开发、算法练习、考试复习、项目实战等
- 自动计算整体进度百分比，基于关联任务的完成情况
- 支持计划状态管理：进行中、已完成、已暂停、已取消
- 提供优先级管理，便于用户规划学习重点
- 计划创建时自动记录学习活动并奖励经验值
- 支持灵活的时间范围设定和进度跟踪

### 3.2 学习任务表 (study_tasks)

学习计划下的具体任务管理。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| task_id | VARCHAR(9) | PRIMARY KEY | 9位数字的任务唯一标识符 |
| plan_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 关联学习计划表 |
| title | VARCHAR(200) | NOT NULL | 任务标题 |
| description | TEXT | | 任务描述 |
| deadline | DATE | | 截止日期 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 任务优先级 |
| status | ENUM('pending','in_progress','completed','cancelled') | DEFAULT 'pending' | 任务状态 |
| estimated_hours | INT | | 预估学习时长（小时） |
| actual_hours | INT | DEFAULT 0 | 实际学习时长（小时） |
| tags | VARCHAR(500) | | 标签（JSON格式存储） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**业务特点：**
- 支持四种任务状态：待开始(pending)、进行中(in_progress)、已完成(completed)、已取消(cancelled)
- 任务完成时自动记录学习活动，奖励经验值(20分)
- 支持标签系统，以JSON格式存储便于搜索和分类
- 提供预估时长和实际时长对比，帮助用户改善时间管理
- 支持截止日期设定和逾期任务识别
- 任务状态变更时自动更新所属计划的进度百分比
- 支持子任务分解，便于大任务的管理和跟踪

### 3.3 子任务表 (sub_tasks)

支持任务的细化分解。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| subtask_id | INT | PRIMARY KEY, AUTO_INCREMENT | 子任务ID |
| task_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 关联学习任务表 |
| title | VARCHAR(200) | NOT NULL | 子任务标题 |
| completed | BOOLEAN | DEFAULT FALSE | 是否已完成 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**业务特点：**
- 支持任务的进一步细化分解，提高任务管理的精度
- 提供排序功能，便于用户调整子任务执行顺序
- 子任务完成状态影响父任务的整体进度显示
- 支持快速的完成状态切换，提升用户体验
- 为复杂学习任务提供清晰的执行路径

### 3.4 学习记录表 (study_records)

记录用户的详细学习活动和进度，支持学习轨迹追踪和经验值系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| record_id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| plan_id | VARCHAR(9) | FOREIGN KEY | 关联学习计划（可选） |
| task_id | VARCHAR(9) | FOREIGN KEY | 关联学习任务（可选） |
| resource_id | VARCHAR(9) | FOREIGN KEY | 关联资源（可选） |
| post_id | VARCHAR(9) | FOREIGN KEY | 关联帖子（可选） |
| activity_type | ENUM('resource_view','resource_download','task_complete','plan_create','post_view','post_create','comment_create') | NOT NULL | 活动类型 |
| duration_minutes | INT | DEFAULT 0 | 学习时长（分钟） |
| experience_gained | INT | DEFAULT 0 | 获得经验值 |
| study_date | DATE | NOT NULL | 学习日期 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**业务特点：**
- 自动记录用户学习行为，包括资源浏览、下载、任务完成等
- 支持经验值系统，不同活动类型获得不同经验值
- 任务完成时自动记录学习活动并奖励经验值
- 支持多种内容类型的学习记录（资源、帖子、任务）
- 提供学习时长统计和学习轨迹分析
- 支持按日期聚合的学习进度报告


---

## 4. 论坛交流模块

### 4.1 帖子表 (posts)

存储用户发布的帖子信息。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| post_id | VARCHAR(9) | PRIMARY KEY | 9位数字的帖子唯一标识符 |
| author_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 作者手机号（外键到用户表） |
| title | VARCHAR(200) | NOT NULL | 帖子标题，最多200个字符 |
| content | TEXT | NOT NULL | 帖子内容（支持Markdown格式） |
| view_count | INT | DEFAULT 0 | 浏览次数 |
| comment_count | INT | DEFAULT 0 | 评论数量 |
| status | ENUM('active','hidden','deleted') | DEFAULT 'active' | 帖子状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4.2 帖子标签表 (post_tags)

存储论坛帖子的标签信息，支持动态扩展。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| tag_id | VARCHAR(9) | PRIMARY KEY | 9位数字的标签唯一标识符 |
| tag_name | VARCHAR(50) | UNIQUE, NOT NULL | 标签名称，1-50个字符 |
| tag_color | VARCHAR(7) | DEFAULT '#007aff' | 标签颜色（十六进制） |
| usage_count | INT | DEFAULT 0 | 使用次数统计 |
| status | ENUM('active','inactive') | DEFAULT 'active' | 标签状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4.3 帖子标签关联表 (post_tag_relations)

实现帖子与标签的多对多关系。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| relation_id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联记录唯一标识符 |
| post_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 关联帖子表 |
| tag_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 关联标签表 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 4.4 评论表 (comments)

支持帖子和资源的多层级回复评论系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| comment_id | INT | PRIMARY KEY, AUTO_INCREMENT | 评论唯一标识符 |
| author_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 评论作者手机号（外键到用户表） |
| post_id | VARCHAR(9) | FOREIGN KEY | 关联帖子ID（如果是帖子评论） |
| resource_id | VARCHAR(9) | FOREIGN KEY | 关联资源ID（如果是资源评论） |
| parent_comment_id | INT | FOREIGN KEY | 父评论ID（用于回复） |
| content | TEXT | NOT NULL | 评论内容 |
| status | ENUM('active','hidden','deleted') | DEFAULT 'active' | 评论状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4.5 评分表 (ratings)

用户对资源的评分记录。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| rating_id | INT | PRIMARY KEY, AUTO_INCREMENT | 评分记录唯一标识符 |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 评分者手机号（外键） |
| resource_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 关联资源表 |
| rating | DECIMAL(3,2) | NOT NULL | 评分（1-5分） |
| review_text | TEXT | | 评价文字内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 评分时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |


---

## 5. 用户交互模块

### 5.1 用户关注表 (user_follows)

实现用户间的关注关系，支持关注/取消关注功能。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| follow_id | VARCHAR(9) | PRIMARY KEY | 9位数字的关注记录唯一标识符 |
| follower_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 关注者手机号（外键） |
| following_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 被关注者手机号（外键） |
| status | ENUM('active','cancelled') | DEFAULT 'active' | 关注状态：active-关注中，cancelled-已取消 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 关注时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**业务特点：**
- 支持用户互相关注，构建社交网络
- 提供关注列表和粉丝列表查询
- 关注状态可以重复变更（关注→取消→重新关注）
- 建立唯一索引防止重复关注记录

### 5.2 收藏表 (collections)

支持多种内容类型的收藏功能。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| collection_id | VARCHAR(9) | PRIMARY KEY | 9位数字的收藏记录唯一标识符 |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 关联用户表（收藏者） |
| content_id | VARCHAR(9) | NOT NULL | 被收藏内容的唯一标识符，9位数字 |
| collection_type | ENUM('post', 'resource') | NOT NULL | 收藏内容类型 |
| status | ENUM('active','cancelled') | DEFAULT 'active' | 收藏状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 收藏时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 6. 通知系统模块

### 6.1 通知表 (notifications)

统一的消息通知管理系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| notification_id | VARCHAR(9) | PRIMARY KEY | 9位数字的通知唯一标识符 |
| receiver_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 接收者手机号 |
| sender_phone | VARCHAR(11) | FOREIGN KEY | 发送者手机号（系统通知可为空） |
| type | ENUM('system','study','interaction','resource','announcement') | NOT NULL | 通知类型 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| title | VARCHAR(200) | NOT NULL | 通知标题 |
| content | TEXT | NOT NULL | 通知内容 |
| action_type | ENUM('navigate','external_link','none') | DEFAULT 'none' | 操作类型 |
| action_url | VARCHAR(500) | | 操作链接 |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |
| read_at | TIMESTAMP | | 已读时间 |
| expires_at | TIMESTAMP | | 过期时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |



## 数据库关系设计

### 核心关系架构

#### 1. 用户中心关系体系
- **用户表**为整个系统的核心，以手机号作为主键
- 用户与其他业务实体形成一对多关系：
  - 用户 ←→ 资源发布（1:N）
  - 用户 ←→ 讨论发起（1:N）
  - 用户 ←→ 评论发表（1:N）
  - 用户 ←→ 学习计划（1:N）

#### 2. 资源管理关系网络
```
分类表 ←--一对多--→ 资源表 ←--一对多--→ 文件表
  ↑                    ↓
分类管理            资源内容管理
```

#### 3. 学习管理关系网络
```
学习计划表 ←--一对多--→ 学习任务表 ←--一对多--→ 子任务表
     ↓                    ↓
   进度跟踪              学习记录表
     ↓                    ↓
 自动更新              经验值系统
```

#### 4. 论坛交流关系层次
```
帖子表 ←--多对多--→ 帖子标签表（通过post_tag_relations）
  ↓
评论表（支持层级回复关系 parent_comment_id）
  ↓
资源表 ←--一对多--→ 评论表（资源评论）
```

#### 5. 用户社交关系网络
```
用户表 ←--多对多--→ 关注表（follower/followee）
  ↓
收藏表（支持多种内容类型收藏）
  ↓
通知表（系统消息和通知）
```

### 业务流程关系

#### 资源分享流程
1. 用户发布资源 → `resources` 表
2. 选择资源分类 → `category_id` 字段关联
3. 上传相关文件 → `files` 表
4. 其他用户浏览资源 → 更新浏览统计字段

#### 学习管理流程
1. 用户创建学习计划 → `study_plans` 表（自动记录学习活动，奖励15经验值）
2. 制定学习任务 → `study_tasks` 表
3. 分解子任务 → `sub_tasks` 表（可选，支持复杂任务管理）
4. 完成任务 → 更新任务状态（自动记录学习活动，奖励20经验值）
5. 自动更新计划进度 → 基于任务完成情况计算进度百分比
6. 学习轨迹追踪 → `study_records` 表记录所有学习活动

#### 论坛交流流程
1. 用户发布帖子 → `posts` 表
2. 关联帖子标签 → `post_tag_relations` 表
3. 其他用户评论 → `comments` 表
4. 层级回复机制 → `parent_comment_id` 字段

---

## 技术实现规范

### 数据类型规范
- **主键策略**：用户表使用业务主键（手机号），其他表使用自增ID或业务ID
- **外键约束**：所有外键关系使用CASCADE删除或RESTRICT约束
- **时间戳管理**：统一使用TIMESTAMP类型，自动维护创建和更新时间
- **状态管理**：使用ENUM类型确保状态值的一致性和完整性
- **字符编码**：全库使用UTF-8编码，支持emoji和多语言

### 业务ID设计规范
- **用户标识**：11位手机号（业务意义明确）
- **学工号格式**：8位数字或S+9位数字（支持学生和教师）
- **业务ID格式**：9位数字字符串（资源、活动、讨论等）
- **自增ID**：用于关联表和统计表

### 索引优化策略
- **主键索引**：自动创建，无需额外配置
- **外键索引**：自动创建，支持关联查询优化
- **业务索引**：为高频查询字段创建复合索引
- **唯一约束**：确保数据唯一性，自动创建唯一索引

### 数据完整性保障
- **级联删除**：用户删除时级联删除相关数据
- **状态一致性**：使用ENUM类型约束状态字段
- **非空约束**：关键业务字段设置NOT NULL
- **长度限制**：合理设置字符串字段长度上限

---

## 数据库选型建议

### 推荐配置
- **数据库引擎**：MySQL 8.0+ 或 PostgreSQL 13+
- **存储引擎**：InnoDB（支持事务和外键约束）
- **字符集**：utf8mb4（支持emoji和特殊字符）
- **排序规则**：utf8mb4_unicode_ci

### 性能优化方案
- **读写分离**：主从复制，读请求分发到从库
- **分库分表**：用户数据按手机号hash分片
- **缓存策略**：热点数据使用Redis缓存
- **索引优化**：定期分析查询模式，优化索引结构

### 运维管理策略
- **备份策略**：每日全量备份+实时增量备份
- **监控告警**：数据库性能指标监控
- **容量规划**：预估数据增长，提前扩容
- **安全防护**：数据加密、访问控制、审计日志

---

## 扩展性设计

### 水平扩展支持
- 用户表支持按手机号分片
- 业务表支持按用户维度分片
- 跨分片查询通过中间件处理

### 功能模块扩展
- 类型表设计支持动态添加新分类
- 通知系统支持多种通知类型扩展
- 文件存储支持多种存储方式

### 数据迁移方案
- 版本化数据库脚本管理
- 支持平滑的结构变更
- 数据迁移工具和回滚机制

本数据库设计充分考虑了教育资源平台的业务特点，重点围绕学习资源共享、论坛交流、学习管理、通知系统和个人中心管理等核心功能，在保证数据一致性和完整性的基础上，提供了良好的扩展性和性能优化空间。该设计支持用户的完整学习生态系统，从资源获取到学习计划管理，再到社区互动交流和个人数据管理，为用户提供一站式的学习服务体验。

---

## 个人中心功能实现概述

### 已实现功能模块

✅ **用户统计信息**
- 资源发布数量统计 (`resources` 表)
- 帖子发布数量统计 (`posts` 表)
- 关注和粉丝数量统计 (`user_follows` 表)
- 收藏数量统计 (`collections` 表)

✅ **我的资源管理**
- 资源列表展示（支持状态筛选：published/pending/rejected）
- 资源详情查看和编辑
- 资源状态管理和审核流程
- 文件关联和下载统计

✅ **我的帖子管理**
- 帖子列表展示（支持状态筛选：active/hidden/deleted）
- 帖子内容管理和编辑
- 评论数量和浏览统计
- 帖子标签关联

✅ **关注/粉丝管理**
- 我的关注列表 (`user_follows` 表，follower_phone 查询）
- 我的粉丝列表 (`user_follows` 表，following_phone 查询）
- 关注/取消关注操作（状态切换：active/cancelled）
- 双向关注检查和回关功能

✅ **收藏管理**
- 多类型收藏支持（resource/post 通过 `collection_type` 区分）
- 收藏列表展示和筛选
- 取消收藏操作（状态管理：active/cancelled）
- 收藏内容详情关联

### API接口设计

#### 用户统计接口
```http
GET /api/v1/users/stats
Authorization: Bearer {token}
```
**返回数据**: resourceCount, postCount, followingCount, followerCount, collectionCount

#### 资源管理接口
```http
GET /api/v1/users/my-resources?status={status}&page={page}&limit={limit}
Authorization: Bearer {token}
```
**支持状态**: published, pending, rejected
**返回数据**: 用户发布的资源列表，包含文件信息和统计数据

#### 帖子管理接口
```http
GET /api/v1/users/my-posts?status={status}&page={page}&limit={limit}
Authorization: Bearer {token}
```
**支持状态**: active, hidden, deleted
**返回数据**: 用户发布的帖子列表，包含标签和统计信息

#### 关注管理接口
```http
GET /api/v1/users/following?page={page}&limit={limit}    # 获取关注列表
GET /api/v1/users/followers?page={page}&limit={limit}    # 获取粉丝列表
POST /api/v1/users/follow/{phone}                        # 关注/取消关注切换
Authorization: Bearer {token}
```

#### 收藏管理接口
```http
GET /api/v1/users/my-collections?collection_type={type}&page={page}&limit={limit}
DELETE /api/v1/collections/{content_id}?collection_type={type}
Authorization: Bearer {token}
```
**支持类型**: resource, post

### 数据库表结构优化

#### 关键索引设计
```sql
-- 用户统计查询优化
CREATE INDEX idx_resources_publisher_status ON resources(publisher_phone, status);
CREATE INDEX idx_posts_author_status ON posts(author_phone, status);
CREATE INDEX idx_collections_user_status ON collections(user_phone, status);
CREATE INDEX idx_user_follows_status ON user_follows(follower_phone, following_phone, status);

-- 分页查询优化
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_collections_created_at ON collections(created_at DESC);
```

#### 数据完整性约束
- **唯一约束**: user_follows 表防止重复关注 `UNIQUE(follower_phone, following_phone)`
- **唯一约束**: collections 表防止重复收藏 `UNIQUE(user_phone, content_id, collection_type)`
- **外键约束**: 所有关联表设置级联删除或 SET NULL
- **状态枚举**: 使用 ENUM 类型确保状态值一致性

### 业务逻辑实现

#### 关注系统设计
- **关注操作**: 创建或更新 user_follows 记录，状态为 'active'
- **取消关注**: 更新 status 为 'cancelled'（软删除，保留历史记录）
- **重新关注**: 将已取消的关注记录状态改回 'active'
- **互关检查**: 查询双向关注记录判断是否为互相关注

#### 收藏系统设计
- **多类型支持**: 通过 collection_type 区分资源收藏和帖子收藏
- **内容关联**: content_id 字段存储被收藏内容的主键
- **状态管理**: active/cancelled 状态实现软删除机制
- **数据同步**: 收藏数变化时更新对应资源或帖子的统计字段

#### 统计数据维护
- **实时统计**: 通过 COUNT 查询实时计算统计数据
- **缓存策略**: 可在 Redis 中缓存频繁查询的统计数据
- **定时更新**: 可设置定时任务同步统计数据到主表字段

### 性能优化策略

#### 查询优化
- **分页查询**: 使用 LIMIT/OFFSET 实现分页，避免大数据量查询
- **状态筛选**: 利用状态字段索引快速筛选数据
- **关联查询**: 适当使用 JOIN 减少 N+1 查询问题

#### 数据同步优化
- **批量操作**: 批量取消收藏等操作使用事务保证一致性
- **异步处理**: 统计数据更新可异步处理，避免阻塞主流程
- **读写分离**: 统计查询可分发到只读实例

个人中心功能通过完善的数据库设计和 API 接口，为用户提供了完整的个人数据管理功能，支持资源管理、社交互动、内容收藏等核心需求，具备良好的扩展性和性能表现。

