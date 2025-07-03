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
| | tags | 资源标签体系 | 动态 |
| | resource_tags | 资源标签关联 | 动态 |
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
| **通知系统** | notifications | 统一消息通知 | 2 |
| | notification_reads | 广播通知已读状态 | 动态 |
| **举报管理** | resource_reports | 资源举报处理 | 2 |
| | post_reports | 帖子举报处理 | 1 |
| **用户反馈** | feedbacks | 用户反馈建议 | 动态 |
| **系统辅助** | verification_codes | 验证码管理 | 临时 |

### 核心特性

- **层级化学习管理**: 计划→任务→子任务三级管理体系，支持时间约束验证
- **完整的内容治理**: 举报系统+审核流程+管理员处理机制
- **多维度用户交互**: 关注、收藏、评论、评分等社交功能
- **智能通知系统**: 分类通知+优先级管理+过期清理
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
| report_count | INT | DEFAULT 0 | 举报次数 |
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
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

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

**时间约束规则：**
- **计划层级约束**：结束时间不得早于当前时间 `end_date >= CURDATE()`
- **时间逻辑约束**：结束时间必须晚于开始时间 `end_date >= start_date`
- **子任务时间约束**：所有关联任务的时间必须在计划时间范围内
- **修改时验证**：变更计划时间时需要检查所有子任务的时间合法性

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

**时间约束规则：**
- **任务层级约束**：任务时间必须在所属计划时间范围内
- **开始时间约束**：任务开始时间不得早于计划开始时间 `task.start_date >= plan.start_date`
- **截止时间约束**：任务截止时间不得晚于计划结束时间 `task.deadline <= plan.end_date`
- **子任务时间约束**：所有关联子任务的时间必须在任务时间范围内
- **级联验证**：变更任务时间时需要验证所有子任务的时间合法性

### 3.3 子任务表 (sub_tasks)

支持任务的细化分解，提供完整的二级任务管理功能。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| subtask_id | INT | PRIMARY KEY, AUTO_INCREMENT | 子任务ID |
| task_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 关联学习任务表 |
| title | VARCHAR(200) | NOT NULL | 子任务标题 |
| description | TEXT | | 子任务详细描述 |
| deadline | DATE | | 子任务截止日期 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 子任务优先级 |
| completed | BOOLEAN | DEFAULT FALSE | 是否已完成 |
| sort_order | INT | DEFAULT 0 | 排序顺序 |
| estimated_minutes | INT | | 预估完成时间（分钟） |
| notes | TEXT | | 子任务备注和说明 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**业务特点：**
- **完整的二级任务管理**：支持任务的深度细化分解，提高任务管理精度
- **层级化时间约束**：子任务截止时间必须在父任务时间范围内
- **优先级管理**：支持子任务优先级设置，影响任务进度权重计算
- **灵活排序**：提供拖拽排序功能，便于用户调整执行顺序
- **进度传递**：子任务完成状态自动影响父任务和计划的整体进度
- **时间估算**：支持子任务时间预估，帮助用户进行时间管理
- **详细记录**：提供描述和备注字段，支持详细的任务说明

**时间约束规则：**
- 子任务截止时间必须在父任务的时间范围内：`subtask.deadline >= task.start_date AND subtask.deadline <= task.deadline`
- 子任务时间变更时需要验证是否违反层级约束
- 父任务时间变更时需要检查所有子任务的时间合法性

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
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

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
| collection_count | INT | DEFAULT 0 | 收藏次数 |
| report_count | INT | DEFAULT 0 | 举报次数 |
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
| receiver_phone | VARCHAR(11) | FOREIGN KEY | 接收者手机号（为空表示广播通知，面向全体用户） |
| type | ENUM('system','study','interaction','resource','announcement') | NOT NULL | 通知类型 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| title | VARCHAR(200) | NOT NULL | 通知标题 |
| content | TEXT | NOT NULL | 通知内容 |
| action_type | ENUM('navigate','external_link','none') | DEFAULT 'none' | 操作类型 |
| action_url | VARCHAR(500) | | 操作链接 |
| action_params | JSON | | 操作参数（JSON格式） |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |
| read_at | TIMESTAMP | | 已读时间 |
| expires_at | TIMESTAMP | | 过期时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**广播通知功能：**
- **个人通知**：receiver_phone 不为空，发送给特定用户
- **广播通知**：receiver_phone 为空，面向全体用户
- **通知类型**：系统公告、重要更新、维护通知等可设为广播
- **管理界面**：管理员可通过后台发布广播通知
- **查询逻辑**：用户查询通知需要包含个人通知和广播通知
- **系统通知**：所有通知都是系统通知，无发送者身份

