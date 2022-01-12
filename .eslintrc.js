module.exports = {
  extends: [
    './node_modules/gts', // gts (TypeScript Style by Google)
    'plugin:prettier/recommended', // 
  ],
  env: {
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2019,
  },
  rules: {
    eqeqeq: [2, 'smart'],
    'prettier/prettier': 'error',
  },
  plugins: ['prettier'],
};
