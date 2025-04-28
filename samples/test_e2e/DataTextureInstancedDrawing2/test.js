import { testCheckWindowRendered } from '../common/testFunc';
const SetURL =
  'http://localhost:8082/samples/test_e2e/DataTextureInstancedDrawing2';

test('regression test DataTextureInstancedDrawing2', async () => {
  await testCheckWindowRendered(browser, SetURL, expect, 0.03, true);
});
