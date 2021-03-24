module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  outputDir: 'dist', publicPath: process.env.NODE_ENV === 'production' ? '/d3Trial/' : '/',
  productionSourceMap:false,
  configureWebpack: {
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
  devServer: {
    public: '127.0.0.1:8080',
  }
}