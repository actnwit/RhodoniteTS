import { RnException } from './RnException';

/**
 * Represents an error object containing a message and error details.
 * @template ErrObj - The type of the error object
 */
export interface RnError<ErrObj> {
  /** The error message */
  message: string;
  /** The error object containing additional error details */
  error: ErrObj;
}

/**
 * An interface to handle results in a unified manner,
 * regardless of whether they are successful or not.
 * This follows the Result pattern commonly used in functional programming.
 * @template T - The type of the success value
 * @template ErrObj - The type of the error object
 */
interface IResult<T, ErrObj> {
  /**
   * Chains operations on successful results. If this result is Ok, applies the function
   * to the contained value. If this result is Err, returns the error unchanged.
   * @template U - The type of the new success value
   * @param f - Function to apply to the success value
   * @returns A new Result containing either the transformed value or the original error
   */
  andThen<U>(f: (value: T) => Result<U, ErrObj>): Result<U, ErrObj>;

  /**
   * Provides an alternative result if this result is an error.
   * If this result is Ok, returns this result unchanged.
   * If this result is Err, returns the result of the provided function.
   * @template U - The type of the alternative success value
   * @param f - Function that provides an alternative result
   * @returns This result if Ok, otherwise the alternative result
   */
  orElse<U>(f: () => Result<U, ErrObj>): Result<U, ErrObj>;

  /**
   * Pattern matching for Result types. Executes the appropriate function
   * based on whether this result is Ok or Err.
   * @template R - The type of the return value from the Ok function
   * @template ErrObj2 - The type of the new error object
   * @param obj - Object containing pattern matching functions for Ok and Err cases
   * @param obj.Ok - Function to execute if this result is Ok
   * @param obj.Err - Function to execute if this result is Err
   * @returns A new Result containing the result of the pattern matching
   */
  match<R, ErrObj2>({
    Ok,
    Err,
  }: {
    Ok: (value: T) => R;
    Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
  }): Result<R, ErrObj2>;

  /**
   * Safely extracts the inner value with error compensation.
   * If the result is Ok, returns the contained value.
   * If the result is Err, calls the compensation function to provide a fallback value.
   * @param catchFn - Function that provides a fallback value in case of error
   * @returns The success value or the compensated value
   */
  unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;

  /**
   * Forcefully extracts the inner value.
   * If the result is Ok, returns the contained value.
   * If the result is Err, throws an exception.
   * @throws {RnException} When called on an Err result
   * @returns The success value
   */
  unwrapForce(): T;

  /**
   * Type guard to check if this result is Ok.
   * @returns True if this result is Ok, false otherwise
   */
  isOk(): this is Ok<T, ErrObj>;

  /**
   * Type guard to check if this result is Err.
   * @returns True if this result is Err, false otherwise
   */
  isErr(): this is Err<T, ErrObj>;

  /**
   * Gets the class name of this result.
   * @returns The name of the class ('Ok' or 'Err')
   */
  name(): string;
}

/**
 * Abstract base class for Result implementations.
 * Provides common functionality for both Ok and Err classes.
 * @template T - The type of the success value
 * @template ErrObj - The type of the error object
 */
abstract class CResult<T, ErrObj> {
  /**
   * Creates a new CResult instance.
   * @param val - The value to store (either success value or error)
   */
  constructor(protected val?: T | RnError<ErrObj>) {}

  /**
   * Pattern matching implementation for Result types.
   * @template R - The type of the return value from the Ok function
   * @template ErrObj2 - The type of the new error object
   * @param obj - Object containing pattern matching functions
   * @param obj.Ok - Function to execute if this result is Ok
   * @param obj.Err - Function to execute if this result is Err
   * @returns A new Result containing the result of the pattern matching
   * @throws {Error} If the result is neither Ok nor Err
   */
  match<R, ErrObj2>(obj: {
    Ok: (value: T) => R;
    Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
  }): Result<R, ErrObj2> {
    if (this instanceof Ok) {
      return new Ok(obj.Ok(this.val as T));
    }
    if (this instanceof Err) {
      return new Err(obj.Err(this.val as RnError<ErrObj>));
    }

    throw new Error('This is neither Ok nor Err.');
  }

  /**
   * Gets the name of this result class.
   * @returns The constructor name ('Ok' or 'Err')
   */
  name(): string {
    return this.constructor.name;
  }
}

/**
 * Represents a successful result containing a value.
 * This class indicates that an operation completed successfully.
 * @template T - The type of the success value
 * @template ErrObj - The type of the error object (for type compatibility)
 */
