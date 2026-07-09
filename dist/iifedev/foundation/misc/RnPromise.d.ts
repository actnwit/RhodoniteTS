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
export declare class RnPromise<T> extends Promise<T> {
    private __promise;
    private __callback?;
    name: string;
    private __callbackObj;
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
    /**
     * Creates a Promise that resolves when all input promises resolve, with optional progress callback.
     * The callback function is called whenever a promise in the array resolves or rejects,
     * providing real-time progress information.
     *
     * @param promises - Array of promises to wait for
     * @param callback - Optional callback function to monitor progress
     * @returns A Promise that resolves with an array of all resolved values
     */
    static all(promises: any[], callback?: RnPromiseCallback): RnPromise<any[]>;
    /**
     * Creates a Promise that resolves or rejects as soon as one of the input promises resolves or rejects.
     *
     * @param args - Array of promises to race
     * @returns A Promise that resolves or rejects with the value/reason of the first settled promise
     */
    static race(args: any[]): RnPromise<any>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * This method also handles progress tracking when used with Promise.all and a callback.
     *
     * @param onfulfilled - The callback to execute when the Promise is resolved
     * @param onrejected - The callback to execute when the Promise is rejected
     * @returns A Promise for the completion of which ever callback is executed
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): RnPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     *
     * @param onRejected - The callback to execute when the Promise is rejected
     * @returns A Promise for the completion of the callback
     */
    catch(onRejected?: any): RnPromise<T>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected).
     * The resolved value cannot be modified from the callback.
     *
     * @param onFinally - The callback to execute when the Promise is settled
     * @returns A Promise for the completion of the callback
     */
    finally(onFinally?: OnFinallyFn): Promise<T>;
    /**
     * Creates a Promise that is rejected with the given error.
     *
     * @param e - The error to reject with
     * @returns A rejected Promise
     */
    static reject(e: Error): RnPromise<never>;
}
export {};
