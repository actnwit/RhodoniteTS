import type { Byte, TypedArray } from '../../types/CommonTypes';
/**
 * Detects if the current environment is a mobile VR device (Oculus Browser, Samsung Browser VR, etc.)
 * @returns True if running on a mobile VR device, false otherwise
 */
declare const isMobileVr: () => boolean;
/**
 * Detects if the current environment is a mobile device (iPod, iPad, iPhone, Android)
 * @returns True if running on a mobile device, false otherwise
 */
declare const isMobile: () => boolean;
/**
 * Detects if the current browser is Safari (excluding Chrome-based browsers)
 * @returns True if running on Safari browser, false otherwise
 */
declare const isSafari: () => boolean;
/**
 * Detects if the current environment is an iOS device (iPod, iPad, iPhone)
 * @returns True if running on an iOS device, false otherwise
 */
declare const isIOS: () => boolean;
/**
 * Prevents the default behavior of an event only on desktop devices
 * @param e - The event to potentially prevent default behavior for
 */
declare const preventDefaultForDesktopOnly: (e: Event) => void;
/**
 * Checks if a value is a plain object (not an array or other object types)
 * @param o - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
declare const isObject: (o: any) => boolean;
/**
 * Fills a template string with variables using template literals
 * @param templateString - The template string with placeholders
 * @param templateVars - The variables to substitute into the template
 * @returns The filled template string
 * @see https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
 */
declare const fillTemplate: (templateString: string, templateVars: string) => string;
/**
 * Detects if the current environment is Node.js
 * @returns True if running in Node.js environment, false otherwise
 */
declare const isNode: () => boolean;
/**
 * Concatenates multiple ArrayBuffers into a single ArrayBuffer with specified sizes and offsets
 * @param segments - Array of ArrayBuffers to concatenate
 * @param sizes - Array of sizes for each segment
 * @param offsets - Array of offsets for each segment
 * @param finalSize - Optional final size of the resulting buffer
 * @returns The concatenated ArrayBuffer
 */
declare const concatArrayBuffers: (segments: ArrayBuffer[], sizes: Byte[], offsets: Byte[], finalSize?: Byte) => ArrayBufferLike;
/**
 * Concatenates multiple ArrayBuffers into a single ArrayBuffer with a more structured approach
 * @param params - Configuration object for concatenation
 * @param params.finalSize - The final size of the resulting buffer
 * @param params.srcs - Array of source ArrayBuffers
 * @param params.srcsOffset - Array of offsets for each source buffer
 * @param params.srcsCopySize - Array of copy sizes for each source buffer
 * @returns The concatenated ArrayBuffer
 */
declare const concatArrayBuffers2: ({ finalSize, srcs, srcsOffset, srcsCopySize, }: {
    finalSize: Byte;
    srcs: ArrayBuffer[];
    srcsOffset: Byte[];
    srcsCopySize: Byte[];
}) => ArrayBuffer;
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
    isMobileVr: typeof isMobileVr;
    isMobile: typeof isMobile;
    isIOS: typeof isIOS;
    isSafari: typeof isSafari;
    preventDefaultForDesktopOnly: typeof preventDefaultForDesktopOnly;
    isObject: typeof isObject;
    fillTemplate: typeof fillTemplate;
    isNode: typeof isNode;
    concatArrayBuffers: typeof concatArrayBuffers;
    concatArrayBuffers2: typeof concatArrayBuffers2;
    addLineNumberToCode: typeof addLineNumberToCode;
    downloadArrayBuffer: typeof downloadArrayBuffer;
    downloadTypedArray: typeof downloadTypedArray;
}>;
export {};
