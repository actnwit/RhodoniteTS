/**
 * An interface to handle the results in a unified manner,
 * regardless of whether they are successful or not.
 */
export interface IResult<T, E> {
  match<U, F>(thenFn: (value: T) => IResult<U, F>, catchFn: (value: E) => E): void;
  then<U, F>(f: (value: T) => IResult<U, F>): IResult<U, F>;
  catch(f: (value: E) => E): E;
  getBoolean(): boolean;
}

abstract class Result<T, E> {
  constructor(protected val: T | E) { }
  match<U, F>(thenFn: (value: T) => IResult<U, F>, catchFn: (value: E) => E): IResult<U, F> | E {
    if (this instanceof Ok) {
      return thenFn(this.val);
    } else {
      return catchFn(this.val as E);
    }
  }
}

/**
 * a class indicating that the result is Ok (Succeeded).
 */
export class Ok<T> extends Result<T, never> implements IResult<T, never> {
  /**
   * This method is essentially same to the Ok::and_then() in Rust language
   * @param f
   */
  then<U, F>(f: (value: T) => IResult<U, F>): IResult<U, F> {
    return f(this.val);
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
    return this.val;
  }
}

/**
 * a class indicating that the result is Error (Failed).
 */
export class Err<E> extends Result<never, E> implements IResult<never, E> {

  then<U, F>(f: (value: never) => IResult<U, F>): IResult<U, F> {
    throw new Error('Error due to calling the "then" method from an Err object!');
  }

  catch(f: (value: E) => E): E {
    return this.val;
  }

  false(): false {
    return false;
  }

  getBoolean(): false {
    return false;
  }

  get(): E {
    return this.val;
  }
}
