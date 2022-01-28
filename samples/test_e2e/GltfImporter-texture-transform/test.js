const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-texture-transform';

test('regression test GltfImporter-texture-transform', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.03);
});
