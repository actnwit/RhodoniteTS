import { Is } from './Is';
import { IOption, None, Some } from './Option';

export interface RnError<ErrObj> {
  message: string;
  error: ErrObj;
}

/**
 * An interface to handle the results in a unified manner,
 * regardless of whether they are successful or not.
 */
interface IResult<T, ErrObj> {
  match<R, ErrObj2>({
    Ok,
    Err,
  }: {
    Ok: (value: T) => R;
    Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
  }): IResult<R, ErrObj2>;
  // then(f: (value: T) => void): Finalizer | void;
  // catch(f: (value: RnError<ErrObj>) => void): Finalizer | void;
  unwrap(catchFn: (err: RnError<ErrObj>) => void): T | void;
  unwrapForce(): T;
  isOk(): this is Ok<T, ErrObj>;
  isErr(): this is Err<T, ErrObj>;
  name(): string;
}

abstract class Result<T, ErrObj> {
  constructor(protected val?: T | RnError<ErrObj>) {}
  match<R, ErrObj2>(obj: {
    Ok: (value: T) => R;
    Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
  }): IResult<R, ErrObj2> {
    if (this instanceof Ok) {
      return new Ok(obj.Ok(this.val as T));
    } else if (this instanceof Err) {
      return new Err(obj.Err(this.val as RnError<ErrObj>));
    }

    throw new Error('This is neither Ok nor Err.');
  }
  name(): string {
    return this.constructor.name;
  }
}

/**
 * a class indicating that the result is Ok (Succeeded).
 */
export class Ok<T, ErrObj> extends Result<T, ErrObj> implements IResult<T, ErrObj> {
  constructor(val?: T) {
    super(val);
  }
  /**
   * This method is essentially same to the Ok::and_then() in Rust language
   * @param f
   */
  // then(f: (value: T) => void): Finalizer {
  //   f(this.val as T);
  //   return new Finalizer();
  // }

  unwrap(catchFn: (err: RnError<ErrObj>) => void): T {
    return this.val as T;
  }

  unwrapForce(): T {
    return this.val as T;
  }

  // catch(f: (value: RnError<ErrObj>) => void): void {}

  true(): this is Ok<T, ErrObj> {
    return true;
  }

  isOk(): this is Ok<T, ErrObj> {
    return true;
  }

  isErr(): false {
    return false;
  }

  get(): T {
    return this.val as T;
  }
}

/**
 * a class indicating that the result is Error (Failed).
 */
export class Err<T, ErrObj> extends Result<T, ErrObj> implements IResult<T, ErrObj> {
  private __rnException: RnException<ErrObj>;

  constructor(val: RnError<ErrObj>) {
    super(val);
    this.__rnException = new RnException(this.val as RnError<ErrObj>);
  }

  // then(f: (value: never) => void): void {}

  // catch(f: (value: RnError<ErrObj>) => void): Finalizer {
  //   f(this.val as RnError<ErrObj>);
  //   return new Finalizer();
  // }

  unwrap(catchFn: (err: RnError<ErrObj>) => void): void {
    catchFn(this.val as RnError<ErrObj>);
  }

  unwrapForce(): never {
    throw this.__rnException;
  }

  false(): false {
    return false;
  }

  isOk(): false {
    return false;
  }

  isErr(): this is Err<T, ErrObj> {
    return true;
  }

  getRnError(): RnError<ErrObj> {
    return this.val as RnError<ErrObj>;
  }

  toString(): string {
    return this.__rnException.stack!;
  }
}

export type ResultType<T, ErrObj> = Ok<T, ErrObj> | Err<T, ErrObj>;

export function isOk<T, ErrObj>(result: Ok<T, ErrObj> | Err<T, ErrObj>): result is Ok<T, ErrObj> {
  return result.isOk();
}

export function isErr<T, ErrObj>(result: Ok<T, ErrObj> | Err<T, ErrObj>): result is Err<T, ErrObj> {
  return result.isErr();
}

export function assertIsOk(result: IResult<any, any>): asserts result is Ok<any, any> {
  if (result.isErr()) {
    throw new Error('This is Err. No Ok.');
  }
}

export function assertIsErr(result: IResult<any, any>): asserts result is Err<any, any> {
  if (result.isOk()) {
    throw new Error('This is Ok. No Err.');
  }
}

// export class Finalizer {
//   finally(f: () => void): void {
//     f();
//   }
// }

export class RnException<ErrObj> extends Error {
  static readonly _prefix = '\nRhodonite Exception';
  constructor(private err: RnError<ErrObj>) {
    super(`
  message: ${err.message}
  error: ${
    err.error instanceof Err<unknown, unknown> ? 'see below Exception ↓' + err.error : err.error
  }
`);
    this.name = RnException._prefix;
  }

  getRnError() {
    return this.err;
  }
}
