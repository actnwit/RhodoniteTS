/**
 * A utility class for managing time-related operations and measurements.
 * Provides functionality to track process timing, system uptime, and frame intervals.
 *
 * @example
 * ```typescript
 * // Get current system uptime
 * const uptime = Time.timeFromSystemStart;
 *
 * // Get last frame duration
 * const frameTime = Time.lastTickTimeInterval;
 * ```
 */
export class Time {
  private static __currentProcessBeginTime = 0;
  private static __lastProcessBeginTime = 0;
  private static __lastProcessEndTime = 0;
  private static __lastTickTimeInterval = 0;
  private static __systemStartTime = 0;
  private static __intervalProcessBegin = 0;
  /**
   * Marks the beginning of a process cycle and updates timing measurements.
   * This method should be called at the start of each frame or processing cycle.
   *
   * @internal
   * @remarks
   * This method updates the current process begin time, calculates the interval
   * since the last process began, and initializes the system start time if needed.
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
   * Marks the end of a process cycle and calculates the processing duration.
   * This method should be called at the end of each frame or processing cycle.
   *
   * @internal
   * @remarks
   * This method records the process end time and calculates the duration
   * of the current processing cycle (tick time interval).
   */
  static _processEnd() {
    Time.__lastProcessEndTime = performance.now();
    Time.__lastTickTimeInterval = Time.__lastProcessEndTime - Time.__currentProcessBeginTime;
  }

  /**
   * Gets the timestamp when the current process cycle began.
   *
   * @returns The time in milliseconds when the current process began
   * @readonly
   */
  static get timeAtProcessBeginMilliseconds() {
    return Time.__currentProcessBeginTime;
  }

  /**
   * Gets the timestamp when the last process cycle ended.
   *
   * @returns The time in milliseconds when the last process ended
   * @readonly
   */
  static get timeAtProcessEndMilliseconds() {
    return Time.__lastProcessEndTime;
  }

  /**
   * Gets the elapsed time since the system started.
   *
   * @returns The elapsed time in seconds since system initialization
   * @readonly
   * @remarks
   * This value represents the total uptime of the system and is useful
   * for animations, timing calculations, and performance measurements.
   */
  static get timeFromSystemStart() {
    return (performance.now() - Time.__systemStartTime) / 1000;
  }

  /**
   * Gets the duration of the last completed processing cycle.
   *
   * @returns The last tick time interval in seconds
   * @readonly
   * @remarks
   * This value represents the frame time or delta time, which is commonly
   * used for frame-rate independent animations and physics calculations.
   */
  static get lastTickTimeInterval() {
    return Time.__lastTickTimeInterval / 1000;
  }

  /**
   * Gets the time interval between the start of consecutive process cycles.
   *
   * @returns The interval between process beginnings in seconds
   * @readonly
   * @remarks
   * This value indicates the time gap between when consecutive processing
   * cycles started, which can be useful for measuring frame rate consistency.
   */
  static get intervalProcessBegin() {
    return Time.__intervalProcessBegin / 1000;
  }

  /**
   * Gets the duration of the last completed processing cycle in milliseconds.
   *
   * @returns The last tick time interval in milliseconds
   * @readonly
   * @remarks
   * This is the millisecond version of {@link lastTickTimeInterval}.
   * Useful when higher precision timing is needed.
   */
  static get lastTimeTimeIntervalInMilliseconds() {
    return Time.__lastTickTimeInterval;
  }
}