**广播通知已读状态表 (notification_reads)：**

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| notification_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 通知ID |
| read_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 阅读时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**唯一约束：** `UNIQUE(user_phone, notification_id)` - 防止同一用户对同一通知重复标记已读

**通知查询规则：**
```sql
-- 用户查询自己的通知（包括个人通知和广播通知）
SELECT n.*, 
       CASE 
         WHEN n.receiver_phone IS NULL THEN nr.read_at IS NOT NULL
         ELSE n.is_read 
       END as is_read,
       CASE 
         WHEN n.receiver_phone IS NULL THEN nr.read_at
         ELSE n.read_at 
       END as read_at
FROM notifications n
LEFT JOIN notification_reads nr ON (n.receiver_phone IS NULL AND nr.notification_id = n.notification_id AND nr.user_phone = '用户手机号')
WHERE n.receiver_phone = '用户手机号' OR n.receiver_phone IS NULL
ORDER BY n.priority DESC, n.created_at DESC;
```

**通知管理规则：**
- **广播通知创建**：在notifications表创建一条receiver_phone为NULL的记录
- **个人通知创建**：在notifications表创建receiver_phone不为空的记录
- **广播通知已读**：在notification_reads表插入记录
- **个人通知已读**：更新notifications表的is_read和read_at字段
- **存储优化**：广播通知内容只存储一份，已读状态分别记录

**未读数量统计：**
```sql
-- 统计用户未读通知数量
SELECT COUNT(*) FROM (
  -- 个人通知未读数
  SELECT 1 FROM notifications 
  WHERE receiver_phone = '用户手机号' AND is_read = false
  UNION ALL
  -- 广播通知未读数
  SELECT 1 FROM notifications n
  WHERE n.receiver_phone IS NULL 
    AND NOT EXISTS (
      SELECT 1 FROM notification_reads nr 
      WHERE nr.notification_id = n.notification_id 
        AND nr.user_phone = '用户手机号'
    )
) AS unread_count;
```

---

## 7. 举报管理模块

### 7.1 资源举报表 (resource_reports)

处理用户对资源的举报投诉。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| report_id | VARCHAR(9) | PRIMARY KEY | 9位数字的举报记录唯一标识符 |
| resource_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 被举报资源ID |
| reporter_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 举报者手机号 |
| reason | ENUM('inappropriate','copyright','spam','offensive','other') | NOT NULL | 举报原因 |
| description | TEXT | | 详细描述 |
| status | ENUM('pending','processed','rejected') | DEFAULT 'pending' | 处理状态 |
| processed_by | VARCHAR(11) | FOREIGN KEY | 处理人手机号 |
| process_result | TEXT | | 处理结果说明 |
| processed_at | TIMESTAMP | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**举报原因说明：**
- **inappropriate**: 内容不当
- **copyright**: 版权问题
- **spam**: 垃圾信息
- **offensive**: 攻击性内容
- **other**: 其他原因

### 7.2 帖子举报表 (post_reports)

处理用户对帖子的举报投诉。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| report_id | VARCHAR(9) | PRIMARY KEY | 9位数字的举报记录唯一标识符 |
| post_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 被举报帖子ID |
| reporter_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 举报者手机号 |
| reason | ENUM('inappropriate','spam','offensive','harassment','false_info','other') | NOT NULL | 举报原因 |
| description | TEXT | | 详细描述 |
| status | ENUM('pending','processed','rejected') | DEFAULT 'pending' | 处理状态 |
| processed_by | VARCHAR(11) | FOREIGN KEY | 处理人手机号 |
| process_result | TEXT | | 处理结果说明 |
| processed_at | TIMESTAMP | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**举报原因说明：**
- **inappropriate**: 内容不当
- **spam**: 垃圾信息
- **offensive**: 攻击性内容
- **harassment**: 骚扰行为
- **false_info**: 虚假信息
- **other**: 其他原因

