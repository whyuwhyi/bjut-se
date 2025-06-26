# 设计规范说明文档

## 📋 概述

本文档基于项目开发过程中的经验总结，制定了前后端开发的设计规范，确保代码质量、可维护性和扩展性。

---

## 🗄️ 数据库设计规范

### 数据存储原则
- **禁止硬编码**: 所有分类、标签、选项等数据必须存储在数据库中
- **支持动态管理**: 基础数据应支持通过后台管理界面进行增删改查
- **预留扩展空间**: 表结构设计要考虑未来功能扩展需求

### 表结构规范
```sql
-- 基础数据表示例
CREATE TABLE categories (
  category_id VARCHAR(20) PRIMARY KEY,     -- 业务主键
  category_name VARCHAR(50) NOT NULL,      -- 显示名称
  category_value VARCHAR(50) NOT NULL,     -- API参数值
  description TEXT,                        -- 描述
  icon VARCHAR(10),                        -- 图标(emoji)
  sort_order INT DEFAULT 0,                -- 排序
  status ENUM('active','inactive') DEFAULT 'active',  -- 状态
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 关键字段设计
- **双重标识**: 同时提供业务ID和显示名称
- **状态管理**: 使用status字段支持启用/禁用
- **排序支持**: sort_order字段控制显示顺序
- **时间戳**: 自动维护创建和更新时间

---

## 🎨 前端界面规范

### 交互统一原则
- **选择方式统一**: 同类型操作在不同页面使用相同的交互方式
- **界面一致性**: 相似功能模块保持视觉和操作的一致性
- **响应式设计**: 考虑不同屏幕尺寸的适配

### 筛选组件规范

#### ✅ 推荐做法 - 下拉框选择
```vue
<!-- 标准下拉框筛选 -->
<picker :value="selectedIndex" :range="optionNames" @change="handleChange">
  <view class="picker-view">
    {{ selectedIndex >= 0 ? optionNames[selectedIndex] : '全部' }}
  </view>
</picker>
```

#### ❌ 避免做法 - 混合交互方式
```vue
<!-- 避免：一个页面用下拉框，另一个页面用点击选择 -->
<view v-for="item in items" @click="select(item)">{{ item.name }}</view>
```

### 数据加载规范
- **动态加载**: 所有选项数据从API动态获取
- **统一接口**: 相同类型数据使用相同的API接口格式
- **错误处理**: 数据加载失败时有友好的提示

---

## 🔧 后端API设计规范

### 接口命名规范
```javascript
// 基础数据管理接口
GET  /api/v1/categories        // 获取所有分类
GET  /api/v1/categories/options // 获取下拉框选项
GET  /api/v1/categories/:value // 获取特定分类

// 业务数据接口  
GET  /api/v1/resources?categories=cat1,cat2&tags=tag1,tag2
```

### 返回数据格式
```json
{
  "success": true,
  "data": [
    {
      "value": "courseware",    // API参数值
      "name": "课件",           // 显示名称
      "icon": "📚"              // 图标
    }
  ]
}
```

### Controller设计模式
```javascript
class CategoryController {
  // 获取下拉框选项（前端专用）
  async getCategoryOptions(req, res) {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['sort_order', 'ASC']]
    })
    
    const options = categories.map(cat => ({
      value: cat.category_value,
      name: cat.category_name,
      icon: cat.icon
    }))
    
    res.json({ success: true, data: options })
  }
}
```

---

## 📦 数据初始化规范

### 脚本组织方式
```
database/
├── init/
│   ├── 01-create-database.sql    // 数据库和用户创建
│   ├── 02-init-test-data.sql     // 测试数据初始化
│   └── 03-update-schema.sql      // 结构更新(按需)
```

### 初始化数据原则
- **业务完整性**: 初始化足够的测试数据支持功能验证
- **数据关联**: 确保关联数据的一致性和完整性
- **可重复执行**: 使用INSERT IGNORE避免重复插入

---

## 🔄 代码重构规范

### 硬编码识别
❌ **需要重构的硬编码**:
```javascript
// 前端硬编码数组
categories: ['课件', '作业', '实验']

// 后端硬编码逻辑
if (type === '课件') { /* ... */ }
```

✅ **规范的数据库驱动**:
```javascript
// 前端动态加载
async loadCategories() {
  const response = await this.request('/api/v1/categories/options')
  this.categories = response.data
}

// 后端数据库查询
const categories = await Category.findAll({ where: { status: 'active' } })
```

### 重构步骤
1. **识别硬编码**: 找出所有硬编码的数据
2. **设计表结构**: 创建对应的数据库表
3. **创建API接口**: 提供数据访问接口
4. **更新前端代码**: 改为动态加载数据
5. **数据迁移**: 将硬编码数据迁移到数据库

---

## 📈 扩展性设计原则

### 数据扩展
- **表结构预留**: 预留描述、图标、排序等扩展字段
- **状态管理**: 支持数据的启用/禁用而不是删除
- **版本兼容**: 新增字段使用默认值保证向后兼容

### 功能扩展
- **接口统一**: 新增数据类型使用相同的API设计模式
- **组件复用**: 筛选、选择等组件可复用到其他模块
- **配置化**: 通过配置控制功能开关和显示方式

### 维护友好
- **文档同步**: 数据库变更及时更新设计文档
- **命名规范**: 使用清晰的命名便于理解和维护
- **注释完整**: 关键逻辑添加必要的注释说明

---

## 🎯 质量保证

### 开发检查清单
- [ ] 是否存在硬编码的选项数据？
- [ ] 界面交互方式是否统一？
- [ ] API接口设计是否遵循RESTful规范？
- [ ] 数据库表结构是否支持扩展？
- [ ] 错误处理是否完善？
- [ ] 文档是否及时更新？

### 代码审查要点
- **数据驱动**: 检查是否所有配置数据都来自数据库
- **交互一致**: 确保相同功能在不同页面的交互方式一致
- **接口规范**: API设计是否符合项目约定
- **扩展性**: 新增功能是否考虑了未来扩展需求

---

**遵循这些设计规范，可以确保项目具有良好的可维护性、一致性和扩展性。**