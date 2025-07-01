module.exports = {
  // 生产环境配置
  configureWebpack: {
    output: {
      // 为静态资源添加hash值，确保更新时缓存失效
      filename: process.env.NODE_ENV === 'production' ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      chunkFilename: process.env.NODE_ENV === 'production' ? 'js/[name].[contenthash:8].js' : 'js/[name].js'
    }
  },

  // CSS配置
  css: {
    extract: process.env.NODE_ENV === 'production' ? {
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].css'
    } : false
  },

  // 静态资源配置
  chainWebpack: config => {
    // 图片文件名添加hash
    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: process.env.NODE_ENV === 'production' 
              ? 'img/[name].[contenthash:8].[ext]' 
              : 'img/[name].[ext]'
          }
        }
      })
  },

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