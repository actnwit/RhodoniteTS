import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/MultiPass';

test('regression test MultiPass', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
