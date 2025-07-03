# 微信小程序教育资源平台数据库设计文档

## 概述

本文档详细描述了微信小程序教育资源平台的数据库设计，包含用户管理、资源共享、学习管理、讨论交流、通知系统、举报管理、用户反馈等核心功能模块的完整数据库表结构设计。

### 数据库表结构总览

| 模块分类 | 表名 | 功能描述 | 记录数量（示例） |
|---------|------|----------|-----------------|
| **核心业务** | users | 用户基础信息和认证 | 3 |
| **资源管理** | categories | 资源分类管理 | 2 |
| | resources | 学习资源核心信息 | 3 |
| | files | 资源关联文件 | 3 |
| **论坛交流** | posts | 论坛帖子内容 | 3 |
| | post_tags | 帖子标签管理 | 3 |
| | post_tag_relations | 帖子标签关联 | 4 |
| | comments | 评论回复系统 | 6 |
| | ratings | 资源评分记录 | 3 |
| **学习管理** | study_plans | 学习计划管理 | 2 |
| | study_tasks | 学习任务管理 | 3 |
| | sub_tasks | 子任务细化管理 | 10 |
| **用户交互** | user_follows | 用户关注关系 | 2 |
| | collections | 多类型收藏管理 | 5 |
| **通知系统** | notifications | 统一消息通知 | 3 |
| | notification_reads | 广播通知已读状态 | 动态 |
| **举报管理** | resource_reports | 资源举报处理 | 2 |
| | post_reports | 帖子举报处理 | 1 |
| **用户反馈** | feedbacks | 用户反馈建议 | 动态 |
| **系统辅助** | verification_codes | 验证码管理 | 临时 |

### 核心特性

- **层级化学习管理**: 计划→任务→子任务三级管理体系，支持时间约束验证
- **完整的内容治理**: 举报系统+审核流程+管理员处理机制
- **多维度用户交互**: 关注、收藏、评论、评分等社交功能
- **智能通知系统**: 分类通知+优先级管理+广播通知支持
- **灵活的分类体系**: 支持资源分类和帖子标签的动态管理

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
| birthday | DATE | | 生日日期 |
| bio | TEXT | | 个人简介 |
| gender | ENUM('M','F','U') | DEFAULT 'U' | 性别：M-男，F-女，U-未知 |
| role | ENUM('user','admin') | DEFAULT 'user' | 用户角色：user-普通用户，admin-管理员 |
| status | ENUM('active','inactive','banned') | DEFAULT 'active' | 用户状态 |
| post_count | INT | DEFAULT 0 | 发帖数 |
| resource_count | INT | DEFAULT 0 | 资源数 |
| follower_count | INT | DEFAULT 0 | 粉丝数 |
| following_count | INT | DEFAULT 0 | 关注数 |
| privacy_settings | JSON | DEFAULT | 隐私设置（JSON格式） |
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
- birthday字段仅在个人资料编辑时可修改，注册时不需要填写

---

## 2. 资源管理模块

### 2.1 资源分类表 (categories)

支持资源分类管理，分类可通过管理后台动态管理。

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

### 2.2 资源表 (resources)

存储学习资源的核心信息，支持完整的审核流程。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| resource_id | VARCHAR(9) | PRIMARY KEY | 9位数字的资源唯一标识符 |
| publisher_phone | VARCHAR(11) | NOT NULL, FK | 发布者手机号（外键） |
| resource_name | VARCHAR(100) | NOT NULL | 资源名称 |
| description | TEXT | | 资源描述 |
| collection_count | INT | DEFAULT 0 | 收藏次数 |
| comment_count | INT | DEFAULT 0 | 评论数量 |
| rating | DECIMAL(4,2) | DEFAULT 0 | 资源评分(1-5分) |
| view_count | INT | DEFAULT 0 | 浏览次数 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| report_count | INT | DEFAULT 0 | 举报次数 |
| status | ENUM('draft','pending','published','rejected','archived') | DEFAULT 'draft' | 资源状态 |
| reviewer_phone | VARCHAR(11) | FK | 审核者手机号（外键） |
| review_comment | TEXT | | 审核意见 |
| reviewed_at | DATE | | 审核时间 |
| category_id | VARCHAR(20) | FK | 分类ID（外键） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**状态说明**:
- **draft**: 草稿状态，用户还在编辑
- **pending**: 待审核状态，已提交等待管理员审核
- **published**: 已发布状态，审核通过对外可见
- **rejected**: 审核拒绝状态，需要修改后重新提交
- **archived**: 已归档状态，不再对外展示

