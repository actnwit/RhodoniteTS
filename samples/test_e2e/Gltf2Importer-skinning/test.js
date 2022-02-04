const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/Gltf2Importer-skinning';

test('regression test Gltf2Importer Skinning', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.005);
});
