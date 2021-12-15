import {ManualCache} from './ManualCache';

test('ManualCache.size() works correctly', () => {
  const cache = new ManualCache();
  expect(cache.size()).toBe(0);
  cache.set('data0', 1000);
  expect(cache.size()).toBe(1);
});

test('ManualCache.get() works correctly', () => {
  const cache = new ManualCache();
  expect(cache.size()).toBe(0);
  cache.set('data0', 1000);
  expect(cache.get('data0')).toBe(1000);
});
