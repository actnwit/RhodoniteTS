const testCheckWindowRendered =
  require('../common/testFunc').testCheckWindowRendered;
const SetURL =
  'http://localhost:8082/samples/test_e2e/DataTextureInstancedDrawing2';

test('regression test DataTextureInstancedDrawing2', async () => {
  await testCheckWindowRendered(jest, browser, SetURL, expect, 0.03, true);
});
