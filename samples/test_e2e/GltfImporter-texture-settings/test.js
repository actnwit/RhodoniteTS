import { testCheckPtoDocument } from '../common/testFunc';
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-texture-settings';

test('regression test GltfImporter-texture-settings', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.01);
});
