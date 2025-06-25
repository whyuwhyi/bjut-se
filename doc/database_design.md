# Database Table Design (关系型数据库设计)

## 1. Users Table (用户表)

| Field Name   | Data Type   | Constraints      | Description                      |
| ------------ | ----------- | ---------------- | -------------------------------- |
| phone_number | VARCHAR(11) | PRIMARY KEY      | 11 位手机号，以 1 开头（主键）   |
| student_id   | VARCHAR(20) | UNIQUE           | 学号：8 位数字或 S+9 位数字（可空）|
| password     | VARCHAR(255)| NOT NULL         | 加密后的密码                     |
| name         | VARCHAR(50) | NOT NULL         | 真实姓名，1-50 个字符            |
| nickname     | VARCHAR(50) |                  | 昵称                             |
| avatar_url   | VARCHAR(500)|                  | 头像URL                          |
| email        | VARCHAR(100)|                  | 邮箱地址                         |
| gender       | ENUM('M','F','U') | DEFAULT 'U' | 性别：M-男，F-女，U-未知         |
| status       | ENUM('active','inactive','banned') | DEFAULT 'active' | 用户状态 |
| created_at   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP | 创建时间           |
| updated_at   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 2. Activity_Types Table (活动类型表)

| Field Name      | Data Type   | Constraints | Description          |
| --------------- | ----------- | ----------- | -------------------- |
| type_id         | INT         | PRIMARY KEY, AUTO_INCREMENT | 活动类型ID |
| type_name       | VARCHAR(50) | UNIQUE, NOT NULL | 活动类型名称 |
| description     | TEXT        |             | 类型描述             |
| created_at      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 3. Community_Activities Table (社区活动表)

| Field Name           | Data Type     | Constraints  | Description                    |
| -------------------- | ------------- | ------------ | ------------------------------ |
| activity_id          | VARCHAR(9)    | PRIMARY KEY  | 9 位数字的活动唯一标识符       |
| publisher_phone      | VARCHAR(11)   | FOREIGN KEY, NOT NULL | 发布者手机号（外键到用户表） |
| activity_name        | VARCHAR(200)  | NOT NULL     | 活动名称，1-200 个字符         |
| activity_address     | VARCHAR(300)  |              | 活动地点，最多 300 个字符      |
| activity_description | VARCHAR(5000) |              | 活动详细描述，最多 5000 个字符 |
| registration_fee     | DECIMAL(7,2)  | DEFAULT 0.00 | 报名费用，最大 99999.99 元     |
| max_participants     | INT           |              | 最大参与人数，1-9999 人        |
| current_participants | INT           | DEFAULT 0    | 当前已报名人数，0 到最大人数   |
| start_time          | DATETIME      |              | 活动开始时间                   |
| end_time            | DATETIME      |              | 活动结束时间                   |
| registration_deadline| DATETIME     |              | 报名截止时间                   |
| status              | ENUM('draft','published','cancelled','completed') | DEFAULT 'draft' | 活动状态 |
| created_at          | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at          | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 4. Activity_Type_Relations Table (活动类型关联表)

| Field Name  | Data Type  | Constraints                 | Description        |
| ----------- | ---------- | --------------------------- | ------------------ |
| relation_id | INT        | PRIMARY KEY, AUTO_INCREMENT | 关联记录唯一标识符 |
| activity_id | VARCHAR(9) | FOREIGN KEY                 | 关联活动表         |
| type_id     | INT        | FOREIGN KEY                 | 关联活动类型表     |

## 5. Registrations Table (活动报名表)

| Field Name        | Data Type   | Constraints                 | Description                  |
| ----------------- | ----------- | --------------------------- | ---------------------------- |
| registration_id   | INT         | PRIMARY KEY, AUTO_INCREMENT | 报名记录唯一标识符           |
| user_phone        | VARCHAR(11) | FOREIGN KEY, NOT NULL       | 报名用户手机号（外键到用户表）|
| activity_id       | VARCHAR(9)  | FOREIGN KEY                 | 关联社区活动表               |
| status            | ENUM('registered','cancelled','attended') | DEFAULT 'registered' | 报名状态 |
| registration_time | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP   | 报名时间                     |
| updated_at        | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 6. Resource_Types Table (资源类型表)

