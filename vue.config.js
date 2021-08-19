module.exports = {
  'transpileDependencies': [
    'vuetify'
  ],
  outputDir: 'dist', publicPath: process.env.NODE_ENV === 'production' ? '/d3Trial/' : '/',
  productionSourceMap: false,
  // chainWebpack: config => {
  //   config.module
  //     .rule('worker')
  //     .test(/\.worker\.js$/)
  //     .use('worker')
  //     .loader('worker-loader')
  //     .options({
  //       inline: 'fallback' // 开启内联模式，将chunk的内容转换为Blob对象内嵌到代码中。
  //     })
  //   config.output.globalObject(
  //     'this'
  //   )
  // },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.worker\.js$/,
          use: {
            loader: "worker-loader",
            options:{
              filename:'workerName.[hash].js',
              inline:'fallback'
            }
          },
          // use: {
          //   loader: "worker-loader" ,
          //   options: { inline: true, name: 'workerName.[hash].js' }
          // },

        },
      ],
    },

    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vue: {
            name: 'vue',
            test: /[\\/]node_modules[\\/]vue[\\/]/,
            priority: -10
          },
          d3: {
            name: 'd3',
            test: /[\\/]node_modules[\\/]d3[\\/]/,
            priority: -10
          },
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -20
          }
        }
      }
    }
  },
  parallel: false,
  devServer: {
    public: '127.0.0.1:8080',
  }
}