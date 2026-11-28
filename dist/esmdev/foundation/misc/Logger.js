// src/foundation/misc/Logger.ts
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["Debug"] = 0] = "Debug";
  LogLevel2[LogLevel2["Info"] = 1] = "Info";
  LogLevel2[LogLevel2["Warn"] = 2] = "Warn";
  LogLevel2[LogLevel2["Error"] = 3] = "Error";
  LogLevel2[LogLevel2["Assert"] = 4] = "Assert";
  return LogLevel2;
})(LogLevel || {});
var Log = class {
  constructor() {
    this.message = "";
    this.timestamp = 0;
    this.logLevel = 1 /* Info */;
  }
};
var _Logger = class _Logger {
  constructor() {
    this.Ku = [];
    /** The minimum log level that will be output. Messages below this level are ignored. */
    this.logLevel = 2 /* Warn */;
    /** Whether to format log messages with timestamps and log level prefixes. */
    this.isRichLog = false;
    /** Whether to store log messages in memory for later retrieval. */
    this.isAccumulateLog = false;
  }
  /**
   * Common processing for all log methods. Handles message formatting and storage.
   *
   * @param message - The log message to process
   * @param logLevel - The severity level of the log message
   * @returns The formatted log message
   * @private
   */
  Ju(message, logLevel) {
    if (!this.isAccumulateLog && !this.isRichLog) {
      return message;
    }
    const log = new Log();
    log.message = message;
    log.timestamp = Date.now();
    log.logLevel = logLevel;
    if (this.isAccumulateLog) {
      this.Ku.push(log);
    }
    return this.Lu(log);
  }
  /**
   * Clears all accumulated log messages from memory.
   */
  clearAccumulatedLog() {
    this.Ku = [];
  }
  /**
   * Formats a log entry with timestamp and log level information if rich logging is enabled.
   *
   * @param log - The log entry to format
   * @returns The formatted log message string
   * @private
   */
  Lu(log) {
    if (!this.isRichLog) {
      return log.message;
    }
    const yyyymmdd = new Intl.DateTimeFormat(void 0, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const dateTime = yyyymmdd.format(log.timestamp);
    const finalMessage = `Rn[${this.Mu(log.logLevel)}][${dateTime}]: ${log.message}`;
    return finalMessage;
  }
  /**
   * Converts a LogLevel enum value to its string representation.
   *
   * @param logLevel - The log level to convert
   * @returns The string name of the log level
   * @private
   */
  Mu(logLevel) {
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
   * logger.error("Database connection failed");
   * ```
   */
  error(message) {
    if (this.logLevel <= 3 /* Error */) {
      const formattedMessage = this.Ju(message, 3 /* Error */);
      console.error(formattedMessage);
      return formattedMessage;
    }
    return void 0;
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
   * logger.warn("API response time is slower than expected");
   * ```
   */
  warn(message) {
    if (this.logLevel <= 2 /* Warn */) {
      const formattedMessage = this.Ju(message, 2 /* Warn */);
      console.warn(formattedMessage);
      return formattedMessage;
    }
    return void 0;
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
   * logger.info("User authentication successful");
   * ```
   */
  info(message) {
    if (this.logLevel <= 1 /* Info */) {
      const formattedMessage = this.Ju(message, 1 /* Info */);
      console.info(formattedMessage);
      return formattedMessage;
    }
    return void 0;
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
   * logger.debug("Processing user input: " + JSON.stringify(input));
   * ```
   */
  debug(message) {
    if (this.logLevel <= 0 /* Debug */) {
      const formattedMessage = this.Ju(message, 0 /* Debug */);
      console.debug(formattedMessage);
      return formattedMessage;
    }
    return void 0;
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
   * logger.assert(user !== null, "User object should not be null at this point");
   * ```
   */
  assert(condition, message) {
    if (this.logLevel <= 4 /* Assert */) {
      const formattedMessage = this.Ju(message, 4 /* Assert */);
      console.assert(condition, formattedMessage);
      return formattedMessage;
    }
    return void 0;
  }
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
  getAccumulatedLog() {
    return this.Ku.map((log) => this.Lu(log));
  }
};
/** The default global Logger instance for code that doesn't have access to an Engine. */
_Logger.default = new _Logger();
var Logger = _Logger;
export {
  LogLevel,
  Logger
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWlzYy9Mb2dnZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogRW51bWVyYXRpb24gb2YgbG9nIGxldmVscyBpbiBhc2NlbmRpbmcgb3JkZXIgb2Ygc2V2ZXJpdHkuXG4gKiBMb3dlciBudW1lcmljIHZhbHVlcyByZXByZXNlbnQgbGVzcyBzZXZlcmUgbG9nIGxldmVscy5cbiAqL1xuZXhwb3J0IGVudW0gTG9nTGV2ZWwge1xuICBEZWJ1ZyA9IDAsXG4gIEluZm8gPSAxLFxuICBXYXJuID0gMixcbiAgRXJyb3IgPSAzLFxuICBBc3NlcnQgPSA0LFxufVxuXG4vKipcbiAqIEludGVybmFsIGxvZyBlbnRyeSBzdHJ1Y3R1cmUgZm9yIHN0b3JpbmcgbG9nIG1lc3NhZ2VzIHdpdGggbWV0YWRhdGEuXG4gKi9cbmNsYXNzIExvZyB7XG4gIG1lc3NhZ2UgPSAnJztcbiAgdGltZXN0YW1wID0gMDtcbiAgbG9nTGV2ZWw6IExvZ0xldmVsID0gTG9nTGV2ZWwuSW5mbztcbn1cblxuLyoqXG4gKiBBIGNvbXByZWhlbnNpdmUgbG9nZ2luZyB1dGlsaXR5IGNsYXNzIHRoYXQgcHJvdmlkZXMgdmFyaW91cyBsb2cgbGV2ZWxzLFxuICogbWVzc2FnZSBmb3JtYXR0aW5nLCBhbmQgbG9nIGFjY3VtdWxhdGlvbiBjYXBhYmlsaXRpZXMuXG4gKlxuICogRmVhdHVyZXM6XG4gKiAtIE11bHRpcGxlIGxvZyBsZXZlbHMgKERlYnVnLCBJbmZvLCBXYXJuLCBFcnJvciwgQXNzZXJ0KVxuICogLSBSaWNoIGZvcm1hdHRpbmcgd2l0aCB0aW1lc3RhbXBzXG4gKiAtIExvZyBhY2N1bXVsYXRpb24gZm9yIGxhdGVyIHJldHJpZXZhbFxuICogLSBDb25maWd1cmFibGUgbG9nIGxldmVsIGZpbHRlcmluZ1xuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBDcmVhdGUgbG9nZ2VyIGluc3RhbmNlXG4gKiBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG4gKiBsb2dnZXIubG9nTGV2ZWwgPSBMb2dMZXZlbC5JbmZvO1xuICogbG9nZ2VyLmlzUmljaExvZyA9IHRydWU7XG4gKiBsb2dnZXIuaXNBY2N1bXVsYXRlTG9nID0gdHJ1ZTtcbiAqXG4gKiAvLyBVc2UgbG9nZ2luZyBtZXRob2RzXG4gKiBsb2dnZXIuaW5mbyhcIkFwcGxpY2F0aW9uIHN0YXJ0ZWRcIik7XG4gKiBsb2dnZXIud2FybihcIlRoaXMgaXMgYSB3YXJuaW5nXCIpO1xuICogbG9nZ2VyLmVycm9yKFwiQW4gZXJyb3Igb2NjdXJyZWRcIik7XG4gKlxuICogLy8gUmV0cmlldmUgYWNjdW11bGF0ZWQgbG9nc1xuICogY29uc3QgbG9ncyA9IGxvZ2dlci5nZXRBY2N1bXVsYXRlZExvZygpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuICAvKiogVGhlIGRlZmF1bHQgZ2xvYmFsIExvZ2dlciBpbnN0YW5jZSBmb3IgY29kZSB0aGF0IGRvZXNuJ3QgaGF2ZSBhY2Nlc3MgdG8gYW4gRW5naW5lLiAqL1xuICBzdGF0aWMgcmVhZG9ubHkgZGVmYXVsdCA9IG5ldyBMb2dnZXIoKTtcblxuICBwcml2YXRlIF9fbWVzc2FnZXM6IExvZ1tdID0gW107XG5cbiAgLyoqIFRoZSBtaW5pbXVtIGxvZyBsZXZlbCB0aGF0IHdpbGwgYmUgb3V0cHV0LiBNZXNzYWdlcyBiZWxvdyB0aGlzIGxldmVsIGFyZSBpZ25vcmVkLiAqL1xuICBsb2dMZXZlbCA9IExvZ0xldmVsLldhcm47XG5cbiAgLyoqIFdoZXRoZXIgdG8gZm9ybWF0IGxvZyBtZXNzYWdlcyB3aXRoIHRpbWVzdGFtcHMgYW5kIGxvZyBsZXZlbCBwcmVmaXhlcy4gKi9cbiAgaXNSaWNoTG9nID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIgdG8gc3RvcmUgbG9nIG1lc3NhZ2VzIGluIG1lbW9yeSBmb3IgbGF0ZXIgcmV0cmlldmFsLiAqL1xuICBpc0FjY3VtdWxhdGVMb2cgPSBmYWxzZTtcblxuICAvKipcbiAgICogQ29tbW9uIHByb2Nlc3NpbmcgZm9yIGFsbCBsb2cgbWV0aG9kcy4gSGFuZGxlcyBtZXNzYWdlIGZvcm1hdHRpbmcgYW5kIHN0b3JhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIGxvZyBtZXNzYWdlIHRvIHByb2Nlc3NcbiAgICogQHBhcmFtIGxvZ0xldmVsIC0gVGhlIHNldmVyaXR5IGxldmVsIG9mIHRoZSBsb2cgbWVzc2FnZVxuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIGxvZyBtZXNzYWdlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY29tbW9uKG1lc3NhZ2U6IHN0cmluZywgbG9nTGV2ZWw6IExvZ0xldmVsKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuaXNBY2N1bXVsYXRlTG9nICYmICF0aGlzLmlzUmljaExvZykge1xuICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgLy8gc3RvcmUgbG9nXG4gICAgY29uc3QgbG9nID0gbmV3IExvZygpO1xuICAgIGxvZy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICBsb2cudGltZXN0YW1wID0gRGF0ZS5ub3coKTtcbiAgICBsb2cubG9nTGV2ZWwgPSBsb2dMZXZlbDtcblxuICAgIGlmICh0aGlzLmlzQWNjdW11bGF0ZUxvZykge1xuICAgICAgdGhpcy5fX21lc3NhZ2VzLnB1c2gobG9nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fX2Zvcm1hdExvZ3MobG9nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGFjY3VtdWxhdGVkIGxvZyBtZXNzYWdlcyBmcm9tIG1lbW9yeS5cbiAgICovXG4gIHB1YmxpYyBjbGVhckFjY3VtdWxhdGVkTG9nKCk6IHZvaWQge1xuICAgIHRoaXMuX19tZXNzYWdlcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1hdHMgYSBsb2cgZW50cnkgd2l0aCB0aW1lc3RhbXAgYW5kIGxvZyBsZXZlbCBpbmZvcm1hdGlvbiBpZiByaWNoIGxvZ2dpbmcgaXMgZW5hYmxlZC5cbiAgICpcbiAgICogQHBhcmFtIGxvZyAtIFRoZSBsb2cgZW50cnkgdG8gZm9ybWF0XG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgbG9nIG1lc3NhZ2Ugc3RyaW5nXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fZm9ybWF0TG9ncyhsb2c6IExvZyk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLmlzUmljaExvZykge1xuICAgICAgcmV0dXJuIGxvZy5tZXNzYWdlO1xuICAgIH1cblxuICAgIC8vIGZvcm1hdCBsb2cgdGV4dFxuICAgIGNvbnN0IHl5eXltbWRkID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQodW5kZWZpbmVkLCB7XG4gICAgICB5ZWFyOiAnbnVtZXJpYycsXG4gICAgICBtb250aDogJzItZGlnaXQnLFxuICAgICAgZGF5OiAnMi1kaWdpdCcsXG4gICAgICBob3VyOiAnMi1kaWdpdCcsXG4gICAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgICAgIHNlY29uZDogJzItZGlnaXQnLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGVUaW1lID0geXl5eW1tZGQuZm9ybWF0KGxvZy50aW1lc3RhbXApO1xuICAgIGNvbnN0IGZpbmFsTWVzc2FnZSA9IGBSblske3RoaXMuX19nZXRMb2dMZXZlbFRleHQobG9nLmxvZ0xldmVsKX1dWyR7ZGF0ZVRpbWV9XTogJHtsb2cubWVzc2FnZX1gO1xuXG4gICAgcmV0dXJuIGZpbmFsTWVzc2FnZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIExvZ0xldmVsIGVudW0gdmFsdWUgdG8gaXRzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGxvZ0xldmVsIC0gVGhlIGxvZyBsZXZlbCB0byBjb252ZXJ0XG4gICAqIEByZXR1cm5zIFRoZSBzdHJpbmcgbmFtZSBvZiB0aGUgbG9nIGxldmVsXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0TG9nTGV2ZWxUZXh0KGxvZ0xldmVsOiBMb2dMZXZlbCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIExvZ0xldmVsW2xvZ0xldmVsXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2dzIGFuIGVycm9yIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgaWYgdGhlIGN1cnJlbnQgbG9nIGxldmVsIHBlcm1pdHMgaXQuXG4gICAqIEVycm9yIG1lc3NhZ2VzIGluZGljYXRlIHNlcmlvdXMgcHJvYmxlbXMgdGhhdCBzaG91bGQgYmUgYWRkcmVzc2VkIGltbWVkaWF0ZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSAtIFRoZSBlcnJvciBtZXNzYWdlIHRvIGxvZ1xuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIG1lc3NhZ2UgaWYgbG9nZ2VkLCB1bmRlZmluZWQgaWYgZmlsdGVyZWQgb3V0XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogbG9nZ2VyLmVycm9yKFwiRGF0YWJhc2UgY29ubmVjdGlvbiBmYWlsZWRcIik7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIGVycm9yKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMubG9nTGV2ZWwgPD0gTG9nTGV2ZWwuRXJyb3IpIHtcbiAgICAgIGNvbnN0IGZvcm1hdHRlZE1lc3NhZ2UgPSB0aGlzLl9fY29tbW9uKG1lc3NhZ2UsIExvZ0xldmVsLkVycm9yKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0dGVkTWVzc2FnZSk7XG4gICAgICByZXR1cm4gZm9ybWF0dGVkTWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2dzIGEgd2FybmluZyBtZXNzYWdlIHRvIHRoZSBjb25zb2xlIGlmIHRoZSBjdXJyZW50IGxvZyBsZXZlbCBwZXJtaXRzIGl0LlxuICAgKiBXYXJuaW5nIG1lc3NhZ2VzIGluZGljYXRlIHBvdGVudGlhbCBpc3N1ZXMgdGhhdCBzaG91bGQgYmUgbW9uaXRvcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSAtIFRoZSB3YXJuaW5nIG1lc3NhZ2UgdG8gbG9nXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgbWVzc2FnZSBpZiBsb2dnZWQsIHVuZGVmaW5lZCBpZiBmaWx0ZXJlZCBvdXRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBsb2dnZXIud2FybihcIkFQSSByZXNwb25zZSB0aW1lIGlzIHNsb3dlciB0aGFuIGV4cGVjdGVkXCIpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyB3YXJuKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMubG9nTGV2ZWwgPD0gTG9nTGV2ZWwuV2Fybikge1xuICAgICAgY29uc3QgZm9ybWF0dGVkTWVzc2FnZSA9IHRoaXMuX19jb21tb24obWVzc2FnZSwgTG9nTGV2ZWwuV2Fybik7XG4gICAgICBjb25zb2xlLndhcm4oZm9ybWF0dGVkTWVzc2FnZSk7XG4gICAgICByZXR1cm4gZm9ybWF0dGVkTWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2dzIGFuIGluZm9ybWF0aW9uYWwgbWVzc2FnZSB0byB0aGUgY29uc29sZSBpZiB0aGUgY3VycmVudCBsb2cgbGV2ZWwgcGVybWl0cyBpdC5cbiAgICogSW5mbyBtZXNzYWdlcyBwcm92aWRlIGdlbmVyYWwgaW5mb3JtYXRpb24gYWJvdXQgYXBwbGljYXRpb24gZmxvdyBhbmQgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIGluZm9ybWF0aW9uYWwgbWVzc2FnZSB0byBsb2dcbiAgICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBtZXNzYWdlIGlmIGxvZ2dlZCwgdW5kZWZpbmVkIGlmIGZpbHRlcmVkIG91dFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGxvZ2dlci5pbmZvKFwiVXNlciBhdXRoZW50aWNhdGlvbiBzdWNjZXNzZnVsXCIpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBpbmZvKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMubG9nTGV2ZWwgPD0gTG9nTGV2ZWwuSW5mbykge1xuICAgICAgY29uc3QgZm9ybWF0dGVkTWVzc2FnZSA9IHRoaXMuX19jb21tb24obWVzc2FnZSwgTG9nTGV2ZWwuSW5mbyk7XG4gICAgICBjb25zb2xlLmluZm8oZm9ybWF0dGVkTWVzc2FnZSk7XG4gICAgICByZXR1cm4gZm9ybWF0dGVkTWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2dzIGEgZGVidWcgbWVzc2FnZSB0byB0aGUgY29uc29sZSBpZiB0aGUgY3VycmVudCBsb2cgbGV2ZWwgcGVybWl0cyBpdC5cbiAgICogRGVidWcgbWVzc2FnZXMgcHJvdmlkZSBkZXRhaWxlZCBpbmZvcm1hdGlvbiB1c2VmdWwgZm9yIHRyb3VibGVzaG9vdGluZyBhbmQgZGV2ZWxvcG1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIGRlYnVnIG1lc3NhZ2UgdG8gbG9nXG4gICAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgbWVzc2FnZSBpZiBsb2dnZWQsIHVuZGVmaW5lZCBpZiBmaWx0ZXJlZCBvdXRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBsb2dnZXIuZGVidWcoXCJQcm9jZXNzaW5nIHVzZXIgaW5wdXQ6IFwiICsgSlNPTi5zdHJpbmdpZnkoaW5wdXQpKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgZGVidWcobWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5sb2dMZXZlbCA8PSBMb2dMZXZlbC5EZWJ1Zykge1xuICAgICAgY29uc3QgZm9ybWF0dGVkTWVzc2FnZSA9IHRoaXMuX19jb21tb24obWVzc2FnZSwgTG9nTGV2ZWwuRGVidWcpO1xuICAgICAgY29uc29sZS5kZWJ1Zyhmb3JtYXR0ZWRNZXNzYWdlKTtcbiAgICAgIHJldHVybiBmb3JtYXR0ZWRNZXNzYWdlO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgY29uc29sZSBhc3NlcnRpb24gYW5kIGxvZ3MgYSBtZXNzYWdlIGlmIHRoZSBjb25kaXRpb24gaXMgZmFsc2UuXG4gICAqIEFzc2VydCBtZXNzYWdlcyBhcmUgdXNlZCBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGNyaXRpY2FsIGFzc3VtcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZGl0aW9uIC0gVGhlIGNvbmRpdGlvbiB0byB0ZXN0OyBpZiBmYWxzZSwgdGhlIGFzc2VydGlvbiBmYWlsc1xuICAgKiBAcGFyYW0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIGxvZyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHNcbiAgICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBtZXNzYWdlIGlmIGxvZ2dlZCwgdW5kZWZpbmVkIGlmIGZpbHRlcmVkIG91dFxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGxvZ2dlci5hc3NlcnQodXNlciAhPT0gbnVsbCwgXCJVc2VyIG9iamVjdCBzaG91bGQgbm90IGJlIG51bGwgYXQgdGhpcyBwb2ludFwiKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgYXNzZXJ0KGNvbmRpdGlvbjogYm9vbGVhbiwgbWVzc2FnZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5sb2dMZXZlbCA8PSBMb2dMZXZlbC5Bc3NlcnQpIHtcbiAgICAgIGNvbnN0IGZvcm1hdHRlZE1lc3NhZ2UgPSB0aGlzLl9fY29tbW9uKG1lc3NhZ2UsIExvZ0xldmVsLkFzc2VydCk7XG4gICAgICBjb25zb2xlLmFzc2VydChjb25kaXRpb24sIGZvcm1hdHRlZE1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIGZvcm1hdHRlZE1lc3NhZ2U7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBhY2N1bXVsYXRlZCBsb2cgbWVzc2FnZXMgYXMgZm9ybWF0dGVkIHN0cmluZ3MuXG4gICAqIE9ubHkgYXZhaWxhYmxlIHdoZW4gYGlzQWNjdW11bGF0ZUxvZ2AgaXMgZW5hYmxlZC5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgZm9ybWF0dGVkIGxvZyBtZXNzYWdlIHN0cmluZ3NcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBsb2dnZXIuaXNBY2N1bXVsYXRlTG9nID0gdHJ1ZTtcbiAgICogbG9nZ2VyLmluZm8oXCJGaXJzdCBtZXNzYWdlXCIpO1xuICAgKiBsb2dnZXIud2FybihcIlNlY29uZCBtZXNzYWdlXCIpO1xuICAgKlxuICAgKiBjb25zdCBsb2dzID0gbG9nZ2VyLmdldEFjY3VtdWxhdGVkTG9nKCk7XG4gICAqIGNvbnNvbGUubG9nKGxvZ3MpOyAvLyBBcnJheSBvZiBmb3JtYXR0ZWQgbG9nIG1lc3NhZ2VzXG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIGdldEFjY3VtdWxhdGVkTG9nKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5fX21lc3NhZ2VzLm1hcChsb2cgPT4gdGhpcy5fX2Zvcm1hdExvZ3MobG9nKSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFJTyxJQUFLLFdBQUwsa0JBQUtBLGNBQUw7QUFDTCxFQUFBQSxvQkFBQSxXQUFRLEtBQVI7QUFDQSxFQUFBQSxvQkFBQSxVQUFPLEtBQVA7QUFDQSxFQUFBQSxvQkFBQSxVQUFPLEtBQVA7QUFDQSxFQUFBQSxvQkFBQSxXQUFRLEtB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RCxRQUFJLEtBQUssWUFBWSxlQUFnQjtBQUNuQyxZQUFNLG1CQUFtQixLQUFLQSxHQUFTLFNBQVMsYUFBYztBQUM5RCxjQUFRLE1BQU0sZ0JBQWdCO0FBQzlCLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZU8sT0FBTyxXQUFvQixTQUFxQztBQUNyRSxRQUFJLEtBQUssWUFBWSxnQkFBaUI7QUFDcEMsWUFBTSxtQkFBbUIsS0FBS0EsR0FBUyxTQUFTLGNBQWU7QUFDL0QsY0FBUSxPQUFPLFdBQVcsZ0JBQWdCO0FBQzFDLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBa0JPLG9CQUE4QjtBQUNuQyxXQUFPLEtBQUtELEdBQVcsSUFBSSxTQUFPLEtBQUtFLEdBQWEsR0FBRyxDQUFDO0FBQUEsRUFDMUQ7QUFDRjtBQUFBO0FBbk5hLFFBRUssVUFBVSxJQUFJLFFBQU87QUFGaEMsSUFBTSxTQUFOOyIsCiAgIm5hbWVzIjogWyJMb2dMZXZlbCIsICJfX21lc3NhZ2VzIiwgIl9fY29tbW9uIiwgIl9fZm9ybWF0TG9ncyIsICJfX2dldExvZ0xldmVsVGV4dCJdCn0K
