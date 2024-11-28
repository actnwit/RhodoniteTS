// Inspired from https://scleapt.com/typescript_option/

/**
 * An interface for handling values whose existence is uncertain.
 */

const errorStr = 'The value does not exist!';
interface IOption<T> {
  // do the "f" function for
  then(f: (value: NonNullable<T>) => IOption<NonNullable<T>>): IOption<NonNullable<T>>;
  then(f: (value: NonNullable<T>) => void): IOption<NonNullable<T>>;
  then<U>(f: (value: NonNullable<T>) => IOption<U>): IOption<U>;

  else(f: () => IOption<NonNullable<T>>): IOption<NonNullable<T>>;
  else(f: () => void): IOption<NonNullable<T>>;
  else<U>(f: () => IOption<NonNullable<U>>): IOption<NonNullable<U>>;

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
  then(f: (value: NonNullable<T>) => Option<NonNullable<T>>): Option<NonNullable<T>>;
  then(f: (value: NonNullable<T>) => void): Option<NonNullable<T>>;
  then<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>>;
  then<U>(
    f: (value: NonNullable<T>) => void | Option<NonNullable<T>> | Option<NonNullable<U>>
  ): Option<NonNullable<T>> | Option<NonNullable<U>> {
    return f(this.value) ?? this;
  }

  else(f: () => Option<NonNullable<T>>): Option<NonNullable<T>>;
  else(f: () => void): Option<NonNullable<T>>;
  else<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
  else<U>(
    f: () => void | Option<NonNullable<T>> | Option<NonNullable<U>>
  ): Option<NonNullable<T>> | Option<NonNullable<U>> {
    return this;
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
  then(f: (value: never) => Option<never>): Option<never>;
  then(f: (value: never) => void): Option<never>;
  then<U>(f: (value: never) => Option<U>): Option<U>;
  then<U>(f: (value: never) => void | Option<never> | Option<U>): Option<never> | Option<U> {
    return this;
  }

  else(f: () => Option<never>): Option<never>;
  else(f: () => void): Option<never>;
  else<U>(f: () => Option<U>): Option<U>;
  else<U>(f: () => void | Option<never> | Option<U>): Option<never> | Option<U> {
    return f() ?? this;
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
