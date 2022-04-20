type PromiseFn<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void;
type OnFinallyFn = (() => void) | null | undefined;

export type RnPromiseCallbackObj = {
  promiseAllNum: number;
  resolvedNum: number;
  rejectedNum: number;
  pendingNum: number;
  processedPromises: any[];
};
export type RnPromiseCallback = (obj: RnPromiseCallbackObj) => void;

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

  constructor(promise: Promise<T>);
  constructor(fn: PromiseFn<T>);
  constructor(arg: Promise<T> | PromiseFn<T>) {
    super((resolve, reject) => {});
    if (arg instanceof Promise) {
      this.__promise = arg;
    } else {
      this.__promise = new Promise(arg);
    }
  }

  static resolve<T>(): Promise<T>;
  static resolve<T>(arg: T | PromiseLike<T>): Promise<T>;
  static resolve<T>(arg?: T | PromiseLike<T>) {
    if (arg instanceof Promise) {
      return new RnPromise(arg) as unknown as Promise<T>;
    } else if (arg instanceof RnPromise) {
      return arg as unknown as Promise<T>;
    } else if ((arg as any).then != null) {
      const rnPromise = new RnPromise((resolve, reject) => {
        resolve(arg);
      });
      rnPromise.then = (arg as any).then;
      return rnPromise as unknown as Promise<T>;
    } else {
      return new RnPromise((resolve, reject) => {
        resolve(arg);
      }) as unknown as Promise<T>;
    }
  }

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
        const rnPromise = RnPromise.resolve(
          promise
        ) as unknown as RnPromise<any>;
        rnPromise.__callback = callback;
        rnPromise.__callbackObj = callbackObj;
        rnPromises.push(rnPromise);
      }
      return new RnPromise(Promise.all(rnPromises as any));
    } else {
      return new RnPromise(Promise.all(promises));
    }
  }

  static race(args: any[]) {
    return new RnPromise(Promise.race(args));
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): RnPromise<TResult1 | TResult2> {
    let onFulfilledWrapper;
    if (onfulfilled) {
      onFulfilledWrapper = (value: T | undefined) => {
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
        return onfulfilled(value!);
      };
    }
    return this.__promise.then(onFulfilledWrapper, onrejected) as RnPromise<
      TResult1 | TResult2
    >;
  }

  catch(onRejected?: any): RnPromise<T> {
    return new RnPromise(this.__promise.catch(onRejected)) as RnPromise<T>;
  }

  finally(onFinally?: OnFinallyFn) {
    return this.__promise.finally(onFinally) as unknown as Promise<T>;
  }

  static reject(e: Error) {
    return new RnPromise(Promise.reject(e));
  }
}
