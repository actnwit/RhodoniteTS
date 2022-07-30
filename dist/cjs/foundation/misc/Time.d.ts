export declare class Time {
    private static __currentProcessBeginTime;
    private static __lastProcessEndTime;
    private static __lastTickTimeInterval;
    private static __systemStartTime;
    /**
     * @private
     */
    static _processBegin(): void;
    /**
     * @private
     */
    static _processEnd(): void;
    static get timeFromSystemStart(): number;
    static get lastTickTimeInterval(): number;
}
