const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMapUsingColorBuffer';

test('regression test ShadowMapUsingColorBuffer', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.01);
});
