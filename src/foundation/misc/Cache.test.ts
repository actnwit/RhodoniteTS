import {Cache} from './Cache';

test('Cache.size() works correctly', () => {
  const cache = new Cache();
  expect(cache.size()).toBe(0);
  cache.set('data0', 1000);
  expect(cache.size()).toBe(1);
});

test('Cache.get() works correctly', () => {
  const cache = new Cache();
  expect(cache.size()).toBe(0);
  cache.set('data0', 1000);
  expect(cache.get('data0')).toBe(1000);
});
