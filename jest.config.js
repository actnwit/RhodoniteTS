module.exports = {
  "transform": {
    "^.+\\.tsx?$": "ts-jest",
    "\\.(vert|frag|glsl)$": "<rootDir>/jest-webpack-shaderity.js"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "rootDir": process.cwd(),
};