| Field Name      | Data Type   | Constraints | Description          |
| --------------- | ----------- | ----------- | -------------------- |
| type_id         | INT         | PRIMARY KEY, AUTO_INCREMENT | 资源类型ID |
| type_name       | VARCHAR(50) | UNIQUE, NOT NULL | 资源类型名称 |
| description     | TEXT        |             | 类型描述             |
| created_at      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 7. Resources Table (资源表)

| Field Name       | Data Type    | Constraints  | Description               |
| ---------------- | ------------ | ------------ | ------------------------- |
| resource_id      | VARCHAR(9)   | PRIMARY KEY  | 9 位数字的资源唯一标识符  |
| publisher_phone  | VARCHAR(11)  | FOREIGN KEY, NOT NULL | 发布者手机号（外键到用户表）|
| resource_name    | VARCHAR(100) | NOT NULL     | 资源名称                  |
| description      | TEXT         |              | 资源描述                  |
| collection_count | INT          | DEFAULT 0    | 资源收藏次数，0-999999999 |
| comment_count    | INT          | DEFAULT 0    | 资源评论数量，0-999999999 |
| rating           | DECIMAL(4,2) | DEFAULT 0.00 | 资源评分，0-10 分         |
| view_count       | INT          | DEFAULT 0    | 浏览次数                  |
| status           | ENUM('draft','published','archived') | DEFAULT 'draft' | 资源状态 |
| created_at       | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at       | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 8. Resource_Type_Relations Table (资源类型关联表)

| Field Name  | Data Type  | Constraints                 | Description        |
| ----------- | ---------- | --------------------------- | ------------------ |
| relation_id | INT        | PRIMARY KEY, AUTO_INCREMENT | 关联记录唯一标识符 |
| resource_id | VARCHAR(9) | FOREIGN KEY                 | 关联资源表         |
| type_id     | INT        | FOREIGN KEY                 | 关联资源类型表     |

## 9. Files Table (文件表)

| Field Name     | Data Type                       | Constraints | Description                             |
| -------------- | ------------------------------- | ----------- | --------------------------------------- |
| file_id        | VARCHAR(9)                      | PRIMARY KEY | 9 位数字的文件唯一标识符                |
| resource_id    | VARCHAR(9)                      | FOREIGN KEY | 关联资源表                              |
| file_name      | VARCHAR(255)                    | NOT NULL    | 文件名称，1-255 个字符                  |
| file_size      | BIGINT                          |             | 文件大小（字节），最大 2GB              |
| file_type      | VARCHAR(50)                     |             | 文件类型/MIME类型                       |
| storage_path   | VARCHAR(1000)                   |             | 文件存储路径，以/开头，最多 1000 个字符 |
| storage_method | ENUM('local', 'cloud', 'table') | NOT NULL    | 文件存储方式                            |
| content        | LONGTEXT                        |             | 文件内容（用于文本文件）                |
| download_count | INT                             | DEFAULT 0   | 下载次数                                |
| created_at     | TIMESTAMP                       | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 10. Tags Table (标签表)

| Field Name | Data Type   | Constraints      | Description              |
| ---------- | ----------- | ---------------- | ------------------------ |
| tag_id     | VARCHAR(9)  | PRIMARY KEY      | 9 位数字的标签唯一标识符 |
| tag_name   | VARCHAR(50) | UNIQUE, NOT NULL | 标签名称，1-50 个字符    |
| created_at | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 11. Resource_Tags Table (资源标签关联表)

| Field Name  | Data Type  | Constraints                 | Description        |
| ----------- | ---------- | --------------------------- | ------------------ |
| relation_id | INT        | PRIMARY KEY, AUTO_INCREMENT | 关联记录唯一标识符 |
| resource_id | VARCHAR(9) | FOREIGN KEY                 | 关联资源表         |
| tag_id      | VARCHAR(9) | FOREIGN KEY                 | 关联标签表         |

## 12. Discussions Table (讨论表)

