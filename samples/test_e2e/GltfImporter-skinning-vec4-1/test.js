import { testCheckPtoDocument } from '../common/testFunc';
const SetURL =
  'http://localhost:8082/samples/test_e2e/GltfImporter-skinning-vec4-1';

test('regression test GltfImporter-skinning-vec4-1', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
