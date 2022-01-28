const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GaussianBlur';

test('regression test GaussianBlur', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.003, true);
});
