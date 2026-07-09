import type { Byte, TypedArray } from '../../types/CommonTypes';
/**
 * Returns a value if it exists, otherwise returns a default value
 * @template T - The type of the value
 * @param params - Configuration object
 * @param params.value - The value to check (optional)
 * @param params.defaultValue - The default value to return if value is null/undefined
 * @returns The value if it exists, otherwise the default value
 */
export declare const valueWithDefault: <T>({ value, defaultValue }: {
    value?: T;
    defaultValue: T;
}) => T;
/**
 * Executes a callback if the value exists
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 * @returns True if the value exists and callback was executed, false otherwise
 */
export declare const ifExistsThen: <T>(callback: (value: T) => void, value?: T) => value is T;
/**
 * Executes a callback if the value exists and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value exists, otherwise undefined
 */
export declare const ifExistsThenWithReturn: <T>(callback: (value: T) => T, value?: T) => T | undefined;
/**
 * Executes a callback if the value is defined
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 * @returns True if the value is defined and callback was executed, false otherwise
 */
export declare const ifDefinedThen: <T>(callback: (value: T) => void, value?: T) => value is T;
/**
 * Executes a callback if the value is defined and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value is defined, otherwise undefined
 */
export declare const ifDefinedThenWithReturn: <T>(callback: (value: T) => T, value?: T) => T | undefined;
/**
 * Executes a callback if the value is undefined
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 * @returns False if the value is undefined and callback was executed, true otherwise
 */
export declare const ifUndefinedThen: <T>(callback: () => void, value?: T) => value is T;
/**
 * Executes a callback if the value is undefined and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value is undefined, otherwise the original value
 */
export declare const ifUndefinedThenWithReturn: <T>(callback: () => T, value?: T) => T;
/**
 * Executes a callback if the value does not exist (is null or undefined)
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 */
export declare const ifNotExistsThen: <T>(callback: () => void, value?: T) => void;
/**
 * Executes a callback if the value does not exist and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value doesn't exist, otherwise the original value
 */
export declare const ifNotExistsThenWithReturn: <T>(callback: () => T, value?: T) => T;
/**
 * Returns a default value if the provided value is null or undefined
 * @template T - The type of the value
 * @param defaultValue - The default value to return
 * @param value - The value to check (optional)
 * @returns The value if it exists, otherwise the default value
 */
export declare const defaultValue: <T>(defaultValue: T, value?: T) => T;
/**
 * Returns a value if it exists, otherwise executes a compensation function
 * @template T - The type of the value
 * @param params - Configuration object
 * @param params.value - The value to check (optional)
 * @param params.compensation - Function to execute if value doesn't exist
 * @returns The value if it exists, otherwise the result of the compensation function
 */
export declare const valueWithCompensation: <T>({ value, compensation }: {
    value?: T;
    compensation: () => T;
}) => T;
/**
 * Converts a nullish array to an empty array
 * @template T - The type of array elements
 * @param value - The array value to check (optional or null)
 * @returns The original array if it exists, otherwise an empty array
 */
export declare const nullishToEmptyArray: <T>(value?: T[] | null) => T[];
/**
 * Converts a nullish Map to an empty Map
 * @template M - The type of Map keys
 * @template N - The type of Map values
 * @param value - The Map value to check (optional or null)
 * @returns The original Map if it exists, otherwise an empty Map
 */
export declare const nullishToEmptyMap: <M, N>(value?: Map<M, N> | null) => Map<M, N>;
/**
 * Interface representing the result of a comparison operation
 */
interface CompareResult {
    /** Whether the comparison condition was met */
    result: boolean;
    /** The greater value in the comparison */
    greater: number;
    /** The lesser value in the comparison */
    less: number;
}
/**
 * Compares if one number is greater than another
 * @param it - The number to compare
 * @param than - The number to compare against
 * @returns A CompareResult object with comparison details
 */
export declare const greaterThan: (it: number, than: number) => CompareResult;
/**
 * Compares if one number is less than another
 * @param it - The number to compare
 * @param than - The number to compare against
 * @returns A CompareResult object with comparison details
 */
export declare const lessThan: (it: number, than: number) => CompareResult;
/**
 * Adds line numbers to a code string for debugging purposes
 * @param shaderString - The code string to add line numbers to
 * @returns The code string with line numbers prepended to each line
 */
export declare const addLineNumberToCode: (shaderString: string) => string;
/**
 * Asserts that a value exists (is not null or undefined) and throws an error if it doesn't
 * @template T - The type of the value
 * @param val - The value to assert existence for
 * @throws Error if the value is null or undefined
 */
export declare function assertExist<T>(val: T): asserts val is NonNullable<T>;
/**
 * Creates a deep copy of an object using JSON stringify/parse
 * @param obj - The object to deep copy
 * @returns A deep copy of the input object
 * @warning This method has limitations with functions, undefined values, symbols, etc.
 */
export declare function deepCopyUsingJsonStringify(obj: {
    [k: string]: any;
}): {
    [k: string]: any;
};
/**
 * Downloads an ArrayBuffer as a file in the browser
 * @param fileNameToDownload - The name of the file to download
 * @param arrayBuffer - The ArrayBuffer data to download
 */
export declare function downloadArrayBuffer(fileNameToDownload: string, arrayBuffer: ArrayBuffer): void;
/**
 * Downloads a TypedArray as a file in the browser
 * @param fileNameToDownload - The name of the file to download
 * @param typedArray - The TypedArray data to download
 */
export declare function downloadTypedArray(fileNameToDownload: string, typedArray: TypedArray): void;
/**
 * Collection of miscellaneous utility functions for various common operations
 * including device detection, array buffer manipulation, conditional execution,
 * and file operations
 */
export declare const MiscUtil: Readonly<{
    isMobileVr: () => boolean;
    isMobile: () => boolean;
    isIOS: () => boolean;
    isSafari: () => boolean;
    preventDefaultForDesktopOnly: (e: Event) => void;
    isObject: (o: any) => boolean;
    fillTemplate: (templateString: string, templateVars: string) => string;
    isNode: () => boolean;
    concatArrayBuffers: (segments: ArrayBuffer[], sizes: Byte[], offsets: Byte[], finalSize?: Byte) => ArrayBufferLike;
    concatArrayBuffers2: ({ finalSize, srcs, srcsOffset, srcsCopySize, }: {
        finalSize: Byte;
        srcs: ArrayBuffer[];
        srcsOffset: Byte[];
        srcsCopySize: Byte[];
    }) => ArrayBuffer;
    addLineNumberToCode: (shaderString: string) => string;
    downloadArrayBuffer: typeof downloadArrayBuffer;
    downloadTypedArray: typeof downloadTypedArray;
}>;
export {};
