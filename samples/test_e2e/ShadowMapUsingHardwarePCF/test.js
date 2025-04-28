import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/ShadowMapUsingHardwarePCF';

test('regression test ShadowMapUsingHardwarePCF', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.01);
});
