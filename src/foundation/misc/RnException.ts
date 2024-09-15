import type { Err, RnError } from './Result';

export class RnException<ErrObj> extends Error {
  static readonly _prefix = '\nRhodonite Exception';
  constructor(private err: RnError<ErrObj>) {
    super(`
  message: ${err.message}
  error: ${
    typeof (err.error as Err<unknown, ErrObj>)._rnException !== 'undefined'
      ? 'see below Exception ↓' + (err.error as Err<unknown, ErrObj>).toString()
      : err.error
  }
`);
    this.name = RnException._prefix;
  }

  getRnError() {
    return this.err;
  }
}
