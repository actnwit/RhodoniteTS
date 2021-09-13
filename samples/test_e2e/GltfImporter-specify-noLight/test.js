const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-specify-noLight';

test('regression test GltfImporter-specify-noLight', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.03);

});