### 2.3 文件表 (files)

存储资源关联的具体文件信息。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| file_id | VARCHAR(9) | PRIMARY KEY | 文件唯一标识符 |
| resource_id | VARCHAR(9) | NOT NULL, FK | 关联资源ID（外键） |
| file_name | VARCHAR(255) | NOT NULL | 文件名称 |
| file_size | BIGINT | | 文件大小（字节） |
| file_type | VARCHAR(50) | | 文件类型/MIME类型 |
| storage_path | VARCHAR(1000) | | 文件存储路径 |
| storage_method | ENUM('local','cloud','table') | DEFAULT 'local' | 存储方式 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 3. 论坛交流模块

### 3.1 帖子表 (posts)

存储论坛帖子的核心信息。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| post_id | VARCHAR(9) | PRIMARY KEY | 帖子唯一标识符 |
| author_phone | VARCHAR(11) | NOT NULL, FK | 作者手机号（外键） |
| title | VARCHAR(200) | NOT NULL | 帖子标题 |
| content | TEXT | NOT NULL | 帖子内容(支持Markdown) |
| view_count | INT | DEFAULT 0 | 浏览次数 |
| comment_count | INT | DEFAULT 0 | 评论数量 |
| collection_count | INT | DEFAULT 0 | 收藏次数 |
| report_count | INT | DEFAULT 0 | 举报次数 |
| status | ENUM('active','hidden','deleted') | DEFAULT 'active' | 帖子状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 3.2 帖子标签表 (post_tags)

管理帖子标签系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| tag_id | VARCHAR(9) | PRIMARY KEY | 帖子标签ID |
| tag_name | VARCHAR(50) | UNIQUE, NOT NULL | 标签名称 |
| tag_color | VARCHAR(7) | DEFAULT '#007aff' | 标签颜色 |
| usage_count | INT | DEFAULT 0 | 使用次数 |
| status | ENUM('active','inactive') | DEFAULT 'active' | 标签状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 3.3 帖子标签关联表 (post_tag_relations)

多对多关系：帖子与标签的关联。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| relation_id | INT | PRIMARY KEY AUTO_INCREMENT | 关联记录ID |
| post_id | VARCHAR(9) | NOT NULL, FK | 帖子ID（外键） |
| tag_id | VARCHAR(9) | NOT NULL, FK | 标签ID（外键） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 3.4 评论表 (comments)

支持帖子和资源的评论，以及评论回复功能。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| comment_id | INT | PRIMARY KEY AUTO_INCREMENT | 评论ID |
| author_phone | VARCHAR(11) | NOT NULL, FK | 评论作者手机号（外键） |
| post_id | VARCHAR(9) | FK | 关联帖子ID（外键） |
| resource_id | VARCHAR(9) | FK | 关联资源ID（外键） |
| parent_comment_id | INT | FK | 父评论ID（外键，支持回复） |
| content | TEXT | NOT NULL | 评论内容 |
| status | ENUM('active','hidden','deleted') | DEFAULT 'active' | 评论状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 3.5 评分表 (ratings)

用户对资源的评分记录。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| rating_id | INT | PRIMARY KEY AUTO_INCREMENT | 评分记录ID |
| user_phone | VARCHAR(11) | NOT NULL, FK | 评分者手机号（外键） |
| resource_id | VARCHAR(9) | NOT NULL, FK | 资源ID（外键） |
| rating | DECIMAL(3,2) | NOT NULL | 评分(1-5分) |
| review_text | TEXT | | 评价文字内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**约束**: 每个用户对每个资源只能评分一次（UNIQUE KEY unique_user_resource）

---

## 4. 学习管理模块

### 4.1 学习计划表 (study_plans)

用户个人学习计划管理。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| plan_id | VARCHAR(9) | PRIMARY KEY | 学习计划ID |
| user_phone | VARCHAR(11) | NOT NULL, FK | 用户手机号（外键） |
| title | VARCHAR(200) | NOT NULL | 计划标题 |
| description | TEXT | | 计划描述 |
| start_date | DATE | | 开始日期 |
| end_date | DATE | | 结束日期 |
| status | ENUM('active','completed','paused','cancelled') | DEFAULT 'active' | 计划状态 |
| progress_percent | INT | DEFAULT 0 | 进度百分比(0-100) |
| plan_type | VARCHAR(50) | | 计划类型 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 计划优先级 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4.2 学习任务表 (study_tasks)

