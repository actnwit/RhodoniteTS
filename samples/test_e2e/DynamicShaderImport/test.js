const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const setURL = 'http://localhost:8082/samples/test_e2e/DynamicShaderImport';

test('regression test DynamicShaderImport', async () => {
  await testCheckWindowRendered(jest, browser, setURL, expect, 0.01);
});
