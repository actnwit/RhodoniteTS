import { testCheckWindowRendered } from '../common/testFunc';

const baseUrl = 'http://localhost:8082/samples/test_e2e/RaymarchingTextureRoundTrip';

test('regression test RaymarchingTextureRoundTrip webgl2', async () => {
  await testCheckWindowRendered(browser, `${baseUrl}?mode=webgl2`, expect, 0.01);
});

test('regression test RaymarchingTextureRoundTrip webgpu', async () => {
  await testCheckWindowRendered(browser, `${baseUrl}?mode=webgpu`, expect, 0.01);
});