学习计划下的具体任务。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| task_id | VARCHAR(9) | PRIMARY KEY | 学习任务ID |
| plan_id | VARCHAR(9) | NOT NULL, FK | 关联学习计划ID（外键） |
| title | VARCHAR(200) | NOT NULL | 任务标题 |
| description | TEXT | | 任务描述 |
| deadline | DATE | | 截止日期 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 任务优先级 |
| status | ENUM('pending','in_progress','completed','cancelled') | DEFAULT 'pending' | 任务状态 |
| estimated_hours | INT | | 预估学习时长（小时） |
| actual_hours | INT | DEFAULT 0 | 实际学习时长（小时） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4.3 子任务表 (sub_tasks)

学习任务的进一步细分。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| sub_task_id | INT | PRIMARY KEY AUTO_INCREMENT | 子任务ID |
| task_id | VARCHAR(9) | NOT NULL, FK | 关联学习任务ID（外键） |
| title | VARCHAR(200) | NOT NULL | 子任务标题 |
| description | TEXT | | 子任务描述 |
| completed | BOOLEAN | DEFAULT FALSE | 是否完成 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| deadline | DATE | | 截止日期 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| estimated_minutes | INT | | 预估时长（分钟） |
| notes | TEXT | | 备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 5. 用户交互模块

### 5.1 收藏表 (collections)

统一管理用户对帖子和资源的收藏。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| collection_id | VARCHAR(9) | PRIMARY KEY | 收藏记录ID |
| user_phone | VARCHAR(11) | NOT NULL, FK | 收藏者手机号（外键） |
| content_id | VARCHAR(9) | NOT NULL | 被收藏内容ID |
| collection_type | ENUM('post','resource') | NOT NULL | 收藏内容类型 |
| status | ENUM('active','cancelled') | DEFAULT 'active' | 收藏状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**约束**: 每个用户对每个内容只能收藏一次（UNIQUE KEY unique_user_content）

### 5.2 用户关注表 (user_follows)

用户之间的关注关系。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| follow_id | VARCHAR(9) | PRIMARY KEY | 关注记录ID |
| follower_phone | VARCHAR(11) | NOT NULL, FK | 关注者手机号（外键） |
| following_phone | VARCHAR(11) | NOT NULL, FK | 被关注者手机号（外键） |
| status | ENUM('active','cancelled') | DEFAULT 'active' | 关注状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**约束**: 每个用户对每个用户只能关注一次（UNIQUE KEY unique_follow）

---

## 6. 通知系统模块

### 6.1 通知表 (notifications)

统一的消息通知系统，支持个人通知和广播通知。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| notification_id | VARCHAR(9) | PRIMARY KEY | 9位数字的通知唯一标识符 |
| receiver_phone | VARCHAR(11) | FK | 接收者手机号（为空表示广播通知，面向全体用户） |
| type | ENUM('system','study','interaction','resource','announcement') | NOT NULL | 通知类型 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| title | VARCHAR(200) | NOT NULL | 通知标题 |
| content | TEXT | NOT NULL | 通知内容 |
| action_type | ENUM('none','navigate','external_link') | DEFAULT 'none' | 动作类型 |
| action_url | VARCHAR(500) | | 动作URL（页面路径或外部链接） |
| action_params | JSON | | 动作参数（JSON格式） |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读（仅用于个人通知） |
| read_at | DATE | | 阅读时间（仅用于个人通知） |
| expires_at | DATE | | 过期时间（可选） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**通知类型说明**:
- **system**: 系统通知
- **study**: 学习相关通知
- **interaction**: 互动通知（关注、评论等）
- **resource**: 资源相关通知
- **announcement**: 公告通知

### 6.2 广播通知已读状态表 (notification_reads)

跟踪用户对广播通知的已读状态。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 记录ID |
| user_phone | VARCHAR(11) | NOT NULL, FK | 用户手机号（外键） |
| notification_id | VARCHAR(9) | NOT NULL, FK | 通知ID（外键） |
| read_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 阅读时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**约束**: 每个用户对每个广播通知只能有一条已读记录（UNIQUE KEY unique_user_notification）

