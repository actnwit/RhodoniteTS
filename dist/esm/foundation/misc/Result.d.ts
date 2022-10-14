export interface RnError<ErrObj> {
    message: string;
    error: ErrObj;
}
/**
 * An interface to handle the results in a unified manner,
 * regardless of whether they are successful or not.
 */
export interface IResult<T, ErrObj> {
    match({ Ok, Err, Finally, }: {
        Ok: (value: T) => void;
        Err: (value: RnError<ErrObj>) => void;
        Finally?: () => void;
    }): void;
    unwrap(catchFn: (err: RnError<ErrObj>) => void): T | void;
    unwrapForce(): T;
    isOk(): this is Ok<T, ErrObj>;
    isErr(): this is Err<T, ErrObj>;
    name(): string;
}
declare abstract class Result<T, ErrObj> {
    protected val?: T | RnError<ErrObj> | undefined;
    constructor(val?: T | RnError<ErrObj> | undefined);
    match(obj: {
        Ok: (value: T) => void;
        Err: (value: RnError<ErrObj>) => void;
        Finally?: () => void;
    }): void;
    name(): string;
}
/**
 * a class indicating that the result is Ok (Succeeded).
 */
export declare class Ok<T, ErrObj> extends Result<T, ErrObj> implements IResult<T, ErrObj> {
    constructor(val?: T);
    /**
     * This method is essentially same to the Ok::and_then() in Rust language
     * @param f
     */
    unwrap(catchFn: (err: RnError<ErrObj>) => void): T;
    unwrapForce(): T;
    true(): this is Ok<T, ErrObj>;
    isOk(): this is Ok<T, ErrObj>;
    isErr(): false;
    get(): T;
}
/**
 * a class indicating that the result is Error (Failed).
 */
export declare class Err<T, ErrObj> extends Result<T, ErrObj> implements IResult<T, ErrObj> {
    private __rnException;
    constructor(val: RnError<ErrObj>);
    unwrap(catchFn: (err: RnError<ErrObj>) => void): void;
    unwrapForce(): never;
    false(): false;
    isOk(): false;
    isErr(): this is Err<T, ErrObj>;
    getRnError(): RnError<ErrObj>;
    toString(): string;
}
export declare function assertIsOk(result: IResult<any, any>): asserts result is Ok<any, any>;
export declare function assertIsErr(result: IResult<any, any>): asserts result is Err<any, any>;
export declare class RnException<ErrObj> extends Error {
    private err;
    static readonly _prefix = "\nRhodonite Exception";
    constructor(err: RnError<ErrObj>);
    getRnError(): RnError<ErrObj>;
}
export {};
