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
    birthday DATE COMMENT '生日日期',
    bio TEXT COMMENT '个人简介',
    gender ENUM('M', 'F', 'U') DEFAULT 'U' COMMENT '性别',
    role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '用户状态',
    post_count INT DEFAULT 0 COMMENT '发帖数',
    resource_count INT DEFAULT 0 COMMENT '资源数',
    follower_count INT DEFAULT 0 COMMENT '粉丝数',
    following_count INT DEFAULT 0 COMMENT '关注数',
    privacy_settings JSON DEFAULT ('{"show_email": false, "show_student_id": false, "show_real_name": true, "show_bio": true, "show_stats": true, "allow_follow": true}') COMMENT '隐私设置',
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


-- 3. 资源表
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

-- 4. 文件表
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

-- 5. 帖子表
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

-- 6. 帖子标签表
CREATE TABLE post_tags (
    tag_id VARCHAR(9) PRIMARY KEY COMMENT '帖子标签ID',
    tag_name VARCHAR(50) UNIQUE NOT NULL COMMENT '标签名称',
    tag_color VARCHAR(7) DEFAULT '#007aff' COMMENT '标签颜色',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '标签状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='帖子标签表';

-- 7. 帖子标签关联表
CREATE TABLE post_tag_relations (
    relation_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联记录ID',
    post_id VARCHAR(9) NOT NULL COMMENT '帖子ID',
    tag_id VARCHAR(9) NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES post_tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='帖子标签关联表';

-- 8. 评论表
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

-- 9. 评分表
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

-- 10. 收藏表
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

-- 11. 用户关注表
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


-- 12. 学习计划表
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

-- 13. 学习任务表
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES study_plans(plan_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='学习任务表';

-- 14. 子任务表
CREATE TABLE sub_tasks (
    subtask_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '子任务ID',
    task_id VARCHAR(9) NOT NULL COMMENT '关联学习任务ID',
    title VARCHAR(200) NOT NULL COMMENT '子任务标题',
    description TEXT COMMENT '详细描述',
    completed BOOLEAN DEFAULT FALSE COMMENT '是否已完成',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    deadline DATE COMMENT '截止日期',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级：high-高优先级，medium-中优先级，low-低优先级',
    estimated_minutes INT DEFAULT 0 COMMENT '预计完成时间(分钟)',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES study_tasks(task_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='子任务表';

-- 15. 通知表
CREATE TABLE notifications (
    notification_id VARCHAR(9) PRIMARY KEY COMMENT '通知ID',
    receiver_phone VARCHAR(11) NULL COMMENT '接收者手机号（为空表示广播通知，面向全体用户）',
    type ENUM('system', 'study', 'interaction', 'resource', 'announcement', 'follow_post', 'follow_resource', 'comment_reply', 'content_liked', 'content_commented', 'new_follower') NOT NULL COMMENT '通知类型',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '优先级',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',
    action_type ENUM('none', 'navigate', 'external_link') DEFAULT 'none' COMMENT '动作类型',
    action_url VARCHAR(500) COMMENT '动作URL',
    action_params JSON COMMENT '动作参数',
    related_user_phone VARCHAR(11) NULL COMMENT '相关用户手机号（如：内容发布者、评论者）',
    related_content_id VARCHAR(9) NULL COMMENT '相关内容ID（如：帖子ID、资源ID）',
    related_content_type ENUM('post', 'resource', 'comment') NULL COMMENT '相关内容类型',
    is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读（只对个人通知有效）',
    read_at TIMESTAMP NULL COMMENT '阅读时间（只对个人通知有效）',
    expires_at TIMESTAMP NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (related_user_phone) REFERENCES users(phone_number) ON DELETE SET NULL,
    INDEX idx_receiver_type (receiver_phone, type),
    INDEX idx_related_user (related_user_phone),
    INDEX idx_related_content (related_content_id, related_content_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='通知表';

-- 16. 广播通知已读状态表
CREATE TABLE notification_reads (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
    notification_id VARCHAR(9) NOT NULL COMMENT '通知ID',
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(notification_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notification (user_phone, notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='广播通知已读状态表';

-- 17. 验证码表
CREATE TABLE verification_codes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '验证码ID',
    phone_number VARCHAR(11) NOT NULL COMMENT '手机号',
    code VARCHAR(6) NOT NULL COMMENT '验证码',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    status ENUM('valid', 'used', 'expired') DEFAULT 'valid' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4  COMMENT='验证码表';

-- 18. 资源举报表
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

-- 19. 帖子举报表
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

-- 20. 用户反馈表
CREATE TABLE feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_phone VARCHAR(11) NOT NULL COMMENT '用户手机号',
  type VARCHAR(32) NOT NULL COMMENT '反馈类型（bug/feature/ui/performance/content/other）',
  content TEXT NOT NULL COMMENT '反馈内容',
  contact VARCHAR(64) DEFAULT NULL COMMENT '联系方式（可选）',
  images TEXT DEFAULT NULL COMMENT '图片URL数组，JSON字符串',
  status VARCHAR(16) DEFAULT 'pending' COMMENT '处理状态（pending/processing/resolved/closed）',
  reply TEXT DEFAULT NULL COMMENT '管理员回复内容',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

-- 11. 搜索统计表
CREATE TABLE search_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  search_term VARCHAR(255) NOT NULL COMMENT '搜索关键词',
  search_type ENUM('resource', 'post', 'mixed') NOT NULL COMMENT '搜索类型',
  search_count INT DEFAULT 1 COMMENT '搜索次数',
  result_count INT DEFAULT 0 COMMENT '搜索结果数量',
  user_phone VARCHAR(11) COMMENT '搜索用户（可为空表示游客搜索）',
  search_filters JSON COMMENT '搜索筛选条件',
  response_time_ms INT COMMENT '响应时间（毫秒）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '首次搜索时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后搜索时间',
  INDEX idx_search_term (search_term),
  INDEX idx_search_type (search_type),
  INDEX idx_search_count (search_count),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_phone) REFERENCES users(phone_number) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='搜索统计表';

-- 12. 热门搜索关键词表
CREATE TABLE hot_keywords (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关键词ID',
  keyword VARCHAR(255) NOT NULL UNIQUE COMMENT '关键词',
  search_count INT DEFAULT 0 COMMENT '搜索次数',
  result_count INT DEFAULT 0 COMMENT '平均结果数量',
  category ENUM('resource', 'post', 'mixed') DEFAULT 'mixed' COMMENT '主要搜索类别',
  last_searched_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后搜索时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_search_count (search_count DESC),
  INDEX idx_last_searched (last_searched_at DESC),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='热门搜索关键词表';

-- ================================================================
-- 全文索引创建
-- ================================================================

-- 为资源表添加全文索引
ALTER TABLE resources ADD FULLTEXT INDEX ft_resource_content (resource_name, description);

-- 为帖子表添加全文索引
ALTER TABLE posts ADD FULLTEXT INDEX ft_post_content (title, content);

-- 为分类表添加全文索引
ALTER TABLE categories ADD FULLTEXT INDEX ft_category_name (category_name);

-- 为标签表添加全文索引
ALTER TABLE post_tags ADD FULLTEXT INDEX ft_tag_name (tag_name);

-- ================================================================
-- 第三部分：测试数据插入 - 严格控制数量匹配
-- ================================================================

-- 插入测试用户（密码是123456的bcrypt哈希值）
-- 注意：使用INSERT而不是INSERT IGNORE，确保数据完全重新插入
INSERT INTO users (phone_number, password, name, nickname, email, birthday, role, status, created_at, updated_at) VALUES
('13800138001', '$2a$10$65Oa2HMdHo.4RZfkzqM/0uYuo80C/pNycfIvOlGPg.G2N9t13gDsG', '张教授', '张教授', 'zhang@bjut.edu.cn', '1980-05-15', 'admin', 'active', NOW(), NOW()),
('13800138002', '$2a$10$65Oa2HMdHo.4RZfkzqM/0uYuo80C/pNycfIvOlGPg.G2N9t13gDsG', '李同学', '李同学', 'li@student.bjut.edu.cn', '2000-08-20', 'user', 'active', NOW(), NOW()),
('13800138003', '$2a$10$65Oa2HMdHo.4RZfkzqM/0uYuo80C/pNycfIvOlGPg.G2N9t13gDsG', '王老师', '王老师', 'wang@bjut.edu.cn', '1985-12-03', 'user', 'active', NOW(), NOW());

-- 插入资源分类
INSERT INTO categories (category_id, category_name, category_value, description, icon, sort_order, status, created_at, updated_at) VALUES
('CAT001', '课件', 'courseware', '教学课件和演示文稿', '📚', 1, 'active', NOW(), NOW()),
('CAT002', '实验', 'experiment', '实验代码和实验报告', '🔬', 2, 'active', NOW(), NOW());

-- 插入帖子标签
INSERT INTO post_tags (tag_id, tag_name, tag_color, usage_count, status, created_at, updated_at) VALUES
('TAG00001', 'JavaScript', '#F7DF1E', 1, 'active', NOW(), NOW()),
('TAG00002', '算法', '#4ECDC4', 1, 'active', NOW(), NOW()),
('TAG00003', '学习方法', '#FF6B6B', 1, 'active', NOW(), NOW()),
('TAG00004', 'Python', '#3776AB', 0, 'active', NOW(), NOW()),
('TAG00005', 'Java', '#ED8B00', 0, 'active', NOW(), NOW()),
('TAG00006', 'C++', '#00599C', 0, 'active', NOW(), NOW()),
('TAG00007', '数据结构', '#8E44AD', 0, 'active', NOW(), NOW()),
('TAG00008', '机器学习', '#E74C3C', 0, 'active', NOW(), NOW()),
('TAG00009', '深度学习', '#9B59B6', 0, 'active', NOW(), NOW()),
('TAG00010', '前端开发', '#3498DB', 0, 'active', NOW(), NOW()),
('TAG00011', '后端开发', '#2ECC71', 0, 'active', NOW(), NOW()),
('TAG00012', '数据库', '#F39C12', 0, 'active', NOW(), NOW()),
('TAG00013', '操作系统', '#34495E', 0, 'active', NOW(), NOW()),
('TAG00014', '计算机网络', '#16A085', 0, 'active', NOW(), NOW()),
('TAG00015', '软件工程', '#D35400', 0, 'active', NOW(), NOW()),
('TAG00016', '人工智能', '#E67E22', 0, 'active', NOW(), NOW()),
('TAG00017', 'Web开发', '#1ABC9C', 0, 'active', NOW(), NOW()),
('TAG00018', '移动开发', '#8E44AD', 0, 'active', NOW(), NOW()),
('TAG00019', '求助', '#E74C3C', 0, 'active', NOW(), NOW()),
('TAG00020', '分享', '#27AE60', 0, 'active', NOW(), NOW()),
('TAG00021', '讨论', '#3498DB', 0, 'active', NOW(), NOW()),
('TAG00022', '经验', '#F39C12', 0, 'active', NOW(), NOW()),
('TAG00023', '资源推荐', '#9B59B6', 0, 'active', NOW(), NOW()),
('TAG00024', '面试', '#E67E22', 0, 'active', NOW(), NOW()),
('TAG00025', '实习', '#1ABC9C', 0, 'active', NOW(), NOW()),
('TAG00026', '就业', '#34495E', 0, 'active', NOW(), NOW()),
('TAG00027', '考研', '#D35400', 0, 'active', NOW(), NOW()),
('TAG00028', '竞赛', '#C0392B', 0, 'active', NOW(), NOW()),
('TAG00029', '项目', '#16A085', 0, 'active', NOW(), NOW()),
('TAG00030', '开源', '#2ECC71', 0, 'active', NOW(), NOW());

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
INSERT INTO study_tasks (task_id, plan_id, title, description, deadline, priority, status, estimated_hours, actual_hours, created_at, updated_at) VALUES
('500000001', '400000001', '学习Vue.js基础', '掌握Vue.js组件、指令等基础概念', '2025-06-30', 'high', 'completed', 20, 18, NOW(), NOW()),
('500000002', '400000001', '实践Vue项目', '开发完整的Vue.js应用', '2025-07-15', 'high', 'in_progress', 40, 12, NOW(), NOW()),
('500000003', '400000002', '数组算法练习', '练习数组相关算法题', '2025-06-30', 'medium', 'in_progress', 15, 8, NOW(), NOW());

-- 插入子任务
INSERT INTO sub_tasks (task_id, title, description, completed, sort_order, deadline, priority, estimated_minutes, notes, created_at, updated_at) VALUES
-- Vue.js基础学习子任务
('500000001', '学习Vue实例和数据绑定', '掌握Vue实例创建和双向数据绑定机制', TRUE, 1, '2025-06-20', 'high', 120, '重点关注响应式原理', NOW(), NOW()),
('500000001', '掌握Vue组件基础', '学习组件的创建、props传递和事件处理', TRUE, 2, '2025-06-25', 'high', 180, '多练习父子组件通信', NOW(), NOW()),
('500000001', '学习Vue指令系统', '掌握v-if、v-for、v-model等常用指令', TRUE, 3, '2025-06-28', 'medium', 90, '注意指令的性能影响', NOW(), NOW()),
-- Vue项目实践子任务
('500000002', '项目环境搭建', '配置开发环境和项目脚手架', TRUE, 1, '2025-07-05', 'high', 60, '使用Vue CLI或Vite', NOW(), NOW()),
('500000002', '设计项目架构', '规划项目目录结构和组件设计', FALSE, 2, '2025-07-08', 'high', 120, '考虑可维护性和扩展性', NOW(), NOW()),
('500000002', '实现核心功能', '完成项目的主要业务逻辑', FALSE, 3, '2025-07-12', 'high', 480, '按模块逐步实现', NOW(), NOW()),
('500000002', '项目测试和优化', '进行功能测试和性能优化', FALSE, 4, '2025-07-15', 'medium', 180, '重点关注用户体验', NOW(), NOW()),
-- 数组算法练习子任务
('500000003', '基础数组操作', '练习数组遍历、搜索、排序等基本操作', TRUE, 1, '2025-06-25', 'medium', 120, '熟练掌握基础API', NOW(), NOW()),
('500000003', '双指针技巧', '学习双指针解决数组问题的技巧', FALSE, 2, '2025-06-28', 'high', 150, '多练习不同类型的双指针题目', NOW(), NOW()),
('500000003', '滑动窗口算法', '掌握滑动窗口在数组中的应用', FALSE, 3, '2025-06-30', 'medium', 180, '注意边界条件处理', NOW(), NOW());


-- 插入通知
INSERT INTO notifications (notification_id, receiver_phone, type, priority, title, content, action_type, related_user_phone, related_content_id, related_content_type, is_read, created_at, updated_at) VALUES
('600000001', '13800138002', 'system', 'medium', '欢迎使用平台', '欢迎加入学习社区！', 'none', NULL, NULL, NULL, false, NOW(), NOW()),
('600000002', '13800138003', 'new_follower', 'low', '新的关注者', '李同学开始关注您了！', 'navigate', '13800138002', NULL, NULL, false, NOW(), NOW()),
('600000004', '13800138002', 'follow_post', 'medium', '关注用户发布了新帖子', '张教授发布了新帖子：《算法学习心得》', 'navigate', '13800138001', '100000001', 'post', false, NOW(), NOW()),
('600000005', '13800138003', 'follow_resource', 'medium', '关注用户发布了新资源', '张教授上传了新资源：《数据结构与算法教程》', 'navigate', '13800138001', '123456789', 'resource', false, NOW(), NOW()),
('600000006', '13800138001', 'content_commented', 'low', '您的帖子收到新评论', '李同学评论了您的帖子：《算法学习心得》', 'navigate', '13800138002', '100000001', 'post', false, NOW(), NOW());

-- 插入一个广播通知示例（receiver_phone为NULL）
INSERT INTO notifications (notification_id, receiver_phone, type, priority, title, content, action_type, related_user_phone, related_content_id, related_content_type, is_read, created_at, updated_at) VALUES
('600000003', NULL, 'announcement', 'high', '系统维护通知', '系统将于今晚23:00-24:00进行维护，请合理安排学习时间。', 'none', NULL, NULL, NULL, false, NOW(), NOW());

-- 插入广播通知已读状态示例（只有用户13800138002标记了这个广播通知为已读）
INSERT INTO notification_reads (user_phone, notification_id, read_at, created_at, updated_at) VALUES
('13800138002', '600000003', NOW(), NOW(), NOW());

-- 插入测试举报数据
INSERT INTO resource_reports (report_id, resource_id, reporter_phone, reason, description, status, created_at, updated_at) VALUES
('700000001', '123456790', '13800138003', 'inappropriate', '资源内容不当，包含不适合的内容', 'pending', NOW(), NOW()),
('700000002', '123456791', '13800138002', 'copyright', '疑似侵犯版权', 'pending', NOW(), NOW());

INSERT INTO post_reports (report_id, post_id, reporter_phone, reason, description, status, created_at, updated_at) VALUES
('700000003', '100000002', '13800138003', 'spam', '帖子内容涉嫌灌水', 'pending', NOW(), NOW());

-- 插入搜索统计测试数据
INSERT INTO search_statistics (search_term, search_type, search_count, result_count, user_phone, response_time_ms, created_at, updated_at) VALUES
('数据结构', 'resource', 25, 8, '13800138002', 45, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('算法', 'resource', 18, 12, '13800138003', 38, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('前端开发', 'post', 15, 6, '13800138002', 52, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('Vue.js', 'mixed', 22, 14, NULL, 41, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('Python', 'resource', 30, 20, '13800138003', 35, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('机器学习', 'post', 12, 5, '13800138002', 48, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('计算机网络', 'resource', 8, 3, NULL, 42, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 插入热门搜索关键词测试数据
INSERT INTO hot_keywords (keyword, search_count, result_count, category, last_searched_at, created_at, updated_at) VALUES
('数据结构', 45, 12, 'resource', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
('算法', 38, 15, 'resource', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
('Python', 52, 25, 'mixed', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 40 DAY), NOW()),
('前端开发', 28, 18, 'post', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
('Vue.js', 31, 20, 'mixed', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 15 DAY), NOW()),
('机器学习', 22, 8, 'post', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
('计算机网络', 15, 6, 'resource', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
('操作系统', 18, 10, 'resource', DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('数据库', 25, 14, 'mixed', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('深度学习', 20, 7, 'post', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 5 DAY), NOW());

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

-- ================================================================
-- 第六部分：用户计数器一致性检测与修复
-- ================================================================

-- 用户计数器一致性检测函数
DELIMITER $$

CREATE PROCEDURE CheckAndFixUserCounters()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_phone VARCHAR(11);
    DECLARE actual_post_count, actual_resource_count, actual_follower_count, actual_following_count INT;
    DECLARE current_post_count, current_resource_count, current_follower_count, current_following_count INT;
    
    -- 游标声明
    DECLARE user_cursor CURSOR FOR SELECT phone_number FROM users;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 创建临时表来记录不一致的用户
    DROP TEMPORARY TABLE IF EXISTS temp_inconsistent_users;
    CREATE TEMPORARY TABLE temp_inconsistent_users (
        phone_number VARCHAR(11),
        field_name VARCHAR(20),
        current_value INT,
        actual_value INT,
        difference INT
    );
    
    -- 开始检测每个用户的计数器
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO user_phone;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 获取当前用户表中的计数值
        SELECT post_count, resource_count, follower_count, following_count
        INTO current_post_count, current_resource_count, current_follower_count, current_following_count
        FROM users WHERE phone_number = user_phone;
        
        -- 计算实际的帖子数量（状态为active的帖子）
        SELECT COUNT(*) INTO actual_post_count
        FROM posts 
        WHERE author_phone = user_phone AND status = 'active';
        
        -- 计算实际的资源数量（状态为published的资源）
        SELECT COUNT(*) INTO actual_resource_count
        FROM resources 
        WHERE publisher_phone = user_phone AND status = 'published';
        
        -- 计算实际的粉丝数量（被关注数）
        SELECT COUNT(*) INTO actual_follower_count
        FROM user_follows 
        WHERE following_phone = user_phone AND status = 'active';
        
        -- 计算实际的关注数量（关注别人的数量）
        SELECT COUNT(*) INTO actual_following_count
        FROM user_follows 
        WHERE follower_phone = user_phone AND status = 'active';
        
        -- 检测帖子数不一致
        IF current_post_count != actual_post_count THEN
            INSERT INTO temp_inconsistent_users VALUES 
            (user_phone, 'post_count', current_post_count, actual_post_count, actual_post_count - current_post_count);
        END IF;
        
        -- 检测资源数不一致
        IF current_resource_count != actual_resource_count THEN
            INSERT INTO temp_inconsistent_users VALUES 
            (user_phone, 'resource_count', current_resource_count, actual_resource_count, actual_resource_count - current_resource_count);
        END IF;
        
        -- 检测粉丝数不一致
        IF current_follower_count != actual_follower_count THEN
            INSERT INTO temp_inconsistent_users VALUES 
            (user_phone, 'follower_count', current_follower_count, actual_follower_count, actual_follower_count - current_follower_count);
        END IF;
        
        -- 检测关注数不一致
        IF current_following_count != actual_following_count THEN
            INSERT INTO temp_inconsistent_users VALUES 
            (user_phone, 'following_count', current_following_count, actual_following_count, actual_following_count - current_following_count);
        END IF;
        
    END LOOP;
    
    CLOSE user_cursor;
    
    -- 显示检测结果
    SELECT 
        '=== 用户计数器一致性检测结果 ===' as message,
        COUNT(*) as inconsistent_records
    FROM temp_inconsistent_users;
    
    -- 如果有不一致的记录，显示详情
    IF (SELECT COUNT(*) FROM temp_inconsistent_users) > 0 THEN
        SELECT 
            phone_number as '用户手机号',
            field_name as '字段名',
            current_value as '当前值',
            actual_value as '实际值',
            difference as '差异',
            CASE 
                WHEN difference > 0 THEN '需要增加'
                WHEN difference < 0 THEN '需要减少'
                ELSE '一致'
            END as '修复状态'
        FROM temp_inconsistent_users
        ORDER BY phone_number, field_name;
    ELSE
        SELECT '所有用户计数器都是一致的！' as message;
    END IF;
    
END$$

DELIMITER ;

-- ================================================================
-- 用户计数器修复函数
-- ================================================================

DELIMITER $$

CREATE PROCEDURE FixUserCounters()
BEGIN
    DECLARE user_phone VARCHAR(11);
    DECLARE done INT DEFAULT FALSE;
    DECLARE users_updated INT DEFAULT 0;
    DECLARE user_cursor CURSOR FOR SELECT phone_number FROM users;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 记录修复前的状态
    SELECT 
        '修复前状态：' as message,
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END) as inconsistent_users
    FROM user_counter_consistency_check;
    
    -- 开始修复每个用户的计数器
    OPEN user_cursor;
    
    fix_loop: LOOP
        FETCH user_cursor INTO user_phone;
        IF done THEN
            LEAVE fix_loop;
        END IF;
        
        -- 修复用户计数器
        UPDATE users SET
            post_count = (
                SELECT COUNT(*) FROM posts 
                WHERE author_phone = user_phone AND status = 'active'
            ),
            resource_count = (
                SELECT COUNT(*) FROM resources 
                WHERE publisher_phone = user_phone AND status = 'published'
            ),
            follower_count = (
                SELECT COUNT(*) FROM user_follows 
                WHERE following_phone = user_phone AND status = 'active'
            ),
            following_count = (
                SELECT COUNT(*) FROM user_follows 
                WHERE follower_phone = user_phone AND status = 'active'
            )
        WHERE phone_number = user_phone;
        
        SET users_updated = users_updated + 1;
        
    END LOOP;
    
    CLOSE user_cursor;
    
    -- 显示修复结果
    SELECT 
        '用户计数器批量修复完成！' as message,
        users_updated as users_processed;
    
    -- 显示修复后的状态
    SELECT 
        '修复后状态：' as message,
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END) as remaining_inconsistent_users,
        CASE 
            WHEN SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END) = 0 
            THEN '✅ 所有用户计数器已修复！'
            ELSE CONCAT('⚠️ 仍有 ', SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END), ' 个用户计数器不一致')
        END as result_status
    FROM user_counter_consistency_check;
    
END$$

DELIMITER ;

-- ================================================================
-- 创建定期一致性检测视图
-- ================================================================

CREATE VIEW user_counter_consistency_check AS
SELECT 
    u.phone_number,
    u.nickname,
    u.post_count as stored_post_count,
    (SELECT COUNT(*) FROM posts WHERE author_phone = u.phone_number AND status = 'active') as actual_post_count,
    u.resource_count as stored_resource_count,
    (SELECT COUNT(*) FROM resources WHERE publisher_phone = u.phone_number AND status = 'published') as actual_resource_count,
    u.follower_count as stored_follower_count,
    (SELECT COUNT(*) FROM user_follows WHERE following_phone = u.phone_number AND status = 'active') as actual_follower_count,
    u.following_count as stored_following_count,
    (SELECT COUNT(*) FROM user_follows WHERE follower_phone = u.phone_number AND status = 'active') as actual_following_count,
    CASE 
        WHEN u.post_count != (SELECT COUNT(*) FROM posts WHERE author_phone = u.phone_number AND status = 'active') 
             OR u.resource_count != (SELECT COUNT(*) FROM resources WHERE publisher_phone = u.phone_number AND status = 'published')
             OR u.follower_count != (SELECT COUNT(*) FROM user_follows WHERE following_phone = u.phone_number AND status = 'active')
             OR u.following_count != (SELECT COUNT(*) FROM user_follows WHERE follower_phone = u.phone_number AND status = 'active')
        THEN 'INCONSISTENT'
        ELSE 'CONSISTENT'
    END as status
FROM users u
ORDER BY u.phone_number;

-- ================================================================
-- 执行一致性检测和自动修复
-- ================================================================

-- 执行一致性检测
CALL CheckAndFixUserCounters();

-- 自动修复发现的不一致问题
SELECT '=== 开始自动修复用户计数器不一致问题 ===' as message;
CALL FixUserCounters();

-- 修复后重新检测验证
SELECT '=== 修复完成，重新验证一致性 ===' as message;
CALL CheckAndFixUserCounters();

-- 最终一致性检测报告
SELECT 
    '=== 最终数据一致性检测报告 ===' as report_title,
    NOW() as check_time;

-- 显示不一致的用户
SELECT * FROM user_counter_consistency_check WHERE status = 'INCONSISTENT';

-- 显示最终状态
SELECT 
    '=== 🎉 数据库初始化完成报告 ===' as title,
    NOW() as completion_time;

SELECT 
    '总体统计' as category,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM resources) as total_resources,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM user_follows) as total_follows;

-- 最终一致性状态
SELECT 
    '用户计数器一致性状态' as category,
    COUNT(*) as total_users,
    SUM(CASE WHEN status = 'CONSISTENT' THEN 1 ELSE 0 END) as consistent_users,
    SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END) as inconsistent_users,
    CONCAT(
        ROUND(SUM(CASE WHEN status = 'CONSISTENT' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2), 
        '%'
    ) as consistency_rate
FROM user_counter_consistency_check;

-- 最终成功消息
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM user_counter_consistency_check WHERE status = 'INCONSISTENT') = 0
        THEN '✅ 数据库初始化成功！所有用户计数器已自动修复并保持一致。'
        ELSE CONCAT('⚠️ 注意：仍有 ', (SELECT COUNT(*) FROM user_counter_consistency_check WHERE status = 'INCONSISTENT'), ' 个用户的计数器不一致，可能需要手动检查。')
    END as final_status,
    '数据库已准备就绪，可以开始使用系统。' as ready_status;