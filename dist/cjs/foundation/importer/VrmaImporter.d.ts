import { RnM2 } from '../../types';
import { RnM2Vrma } from '../../types/RnM2Vrma';
import { Err, IResult } from '../misc/Result';
export declare class VrmaImporter {
    static importFromUri(uri: string): Promise<IResult<RnM2Vrma, Err<RnM2, undefined>>>;
    static importFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<IResult<RnM2Vrma, Err<RnM2, undefined>>>;
    static readHumanoid(rnm: RnM2Vrma): void;
}