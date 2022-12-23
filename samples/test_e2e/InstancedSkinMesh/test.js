const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/InstancedSkinMesh';

test('regression test Instanced Skin Mesh', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.005);
});
