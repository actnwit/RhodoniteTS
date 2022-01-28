const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL =
  'http://localhost:8082/samples/test_e2e/FurnaceTest-weakWhiteFurnaceResult';

test('regression test FurnaceTest-weakWhiteFurnaceResult', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 2, true);
});
