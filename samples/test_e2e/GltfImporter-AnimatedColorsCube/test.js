import { testCheckPtoDocument } from '../common/testFunc';
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-AnimatedColorsCube';

test.skip('regression test GltfImporter-AnimatedColorsCube', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
