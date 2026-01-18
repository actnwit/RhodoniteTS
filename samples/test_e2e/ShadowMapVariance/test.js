import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMapVariance';

test('regression test ShadowMapVariance', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.01, false, false);
});
