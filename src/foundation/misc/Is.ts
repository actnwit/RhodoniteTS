/* eslint-disable prefer-rest-params */
// Inspired by https://github.com/enricomarino/is

type FnType = (val: unknown) => boolean;

const IsSubImpl = {
  not(fn: FnType) {
    return function () {
      /* eslint-disable prefer-spread */
      return !fn.apply(null, [...arguments] as never);
    };
  },

  all(fn: FnType) {
    return function () {
      if (Array.isArray(arguments[0])) {
        return arguments[0].every(fn);
      }
      return [...arguments].every(fn);
    };
  },

  any(fn: FnType) {
    return function () {
      if (Array.isArray(arguments[0])) {
        return arguments[0].some(fn);
      }
      return [...arguments].some(fn);
    };
  },
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const IsImpl = {
  defined(val: unknown, ...args: unknown[]): val is Exclude<Object, undefined> {
    return val !== void 0;
  },

  undefined(val: unknown, ...args: unknown[]): val is undefined {
    return val === void 0;
  },

  null(val: unknown, ...args: unknown[]): val is null {
    return val === null;
  },

  // is NOT null or undefined
  exist(val?: unknown, ...args: unknown[]): val is Object {
    // eslint-disable-next-line eqeqeq
    return val != null;
  },

  function(val: unknown, ...args: unknown[]): val is Function {
    return typeof val === 'function';
  },

  true(val: unknown, ...args: unknown[]): boolean {
    return val === true;
  },

  false(val: unknown, ...args: unknown[]): boolean {
    return val === false;
  },
};

const IsNotImpl = {
  defined(val: unknown, ...args: unknown[]): val is undefined {
    return val === void 0;
  },

  undefined(val: unknown, ...args: unknown[]): val is Object {
    return val !== void 0;
  },

  null(val: unknown, ...args: unknown[]): val is Object {
    return val !== null;
  },

  exist(val?: unknown, ...args: unknown[]): val is undefined|null {
    // eslint-disable-next-line eqeqeq
    return val == null;
  },

  function(val: unknown, ...args: unknown[]): val is Exclude<unknown, Function> {
    return typeof val !== 'function';
  },

  true(val: unknown, ...args: unknown[]): boolean {
    return val !== true;
  },

  false(val: unknown, ...args: unknown[]): boolean {
    return val !== false;
  },
};

type IsImplType = typeof IsImpl;

interface IsType extends IsImplType {
  not: typeof IsNotImpl;
  all: typeof IsImpl;
  any: typeof IsImpl;
}

for (const subFn in IsSubImpl) {
  if (Object.prototype.hasOwnProperty.call(IsSubImpl, subFn)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (IsImpl as any)[subFn] = {} as typeof IsImpl;
    for (const fn in IsImpl) {
      if (Object.prototype.hasOwnProperty.call(IsImpl, fn)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (subFn === 'not') {
          (IsImpl as any)[subFn][fn] = (IsSubImpl as any)[subFn](
            (IsNotImpl as never)[fn]
          );
        } else {
          (IsImpl as any)[subFn][fn] = (IsSubImpl as any)[subFn](
            (IsImpl as never)[fn]
          );
        }
      }
    }
  }
}

export const Is = IsImpl as IsType;
