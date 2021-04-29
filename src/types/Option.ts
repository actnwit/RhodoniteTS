import { Is } from '../foundation/misc/Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * a interface for handling values whose existence is uncertain.
 */
export interface Option<T> {
  // do the "f" function for
  then<U>(f: (value: T) => Option<U>): Option<U>;
  then(f: (value: T) => None): None;

  getOrDefault(altValue: T): T;
  getOrElse(f: (value: T) => T): T;
  getOrError(): T;
}

/**
 * a class indicating that the included value exists.
 */
export class Some<T> implements Option<T> {
  constructor(private value: T) { }

  /**
   * This method is essentially same to the Some::and_then() in Rust language
   * @param f
   */
  then<U>(f: (value: T) => None): None
  then<U>(f: (value: T) => Some<U>): Some<U>
  then<U>(f: (value: T) => Option<U>): Option<U> {
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
export class None implements Option<never> {
  then(): None {
    return this;
  }

  getOrDefault<T>(value: T): T {
    return value;
  }

  getOrElse(f: (value: never) => never): never {
    return f(undefined as never);
  }

  getOrError(): never {
    throw new ReferenceError(`The value does not exist!`);
  }
}

/**
 * The basic Option (a.k.a Optional) class in Rhodonite library
 */
export class RnOption<T> implements Option<T> {
  constructor(private value: T) { }
  then<U>(f: (value: T) => None): None
  then<U>(f: (value: T) => Some<U>): Some<U>
  then<U>(f: (value: T) => Option<U>): Option<U> {
    return f(this.value)
  }

  getOrDefault(altValue: T): T {
    if (Is.exist(this.value)) {
      return this.value;
    } else {
      return altValue;
    }
  }

  getOrElse(f: (value: T) => T): T {
    return f(this.value);
  }

  getOrError(): T {
    if (Is.exist(this.value)) {
      return this.value;
    } else {
      throw new ReferenceError(`The value does not exist!`);
    }
  }
}

/**
 * The basic Option (a.k.a Optional) class for unknown type
 */
export class RnOptionUnknown extends RnOption<unknown> {}
