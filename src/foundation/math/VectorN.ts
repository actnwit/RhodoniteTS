import { TypedArray } from '../../commontypes/CommonTypes';

export default class VectorN {
  public v: TypedArray;
  constructor(typedArray: TypedArray) {
    this.v = typedArray;
  }
}
