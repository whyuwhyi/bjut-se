# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM alpine:latest

# 安装必要的工具（用于健康检查）
RUN apk add --no-cache curl

# 创建目标目录
RUN mkdir -p /app/dist

# 从构建阶段复制构建结果
COPY --from=builder /app/dist /app/dist

# 设置工作目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口（虽然在这个设置中不会直接使用）
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ls /app/dist/index.html || exit 1

# 启动命令（由于是静态文件，这里只是一个占位命令）
CMD ["echo", "Admin frontend built successfully"]