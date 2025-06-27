-- 初始化测试数据
-- 设置正确的字符集
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET CHARACTER SET utf8mb4;

-- 注意：由于使用了Sequelize ORM，表结构会自动创建
-- 这个脚本只初始化一些基础的测试数据

-- 插入测试用户（密码是123456的bcrypt哈希值）
INSERT IGNORE INTO users (phone_number, password, name, nickname, email, status, created_at, updated_at) VALUES
('13800138001', '$2b$10$9X.ZVfYU3TXn4Kd.VxhFDe/1R4XhE.yJfIgDh8b5nV4LPaEtN2.7K', '张教授', '张教授', 'zhang@bjut.edu.cn', 'active', NOW(), NOW()),
('13800138002', '$2b$10$9X.ZVfYU3TXn4Kd.VxhFDe/1R4XhE.yJfIgDh8b5nV4LPaEtN2.7K', '李同学', '李同学', 'li@student.bjut.edu.cn', 'active', NOW(), NOW()),
('13800138003', '$2b$10$9X.ZVfYU3TXn4Kd.VxhFDe/1R4XhE.yJfIgDh8b5nV4LPaEtN2.7K', '王老师', '王老师', 'wang@bjut.edu.cn', 'active', NOW(), NOW());

-- 插入资源类型
INSERT IGNORE INTO resource_types (type_id, type_name, description, created_at) VALUES
(1, '课件', '教学课件资源', NOW()),
(2, '作业', '课程作业资源', NOW()),
(3, '实验', '实验代码和报告', NOW()),
(4, '考试', '考试资料和复习资料', NOW()),
(5, '项目', '项目源码和文档', NOW()),
(6, '论文', '学术论文和文献', NOW());

-- 插入资源分类
INSERT IGNORE INTO categories (category_id, category_name, category_value, description, icon, sort_order, status, created_at, updated_at) VALUES
('CAT001', '课件', 'courseware', '教学课件和演示文稿', '📚', 1, 'active', NOW(), NOW()),
('CAT002', '作业', 'homework', '课程作业和练习题', '📝', 2, 'active', NOW(), NOW()),
('CAT003', '实验', 'experiment', '实验代码和实验报告', '🔬', 3, 'active', NOW(), NOW()),
('CAT004', '考试', 'exam', '考试资料和复习材料', '📋', 4, 'active', NOW(), NOW()),
('CAT005', '项目', 'project', '项目源码和项目文档', '💻', 5, 'active', NOW(), NOW()),
('CAT006', '论文', 'paper', '学术论文和研究文献', '📄', 6, 'active', NOW(), NOW());

-- 标签数据（已简化，仅保留分类功能）
-- INSERT IGNORE INTO tags (tag_id, tag_name, category, usage_count, status, created_at, updated_at) VALUES
-- ('100000001', 'JavaScript', '编程语言', 0, 'active', NOW(), NOW()),
-- ('100000002', 'Python', '编程语言', 0, 'active', NOW(), NOW()),
-- ('100000003', 'Java', '编程语言', 0, 'active', NOW(), NOW()),
-- ('100000004', 'React', '前端框架', 0, 'active', NOW(), NOW()),
-- ('100000005', 'Vue', '前端框架', 0, 'active', NOW(), NOW()),
-- ('100000006', 'Node.js', '后端技术', 0, 'active', NOW(), NOW()),
-- ('100000007', '数据结构', '计算机基础', 0, 'active', NOW(), NOW()),
-- ('100000008', '算法', '计算机基础', 0, 'active', NOW(), NOW()),
-- ('100000009', '机器学习', '人工智能', 0, 'active', NOW(), NOW()),
-- ('100000010', '深度学习', '人工智能', 0, 'active', NOW(), NOW()),
-- ('100000011', '数据库', '数据管理', 0, 'active', NOW(), NOW()),
-- ('100000012', 'MySQL', '数据管理', 0, 'active', NOW(), NOW()),
-- ('100000013', '软件工程', '工程管理', 0, 'active', NOW(), NOW()),
-- ('100000014', '设计模式', '软件设计', 0, 'active', NOW(), NOW()),
-- ('100000015', '网络编程', '网络技术', 0, 'active', NOW(), NOW());

