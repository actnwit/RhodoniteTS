import { testCheckWindowRendered } from '../common/testFunc';
const setURL = 'http://localhost:8082/samples/test_e2e/Raymarching';

test('regression test Raymarching', async () => {
  await testCheckWindowRendered(browser, setURL, expect, 0.01);
});
