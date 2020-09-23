declare type PromiseFn<T> = (resolve: (value?: T | PromiseLike<T> | undefined) => void, reject: (reason?: any) => void) => void;
declare type OnFinallyFn = (() => void) | null | undefined;
export declare type CallbackObj = {
    promiseAllNum: number;
    resolvedNum: number;
    rejectedNum: number;
    pendingNum: number;
    processedPromises: any[];
};
export default class RnPromise<T> {
    private __promise;
    private __callback?;
    name: string;
    private __callbackObj;
    constructor(promise: Promise<T>, callback?: Function);
    constructor(fn: PromiseFn<T>, callback?: Function);
    static resolve(arg: any): RnPromise<any>;
    static all(args: any[]): RnPromise<any[]>;
    static allWithProgressCallback(promises: any[], callback: Function): RnPromise<[unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown]>;
    static race(args: any[]): RnPromise<any>;
    then(onFulfilled?: any, onRejected?: any): RnPromise<void>;
    catch(onRejected?: any): RnPromise<T>;
    finally(onFinally?: OnFinallyFn): void;
    static reject(e: Error): RnPromise<never>;
}
export {};
