import { Is } from '../foundation/misc/Is';
import { RequireOne } from './TypeGenerators';
// Inspired from https://scleapt.com/typescript_option/

/**
 * a interface for handling values whose existence is uncertain.
 */

export interface IResult<T, E> {
  match(thenFn: Function, catchFn: Function): void;
  then<U, F>(f: (value: T) => IResult<U, F>): IResult<U, F>;
  catch(f: (value: E) => E): E;
  getBoolean(): boolean;
}

abstract class Result {
  match(thenFn: Function, catchFn: Function): void {
    if (this instanceof Ok) {
      return thenFn();
    } else {
      return catchFn();
    }
  }
}

/**
 * a class indicating that the result is Ok (Succeeded).
 */
export class Ok<T> extends Result implements IResult<T, never> {
  constructor(private ok: T) { super(); }

  /**
   * This method is essentially same to the Ok::and_then() in Rust language
   * @param f
   */
  then<U, F>(f: (value: T) => IResult<U, F>): IResult<U, F> {
    return f(this.ok);
  }

  catch(f: (value: never) => never): never {
    return undefined as never;
  }

  true(): true {
    return true;
  }

  getBoolean(): true {
    return true;
  }

  get(): T {
    return this.ok;
  }
}

/**
 * a class indicating that the result is Error (Failed).
 */
export class Err<E> extends Result implements IResult<never, E> {
  constructor(private err: E) { super(); }

  then<U, F>(f: (value: U) => IResult<U, F>): IResult<U, F> {
    throw new Error('Error due to calling the "then" method from an Err object!');
  }

  catch(f: (value: E) => E): E {
    return this.err;
  }

  false(): false {
    return false;
  }

  getBoolean(): false {
    return false;
  }

  get(): E {
    return this.err;
  }
}
