import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-alpha-blend-mode';

test('regression test GltfImporter-alpha-blend-mode', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
