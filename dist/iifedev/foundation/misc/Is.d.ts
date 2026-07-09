/**
 * A utility object containing various type checking and validation functions.
 * Provides methods to check if values are defined, null, functions, truthy/falsy, etc.
 * Also includes derivative methods like `not`, `all`, and `any` for more complex validations.
 */
export declare const IsObj: {
    /**
     * Checks if a value is defined (not undefined).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not undefined
     */
    defined(val: unknown, ..._args: unknown[]): val is Exclude<Object, undefined>;
    /**
     * Checks if a value is undefined.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is undefined
     */
    undefined(val: unknown, ..._args: unknown[]): val is undefined;
    /**
     * Checks if a value is null.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is null
     */
    null(val: unknown, ..._args: unknown[]): val is null;
    /**
     * Checks if a value exists (is neither null nor undefined).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not null and not undefined
     */
    exist(val?: unknown, ..._args: unknown[]): val is Object;
    /**
     * Checks if a value is a function.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is a function
     */
    function(val: unknown, ..._args: unknown[]): val is Function;
    /**
     * Checks if a value is strictly equal to true.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is exactly true
     */
    true(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a value is truthy (converts to true in boolean context).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is truthy
     */
    truly(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a value is strictly equal to false.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is exactly false
     */
    false(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a value is falsy (converts to false in boolean context).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is falsy
     */
    falsy(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a string contains another string.
     * @param thisStr - The string to search in
     * @param queryStr - The string to search for
     * @returns True if thisStr contains queryStr
     */
    stringContaining(thisStr: string, queryStr: string): boolean;
};
/**
 * Negated versions of the base validation functions.
 * Each method returns the opposite result of its corresponding method in IsObj.
 */
declare const NotObj: {
    /**
     * Checks if a value is undefined (negated version of defined).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is undefined
     */
    defined(val: unknown, ..._args: unknown[]): val is undefined;
    /**
     * Checks if a value is defined (negated version of undefined).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not undefined
     */
    undefined(val: unknown, ..._args: unknown[]): val is Object;
    /**
     * Checks if a value is not null.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not null
     */
    null(val: unknown, ..._args: unknown[]): val is Object;
    /**
     * Checks if a value does not exist (is null or undefined).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is null or undefined
     */
    exist(val?: unknown, ..._args: unknown[]): val is undefined | null;
    /**
     * Checks if a value is not a function.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not a function
     */
    function(val: unknown, ..._args: unknown[]): val is Exclude<unknown, Function>;
    /**
     * Checks if a value is not strictly equal to true.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not exactly true
     */
    true(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a value is not truthy (negated version of truly).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not truthy
     */
    truly(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a value is not strictly equal to false.
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not exactly false
     */
    false(val: unknown, ..._args: unknown[]): boolean;
    /**
     * Checks if a value is not falsy (negated version of falsy).
     * @param val - The value to check
     * @param args - Additional arguments (unused)
     * @returns True if the value is not falsy
     */
    falsy(val: unknown, ..._args: unknown[]): boolean;
};
type IsImplType = typeof IsObj;
/**
 * Extended interface that includes the base validation methods plus derivative methods.
 * Provides `not`, `all`, and `any` modifiers for complex validation scenarios.
 */
export interface IsType extends IsImplType {
    not: typeof NotObj;
    all: typeof IsObj;
    any: typeof IsObj;
}
/**
 * Main export providing comprehensive type checking and validation utilities.
 *
 * @example
 * ```typescript
 * import { Is } from './Is';
 *
 * // Basic usage
 * Is.defined(value);        // Check if value is defined
 * Is.null(value);           // Check if value is null
 * Is.function(value);       // Check if value is a function
 *
 * // Negated checks
 * Is.not.defined(value);    // Check if value is undefined
 * Is.not.null(value);       // Check if value is not null
 *
 * // Array validation
 * Is.all.defined([1, 2, 3]); // Check if all values are defined
 * Is.any.null([1, null, 3]); // Check if any value is null
 * ```
 */
export declare const Is: IsType;
export {};
