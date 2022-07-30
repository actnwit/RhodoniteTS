declare type PromiseFn<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;
declare type OnFinallyFn = (() => void) | null | undefined;
export declare type RnPromiseCallbackObj = {
    promiseAllNum: number;
    resolvedNum: number;
    rejectedNum: number;
    pendingNum: number;
    processedPromises: any[];
};
export declare type RnPromiseCallback = (obj: RnPromiseCallbackObj) => void;
export declare class RnPromise<T> extends Promise<T> {
    private __promise;
    private __callback?;
    name: string;
    private __callbackObj;
    constructor(promise: Promise<T>);
    constructor(fn: PromiseFn<T>);
    static resolve<T>(): Promise<T>;
    static resolve<T>(arg: T | PromiseLike<T>): Promise<T>;
    static all(promises: any[], callback?: RnPromiseCallback): RnPromise<any[]>;
    static race(args: any[]): RnPromise<any>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): RnPromise<TResult1 | TResult2>;
    catch(onRejected?: any): RnPromise<T>;
    finally(onFinally?: OnFinallyFn): Promise<T>;
    static reject(e: Error): RnPromise<never>;
}
export {};
