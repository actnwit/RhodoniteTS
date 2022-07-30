export interface RnError<ErrObj> {
    message: string;
    error?: ErrObj;
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
    then(f: (value: T) => void): Finalizer | void;
    catch(f: (value: RnError<ErrObj>) => void): Finalizer | void;
    unwrap(catchFn: (err: RnError<ErrObj>) => void): T | void;
    unwrapForce(): T;
    isOk(): boolean;
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
    then(f: (value: T) => void): Finalizer;
    unwrap(catchFn: (err: RnError<ErrObj>) => void): T;
    unwrapForce(): T;
    catch(f: (value: RnError<ErrObj>) => void): void;
    true(): true;
    isOk(): true;
    get(): T;
}
/**
 * a class indicating that the result is Error (Failed).
 */
export declare class Err<T, ErrObj> extends Result<T, ErrObj> implements IResult<T, ErrObj> {
    private __rnException;
    constructor(val?: RnError<ErrObj>);
    then(f: (value: never) => void): void;
    catch(f: (value: RnError<ErrObj>) => void): Finalizer;
    unwrap(catchFn: (err: RnError<ErrObj>) => void): void;
    unwrapForce(): never;
    false(): false;
    isOk(): false;
    get(): RnError<ErrObj>;
}
export declare class Finalizer {
    finally(f: () => void): void;
}
export declare class RnException<ErrObj> extends Error {
    private err;
    static readonly _prefix = "Rhodonite Exception";
    constructor(err: RnError<ErrObj>);
    getRnError(): RnError<ErrObj>;
}
export {};
