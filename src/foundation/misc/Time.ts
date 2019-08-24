export default class Time {
  private static __currentProcessBeginTime = 0;
  private static __lastProcessEndTime = 0;
  private static __lastTickTimeInterval = 0;
  private static __systemStartTime = 0;

  /**
   * @private
   */
  static _processBegin() {
    if (Time.__currentProcessBeginTime === 0) {
      Time.__systemStartTime = performance.now();
    }
    Time.__currentProcessBeginTime = performance.now();
  }

  /**
   * @private
   */
  static _processEnd() {
    Time.__lastProcessEndTime = performance.now();
    Time.__lastTickTimeInterval = Time.__currentProcessBeginTime - Time.__lastProcessEndTime;
  }

  get timeFromSystemStart() {
    return Time.__systemStartTime - performance.now();
  }
}
