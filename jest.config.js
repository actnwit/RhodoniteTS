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
  "globalSetup": "./globalSetup.js",
  "setupTestFrameworkScriptFile": "./setup.js",
  "globalTeardown": "./globalTeardown.js",
  "testEnvironment": "./testEnvironment.js"
};
