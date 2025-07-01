-- ================================================================
-- 日新智链平台数据库完全重新初始化脚本
-- 
-- 特性：
-- 1. 完全删除所有现有表，重新创建
-- 2. 不使用任何 INSERT IGNORE，确保数据完全重新插入
-- 3. 包含完整的测试数据
-- 4. 自动验证数据一致性
-- 
-- 注意：此脚本会删除所有现有数据！
-- ================================================================

-- 设置正确的字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ================================================================
-- 数据库初始化：删除并重新创建数据库（最简洁的方式）
-- ================================================================

-- 删除并重新创建数据库（自动清理所有表和数据）
DROP DATABASE IF EXISTS wechat_education;
CREATE DATABASE wechat_education CHARACTER SET utf8mb4;

-- 使用数据库
USE wechat_education;

-- ================================================================
-- 表结构创建
-- ================================================================

-- 1. 用户表
CREATE TABLE users (
    phone_number VARCHAR(11) PRIMARY KEY COMMENT '手机号主键',
    student_id VARCHAR(20) UNIQUE COMMENT '学号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    email VARCHAR(100) COMMENT '邮箱',
    bio TEXT COMMENT '个人简介',
    gender ENUM('M', 'F', 'U') DEFAULT 'U' COMMENT '性别',
    role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '用户状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='用户信息表';

-- 2. 资源分类表
CREATE TABLE categories (
    category_id VARCHAR(20) PRIMARY KEY COMMENT '分类ID',
    category_name VARCHAR(50) UNIQUE NOT NULL COMMENT '分类名称',
    category_value VARCHAR(50) UNIQUE NOT NULL COMMENT '分类值',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(10) COMMENT '分类图标',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='资源分类表';


-- 4. 资源表
CREATE TABLE resources (
    resource_id VARCHAR(9) PRIMARY KEY COMMENT '资源ID',
    publisher_phone VARCHAR(11) NOT NULL COMMENT '发布者手机号',
    resource_name VARCHAR(100) NOT NULL COMMENT '资源名称',
    description TEXT COMMENT '资源描述',
    collection_count INT DEFAULT 0 COMMENT '收藏次数',
    comment_count INT DEFAULT 0 COMMENT '评论数量',
    rating DECIMAL(4,2) DEFAULT 0 COMMENT '资源评分(1-5分)',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    report_count INT DEFAULT 0 COMMENT '举报次数',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='资源表';

-- 5. 文件表
CREATE TABLE files (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='文件表';

-- 6. 标签表
CREATE TABLE tags (
    tag_id VARCHAR(9) PRIMARY KEY COMMENT '标签ID',
    tag_name VARCHAR(50) UNIQUE NOT NULL COMMENT '标签名称',
    category VARCHAR(50) COMMENT '标签分类',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '标签状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='标签表';

-- 7. 资源标签关联表
CREATE TABLE resource_tags (
    relation_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联记录ID',
    resource_id VARCHAR(9) NOT NULL COMMENT '资源ID',
    tag_id VARCHAR(9) NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='资源标签关联表';

-- 8. 帖子表
CREATE TABLE posts (
    post_id VARCHAR(9) PRIMARY KEY COMMENT '帖子ID',
    author_phone VARCHAR(11) NOT NULL COMMENT '作者手机号',
    title VARCHAR(200) NOT NULL COMMENT '帖子标题',
    content TEXT NOT NULL COMMENT '帖子内容(支持Markdown)',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    comment_count INT DEFAULT 0 COMMENT '评论数量',
    collection_count INT DEFAULT 0 COMMENT '收藏次数',
    report_count INT DEFAULT 0 COMMENT '举报次数',
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active' COMMENT '帖子状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_phone) REFERENCES users(phone_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='帖子表';

-- 9. 帖子标签表
CREATE TABLE post_tags (
    tag_id VARCHAR(9) PRIMARY KEY COMMENT '帖子标签ID',
    tag_name VARCHAR(50) UNIQUE NOT NULL COMMENT '标签名称',
    tag_color VARCHAR(7) DEFAULT '#007aff' COMMENT '标签颜色',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '标签状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='帖子标签表';

-- 10. 帖子标签关联表
CREATE TABLE post_tag_relations (
    relation_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联记录ID',
    post_id VARCHAR(9) NOT NULL COMMENT '帖子ID',
    tag_id VARCHAR(9) NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES post_tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='帖子标签关联表';

-- 11. 评论表
CREATE TABLE comments (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='评论表';

-- 12. 评分表
CREATE TABLE ratings (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='评分表';

-- 13. 收藏表
CREATE TABLE collections (
    collection_id VARCHAR(9) PRIMARY KEY COMMENT '收藏记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '收藏者手机号',
    content_id VARCHAR(9) NOT NULL COMMENT '被收藏内容ID',
    collection_type ENUM('post', 'resource') NOT NULL COMMENT '收藏内容类型',
    status ENUM('active', 'cancelled') DEFAULT 'active' COMMENT '收藏状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content (user_phone, content_id, collection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='收藏表';

-- 14. 用户关注表
CREATE TABLE user_follows (
    follow_id VARCHAR(9) PRIMARY KEY COMMENT '关注记录ID',
    follower_phone VARCHAR(11) NOT NULL COMMENT '关注者手机号',
    following_phone VARCHAR(11) NOT NULL COMMENT '被关注者手机号',
    status ENUM('active', 'cancelled') DEFAULT 'active' COMMENT '关注状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (following_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_phone, following_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='用户关注表';


-- 15. 学习计划表
CREATE TABLE study_plans (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='学习计划表';

-- 16. 学习任务表
CREATE TABLE study_tasks (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='学习任务表';

-- 17. 子任务表
CREATE TABLE sub_tasks (
    subtask_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '子任务ID',
    task_id VARCHAR(9) NOT NULL COMMENT '关联学习任务ID',
    title VARCHAR(200) NOT NULL COMMENT '子任务标题',
    completed BOOLEAN DEFAULT FALSE COMMENT '是否已完成',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES study_tasks(task_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='子任务表';

-- 18. 学习记录表
CREATE TABLE study_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
    plan_id VARCHAR(9) COMMENT '关联学习计划ID',
    task_id VARCHAR(9) COMMENT '关联学习任务ID',
    resource_id VARCHAR(9) COMMENT '关联资源ID',
    post_id VARCHAR(9) COMMENT '关联帖子ID',
    activity_type ENUM('resource_view', 'resource_download', 'task_complete', 'plan_create', 'post_view', 'post_create', 'comment_create') NOT NULL COMMENT '活动类型',
    duration_minutes INT DEFAULT 0 COMMENT '学习时长(分钟)',
    experience_gained INT DEFAULT 0 COMMENT '获得经验值',
    study_date DATE NOT NULL COMMENT '学习日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES study_plans(plan_id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES study_tasks(task_id) ON DELETE SET NULL,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE SET NULL,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='学习记录表';

-- 19. 学习目标表
CREATE TABLE study_goals (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='学习目标表';

-- 20. 通知表
CREATE TABLE notifications (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='通知表';

-- 21. 验证码表
CREATE TABLE verification_codes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '验证码ID',
    phone_number VARCHAR(11) NOT NULL COMMENT '手机号',
    code VARCHAR(6) NOT NULL COMMENT '验证码',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    status ENUM('valid', 'used', 'expired') DEFAULT 'valid' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='验证码表';

-- 22. 资源举报表
CREATE TABLE resource_reports (
    report_id VARCHAR(9) PRIMARY KEY COMMENT '举报记录ID',
    resource_id VARCHAR(9) NOT NULL COMMENT '被举报资源ID',
    reporter_phone VARCHAR(11) NOT NULL COMMENT '举报者手机号',
    reason ENUM('inappropriate', 'copyright', 'spam', 'offensive', 'other') NOT NULL COMMENT '举报原因',
    description TEXT COMMENT '详细描述',
    status ENUM('pending', 'processed', 'rejected') DEFAULT 'pending' COMMENT '处理状态',
    processed_by VARCHAR(11) COMMENT '处理人手机号',
    process_result TEXT COMMENT '处理结果说明',
    processed_at TIMESTAMP NULL COMMENT '处理时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(phone_number) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='资源举报表';

-- 23. 帖子举报表
CREATE TABLE post_reports (
    report_id VARCHAR(9) PRIMARY KEY COMMENT '举报记录ID',
    post_id VARCHAR(9) NOT NULL COMMENT '被举报帖子ID',
    reporter_phone VARCHAR(11) NOT NULL COMMENT '举报者手机号',
    reason ENUM('inappropriate', 'spam', 'offensive', 'harassment', 'false_info', 'other') NOT NULL COMMENT '举报原因',
    description TEXT COMMENT '详细描述',
    status ENUM('pending', 'processed', 'rejected') DEFAULT 'pending' COMMENT '处理状态',
    processed_by VARCHAR(11) COMMENT '处理人手机号',
    process_result TEXT COMMENT '处理结果说明',
    processed_at TIMESTAMP NULL COMMENT '处理时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(phone_number) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='帖子举报表';

-- ================================================================
-- 第三部分：测试数据插入 - 严格控制数量匹配
-- ================================================================

-- 插入测试用户（密码是123456的bcrypt哈希值）
-- 注意：使用INSERT而不是INSERT IGNORE，确保数据完全重新插入
INSERT INTO users (phone_number, password, name, nickname, email, role, status, created_at, updated_at) VALUES
('13800138001', '$2a$10$65Oa2HMdHo.4RZfkzqM/0uYuo80C/pNycfIvOlGPg.G2N9t13gDsG', '张教授', '张教授', 'zhang@bjut.edu.cn', 'admin', 'active', NOW(), NOW()),
('13800138002', '$2a$10$65Oa2HMdHo.4RZfkzqM/0uYuo80C/pNycfIvOlGPg.G2N9t13gDsG', '李同学', '李同学', 'li@student.bjut.edu.cn', 'user', 'active', NOW(), NOW()),
('13800138003', '$2a$10$65Oa2HMdHo.4RZfkzqM/0uYuo80C/pNycfIvOlGPg.G2N9t13gDsG', '王老师', '王老师', 'wang@bjut.edu.cn', 'user', 'active', NOW(), NOW());

-- 插入资源分类
INSERT INTO categories (category_id, category_name, category_value, description, icon, sort_order, status, created_at, updated_at) VALUES
('CAT001', '课件', 'courseware', '教学课件和演示文稿', '📚', 1, 'active', NOW(), NOW()),
('CAT002', '实验', 'experiment', '实验代码和实验报告', '🔬', 2, 'active', NOW(), NOW());

-- 插入帖子标签
INSERT INTO post_tags (tag_id, tag_name, tag_color, usage_count, status, created_at, updated_at) VALUES
('TAG00001', 'JavaScript', '#F7DF1E', 1, 'active', NOW(), NOW()),
('TAG00002', '算法', '#4ECDC4', 1, 'active', NOW(), NOW()),
('TAG00003', '学习方法', '#FF6B6B', 1, 'active', NOW(), NOW());

-- 插入测试资源（comment_count=0，稍后通过评论更新）
INSERT INTO resources (resource_id, publisher_phone, resource_name, description, collection_count, comment_count, rating, view_count, download_count, status, category_id, created_at, updated_at) VALUES
('123456789', '13800138001', '数据结构与算法课件', '包含基础概念、时间复杂度分析等内容', 0, 0, 4.5, 150, 80, 'published', 'CAT001', NOW(), NOW()),
('123456790', '13800138002', '机器学习实验代码', '包含常用算法的完整实现', 0, 0, 4.2, 100, 45, 'published', 'CAT002', NOW(), NOW()),
('123456791', '13800138003', 'Python基础教程', 'Python编程语言基础教程', 0, 0, 4.0, 80, 30, 'published', 'CAT001', NOW(), NOW());

-- 插入文件
INSERT INTO files (file_id, resource_id, file_name, file_size, file_type, storage_path, storage_method, download_count, created_at) VALUES
('100000001', '123456789', '数据结构课件.pdf', 2048576, 'application/pdf', '/uploads/datastruct.pdf', 'local', 80, NOW()),
('100000002', '123456790', '机器学习代码.zip', 5242880, 'application/zip', '/uploads/ml_code.zip', 'local', 45, NOW()),
('100000003', '123456791', 'Python教程.pdf', 1536000, 'application/pdf', '/uploads/python.pdf', 'local', 30, NOW());

-- 插入测试帖子（comment_count=0，稍后通过评论更新）
INSERT INTO posts (post_id, author_phone, title, content, view_count, comment_count, collection_count, status, created_at, updated_at) VALUES
('100000001', '13800138001', '数据结构学习建议', '# 数据结构学习心得\n\n学习数据结构要理论与实践结合，多动手编程实现。', 120, 0, 0, 'active', NOW(), NOW()),
('100000002', '13800138002', 'JavaScript异步编程问题', '最近在学习JavaScript异步编程，对Promise和async/await的使用有些困惑，求指教！', 80, 0, 0, 'active', NOW(), NOW()),
('100000003', '13800138003', '算法复杂度分析技巧', '分享一些分析算法时间复杂度的技巧和方法。', 60, 0, 0, 'active', NOW(), NOW());

-- 插入帖子标签关联
INSERT INTO post_tag_relations (post_id, tag_id, created_at) VALUES
('100000001', 'TAG00002', NOW()),  -- 数据结构学习建议 -> 算法
('100000001', 'TAG00003', NOW()),  -- 数据结构学习建议 -> 学习方法
('100000002', 'TAG00001', NOW()),  -- JavaScript异步编程 -> JavaScript
('100000003', 'TAG00002', NOW());  -- 算法复杂度分析 -> 算法

-- 插入评论
-- 资源评论：123456789(2条)，123456790(1条)，123456791(0条)
INSERT INTO comments (author_phone, resource_id, content, status, created_at, updated_at) VALUES
('13800138002', '123456789', '张教授的课件质量很高，内容详细，对学习很有帮助！', 'active', NOW(), NOW()),
('13800138003', '123456789', '课件讲解清晰，例子丰富，建议增加更多练习题。', 'active', NOW(), NOW()),
('13800138001', '123456790', '代码实现规范，注释详细，适合学习参考。', 'active', NOW(), NOW());

-- 帖子评论：100000001(2条)，100000002(1条)，100000003(0条)
INSERT INTO comments (author_phone, post_id, content, status, created_at, updated_at) VALUES
('13800138002', '100000001', '张教授的建议很实用，我按照这个方法学习效果不错！', 'active', NOW(), NOW()),
('13800138003', '100000001', '补充一点：可以尝试用不同语言实现，加深理解。', 'active', NOW(), NOW()),
('13800138001', '100000002', '关于async/await：它是Promise的语法糖，让异步代码看起来像同步代码。', 'active', NOW(), NOW());

-- 插入评分数据
INSERT INTO ratings (user_phone, resource_id, rating, review_text, created_at, updated_at) VALUES
('13800138002', '123456789', 4.5, '课件内容详细，讲解清晰，对学习很有帮助。', NOW(), NOW()),
('13800138003', '123456790', 4.2, '代码质量不错，注释详细，适合学习参考。', NOW(), NOW()),
('13800138001', '123456791', 4.0, 'Python教程写得不错，适合初学者。', NOW(), NOW());

-- 插入收藏数据
INSERT INTO collections (collection_id, user_phone, content_id, collection_type, status, created_at, updated_at) VALUES
('200000001', '13800138002', '123456789', 'resource', 'active', NOW(), NOW()),
('200000002', '13800138003', '123456789', 'resource', 'active', NOW(), NOW()),
('200000003', '13800138001', '123456790', 'resource', 'active', NOW(), NOW()),
('200000004', '13800138003', '100000001', 'post', 'active', NOW(), NOW()),
('200000005', '13800138002', '100000002', 'post', 'active', NOW(), NOW());

-- 插入用户关注关系
INSERT INTO user_follows (follow_id, follower_phone, following_phone, status, created_at, updated_at) VALUES
('300000001', '13800138002', '13800138001', 'active', NOW(), NOW()),
('300000002', '13800138003', '13800138001', 'active', NOW(), NOW());

-- 插入学习计划
INSERT INTO study_plans (plan_id, user_phone, title, description, start_date, end_date, status, progress_percent, plan_type, priority, created_at, updated_at) VALUES
('400000001', '13800138002', '前端开发学习计划', '系统学习前端技术栈', '2025-06-01', '2025-08-31', 'active', 60, '前端开发', 'high', NOW(), NOW()),
('400000002', '13800138003', '算法练习计划', '提升算法和数据结构能力', '2025-06-15', '2025-07-15', 'active', 40, '算法练习', 'medium', NOW(), NOW());

-- 插入学习任务
INSERT INTO study_tasks (task_id, plan_id, title, description, deadline, priority, status, estimated_hours, actual_hours, tags, created_at, updated_at) VALUES
('500000001', '400000001', '学习Vue.js基础', '掌握Vue.js组件、指令等基础概念', '2025-06-30', 'high', 'completed', 20, 18, '["Vue.js", "前端"]', NOW(), NOW()),
('500000002', '400000001', '实践Vue项目', '开发完整的Vue.js应用', '2025-07-15', 'high', 'in_progress', 40, 12, '["Vue.js", "实践"]', NOW(), NOW()),
('500000003', '400000002', '数组算法练习', '练习数组相关算法题', '2025-06-30', 'medium', 'in_progress', 15, 8, '["算法", "数组"]', NOW(), NOW());

-- 插入学习记录
INSERT INTO study_records (user_phone, plan_id, task_id, resource_id, activity_type, duration_minutes, experience_gained, study_date, created_at) VALUES
('13800138002', '400000001', '500000001', '123456789', 'resource_view', 120, 10, CURDATE(), NOW()),
('13800138002', '400000001', '500000001', NULL, 'task_complete', 60, 20, CURDATE(), NOW()),
('13800138003', '400000002', '500000003', NULL, 'plan_create', 30, 15, CURDATE(), NOW());

-- 插入通知
INSERT INTO notifications (notification_id, receiver_phone, sender_phone, type, priority, title, content, action_type, is_read, created_at, updated_at) VALUES
('600000001', '13800138002', NULL, 'system', 'medium', '欢迎使用平台', '欢迎加入学习社区！', 'none', false, NOW(), NOW()),
('600000002', '13800138003', '13800138002', 'interaction', 'low', '新的关注者', '李同学开始关注您了！', 'navigate', false, NOW(), NOW());

-- 插入测试举报数据
INSERT INTO resource_reports (report_id, resource_id, reporter_phone, reason, description, status, created_at, updated_at) VALUES
('700000001', '123456790', '13800138003', 'inappropriate', '资源内容不当，包含不适合的内容', 'pending', NOW(), NOW()),
('700000002', '123456791', '13800138002', 'copyright', '疑似侵犯版权', 'pending', NOW(), NOW());

INSERT INTO post_reports (report_id, post_id, reporter_phone, reason, description, status, created_at, updated_at) VALUES
('700000003', '100000002', '13800138003', 'spam', '帖子内容涉嫌灌水', 'pending', NOW(), NOW());

-- ================================================================
-- 第四部分：数据一致性更新 - 确保评论数和收藏数正确
-- ================================================================

-- 更新资源评论数量
UPDATE resources SET comment_count = (
    SELECT COUNT(*) FROM comments 
    WHERE comments.resource_id = resources.resource_id AND comments.status = 'active'
);

-- 更新帖子评论数量  
UPDATE posts SET comment_count = (
    SELECT COUNT(*) FROM comments 
    WHERE comments.post_id = posts.post_id AND comments.status = 'active'
);

-- 更新资源收藏数量
UPDATE resources SET collection_count = (
    SELECT COUNT(*) FROM collections 
    WHERE collections.content_id = resources.resource_id 
    AND collections.collection_type = 'resource' 
    AND collections.status = 'active'
);

-- 更新帖子收藏数量
UPDATE posts SET collection_count = (
    SELECT COUNT(*) FROM collections 
    WHERE collections.content_id = posts.post_id 
    AND collections.collection_type = 'post' 
    AND collections.status = 'active'
);

-- 更新资源举报数量
UPDATE resources SET report_count = (
    SELECT COUNT(*) FROM resource_reports 
    WHERE resource_reports.resource_id = resources.resource_id
);

-- 更新帖子举报数量
UPDATE posts SET report_count = (
    SELECT COUNT(*) FROM post_reports 
    WHERE post_reports.post_id = posts.post_id
);

-- ================================================================
-- 第五部分：数据验证
-- ================================================================

-- 验证数据一致性
SELECT 
    '数据库初始化完成！' as message,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM resources) as resources_count,
    (SELECT COUNT(*) FROM posts) as posts_count,
    (SELECT COUNT(*) FROM comments) as comments_count,
    (SELECT COUNT(*) FROM collections) as collections_count,
    (SELECT COUNT(*) FROM resource_reports) as resource_reports_count,
    (SELECT COUNT(*) FROM post_reports) as post_reports_count;

-- 验证具体的评论数匹配
SELECT 
    'resources' as table_name,
    resource_id,
    comment_count as declared_count,
    (SELECT COUNT(*) FROM comments WHERE resource_id = resources.resource_id AND status = 'active') as actual_count
FROM resources;

SELECT 
    'posts' as table_name,
    post_id,
    comment_count as declared_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = posts.post_id AND status = 'active') as actual_count
FROM posts;

-- 验证具体的举报数匹配
SELECT 
    'resources' as table_name,
    resource_id,
    report_count as declared_count,
    (SELECT COUNT(*) FROM resource_reports WHERE resource_id = resources.resource_id) as actual_count
FROM resources;

SELECT 
    'posts' as table_name,
    post_id,
    report_count as declared_count,
    (SELECT COUNT(*) FROM post_reports WHERE post_id = posts.post_id) as actual_count
FROM posts;