**举报处理流程：**
1. 用户提交举报 → `pending` 状态
2. 管理员审核举报 → 更新 `processed_by` 和 `process_result`
3. 处理完成 → `processed` 状态，记录处理时间
4. 若举报无效 → `rejected` 状态

---

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
     ↓                    ↓                   ↓
   进度跟踪             任务进度跟踪        子任务状态管理
     ↓                    ↓                   ↓
 自动更新              学习记录表          经验值系统
     ↓                    ↓                   ↓
 层级化时间约束        时间约束验证       时间冲突检测
     ↓
学习目标表（目标设定和追踪）
```

**层级化时间约束体系：**
- **计划级约束**: `plan.end_date >= CURDATE()` 且 `plan.end_date >= plan.start_date`
- **任务级约束**: `task.deadline <= plan.end_date` 且 `task.start_date >= plan.start_date`
- **子任务级约束**: `subtask.deadline <= task.deadline` 且 `subtask.deadline >= task.start_date`
- **级联验证**: 上级时间变更时自动验证下级时间合法性

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

#### 6. 内容治理关系网络
```
资源表 ←--一对多--→ 资源举报表 ←--多对一--→ 用户表（举报者、处理者）
帖子表 ←--一对多--→ 帖子举报表 ←--多对一--→ 用户表（举报者、处理者）
  ↓                         ↓
举报原因分类            处理状态管理
  ↓                         ↓
管理员审核              举报统计
```

#### 7. 用户反馈关系网络
```
用户表 ←--一对多--→ 用户反馈表
  ↓                    ↓
反馈类型分类        管理员回复
  ↓                    ↓
图片附件管理        处理状态跟踪
```

#### 8. 系统辅助关系网络
```
用户表 ←--一对多--→ 验证码表
  ↓                    ↓
手机号验证          过期时间管理
  ↓                    ↓
