# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 安装系统依赖
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# 创建必要的目录
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs /app

# 复制源代码
COPY --chown=nodeuser:nodejs . .

# 切换到非root用户
USER nodeuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["dumb-init", "node", "src/app.js"]