import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-ibl-metallic-roughness';

test('regression test GltfImporter-ibl-metallic-roughness', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.001);
});
