export enum LogLevel {
  Debug,
  Info,
  Log,
  Warning,
  Error,
  Assert,
}

class Log {
  message: string = '';
  timestamp: number = 0;
  logLevel: LogLevel = LogLevel.Log;
}

export class Logger {
  private static __messages: Log[] = [];

  private static __common(message: string, logLevel: LogLevel): string {
    // store log
    const log = new Log();
    log.message = message;
    log.timestamp = Date.now();
    log.logLevel = logLevel;
    this.__messages.push(log);

    // format log text
    const yyyymmdd = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateTime = yyyymmdd.format(new Date());
    const finalMessage = `Rn(${dateTime}) ${log.message}`;

    return finalMessage;
  }

  public static log(message: string): void {
    const formattedMessage = this.__common(message, LogLevel.Log);
    console.log(formattedMessage);
  }

  public static warn(message: string): void {
    const formattedMessage = this.__common(message, LogLevel.Warning);
    console.warn(formattedMessage);
  }

  public static error(message: string): void {
    const formattedMessage = this.__common(message, LogLevel.Error);
    console.error(formattedMessage);
  }

  public static info(message: string): void {
    const formattedMessage = this.__common(message, LogLevel.Info);
    console.info(formattedMessage);
  }

  public static debug(message: string): void {
    const formattedMessage = this.__common(message, LogLevel.Debug);
    console.debug(formattedMessage);
  }

  public static assert(condition: boolean, message: string): void {
    if (!condition) {
      const formattedMessage = this.__common(message, LogLevel.Assert);
      console.assert(condition, formattedMessage);
    }
  }
}
