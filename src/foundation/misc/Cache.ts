import {Is} from './Is';

export class Cache<K, V> {
  private __set: Set<K> = new Set();
  private __weakMap: WeakMap<{key: K}, V> = new WeakMap();
  constructor() {}

  /**
   * set key and value
   * @param key a key
   * @param value a value
   * @returns true: succeed to set value, false: not set (already exists)
   */
  public set(key: K, value: V): boolean {
    const isExist = this.__set.has(key);
    if (isExist) {
      return false;
    } else {
      this.__set.add(key);
      const newKeyObject = {key};
      this.__weakMap.set(newKeyObject, value);
      return true;
    }
  }

  /**
   * return the boolean value whether it have the key or not
   * @param key
   * @returns Whether it have the key or not.
   */
  public has(key: K): boolean {
    const isExist = this.__set.has(key);
    if (isExist) {
      return true;
    } else {
      return false;
    }
  }

  public size(): number {
    return this.__set.size;
  }
}
