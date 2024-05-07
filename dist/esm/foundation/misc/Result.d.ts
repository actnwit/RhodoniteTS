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
    match<R, ErrObj2>({ Ok, Err, }: {
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
    _isOk(): this is Ok<T, ErrObj>;
    /**
     * get the boolean value whether the result is Err or not.
     * Do not use this method directly. Use isErr() function bellow instead.
     * @private
     * @returns whether the result is Err or not
     */
    _isErr(): this is Err<T, ErrObj>;
    /**
     * get the name of class. i.e. 'Ok' or 'Err'
     */
    name(): string;
}
declare abstract class CResult<T, ErrObj> {
    protected val?: T | RnError<ErrObj> | undefined;
    constructor(val?: T | RnError<ErrObj> | undefined);
    match<R, ErrObj2>(obj: {
        Ok: (value: T) => R;
        Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
    }): Result<R, ErrObj2>;
    name(): string;
}
/**
 * a class indicating that the result is Ok (Succeeded).
 */
export declare class Ok<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
    constructor(val?: T);
    /**
     * This method is essentially same to the Ok::and_then() in Rust language
     * @param f
     */
    unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;
    unwrapForce(): T;
    true(): this is Ok<T, ErrObj>;
    _isOk(): this is Ok<T, ErrObj>;
    _isErr(): false;
    /**
     * get the inner value safely.
     * @returns the inner value
     */
    get(): T;
}
/**
 * a class indicating that the result is Error (Failed).
 */
export declare class Err<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
    private __rnException;
    constructor(val: RnError<ErrObj>);
    unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;
    unwrapForce(): never;
    false(): false;
    _isOk(): false;
    _isErr(): this is Err<T, ErrObj>;
    /**
     * get the RnError object.
     * @returns the RnError object
     */
    getRnError(): RnError<ErrObj>;
    toString(): string;
}
export type Result<T, ErrObj> = Ok<T, ErrObj> | Err<T, ErrObj>;
export declare function isOk<T, ErrObj>(result: Ok<T, ErrObj> | Err<T, ErrObj>): result is Ok<T, ErrObj>;
export declare function isErr<T, ErrObj>(result: Ok<T, ErrObj> | Err<T, ErrObj>): result is Err<T, ErrObj>;
export declare function assertIsOk(result: IResult<any, any>): asserts result is Ok<any, any>;
export declare function assertIsErr(result: IResult<any, any>): asserts result is Err<any, any>;
export {};
