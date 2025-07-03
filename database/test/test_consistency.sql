-- ================================================================
-- 用户计数器一致性检测测试脚本
-- 
-- 此脚本用于测试一致性检测功能是否正常工作
-- ================================================================

USE wechat_education;

-- 显示当前数据库中的表结构
SHOW TABLES;

-- 检查是否存在必要的存储过程和视图
SELECT 
    'CheckAndFixUserCounters' as object_name,
    CASE WHEN COUNT(*) > 0 THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'wechat_education' 
  AND ROUTINE_NAME = 'CheckAndFixUserCounters';

SELECT 
    'FixUserCounters' as object_name,
    CASE WHEN COUNT(*) > 0 THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'wechat_education' 
  AND ROUTINE_NAME = 'FixUserCounters';

SELECT 
    'user_counter_consistency_check' as object_name,
    CASE WHEN COUNT(*) > 0 THEN '✅ 存在' ELSE '❌ 不存在' END as status
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = 'wechat_education' 
  AND TABLE_NAME = 'user_counter_consistency_check';

-- 如果视图存在，测试视图功能
SELECT '=== 测试一致性检测视图 ===' as test_title;

-- 检查用户数量
SELECT 
    COUNT(*) as total_users
FROM users;

-- 检查是否有用户数据
SELECT 
    phone_number,
    nickname,
    post_count,
    resource_count,
    follower_count,
    following_count
FROM users 
LIMIT 5;

-- 尝试查询一致性检测结果（如果视图存在）
SELECT 
    COUNT(*) as total_checked,
    SUM(CASE WHEN status = 'CONSISTENT' THEN 1 ELSE 0 END) as consistent_count,
    SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END) as inconsistent_count
FROM user_counter_consistency_check;

-- 显示不一致的用户（如果有）
SELECT * FROM user_counter_consistency_check WHERE status = 'INCONSISTENT' LIMIT 10;

-- 手动执行一致性检测存储过程
SELECT '=== 执行一致性检测存储过程 ===' as test_title;
CALL CheckAndFixUserCounters();

-- 测试完成提示
SELECT 
    '=== 一致性检测测试完成 ===' as message,
    NOW() as test_time;