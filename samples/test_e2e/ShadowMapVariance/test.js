const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMapVariance';

test('regression test ShadowMapVariance', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.01, false, true);
});
