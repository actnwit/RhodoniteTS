import { Is } from '../foundation/misc/Is';
// Inspired from https://scleapt.com/typescript_option/

/**
 * a interface for handling values whose existence is uncertain.
 */
export interface Result<T, E> {
  get(): Ok<T> | Err<E>;
}

/**
 * a class indicating that the result is Ok (Succeeded).
 */
export class Ok<T> {
  constructor(private value: T) { }

  /**
   * This method is essentially same to the Ok::and_then() in Rust language
   * @param f
   */
  then<U, F>(f: (value: T) => Result<U, F>): Result<U, F> {
    return f(this.value);
  }

  true(): true {
    return true;
  }

  getAsBoolean(): true {
    return true;
  }

  get(): T {
    return this.value;
  }
}

/**
 * a class indicating that the result is Error (Failed).
 */
export class Err<E> {
  constructor(private value: E) { }

  then(f: (value: E) => E): E {
    return this.value;
  }

  false(): false {
    return false;
  }

  getAsBoolean(): false {
    return false;
  }

  get(): E {
    return this.value;
  }
}

