import { testCheckWindowRendered } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-morphing';

test('regression test GltfImporter-morphing', async () => {
  await testCheckWindowRendered(browser, SetURL, expect, 0.01);
});
