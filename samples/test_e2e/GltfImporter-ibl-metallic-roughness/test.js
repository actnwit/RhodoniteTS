const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-ibl-metallic-roughness';

test('regression test GltfImporter-ibl-metallic-roughness', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.001);
});
