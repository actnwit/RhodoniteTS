import { testCheckPtoDocument } from '../common/testFunc';

const SetURL = 'http://localhost:8082/samples/test_e2e/InstancedSkinMesh';

test('regression test Instanced Skin Mesh', async () => {
  await testCheckPtoDocument(browser, SetURL, expect, 0.005);
});
