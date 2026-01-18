import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/FurnaceTest-weakWhiteFurnaceResult';

test('regression test FurnaceTest-weakWhiteFurnaceResult', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 2, true);
});