安全认证            定时清理
```

### 业务流程关系

#### 资源分享流程
1. 用户发布资源 → `resources` 表
2. 选择资源分类 → `category_id` 字段关联
3. 上传相关文件 → `files` 表
4. 其他用户浏览资源 → 更新浏览统计字段

#### 学习管理流程
1. **创建学习计划** → `study_plans` 表（自动记录学习活动，奖励15经验值）
   - 时间约束验证：结束时间 >= 当前时间
   - 逻辑约束验证：结束时间 >= 开始时间
2. **制定学习任务** → `study_tasks` 表
   - 层级约束验证：任务时间必须在计划时间范围内
   - 支持多个任务并行管理
3. **分解子任务** → `sub_tasks` 表（可选，支持复杂任务管理）
   - 子任务时间约束：必须在父任务时间范围内
   - 支持优先级和时间估算设置
4. **完成任务/子任务** → 状态更新（自动记录学习活动，奖励经验值）
   - 子任务完成 → 影响任务进度计算
   - 任务完成 → 影响计划进度计算
5. **自动更新计划进度** → 基于任务和子任务完成情况实时计算
   - 支持加权进度计算（基于优先级）
   - 实时同步到前端界面
6. **学习轨迹追踪** → `study_records` 表记录所有学习活动
   - 详细记录时间投入和经验获得
   - 支持学习效率分析

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

## 数据库设计总结

本数据库设计充分考虑了教育资源平台的业务特点，构建了完整的学习生态系统：

### 🎯 核心设计亮点

1. **完整的学习管理体系**
   - 三级学习管理：计划→任务→子任务
   - 层级化时间约束验证系统
   - 智能进度计算和经验值奖励

2. **全面的内容治理机制**
   - 资源审核流程（draft→pending→published/rejected）
   - 用户举报系统（资源+帖子）
   - 管理员处理工作流

3. **丰富的用户交互功能**
   - 多维度社交系统（关注、收藏、评论、评分）
   - 分类通知系统（系统、学习、互动等）
   - 用户反馈建议机制

4. **健壮的系统架构**
   - 基于角色的权限控制（user/admin）
   - 完善的数据完整性约束
   - 优化的索引和查询性能

### 📊 数据规模说明

- **24个核心表**，覆盖完整业务流程
- **支持百万级用户**和海量学习数据
- **模块化设计**，便于功能扩展和维护
- **标准化字段**，确保数据一致性

### 🔧 技术特色

- **业务ID设计**：手机号+9位数字ID体系
- **软删除机制**：状态管理而非物理删除
- **时间约束系统**：多层级时间验证
- **统计字段冗余**：提升查询性能

### 🚀 扩展支持

该设计支持用户的完整学习生态系统，从资源获取到学习计划管理，再到社区互动交流和系统反馈，为用户提供一站式的学习服务体验。数据库设计具备良好的扩展性，可支持未来功能迭代和系统升级需求。

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

---

## 8. 举报管理模块

举报管理模块提供了完整的用户举报和管理员审核功能，支持对不当资源和帖子内容的举报处理流程。

### 8.1 资源举报表 (resource_reports)

用户对资源内容进行举报的记录表，支持多种举报原因和完整的处理流程。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| report_id | VARCHAR(9) | PRIMARY KEY | 举报记录ID，9位数字（以7开头） |
| resource_id | VARCHAR(9) | NOT NULL | 被举报资源ID（外键） |
| reporter_phone | VARCHAR(11) | NOT NULL | 举报者手机号（外键） |
| reason | ENUM | NOT NULL | 举报原因：inappropriate, copyright, spam, offensive, other |
| description | TEXT | | 详细描述 |
| status | ENUM | DEFAULT 'pending' | 处理状态：pending-待处理，processed-已处理，rejected-已驳回 |
| processed_by | VARCHAR(11) | | 处理人手机号（外键） |
| process_result | TEXT | | 处理结果说明 |
| processed_at | TIMESTAMP | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**举报原因说明**:
- **inappropriate**: 内容不当
- **copyright**: 版权问题
- **spam**: 垃圾信息
- **offensive**: 冒犯性内容
- **other**: 其他

**外键关系**:
- `resource_id` → `resources.resource_id`
- `reporter_phone` → `users.phone_number`
- `processed_by` → `users.phone_number`

### 8.2 帖子举报表 (post_reports)

用户对帖子内容进行举报的记录表，支持针对论坛内容的举报管理。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| report_id | VARCHAR(9) | PRIMARY KEY | 举报记录ID，9位数字（以7开头） |
| post_id | VARCHAR(9) | NOT NULL | 被举报帖子ID（外键） |
| reporter_phone | VARCHAR(11) | NOT NULL | 举报者手机号（外键） |
| reason | ENUM | NOT NULL | 举报原因：inappropriate, spam, offensive, harassment, false_info, other |
| description | TEXT | | 详细描述 |
| status | ENUM | DEFAULT 'pending' | 处理状态：pending-待处理，processed-已处理，rejected-已驳回 |
| processed_by | VARCHAR(11) | | 处理人手机号（外键） |
| process_result | TEXT | | 处理结果说明 |
| processed_at | TIMESTAMP | | 处理时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**帖子举报原因说明**:
- **inappropriate**: 内容不当
- **spam**: 垃圾信息
- **offensive**: 冒犯性内容
- **harassment**: 骚扰他人
- **false_info**: 虚假信息
- **other**: 其他

**外键关系**:
- `post_id` → `posts.post_id`
- `reporter_phone` → `users.phone_number`
- `processed_by` → `users.phone_number`

### 8.3 举报处理流程

#### 用户举报流程
1. **提交举报**: 用户选择举报原因，填写详细描述
2. **重复检查**: 系统检查是否重复举报（同一用户对同一内容的待处理举报）
3. **记录创建**: 创建举报记录，状态为 'pending'
4. **统计更新**: 增加被举报内容的 report_count 计数

#### 管理员处理流程
1. **查看列表**: 管理员查看待处理的举报列表
2. **详细审核**: 查看举报详情和被举报内容
3. **处理决定**: 
   - **接受举报**: 删除/隐藏被举报内容，更新举报状态为 'processed'
   - **拒绝举报**: 保留内容，更新举报状态为 'rejected'
4. **通知发送**: 向举报者发送处理结果通知
5. **记录更新**: 记录处理人、处理时间和处理结果

### 8.4 API 接口设计

#### 用户举报接口
```http
POST /api/v1/reports/resources/{resourceId}
POST /api/v1/reports/posts/{postId}
GET /api/v1/reports/my-reports?type={type}&page={page}&limit={limit}
GET /api/v1/reports/reasons?type={type}
DELETE /api/v1/reports/{reportId}?type={type}
Authorization: Bearer {token}
```

#### 管理员处理接口
```http
GET /api/v1/admin/resources/reports?status={status}&page={page}&limit={limit}
POST /api/v1/admin/resources/reports/{reportId}/handle
GET /api/v1/admin/posts/reports?status={status}&page={page}&limit={limit}
POST /api/v1/admin/posts/reports/{reportId}/handle
Authorization: Bearer {admin_token}
```

### 8.5 业务规则

#### 举报限制
- **重复举报**: 同一用户对同一内容只能有一个待处理的举报
- **自举报**: 用户不能举报自己发布的内容
- **频率限制**: 可设置用户举报频率限制，防止恶意举报

#### 处理规则
- **管理员权限**: 只有管理员可以处理举报
- **处理记录**: 所有处理操作都会记录处理人和处理时间
- **通知机制**: 处理完成后自动向举报者发送通知
- **内容管理**: 接受举报时自动更新被举报内容状态

#### 数据统计
- **举报统计**: 资源和帖子表中的 report_count 字段实时统计举报次数
- **处理统计**: 可统计管理员处理举报的效率和结果分布
- **趋势分析**: 支持举报数据的时间趋势分析

### 8.6 技术实现

#### 后端模型
- **ResourceReport**: 资源举报模型，包含ID生成和关联关系
- **PostReport**: 帖子举报模型，支持扩展的举报原因
- **AdminController**: 管理员处理举报的控制器方法
- **ReportController**: 用户举报功能的控制器方法

#### 前端界面
- **举报按钮**: 在资源和帖子页面添加举报功能入口
- **举报表单**: 选择举报原因和填写详细描述的表单
- **我的举报**: 用户查看自己的举报记录和处理状态
- **管理界面**: 管理员查看和处理举报的后台界面

#### 数据库优化
```sql
-- 举报查询优化索引
CREATE INDEX idx_resource_reports_status ON resource_reports(status, created_at DESC);
CREATE INDEX idx_post_reports_status ON post_reports(status, created_at DESC);
CREATE INDEX idx_resource_reports_reporter ON resource_reports(reporter_phone, status);
CREATE INDEX idx_post_reports_reporter ON post_reports(reporter_phone, status);

