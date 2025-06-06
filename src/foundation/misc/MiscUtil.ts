import type { Byte, Size, TypedArray } from '../../types/CommonTypes';
import { Is } from './Is';

/**
 * Detects if the current environment is a mobile VR device (Oculus Browser, Samsung Browser VR, etc.)
 * @returns True if running on a mobile VR device, false otherwise
 */
const isMobileVr = (): boolean => {
  if (typeof window !== 'undefined') {
    return /(Pacific Build.+OculusBrowser.+SamsungBrowser.+)|(SamsungBrowser)|(Mobile VR)/i.test(
      window.navigator.userAgent
    );
  }
  return false;
};

/**
 * Detects if the current environment is a mobile device (iPod, iPad, iPhone, Android)
 * @returns True if running on a mobile device, false otherwise
 */
const isMobile = (): boolean => {
  const ua = [
    'iPod',
    'iPad', // for old version
    'iPhone',
    'Android',
  ];

  for (let i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return isIPad();
};

/**
 * Detects if the current browser is Safari (excluding Chrome-based browsers)
 * @returns True if running on Safari browser, false otherwise
 */
const isSafari = (): boolean => {
  const toBe = 'Safari';
  const noToBe = 'Chrome';

  if (navigator.userAgent.indexOf(toBe) > 0 && navigator.userAgent.indexOf(noToBe) === -1) {
    return true;
  }

  return false;
};

/**
 * Detects if the current environment is an iOS device (iPod, iPad, iPhone)
 * @returns True if running on an iOS device, false otherwise
 */
const isIOS = (): boolean => {
  const ua = [
    'iPod',
    'iPad', // for old version
    'iPhone',
  ];

  for (let i = 0; i < ua.length; i++) {
    if (navigator.userAgent.indexOf(ua[i]) > 0) {
      return true;
    }
  }

  return isIPad();
};

/**
 * Detects if the current device is an iPad (including newer iPads that identify as Macintosh)
 * @returns True if running on an iPad, false otherwise
 */
const isIPad = (): boolean => navigator.userAgent.indexOf('Macintosh') > -1 && 'ontouchend' in document;

/**
 * Prevents the default behavior of an event only on desktop devices
 * @param e - The event to potentially prevent default behavior for
 */
const preventDefaultForDesktopOnly = (e: Event): void => {
  if (!isMobile()) {
    e.preventDefault();
  }
};

/**
 * Checks if a value is a plain object (not an array or other object types)
 * @param o - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
const isObject = (o: any): boolean => !!(o instanceof Object && !Array.isArray(o));

/**
 * Fills a template string with variables using template literals
 * @param templateString - The template string with placeholders
 * @param templateVars - The variables to substitute into the template
 * @returns The filled template string
 * @see https://stackoverflow.com/questions/30003353/can-es6-template-literals-be-substituted-at-runtime-or-reused
 */
const fillTemplate = (templateString: string, templateVars: string): string =>
  new Function(`return \`${templateString}\`;`).call(templateVars);

/**
 * Detects if the current environment is Node.js
 * @returns True if running in Node.js environment, false otherwise
 */
const isNode = (): boolean => typeof process !== 'undefined' && typeof require !== 'undefined';

/**
 * Concatenates multiple ArrayBuffers into a single ArrayBuffer with specified sizes and offsets
 * @param segments - Array of ArrayBuffers to concatenate
 * @param sizes - Array of sizes for each segment
 * @param offsets - Array of offsets for each segment
 * @param finalSize - Optional final size of the resulting buffer
 * @returns The concatenated ArrayBuffer
 */
const concatArrayBuffers = (segments: ArrayBuffer[], sizes: Byte[], offsets: Byte[], finalSize?: Byte) => {
  let sumLength = 0;
  for (let i = 0; i < sizes.length; ++i) {
    sumLength += sizes[i];
  }
  let whole: Uint8Array;
  if (finalSize != null) {
    whole = new Uint8Array(finalSize);
  } else {
    whole = new Uint8Array(sumLength);
  }

  const getExceededSize = (sizeToAdd: Size) => {
    if (finalSize != null && offsetOfBase + sizeToAdd > finalSize) {
      return offsetOfBase + sizeToAdd - finalSize;
    }
    return 0;
  };
  let offsetOfBase = 0;
  const addData = (sizeToAdd: Size, i: number) => {
    const exceededSize = getExceededSize(sizeToAdd);
    if (exceededSize) {
      whole.set(new Uint8Array(segments[i], offsets[i], exceededSize), offsetOfBase);
      offsetOfBase += exceededSize;
      return true;
    }
    whole.set(new Uint8Array(segments[i], offsets[i], sizeToAdd), offsetOfBase);
    offsetOfBase += sizeToAdd;
    return false;
  };
  const addOverSizeData = (overSize: Size) => {
    const exceededSize = getExceededSize(overSize);
    if (exceededSize) {
      whole.set(new Uint8Array(exceededSize), offsetOfBase);
      offsetOfBase += exceededSize;
      return true;
    }
    whole.set(new Uint8Array(overSize), offsetOfBase);
    offsetOfBase += overSize;
    return false;
  };

  for (let i = 0; i < segments.length; ++i) {
    const delta = sizes[i] + offsets[i] - segments[i].byteLength;
    const overSize = delta > 0 ? delta : 0;
    const sizeToAdd = sizes[i] - overSize;
    if (addData(sizeToAdd, i)) {
      return whole.buffer;
    }
    if (overSize > 0) {
      if (addOverSizeData(overSize)) {
        return whole.buffer;
      }
    }
  }
  if (finalSize != null && offsetOfBase < finalSize) {
    whole.set(new Uint8Array(finalSize - offsetOfBase), offsetOfBase);
  }
  return whole.buffer;
};

/**
 * Concatenates multiple ArrayBuffers into a single ArrayBuffer with a more structured approach
 * @param params - Configuration object for concatenation
 * @param params.finalSize - The final size of the resulting buffer
 * @param params.srcs - Array of source ArrayBuffers
 * @param params.srcsOffset - Array of offsets for each source buffer
 * @param params.srcsCopySize - Array of copy sizes for each source buffer
 * @returns The concatenated ArrayBuffer
 */
const concatArrayBuffers2 = ({
  finalSize,
  srcs,
  srcsOffset,
  srcsCopySize,
}: {
  finalSize: Byte;
  srcs: ArrayBuffer[];
  srcsOffset: Byte[];
  srcsCopySize: Byte[];
}): ArrayBuffer => {
  const dstBuf = new Uint8Array(new ArrayBuffer(finalSize));
  let copiedSize = 0;
  for (const i in srcs) {
    const src = srcs[i];
    const srcBuf = new Uint8Array(src, srcsOffset[i], srcsCopySize[i]);
    dstBuf.set(srcBuf, copiedSize);
    copiedSize += srcsCopySize[i];
  }
  return dstBuf.buffer;
};

/**
 * Returns a value if it exists, otherwise returns a default value
 * @template T - The type of the value
 * @param params - Configuration object
 * @param params.value - The value to check (optional)
 * @param params.defaultValue - The default value to return if value is null/undefined
 * @returns The value if it exists, otherwise the default value
 */
export const valueWithDefault = <T>({ value, defaultValue }: { value?: T; defaultValue: T }): T => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return defaultValue;
  }
  return value;
};

