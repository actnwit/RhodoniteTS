import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/GaussianBlur';

test('regression test GaussianBlur', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.003, true);
});