-- 防止重复举报的唯一约束
CREATE UNIQUE INDEX idx_resource_reports_unique ON resource_reports(resource_id, reporter_phone, status) WHERE status = 'pending';
CREATE UNIQUE INDEX idx_post_reports_unique ON post_reports(post_id, reporter_phone, status) WHERE status = 'pending';
```

举报管理模块通过完善的数据库设计和业务流程，为平台提供了有效的内容治理机制，保障了平台内容质量和用户体验。

---

## 9. 用户反馈模块

### 9.1 用户反馈表 (feedbacks)

用户向管理员提交系统反馈和建议的记录表，支持多种反馈类型和处理流程。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 反馈记录ID |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号（外键） |
| type | VARCHAR(32) | NOT NULL | 反馈类型：bug/feature/ui/performance/content/other |
| content | TEXT | NOT NULL | 反馈内容详情 |
| contact | VARCHAR(64) | | 用户联系方式（可选） |
| images | TEXT | | 图片URL数组，JSON字符串格式 |
| status | VARCHAR(16) | DEFAULT 'pending' | 处理状态：pending-待处理，processing-处理中，resolved-已解决，closed-已关闭 |
| reply | TEXT | | 管理员回复内容 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**反馈类型说明**:
- **bug**: 系统错误反馈
- **feature**: 功能建议
- **ui**: 界面设计问题
- **performance**: 性能问题
- **content**: 内容相关问题
- **other**: 其他类型反馈

**处理状态流程**:
1. **pending**: 用户提交后的初始状态
2. **processing**: 管理员开始处理
3. **resolved**: 问题已解决，等待用户确认
4. **closed**: 反馈已关闭（问题解决或无效反馈）

**外键关系**:
- `user_phone` → `users.phone_number`

### 9.2 反馈管理功能

#### 用户反馈提交
- 支持多种反馈类型选择
- 可选择上传相关截图（最多3张）
- 可留下联系方式便于跟进
- 支持匿名反馈（不强制登录）

#### 管理员处理流程
1. **查看反馈列表**: 按状态、类型、时间筛选
2. **详细审核**: 查看反馈内容、图片和用户信息
3. **回复用户**: 提供解决方案或处理进度
4. **状态更新**: 根据处理进度更新状态
5. **批量操作**: 支持批量关闭、分类处理

#### API接口设计
```http
# 用户提交反馈
POST /api/v1/feedback
Authorization: Bearer {token} (可选)
Content-Type: application/json
{
  "type": "bug",
  "content": "反馈内容",
  "contact": "联系方式",
  "images": ["image1.jpg", "image2.jpg"]
}

