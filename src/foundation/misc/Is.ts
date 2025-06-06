// Inspired by https://github.com/enricomarino/is
type FnType = (val: unknown) => boolean;

/**
 * A utility object containing various type checking and validation functions.
 * Provides methods to check if values are defined, null, functions, truthy/falsy, etc.
 * Also includes derivative methods like `not`, `all`, and `any` for more complex validations.
 */
export const IsObj = {
  /**
   * Checks if a value is defined (not undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not undefined
   */
  defined(val: unknown, ...args: unknown[]): val is Exclude<Object, undefined> {
    return val !== void 0;
  },

  /**
   * Checks if a value is undefined.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is undefined
   */
  undefined(val: unknown, ...args: unknown[]): val is undefined {
    return val === void 0;
  },

  /**
   * Checks if a value is null.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is null
   */
  null(val: unknown, ...args: unknown[]): val is null {
    return val === null;
  },

  /**
   * Checks if a value exists (is neither null nor undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not null and not undefined
   */
  exist(val?: unknown, ...args: unknown[]): val is Object {
    return val !== null && val !== undefined;
  },

  /**
   * Checks if a value is a function.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is a function
   */
  function(val: unknown, ...args: unknown[]): val is Function {
    return typeof val === 'function';
  },

  /**
   * Checks if a value is strictly equal to true.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is exactly true
   */
  true(val: unknown, ...args: unknown[]): boolean {
    return val === true;
  },

  /**
   * Checks if a value is truthy (converts to true in boolean context).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is truthy
   */
  truly(val: unknown, ...args: unknown[]): boolean {
    return !!val;
  },

  /**
   * Checks if a value is strictly equal to false.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is exactly false
   */
  false(val: unknown, ...args: unknown[]): boolean {
    return val === false;
  },

  /**
   * Checks if a value is falsy (converts to false in boolean context).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is falsy
   */
  falsy(val: unknown, ...args: unknown[]): boolean {
    return !val;
  },

  /**
   * Checks if a string contains another string.
   * @param thisStr - The string to search in
   * @param queryStr - The string to search for
   * @returns True if thisStr contains queryStr
   */
  stringContaining(thisStr: string, queryStr: string): boolean {
    return thisStr.indexOf(queryStr) !== -1;
  },
};

/**
 * Derivative functions that modify the behavior of base validation functions.
 * Provides `not`, `all`, and `any` modifiers for more complex validation scenarios.
 */
const Derivatives = {
  /**
   * Creates a negated version of a validation function.
   * @param fn - The function to negate
   * @returns A function that returns the opposite result of the input function
   */
  not(fn: FnType) {
    // biome-ignore lint/complexity/useArrowFunction: <explanation>
    return function () {
      return fn.apply(null, [...arguments] as any);
    };
  },

  /**
   * Creates a function that checks if all values pass the validation.
   * @param fn - The validation function to apply to all values
   * @returns A function that returns true if all values pass validation
   */
  all(fn: FnType) {
    // biome-ignore lint/complexity/useArrowFunction: <explanation>
    return function () {
      if (Array.isArray(arguments[0])) {
        return arguments[0].every(fn);
      }
      return [...arguments].every(fn);
    };
  },

  /**
   * Creates a function that checks if any value passes the validation.
   * @param fn - The validation function to apply to values
   * @returns A function that returns true if any value passes validation
   */
  any(fn: FnType) {
    // biome-ignore lint/complexity/useArrowFunction: <explanation>
    return function () {
      if (Array.isArray(arguments[0])) {
        return arguments[0].some(fn);
      }
      return [...arguments].some(fn);
    };
  },
};

/**
 * Negated versions of the base validation functions.
 * Each method returns the opposite result of its corresponding method in IsObj.
 */
const NotObj = {
  /**
   * Checks if a value is undefined (negated version of defined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is undefined
   */
  defined(val: unknown, ...args: unknown[]): val is undefined {
    return val === void 0;
  },

  /**
   * Checks if a value is defined (negated version of undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not undefined
   */
  undefined(val: unknown, ...args: unknown[]): val is Object {
    return val !== void 0;
  },

  /**
   * Checks if a value is not null.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not null
   */
  null(val: unknown, ...args: unknown[]): val is Object {
    return val !== null;
  },

  /**
   * Checks if a value does not exist (is null or undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is null or undefined
   */
  exist(val?: unknown, ...args: unknown[]): val is undefined | null {
    return val === null || val === undefined;
  },

  /**
   * Checks if a value is not a function.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not a function
   */
  function(val: unknown, ...args: unknown[]): val is Exclude<unknown, Function> {
    return typeof val !== 'function';
  },

  /**
   * Checks if a value is not strictly equal to true.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not exactly true
   */
  true(val: unknown, ...args: unknown[]): boolean {
    return val !== true;
  },

  /**
   * Checks if a value is not truthy (negated version of truly).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not truthy
   */
  truly(val: unknown, ...args: unknown[]): boolean {
    return !val;
  },

  /**
   * Checks if a value is not strictly equal to false.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not exactly false
   */
  false(val: unknown, ...args: unknown[]): boolean {
    return val !== false;
  },

  /**
   * Checks if a value is not falsy (negated version of falsy).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not falsy
   */
  falsy(val: unknown, ...args: unknown[]): boolean {
    return !!val;
  },
};

type IsImplType = typeof IsObj;
// interface IsImplType {
//   [s: string]: {[s: string]: FnType};
// }

/**
 * Extended interface that includes the base validation methods plus derivative methods.
 * Provides `not`, `all`, and `any` modifiers for complex validation scenarios.
 */
export interface IsType extends IsImplType {
  not: typeof NotObj;
  all: typeof IsObj;
  any: typeof IsObj;
}

// Add derivatives to the IsObj
for (const subFn in Derivatives) {
  if (Object.prototype.hasOwnProperty.call(Derivatives, subFn)) {
    (IsObj as any)[subFn] = {} as typeof IsObj;
    for (const fn in IsObj) {
      if (Object.prototype.hasOwnProperty.call(IsObj, fn)) {
        if (subFn === 'not') {
          (IsObj as any)[subFn][fn] = (Derivatives as any)[subFn]((NotObj as never)[fn]);
        } else {
          (IsObj as any)[subFn][fn] = (Derivatives as any)[subFn]((IsObj as never)[fn]);
        }
      }
    }
  }
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
export const Is = IsObj as IsType;
