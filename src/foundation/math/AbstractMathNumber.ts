import {TypedArray} from 'rhodonite/dist/esm/types/CommonTypes';
import {IArrayBufferBasedMathNumber} from './IMathNumber';

export abstract class AbstractArrayBufferBaseMathNumber
  implements IArrayBufferBasedMathNumber
{
  _v: TypedArray = new Float32Array();

  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean {
    return this._v.buffer === arrayBuffer;
  }
}
