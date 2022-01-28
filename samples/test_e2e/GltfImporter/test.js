const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter';

test('regression test GltfImporter', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.03);
});
