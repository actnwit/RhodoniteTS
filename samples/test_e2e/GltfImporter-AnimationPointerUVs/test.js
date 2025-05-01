import { testCheckPtoDocument } from '../common/testFunc';
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-AnimationPointerUVs';

test.skip('regression test GltfImporter-AnimationPointerUVs', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
