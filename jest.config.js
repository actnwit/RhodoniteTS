module.exports = {
  "preset": "jest-puppeteer",
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
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
  //"globalSetup": require.resolve("./globalSetup.js"),
  "setupTestFrameworkScriptFile": require.resolve("./setup.js"),
  //"globalTeardown": "./globalTeardown.js",
  //"testEnvironment": "./testEnvironment.js",
  "rootDir": process.cwd(),

};
