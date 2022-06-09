import {Is} from './Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 */

const errorStr = 'The value does not exist!';
export interface IWeakOption<B extends object, T> {
  unwrapOrDefault(base: B, altValue: T): T;
  unwrapOrElse(base: B, f: (...vals: any) => T): T;
  unwrapForce(base: B): T;
  unwrapOrUndefined(base: B): T | undefined;
}

export class WeakOption<B extends object, T> implements IWeakOption<B, T> {
  private __weakMap: WeakMap<B, T> = new WeakMap();

  set(base: B, val: T) {
    this.__weakMap.set(base, val);
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapOrDefault(base: B, altValue: T): T {
    const value = this.__weakMap.get(base);
    return Is.exist(value) ? value : altValue;
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapOrElse(base: B, f: (...vals: any) => T): T {
    const value = this.__weakMap.get(base);
    return Is.exist(value) ? value : f();
  }

  /**
   * @returns
   */
  unwrapForce(base: B): T {
    const value = this.__weakMap.get(base);
    if (Is.exist(value)) {
      return value;
    } else {
      throw new ReferenceError(errorStr);
    }
  }

  unwrapOrUndefined(base: B): T | undefined {
    return this.__weakMap.get(base);
  }
}

/**
 * a class indicating that the included value exists.
 */
export class WeakSome<B extends object, T> implements IWeakOption<B, T> {
  private __weakMap: WeakMap<B, T> = new WeakMap();
  constructor(base: B, value: T) {
    this.__weakMap.set(base, value);
  }

  /**
   * @deprecated use the 'get' method instead
   * @param altValue
   * @returns
   */
  unwrapOrDefault(base: B, altValue: T): T {
    return this.__weakMap.get(base)!;
  }

  /**
   * @deprecated use the 'get' method instead
   * @param altValue
   * @returns
   */
  unwrapOrElse(base: B, f: (value: T) => T): T {
    return this.__weakMap.get(base)!;
  }

  /**
   * @deprecated use the 'get' method instead
   * @param altValue
   * @returns
   */
  unwrapForce(base: B): T {
    return this.__weakMap.get(base)!;
  }

  get(base: B): T {
    return this.__weakMap.get(base)!;
  }

  unwrapOrUndefined(base: B): T | undefined {
    return this.__weakMap.get(base);
  }
}

/**
 * a class indicating no existence.
 */
export class WeakNone<B extends object> implements IWeakOption<B, never> {
  then(): WeakNone<B> {
    return this;
  }

  unwrapOrDefault<T>(base: B, value: T): T {
    return value;
  }

  unwrapOrElse(base: B, f: (...vals: any) => never): never {
    return f(undefined as never);
  }

  unwrapForce(base: B): never {
    throw new ReferenceError(errorStr);
  }

  unwrapOrUndefined(base: B): undefined {
    return undefined;
  }
}
