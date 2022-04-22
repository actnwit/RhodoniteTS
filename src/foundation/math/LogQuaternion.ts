import {IVector3, IVector4} from './IVector';
import {Quaternion} from './Quaternion';
import {Array3, TypedArray} from '../../types/CommonTypes';
import {ILogQuaternion, IQuaternion} from './IQuaternion';

export class LogQuaternion implements ILogQuaternion {
  _v: Float32Array;
  constructor(x: Float32Array) {
    this._v = x;
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

  static fromCopyArray3(array: Array3<number>) {
    return new Quaternion(new Float32Array(array));
  }

  static fromCopyArray(array: Array<number>) {
    return new Quaternion(new Float32Array(array.slice(0, 3)));
  }

  static fromCopy3(x: number, y: number, z: number) {
    return new Quaternion(new Float32Array([x, y, z]));
  }

  static fromCopyLogQuaternion(quat: ILogQuaternion) {
    const v = new Float32Array(3);
    v[0] = quat._v[0];
    v[1] = quat._v[1];
    v[2] = quat._v[2];
    return new Quaternion(v);
  }

  static fromCopyVector4(vec: IVector3) {
    const v = new Float32Array(3);
    v[0] = vec._v[0];
    v[1] = vec._v[1];
    v[2] = vec._v[2];
    return new Quaternion(v);
  }

  static fromCopyQuaternion(x: IQuaternion) {
    const theta = Math.acos(x.w);
    const sin = Math.sin(theta);

    const v = new Float32Array(3);
    v[0] = x.x * (theta / sin);
    v[1] = x.y * (theta / sin);
    v[2] = x.z * (theta / sin);
    return new LogQuaternion(v);
  }

  get className() {
    return 'LogQuaternion';
  }
}
