const testCheckPtoDocument = require('../../test_e2e/common/testFunc').testCheckPtoDocument;
const SetURL = 'http://localhost:8082/samples/test_e2e/GltfImporter-iOS';

test.skip('regression test GltfImporter-interpolation', async () => {
  await testCheckPtoDocument(jest, browser, SetURL, expect, 0.01, false, true);
});
