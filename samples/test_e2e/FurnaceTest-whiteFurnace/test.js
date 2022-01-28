const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/FurnaceTest-whiteFurnace';

test('regression test FurnaceTest-whiteFurnace', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 2, true);
});
