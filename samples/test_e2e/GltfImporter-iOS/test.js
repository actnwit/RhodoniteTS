const consoleLog = require('../common/testFunc').consoleLog;
const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-iOS';


test('regression test GltfImporter-interpolation', async () => {

  await testCheckPtoDocument(jest,browser,SetURL,expect,0.01,false,true);

});
