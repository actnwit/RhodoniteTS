import {IVector3, IVector4} from './IVector';
import { Quaternion } from './Quaternion';
import {TypedArray} from '../../types/CommonTypes';
import {ILogQuaternion, IQuaternion} from './IQuaternion';
import AbstractVector from './AbstractVector';

export default class LogQuaternion implements ILogQuaternion {
  _v: Float32Array;
  constructor(
    x:
      | number
      | TypedArray
      | IVector3
      | IVector4
      | IQuaternion
      | Array<number>
      | null,
    y?: number,
    z?: number
  ) {
    if (ArrayBuffer.isView(x)) {
      this._v = x as Float32Array;
      return;
    } else if (x == null) {
      this._v = new Float32Array(0);
      return;
    } else {
      this._v = new Float32Array(3);
    }

    if (x instanceof Quaternion) {
      // for IQuaternion
      const theta = Math.acos(x.w);
      const sin = Math.sin(theta);
      this._v[0] = x.x * (theta / sin);
      this._v[1] = x.y * (theta / sin);
      this._v[2] = x.z * (theta / sin);
    } else if (Array.isArray(x)) {
      this._v[0] = x[0];
      this._v[1] = x[1];
      this._v[2] = x[2];
    } else if (typeof x === 'number') {
      this._v[0] = x;
      this._v[1] = y as number;
      this._v[2] = z as number;
    } else {
      this._v[0] = x._v[0];
      this._v[1] = x._v[1];
      this._v[2] = x._v[2];
    }
  }

  get x() {
    return this._v[0];
  }

  get y() {
    return this._v[1];
  }

  get z() {
    return this._v[2];
  }

  get w() {
    return 1;
  }

  get className() {
    return 'LogQuaternion';
  }
}
