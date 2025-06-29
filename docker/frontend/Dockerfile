# 前端H5构建 Dockerfile

FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（跳过puppeteer下载）
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production=false --prefer-offline --no-audit --ignore-scripts

# 复制源代码
COPY . .

# 构建H5应用
RUN npm run build:h5

# 使用nginx作为最终镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist/build/h5 /var/www/html

# 复制nginx配置
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
