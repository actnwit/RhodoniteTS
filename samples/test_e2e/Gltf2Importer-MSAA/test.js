import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/Gltf2Importer-MSAA';

test('regression test Gltf2Importer-MSAA', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
