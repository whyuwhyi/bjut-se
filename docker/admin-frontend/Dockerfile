# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 使用nginx来服务静态文件
FROM nginx:alpine

# 安装wget用于健康检查
RUN apk add --no-cache wget

# 复制构建产物
COPY --from=builder /app/dist /var/www/html

# 确保文件权限正确
RUN chmod -R 755 /var/www/html && \
    chown -R nginx:nginx /var/www/html

# 使用默认nginx配置，无需特殊配置

# 暴露端口
EXPOSE 80

# 健康检查 - 使用curl作为备选方案
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || \
      curl -f http://localhost/health || \
      exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]