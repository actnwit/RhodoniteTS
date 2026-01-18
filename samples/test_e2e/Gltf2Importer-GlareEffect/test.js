import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/Gltf2Importer-GlareEffect';

test('regression test Gltf2Importer-GlareEffect', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.03);
});
