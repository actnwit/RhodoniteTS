const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-animation-in-second-bin-file';

test('regression test GltfImporter-animation-in-second-bin-file', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.03,false,false);

});