/**
 * Executes a callback if the value exists
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 * @returns True if the value exists and callback was executed, false otherwise
 */
export const ifExistsThen = <T>(callback: (value: T) => void, value?: T): value is T => {
  if (Is.exist(value)) {
    callback(value);
    return true;
  }
  return false;
};

/**
 * Executes a callback if the value exists and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value exists, otherwise undefined
 */
export const ifExistsThenWithReturn = <T>(callback: (value: T) => T, value?: T): T | undefined => {
  if (Is.exist(value)) {
    return callback(value);
  }
  return value;
};

/**
 * Executes a callback if the value is defined
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 * @returns True if the value is defined and callback was executed, false otherwise
 */
export const ifDefinedThen = <T>(callback: (value: T) => void, value?: T): value is T => {
  if (Is.exist(value)) {
    callback(value);
    return true;
  }
  return false;
};

/**
 * Executes a callback if the value is defined and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value is defined, otherwise undefined
 */
export const ifDefinedThenWithReturn = <T>(callback: (value: T) => T, value?: T): T | undefined => {
  if (Is.exist(value)) {
    return callback(value);
  }
  return value;
};

/**
 * Executes a callback if the value is undefined
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 * @returns False if the value is undefined and callback was executed, true otherwise
 */
export const ifUndefinedThen = <T>(callback: () => void, value?: T): value is T => {
  if (Is.undefined(value)) {
    callback();
    return false;
  }
  return true;
};

/**
 * Executes a callback if the value is undefined and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value is undefined, otherwise the original value
 */
export const ifUndefinedThenWithReturn = <T>(callback: () => T, value?: T): T => {
  if (Is.undefined(value)) {
    return callback();
  }
  return value;
};

/**
 * Executes a callback if the value does not exist (is null or undefined)
 * @template T - The type of the value
 * @param callback - The callback function to execute
 * @param value - The value to check (optional)
 */
export const ifNotExistsThen = <T>(callback: () => void, value?: T): void => {
  if (Is.undefined(value)) {
    callback();
  }
};

/**
 * Executes a callback if the value does not exist and returns the result
 * @template T - The type of the value
 * @param callback - The callback function to execute that returns a value
 * @param value - The value to check (optional)
 * @returns The result of the callback if value doesn't exist, otherwise the original value
 */
export const ifNotExistsThenWithReturn = <T>(callback: () => T, value?: T): T => {
  if (Is.undefined(value)) {
    return callback();
  }
  return value;
};

/**
 * Returns a default value if the provided value is null or undefined
 * @template T - The type of the value
 * @param defaultValue - The default value to return
 * @param value - The value to check (optional)
 * @returns The value if it exists, otherwise the default value
 */
