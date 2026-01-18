import { Is } from './Is';

// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain using WeakMap-based storage.
 * This interface provides methods to safely access values that may or may not exist,
 * similar to Option types in functional programming languages.
 *
 * @template B - The base object type used as a key in the WeakMap
 * @template T - The type of the value being stored
 */
const errorStr = 'The value does not exist!';
export interface IWeakOption<B extends object, T> {
  /**
   * Unwraps the value or returns a default value if it doesn't exist.
   *
   * @param base - The base object used as a key
   * @param altValue - The alternative value to return if the value doesn't exist
   * @returns The stored value or the alternative value
   */
  unwrapOrDefault(base: B, altValue: T): T;

  /**
   * Unwraps the value or executes a function to get an alternative value.
   *
   * @param base - The base object used as a key
   * @param f - Function to execute if the value doesn't exist
   * @returns The stored value or the result of the function
   */
  unwrapOrElse(base: B, f: (...vals: any) => T): T;

  /**
   * Forcefully unwraps the value, throwing an error if it doesn't exist.
   *
   * @param base - The base object used as a key
   * @returns The stored value
   * @throws {ReferenceError} When the value doesn't exist
   */
  unwrapForce(base: B): T;

  /**
   * Unwraps the value or returns undefined if it doesn't exist.
   *
   * @param base - The base object used as a key
   * @returns The stored value or undefined
   */
  unwrapOrUndefined(base: B): T | undefined;

  /**
   * Checks if a value exists for the given base object.
   *
   * @param base - The base object used as a key
   * @returns True if the value exists, false otherwise
   */
  has(base: B): boolean;
}

/**
 * A WeakMap-based implementation of the Option pattern for handling optional values.
 * This class provides safe access to values that may or may not exist, using WeakMap
 * for automatic garbage collection when the base object is no longer referenced.
 *
 * @template B - The base object type used as a key in the WeakMap
 * @template T - The type of the value being stored
 *
 * @example
 * ```typescript
 * const option = new WeakOption<MyObject, string>();
 * const obj = new MyObject();
 * option.set(obj, "hello");
 * const value = option.unwrapOrDefault(obj, "default"); // Returns "hello"
 * ```
 */
export class WeakOption<B extends object, T> implements IWeakOption<B, T> {
  private __weakMap: WeakMap<B, T> = new WeakMap();

  /**
   * Sets a value for the given base object.
   *
   * @param base - The base object to use as a key
   * @param val - The value to store
   */
  set(base: B, val: T) {
    this.__weakMap.set(base, val);
  }

  /**
   * Unwraps the value or returns a default value if it doesn't exist.
   *
   * @param base - The base object used as a key
   * @param altValue - The alternative value to return if the value doesn't exist
   * @returns The stored value or the alternative value
   */
  unwrapOrDefault(base: B, altValue: T): T {
    const value = this.__weakMap.get(base);
    return Is.exist(value) ? value : altValue;
  }

  /**
   * Unwraps the value or executes a function to get an alternative value.
   *
   * @param base - The base object used as a key
   * @param f - Function to execute if the value doesn't exist
   * @returns The stored value or the result of the function
   */
  unwrapOrElse(base: B, f: (...vals: any) => T): T {
    const value = this.__weakMap.get(base);
    return Is.exist(value) ? value : f();
  }

  /**
   * Forcefully unwraps the value, throwing an error if it doesn't exist.
   *
   * @param base - The base object used as a key
   * @returns The stored value
   * @throws {ReferenceError} When the value doesn't exist
   */
  unwrapForce(base: B): T {
    const value = this.__weakMap.get(base);
    if (Is.exist(value)) {
      return value;
    }
    throw new ReferenceError(errorStr);
  }

  /**
   * Unwraps the value or returns undefined if it doesn't exist.
   *
   * @param base - The base object used as a key
   * @returns The stored value or undefined
   */
  unwrapOrUndefined(base: B): T | undefined {
    return this.__weakMap.get(base);
  }

  /**
   * Checks if a value exists for the given base object.
   *
   * @param base - The base object used as a key
   * @returns True if the value exists, false otherwise
   */
  has(base: B): boolean {
    return this.__weakMap.has(base);
  }
}