# 用户查看自己的反馈
GET /api/v1/feedback/my?status={status}&page={page}&limit={limit}
Authorization: Bearer {token}

# 管理员查看所有反馈
GET /api/v1/admin/feedback?type={type}&status={status}&page={page}&limit={limit}
Authorization: Bearer {admin_token}

# 管理员回复反馈
POST /api/v1/admin/feedback/{id}/reply
Authorization: Bearer {admin_token}
Content-Type: application/json
{
  "reply": "回复内容",
  "status": "resolved"
}
```

---

## 10. 系统辅助模块

### 10.1 验证码表 (verification_codes)

用于短信验证码和邮箱验证码的临时存储和验证。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | 验证码记录ID |
| phone_number | VARCHAR(11) | NOT NULL | 手机号 |
| code | VARCHAR(6) | NOT NULL | 6位数字验证码 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| status | ENUM('valid','used','expired') | DEFAULT 'valid' | 验证码状态 |

**业务特点**:
- **安全性**: 6位随机数字码，5分钟有效期
- **频率限制**: 同一手机号60秒内只能发送一次
- **状态管理**: valid-有效，used-已使用，expired-已过期
- **自动清理**: 定时清理过期的验证码记录

**验证流程**:
1. **发送验证码**: 生成随机6位数字，设置5分钟过期时间
2. **验证码校验**: 检查手机号、验证码、有效期和状态
3. **使用后标记**: 验证成功后将状态更改为'used'
4. **定时清理**: 每日清理过期和已使用的验证码

#### API接口设计
```http
# 发送验证码
POST /api/v1/auth/send-code
Content-Type: application/json
{
  "phone_number": "13800138000"
}

# 验证验证码
POST /api/v1/auth/verify-code
Content-Type: application/json
{
  "phone_number": "13800138000",
  "code": "123456"
}
```

### 10.2 索引优化建议

#### 反馈表优化
```sql
-- 反馈状态查询优化
CREATE INDEX idx_feedbacks_status_created ON feedbacks(status, created_at DESC);
CREATE INDEX idx_feedbacks_user_status ON feedbacks(user_phone, status);
CREATE INDEX idx_feedbacks_type_status ON feedbacks(type, status);
```

#### 验证码表优化
```sql
-- 验证码查询优化
CREATE INDEX idx_verification_phone_status ON verification_codes(phone_number, status, expires_at);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);
CREATE INDEX idx_verification_created ON verification_codes(created_at);
```

---

## 学习管理模块增强设计

### 子任务管理系统

#### API设计规范

**子任务管理接口**
```http
# 获取任务的所有子任务
GET /api/v1/study-plans/tasks/{taskId}/subtasks
Authorization: Bearer {token}

