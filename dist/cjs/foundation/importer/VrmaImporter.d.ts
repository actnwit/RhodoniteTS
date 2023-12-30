import { RnM2 } from '../../types';
import { RnM2Vrma } from '../../types/RnM2Vrma';
import { Err, Result } from '../misc/Result';
export declare class VrmaImporter {
    static importFromUri(uri: string): Promise<Result<RnM2Vrma, Err<RnM2, undefined>>>;
    static importFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<Result<RnM2Vrma, Err<RnM2, undefined>>>;
    static readHumanoid(rnm: RnM2Vrma): void;
}
