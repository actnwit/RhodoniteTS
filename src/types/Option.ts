import { Is } from '../foundation/misc/Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 */

const errorStr = `The value does not exist!`;
export interface IOption<T> {
  // do the "f" function for
  then<U>(f: (value: T) => IOption<U>): IOption<U>;
  then(f: (value: T) => None): None;

  getOrDefault(altValue: T): T;
  getOrElse(f: (...vals: any) => T): T;
  getOrError(): T;
}

export class Option<T> implements IOption<T> {
  private value?: T;

  set(val: T) {
    this.value = val;
  }

  /**
   * This method is essentially same to the Some::and_then() in Rust language
   * @param f
   */
  then<U>(f: (value: T) => None): None
  then<U>(f: (value: T) => Some<U>): Some<U>
  then<U>(f: (value: T) => IOption<U>): IOption<U>
  {
    return Is.exist(this.value) ? f(this.value) : new None();
  }

  /**
   * @param altValue
   * @returns
   */
  getOrDefault(altValue: T): T {
    return Is.exist(this.value) ? this.value : altValue;
  }

  /**
   * @param altValue
   * @returns
   */
  getOrElse(f: (...vals: any) => T): T {
    return Is.exist(this.value) ? this.value : f();
  }

  /**
   * @returns
   */
  getOrError(): T {
    if (Is.exist(this.value)) {
      return this.value;
    } else {
      throw new ReferenceError(errorStr);
    }
  }
}

/**
 * a class indicating that the included value exists.
 */
export class Some<T> implements IOption<T> {
  constructor(private value: T) { }

  /**
   * This method is essentially same to the Some::and_then() in Rust language
   * @param f
   */
  then<U>(f: (value: T) => None): None
  then<U>(f: (value: T) => Some<U>): Some<U>
  then<U>(f: (value: T) => IOption<U>): IOption<U> {
    return f(this.value);
  }

  /**
   * @deprecated use the 'get' method instead
   * @param altValue
   * @returns
   */
  getOrDefault(altValue: T): T {
    return this.value;
  }

  /**
   * @deprecated use the 'get' method instead
   * @param altValue
   * @returns
   */
  getOrElse(f: (value: T) => T): T {
    return this.value;
  }

  /**
   * @deprecated use the 'get' method instead
   * @param altValue
   * @returns
   */
  getOrError(): T {
    return this.value;
  }

  get(): T {
    return this.value;
  }

}

/**
 * a class indicating no existence.
 */
export class None implements IOption<never> {
  then(): None {
    return this;
  }

  getOrDefault<T>(value: T): T {
    return value;
  }

  getOrElse(f: (...vals: any) => never): never {
    return f(undefined as never);
  }

  getOrError(): never {
    throw new ReferenceError(errorStr);
  }
}
