import { Is } from '../foundation/misc/Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * a interface for handling values whose existence is uncertain.
 */
export interface Option<T> {
  // do the "f" function for
  flatMap<U>(f: (value: T) => Option<U>): Option<U>;
  flatMap(f: (value: T) => None): None;

  getOrElse(altValue: T): T;
  unWrap(): T;
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
  flatMap<U>(f: (value: T) => None): None
  flatMap<U>(f: (value: T) => Some<U>): Some<U>
  flatMap<U>(f: (value: T) => Option<U>): Option<U> {
    return f(this.value)
  }

  getOrElse(): T {
    return this.value;
  }

  unWrap(): T {
    return this.value;
  }
}

/**
 * a class indicating no existence.
 */
export class None implements Option<never> {
  flatMap(): None {
    return this;
  }

  getOrElse<U>(value: U): U {
    return value;
  }
  unWrap(): never {
    throw 'No value due to None!'
  }
}

/**
 * The basic Option (a.k.a Optional) class in Rhodonite library
 */
export class RnOption<T> implements Option<T> {
  constructor(private value: T) { }
  flatMap<U>(f: (value: T) => None): None
  flatMap<U>(f: (value: T) => Some<U>): Some<U>
  flatMap<U>(f: (value: T) => Option<U>): Option<U> {
    return f(this.value)
  }

  getOrElse(altValue: T): T {
    if (Is.exist(this.value)) {
      return this.value;
    } else {
      return altValue;
    }
  }

  unWrap(): T {
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
