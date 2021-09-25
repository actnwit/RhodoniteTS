import {TypedArray} from '../../types/CommonTypes';
import {IVector} from './IVector';

export default abstract class AbstractVector implements IVector {
  _v: TypedArray = new Float32Array();

  get glslStrAsFloat(): string {
    throw new Error('Method not implemented.');
  }
  get glslStrAsInt(): string {
    throw new Error('Method not implemented.');
  }
  isEqual(vec: IVector, delta?: number): boolean {
    throw new Error('Method not implemented.');
  }
  isStrictEqual(vec: IVector): boolean {
    throw new Error('Method not implemented.');
  }
  length(): number {
    throw new Error('Method not implemented.');
  }
  lengthSquared(): number {
    throw new Error('Method not implemented.');
  }
  lengthTo(vec: IVector): number {
    throw new Error('Method not implemented.');
  }
  dot(vec: IVector): number {
    throw new Error('Method not implemented.');
  }
  at(i: number): number {
    return this._v[i];
  }
  toString(): string {
    throw new Error('Method not implemented.');
  }
  toStringApproximately(): string {
    throw new Error('Method not implemented.');
  }
  flattenAsArray(): number[] {
    throw new Error('Method not implemented.');
  }
  isDummy(): boolean {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }
  v(i: number): number {
    return this._v[i];
  }

  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean {
    return this._v.buffer === arrayBuffer;
  }

  get className(): string {
    return this.constructor.name;
  }
}
