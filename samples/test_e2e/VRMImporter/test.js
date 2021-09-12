const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/VRMImporter';

test('regression test VRMImporter', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.03);

});
