const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/DepthEncode';

test.skip('regression test DepthEncode', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.003);

});
