import {Is} from './Is';

export interface RnError<ErrObj> {
  message: string;
  error: ErrObj;
}

/**
 * An interface to handle the results in a unified manner,
 * regardless of whether they are successful or not.
 */
export interface IResult<T, ErrObj> {
  match({
    Ok,
    Err,
    Finally,
  }: {
    Ok: (value: T) => void;
    Err: (value: RnError<ErrObj>) => void;
    Finally?: () => void;
  }): void;
  then(f: (value: T) => void): Finalizer | void;
  catch(f: (value: RnError<ErrObj>) => void): Finalizer | void;
  unwrap(catchFn: (err: RnError<ErrObj>) => void): T | void;
  unwrapForce(): T;
  getBoolean(): boolean;
  name(): string;
}

abstract class Result<T, ErrObj> {
  constructor(protected val: T | RnError<ErrObj>) {}
  match(obj: {
    Ok: (value: T) => void;
    Err: (value: RnError<ErrObj>) => void;
    Finally?: () => void;
  }): void {
    if (this instanceof Ok) {
      obj.Ok(this.val as T);
    } else if (this instanceof Err) {
      obj.Err(this.val as RnError<ErrObj>);
    }
    if (Is.exist(obj.Finally)) {
      obj.Finally();
    }
  }
  name(): string {
    return this.constructor.name;
  }
}

/**
 * a class indicating that the result is Ok (Succeeded).
 */
export class Ok<T, ErrObj>
  extends Result<T, ErrObj>
  implements IResult<T, ErrObj>
{
  constructor(val: T) {
    super(val);
  }
  /**
   * This method is essentially same to the Ok::and_then() in Rust language
   * @param f
   */
  then(f: (value: T) => void): Finalizer {
    f(this.val as T);
    return new Finalizer();
  }

  unwrap(catchFn: (err: RnError<ErrObj>) => void): T {
    return this.val as T;
  }

  unwrapForce(): T {
    return this.val as T;
  }

  catch(f: (value: RnError<ErrObj>) => void): void {}

  true(): true {
    return true;
  }

  getBoolean(): true {
    return true;
  }

  get(): T {
    return this.val as T;
  }
}

/**
 * a class indicating that the result is Error (Failed).
 */
export class Err<T, ErrObj>
  extends Result<T, ErrObj>
  implements IResult<T, ErrObj>
{
  constructor(val: RnError<ErrObj>) {
    super(val);
  }
  then(f: (value: never) => void): void {}

  catch(f: (value: RnError<ErrObj>) => void): Finalizer {
    f(this.val as RnError<ErrObj>);
    return new Finalizer();
  }

  unwrap(catchFn: (err: RnError<ErrObj>) => void): void {
    catchFn(this.val as RnError<ErrObj>);
  }

  unwrapForce(): never {
    throw new RnException(this.val as RnError<ErrObj>);
  }

  false(): false {
    return false;
  }

  getBoolean(): false {
    return false;
  }

  get(): RnError<ErrObj> {
    return this.val as RnError<ErrObj>;
  }
}

export class Finalizer {
  finally(f: () => void): void {
    f();
  }
}

export class RnException<ErrObj> extends Error {
  static readonly _prefix = 'Rhodonite Exception';
  constructor(private err: RnError<ErrObj>) {
    super(err.message);
    this.name = RnException._prefix;
  }

  getRnError() {
    return this.err;
  }
}
