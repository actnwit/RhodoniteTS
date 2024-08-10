const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const setURL = 'http://localhost:8082/samples/test_e2e/Texture';

test('regression test Texture', async () => {
  await testCheckWindowRendered(jest, browser, setURL, expect, 0.01);
});
