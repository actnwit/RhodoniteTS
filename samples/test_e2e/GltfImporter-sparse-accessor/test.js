import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-sparse-accessor';

test('regression test GltfImporter-sparse-accessor', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
