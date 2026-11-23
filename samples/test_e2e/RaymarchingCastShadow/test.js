import { testCheckWindowRendered } from '../common/testFunc';

const baseUrl = 'http://localhost:8082/samples/test_e2e/RaymarchingCastShadow';

for (const lightType of ['directional', 'spot', 'point']) {
  test(`regression test RaymarchingCastShadow ${lightType} webgl2`, async () => {
    await testCheckWindowRendered(browser, `${baseUrl}?mode=webgl2&light=${lightType}`, expect, 0.01);
  });
}

test('regression test RaymarchingCastShadow point webgpu', async () => {
  await testCheckWindowRendered(browser, `${baseUrl}?mode=webgpu&light=point`, expect, 0.01);
});
