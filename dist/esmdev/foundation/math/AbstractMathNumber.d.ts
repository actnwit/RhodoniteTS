import { TypedArray } from '../../types/CommonTypes';
import { IArrayBufferBasedMathNumber } from './IMathNumber';
export declare abstract class AbstractArrayBufferBaseMathNumber implements IArrayBufferBasedMathNumber {
    _v: TypedArray;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}
