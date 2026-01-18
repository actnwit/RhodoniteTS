import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-draco-extension';

test('regression test GltfImporter-draco-extension', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.1);
});
