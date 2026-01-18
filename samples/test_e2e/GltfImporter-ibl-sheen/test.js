import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-ibl-sheen';

test('regression test GltfImporter-ibl-sheen', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
