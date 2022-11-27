export declare class Time {
    private static __currentProcessBeginTime;
    private static __lastProcessEndTime;
    private static __lastTickTimeInterval;
    private static __systemStartTime;
    /**
     * @internal
     */
    static _processBegin(): void;
    /**
     * @internal
     */
    static _processEnd(): void;
    static get timeFromSystemStart(): number;
    static get lastTickTimeInterval(): number;
}
