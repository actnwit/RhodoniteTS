import {Cache} from './Cache';

test('Cache.size()', () => {
  const cache = new Cache();
  expect(cache.size()).toBe(0);
  cache.set('data0', 1000);
  expect(cache.size()).toBe(1);
});
