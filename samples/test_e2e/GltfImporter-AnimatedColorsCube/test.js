import { testCheckWindowRendered } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-AnimatedColorsCube';

test('regression test GltfImporter-AnimatedColorsCube', async () => {
  await testCheckWindowRendered(browser, SetURL, expect, 0.03);
});
