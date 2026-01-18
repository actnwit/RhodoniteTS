import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/MatCap';

test('regression test MatCap', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03, false, false);
});
