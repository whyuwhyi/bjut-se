# 微信小程序教育资源平台数据库设计文档

## 概述

本文档详细描述了微信小程序教育资源平台的数据库设计，包含用户管理、资源共享、社团活动、讨论交流、通知系统等核心功能模块的完整数据库表结构设计。

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
| status | ENUM('active','inactive','banned') | DEFAULT 'active' | 用户状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 2. 资源管理模块

### 2.1 资源类型表 (resource_types)

定义资源分类体系，支持动态扩展资源类型。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| type_id | INT | PRIMARY KEY, AUTO_INCREMENT | 资源类型ID |
| type_name | VARCHAR(50) | UNIQUE, NOT NULL | 资源类型名称 |
| description | TEXT | | 类型描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

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
| rating | DECIMAL(4,2) | DEFAULT 0.00 | 资源评分，0-10分 |
| view_count | INT | DEFAULT 0 | 浏览次数 |
| status | ENUM('draft','pending','published','rejected','archived') | DEFAULT 'draft' | 资源状态：draft-草稿，pending-待审核，published-已发布，rejected-已拒绝，archived-已归档 |
| reviewer_phone | VARCHAR(11) | FOREIGN KEY | 审核者手机号（外键到用户表） |
| review_comment | TEXT | | 审核意见 |
| reviewed_at | DATETIME | | 审核时间 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| category_id | VARCHAR(20) | FOREIGN KEY | 资源分类ID（外键到分类表） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 2.3 资源类型关联表 (resource_type_relations)

实现资源与类型的多对多关系。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| relation_id | INT | PRIMARY KEY, AUTO_INCREMENT | 关联记录唯一标识符 |
| resource_id | VARCHAR(9) | FOREIGN KEY | 关联资源表 |
| type_id | INT | FOREIGN KEY | 关联资源类型表 |

### 2.4 文件表 (files)

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

### 2.5 资源分类表 (categories)

支持资源分类管理，分类可通过后台动态管理。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| category_id | VARCHAR(20) | PRIMARY KEY | 分类唯一标识符 |
| category_name | VARCHAR(50) | UNIQUE, NOT NULL | 分类名称，1-50个字符 |
| category_value | VARCHAR(50) | UNIQUE, NOT NULL | 分类值（用于API参数） |
| description | TEXT | | 分类描述 |
| icon | VARCHAR(10) | | 分类图标（emoji） |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序顺序 |
| status | ENUM('active','inactive') | NOT NULL, DEFAULT 'active' | 状态：active-启用，inactive-禁用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |


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

### 3.4 学习记录表 (study_records)

记录用户的详细学习活动和进度。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| record_id | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| plan_id | VARCHAR(9) | FOREIGN KEY | 关联学习计划（可选） |
| task_id | VARCHAR(9) | FOREIGN KEY | 关联学习任务（可选） |
| resource_id | VARCHAR(9) | FOREIGN KEY | 关联资源（可选） |
| activity_type | ENUM('resource_view','resource_download','task_complete','plan_create','discussion_join') | NOT NULL | 活动类型 |
| duration_minutes | INT | DEFAULT 0 | 学习时长（分钟） |
| experience_gained | INT | DEFAULT 0 | 获得经验值 |
| study_date | DATE | NOT NULL | 学习日期 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 3.5 学习目标表 (study_goals)

用户设定的学习目标管理。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| goal_id | VARCHAR(9) | PRIMARY KEY | 9位数字的目标唯一标识符 |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| title | VARCHAR(200) | NOT NULL | 目标标题 |
| description | TEXT | | 目标描述 |
| target_value | INT | NOT NULL | 目标数值 |
| current_value | INT | DEFAULT 0 | 当前进度 |
| unit | VARCHAR(20) | DEFAULT '次' | 计量单位（小时、次、个等） |
| goal_type | ENUM('daily','weekly','monthly','custom') | NOT NULL | 目标类型 |
| deadline | DATE | NOT NULL | 截止日期 |
| status | ENUM('active','completed','paused','expired') | DEFAULT 'active' | 目标状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

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
| like_count | INT | DEFAULT 0 | 点赞次数 |
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
| like_count | INT | DEFAULT 0 | 点赞数 |
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
| rating | DECIMAL(3,2) | NOT NULL | 评分（0-10分） |
| review_text | TEXT | | 评价文字内容 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 评分时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 4.6 图片表 (images)

存储评论中上传的图片信息。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| image_id | VARCHAR(9) | PRIMARY KEY | 9位数字的图片唯一标识符 |
| comment_id | INT | FOREIGN KEY | 关联评论表 |
| image_path | VARCHAR(1000) | NOT NULL | 图片存储路径，以/开头，最多1000个字符 |
| image_size | INT | | 图片大小（字节） |
| image_type | VARCHAR(20) | | 图片类型（jpg, png, gif等） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

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
| collection_type | ENUM('post', 'resource', 'activity') | NOT NULL | 收藏内容类型 |
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
| type | ENUM('system','study','interaction','activity') | NOT NULL | 通知类型 |
| priority | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| title | VARCHAR(200) | NOT NULL | 通知标题 |
| content | TEXT | NOT NULL | 通知内容 |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 6.2 用户消息表 (user_messages)

用户间私信功能的实现。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| message_id | VARCHAR(9) | PRIMARY KEY | 消息ID |
| sender_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 发送者手机号 |
| receiver_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 接收者手机号 |
| message_type | ENUM('text','image','file') | DEFAULT 'text' | 消息类型 |
| content | TEXT | NOT NULL | 消息内容 |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 发送时间 |

