-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS wechat_education
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE wechat_education;

-- 创建应用用户（如果不存在）
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword123';

-- 授权
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON wechat_education.* TO 'appuser'@'%';

-- 刷新权限
FLUSH PRIVILEGES;