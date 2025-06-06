import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-specify-noLight';

test('regression test GltfImporter-specify-noLight', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
