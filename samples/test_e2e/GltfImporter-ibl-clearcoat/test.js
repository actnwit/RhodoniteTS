import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-ibl-clearcoat';

test('regression test GltfImporter-ibl-clearcoat', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
