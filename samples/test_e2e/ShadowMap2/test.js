const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMap2';

test('regression test ShadowMap 2', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.01);
});
