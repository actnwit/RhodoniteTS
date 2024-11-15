export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Assert = 4
}
export declare class Logger {
    private static __messages;
    static logLevel: LogLevel;
    static isRichLog: boolean;
    static isAccumulateLog: boolean;
    private static __common;
    private static __clearAccumulatedLog;
    private static __formatLogs;
    private static __getLogLevelText;
    static error(message: string): string | undefined;
    static warn(message: string): string | undefined;
    static info(message: string): string | undefined;
    static debug(message: string): string | undefined;
    static assert(condition: boolean, message: string): string | undefined;
    static getAccumulatedLog(): string[];
}
