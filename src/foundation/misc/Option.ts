// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 */

const errorStr = 'The value does not exist!';
interface IOption<T> {
  // do the "f" function for
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
export class Some<T> implements IOption<T> {
  constructor(private value: NonNullable<T>) {}

  /**
   * This method is essentially same to the Some::and_then() in Rust language
   * @param f
   */
  andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return f(this.value);
  }

  orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return this as Option<NonNullable<U>>;
  }

  match<U>(obj: {
    Some: (value: NonNullable<T>) => NonNullable<U> | U;
    None: () => NonNullable<U> | U;
  }): NonNullable<U> | U {
    return obj.Some(this.value);
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T> {
    return this.value;
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapOrElse(f: () => NonNullable<T>): NonNullable<T> {
    return this.value;
  }

  /**
   * @param altValue
   * @returns
   */
  unwrapForce(): NonNullable<T> {
    return this.value;
  }

  unwrapOrUndefined(): NonNullable<T> | undefined {
    return this.value;
  }

  get(): NonNullable<T> {
    return this.value;
  }

  has(): this is Some<NonNullable<T>> {
    return true;
  }

  doesNotHave(): this is None {
    return false;
  }
}

/**
 * a class indicating no existence.
 */
export class None implements IOption<never> {
  andThen<U>(f: (value: never) => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return this;
  }

  orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>> {
    return f();
  }

  match<U>(obj: {
    Some: (value: NonNullable<never>) => NonNullable<U> | U;
    None: () => NonNullable<U> | U;
  }): NonNullable<U> | U {
    return obj.None();
  }

  unwrapOrDefault<T>(value: NonNullable<T>): NonNullable<T> {
    return value;
  }

  unwrapOrElse<T>(f: () => NonNullable<T>): NonNullable<T> {
    return f();
  }

  unwrapForce(): never {
    throw new ReferenceError(errorStr);
  }

  unwrapOrUndefined(): never {
    return undefined as never;
  }

  has(): this is Some<never> {
    return false;
  }

  doesNotHave(): this is None {
    return true;
  }
}

export type Option<T> = Some<T> | None;

export function assertHas(value: Option<any>): asserts value is Some<any> {
  if (!value.has()) {
    throw new ReferenceError(errorStr);
  }
}

export function assertDoesNotHave(value: Option<any>): asserts value is None {
  if (value.has()) {
    throw new ReferenceError(errorStr);
  }
}
