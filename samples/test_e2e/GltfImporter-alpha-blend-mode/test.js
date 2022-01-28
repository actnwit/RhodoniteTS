const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-alpha-blend-mode';

test('regression test GltfImporter-alpha-blend-mode', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.03);
});
