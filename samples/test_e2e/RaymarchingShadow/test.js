import { testCheckWindowRendered } from '../common/testFunc';

const baseUrl = 'http://localhost:8082/samples/test_e2e/RaymarchingShadow';

for (const lightType of ['point', 'spot', 'directional']) {
  test(`regression test RaymarchingShadow ${lightType} webgl2`, async () => {
    await testCheckWindowRendered(browser, `${baseUrl}?mode=webgl2&light=${lightType}`, expect, 0.01);
  });
}

test('regression test RaymarchingShadow point webgpu', async () => {
  await testCheckWindowRendered(browser, `${baseUrl}?mode=webgpu&light=point`, expect, 0.01);
});