-- 插入测试资源（包含分类信息）
INSERT IGNORE INTO resources (resource_id, publisher_phone, resource_name, description, collection_count, comment_count, rating, view_count, download_count, status, category_id, created_at, updated_at) VALUES
('123456789', '13800138001', '数据结构与算法 - 第一章课件', '包含基础概念、时间复杂度分析、常用数据结构介绍等内容', 25, 8, 4.8, 256, 128, 'published', 'CAT001', NOW(), NOW()),
('123456790', '13800138002', '机器学习实验代码包', '包含线性回归、决策树、SVM等经典算法的完整实现代码', 18, 5, 4.6, 189, 67, 'published', 'CAT003', NOW(), NOW()),
('123456791', '13800138003', '软件工程期末复习资料', '涵盖软件开发生命周期、设计模式、项目管理等重点知识', 32, 12, 4.9, 342, 198, 'published', 'CAT004', NOW(), NOW()),
('123456792', '13800138001', 'JavaScript高级编程指南', '深入讲解ES6+新特性、异步编程、设计模式等高级概念', 15, 6, 4.7, 156, 89, 'published', 'CAT001', NOW(), NOW()),
('123456793', '13800138002', 'React项目实战教程', '从零开始构建完整的React应用，包含状态管理、路由、测试等', 28, 9, 4.5, 234, 145, 'published', 'CAT005', NOW(), NOW());

-- 插入测试文件
INSERT IGNORE INTO files (file_id, resource_id, file_name, file_size, file_type, storage_path, storage_method, download_count, created_at) VALUES
('100000001', '123456789', '数据结构与算法-第一章.pdf', 2048576, 'application/pdf', '/uploads/resources/datastruct_ch1.pdf', 'local', 128, NOW()),
('100000002', '123456790', 'ml_algorithms.zip', 5242880, 'application/zip', '/uploads/resources/ml_algorithms.zip', 'local', 67, NOW()),
('100000003', '123456791', '软件工程复习资料.docx', 1048576, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '/uploads/resources/se_review.docx', 'local', 198, NOW()),
('100000004', '123456792', 'JavaScript高级编程.pdf', 3145728, 'application/pdf', '/uploads/resources/js_advanced.pdf', 'local', 89, NOW()),
('100000005', '123456793', 'react-project-tutorial.zip', 4194304, 'application/zip', '/uploads/resources/react_tutorial.zip', 'local', 145, NOW());

-- 资源标签关联（已简化，改为使用分类）
-- INSERT IGNORE INTO resource_tags (relation_id, resource_id, tag_id, created_at, updated_at) VALUES
-- (1, '123456789', '100000007', NOW(), NOW()), -- 数据结构
-- (2, '123456789', '100000008', NOW(), NOW()), -- 算法
-- (3, '123456790', '100000009', NOW(), NOW()), -- 机器学习
-- (4, '123456790', '100000002', NOW(), NOW()), -- Python
-- (5, '123456791', '100000013', NOW(), NOW()), -- 软件工程
-- (6, '123456791', '100000014', NOW(), NOW()), -- 设计模式
-- (7, '123456792', '100000001', NOW(), NOW()), -- JavaScript
-- (8, '123456793', '100000004', NOW(), NOW()), -- React
-- (9, '123456793', '100000001', NOW(), NOW()); -- JavaScript

-- 插入帖子标签
INSERT IGNORE INTO post_tags (tag_id, tag_name, tag_color, usage_count, status, created_at, updated_at) VALUES
('100000001', 'JavaScript', '#F7DF1E', 5, 'active', NOW(), NOW()),
('100000002', 'Python', '#3776AB', 8, 'active', NOW(), NOW()),
('100000003', 'React', '#61DAFB', 6, 'active', NOW(), NOW()),
('100000004', '数据结构', '#FF6B6B', 4, 'active', NOW(), NOW()),
('100000005', '算法', '#4ECDC4', 7, 'active', NOW(), NOW()),
('100000006', '机器学习', '#45B7D1', 3, 'active', NOW(), NOW()),
('100000007', '前端开发', '#96CEB4', 9, 'active', NOW(), NOW()),
('100000008', '后端开发', '#FFEAA7', 5, 'active', NOW(), NOW()),
('100000009', '数据库', '#DDA0DD', 4, 'active', NOW(), NOW()),
('100000010', '软件工程', '#74B9FF', 6, 'active', NOW(), NOW());