export class Ok<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
  /**
   * Chains operations on this successful result.
   * Applies the provided function to the contained value.
   * @template U - The type of the new success value
   * @param f - Function to apply to the success value
   * @returns The result of applying the function
   */
  andThen<U>(f: (value: T) => Result<U, ErrObj>): Result<U, ErrObj> {
    return f(this.val as T);
  }

  /**
   * Returns this Ok result unchanged since it's already successful.
   * The alternative function is not called.
   * @template U - The type of the alternative success value
   * @param f - Alternative function (not called for Ok results)
   * @returns This Ok result cast to the new type
   */
  orElse<U>(f: () => Result<U, ErrObj>): Result<U, ErrObj> {
    return this as unknown as Result<U, ErrObj>;
  }

  /**
   * Returns the contained value since this is a successful result.
   * The compensation function is not called.
   * @param catchFn - Compensation function (not called for Ok results)
   * @returns The contained success value
   */
  unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T {
    return this.val as T;
  }

  /**
   * Safely returns the contained value.
   * @returns The contained success value
   */
  unwrapForce(): T {
    return this.val as T;
  }

  /**
   * Always returns true for Ok results.
   * @deprecated Use isOk() instead
   * @returns Always true
   */
  true(): this is Ok<T, ErrObj> {
    return true;
  }

  /**
   * Type guard indicating this is an Ok result.
   * @returns Always true for Ok instances
   */
  isOk(): this is Ok<T, ErrObj> {
    return true;
  }

  /**
   * Type guard indicating this is not an Err result.
   * @returns Always false for Ok instances
   */
  isErr(): this is Err<T, ErrObj> {
    return false;
  }

  /**
   * Safely extracts the contained success value.
   * @returns The contained success value
   */
  get(): T {
    return this.val as T;
  }
}

/**
 * Represents a failed result containing an error.
 * This class indicates that an operation failed with specific error information.
 * @template T - The type of the success value (for type compatibility)
 * @template ErrObj - The type of the error object
 */
export class Err<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
  /** The RnException instance created from the error */
  public _rnException: RnException<ErrObj>;

  /**
   * Creates a new Err result.
   * @param val - The error information to store
   */
  constructor(val: RnError<ErrObj>) {
    super(val);
    this._rnException = new RnException(this.val as RnError<ErrObj>);
  }

  /**
   * Returns this Err result unchanged since the operation already failed.
   * The chaining function is not called.
   * @template U - The type of the new success value
   * @param f - Chaining function (not called for Err results)
   * @returns This Err result cast to the new type
   */
  andThen<U>(f: (value: T) => Result<U, ErrObj>): Result<U, ErrObj> {
    return this as unknown as Result<U, ErrObj>;
  }

  /**
   * Provides an alternative result since this result failed.
   * Calls the provided function to get an alternative result.
   * @template U - The type of the alternative success value
   * @param f - Function that provides an alternative result
   * @returns The result of the alternative function
   */
  orElse<U>(f: () => Result<U, ErrObj>): Result<U, ErrObj> {
    return f();
  }

  /**
   * Calls the compensation function to provide a fallback value.
   * @param catchFn - Function that provides a fallback value based on the error
   * @returns The compensated value from the catch function
   */
  unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T {
    return catchFn(this.val as RnError<ErrObj>);
  }

  /**
   * Throws an exception since this result contains an error.
   * @throws {RnException} Always throws the contained exception
   * @returns Never returns (always throws)
   */
  unwrapForce(): never {
    throw this._rnException;
  }

  /**
   * Always returns false for Err results.
   * @deprecated This method seems to be unused
   * @returns Always false
   */
  false(): false {
    return false;
  }

  /**
   * Type guard indicating this is not an Ok result.
   * @returns Always false for Err instances
   */
  isOk(): this is Ok<T, ErrObj> {
    return false;
  }

  /**
   * Type guard indicating this is an Err result.
   * @returns Always true for Err instances
   */
  isErr(): this is Err<T, ErrObj> {
    return true;
  }

  /**
   * Gets the contained error information.
   * @returns The RnError object containing error details
   */
  getRnError(): RnError<ErrObj> {
    return this.val as RnError<ErrObj>;
  }

  /**
   * Converts this error to a string representation.
   * @returns The stack trace from the contained exception
   */
  toString(): string {
    return this._rnException.stack!;
  }
}

/**
 * Union type representing either a successful result (Ok) or a failed result (Err).
 * @template T - The type of the success value
 * @template ErrObj - The type of the error object
 */
export type Result<T, ErrObj> = Ok<T, ErrObj> | Err<T, ErrObj>;

/**
 * Type assertion function to ensure a result is Ok.
 * Throws an error if the result is Err.
 * @param result - The result to check
 * @throws {Error} If the result is Err
 */
export function assertIsOk(result: IResult<any, any>): asserts result is Ok<any, any> {
  if (result.isErr()) {
    throw new Error('This is Err. No Ok.');
  }
}

/**
 * Type assertion function to ensure a result is Err.
 * Throws an error if the result is Ok.
 * @param result - The result to check
 * @throws {Error} If the result is Ok
 */
export function assertIsErr(result: IResult<any, any>): asserts result is Err<any, any> {
  if (result.isOk()) {
    throw new Error('This is Ok. No Err.');
  }
}
