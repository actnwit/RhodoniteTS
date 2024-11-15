export enum LogLevel {
  Debug = 0,
  Info,
  Warn,
  Error,
  Assert,
}

class Log {
  message: string = '';
  timestamp: number = 0;
  logLevel: LogLevel = LogLevel.Info;
}

export class Logger {
  private static __messages: Log[] = [];
  static logLevel = LogLevel.Warn;
  static isRichLog = false;
  static isAccumulateLog = false;

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

  private static __clearAccumulatedLog(): void {
    this.__messages = [];
  }

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

  private static __getLogLevelText(logLevel: LogLevel): string {
    return LogLevel[logLevel];
  }

  public static error(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Error) {
      const formattedMessage = this.__common(message, LogLevel.Error);
      console.error(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  public static warn(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Warn) {
      const formattedMessage = this.__common(message, LogLevel.Warn);
      console.warn(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  public static info(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Info) {
      const formattedMessage = this.__common(message, LogLevel.Info);
      console.info(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  public static debug(message: string): string | undefined {
    if (this.logLevel <= LogLevel.Debug) {
      const formattedMessage = this.__common(message, LogLevel.Debug);
      console.debug(formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  public static assert(condition: boolean, message: string): string | undefined {
    if (this.logLevel <= LogLevel.Assert) {
      const formattedMessage = this.__common(message, LogLevel.Assert);
      console.assert(condition, formattedMessage);
      return formattedMessage;
    }
    return undefined;
  }

  public static getAccumulatedLog(): string[] {
    return this.__messages.map((log) => this.__formatLogs(log));
  }
}
