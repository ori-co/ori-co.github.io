const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const SRC = path.resolve(__dirname, '../src')
const OUT = path.resolve(__dirname, '../../ardemo')

// Locate the ECS runtime bundled with @8thwall/ecs
const ecsPkgDir = path.dirname(require.resolve('@8thwall/ecs/package.json'))
const runtimePath = path.join(ecsPkgDir, 'dist/runtime.js')

module.exports = (env, argv) => {
  const isDev = argv?.mode === 'development'

  return {
    mode: isDev ? 'development' : 'production',
    context: SRC,
    entry: './app.ts',

    output: {
      path: OUT,
      filename: 'bundle.js',
      publicPath: '/ardemo/',
      clean: false,
    },

    externals: {
      // ecs runtime is loaded via <script src="external/runtime/runtime.js"> → window.ecs
      ecs: 'ecs',
    },

    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          // GLB/GLTF files → emit as asset, export URL string
          test: /\.(glb|gltf|bin)$/,
          type: 'asset/resource',
          generator: { filename: 'assets/models/[name][ext]' },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: false,
        filename: 'index.html',
      }),

      new CopyPlugin({
        patterns: [
          // 8thWall ECS runtime → loaded as script before bundle.js
          { from: runtimePath, to: 'external/runtime/runtime.js' },
          // Image targets from Studio (populated after generating in 8thWall Studio)
          {
            from: path.resolve(__dirname, '../image-targets'),
            to: 'image-targets',
            noErrorOnMissing: true,
          },
          // GLB models
          {
            from: path.resolve(__dirname, '../assets/models'),
            to: 'assets/models',
            noErrorOnMissing: true,
          },
        ],
      }),
    ],

    devServer: {
      port: 7654,
      hot: isDev,
      static: { directory: OUT },
      headers: { 'Access-Control-Allow-Origin': '*' },
      allowedHosts: 'all',
      // HTTPS required for camera — use ngrok or a tunnel in dev
    },

    performance: { hints: false },
    devtool: isDev ? 'source-map' : false,
  }
}