# 创建子任务
POST /api/v1/study-plans/tasks/{taskId}/subtasks
Authorization: Bearer {token}
Content-Type: application/json
{
  "title": "子任务标题",
  "description": "子任务描述",
  "deadline": "2024-12-31",
  "priority": "medium",
  "estimated_minutes": 120,
  "notes": "备注信息"
}

# 更新子任务
PUT /api/v1/study-plans/subtasks/{subtaskId}
Authorization: Bearer {token}
Content-Type: application/json

# 批量更新子任务排序
PATCH /api/v1/study-plans/tasks/{taskId}/subtasks/reorder
Authorization: Bearer {token}
Content-Type: application/json
{
  "subtasks": [
    {"subtask_id": 1, "sort_order": 1},
    {"subtask_id": 2, "sort_order": 2}
  ]
}

# 切换子任务完成状态
PATCH /api/v1/study-plans/subtasks/{subtaskId}/toggle
Authorization: Bearer {token}

# 删除子任务
DELETE /api/v1/study-plans/subtasks/{subtaskId}
Authorization: Bearer {token}
```

#### 时间约束验证系统

**验证层级架构**
```javascript
// 1. 前端实时验证
function validateSubtaskTime(subtask, parentTask) {
  if (subtask.deadline > parentTask.deadline) {
    return { valid: false, message: '子任务截止时间不能晚于任务截止时间' }
  }
  if (subtask.deadline < parentTask.start_date) {
    return { valid: false, message: '子任务截止时间不能早于任务开始时间' }
  }
  return { valid: true }
}

// 2. 后端API验证
async function validateTimeConstraints(req, res, next) {
  const { taskId, deadline } = req.body
  const task = await StudyTask.findByPk(taskId)
  const plan = await StudyPlan.findByPk(task.plan_id)
  
  // 层级化验证
  if (deadline > task.deadline || deadline < task.start_date) {
    return res.status(400).json({
      success: false,
      message: '子任务时间不在任务时间范围内'
    })
  }
  
  next()
}

// 3. 数据库约束
ALTER TABLE sub_tasks 
ADD CONSTRAINT check_deadline_range 
CHECK (deadline IS NULL OR (
  deadline >= (SELECT start_date FROM study_tasks 
               WHERE task_id = sub_tasks.task_id) AND
  deadline <= (SELECT deadline FROM study_tasks 
               WHERE task_id = sub_tasks.task_id)
))
```

#### 进度计算算法优化

**加权进度计算**
```javascript
// 子任务进度影响任务进度
function calculateTaskProgress(task) {
  const subtasks = task.subtasks || []
  if (subtasks.length === 0) {
    return task.status === 'completed' ? 100 : 0
  }
  
  // 基于优先级的加权计算
  const weights = { high: 3, medium: 2, low: 1 }
  let totalWeight = 0
  let completedWeight = 0
  
  subtasks.forEach(subtask => {
    const weight = weights[subtask.priority] || 1
    totalWeight += weight
    if (subtask.completed) {
      completedWeight += weight
    }
  })
  
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
}

// 任务进度影响计划进度
function calculatePlanProgress(plan) {
  const tasks = plan.tasks || []
  if (tasks.length === 0) return 0
  
  let totalWeight = 0
  let weightedProgress = 0
  
  tasks.forEach(task => {
    const weight = getTaskWeight(task.priority)
    const taskProgress = calculateTaskProgress(task)
    totalWeight += weight
    weightedProgress += (taskProgress * weight)
  })
  
  return totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0
}
```

### 业务规则总结

#### 时间约束层级
1. **计划级别**：end_date >= CURDATE()（严格约束）
2. **任务级别**：时间范围必须在计划时间内（范围约束）
3. **子任务级别**：时间范围必须在任务时间内（范围约束）

#### 数据一致性保障
- 上级时间变更时级联验证下级时间
- 删除操作的级联处理（CASCADE）
- 状态变更的自动进度更新
- 并发操作的事务保护

#### 用户体验优化
- 实时的时间约束提示
- 智能的默认时间推荐
- 批量操作的原子性保证
- 错误信息的友好展示

