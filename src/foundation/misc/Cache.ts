import {Is} from './Is';

export class Cache<K, V> {
  private __map: Map<K, {key: K}> = new Map();
  private __weakMap: WeakMap<{key: K}, V> = new WeakMap();
  constructor() {}

  /**
   * set key and value
   * @param key a key
   * @param value a value
   * @returns true: succeed to set value, false: not set (already exists)
   */
  public set(key: K, value: V): boolean {
    const isExist = this.__map.has(key);
    if (isExist) {
      return false;
    } else {
      const keyObj = {key};
      this.__map.set(key, keyObj);
      this.__weakMap.set(keyObj, value);
      return true;
    }
  }

  /**
   * return the boolean value whether it have the key or not
   * @param key
   * @returns Whether it have the key or not.
   */
  public has(key: K): boolean {
    const isExist = this.__map.has(key);
    if (isExist) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * return the number of this cache items
   * @returns the number of this cache items
   */
  public size(): number {
    return this.__map.size;
  }

  /**
   *
   * @param key
   * @returns the value
   */
  public get(key: K): V | undefined {
    const keyObj = this.__map.get(key);
    if (Is.not.exist(keyObj)) {
      return undefined;
    }
    const val = this.__weakMap.get(keyObj);
    return val;
  }
}
