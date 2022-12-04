const testCheckPtoDocument = require('../common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMapUsingHardwarePCF';

test('regression test ShadowMapUsingHardwarePCF', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.01);
});