| Field Name         | Data Type   | Constraints               | Description                 |
| ------------------ | ----------- | ------------------------- | --------------------------- |
| discussion_id      | VARCHAR(9)  | PRIMARY KEY               | 9 位数字的讨论唯一标识符    |
| resource_id        | VARCHAR(9)  | FOREIGN KEY               | 关联资源表                  |
| user_phone         | VARCHAR(11) | FOREIGN KEY, NOT NULL     | 关联用户表（讨论发起者）    |
| discussion_content | TEXT        | NOT NULL                  | 讨论内容，1-65535 个字符    |
| comment_count      | INT         | DEFAULT 0                 | 讨论的评论总数，0-999999999 |
| status             | ENUM('active','hidden','deleted') | DEFAULT 'active' | 讨论状态 |
| created_at         | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP | 讨论创建时间                |
| updated_at         | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 13. Comments Table (评论表)

| Field Name      | Data Type   | Constraints                 | Description                  |
| --------------- | ----------- | --------------------------- | ---------------------------- |
| comment_id      | INT         | PRIMARY KEY, AUTO_INCREMENT | 评论唯一标识符               |
| user_phone      | VARCHAR(11) | FOREIGN KEY, NOT NULL       | 关联用户表（评论者）         |
| resource_id     | VARCHAR(9)  | FOREIGN KEY                 | 关联资源表                   |
| discussion_id   | VARCHAR(9)  | FOREIGN KEY                 | 关联讨论表                   |
| parent_comment_id | INT       | FOREIGN KEY                 | 父评论ID（用于回复）         |
| comment_content | TEXT        | NOT NULL                    | 评论内容，1-65535 个字符     |
| like_count      | INT         | DEFAULT 0                   | 评论点赞数，0-999999999      |
| status          | ENUM('active','hidden','deleted') | DEFAULT 'active' | 评论状态 |
| created_at      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP   | 评论时间                     |
| updated_at      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 14. Images Table (图片表)

| Field Name | Data Type     | Constraints | Description                             |
| ---------- | ------------- | ----------- | --------------------------------------- |
| image_id   | VARCHAR(9)    | PRIMARY KEY | 9 位数字的图片唯一标识符                |
| comment_id | INT           | FOREIGN KEY | 关联评论表                              |
| image_path | VARCHAR(1000) | NOT NULL    | 图片存储路径，以/开头，最多 1000 个字符 |
| image_size | INT           |             | 图片大小（字节）                        |
| image_type | VARCHAR(20)   |             | 图片类型（jpg, png, gif 等）        |
| created_at | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 15. Follows Table (关注表)

| Field Name  | Data Type   | Constraints                 | Description                  |
| ----------- | ----------- | --------------------------- | ---------------------------- |
| follow_id   | INT         | PRIMARY KEY, AUTO_INCREMENT | 关注记录唯一标识符           |
| follower_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL    | 关注者手机号                 |
| followee_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL    | 被关注者手机号               |
| status      | ENUM('active','cancelled') | DEFAULT 'active' | 关注状态 |
| created_at  | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP   | 关注时间                     |
| updated_at  | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 16. Collections Table (收藏表)

| Field Name      | Data Type                                  | Constraints               | Description                      |
| --------------- | ------------------------------------------ | ------------------------- | -------------------------------- |
| collection_id   | VARCHAR(9)                                 | PRIMARY KEY               | 9 位数字的收藏记录唯一标识符     |
| user_phone      | VARCHAR(11)                                | FOREIGN KEY, NOT NULL     | 关联用户表（收藏者）             |
| content_id      | VARCHAR(9)                                 | NOT NULL                  | 被收藏内容的唯一标识符，9 位数字 |
| collection_type | ENUM('discussion', 'resource', 'activity') | NOT NULL                  | 收藏内容类型                     |
| status          | ENUM('active','cancelled') | DEFAULT 'active'          | 收藏状态                         |
| created_at      | TIMESTAMP                                  | DEFAULT CURRENT_TIMESTAMP | 收藏时间                         |
| updated_at      | TIMESTAMP                                  | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 主要关系说明

1. **用户为核心的关系体系**:
   - 以手机号为主键，学工号为可选字段
   - 用户可以报名多个活动（一对多）
   - 用户可以发布多个活动（一对多）
   - 用户可以发布多个资源（一对多）
   - 用户可以发起多个讨论（一对多）
   - 用户可以发表多个评论（一对多）

