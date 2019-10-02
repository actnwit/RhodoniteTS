export default class Time {
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
    static readonly timeFromSystemStart: number;
    static readonly lastTickTimeInterval: number;
}
