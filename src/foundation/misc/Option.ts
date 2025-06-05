// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 * This provides a type-safe way to work with nullable values without explicit null checks.
 *
 * @template T The type of the value that may or may not exist
 */

const errorStr = 'The value does not exist!';
interface IOption<T> {
  /**
   * Applies a function to the contained value if it exists, otherwise returns None.
   * This is a monadic bind operation for chaining optional computations.
   *
   * @template U The type of the value returned by the function
   * @param f Function to apply to the contained value
   * @returns A new Option containing the result of the function, or None if this Option is None
   */
  andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>>;

  /**
   * Returns this Option if it contains a value, otherwise returns the result of the provided function.
   * This provides a way to chain alternative Option computations.
   *
   * @template U The type of the alternative Option
   * @param f Function that returns an alternative Option
   * @returns This Option if it has a value, otherwise the result of f()
   */
  orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;

  /**
   * Pattern matches on the Option, executing the appropriate function based on whether it contains a value.
   * This provides a functional way to handle both Some and None cases.
   *
   * @template U The return type of the match functions
   * @param obj Object containing Some and None handler functions
   * @returns The result of executing the appropriate handler function
   */
  match<U>(obj: {
    Some: (value: NonNullable<T>) => NonNullable<U> | U;
    None: () => NonNullable<U> | U;
  }): NonNullable<U> | U;

  /**
   * Returns the contained value if it exists, otherwise returns the provided default value.
   *
   * @param altValue The default value to return if this Option is None
   * @returns The contained value or the default value
   */
  unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T>;

  /**
   * Returns the contained value if it exists, otherwise returns the result of the provided function.
   *
   * @param f Function that returns a default value
   * @returns The contained value or the result of f()
   */
  unwrapOrElse(f: () => NonNullable<T>): NonNullable<T>;

  /**
   * Returns the contained value if it exists, otherwise returns undefined.
   * This is useful for interoperability with standard JavaScript nullable patterns.
   *
   * @returns The contained value or undefined
   */
  unwrapOrUndefined(): NonNullable<T> | undefined;

  /**
   * Returns the contained value, throwing an error if it doesn't exist.
   * Use this only when you're certain the value exists.
   *
   * @throws {ReferenceError} If the Option is None
   * @returns The contained value
   */
  unwrapForce(): NonNullable<T>;

  /**
   * Type guard that checks if this Option contains a value.
   *
   * @returns true if this is a Some instance, false if None
   */
  has(): this is Some<NonNullable<T>>;

  /**
   * Type guard that checks if this Option does not contain a value.
   *
   * @returns true if this is a None instance, false if Some
   */
  doesNotHave(): this is None;
}

/**
 * A class representing an Option that contains a value.
 * This is the "Some" variant of the Option type, indicating that a value exists.
 *
 * @template T The type of the contained value
 */
export class Some<T> implements IOption<T> {
  /**
   * Creates a new Some instance with the provided value.
   *
   * @param value The non-null value to wrap
   */
  constructor(private value: NonNullable<T>) {}

  /**
   * Applies a function to the contained value and returns the result.
   * This method is essentially the same as Some::and_then() in Rust language.
   *
   * @template U The type of the value returned by the function
   * @param f Function to apply to the contained value
   * @returns The result of applying f to the contained value
   */
  andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return f(this.value);
  }

  /**
   * Returns this Some instance, ignoring the provided function.
   * Since this Option already contains a value, the alternative is not needed.
   *
   * @template U The type of the alternative Option (unused)
   * @param f Function that returns an alternative Option (unused)
   * @returns This Some instance cast to the appropriate type
   */
  orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return this as Option<NonNullable<U>>;
  }

  /**
   * Executes the Some handler function with the contained value.
   *
   * @template U The return type of the match functions
   * @param obj Object containing Some and None handler functions
   * @returns The result of executing obj.Some with the contained value
   */
  match<U>(obj: {
    Some: (value: NonNullable<T>) => NonNullable<U> | U;
    None: () => NonNullable<U> | U;
  }): NonNullable<U> | U {
    return obj.Some(this.value);
  }

  /**
   * Returns the contained value, ignoring the provided default.
   * Since this Option contains a value, the alternative is not needed.
   *
   * @param altValue The default value (unused)
   * @returns The contained value
   */
  unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T> {
    return this.value;
  }

  /**
   * Returns the contained value, ignoring the provided function.
   * Since this Option contains a value, the alternative is not needed.
   *
   * @param f Function that returns a default value (unused)
   * @returns The contained value
   */
  unwrapOrElse(f: () => NonNullable<T>): NonNullable<T> {
    return this.value;
  }

  /**
   * Returns the contained value.
   * This method never throws since Some always contains a value.
   *
   * @returns The contained value
   */
  unwrapForce(): NonNullable<T> {
    return this.value;
  }

  /**
   * Returns the contained value.
   * This method never returns undefined since Some always contains a value.
   *
   * @returns The contained value
   */
  unwrapOrUndefined(): NonNullable<T> | undefined {
    return this.value;
  }

  /**
   * Gets the contained value directly.
   * This is a convenience method for accessing the wrapped value.
   *
   * @returns The contained value
   */
  get(): NonNullable<T> {
    return this.value;
  }

  /**
   * Type guard that always returns true for Some instances.
   *
   * @returns Always true, indicating this Option contains a value
   */
  has(): this is Some<NonNullable<T>> {
    return true;
  }

  /**
   * Type guard that always returns false for Some instances.
   *
   * @returns Always false, indicating this Option contains a value
   */
  doesNotHave(): this is None {
    return false;
  }
}

