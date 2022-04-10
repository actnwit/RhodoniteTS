import {TypedArray} from '../../types/CommonTypes';

export class VectorN {
  public _v: TypedArray;
  constructor(typedArray: TypedArray) {
    this._v = typedArray;
  }
}
