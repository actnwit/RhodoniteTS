import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/DepthEncode';

test.skip('regression test DepthEncode', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.003);
});
