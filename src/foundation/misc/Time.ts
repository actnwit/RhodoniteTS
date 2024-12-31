export class Time {
  private static __currentProcessBeginTime = 0;
  private static __lastProcessBeginTime = 0;
  private static __lastProcessEndTime = 0;
  private static __lastTickTimeInterval = 0;
  private static __systemStartTime = 0;
  private static __intervalProcessBegin = 0;
  /**
   * @internal
   */
  static _processBegin() {
    Time.__currentProcessBeginTime = performance.now();
    Time.__intervalProcessBegin = Time.__currentProcessBeginTime - Time.__lastProcessBeginTime;
    if (Time.__systemStartTime === 0) {
      Time.__systemStartTime = Time.__currentProcessBeginTime;
    }
    Time.__lastProcessBeginTime = Time.__currentProcessBeginTime;
  }

  /**
   * @internal
   */
  static _processEnd() {
    Time.__lastProcessEndTime = performance.now();
    Time.__lastTickTimeInterval = Time.__lastProcessEndTime - Time.__currentProcessBeginTime;
  }

  static get timeAtProcessBeginMilliseconds() {
    return Time.__currentProcessBeginTime;
  }

  static get timeAtProcessEndMilliseconds() {
    return Time.__lastProcessEndTime;
  }

  static get timeFromSystemStart() {
    return (performance.now() - Time.__systemStartTime) / 1000;
  }

  static get lastTickTimeInterval() {
    return Time.__lastTickTimeInterval / 1000;
  }

  static get intervalProcessBegin() {
    return Time.__intervalProcessBegin / 1000;
  }

  static get lastTimeTimeIntervalInMilliseconds() {
    return Time.__lastTickTimeInterval;
  }
}
