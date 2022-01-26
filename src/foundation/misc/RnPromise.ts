type ResolveArg<T> = T | PromiseLike<T|undefined> | undefined;
type PromiseFn<T> = (
  resolve: (value: ResolveArg<T>) => void,
  reject: (reason?: any) => void
) => void;
type OnFulfilledFn<T> = ((value: T) => T | PromiseLike<T>) | null | undefined;
type OnRejectedFn<T> = ((reason: any) => PromiseLike<never>) | null | undefined;
type OnFinallyFn = (() => void) | null | undefined;
export type CallbackObj = {
  promiseAllNum: number;
  resolvedNum: number;
  rejectedNum: number;
  pendingNum: number;
  processedPromises: any[];
};
export class RnPromise<T> {
  private __promise: Promise<T | undefined>;
  private __callback?: Function;
  public name = '';
  private __callbackObj: CallbackObj = {
    promiseAllNum: 0,
    resolvedNum: 0,
    rejectedNum: 0,
    pendingNum: 0,
    processedPromises: [],
  };

  constructor(promise: Promise<T>, callback?: Function);
  constructor(fn: PromiseFn<T>, callback?: Function);
  constructor(arg: Promise<T> | PromiseFn<T>, callback?: Function) {
    if (arg instanceof Promise) {
      this.__promise = arg;
    } else {
      this.__promise = new Promise(arg);
    }
    this.__callback = callback;
  }

  static resolve<T>(arg: any) {
    if (arg instanceof Promise) {
      return new RnPromise(arg);
    } else if (arg instanceof RnPromise) {
      return arg;
    } else if (arg.then != null) {
      const rnPromise = new RnPromise((resolve, reject) => {
        resolve(arg);
      });
      rnPromise.then = arg.then;
      return rnPromise;
    } else {
      return new RnPromise((resolve, reject) => {
        resolve(arg);
      });
    }
  }

  static all(args: any[]) {
    return new RnPromise(Promise.all(args));
  }

  static allWithProgressCallback(promises: any[], callback: Function) {
    const rnPromises = [];
    const callbackObj: CallbackObj = {
      promiseAllNum: promises.length,
      resolvedNum: 0,
      rejectedNum: 0,
      pendingNum: promises.length,
      processedPromises: [],
    };

    for (const promise of promises) {
      const rnPromise = RnPromise.resolve(promise);
      rnPromise.__callback = callback;
      rnPromise.__callbackObj = callbackObj;
      rnPromises.push(rnPromise);
    }
    return new RnPromise(Promise.all(promises as any));
  }

  static race(args: any[]) {
    return new RnPromise(Promise.race(args));
  }

  then(onFulfilled?: any, onRejected?: any) {
    const onFulfilledWrapper = (value: T | undefined) => {
      if (
        this.__callbackObj.promiseAllNum !== 0 &&
        this.__callbackObj.processedPromises.indexOf(this) === -1
      ) {
        this.__callbackObj.pendingNum--;
        this.__callbackObj.resolvedNum++;
        this.__callbackObj.processedPromises.push(this);
      }
      if (this.__callback) {
        this.__callback(this.__callbackObj);
      }
      if (onFulfilled) {
        onFulfilled(value);
      }
    };
    return new RnPromise(this.__promise.then(onFulfilledWrapper, onRejected));
  }

  catch(onRejected?: any) {
    return new RnPromise(this.__promise.catch(onRejected));
  }

  finally(onFinally?: OnFinallyFn) {
    this.__promise.finally(onFinally);
  }

  static reject(e: Error) {
    return new RnPromise(Promise.reject(e));
  }
}
