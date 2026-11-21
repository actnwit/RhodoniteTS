import { testCheckWindowRendered } from '../common/testFunc';

const baseUrl = 'http://localhost:8082/samples/test_e2e/ImportedLightShadow';

for (const lightType of ['spot', 'directional']) {
  test(`regression test ImportedLightShadow ${lightType} webgl2`, async () => {
    await testCheckWindowRendered(browser, `${baseUrl}?mode=webgl2&light=${lightType}`, expect, 0.01);
  });
}

for (const lightType of ['spot', 'directional']) {
  test(`regression test ImportedLightShadow ${lightType} webgpu`, async () => {
    await testCheckWindowRendered(browser, `${baseUrl}?mode=webgpu&light=${lightType}`, expect, 0.01);
  });
}
