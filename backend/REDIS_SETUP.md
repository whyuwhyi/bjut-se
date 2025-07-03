# Redis缓存系统安装和配置指南

## 概述

本项目已从内存缓存升级为Redis分布式缓存系统，提供更好的性能和扩展性。

## 安装依赖

在后端项目中安装Redis客户端：

```bash
cd backend
npm install ioredis
```

## Docker配置

Redis服务已在 `docker-compose.yml` 中配置：

```yaml
redis:
  image: redis:7-alpine
  container_name: wechat-education-redis
  restart: unless-stopped
  ports:
    - "${REDIS_PORT:-6379}:6379"
  volumes:
    - redis_data:/data
  networks:
    - app-network
  command: redis-server --appendonly yes
```

## 环境变量

后端服务的Redis连接配置：

```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=     # 可选，如果Redis设置了密码
REDIS_DB=0          # 数据库编号，默认为0
```

## 缓存策略

### 缓存类型和TTL
- **搜索结果缓存**: 15分钟
- **搜索建议缓存**: 5分钟  
- **筛选选项缓存**: 30分钟
- **热门关键词缓存**: 1小时

### 缓存键前缀
- `search:result:` - 搜索结果
- `search:suggestion:` - 搜索建议
- `search:filter:` - 筛选选项
- `search:hot:` - 热门关键词
- `stats:` - 统计信息

## 功能特性

### 1. 自动缓存失效
当数据发生变化时，相关缓存会自动失效：
- 资源增删改 → 清除资源相关缓存
- 帖子增删改 → 清除帖子相关缓存
- 分类/标签变化 → 清除筛选选项缓存

### 2. 降级支持
如果Redis连接失败，系统会自动降级到内存缓存模式，确保服务不中断。

### 3. 管理员接口
提供了完整的缓存管理API：
- `GET /api/v1/cache/stats` - 获取缓存统计
- `DELETE /api/v1/cache/clear/:type` - 清除指定类型缓存
- `POST /api/v1/cache/warmup` - 预热缓存
- `POST /api/v1/cache/invalidate` - 手动失效缓存

### 4. 管理后台界面
在 `admin-frontend/src/views/CacheManagement.vue` 中提供了可视化的缓存管理界面。

## 启动服务

```bash
# 启动完整的Docker环境（包括Redis）
./scripts/dev.sh start

# 或者单独启动Redis
docker-compose up redis -d
```

## 监控和调试

### 查看Redis状态
```bash
# 连接到Redis容器
docker exec -it wechat-education-redis redis-cli

# 查看所有键
KEYS *

# 查看缓存统计
INFO memory

# 查看搜索相关的键
KEYS search:*
```

### 缓存性能优化建议

1. **合理设置TTL**: 根据数据更新频率调整缓存过期时间
2. **监控内存使用**: 定期检查Redis内存使用情况
3. **批量操作**: 使用Redis管道进行批量缓存操作
4. **键命名规范**: 使用一致的键命名前缀便于管理

## 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Docker容器是否正常运行
   - 确认环境变量配置正确
   - 查看网络连接是否正常

2. **缓存未生效**
   - 检查TTL设置是否合理
   - 确认缓存键生成逻辑
   - 查看Redis日志

3. **内存占用过高**
   - 调整缓存过期时间
   - 清理无用的缓存键
   - 考虑使用Redis的内存优化配置

## 生产环境注意事项

1. **Redis持久化**: 已启用AOF持久化保证数据安全
2. **内存限制**: 建议设置Redis最大内存限制
3. **监控告警**: 建立Redis性能监控和告警机制
4. **备份策略**: 定期备份Redis数据