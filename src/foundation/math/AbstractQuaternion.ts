import { TypedArray } from "../../types/CommonTypes";
import { IQuaternion } from "./IQuaternion";
import { IMutableVector3 } from "./IVector";

export default class AbstractQuaternion implements IQuaternion {
  get className() {
    return this.constructor.name;
  }

  get x(): number {
    return this._v[0];
  }

  get y(): number {
    return this._v[1];
  }

  get z(): number {
    return this._v[2];
  }

  get w(): number {
    return this._v[3];
  }
  at(i: number) {
    return this._v[i];
  }

  length() {
    return Math.hypot(this._v[0], this._v[1], this._v[2], this._v[3]);
  }

  lengthSquared(): number {
    return this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2 + this._v[3] ** 2;
  }

  toString(): string {
    throw new Error("Method not implemented.");
  }
  toStringApproximately(): string {
    throw new Error("Method not implemented.");
  }
  flattenAsArray(): number[] {
    throw new Error("Method not implemented.");
  }
  isDummy(): boolean {
    throw new Error("Method not implemented.");
  }
  isEqual(vec: IQuaternion, delta?: number): boolean {
    throw new Error("Method not implemented.");
  }
  isStrictEqual(vec: IQuaternion): boolean {
    throw new Error("Method not implemented.");
  }
  toEulerAnglesTo(out: IMutableVector3): IMutableVector3 {
    throw new Error("Method not implemented.");
  }

  /**
   * dot product
   */
   dot(quat: IQuaternion) {
    return (
      this._v[0] * quat._v[0] +
      this._v[1] * quat._v[1] +
      this._v[2] * quat._v[2] +
      this._v[3] * quat._v[3]
    );
  }

  clone(): IQuaternion {
    throw new Error("Method not implemented.");
  }
  _v = new Float32Array();
}
