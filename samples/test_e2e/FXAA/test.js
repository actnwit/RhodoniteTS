const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const SetURL = 'http://localhost:8082/samples/test_e2e/FXAA';

test('regression test FXAA', async () => {
  await testCheckWindowRendered(jest, browser, SetURL, expect, 0.05);
});