**通知系统架构**:
- **个人通知**: receiver_phone 指定具体用户，使用 is_read 字段标记已读状态
- **广播通知**: receiver_phone 为 NULL，通过 notification_reads 表跟踪各用户的已读状态
- **存储优化**: 广播通知内容只存储一次，避免数据重复
- **查询效率**: 使用 LEFT JOIN 查询组合通知内容和已读状态

---

## 7. 举报管理模块

### 7.1 资源举报表 (resource_reports)

资源举报处理系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| report_id | VARCHAR(9) | PRIMARY KEY | 举报记录ID |
| resource_id | VARCHAR(9) | NOT NULL, FK | 被举报资源ID（外键） |
| reporter_phone | VARCHAR(11) | NOT NULL, FK | 举报者手机号（外键） |
| reason | ENUM('inappropriate','spam','copyright','misleading','other') | NOT NULL | 举报原因 |
| description | TEXT | NOT NULL | 举报说明 |
| status | ENUM('pending','processing','resolved','rejected') | DEFAULT 'pending' | 处理状态 |
| processed_by | VARCHAR(11) | FK | 处理者手机号（外键） |
| process_comment | TEXT | | 处理说明 |
| processed_at | DATE | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 7.2 帖子举报表 (post_reports)

帖子举报处理系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| report_id | VARCHAR(9) | PRIMARY KEY | 举报记录ID |
| post_id | VARCHAR(9) | NOT NULL, FK | 被举报帖子ID（外键） |
| reporter_phone | VARCHAR(11) | NOT NULL, FK | 举报者手机号（外键） |
| reason | ENUM('inappropriate','spam','harassment','misleading','other') | NOT NULL | 举报原因 |
| description | TEXT | NOT NULL | 举报说明 |
| status | ENUM('pending','processing','resolved','rejected') | DEFAULT 'pending' | 处理状态 |
| processed_by | VARCHAR(11) | FK | 处理者手机号（外键） |
| process_comment | TEXT | | 处理说明 |
| processed_at | DATE | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 8. 用户反馈模块

### 8.1 用户反馈表 (feedbacks)

用户对平台的意见建议收集。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| feedback_id | VARCHAR(9) | PRIMARY KEY | 反馈记录ID |
| user_phone | VARCHAR(11) | FK | 用户手机号（外键，可为空支持匿名反馈） |
| type | ENUM('bug','feature','improvement','complaint','other') | NOT NULL | 反馈类型 |
| title | VARCHAR(200) | NOT NULL | 反馈标题 |
| content | TEXT | NOT NULL | 反馈内容 |
| contact | VARCHAR(100) | | 联系方式（邮箱或手机号） |
| status | ENUM('pending','processing','resolved','closed') | DEFAULT 'pending' | 处理状态 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| reply | TEXT | | 回复内容 |
| processed_by | VARCHAR(11) | FK | 处理者手机号（外键） |
| processed_at | DATE | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 9. 系统辅助模块

### 9.1 验证码表 (verification_codes)

短信验证码管理（临时存储）。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 记录ID |
| phone_number | VARCHAR(11) | NOT NULL | 手机号 |
| code | VARCHAR(6) | NOT NULL | 验证码 |
| type | ENUM('register','login','reset_password') | NOT NULL | 验证码类型 |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| used | BOOLEAN | DEFAULT FALSE | 是否已使用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

## 10. 索引设计

### 主要索引

1. **用户表索引**:
   - PRIMARY KEY: phone_number
   - UNIQUE INDEX: student_id
   - INDEX: status, role

2. **资源表索引**:
   - PRIMARY KEY: resource_id
   - INDEX: publisher_phone, status, category_id
   - INDEX: (status, created_at) 用于列表查询

3. **帖子表索引**:
   - PRIMARY KEY: post_id
   - INDEX: author_phone, status
   - INDEX: (status, created_at) 用于列表查询

4. **评论表索引**:
   - PRIMARY KEY: comment_id
   - INDEX: post_id, resource_id, parent_comment_id
   - INDEX: author_phone

5. **通知表索引**:
   - PRIMARY KEY: notification_id
   - INDEX: receiver_phone, type, priority
   - INDEX: (priority, created_at) 用于排序

