type PromiseFn<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;
type OnFinallyFn = (() => void) | null | undefined;

/**
 * Callback object containing information about Promise.all execution progress
 */
export type RnPromiseCallbackObj = {
  /** Total number of promises in Promise.all */
  promiseAllNum: number;
  /** Number of resolved promises */
  resolvedNum: number;
  /** Number of rejected promises */
  rejectedNum: number;
  /** Number of pending promises */
  pendingNum: number;
  /** Array of processed promises */
  processedPromises: any[];
};

/**
 * Callback function type for monitoring Promise.all progress
 */
export type RnPromiseCallback = (obj: RnPromiseCallbackObj) => void;

/**
 * Extended Promise class that provides additional functionality including progress callbacks for Promise.all operations.
 * This class wraps the native Promise and adds monitoring capabilities for batch promise operations.
 *
 * @template T The type of the resolved value
 */
export class RnPromise<T> extends Promise<T> {
  private __promise: Promise<T | undefined>;
  private __callback?: Function;
  public name = '';
  private __callbackObj: RnPromiseCallbackObj = {
    promiseAllNum: 0,
    resolvedNum: 0,
    rejectedNum: 0,
    pendingNum: 0,
    processedPromises: [],
  };

  /**
   * Creates a new RnPromise instance from an existing Promise
   * @param promise - The Promise to wrap
   */
  constructor(promise: Promise<T>);

  /**
   * Creates a new RnPromise instance from a promise function
   * @param fn - The promise executor function
   */
  constructor(fn: PromiseFn<T>);

  constructor(arg: Promise<T> | PromiseFn<T>) {
    super((resolve, reject) => {});
    if (arg instanceof Promise) {
      this.__promise = arg;
    } else {
      this.__promise = new Promise(arg);
    }
  }

  /**
   * Creates a resolved RnPromise with no value
   * @returns A resolved Promise
   */
  static resolve<T>(): Promise<T>;

  /**
   * Creates a resolved RnPromise with the given value
   * @param arg - The value or Promise-like object to resolve with
   * @returns A resolved Promise
   */
  static resolve<T>(arg: T | PromiseLike<T>): Promise<T>;

  static resolve<T>(arg?: T | PromiseLike<T>) {
    if (arg instanceof Promise) {
      return new RnPromise(arg) as unknown as Promise<T>;
    }
    if (arg instanceof RnPromise) {
      return arg as unknown as Promise<T>;
    }
    if ((arg as any).then != null) {
      const rnPromise = new RnPromise((resolve, reject) => {
        resolve(arg);
      });
      rnPromise.then = (arg as any).then;
      return rnPromise as unknown as Promise<T>;
    }
    return new RnPromise((resolve, reject) => {
      resolve(arg);
    }) as unknown as Promise<T>;
  }

  /**
   * Creates a Promise that resolves when all input promises resolve, with optional progress callback.
   * The callback function is called whenever a promise in the array resolves or rejects,
   * providing real-time progress information.
   *
   * @param promises - Array of promises to wait for
   * @param callback - Optional callback function to monitor progress
   * @returns A Promise that resolves with an array of all resolved values
   */
  static all(promises: any[], callback?: RnPromiseCallback) {
    if (callback) {
      const rnPromises = [];
      const callbackObj: RnPromiseCallbackObj = {
        promiseAllNum: promises.length,
        resolvedNum: 0,
        rejectedNum: 0,
        pendingNum: promises.length,
        processedPromises: [],
      };

      for (const promise of promises) {
        const rnPromise = RnPromise.resolve(promise) as unknown as RnPromise<any>;
        rnPromise.__callback = callback;
        rnPromise.__callbackObj = callbackObj;
        rnPromises.push(rnPromise);
      }
      return new RnPromise(Promise.all(rnPromises as any));
    }
    return new RnPromise(Promise.all(promises));
  }

  /**
   * Creates a Promise that resolves or rejects as soon as one of the input promises resolves or rejects.
   *
   * @param args - Array of promises to race
   * @returns A Promise that resolves or rejects with the value/reason of the first settled promise
   */
  static race(args: any[]) {
    return new RnPromise(Promise.race(args));
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * This method also handles progress tracking when used with Promise.all and a callback.
   *
   * @param onfulfilled - The callback to execute when the Promise is resolved
   * @param onrejected - The callback to execute when the Promise is rejected
   * @returns A Promise for the completion of which ever callback is executed
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): RnPromise<TResult1 | TResult2> {
    let onFulfilledWrapper;
    if (onfulfilled) {
      onFulfilledWrapper = (value: T | undefined) => {
        if (this.__callbackObj.promiseAllNum !== 0 && this.__callbackObj.processedPromises.indexOf(this) === -1) {
          this.__callbackObj.pendingNum--;
          this.__callbackObj.resolvedNum++;
          this.__callbackObj.processedPromises.push(this);
        }
        if (this.__callback) {
          this.__callback(this.__callbackObj);
        }
        return onfulfilled(value!);
      };
    }
    return this.__promise.then(onFulfilledWrapper, onrejected) as RnPromise<TResult1 | TResult2>;
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   *
   * @param onRejected - The callback to execute when the Promise is rejected
   * @returns A Promise for the completion of the callback
   */
  catch(onRejected?: any): RnPromise<T> {
    return new RnPromise(this.__promise.catch(onRejected)) as RnPromise<T>;
  }

  /**
   * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected).
   * The resolved value cannot be modified from the callback.
   *
   * @param onFinally - The callback to execute when the Promise is settled
   * @returns A Promise for the completion of the callback
   */
  finally(onFinally?: OnFinallyFn) {
    return this.__promise.finally(onFinally) as unknown as Promise<T>;
  }

  /**
   * Creates a Promise that is rejected with the given error.
   *
   * @param e - The error to reject with
   * @returns A rejected Promise
   */
  static reject(e: Error) {
    return new RnPromise(Promise.reject(e));
  }
}