---

## 7. 用户激励模块

### 7.1 用户成就表 (user_achievements)

用户成就系统，提升用户参与度。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| achievement_id | INT | PRIMARY KEY, AUTO_INCREMENT | 成就ID |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| achievement_type | VARCHAR(50) | NOT NULL | 成就类型 |
| achievement_name | VARCHAR(100) | NOT NULL | 成就名称 |
| description | TEXT | | 成就描述 |
| icon | VARCHAR(10) | | 成就图标 |
| earned_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 获得时间 |

### 7.2 用户等级表 (user_levels)

用户等级经验系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| user_phone | VARCHAR(11) | PRIMARY KEY, FOREIGN KEY | 用户手机号 |
| level | INT | DEFAULT 1 | 用户等级 |
| experience | INT | DEFAULT 0 | 经验值 |
| next_level_exp | INT | DEFAULT 100 | 下一级所需经验 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 8. 系统管理模块

### 8.1 轮播图表 (banners)

首页轮播图管理系统。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| banner_id | INT | PRIMARY KEY, AUTO_INCREMENT | 轮播图ID |
| title | VARCHAR(200) | | 标题 |
| image_url | VARCHAR(500) | NOT NULL | 图片URL |
| link_url | VARCHAR(500) | | 跳转链接 |
| sort_order | INT | DEFAULT 0 | 排序 |
| status | ENUM('active','inactive') | DEFAULT 'active' | 状态 |
| start_time | TIMESTAMP | | 开始时间 |
| end_time | TIMESTAMP | | 结束时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 8.2 下载记录表 (download_records)

统计和审计用户下载行为，提供详细的下载追踪功能。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| download_id | VARCHAR(9) | PRIMARY KEY | 9位数字的下载记录唯一标识符 |
| user_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 下载者手机号（外键） |
| resource_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 资源ID（外键） |
| file_id | VARCHAR(9) | FOREIGN KEY, NOT NULL | 文件ID（外键） |
| download_size | INT | | 下载文件大小（字节） |
| download_time | INT | | 下载耗时（毫秒） |
| ip_address | VARCHAR(45) | | 下载IP地址（支持IPv6） |
| user_agent | TEXT | | 用户代理字符串 |
| status | ENUM('completed','failed','cancelled') | DEFAULT 'completed' | 下载状态 |
| downloaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 下载时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**业务特点：**
- 记录用户的完整下载历史
- 支持下载失败和取消状态跟踪
- 提供下载性能统计（文件大小、耗时）
- 支持用户代理和IP追踪，便于数据分析
- 为用户提供个人下载记录查询功能

### 8.3 用户设置表 (user_settings)

个性化用户偏好设置。

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| user_phone | VARCHAR(11) | PRIMARY KEY, FOREIGN KEY | 用户手机号 |
| theme | ENUM('light','dark','auto') | DEFAULT 'light' | 主题设置 |
| language | VARCHAR(10) | DEFAULT 'zh-CN' | 语言设置 |
| notification_enabled | BOOLEAN | DEFAULT TRUE | 通知开关 |
| privacy_level | ENUM('public','friends','private') | DEFAULT 'public' | 隐私级别 |
| auto_download | BOOLEAN | DEFAULT FALSE | 自动下载 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

---

## 数据库关系设计

### 核心关系架构

#### 1. 用户中心关系体系
- **用户表**为整个系统的核心，以手机号作为主键
- 用户与其他业务实体形成一对多关系：
  - 用户 ←→ 资源发布（1:N）
  - 用户 ←→ 活动发布（1:N）
  - 用户 ←→ 讨论发起（1:N）
  - 用户 ←→ 评论发表（1:N）
  - 用户 ←→ 活动报名（1:N）

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
   学习目标表            学习记录表
     ↓                    ↓
 进度跟踪              经验积累
```

#### 4. 论坛交流关系层次
```
帖子表 ←--多对多--→ 帖子标签表（通过post_tag_relations）
  ↓
评论表 ←--一对多--→ 图片表
  ↓
层级回复关系（parent_comment_id）

资源表 ←--一对多--→ 评论表（资源评论）
```

#### 5. 用户社交关系网络
```
用户表 ←--多对多--→ 关注表（follower/followee）
  ↓
收藏表（支持多种内容类型收藏）
  ↓
用户消息表（私信功能）
```

### 业务流程关系

#### 资源分享流程
1. 用户发布资源 → `resources` 表
2. 选择资源分类 → `category_id` 字段关联
3. 上传相关文件 → `files` 表
4. 其他用户浏览/下载 → 更新统计字段

#### 学习管理流程
1. 用户创建学习计划 → `study_plans` 表
2. 制定学习任务 → `study_tasks` 表
3. 分解子任务 → `sub_tasks` 表
4. 记录学习进度 → `study_records` 表
5. 设定学习目标 → `study_goals` 表
6. 获得成就奖励 → `user_achievements` 表

#### 论坛交流流程
1. 用户发布帖子 → `posts` 表
2. 关联帖子标签 → `post_tag_relations` 表
3. 其他用户评论 → `comments` 表
4. 支持图片评论 → `images` 表
5. 层级回复机制 → `parent_comment_id` 字段

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

本数据库设计充分考虑了教育资源平台的业务特点，在保证数据一致性和完整性的基础上，提供了良好的扩展性和性能优化空间。