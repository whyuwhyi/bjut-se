-- 生产环境数据库初始化脚本
-- 设置正确的字符集
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET CHARACTER SET utf8mb4;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS wechat_education 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_0900_ai_ci;

-- 使用数据库
USE wechat_education;

-- 确保数据库使用正确的字符集
ALTER DATABASE wechat_education CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;