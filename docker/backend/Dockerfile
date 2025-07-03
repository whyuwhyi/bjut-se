# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 安装系统依赖（包括Docker客户端）
RUN apk add --no-cache \
    dumb-init \
    docker-cli \
    && rm -rf /var/cache/apk/*

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --only=production && \
    npm cache clean --force

# 创建非root用户并添加到docker组
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 && \
    addgroup docker && \
    adduser nodeuser docker

# 创建必要的目录
RUN mkdir -p uploads logs && \
    chown -R nodeuser:nodejs /app

# 复制源代码
COPY --chown=nodeuser:nodejs . .

# 注意：容器管理需要root权限访问Docker socket
# 在生产环境中通过docker-compose的user配置来控制权限
# USER nodeuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.get({hostname: '127.0.0.1', port: 3000, path: '/api/v1/health'}, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.setTimeout(5000, () => process.exit(1));"

# 启动应用
CMD ["dumb-init", "node", "src/app.js"]