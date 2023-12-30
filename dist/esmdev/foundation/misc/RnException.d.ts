import { RnError } from './Result';
export declare class RnException<ErrObj> extends Error {
    private err;
    static readonly _prefix = "\nRhodonite Exception";
    constructor(err: RnError<ErrObj>);
    getRnError(): RnError<ErrObj>;
}
