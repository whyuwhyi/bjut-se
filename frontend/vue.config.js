module.exports = {
  // 生产环境配置 - 为静态资源添加hash值
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // 为JS文件添加hash
      config.output.filename = 'js/[name].[contenthash:8].js'
      config.output.chunkFilename = 'js/[name].[contenthash:8].js'
    }
  },

  // CSS配置
  css: {
    extract: process.env.NODE_ENV === 'production' ? {
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].css'
    } : false,
    loaderOptions: {
      sass: {
        // 抑制sass弃用警告 - 兼容老版本
        sassOptions: {
          silenceDeprecations: ['legacy-js-api', 'import']
        }
      },
      scss: {
        // 抑制sass弃用警告 - 兼容老版本
        sassOptions: {
          silenceDeprecations: ['legacy-js-api', 'import']
        }
      }
    }
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