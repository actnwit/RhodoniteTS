/**
 * Enumeration of log levels in ascending order of severity.
 * Lower numeric values represent less severe log levels.
 */
export enum LogLevel {
  Debug = 0,
  Info,
  Warn,
  Error,
  Assert,
}

/**
 * Internal log entry structure for storing log messages with metadata.
 */
class Log {
  message: string = '';
  timestamp: number = 0;
  logLevel: LogLevel = LogLevel.Info;
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
 * // Configure logger
 * Logger.logLevel = LogLevel.Info;
 * Logger.isRichLog = true;
 * Logger.isAccumulateLog = true;
 *
 * // Use logging methods
 * Logger.info("Application started");
 * Logger.warn("This is a warning");
 * Logger.error("An error occurred");
 *
 * // Retrieve accumulated logs
 * const logs = Logger.getAccumulatedLog();
 * ```
 */
export class Logger {
  private static __messages: Log[] = [];

  /** The minimum log level that will be output. Messages below this level are ignored. */
  static logLevel = LogLevel.Warn;

  /** Whether to format log messages with timestamps and log level prefixes. */
  static isRichLog = false;

  /** Whether to store log messages in memory for later retrieval. */
  static isAccumulateLog = false;

  /**
   * Common processing for all log methods. Handles message formatting and storage.
   *
   * @param message - The log message to process
   * @param logLevel - The severity level of the log message
   * @returns The formatted log message
   * @private
   */
  private static __common(message: string, logLevel: LogLevel): string {
    if (!this.isAccumulateLog && !this.isRichLog) {
      return message;
    }

    // store log
    const log = new Log();
    log.message = message;
    log.timestamp = Date.now();
    log.logLevel = logLevel;

    if (this.isAccumulateLog) {
      this.__messages.push(log);
    }

    return this.__formatLogs(log);
  }

  /**
   * Clears all accumulated log messages from memory.
   *
   * @private
   */
  private static __clearAccumulatedLog(): void {
    this.__messages = [];
  }

  /**
   * Formats a log entry with timestamp and log level information if rich logging is enabled.
   *
   * @param log - The log entry to format
   * @returns The formatted log message string
   * @private
   */
  private static __formatLogs(log: Log): string {
    if (!this.isRichLog) {
      return log.message;
    }

    // format log text
    const yyyymmdd = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateTime = yyyymmdd.format(log.timestamp);
    const finalMessage = `Rn[${this.__getLogLevelText(log.logLevel)}][${dateTime}]: ${log.message}`;

    return finalMessage;
  }

  /**
   * Converts a LogLevel enum value to its string representation.
   *
   * @param logLevel - The log level to convert
   * @returns The string name of the log level
   * @private
   */
  private static __getLogLevelText(logLevel: LogLevel): string {
    return LogLevel[logLevel];
  }

  /**
   * Logs an error message to the console if the current log level permits it.
   * Error messages indicate serious problems that should be addressed immediately.
   *
   * @param message - The error message to log
   * @returns The formatted message if logged, undefined if filtered out
   *
   * @example
   * ```typescript
   * Logger.error("Database connection failed");
   * ```
   */
  public static error(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Error) {
      const formattedMessage = this.__common(message, LogLevel.Error);
      console.error(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  /**
   * Logs a warning message to the console if the current log level permits it.
   * Warning messages indicate potential issues that should be monitored.
   *
   * @param message - The warning message to log
   * @returns The formatted message if logged, undefined if filtered out
   *
   * @example
   * ```typescript
   * Logger.warn("API response time is slower than expected");
   * ```
   */
  public static warn(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Warn) {
      const formattedMessage = this.__common(message, LogLevel.Warn);
      console.warn(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  /**
   * Logs an informational message to the console if the current log level permits it.
   * Info messages provide general information about application flow and state.
   *
   * @param message - The informational message to log
   * @returns The formatted message if logged, undefined if filtered out
   *
   * @example
   * ```typescript
   * Logger.info("User authentication successful");
   * ```
   */
  public static info(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Info) {
      const formattedMessage = this.__common(message, LogLevel.Info);
      console.info(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  /**
   * Logs a debug message to the console if the current log level permits it.
   * Debug messages provide detailed information useful for troubleshooting and development.
   *
   * @param message - The debug message to log
   * @returns The formatted message if logged, undefined if filtered out
   *
   * @example
   * ```typescript
   * Logger.debug("Processing user input: " + JSON.stringify(input));
   * ```
   */
  public static debug(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Debug) {
      const formattedMessage = this.__common(message, LogLevel.Debug);
      console.debug(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

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
   * Logger.assert(user !== null, "User object should not be null at this point");
   * ```
   */
  public static assert(condition: boolean, message: string): string | undefined {
    if (this.logLevel <= LogLevel.Assert) {
      const formattedMessage = this.__common(message, LogLevel.Assert);
      console.assert(condition, formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  /**
   * Retrieves all accumulated log messages as formatted strings.
   * Only available when `isAccumulateLog` is enabled.
   *
   * @returns An array of formatted log message strings
   *
   * @example
   * ```typescript
   * Logger.isAccumulateLog = true;
   * Logger.info("First message");
   * Logger.warn("Second message");
   *
   * const logs = Logger.getAccumulatedLog();
   * console.log(logs); // Array of formatted log messages
   * ```
   */
  public static getAccumulatedLog(): string[] {
    return this.__messages.map((log) => this.__formatLogs(log));
  }
}
