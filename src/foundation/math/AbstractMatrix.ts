import { IMatrix } from './IMatrix';

/**
 * the Abstract base class of Matrix classes
 */
export abstract class AbstractMatrix implements IMatrix {
  _v: Float32Array = new Float32Array();
  at(row_i: number, column_i: number): number {
    throw new Error('Method not implemented.');
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
  determinant(): number {
    throw new Error('Method not implemented.');
  }
  get className(): string {
    return this.constructor.name;
  }

  get isIdentityMatrixClass(): boolean {
    return false;
  }

  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean {
    return this._v.buffer === arrayBuffer;
  }
}
