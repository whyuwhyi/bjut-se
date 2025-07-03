-- ================================================================
-- 用户计数器一致性检测与修复脚本
-- 
-- 使用方法：
-- 1. 检测不一致：SELECT * FROM user_counter_consistency_check WHERE status = 'INCONSISTENT';
-- 2. 执行检测：CALL CheckAndFixUserCounters();
-- 3. 修复数据：CALL FixUserCounters();
-- 
-- 创建时间：2025-07-03
-- ================================================================

USE wechat_education;

-- ================================================================
-- 快速一致性检测查询
-- ================================================================

-- 检查所有用户的计数器一致性
SELECT 
    '=== 用户计数器快速检测 ===' as title,
    COUNT(*) as total_users,
    SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END) as inconsistent_users,
    CONCAT(
        ROUND(
            (COUNT(*) - SUM(CASE WHEN status = 'INCONSISTENT' THEN 1 ELSE 0 END)) * 100.0 / COUNT(*), 
            2
        ), 
        '%'
    ) as consistency_rate
FROM user_counter_consistency_check;

-- 显示不一致的用户详情
SELECT 
    phone_number as '手机号',
    nickname as '昵称',
    CONCAT(stored_post_count, ' → ', actual_post_count) as '帖子数 (存储→实际)',
    CONCAT(stored_resource_count, ' → ', actual_resource_count) as '资源数 (存储→实际)', 
    CONCAT(stored_follower_count, ' → ', actual_follower_count) as '粉丝数 (存储→实际)',
    CONCAT(stored_following_count, ' → ', actual_following_count) as '关注数 (存储→实际)'
FROM user_counter_consistency_check 
WHERE status = 'INCONSISTENT'
ORDER BY phone_number;

-- ================================================================
-- 分类统计不一致类型
-- ================================================================

SELECT 
    '帖子数不一致' as inconsistency_type,
    COUNT(*) as count
FROM user_counter_consistency_check 
WHERE stored_post_count != actual_post_count

UNION ALL

SELECT 
    '资源数不一致' as inconsistency_type,
    COUNT(*) as count
FROM user_counter_consistency_check 
WHERE stored_resource_count != actual_resource_count

UNION ALL

SELECT 
    '粉丝数不一致' as inconsistency_type,
    COUNT(*) as count
FROM user_counter_consistency_check 
WHERE stored_follower_count != actual_follower_count

UNION ALL

SELECT 
    '关注数不一致' as inconsistency_type,
    COUNT(*) as count
FROM user_counter_consistency_check 
WHERE stored_following_count != actual_following_count;

-- ================================================================
-- 手动执行修复的安全脚本
-- ================================================================

-- ================================================================
-- 自动修复脚本（如果检测到不一致问题）
-- ================================================================

-- 检查是否需要修复
SET @inconsistent_count = (SELECT COUNT(*) FROM user_counter_consistency_check WHERE status = 'INCONSISTENT');

SELECT 
    CASE 
        WHEN @inconsistent_count = 0 THEN '✅ 所有用户计数器都是一致的，无需修复'
        ELSE CONCAT('⚠️ 发现 ', @inconsistent_count, ' 个用户计数器不一致，开始自动修复...')
    END as auto_fix_status;

-- 如果有不一致问题，自动执行修复
-- 注意：取消以下注释来启用自动修复功能
/*
SELECT CASE 
    WHEN @inconsistent_count > 0 THEN '开始自动修复...'
    ELSE '跳过修复'
END as message;

-- 执行修复（仅在有不一致时）
CALL FixUserCounters();

-- 修复后重新检测
SELECT '修复完成，重新验证...' as message;
CALL CheckAndFixUserCounters();
*/

-- 手动执行修复的安全脚本
-- 注意：以下脚本会修改数据，执行前请确认需要修复
-- 取消注释以下行来手动执行修复：

-- SELECT '开始手动修复用户计数器...' as message;
-- CALL FixUserCounters();
-- SELECT '手动修复完成，重新检测一致性...' as message;
-- CALL CheckAndFixUserCounters();

-- ================================================================
-- 定期维护建议查询
-- ================================================================

-- 查找可能需要关注的用户（计数差异较大）
SELECT 
    phone_number as '手机号',
    nickname as '昵称',
    ABS(stored_post_count - actual_post_count) as post_diff,
    ABS(stored_resource_count - actual_resource_count) as resource_diff,
    ABS(stored_follower_count - actual_follower_count) as follower_diff,
    ABS(stored_following_count - actual_following_count) as following_diff,
    (ABS(stored_post_count - actual_post_count) + 
     ABS(stored_resource_count - actual_resource_count) + 
     ABS(stored_follower_count - actual_follower_count) + 
     ABS(stored_following_count - actual_following_count)) as total_diff
FROM user_counter_consistency_check 
WHERE status = 'INCONSISTENT'
ORDER BY total_diff DESC
LIMIT 10;

-- 显示最近活跃但计数异常的用户
SELECT 
    u.phone_number,
    u.nickname,
    u.updated_at as last_updated,
    cc.status as consistency_status
FROM users u
JOIN user_counter_consistency_check cc ON u.phone_number = cc.phone_number
WHERE u.updated_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND cc.status = 'INCONSISTENT'
ORDER BY u.updated_at DESC;