/**
 * A class representing an Option that does not contain a value.
 * This is the "None" variant of the Option type, indicating the absence of a value.
 */
export class None implements IOption<never> {
  /**
   * Returns this None instance, ignoring the provided function.
   * Since there's no value to apply the function to, None is returned.
   *
   * @template U The type of the value that would be returned by the function
   * @param f Function to apply (unused)
   * @returns This None instance
   */
  andThen<U>(f: (value: never) => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return this;
  }

  /**
   * Returns the result of the provided function since this Option has no value.
   * This provides an alternative Option when the current one is None.
   *
   * @template U The type of the alternative Option
   * @param f Function that returns an alternative Option
   * @returns The result of executing f()
   */
  orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return f();
  }

  /**
   * Executes the None handler function since this Option contains no value.
   *
   * @template U The return type of the match functions
   * @param obj Object containing Some and None handler functions
   * @returns The result of executing obj.None
   */
  match<U>(obj: {
    Some: (value: NonNullable<never>) => NonNullable<U> | U;
    None: () => NonNullable<U> | U;
  }): NonNullable<U> | U {
    return obj.None();
  }

  /**
   * Returns the provided default value since this Option contains no value.
   *
   * @template T The type of the default value
   * @param value The default value to return
   * @returns The provided default value
   */
  unwrapOrDefault<T>(value: NonNullable<T>): NonNullable<T> {
    return value;
  }

  /**
   * Returns the result of the provided function since this Option contains no value.
   *
   * @template T The type of the value returned by the function
   * @param f Function that returns a default value
   * @returns The result of executing f()
   */
  unwrapOrElse<T>(f: () => NonNullable<T>): NonNullable<T> {
    return f();
  }

  /**
   * Throws an error since this Option contains no value.
   * This method should only be called when you're certain the Option contains a value.
   *
   * @throws {ReferenceError} Always throws since None has no value
   * @returns Never returns (always throws)
   */
  unwrapForce(): never {
    throw new ReferenceError(errorStr);
  }

  /**
   * Returns undefined since this Option contains no value.
   * This provides interoperability with standard JavaScript nullable patterns.
   *
   * @returns Always undefined
   */
  unwrapOrUndefined(): never {
    return undefined as never;
  }

  /**
   * Type guard that always returns false for None instances.
   *
   * @returns Always false, indicating this Option contains no value
   */
  has(): this is Some<never> {
    return false;
  }

  /**
   * Type guard that always returns true for None instances.
   *
   * @returns Always true, indicating this Option contains no value
   */
  doesNotHave(): this is None {
    return true;
  }
}

/**
 * Union type representing either a Some or None value.
 * This is the main Option type that provides type-safe nullable value handling.
 *
 * @template T The type of the value that may or may not exist
 */
export type Option<T> = Some<T> | None;

/**
 * Assertion function that throws if the provided Option is None.
 * This is useful for cases where you need to assert that an Option contains a value.
 *
 * @param value The Option to check
 * @throws {ReferenceError} If the Option is None
 */
export function assertHas(value: Option<any>): asserts value is Some<any> {
  if (!value.has()) {
    throw new ReferenceError(errorStr);
  }
}

/**
 * Assertion function that throws if the provided Option is Some.
 * This is useful for cases where you need to assert that an Option does not contain a value.
 *
 * @param value The Option to check
 * @throws {ReferenceError} If the Option is Some
 */
export function assertDoesNotHave(value: Option<any>): asserts value is None {
  if (value.has()) {
    throw new ReferenceError(errorStr);
  }
}
