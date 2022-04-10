module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '\\.(vert|frag|glsl)$': '<rootDir>/config/test/jest-webpack-shaderity.js',
    '\\VERSION-FILE$': '<rootDir>/config/test/jest-webpack-shaderity.js',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  rootDir: process.cwd(),
  transformIgnorePatterns: [
    "node_modules/(?!(webxr-input-profiles/packages/motion-controllers"
      + "|webxr-input-profiles/packages/motion-controllers"
      + "|webxr-input-profiles/packages/motion-controllers"
      + ")/)",
  ],
};
