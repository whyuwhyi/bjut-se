-- ================================================================
-- 日新智链平台数据库统一初始化脚本
-- 重新设计，确保数据一致性
-- ================================================================

-- 设置正确的字符集
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET CHARACTER SET utf8mb4;

-- ================================================================
-- 第一部分：数据库创建
-- ================================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS wechat_education 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci;

-- 使用数据库
USE wechat_education;

-- 确保数据库使用正确的字符集
ALTER DATABASE wechat_education CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ================================================================
-- 第二部分：表结构创建
-- ================================================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    phone_number VARCHAR(11) PRIMARY KEY COMMENT '手机号主键',
    student_id VARCHAR(20) UNIQUE COMMENT '学号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    email VARCHAR(100) COMMENT '邮箱',
    bio TEXT COMMENT '个人简介',
    gender ENUM('M', 'F', 'U') DEFAULT 'U' COMMENT '性别',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '用户状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户信息表';

-- 2. 资源分类表
CREATE TABLE IF NOT EXISTS categories (
    category_id VARCHAR(20) PRIMARY KEY COMMENT '分类ID',
    category_name VARCHAR(50) UNIQUE NOT NULL COMMENT '分类名称',
    category_value VARCHAR(50) UNIQUE NOT NULL COMMENT '分类值',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(10) COMMENT '分类图标',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资源分类表';

-- 3. 资源类型表
CREATE TABLE IF NOT EXISTS resource_types (
    type_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '资源类型ID',
    type_name VARCHAR(50) UNIQUE NOT NULL COMMENT '资源类型名称',
    description TEXT COMMENT '类型描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资源类型表';

-- 4. 资源表
CREATE TABLE IF NOT EXISTS resources (
    resource_id VARCHAR(9) PRIMARY KEY COMMENT '资源ID',
    publisher_phone VARCHAR(11) NOT NULL COMMENT '发布者手机号',
    resource_name VARCHAR(100) NOT NULL COMMENT '资源名称',
    description TEXT COMMENT '资源描述',
    collection_count INT DEFAULT 0 COMMENT '收藏次数',
    comment_count INT DEFAULT 0 COMMENT '评论数量',
    rating DECIMAL(4,2) DEFAULT 0 COMMENT '资源评分(1-5分)',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    status ENUM('draft', 'pending', 'published', 'rejected', 'archived') DEFAULT 'draft' COMMENT '资源状态',
    reviewer_phone VARCHAR(11) COMMENT '审核者手机号',
    review_comment TEXT COMMENT '审核意见',
    reviewed_at DATE COMMENT '审核时间',
    category_id VARCHAR(20) COMMENT '分类ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_phone) REFERENCES users(phone_number) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资源表';

-- 5. 文件表
CREATE TABLE IF NOT EXISTS files (
    file_id VARCHAR(9) PRIMARY KEY COMMENT '文件ID',
    resource_id VARCHAR(9) NOT NULL COMMENT '关联资源ID',
    file_name VARCHAR(255) NOT NULL COMMENT '文件名称',
    file_size BIGINT COMMENT '文件大小',
    file_type VARCHAR(50) COMMENT '文件类型/MIME类型',
    storage_path VARCHAR(1000) COMMENT '文件存储路径',
    storage_method ENUM('local', 'cloud', 'table') DEFAULT 'local' COMMENT '存储方式',
    content LONGTEXT COMMENT '文件内容(文本文件)',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文件表';

-- 6. 标签表
CREATE TABLE IF NOT EXISTS tags (
    tag_id VARCHAR(9) PRIMARY KEY COMMENT '标签ID',
    tag_name VARCHAR(50) UNIQUE NOT NULL COMMENT '标签名称',
    category VARCHAR(50) COMMENT '标签分类',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '标签状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='标签表';

-- 7. 资源标签关联表
CREATE TABLE IF NOT EXISTS resource_tags (
    relation_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联记录ID',
    resource_id VARCHAR(9) NOT NULL COMMENT '资源ID',
    tag_id VARCHAR(9) NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资源标签关联表';

-- 8. 帖子表
CREATE TABLE IF NOT EXISTS posts (
    post_id VARCHAR(9) PRIMARY KEY COMMENT '帖子ID',
    author_phone VARCHAR(11) NOT NULL COMMENT '作者手机号',
    title VARCHAR(200) NOT NULL COMMENT '帖子标题',
    content TEXT NOT NULL COMMENT '帖子内容(支持Markdown)',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    comment_count INT DEFAULT 0 COMMENT '评论数量',
    collection_count INT DEFAULT 0 COMMENT '收藏次数',
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active' COMMENT '帖子状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_phone) REFERENCES users(phone_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子表';

-- 9. 帖子标签表
CREATE TABLE IF NOT EXISTS post_tags (
    tag_id VARCHAR(9) PRIMARY KEY COMMENT '帖子标签ID',
    tag_name VARCHAR(50) UNIQUE NOT NULL COMMENT '标签名称',
    tag_color VARCHAR(7) DEFAULT '#007aff' COMMENT '标签颜色',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '标签状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子标签表';

-- 10. 帖子标签关联表
CREATE TABLE IF NOT EXISTS post_tag_relations (
    relation_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联记录ID',
    post_id VARCHAR(9) NOT NULL COMMENT '帖子ID',
    tag_id VARCHAR(9) NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES post_tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子标签关联表';

-- 11. 评论表
CREATE TABLE IF NOT EXISTS comments (
    comment_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    author_phone VARCHAR(11) NOT NULL COMMENT '评论作者手机号',
    post_id VARCHAR(9) COMMENT '关联帖子ID',
    resource_id VARCHAR(9) COMMENT '关联资源ID',
    parent_comment_id INT COMMENT '父评论ID',
    content TEXT NOT NULL COMMENT '评论内容',
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active' COMMENT '评论状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='评论表';

-- 12. 评分表
CREATE TABLE IF NOT EXISTS ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评分记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '评分者手机号',
    resource_id VARCHAR(9) NOT NULL COMMENT '资源ID',
    rating DECIMAL(3,2) NOT NULL COMMENT '评分(1-5分)',
    review_text TEXT COMMENT '评价文字内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_resource (user_phone, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='评分表';

-- 13. 收藏表
CREATE TABLE IF NOT EXISTS collections (
    collection_id VARCHAR(9) PRIMARY KEY COMMENT '收藏记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '收藏者手机号',
    content_id VARCHAR(9) NOT NULL COMMENT '被收藏内容ID',
    collection_type ENUM('post', 'resource') NOT NULL COMMENT '收藏内容类型',
    status ENUM('active', 'cancelled') DEFAULT 'active' COMMENT '收藏状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content (user_phone, content_id, collection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='收藏表';

-- 14. 用户关注表
CREATE TABLE IF NOT EXISTS user_follows (
    follow_id VARCHAR(9) PRIMARY KEY COMMENT '关注记录ID',
    follower_phone VARCHAR(11) NOT NULL COMMENT '关注者手机号',
    following_phone VARCHAR(11) NOT NULL COMMENT '被关注者手机号',
    status ENUM('active', 'cancelled') DEFAULT 'active' COMMENT '关注状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (following_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_phone, following_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户关注表';

-- 15. 下载记录表
CREATE TABLE IF NOT EXISTS download_records (
    download_id VARCHAR(9) PRIMARY KEY COMMENT '下载记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '下载者手机号',
    resource_id VARCHAR(9) NOT NULL COMMENT '资源ID',
    file_id VARCHAR(9) NOT NULL COMMENT '文件ID',
    download_size INT COMMENT '下载文件大小(字节)',
    download_time INT COMMENT '下载耗时(毫秒)',
    ip_address VARCHAR(45) COMMENT '下载IP地址',
    user_agent TEXT COMMENT '用户代理字符串',
    status ENUM('completed', 'failed', 'cancelled') DEFAULT 'completed' COMMENT '下载状态',
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='下载记录表';

-- 16. 学习计划表
CREATE TABLE IF NOT EXISTS study_plans (
    plan_id VARCHAR(9) PRIMARY KEY COMMENT '学习计划ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
    title VARCHAR(200) NOT NULL COMMENT '计划标题',
    description TEXT COMMENT '计划详细描述',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active' COMMENT '计划状态',
    progress_percent INT DEFAULT 0 COMMENT '整体进度百分比',
    plan_type VARCHAR(50) DEFAULT '自定义计划' COMMENT '计划类型',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学习计划表';

-- 17. 学习任务表
CREATE TABLE IF NOT EXISTS study_tasks (
    task_id VARCHAR(9) PRIMARY KEY COMMENT '学习任务ID',
    plan_id VARCHAR(9) NOT NULL COMMENT '关联学习计划ID',
    title VARCHAR(200) NOT NULL COMMENT '任务标题',
    description TEXT COMMENT '任务描述',
    deadline DATE COMMENT '截止日期',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '任务优先级',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
    estimated_hours INT COMMENT '预估学习时长(小时)',
    actual_hours INT DEFAULT 0 COMMENT '实际学习时长(小时)',
    tags VARCHAR(500) COMMENT '标签(JSON格式)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES study_plans(plan_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学习任务表';

-- 18. 子任务表
CREATE TABLE IF NOT EXISTS sub_tasks (
    subtask_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '子任务ID',
    task_id VARCHAR(9) NOT NULL COMMENT '关联学习任务ID',
    title VARCHAR(200) NOT NULL COMMENT '子任务标题',
    completed BOOLEAN DEFAULT FALSE COMMENT '是否已完成',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES study_tasks(task_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='子任务表';

-- 19. 学习记录表
CREATE TABLE IF NOT EXISTS study_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
    plan_id VARCHAR(9) COMMENT '关联学习计划ID',
    task_id VARCHAR(9) COMMENT '关联学习任务ID',
    resource_id VARCHAR(9) COMMENT '关联资源ID',
    activity_type ENUM('resource_view', 'resource_download', 'task_complete', 'plan_create', 'post_view', 'post_create', 'comment_create') NOT NULL COMMENT '活动类型',
    duration_minutes INT DEFAULT 0 COMMENT '学习时长(分钟)',
    experience_gained INT DEFAULT 0 COMMENT '获得经验值',
    study_date DATE NOT NULL COMMENT '学习日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES study_plans(plan_id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES study_tasks(task_id) ON DELETE SET NULL,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学习记录表';

-- 20. 学习目标表
CREATE TABLE IF NOT EXISTS study_goals (
    goal_id VARCHAR(9) PRIMARY KEY COMMENT '学习目标ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
    title VARCHAR(200) NOT NULL COMMENT '目标标题',
    description TEXT COMMENT '目标描述',
    target_value INT NOT NULL COMMENT '目标数值',
    current_value INT DEFAULT 0 COMMENT '当前进度',
    unit VARCHAR(20) DEFAULT '次' COMMENT '计量单位',
    goal_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL COMMENT '目标类型',
    deadline DATE COMMENT '截止日期',
    status ENUM('active', 'completed', 'paused', 'expired') DEFAULT 'active' COMMENT '目标状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学习目标表';

-- 21. 通知表
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(9) PRIMARY KEY COMMENT '通知ID',
    receiver_phone VARCHAR(11) NOT NULL COMMENT '接收者手机号',
    sender_phone VARCHAR(11) COMMENT '发送者手机号',
    type ENUM('system', 'study', 'interaction', 'resource', 'announcement') NOT NULL COMMENT '通知类型',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',
    action_type ENUM('none', 'navigate', 'external_link') DEFAULT 'none' COMMENT '动作类型',
    action_url VARCHAR(500) COMMENT '动作URL',
    action_params JSON COMMENT '动作参数',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
    read_at TIMESTAMP NULL COMMENT '阅读时间',
    expires_at TIMESTAMP NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (sender_phone) REFERENCES users(phone_number) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通知表';

-- ================================================================
-- 第三部分：测试数据插入
-- ================================================================

-- 插入测试用户（密码是123456的bcrypt哈希值）
INSERT IGNORE INTO users (phone_number, password, name, nickname, email, status, created_at, updated_at) VALUES
('13800138001', '$2b$10$9X.ZVfYU3TXn4Kd.VxhFDe/1R4XhE.yJfIgDh8b5nV4LPaEtN2.7K', '张教授', '张教授', 'zhang@bjut.edu.cn', 'active', NOW(), NOW()),
('13800138002', '$2b$10$9X.ZVfYU3TXn4Kd.VxhFDe/1R4XhE.yJfIgDh8b5nV4LPaEtN2.7K', '李同学', '李同学', 'li@student.bjut.edu.cn', 'active', NOW(), NOW()),
('13800138003', '$2b$10$9X.ZVfYU3TXn4Kd.VxhFDe/1R4XhE.yJfIgDh8b5nV4LPaEtN2.7K', '王老师', '王老师', 'wang@bjut.edu.cn', 'active', NOW(), NOW());

-- 插入资源分类
INSERT IGNORE INTO categories (category_id, category_name, category_value, description, icon, sort_order, status, created_at, updated_at) VALUES
('CAT001', '课件', 'courseware', '教学课件和演示文稿', '📚', 1, 'active', NOW(), NOW()),
('CAT002', '实验', 'experiment', '实验代码和实验报告', '🔬', 2, 'active', NOW(), NOW());

-- 插入测试资源（2条，评论数量与实际匹配）
INSERT IGNORE INTO resources (resource_id, publisher_phone, resource_name, description, collection_count, comment_count, rating, view_count, download_count, status, category_id, created_at, updated_at) VALUES
('123456789', '13800138001', '数据结构与算法课件', '包含基础概念、时间复杂度分析等内容', 2, 2, 4.5, 150, 80, 'published', 'CAT001', NOW(), NOW()),
('123456790', '13800138002', '机器学习实验代码', '包含常用算法的完整实现', 1, 1, 4.2, 100, 45, 'published', 'CAT002', NOW(), NOW());

-- 插入文件
INSERT IGNORE INTO files (file_id, resource_id, file_name, file_size, file_type, storage_path, storage_method, download_count, created_at) VALUES
('100000001', '123456789', '数据结构课件.pdf', 2048576, 'application/pdf', '/uploads/datastruct.pdf', 'local', 80, NOW()),
('100000002', '123456790', '机器学习代码.zip', 5242880, 'application/zip', '/uploads/ml_code.zip', 'local', 45, NOW());

-- 插入帖子标签
INSERT IGNORE INTO post_tags (tag_id, tag_name, tag_color, usage_count, status, created_at, updated_at) VALUES
('100000001', 'JavaScript', '#F7DF1E', 1, 'active', NOW(), NOW()),
('100000002', '算法', '#4ECDC4', 1, 'active', NOW(), NOW());

-- 插入测试帖子（2条，评论数量与实际匹配）
INSERT IGNORE INTO posts (post_id, author_phone, title, content, view_count, comment_count, collection_count, status, created_at, updated_at) VALUES
('100000001', '13800138001', '数据结构学习建议', '# 数据结构学习心得\n\n学习数据结构要理论与实践结合，多动手编程实现。\n\n建议先掌握基础的线性结构，再学习复杂的树形结构。', 120, 2, 1, 'active', NOW(), NOW()),
('100000002', '13800138002', 'JavaScript异步编程问题', '最近在学习JavaScript异步编程，对Promise和async/await的使用有些困惑，求指教！', 80, 1, 1, 'active', NOW(), NOW());

-- 插入帖子标签关联
INSERT IGNORE INTO post_tag_relations (post_id, tag_id, created_at) VALUES
('100000001', '100000002', NOW()),
('100000002', '100000001', NOW());

-- 插入评论（确保数量与帖子/资源的comment_count匹配）
-- 资源评论：资源123456789有2条评论，123456790有1条评论
INSERT IGNORE INTO comments (author_phone, resource_id, content, status, created_at, updated_at) VALUES
('13800138002', '123456789', '张教授的课件质量很高，内容详细，对学习很有帮助！', 'active', NOW(), NOW()),
('13800138003', '123456789', '课件讲解清晰，例子丰富，建议增加更多练习题。', 'active', NOW(), NOW()),
('13800138001', '123456790', '代码实现规范，注释详细，适合学习参考。', 'active', NOW(), NOW());

-- 帖子评论：帖子100000001有2条评论，100000002有1条评论  
INSERT IGNORE INTO comments (author_phone, post_id, content, status, created_at, updated_at) VALUES
('13800138002', '100000001', '张教授的建议很实用，我按照这个方法学习效果不错！', 'active', NOW(), NOW()),
('13800138003', '100000001', '补充一点：可以尝试用不同语言实现，加深理解。', 'active', NOW(), NOW()),
('13800138001', '100000002', '关于async/await：它是Promise的语法糖，让异步代码看起来像同步代码。建议先理解Promise，再学习async/await。', 'active', NOW(), NOW());

-- 插入评分数据
INSERT IGNORE INTO ratings (user_phone, resource_id, rating, review_text, created_at, updated_at) VALUES
('13800138002', '123456789', 4.5, '课件内容详细，讲解清晰，对学习很有帮助。', NOW(), NOW()),
('13800138003', '123456790', 4.2, '代码质量不错，注释详细，适合学习参考。', NOW(), NOW());

-- 插入收藏数据（确保数量与posts/resources的collection_count匹配）
INSERT IGNORE INTO collections (collection_id, user_phone, content_id, collection_type, status, created_at, updated_at) VALUES
('200000001', '13800138002', '123456789', 'resource', 'active', NOW(), NOW()),
('200000002', '13800138003', '123456789', 'resource', 'active', NOW(), NOW()),
('200000003', '13800138001', '123456790', 'resource', 'active', NOW(), NOW()),
('200000004', '13800138003', '100000001', 'post', 'active', NOW(), NOW()),
('200000005', '13800138002', '100000002', 'post', 'active', NOW(), NOW());

-- 插入用户关注关系
INSERT IGNORE INTO user_follows (follow_id, follower_phone, following_phone, status, created_at, updated_at) VALUES
('300000001', '13800138002', '13800138001', 'active', NOW(), NOW()),
('300000002', '13800138003', '13800138001', 'active', NOW(), NOW());

-- 插入学习计划
INSERT IGNORE INTO study_plans (plan_id, user_phone, title, description, start_date, end_date, status, progress_percent, plan_type, priority, created_at, updated_at) VALUES
('400000001', '13800138002', '前端开发学习计划', '系统学习前端技术栈', '2025-06-01', '2025-08-31', 'active', 60, '前端开发', 'high', NOW(), NOW()),
('400000002', '13800138003', '算法练习计划', '提升算法和数据结构能力', '2025-06-15', '2025-07-15', 'active', 40, '算法练习', 'medium', NOW(), NOW());

-- 插入学习任务
INSERT IGNORE INTO study_tasks (task_id, plan_id, title, description, deadline, priority, status, estimated_hours, actual_hours, tags, created_at, updated_at) VALUES
('500000001', '400000001', '学习Vue.js基础', '掌握Vue.js组件、指令等基础概念', '2025-06-30', 'high', 'completed', 20, 18, '["Vue.js", "前端"]', NOW(), NOW()),
('500000002', '400000001', '实践Vue项目', '开发完整的Vue.js应用', '2025-07-15', 'high', 'in_progress', 40, 12, '["Vue.js", "实践"]', NOW(), NOW()),
('500000003', '400000002', '数组算法练习', '练习数组相关算法题', '2025-06-30', 'medium', 'in_progress', 15, 8, '["算法", "数组"]', NOW(), NOW());

-- 插入学习记录
INSERT IGNORE INTO study_records (user_phone, plan_id, task_id, resource_id, activity_type, duration_minutes, experience_gained, study_date, created_at) VALUES
('13800138002', '400000001', '500000001', '123456789', 'resource_view', 120, 10, CURDATE(), NOW()),
('13800138002', '400000001', '500000001', NULL, 'task_complete', 60, 20, CURDATE(), NOW()),
('13800138003', '400000002', '500000003', NULL, 'plan_create', 30, 15, CURDATE(), NOW());

-- 插入通知
INSERT IGNORE INTO notifications (notification_id, receiver_phone, sender_phone, type, priority, title, content, action_type, is_read, created_at, updated_at) VALUES
('600000001', '13800138002', NULL, 'system', 'medium', '欢迎使用平台', '欢迎加入学习社区！', 'none', false, NOW(), NOW()),
('600000002', '13800138003', '13800138002', 'interaction', 'low', '新的关注者', '李同学开始关注您了！', 'navigate', false, NOW(), NOW());

-- ================================================================
-- 第四部分：数据一致性验证
-- ================================================================

-- 验证帖子评论数量
UPDATE posts p SET comment_count = (
    SELECT COUNT(*) FROM comments c 
    WHERE c.post_id = p.post_id AND c.status = 'active'
);

-- 验证资源评论数量
UPDATE resources r SET comment_count = (
    SELECT COUNT(*) FROM comments c 
    WHERE c.resource_id = r.resource_id AND c.status = 'active'
);

-- 验证收藏数量
UPDATE posts p SET collection_count = (
    SELECT COUNT(*) FROM collections c 
    WHERE c.content_id = p.post_id AND c.collection_type = 'post' AND c.status = 'active'
);

UPDATE resources r SET collection_count = (
    SELECT COUNT(*) FROM collections c 
    WHERE c.content_id = r.resource_id AND c.collection_type = 'resource' AND c.status = 'active'
);

-- ================================================================
-- 初始化完成
-- ================================================================

SELECT 
    '数据库初始化完成！数据已保持一致性' as message,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM resources) as resources_count,
    (SELECT COUNT(*) FROM posts) as posts_count,
    (SELECT COUNT(*) FROM comments) as comments_count,
    (SELECT COUNT(*) FROM collections) as collections_count;