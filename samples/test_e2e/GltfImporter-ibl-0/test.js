const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-ibl-0';

test('regression test GltfImporter-ibl-0', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.03);

});
