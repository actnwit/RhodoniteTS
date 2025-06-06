import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/FurnaceTest-whiteFurnace';

test('regression test FurnaceTest-whiteFurnace', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 2, true);
});
