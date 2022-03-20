/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Inspired by https://github.com/enricomarino/is

type FnType = (val: unknown) => boolean;

export const IsObj = {
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
    return val !== null && val !== undefined;
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
  stringContaining(thisStr: string, queryStr: string): boolean {
    return thisStr.indexOf(queryStr) !== -1;
  },
};

const Derivatives = {
  not(fn: FnType) {
    return function () {
      return fn.apply(null, [...arguments] as any);
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

const NotObj = {
  defined(val: unknown, ...args: unknown[]): val is undefined {
    return val === void 0;
  },

  undefined(val: unknown, ...args: unknown[]): val is Object {
    return val !== void 0;
  },

  null(val: unknown, ...args: unknown[]): val is Object {
    return val !== null;
  },

  exist(val?: unknown, ...args: unknown[]): val is undefined | null {
    return val === null || val === undefined;
  },

  function(
    val: unknown,
    ...args: unknown[]
  ): val is Exclude<unknown, Function> {
    return typeof val !== 'function';
  },

  true(val: unknown, ...args: unknown[]): boolean {
    return val !== true;
  },

  false(val: unknown, ...args: unknown[]): boolean {
    return val !== false;
  },
};

type IsImplType = typeof IsObj;
// interface IsImplType {
//   [s: string]: {[s: string]: FnType};
// }

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
          (IsObj as any)[subFn][fn] = (Derivatives as any)[subFn](
            (NotObj as never)[fn]
          );
        } else {
          (IsObj as any)[subFn][fn] = (Derivatives as any)[subFn](
            (IsObj as never)[fn]
          );
        }
      }
    }
  }
}

export const Is = IsObj as IsType;
