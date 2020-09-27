module.exports = {
  entry: './src/index.ts',

  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: [
          'shaderity-loader'
        ]
      },
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'ts-loader'
      },
    ]
  },
  target: 'node',
  resolve: {
    extensions: [
      '.ts',
      '.js'
    ],
    modules: ["node_modules"]
  },
  output: {
    publicPath: "/dist/", // Change the path to load splitted code chunks according to your wish.
  },
  optimization: {
    namedChunks: true
  }
};
