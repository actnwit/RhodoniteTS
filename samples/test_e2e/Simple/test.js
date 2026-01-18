import { testCheckWindowRendered } from '../common/testFunc';

const setURL = 'http://localhost:8082/samples/test_e2e/Simple';

test('regression test Simple', async () => {
  await testCheckWindowRendered(browser, setURL, expect, 0.01);
});
