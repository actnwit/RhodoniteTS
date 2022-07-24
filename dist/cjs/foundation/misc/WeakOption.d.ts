export interface IWeakOption<B extends object, T> {
    unwrapOrDefault(base: B, altValue: T): T;
    unwrapOrElse(base: B, f: (...vals: any) => T): T;
    unwrapForce(base: B): T;
    unwrapOrUndefined(base: B): T | undefined;
    has(base: B): boolean;
}
export declare class WeakOption<B extends object, T> implements IWeakOption<B, T> {
    private __weakMap;
    set(base: B, val: T): void;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(base: B, altValue: T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(base: B, f: (...vals: any) => T): T;
    /**
     * @returns
     */
    unwrapForce(base: B): T;
    unwrapOrUndefined(base: B): T | undefined;
    has(base: B): boolean;
}
/**
 * a class indicating that the included value exists.
 */
export declare class WeakSome<B extends object, T> implements IWeakOption<B, T> {
    private __weakMap;
    constructor(base: B, value: T);
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(base: B, altValue: T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(base: B, f: (value: T) => T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapForce(base: B): T;
    get(base: B): T;
    unwrapOrUndefined(base: B): T | undefined;
    has(base: B): true;
}
/**
 * a class indicating no existence.
 */
export declare class WeakNone<B extends object> implements IWeakOption<B, never> {
    then(): WeakNone<B>;
    unwrapOrDefault<T>(base: B, value: T): T;
    unwrapOrElse(base: B, f: (...vals: any) => never): never;
    unwrapForce(base: B): never;
    unwrapOrUndefined(base: B): never;
    has(): false;
}
