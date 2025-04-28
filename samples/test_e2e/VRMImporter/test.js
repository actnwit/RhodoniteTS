import { testCheckPtoDocument } from '../common/testFunc';
const SetURL = 'http://localhost:8082/samples/test_e2e/VRMImporter';

test('regression test VRMImporter', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
