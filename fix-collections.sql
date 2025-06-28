-- 临时修复collections表的重复数据问题

-- 先查看有问题的数据
SELECT 'Before cleanup - problematic records:' as status;
SELECT user_phone, content_id, collection_type, collection_id 
FROM collections 
WHERE collection_type IS NULL 
   OR collection_type = '' 
   OR collection_type NOT IN ('post', 'resource')
   OR content_id IS NULL 
   OR content_id = '';

-- 删除有问题的记录
DELETE FROM collections 
WHERE collection_type IS NULL 
   OR collection_type = '' 
   OR collection_type NOT IN ('post', 'resource')
   OR content_id IS NULL 
   OR content_id = '';

-- 查看是否还有重复记录
SELECT 'Duplicate records:' as status;
SELECT user_phone, content_id, collection_type, COUNT(*) as count
FROM collections 
GROUP BY user_phone, content_id, collection_type
HAVING COUNT(*) > 1;

-- 删除重复记录，保留collection_id最小的那条
DELETE c1 FROM collections c1
INNER JOIN collections c2 
WHERE c1.collection_id > c2.collection_id
  AND c1.user_phone = c2.user_phone 
  AND c1.content_id = c2.content_id 
  AND c1.collection_type = c2.collection_type;

-- 最终检查
SELECT 'After cleanup - total records:' as status, COUNT(*) as count FROM collections;
SELECT 'After cleanup - duplicate check:' as status;
SELECT user_phone, content_id, collection_type, COUNT(*) as count
FROM collections 
GROUP BY user_phone, content_id, collection_type
HAVING COUNT(*) > 1;