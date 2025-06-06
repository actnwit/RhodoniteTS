/**
 * This is from : https://github.com/threepointone/glamor/blob/667b480d31b3721a905021b26e1290ce92ca2879/docs/weakmaps.md#so-what-does-a-cache-built-with-a-weakmap-look-like
 * Thank you!
 */

import { primitives } from '../../../types/CommonTypes';

type ObjectFnType = (arg: object) => unknown;

/**
 * Return the caching wrapper function
 * @param fn the target function for caching result
 * @returns
 */
export const objectCachify = (fn: ObjectFnType): ObjectFnType => {
  const cache = new WeakMap();
  return (arg: object): unknown => {
    if (cache.has(arg)) {
      return cache.get(arg);
    }

    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
};

/**
 * Return the caching wrapper function
 * @param fn the target function for caching result
 * @returns
 */
export const primitiveCachify1 = <P extends primitives>(fn: (arg: P) => unknown): ((arg: P) => unknown) => {
  const cache = new Map();
  return (arg: P): unknown => {
    if (cache.has(arg)) {
      return cache.get(arg);
    }

    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
};
