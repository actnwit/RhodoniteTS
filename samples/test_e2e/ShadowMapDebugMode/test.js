import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMapDebugMode';

test('regression test ShadowMapDebugMode', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.01);
});
