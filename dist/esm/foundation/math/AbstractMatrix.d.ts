import { IMatrix } from './IMatrix';
export declare abstract class AbstractMatrix implements IMatrix {
    _v: Float32Array;
    at(row_i: number, column_i: number): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    v(i: number): number;
    determinant(): number;
    get className(): string;
    get isIdentityMatrixClass(): boolean;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}
