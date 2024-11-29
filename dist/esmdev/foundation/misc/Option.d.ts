interface IOption<T> {
    andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>>;
    orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
    match<U>(obj: {
        Some: (value: NonNullable<T>) => NonNullable<U> | U;
        None: () => NonNullable<U> | U;
    }): NonNullable<U> | U;
    unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T>;
    unwrapOrElse(f: () => NonNullable<T>): NonNullable<T>;
    unwrapOrUndefined(): NonNullable<T> | undefined;
    unwrapForce(): NonNullable<T>;
    has(): this is Some<NonNullable<T>>;
    doesNotHave(): this is None;
}
/**
 * a class indicating that the included value exists.
 */
export declare class Some<T> implements IOption<T> {
    private value;
    constructor(value: NonNullable<T>);
    /**
     * This method is essentially same to the Some::and_then() in Rust language
     * @param f
     */
    andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>>;
    orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
    match<U>(obj: {
        Some: (value: NonNullable<T>) => NonNullable<U> | U;
        None: () => NonNullable<U> | U;
    }): NonNullable<U> | U;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T>;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(f: () => NonNullable<T>): NonNullable<T>;
    /**
     * @param altValue
     * @returns
     */
    unwrapForce(): NonNullable<T>;
    unwrapOrUndefined(): NonNullable<T> | undefined;
    get(): NonNullable<T>;
    has(): this is Some<NonNullable<T>>;
    doesNotHave(): this is None;
}
/**
 * a class indicating no existence.
 */
export declare class None implements IOption<never> {
    andThen<U>(f: (value: never) => Option<NonNullable<U>>): Option<NonNullable<U>>;
    orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
    match<U>(obj: {
        Some: (value: NonNullable<never>) => NonNullable<U> | U;
        None: () => NonNullable<U> | U;
    }): NonNullable<U> | U;
    unwrapOrDefault<T>(value: NonNullable<T>): NonNullable<T>;
    unwrapOrElse<T>(f: () => NonNullable<T>): NonNullable<T>;
    unwrapForce(): never;
    unwrapOrUndefined(): never;
    has(): this is Some<never>;
    doesNotHave(): this is None;
}
export type Option<T> = Some<T> | None;
export declare function assertHas(value: Option<any>): asserts value is Some<any>;
export declare function assertDoesNotHave(value: Option<any>): asserts value is None;
export {};
