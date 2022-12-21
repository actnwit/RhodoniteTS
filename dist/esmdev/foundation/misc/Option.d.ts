export interface IOption<T> {
    then<U>(f: (value: T) => IOption<U>): IOption<U>;
    then(f: (value: T) => None): None;
    unwrapOrDefault(altValue: T): T;
    unwrapOrElse(f: (...vals: any) => T): T;
    unwrapOrUndefined(): T | undefined;
    unwrapForce(): T;
    has(): this is Some<T>;
    doesNotHave(): this is None;
}
export declare class Option<T> implements IOption<T> {
    private value?;
    constructor(value?: T | undefined);
    set(val: T): void;
    /**
     * if inner
     * @param f
     */
    then(f: (value: T) => None): None;
    then<U>(f: (value: T) => Some<U>): Some<U>;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(altValue: T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(f: (...vals: any) => T): T;
    /**
     * @returns
     */
    unwrapForce(): T;
    unwrapOrUndefined(): T | undefined;
    has(): this is Some<T>;
    doesNotHave(): this is None;
}
/**
 * a class indicating that the included value exists.
 */
export declare class Some<T> implements IOption<T> {
    private value;
    constructor(value: T);
    /**
     * This method is essentially same to the Some::and_then() in Rust language
     * @param f
     */
    then(f: (value: T) => None): None;
    then<U>(f: (value: T) => Some<U>): Some<U>;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(altValue: T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(f: (value: T) => T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapForce(): T;
    unwrapOrUndefined(): T;
    get(): T;
    has(): this is Some<T>;
    doesNotHave(): this is None;
}
/**
 * a class indicating no existence.
 */
export declare class None implements IOption<never> {
    then(): None;
    unwrapOrDefault<T>(value: T): T;
    unwrapOrElse(f: (...vals: any) => never): never;
    unwrapForce(): never;
    unwrapOrUndefined(): never;
    has(): this is Some<never>;
    doesNotHave(): this is None;
}
export declare function assertHas(value: IOption<any>): asserts value is Some<any>;
export declare function assertDoesNotHave(value: IOption<any>): asserts value is None;
