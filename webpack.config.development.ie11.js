
module.exports = {
  entry: './src/foundation/main.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'ts-loader',
        options: {
          configFile: "tsconfig.ie11.json"
        }
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
    filename: 'rhodonite.ie11.js',
    chunkFilename: "rhodonite-[name].ie11.js"
  },
   optimization: {
     namedChunks: true
  }
};
