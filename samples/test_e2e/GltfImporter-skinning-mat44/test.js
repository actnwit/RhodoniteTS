const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-skinning-mat44';

test('regression test GltfImporter-skinning-mat44', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.03);
});
