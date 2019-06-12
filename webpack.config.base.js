module.exports = {
  entry: './src/foundation/main.ts',

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts'
    ]
  },
  output: {
    publicPath: "/dist/", // Change the path to load splitted code chunks according to your wish.
  },
  optimization: {
    namedChunks: true
  }
};
