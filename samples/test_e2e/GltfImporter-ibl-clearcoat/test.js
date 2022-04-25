const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-ibl-clearcoat';

test('regression test GltfImporter-ibl-clearcoat', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.03);
});
