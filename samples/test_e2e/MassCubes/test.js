import { testCheckWindowRendered } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/MassCubes';

test('regression test MassCubes', async () => {
  await testCheckWindowRendered(browser, SetURL, expect, 0.03, true);
});
