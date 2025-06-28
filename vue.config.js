module.exports = {
  // 其他 Uni-App 配置可能在此处
  // ...

  devServer: {
    // 启用轮询模式检测文件变化
    watchOptions: {
      poll: true, // 或者可以设置一个数字，例如 1000（表示每秒检查一次）
    },
    // 如果您在使用 Docker，并且遇到 hot reload 不工作，
    // 可能还需要设置 host 为 '0.0.0.0'
    // host: '0.0.0.0',
    // port: 8080 // 确保端口与 dev.sh 中使用的端口一致
  },
}; 