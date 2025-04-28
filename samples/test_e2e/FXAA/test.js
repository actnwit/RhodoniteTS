import { testCheckWindowRendered } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/FXAA';

test('regression test FXAA', async () => {
  await testCheckWindowRendered(browser, SetURL, expect, 0.05);
});
