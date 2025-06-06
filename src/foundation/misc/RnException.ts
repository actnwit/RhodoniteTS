import type { Err, RnError } from './Result';

/**
 * Custom exception class for Rhodonite framework errors.
 * This class extends the standard Error class to provide enhanced error handling
 * with structured error information from RnError objects.
 *
 * @template ErrObj - The type of the error object contained within the RnError
 *
 * @example
 * ```typescript
 * const rnError: RnError<string> = {
 *   message: "Operation failed",
 *   error: "Invalid parameter"
 * };
 * const exception = new RnException(rnError);
 * throw exception;
 * ```
 */
export class RnException<ErrObj> extends Error {
  /** Prefix string used in the exception name to identify Rhodonite exceptions */
  static readonly _prefix = '\nRhodonite Exception';

  /**
   * Creates a new RnException instance.
   *
   * @param err - The RnError object containing the error message and details
   *
   * @remarks
   * The constructor automatically formats the error message to include both
   * the message and error details. If the error object contains a nested
   * RnException, it will display "see below Exception ↓" followed by the
   * nested exception's string representation.
   */
  constructor(private err: RnError<ErrObj>) {
    super(`
  message: ${err.message}
  error: ${
    typeof (err.error as Err<unknown, ErrObj>)._rnException !== 'undefined'
      ? `see below Exception ↓${(err.error as Err<unknown, ErrObj>).toString()}`
      : err.error
  }
`);
    this.name = RnException._prefix;
  }

  /**
   * Retrieves the original RnError object that was used to create this exception.
   *
   * @returns The RnError object containing the original error message and details
   *
   * @example
   * ```typescript
   * try {
   *   // some operation that throws RnException
   * } catch (error) {
   *   if (error instanceof RnException) {
   *     const originalError = error.getRnError();
   *     console.log(originalError.message);
   *   }
   * }
   * ```
   */
  getRnError() {
    return this.err;
  }
}