/**
 * A WeakMap-based implementation representing a value that definitely exists.
 * This class is used when you know a value exists and want to provide
 * type-safe access to it through the WeakOption interface.
 *
 * @template B - The base object type used as a key in the WeakMap
 * @template T - The type of the value being stored
 *
 * @example
 * ```typescript
 * const obj = new MyObject();
 * const some = new WeakSome(obj, "definite value");
 * const value = some.unwrapForce(obj); // Always returns "definite value"
 * ```
 */
export class WeakSome<B extends object, T> implements IWeakOption<B, T> {
  private __weakMap: WeakMap<B, T> = new WeakMap();

  /**
   * Creates a new WeakSome instance with a guaranteed value.
   *
   * @param base - The base object to use as a key
   * @param value - The value to store (guaranteed to exist)
   */
  constructor(base: B, value: T) {
    this.__weakMap.set(base, value);
  }

  /**
   * Unwraps the value, ignoring the alternative value since this value always exists.
   *
   * @param base - The base object used as a key
   * @param altValue - The alternative value (ignored)
   * @returns The stored value
   */
  unwrapOrDefault(base: B, _altValue: T): T {
    return this.__weakMap.get(base)!;
  }

  /**
   * Unwraps the value, ignoring the function since this value always exists.
   *
   * @param base - The base object used as a key
   * @param f - Function to execute (ignored)
   * @returns The stored value
   */
  unwrapOrElse(base: B, _f: (value: T) => T): T {
    return this.__weakMap.get(base)!;
  }

  /**
   * Forcefully unwraps the value (always succeeds since the value exists).
   *
   * @param base - The base object used as a key
   * @returns The stored value
   */
  unwrapForce(base: B): T {
    return this.__weakMap.get(base)!;
  }

  /**
   * Gets the value directly (convenience method).
   *
   * @param base - The base object used as a key
   * @returns The stored value
   */
  get(base: B): T {
    return this.__weakMap.get(base)!;
  }

  /**
   * Unwraps the value or returns undefined (always returns the value).
   *
   * @param base - The base object used as a key
   * @returns The stored value
   */
  unwrapOrUndefined(base: B): T | undefined {
    return this.__weakMap.get(base);
  }

  /**
   * Checks if a value exists (always returns true).
   *
   * @param base - The base object used as a key (unused)
   * @returns Always true
   */
  has(_base: B): true {
    return true;
  }
}

/**
 * A class representing the absence of a value in the WeakOption pattern.
 * This class implements the "None" case of the Option pattern, providing
 * safe handling when no value exists.
 *
 * @template B - The base object type used as a key
 *
 * @example
 * ```typescript
 * const none = new WeakNone<MyObject>();
 * const obj = new MyObject();
 * const value = none.unwrapOrDefault(obj, "default"); // Always returns "default"
 * ```
 */
export class WeakNone<B extends object> implements IWeakOption<B, never> {
  /**
   * Returns this instance (for chaining operations).
   *
   * @returns This WeakNone instance
   */
  then(): WeakNone<B> {
    return this;
  }

  /**
   * Returns the default value since no value exists.
   *
   * @template T - The type of the default value
   * @param base - The base object used as a key (unused)
   * @param value - The default value to return
   * @returns The default value
   */
  unwrapOrDefault<T>(_base: B, value: T): T {
    return value;
  }

  /**
   * Executes the function since no value exists.
   *
   * @param base - The base object used as a key (unused)
   * @param f - Function to execute
   * @returns The result of the function
   */
  unwrapOrElse(_base: B, f: (...vals: any) => never): never {
    return f(undefined as never);
  }

  /**
   * Throws an error since no value exists.
   *
   * @param base - The base object used as a key (unused)
   * @throws {ReferenceError} Always throws since no value exists
   */
  unwrapForce(_base: B): never {
    throw new ReferenceError(errorStr);
  }

  /**
   * Returns undefined since no value exists.
   *
   * @param base - The base object used as a key (unused)
   * @returns Always undefined
   */
  unwrapOrUndefined(_base: B): never {
    return undefined as never;
  }

  /**
   * Checks if a value exists (always returns false).
   *
   * @returns Always false
   */
  has(): false {
    return false;
  }
}
