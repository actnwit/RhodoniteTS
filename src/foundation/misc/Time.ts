export class Time {
  private static __currentProcessBeginTime = 0;
  private static __lastProcessEndTime = 0;
  private static __lastTickTimeInterval = 0;
  private static __systemStartTime = 0;

  /**
   * @internal
   */
  static _processBegin() {
    Time.__currentProcessBeginTime = performance.now();
    if (Time.__systemStartTime === 0) {
      Time.__systemStartTime = Time.__currentProcessBeginTime;
    }
  }

  /**
   * @internal
   */
  static _processEnd() {
    Time.__lastProcessEndTime = performance.now();
    Time.__lastTickTimeInterval = Time.__lastProcessEndTime - Time.__currentProcessBeginTime;
  }

  static get timeFromSystemStart() {
    return (performance.now() - Time.__systemStartTime) / 1000;
  }

  static get lastTickTimeInterval() {
    return Time.__lastTickTimeInterval / 1000;
  }

  static get lastTimeTimeIntervalInMilliseconds() {
    return Time.__lastTickTimeInterval;
  }
}
