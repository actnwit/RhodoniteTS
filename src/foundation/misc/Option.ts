import { Is } from './Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 */

const errorStr = 'The value does not exist!';
interface IOption<T> {
  // do the "f" function for
  then(f: (value: T) => IOption<T>): IOption<T>;
  then(f: (value: T) => void): IOption<T>;
  then<U>(f: (value: T) => IOption<U>): IOption<U>;

  else(f: () => IOption<T>): IOption<T>;
  else(f: () => void): IOption<T>;
  else<U>(f: () => IOption<U>): IOption<U>;

  match(obj: { Some: (value: T) => void; None: () => void }): T;
  match<U>(obj: { Some: (value: T) => U; None: () => U }): U;

  unwrapOrDefault(altValue: T): T;
  unwrapOrElse(f: () => T): T;
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
  then(f: (value: T) => Option<T>): Option<T>;
  then(f: (value: T) => void): Option<T>;
  then<U>(f: (value: T) => Option<U>): Option<U>;
  then<U>(f: (value: T) => void | Option<T> | Option<U>): Option<T> | Option<U> {
    return f(this.value) ?? this;
  }

  else(f: () => Option<T>): Option<T>;
  else(f: () => void): Option<T>;
  else<U>(f: () => Option<U>): Option<U>;
  else<U>(f: () => void | Option<T> | Option<U>): Option<T> | Option<U> {
    return this;
  }

  match<U>(obj: { Some: (value: T) => U; None: () => U }): U;
  match(obj: { Some: (value: T) => void; None: () => void }): T;
  match<U>(obj: {
    Some: ((value: T) => U) | ((value: T) => void);
    None: (() => U) | (() => void);
  }): U | T | void {
    return obj.Some(this.value);
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
  unwrapOrElse(f: () => T): T {
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
  then(f: (value: never) => Option<never>): Option<never>;
  then(f: (value: never) => void): Option<never>;
  then<U>(f: (value: never) => Option<U>): Option<U>;
  then<U>(f: (value: never) => void | Option<never> | Option<U>): Option<never> | Option<U> {
    return this;
  }

  else(f: () => Option<never>): Option<never>;
  else(f: () => void): Option<never>;
  else<U>(f: () => Option<U>): Option<U>;
  else<U>(f: () => void | Option<never> | Option<U>): Option<never> | Option<U> {
    return f() ?? this;
  }

  match<U>(obj: { Some: (value: never) => U; None: () => U }): U;
  match(obj: { Some: (value: never) => void; None: () => void }): never;
  match<U>(obj: {
    Some: ((value: never) => U) | ((value: never) => void);
    None: (() => U) | (() => void);
  }): U | void {
    return obj.None();
  }

  unwrapOrDefault<T>(value: T): T {
    return value;
  }

  unwrapOrElse<T>(f: () => T): T {
    return f();
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

export type Option<T> = Some<T> | None;

export function assertHas(value: Option<any>): asserts value is Some<any> {
  if (!value.has()) {
    throw new ReferenceError(errorStr);
  }
}

export function assertDoesNotHave(value: Option<any>): asserts value is None {
  if (value.has()) {
    throw new ReferenceError(errorStr);
  }
}