-- 插入测试帖子
INSERT IGNORE INTO posts (post_id, author_phone, title, content, view_count, like_count, comment_count, status, created_at, updated_at) VALUES
('100000001', '13800138001', '关于数据结构学习的几点建议', '# 数据结构学习心得\n\n作为一名计算机专业的教师，我想分享一些关于数据结构学习的经验：\n\n## 1. 理论与实践结合\n- 不要只停留在理论层面\n- 多动手实现各种数据结构\n- 通过编程加深理解\n\n## 2. 从简单到复杂\n- 先掌握线性结构（数组、链表、栈、队列）\n- 再学习树形结构\n- 最后学习图和高级数据结构\n\n## 3. 多练习算法题\n- LeetCode 是很好的练习平台\n- 从简单题目开始\n- 逐步提高难度\n\n希望对大家有帮助！', 156, 23, 8, 'active', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),

('100000002', '13800138002', '求助：JavaScript异步编程问题', '最近在学习JavaScript的异步编程，遇到了一些困惑：\n\n```javascript\nfunction delay() {\n  return new Promise((resolve) => {\n    setTimeout(() => {\n      resolve(\"Hello\");\n    }, 1000);\n  });\n}\n\nasync function test() {\n  const result = await delay();\n  console.log(result);\n}\n```\n\n这段代码中，为什么要使用`await`？如果不用会怎样？\n\n另外，Promise和async/await的区别是什么？什么时候用哪个比较好？\n\n求各位大佬指教！🙏', 89, 12, 15, 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

('100000003', '13800138003', '分享一个React Hook最佳实践', '# React Hook 使用技巧\n\n最近在项目中总结了一些React Hook的使用经验，分享给大家：\n\n## 1. 自定义Hook\n\n```jsx\n// 自定义一个数据获取Hook\nfunction useApi(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    fetch(url)\n      .then(res => res.json())\n      .then(setData)\n      .catch(setError)\n      .finally(() => setLoading(false));\n  }, [url]);\n\n  return { data, loading, error };\n}\n```\n\n## 2. useCallback优化\n\n避免不必要的重渲染：\n\n```jsx\nconst handleClick = useCallback(() => {\n  // 处理点击事件\n}, [dependency]);\n```\n\n大家还有什么好的Hook使用技巧吗？', 134, 28, 6, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

('100000004', '13800138001', 'MySQL数据库优化经验分享', '# 数据库性能优化总结\n\n在教学和项目实践中，总结了一些MySQL优化的常用方法：\n\n## 索引优化\n1. **合理创建索引**\n   - 在WHERE、ORDER BY、JOIN字段上创建索引\n   - 避免过多索引影响写性能\n\n2. **复合索引使用**\n   - 遵循最左前缀原则\n   - 区分度高的字段放在前面\n\n## 查询优化\n1. **避免SELECT ***\n2. **使用LIMIT限制结果集**\n3. **合理使用子查询和JOIN**\n\n## 表结构优化\n1. **选择合适的数据类型**\n2. **字段设计要规范**\n3. **适当的表分区**\n\n欢迎大家讨论更多优化技巧！', 203, 35, 12, 'active', NOW(), NOW()),

('100000005', '13800138002', '机器学习算法对比分析', '# 常用机器学习算法对比\n\n最近在做课程项目，对几种常用的机器学习算法做了对比分析：\n\n| 算法 | 优点 | 缺点 | 适用场景 |\n|------|------|------|----------|\n| 线性回归 | 简单、可解释性强 | 只能处理线性关系 | 预测连续值 |\n| 决策树 | 易理解、处理非线性 | 容易过拟合 | 分类和回归 |\n| SVM | 效果好、泛化能力强 | 参数调优复杂 | 小样本分类 |\n| 随机森林 | 减少过拟合、特征重要性 | 解释性较差 | 大多数场景 |\n\n## 实验结果\n\n在鸢尾花数据集上的准确率：\n- SVM: 97.3%\n- 随机森林: 96.7%\n- 决策树: 93.3%\n\n大家在项目中更倾向于使用哪种算法？', 167, 19, 9, 'active', DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW()),

('100000006', '13800138002', '我的前端学习计划分享', '# 我的前端学习之路\n\n最近制定了一个系统的前端学习计划，想和大家分享一下：\n\n## 阶段一：基础巩固（6月）\n- Vue.js 基础语法和组件开发\n- JavaScript ES6+ 新特性\n- CSS3 动画和布局\n\n## 阶段二：实战练习（7月）\n- 开发一个完整的 Vue.js 项目\n- 学习 Vuex 状态管理\n- 掌握前端工程化工具\n\n## 阶段三：进阶提升（8月）\n- 学习 React 和 Hooks\n- 了解微前端架构\n- 性能优化技巧\n\n目前第一阶段进展顺利，已经完成了65%的学习任务。大家有什么好的学习建议吗？', 89, 15, 7, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

('100000007', '13800138003', '学习目标管理的重要性', '# 为什么要设定学习目标？\n\n作为一名即将毕业的学生，我深深体会到学习目标管理的重要性：\n\n## 1. 明确方向\n- 避免盲目学习\n- 提高学习效率\n- 及时调整学习策略\n\n## 2. 量化进度\n- 可视化学习成果\n- 增强学习动力\n- 培养自律习惯\n\n## 3. 阶段性总结\n- 定期回顾学习效果\n- 发现问题及时改进\n- 积累学习经验\n\n我现在使用学习计划功能来管理自己的复习进度，效果很不错！推荐大家也试试看。', 67, 12, 4, 'active', DATE_SUB(NOW(), INTERVAL 6 HOUR), NOW());

-- 插入帖子标签关联
INSERT IGNORE INTO post_tag_relations (post_id, tag_id, created_at) VALUES
('100000001', '100000004', NOW()), -- 数据结构学习建议 - 数据结构
('100000001', '100000005', NOW()), -- 数据结构学习建议 - 算法
('100000002', '100000001', NOW()), -- JavaScript异步编程 - JavaScript
('100000002', '100000007', NOW()), -- JavaScript异步编程 - 前端开发
('100000003', '100000003', NOW()), -- React Hook实践 - React
('100000003', '100000007', NOW()), -- React Hook实践 - 前端开发
('100000004', '100000009', NOW()), -- MySQL优化 - 数据库
('100000004', '100000008', NOW()), -- MySQL优化 - 后端开发
('100000005', '100000006', NOW()), -- 机器学习算法 - 机器学习
('100000005', '100000002', NOW()), -- 机器学习算法 - Python
('100000006', '100000007', NOW()), -- 前端学习计划分享 - 前端开发
('100000006', '100000001', NOW()), -- 前端学习计划分享 - JavaScript
('100000006', '100000003', NOW()), -- 前端学习计划分享 - React
('100000007', '100000010', NOW()); -- 学习目标管理的重要性 - 软件工程

-- 插入测试评论
INSERT IGNORE INTO comments (author_phone, post_id, content, like_count, status, created_at, updated_at) VALUES
('13800138002', '100000001', '张教授说得很对！我就是按照这个方法学习的，效果确实不错。特别是多练习算法题这一点，LeetCode上刷题真的很有帮助。', 5, 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('13800138003', '100000001', '补充一点：建议大家学习数据结构时可以尝试用不同的编程语言实现，这样能更深入理解底层原理。', 3, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('13800138001', '100000002', '关于你的问题：\n\n1. `await`的作用是等待Promise完成，如果不用await，函数会立即返回一个Promise对象而不是实际值。\n\n2. Promise是ES6引入的异步解决方案，async/await是ES2017引入的语法糖，让异步代码看起来像同步代码。\n\n建议：简单场景用async/await，复杂的Promise链用.then()。', 8, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('13800138003', '100000002', '可以试试这个例子对比：\n\n```javascript\n// 不用await\nfunction test1() {\n  const result = delay(); // 这里得到的是Promise对象\n  console.log(result); // Promise<pending>\n}\n\n// 使用await\nasync function test2() {\n  const result = await delay(); // 这里得到的是实际值\n  console.log(result); // \"Hello\"\n}\n```', 4, 'active', DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),
('13800138001', '100000003', '很好的总结！补充一个useMemo的使用场景：\n\n```jsx\nconst expensiveValue = useMemo(() => {\n  return computeExpensiveValue(a, b);\n}, [a, b]);\n```\n\n当计算成本很高时，useMemo可以避免重复计算。', 6, 'active', DATE_SUB(NOW(), INTERVAL 20 HOUR), NOW()),
('13800138002', '100000004', '张教授的经验很实用！我想问一下，对于小型项目，是否也需要做这么详细的优化？', 2, 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),
('13800138003', '100000005', '你的对比分析很详细！我在项目中主要用随机森林，因为它相对来说参数调优比较简单，而且效果稳定。', 4, 'active', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW()),
('13800138001', '100000005', '建议补充一下各算法的时间复杂度对比，这在处理大数据集时很重要。另外，XGBoost也是个不错的选择。', 3, 'active', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW()),
('13800138001', '100000006', '你的学习计划很详细！建议在每个阶段结束后做个总结，这样能更好地发现问题和改进方法。', 4, 'active', DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),
('13800138003', '100000006', '同样在学前端，你的计划给了我很多启发。我也要制定一个系统的学习计划了！', 2, 'active', DATE_SUB(NOW(), INTERVAL 8 HOUR), NOW()),
('13800138002', '100000007', '说得很有道理！我最近也在用学习计划功能，确实比以前盲目学习效率高多了。', 3, 'active', DATE_SUB(NOW(), INTERVAL 4 HOUR), NOW()),
('13800138001', '100000007', '作为老师，我很欣慰看到学生们这么重视学习规划。量化目标确实是提高学习效率的好方法。', 5, 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW());

-- 插入资源评分数据
INSERT IGNORE INTO ratings (user_phone, resource_id, rating, review_text, created_at, updated_at) VALUES
('13800138002', '123456789', 4.8, '课件内容很详细，讲解清晰，对理解数据结构的基本概念很有帮助。特别是时间复杂度的分析部分写得很好。', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('13800138003', '123456789', 4.7, '张教授的课件一如既往的高质量，图表清晰，例子丰富。建议再增加一些实际应用场景的案例。', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('13800138001', '123456790', 4.6, '机器学习代码实现很规范，注释详细，适合初学者学习。代码风格统一，易于理解和修改。', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('13800138003', '123456790', 4.5, '代码质量不错，算法实现正确。不过有些地方可以进一步优化，比如数据预处理部分可以更加模块化。', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('13800138001', '123456791', 4.9, '复习资料整理得非常全面，知识点覆盖完整，重点突出。对期末复习帮助很大，强烈推荐！', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('13800138002', '123456791', 4.8, '内容丰富，条理清晰。特别是项目管理那一部分，结合了很多实际案例，很实用。', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('13800138002', '123456792', 4.7, 'JavaScript高级特性讲解得很深入，ES6+的新语法介绍详细。对提升编程水平很有帮助。', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('13800138003', '123456792', 4.6, '内容专业，例子丰富。不过有些概念对初学者来说可能比较难理解，建议增加更多基础铺垫。', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('13800138001', '123456793', 4.5, 'React项目很完整，从基础到进阶都有涉及。代码结构清晰，适合作为学习模板。', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('13800138003', '123456793', 4.4, '项目实战性强，能学到很多实际开发中的技巧。不过文档可以再详细一些，特别是部署相关的内容。', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- 插入资源收藏数据
INSERT IGNORE INTO collections (collection_id, user_phone, content_id, collection_type, status, created_at, updated_at) VALUES
('100000001', '13800138002', '123456789', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('100000002', '13800138003', '123456789', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('100000003', '13800138001', '123456790', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('100000004', '13800138003', '123456790', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('100000005', '13800138001', '123456791', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('100000006', '13800138002', '123456791', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('100000007', '13800138002', '123456792', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('100000008', '13800138003', '123456792', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('100000009', '13800138001', '123456793', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('100000010', '13800138003', '123456793', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('100000011', '13800138002', '123456793', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),
('100000012', '13800138003', '123456789', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 8 HOUR), NOW()),
('100000013', '13800138001', '123456792', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 6 HOUR), NOW()),
('100000014', '13800138002', '123456790', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 4 HOUR), NOW()),
('100000015', '13800138003', '123456791', 'resource', 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW());

-- 插入资源评论数据
INSERT IGNORE INTO comments (author_phone, resource_id, content, like_count, status, created_at, updated_at) VALUES
('13800138002', '123456789', '张教授的课件质量一直很高，这次也不例外。数据结构的基本概念讲解得很清楚，特别是链表和栈的部分，图解很直观。', 8, 'active', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('13800138003', '123456789', '课件内容丰富，但是希望能增加一些编程练习题，这样理论和实践能更好结合。', 5, 'active', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('13800138001', '123456789', '感谢大家的反馈！下个版本我会增加更多的实践练习和案例分析。', 6, 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

('13800138001', '123456790', '代码写得很规范，注释也很详细。机器学习算法的实现逻辑清晰，适合学习参考。', 7, 'active', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('13800138003', '123456790', '项目结构组织得不错，每个算法都有独立的模块。建议增加一些数据可视化的内容。', 4, 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('13800138002', '123456790', '谢谢老师的建议！我正在准备可视化部分的代码，很快就会更新。', 3, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

('13800138001', '123456791', '复习资料整理得非常全面，覆盖了课程的所有重点。排版也很清晰，便于快速查找知识点。', 9, 'active', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('13800138002', '123456791', '特别喜欢里面的思维导图部分，能帮助建立知识体系的整体框架。', 6, 'active', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('13800138003', '123456791', '作为即将考试的学生，这份资料真的帮了大忙。知识点总结得很到位！', 7, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

('13800138002', '123456792', 'JavaScript高级特性的讲解很深入，特别是闭包和原型链的部分，例子很生动。', 5, 'active', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('13800138003', '123456792', '内容确实很专业，不过对于初学者来说可能有点难度。建议增加一些基础知识的回顾。', 4, 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),

('13800138001', '123456793', 'React项目很完整，从组件设计到状态管理都有详细说明。代码风格也很统一。', 6, 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('13800138003', '123456793', '项目的架构设计很合理，学到了不少最佳实践。希望能看到更多这样的实战项目。', 4, 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('13800138002', '123456793', '感谢大家的支持！我会继续分享更多高质量的项目案例。', 2, 'active', DATE_SUB(NOW(), INTERVAL 8 HOUR), NOW());

-- 插入用户关注关系数据
INSERT IGNORE INTO user_follows (follow_id, follower_phone, following_phone, status, created_at, updated_at) VALUES
('100000001', '13800138002', '13800138001', 'active', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('100000002', '13800138003', '13800138001', 'active', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
('100000003', '13800138001', '13800138002', 'active', DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('100000004', '13800138003', '13800138002', 'active', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('100000005', '13800138001', '13800138003', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('100000006', '13800138002', '13800138003', 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- 插入下载记录数据
INSERT IGNORE INTO download_records (download_id, user_phone, resource_id, file_id, download_size, download_time, ip_address, user_agent, status, downloaded_at, updated_at) VALUES
('100000001', '13800138002', '123456789', '100000001', 2048576, 3200, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('100000002', '13800138003', '123456789', '100000001', 2048576, 2800, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'completed', DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('100000003', '13800138001', '123456790', '100000002', 5242880, 8500, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('100000004', '13800138003', '123456790', '100000002', 5242880, 9200, '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('100000005', '13800138002', '123456791', '100000003', 1048576, 1800, '192.168.1.104', 'Mozilla/5.0 (Android 11; Mobile; rv:85.0) Gecko/85.0 Firefox/85.0', 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('100000006', '13800138001', '123456792', '100000004', 3145728, 5600, '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0', 'completed', DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),
('100000007', '13800138003', '123456793', '100000005', 4194304, 7200, '192.168.1.106', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', 'completed', DATE_SUB(NOW(), INTERVAL 8 HOUR), NOW()),
('100000008', '13800138002', '123456792', '100000004', 3145728, 4800, '192.168.1.107', 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15', 'completed', DATE_SUB(NOW(), INTERVAL 4 HOUR), NOW()),
('100000009', '13800138001', '123456793', '100000005', 4194304, 6400, '192.168.1.108', 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36', 'completed', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),
('100000010', '13800138003', '123456791', '100000003', 1048576, 2100, '192.168.1.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36', 'completed', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW());