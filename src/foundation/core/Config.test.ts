import { Config } from './Config';

test('Config.maxLightNumber accepts 0 (no shadow slots) and treats negative values as 0', () => {
  expect(new Config({ maxLightNumber: 0 }).maxLightNumber).toBe(0);

  const config = new Config();
  config.maxLightNumber = -2;
  expect(config.maxLightNumber).toBe(0);
});

test('Config.maxLightNumberOrOne keeps shader array lengths valid', () => {
  expect(new Config({ maxLightNumber: 0 }).maxLightNumberOrOne).toBe(1);
  expect(new Config({ maxLightNumber: 3 }).maxLightNumberOrOne).toBe(3);
  expect(new Config().maxLightNumberOrOne).toBe(6);
});

test('Config.isGpuCullingEnabled defaults to true and can be disabled', () => {
  expect(new Config().isGpuCullingEnabled).toBe(true);
  expect(new Config({ isGpuCullingEnabled: false }).isGpuCullingEnabled).toBe(false);
});
