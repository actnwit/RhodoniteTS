import { RnException } from './RnException';

export interface RnError<ErrObj> {
  message: string;
  error: ErrObj;
}

/**
 * An interface to handle results in a unified manner,
 * regardless of whether they are successful or not.
 */
interface IResult<T, ErrObj> {
  /**
   * pattern matching
   * @param obj an object containing two pattern matching functions, Ok and Err.
   * @returns the result of the pattern matching function as a Result object.
   */
  match<R, ErrObj2>({
    Ok,
    Err,
  }: {
    Ok: (value: T) => R;
    Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
  }): Result<R, ErrObj2>;

  /**
   * get the inner value.
   * If the result is Err, The callback function compensates the error with an alternative valid value.
   * So you can get the inner value whether the result is Ok or Err.
   * @param catchFn
   * @returns the inner value
   */
  unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;

  /**
   * get the inner value anyway.
   * If the result is Err, this method throws an exception.
   * @returns the inner value
   */
  unwrapForce(): T;

  /**
   * get the boolean value whether the result is Ok or not.
   * Do not use this method directly. Use isOk() function bellow instead.
   * @private
   * @returns whether the result is Ok or not
   */
  isOk(): this is Ok<T, ErrObj>;

  /**
   * get the boolean value whether the result is Err or not.
   * Do not use this method directly. Use isErr() function bellow instead.
   * @private
   * @returns whether the result is Err or not
   */
  isErr(): this is Err<T, ErrObj>;

  /**
   * get the name of class. i.e. 'Ok' or 'Err'
   */
  name(): string;
}

abstract class CResult<T, ErrObj> {
  constructor(protected val?: T | RnError<ErrObj>) {}
  match<R, ErrObj2>(obj: {
    Ok: (value: T) => R;
    Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
  }): Result<R, ErrObj2> {
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
export class Ok<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
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

  unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T {
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

  isErr(): this is Err<T, ErrObj> {
    return false;
  }

  /**
   * get the inner value safely.
   * @returns the inner value
   */
  get(): T {
    return this.val as T;
  }
}

/**
 * a class indicating that the result is Error (Failed).
 */
export class Err<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
  public _rnException: RnException<ErrObj>;

  constructor(val: RnError<ErrObj>) {
    super(val);
    this._rnException = new RnException(this.val as RnError<ErrObj>);
  }

  unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T {
    return catchFn(this.val as RnError<ErrObj>);
  }

  unwrapForce(): never {
    throw this._rnException;
  }

  false(): false {
    return false;
  }

  isOk(): this is Ok<T, ErrObj> {
    return false;
  }

  isErr(): this is Err<T, ErrObj> {
    return true;
  }

  /**
   * get the RnError object.
   * @returns the RnError object
   */
  getRnError(): RnError<ErrObj> {
    return this.val as RnError<ErrObj>;
  }

  toString(): string {
    return this._rnException.stack!;
  }
}

export type Result<T, ErrObj> = Ok<T, ErrObj> | Err<T, ErrObj>;

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
