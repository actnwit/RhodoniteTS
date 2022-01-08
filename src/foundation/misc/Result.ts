import {Is} from './Is';

/**
 * An interface to handle the results in a unified manner,
 * regardless of whether they are successful or not.
 */
export interface IResult<T, E> {
  match({
    Ok,
    Err,
    Finally,
  }: {
    Ok: (value: T) => void;
    Err: (value: E) => void;
    Finally?: () => void;
  }): void;
  then(f: (value: T) => void): IResult<undefined, undefined>;
  catch(f: (value: E) => void): IResult<undefined, undefined>;
  finally(f: () => void): void;
  getBoolean(): boolean;
  name(): string;
}

abstract class Result<T, E> {
  constructor(protected val: T | E) {}
  match(obj: {
    Ok: (value: T) => void;
    Err: (value: E) => void;
    Finally?: () => void;
  }): void {
    if (this instanceof Ok) {
      obj.Ok(this.val as T);
    } else if (this instanceof Err) {
      obj.Err(this.val as E);
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
export class Ok<T, E> extends Result<T, E> implements IResult<T, E> {
  constructor(val: T) {
    super(val);
  }
  /**
   * This method is essentially same to the Ok::and_then() in Rust language
   * @param f
   */
  then(f: (value: T) => void): IResult<undefined, undefined> {
    f(this.val as T);
    return new Done(undefined);
  }

  catch(f: (value: E) => void): IResult<undefined, undefined> {
    throw new Error(
      'Error due to calling the "catch" method from an Ok object!'
    );
  }

  finally(f: () => void): void {
    throw new Error(
      'Error due to calling the "finally" method from an Ok object!'
    );
  }

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
export class Err<T, E> extends Result<T, E> implements IResult<T, E> {
  constructor(val: E) {
    super(val);
  }
  then(f: (value: never) => void): IResult<never, never> {
    throw new Error(
      'Error due to calling the "then" method from an Err object!'
    );
  }

  catch(f: (value: E) => void): IResult<undefined, undefined> {
    f(this.val as E);
    return new Done(undefined);
  }

  finally(f: () => void): void {
    throw new Error(
      'Error due to calling the "finally" method from an Err object!'
    );
  }

  false(): false {
    return false;
  }

  getBoolean(): false {
    return false;
  }

  get(): E {
    return this.val as E;
  }
}

export class Done
  extends Result<undefined, undefined>
  implements IResult<undefined, undefined>
{
  then(f: (value: never) => void): IResult<undefined, undefined> {
    throw new Error(
      'Error due to calling the "then" method from an Err object!'
    );
  }

  catch(f: (value: never) => void): IResult<undefined, undefined> {
    throw new Error(
      'Error due to calling the "catch" method from an Err object!'
    );
  }

  finally(f: () => void): void {
    f();
  }

  false(): false {
    return false;
  }

  getBoolean(): false {
    return false;
  }

  get(): undefined {
    throw new Error(
      'Error due to calling the "get" method from an Done object!'
    );
  }
}
