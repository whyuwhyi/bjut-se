module.exports = {
  // 其他 Uni-App 配置可能在此处
  // ...

  devServer: {
    // 启用轮询模式检测文件变化
    watchOptions: {
      poll: true, // 或者可以设置一个数字，例如 1000（表示每秒检查一次）
    },
    // Docker 环境配置
    host: process.env.DEV_HOST || '0.0.0.0',
    port: process.env.DEV_PORT || 8080
  },
}; 