2. **活动类型系统**:
   - 活动类型表独立存储，便于管理和扩展
   - 活动与类型多对多关系，通过关联表实现
   - 支持一个活动属于多个类型

3. **资源管理系统**:
   - 资源类型表独立存储，便于管理和扩展
   - 资源与类型多对多关系，通过关联表实现
   - 一个资源可以包含多个文件（一对多）
   - 资源与标签多对多关系，通过关联表实现

4. **讨论评论系统**:
   - 一个资源可以有多个讨论（一对多）
   - 一个讨论可以有多个评论（一对多）
   - 评论支持层级回复（通过parent_comment_id）
   - 一个评论可以包含多张图片（一对多）

5. **用户社交系统**:
   - 用户关注关系（多对多，通过关注表实现）
   - 用户收藏系统，支持收藏多种类型的内容

6. **数据完整性保证**:
   - 所有外键关系均使用CASCADE或RESTRICT约束
   - 状态字段使用ENUM确保数据一致性
   - 时间戳字段自动维护创建和更新时间

## 数据格式规范

- **主键策略**: 用户表使用手机号作为主键，业务表使用自增ID或业务ID
- **学工号格式**: 支持 8 位数字或 S+9 位数字格式（可空）
- **手机号格式**: 严格 11 位，以 1 开头，作为用户唯一标识
- **时间格式**: 统一使用 TIMESTAMP 类型，自动维护时间戳
- **业务ID格式**: 资源、活动、讨论等使用 9 位数字字符串
- **状态管理**: 使用 ENUM 类型确保状态值的一致性
- **字符编码**: 统一使用 UTF-8 编码
- **外键约束**: 所有外键关系使用合适的约束策略
- **索引策略**: 主键、外键、唯一约束自动创建索引

## 技术架构建议

### 数据库选型
- **推荐**: MySQL 8.0+ 或 PostgreSQL 13+
- **特性需求**: 支持事务、外键约束、JSON字段（可选）

### 性能优化
- 为高频查询字段添加索引
- 分页查询使用 LIMIT + OFFSET
- 大表考虑分区策略
- 适当的数据归档策略

### 安全考虑
- 密码字段使用加密存储
- 敏感信息考虑加密存储
- 定期备份策略
- 访问权限控制

## 新增表结构（基于原型功能分析）

## 17. Notifications Table (通知表)

| Field Name    | Data Type | Constraints | Description |
| ------------- | --------- | ----------- | ----------- |
| notification_id | VARCHAR(9) | PRIMARY KEY | 9位数字的通知唯一标识符 |
| receiver_phone | VARCHAR(11) | FOREIGN KEY, NOT NULL | 接收者手机号 |
| sender_phone   | VARCHAR(11) | FOREIGN KEY | 发送者手机号（系统通知可为空）|
| type          | ENUM('system','study','interaction','activity') | NOT NULL | 通知类型 |
| priority      | ENUM('high','medium','low') | DEFAULT 'medium' | 优先级 |
| title         | VARCHAR(200) | NOT NULL | 通知标题 |
| content       | TEXT | NOT NULL | 通知内容 |
| is_read       | BOOLEAN | DEFAULT FALSE | 是否已读 |
| created_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 18. User_Achievements Table (用户成就表)

| Field Name      | Data Type | Constraints | Description |
| --------------- | --------- | ----------- | ----------- |
| achievement_id  | INT | PRIMARY KEY, AUTO_INCREMENT | 成就ID |
| user_phone      | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| achievement_type | VARCHAR(50) | NOT NULL | 成就类型 |
| achievement_name | VARCHAR(100) | NOT NULL | 成就名称 |
| description     | TEXT | | 成就描述 |
| icon           | VARCHAR(10) | | 成就图标 |
| earned_at      | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 获得时间 |

## 19. User_Levels Table (用户等级表)

| Field Name    | Data Type | Constraints | Description |
| ------------- | --------- | ----------- | ----------- |
| user_phone    | VARCHAR(11) | PRIMARY KEY, FOREIGN KEY | 用户手机号 |
| level         | INT | DEFAULT 1 | 用户等级 |
| experience    | INT | DEFAULT 0 | 经验值 |
| next_level_exp | INT | DEFAULT 100 | 下一级所需经验 |
| updated_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 20. Banners Table (轮播图表)

