export default {
  publicPath: './',
  alias: {
    '@': './src/',
    '@alife/cn-ui': '@cainiaofe/cn-ui',
  },
  modeConfig: {
    prod: {
      externals: {
        react: 'React',
        echarts: 'echarts',
        '@alife/cn-ui': 'CNUI',
        'react-dom': 'ReactDOM',
      },
    },
  },
  webpackPlugins: {
    'windicss-webpack-plugin': {},
  },
  vite: false,
  eslint: false,
  store: true,
  auth: false,
  request: false,
  polyfill: false,
  devServer: {
    historyApiFallback: true,
    allowedHosts: ['.sto.cn', '.cainiao.com'],
  },
  plugins: [
    [
      'build-plugin-sto-public-path',
      {
        enableRuntimePath: true,
        projectPath: '/ipark/pc-template/',
      },
    ],
  ],
};
