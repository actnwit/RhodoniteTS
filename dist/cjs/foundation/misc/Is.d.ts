export declare const IsObj: {
    defined(val: unknown, ...args: unknown[]): val is Object;
    undefined(val: unknown, ...args: unknown[]): val is undefined;
    null(val: unknown, ...args: unknown[]): val is null;
    exist(val?: unknown, ...args: unknown[]): val is Object;
    function(val: unknown, ...args: unknown[]): val is Function;
    true(val: unknown, ...args: unknown[]): boolean;
    truly(val: unknown, ...args: unknown[]): boolean;
    false(val: unknown, ...args: unknown[]): boolean;
    falsy(val: unknown, ...args: unknown[]): boolean;
    stringContaining(thisStr: string, queryStr: string): boolean;
};
declare const NotObj: {
    defined(val: unknown, ...args: unknown[]): val is undefined;
    undefined(val: unknown, ...args: unknown[]): val is Object;
    null(val: unknown, ...args: unknown[]): val is Object;
    exist(val?: unknown, ...args: unknown[]): val is null | undefined;
    function(val: unknown, ...args: unknown[]): val is unknown;
    true(val: unknown, ...args: unknown[]): boolean;
    truly(val: unknown, ...args: unknown[]): boolean;
    false(val: unknown, ...args: unknown[]): boolean;
    falsy(val: unknown, ...args: unknown[]): boolean;
};
type IsImplType = typeof IsObj;
export interface IsType extends IsImplType {
    not: typeof NotObj;
    all: typeof IsObj;
    any: typeof IsObj;
}
export declare const Is: IsType;
export {};
