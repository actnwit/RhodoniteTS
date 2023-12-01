import { Err, RnError } from './Result';

export class RnException<ErrObj> extends Error {
  static readonly _prefix = '\nRhodonite Exception';
  constructor(private err: RnError<ErrObj>) {
    super(`
  message: ${err.message}
  error: ${
    err.error instanceof Err<unknown, unknown> ? 'see below Exception ↓' + err.error : err.error
  }
`);
    this.name = RnException._prefix;
  }

  getRnError() {
    return this.err;
  }
}
