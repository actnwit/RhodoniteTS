import { SymbolWeakMap } from './SymbolWeakMap';

export class Cache<T> {
  private __symbolWeakMap = new SymbolWeakMap();
  public register(value: T) {
    this.__symbolWeakMap.set(Symbol(), value);
  }

  // public read(): T {}
}
