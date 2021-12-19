import {Is} from './Is';

export class SymbolWeakMap<V> {
  private __weakMap: WeakMap<Symbol, V> = new WeakMap();
  constructor() {}

  /**
   * set key and value
   * @param symbol the key for access
   * @param value the value as a cache item
   * @returns true: succeed to set value, false: not set (already exists)
   */
  public set(symbol: Symbol, value: V): boolean {
    const isExist = this.__weakMap.has(symbol);
    if (isExist) {
      return false;
    } else {
      this.__weakMap.set(symbol, value);
      return true;
    }
  }

  /**
   * return the boolean value whether it have the key or not
   * @param symbol the key for access
   * @returns Whether it have the key or not.
   */
  public has(symbol: Symbol): boolean {
    const isExist = this.__weakMap.has(symbol);
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
  // public size(): number {
  //   return this.__weakMap.size;
  // }

  /**
   * return the value in the cache by the key
   * @param symbol the key for access
   * @returns the value in the cache by the key
   */
  public get(symbol: Symbol): V | undefined {
    const keyObj = this.__weakMap.get(symbol);
    if (Is.not.exist(keyObj)) {
      return undefined;
    }
    const val = this.__weakMap.get(symbol);
    return val;
  }

  /**
   * delete the value
   * @param symbol the key for access
   * @returns the flag of the deletion was succeed or not
   */
  public delete(symbol: Symbol): boolean {
    const isExist = this.__weakMap.has(symbol);
    if (!isExist) {
      return false;
    }
    this.__weakMap.delete(symbol);
    return true;
  }
}
