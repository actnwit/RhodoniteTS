import { Is } from './Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 */

const errorStr = 'The value does not exist!';
export interface IOption<T> {
  // do the "f" function for
  then<U>(f: (value: T) => IOption<U>): IOption<U>;
  then(f: (value: T) => None): None;

  unwrapOrDefault(altValue: T): T;
  unwrapOrElse(f: (...vals: any) => T): T;
  unwrapOrUndefined(): T | undefined;
  unwrapForce(): T;
  has(): this is Some<T>;
  doesNotHave(): this is None;
}

/**
 * a class indicating that the included value exists.
 */
export class Some<T> implements IOption<T> {
  constructor(private value: T) {}

  /**
   * This method is essentially same to the Some::and_then() in Rust language
   * @param f
   */
  then(f: (value: T) => None): None;
  then<U>(f: (value: T) => Some<U>): Some<U>;
  then<U>(f: (value: T) => IOption<U>): IOption<U> {
    return f(this.value);
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapOrDefault(altValue: T): T {
    return this.value;
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapOrElse(f: (value: T) => T): T {
    return this.value;
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapForce(): T {
    return this.value;
  }

  unwrapOrUndefined(): T {
    return this.value;
  }

  get(): T {
    return this.value;
  }

  has(): this is Some<T> {
    return true;
  }

  doesNotHave(): this is None {
    return false;
  }
}

/**
 * a class indicating no existence.
 */
export class None implements IOption<never> {
  then(): None {
    return this;
  }

  unwrapOrDefault<T>(value: T): T {
    return value;
  }

  unwrapOrElse(f: (...vals: any) => never): never {
    return f(undefined as never);
  }

  unwrapForce(): never {
    throw new ReferenceError(errorStr);
  }

  unwrapOrUndefined(): never {
    return undefined as never;
  }

  has(): this is Some<never> {
    return false;
  }

  doesNotHave(): this is None {
    return true;
  }
}

export function assertHas(value: IOption<any>): asserts value is Some<any> {
  if (!value.has()) {
    throw new ReferenceError(errorStr);
  }
}

export function assertDoesNotHave(value: IOption<any>): asserts value is None {
  if (value.has()) {
    throw new ReferenceError(errorStr);
  }
}
