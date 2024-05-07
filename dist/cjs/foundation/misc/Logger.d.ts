export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Log = 2,
    Warning = 3,
    Error = 4,
    Assert = 5
}
export declare class Logger {
    private static __messages;
    private static __common;
    static log(message: string): void;
    static warn(message: string): void;
    static error(message: string): void;
    static info(message: string): void;
    static debug(message: string): void;
    static assert(condition: boolean, message: string): void;
}
