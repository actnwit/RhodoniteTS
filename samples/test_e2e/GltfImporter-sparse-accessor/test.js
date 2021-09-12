const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-sparse-accessor';

test('regression test GltfImporter-sparse-accessor', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.03);

});
