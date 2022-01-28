const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const setURL = 'http://localhost:8082/samples/test_e2e/Simple';

test('regression test Simple', async () => {
  await testCheckWindowRendered(jest, browser, setURL, expect, 0.01);
});