6. **通知已读表索引**:
   - PRIMARY KEY: id
   - UNIQUE INDEX: (user_phone, notification_id)
   - INDEX: user_phone, notification_id

---

## 11. 外键约束关系

### 主要外键关系

```sql
-- 资源相关
resources.publisher_phone → users.phone_number
resources.reviewer_phone → users.phone_number
resources.category_id → categories.category_id
files.resource_id → resources.resource_id

-- 论坛相关
posts.author_phone → users.phone_number
post_tag_relations.post_id → posts.post_id
post_tag_relations.tag_id → post_tags.tag_id
comments.author_phone → users.phone_number
comments.post_id → posts.post_id
comments.resource_id → resources.resource_id
comments.parent_comment_id → comments.comment_id

-- 学习管理相关
study_plans.user_phone → users.phone_number
study_tasks.plan_id → study_plans.plan_id
sub_tasks.task_id → study_tasks.task_id

-- 用户交互相关
user_follows.follower_phone → users.phone_number
user_follows.following_phone → users.phone_number
collections.user_phone → users.phone_number
ratings.user_phone → users.phone_number
ratings.resource_id → resources.resource_id

-- 通知相关
notifications.receiver_phone → users.phone_number
notification_reads.user_phone → users.phone_number
notification_reads.notification_id → notifications.notification_id

-- 举报相关
resource_reports.resource_id → resources.resource_id
resource_reports.reporter_phone → users.phone_number
resource_reports.processed_by → users.phone_number
post_reports.post_id → posts.post_id
post_reports.reporter_phone → users.phone_number
post_reports.processed_by → users.phone_number

-- 反馈相关
feedbacks.user_phone → users.phone_number
feedbacks.processed_by → users.phone_number
```

---

## 12. 数据完整性约束

### 唯一性约束

1. **用户相关**:
   - 每个手机号只能注册一个账户
   - 每个学号只能被一个用户使用

2. **收藏相关**:
   - 每个用户对每个内容只能收藏一次

3. **关注相关**:
   - 每个用户对每个用户只能关注一次

4. **评分相关**:
   - 每个用户对每个资源只能评分一次

5. **通知相关**:
   - 每个用户对每个广播通知只能有一条已读记录

### 业务规则约束

1. **时间约束**:
   - 学习计划的结束时间不能早于开始时间
   - 子任务的截止时间不能晚于父任务的截止时间

2. **状态转换约束**:
   - 资源状态只能按照 draft → pending → published/rejected 的流程转换
   - 学习任务完成后不能回退到进行中状态

3. **数据一致性约束**:
   - 评论数、收藏数等统计字段与实际记录数保持一致
   - 用户的关注数、粉丝数与关注关系表保持一致

---

## 13. 性能优化建议

### 查询优化

1. **分页查询优化**:
   - 使用基于游标的分页替代 OFFSET/LIMIT
   - 合理使用复合索引支持排序和筛选

2. **统计查询优化**:
   - 使用冗余字段存储计数，定期同步
   - 对于复杂统计使用缓存或物化视图

3. **全文搜索优化**:
   - 对标题、内容字段建立全文索引
   - 考虑引入Elasticsearch等专门的搜索引擎

### 存储优化

1. **JSON字段优化**:
   - 合理使用JSON字段存储灵活数据结构
   - 避免JSON字段过大影响查询性能

2. **文件存储优化**:
   - 大文件使用云存储，数据库只存储元数据
   - 实现文件去重机制

3. **数据归档策略**:
   - 定期归档历史数据
   - 实现软删除机制保护重要数据

---

## 14. 安全考虑

### 数据安全

1. **敏感信息保护**:
   - 密码使用bcrypt加密存储
   - 个人隐私信息根据privacy_settings控制可见性

2. **SQL注入防护**:
   - 使用参数化查询
   - 对用户输入进行严格验证

3. **权限控制**:
   - 基于角色的访问控制(RBAC)
   - API级别的权限验证

### 业务安全

1. **防刷机制**:
   - 验证码有效期和使用次数限制
   - API调用频率限制

2. **内容安全**:
   - 举报系统配合人工审核
   - 敏感词过滤机制

3. **数据备份**:
   - 定期数据库备份
   - 重要操作日志记录

---

这个数据库设计支持完整的教育资源平台功能，具有良好的扩展性和维护性。通过合理的表结构设计、索引优化和约束管理，能够满足平台的性能和安全需求。