export const defaultValue = <T>(defaultValue: T, value?: T): T => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return defaultValue;
  }
  return value;
};

/**
 * Returns a value if it exists, otherwise executes a compensation function
 * @template T - The type of the value
 * @param params - Configuration object
 * @param params.value - The value to check (optional)
 * @param params.compensation - Function to execute if value doesn't exist
 * @returns The value if it exists, otherwise the result of the compensation function
 */
export const valueWithCompensation = <T>({
  value,
  compensation,
}: {
  value?: T;
  compensation: () => T;
}): T => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return compensation();
  }
  return value;
};

/**
 * Converts a nullish array to an empty array
 * @template T - The type of array elements
 * @param value - The array value to check (optional or null)
 * @returns The original array if it exists, otherwise an empty array
 */
export const nullishToEmptyArray = <T>(value?: T[] | null): T[] => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return [];
  }
  return value;
};

/**
 * Converts a nullish Map to an empty Map
 * @template M - The type of Map keys
 * @template N - The type of Map values
 * @param value - The Map value to check (optional or null)
 * @returns The original Map if it exists, otherwise an empty Map
 */
export const nullishToEmptyMap = <M, N>(value?: Map<M, N> | null): Map<M, N> => {
  // eslint-disable-next-line eqeqeq
  if (value == null) {
    return new Map();
  }
  return value;
};

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
export const greaterThan = (it: number, than: number): CompareResult => {
  if (it > than) {
    return { result: true, greater: it, less: than };
  }
  return { result: false, greater: than, less: it };
};

/**
 * Compares if one number is less than another
 * @param it - The number to compare
 * @param than - The number to compare against
 * @returns A CompareResult object with comparison details
 */
export const lessThan = (it: number, than: number): CompareResult => {
  if (it < than) {
    return { result: true, greater: than, less: it };
  }
  return { result: false, greater: it, less: than };
};

/**
 * Adds line numbers to a code string for debugging purposes
 * @param shaderString - The code string to add line numbers to
 * @returns The code string with line numbers prepended to each line
 */
export const addLineNumberToCode = (shaderString: string): string => {
  const shaderTextLines = shaderString.split(/\r\n|\r|\n/);
  let shaderTextWithLineNumber = '';
  for (let i = 0; i < shaderTextLines.length; i++) {
    const lineIndex = i + 1;
    let splitter = ' : ';
    if (lineIndex < 10) {
      splitter = '  : ';
    } else if (lineIndex >= 100) {
      splitter = ': ';
    }
    shaderTextWithLineNumber += `${lineIndex + splitter + shaderTextLines[i]}\n`;
  }

  return shaderTextWithLineNumber;
};

/**
 * Asserts that a value exists (is not null or undefined) and throws an error if it doesn't
 * @template T - The type of the value
 * @param val - The value to assert existence for
 * @throws Error if the value is null or undefined
 */
export function assertExist<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new Error(`Expected 'val' to be existed, but received ${val}`);
  }
}

/**
 * Creates a deep copy of an object using JSON stringify/parse
 * @param obj - The object to deep copy
 * @returns A deep copy of the input object
 * @warning This method has limitations with functions, undefined values, symbols, etc.
 */
export function deepCopyUsingJsonStringify(obj: { [k: string]: any }): { [k: string]: any } {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Downloads an ArrayBuffer as a file in the browser
 * @param fileNameToDownload - The name of the file to download
 * @param arrayBuffer - The ArrayBuffer data to download
 */
export function downloadArrayBuffer(fileNameToDownload: string, arrayBuffer: ArrayBuffer): void {
  const a = document.createElement('a');
  a.download = fileNameToDownload;
  const blob = new Blob([arrayBuffer], { type: 'octet/stream' });
  const url = URL.createObjectURL(blob);
  a.href = url;
  const e = new MouseEvent('click');
  a.dispatchEvent(e);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a TypedArray as a file in the browser
 * @param fileNameToDownload - The name of the file to download
 * @param typedArray - The TypedArray data to download
 */
export function downloadTypedArray(fileNameToDownload: string, typedArray: TypedArray): void {
  const a = document.createElement('a');
  a.download = fileNameToDownload;
  const blob = new Blob([typedArray], { type: 'octet/stream' });
  const url = URL.createObjectURL(blob);
  a.href = url;
  const e = new MouseEvent('click');
  a.dispatchEvent(e);
  URL.revokeObjectURL(url);
}

/**
 * Collection of miscellaneous utility functions for various common operations
 * including device detection, array buffer manipulation, conditional execution,
 * and file operations
 */
export const MiscUtil = Object.freeze({
  isMobileVr,
  isMobile,
  isIOS,
  isSafari,
  preventDefaultForDesktopOnly,
  isObject,
  fillTemplate,
  isNode,
  concatArrayBuffers,
  concatArrayBuffers2,
  addLineNumberToCode,
  downloadArrayBuffer,
  downloadTypedArray,
});