| Field Name    | Data Type | Constraints | Description |
| ------------- | --------- | ----------- | ----------- |
| banner_id     | INT | PRIMARY KEY, AUTO_INCREMENT | 轮播图ID |
| title         | VARCHAR(200) | | 标题 |
| image_url     | VARCHAR(500) | NOT NULL | 图片URL |
| link_url      | VARCHAR(500) | | 跳转链接 |
| sort_order    | INT | DEFAULT 0 | 排序 |
| status        | ENUM('active','inactive') | DEFAULT 'active' | 状态 |
| start_time    | TIMESTAMP | | 开始时间 |
| end_time      | TIMESTAMP | | 结束时间 |
| created_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

## 21. Download_Records Table (下载记录表)

| Field Name     | Data Type | Constraints | Description |
| -------------- | --------- | ----------- | ----------- |
| record_id      | INT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| user_phone     | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| resource_id    | VARCHAR(9) | FOREIGN KEY | 资源ID |
| file_id        | VARCHAR(9) | FOREIGN KEY | 文件ID |
| download_time  | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 下载时间 |
| ip_address     | VARCHAR(45) | | IP地址 |

## 22. User_Messages Table (用户消息表)

| Field Name    | Data Type | Constraints | Description |
| ------------- | --------- | ----------- | ----------- |
| message_id    | VARCHAR(9) | PRIMARY KEY | 消息ID |
| sender_phone  | VARCHAR(11) | FOREIGN KEY, NOT NULL | 发送者手机号 |
| receiver_phone| VARCHAR(11) | FOREIGN KEY, NOT NULL | 接收者手机号 |
| message_type  | ENUM('text','image','file') | DEFAULT 'text' | 消息类型 |
| content       | TEXT | NOT NULL | 消息内容 |
| is_read       | BOOLEAN | DEFAULT FALSE | 是否已读 |
| created_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 发送时间 |

## 23. Study_Plans Table (学习计划表)

| Field Name    | Data Type | Constraints | Description |
| ------------- | --------- | ----------- | ----------- |
| plan_id       | VARCHAR(9) | PRIMARY KEY | 计划ID |
| user_phone    | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| title         | VARCHAR(200) | NOT NULL | 计划标题 |
| description   | TEXT | | 计划描述 |
| start_date    | DATE | | 开始日期 |
| end_date      | DATE | | 结束日期 |
| status        | ENUM('active','completed','paused') | DEFAULT 'active' | 状态 |
| progress      | INT | DEFAULT 0 | 进度百分比 |
| created_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at    | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 24. Learning_Progress Table (学习进度表)

| Field Name     | Data Type | Constraints | Description |
| -------------- | --------- | ----------- | ----------- |
| progress_id    | INT | PRIMARY KEY, AUTO_INCREMENT | 进度ID |
| user_phone     | VARCHAR(11) | FOREIGN KEY, NOT NULL | 用户手机号 |
| resource_id    | VARCHAR(9) | FOREIGN KEY | 资源ID |
| plan_id        | VARCHAR(9) | FOREIGN KEY | 学习计划ID |
| progress_type  | ENUM('view','download','complete') | NOT NULL | 进度类型 |
| progress_value | INT | DEFAULT 0 | 进度值 |
| updated_at     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 25. User_Settings Table (用户设置表)

| Field Name      | Data Type | Constraints | Description |
| --------------- | --------- | ----------- | ----------- |
| user_phone      | VARCHAR(11) | PRIMARY KEY, FOREIGN KEY | 用户手机号 |
| theme           | ENUM('light','dark','auto') | DEFAULT 'light' | 主题设置 |
| language        | VARCHAR(10) | DEFAULT 'zh-CN' | 语言设置 |
| notification_enabled | BOOLEAN | DEFAULT TRUE | 通知开关 |
| privacy_level   | ENUM('public','friends','private') | DEFAULT 'public' | 隐私级别 |
| auto_download   | BOOLEAN | DEFAULT FALSE | 自动下载 |
| updated_at      | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
