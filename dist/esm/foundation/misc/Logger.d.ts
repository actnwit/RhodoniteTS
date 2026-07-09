/**
 * Enumeration of log levels in ascending order of severity.
 * Lower numeric values represent less severe log levels.
 */
export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Assert = 4
}
/**
 * A comprehensive logging utility class that provides various log levels,
 * message formatting, and log accumulation capabilities.
 *
 * Features:
 * - Multiple log levels (Debug, Info, Warn, Error, Assert)
 * - Rich formatting with timestamps
 * - Log accumulation for later retrieval
 * - Configurable log level filtering
 *
 * @example
 * ```typescript
 * // Create logger instance
 * const logger = new Logger();
 * logger.logLevel = LogLevel.Info;
 * logger.isRichLog = true;
 * logger.isAccumulateLog = true;
 *
 * // Use logging methods
 * logger.info("Application started");
 * logger.warn("This is a warning");
 * logger.error("An error occurred");
 *
 * // Retrieve accumulated logs
 * const logs = logger.getAccumulatedLog();
 * ```
 */
export declare class Logger {
    /** The default global Logger instance for code that doesn't have access to an Engine. */
    static readonly default: Logger;
    private __messages;
    /** The minimum log level that will be output. Messages below this level are ignored. */
    logLevel: LogLevel;
    /** Whether to format log messages with timestamps and log level prefixes. */
    isRichLog: boolean;
    /** Whether to store log messages in memory for later retrieval. */
    isAccumulateLog: boolean;
    /**
     * Common processing for all log methods. Handles message formatting and storage.
     *
     * @param message - The log message to process
     * @param logLevel - The severity level of the log message
     * @returns The formatted log message
     * @private
     */
    private __common;
    /**
     * Clears all accumulated log messages from memory.
     */
    clearAccumulatedLog(): void;
    /**
     * Formats a log entry with timestamp and log level information if rich logging is enabled.
     *
     * @param log - The log entry to format
     * @returns The formatted log message string
     * @private
     */
    private __formatLogs;
    /**
     * Converts a LogLevel enum value to its string representation.
     *
     * @param logLevel - The log level to convert
     * @returns The string name of the log level
     * @private
     */
    private __getLogLevelText;
    /**
     * Logs an error message to the console if the current log level permits it.
     * Error messages indicate serious problems that should be addressed immediately.
     *
     * @param message - The error message to log
     * @returns The formatted message if logged, undefined if filtered out
     *
     * @example
     * ```typescript
     * logger.error("Database connection failed");
     * ```
     */
    error(message: string): string | undefined;
    /**
     * Logs a warning message to the console if the current log level permits it.
     * Warning messages indicate potential issues that should be monitored.
     *
     * @param message - The warning message to log
     * @returns The formatted message if logged, undefined if filtered out
     *
     * @example
     * ```typescript
     * logger.warn("API response time is slower than expected");
     * ```
     */
    warn(message: string): string | undefined;
    /**
     * Logs an informational message to the console if the current log level permits it.
     * Info messages provide general information about application flow and state.
     *
     * @param message - The informational message to log
     * @returns The formatted message if logged, undefined if filtered out
     *
     * @example
     * ```typescript
     * logger.info("User authentication successful");
     * ```
     */
    info(message: string): string | undefined;
    /**
     * Logs a debug message to the console if the current log level permits it.
     * Debug messages provide detailed information useful for troubleshooting and development.
     *
     * @param message - The debug message to log
     * @returns The formatted message if logged, undefined if filtered out
     *
     * @example
     * ```typescript
     * logger.debug("Processing user input: " + JSON.stringify(input));
     * ```
     */
    debug(message: string): string | undefined;
    /**
     * Performs a console assertion and logs a message if the condition is false.
     * Assert messages are used for debugging and testing critical assumptions.
     *
     * @param condition - The condition to test; if false, the assertion fails
     * @param message - The message to log when the assertion fails
     * @returns The formatted message if logged, undefined if filtered out
     *
     * @example
     * ```typescript
     * logger.assert(user !== null, "User object should not be null at this point");
     * ```
     */
    assert(condition: boolean, message: string): string | undefined;
    /**
     * Retrieves all accumulated log messages as formatted strings.
     * Only available when `isAccumulateLog` is enabled.
     *
     * @returns An array of formatted log message strings
     *
     * @example
     * ```typescript
     * logger.isAccumulateLog = true;
     * logger.info("First message");
     * logger.warn("Second message");
     *
     * const logs = logger.getAccumulatedLog();
     * console.log(logs); // Array of formatted log messages
     * ```
     */
    getAccumulatedLog(): string[];
}
