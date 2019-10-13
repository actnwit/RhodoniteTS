type PromiseFn<T> = (resolve: (value?: T | PromiseLike<T> | undefined) => void, reject: (reason?: any) => void) => void;
type OnFulfilledFn<T> = ((value: T) => T | PromiseLike<T>) | null | undefined;
type OnRejectedFn<T> = ((reason: any) => PromiseLike<never>) | null | undefined;
type OnFinallyFn = (() => void) | null | undefined;

export default class RnPromise<T> {
  private __promise:Promise<T>;

  constructor(promise: Promise<T>);
  constructor(fn: PromiseFn<T>);
  constructor(arg: any) {
    if (arg instanceof Promise) {
      this.__promise = arg;
    } else {
      this.__promise = new Promise(arg);
    }
  }

  static resolve(arg: any) {
    if (arg instanceof Promise) {
      return new RnPromise(arg);
    } else if (arg instanceof RnPromise) {
      return arg;
    } else if (arg.then != null) {
      const rnPromise = new RnPromise((resolve, reject)=>{
        resolve(arg)
      });
      rnPromise.then = arg.then;
      return rnPromise;
    } else {
      return new RnPromise((resolve, reject)=>{
        resolve(arg)
      });
    }
  }

  static all(args: any[]) {
    return new RnPromise(Promise.all(args));
  }

  static race(args: any[]) {
    return new RnPromise(Promise.race(args));
  }

  then(onFulfilled?: OnFulfilledFn<T>, onRejected?: OnRejectedFn<T>) {
    return new RnPromise(this.__promise.then(onFulfilled, onRejected));
  }

  catch(onRejected?: OnRejectedFn<T>) {
    return new RnPromise(this.__promise.catch(onRejected));
  }

  finally(onFinally?: OnFinallyFn) {
    this.__promise.finally(onFinally);
  }

  static reject(e: Error) {
    return new RnPromise(Promise.reject(e));
  }
}
