import { Vector3 } from './Vector3';
import { Matrix44 } from './Matrix44';
import { Quaternion } from './Quaternion';
import { IMatrix, IMatrix33 } from './IMatrix';
import { MutableMatrix33 } from './MutableMatrix33';
import { MutableVector3 } from './MutableVector3';
import { AbstractMatrix } from './AbstractMatrix';
import { IMutableVector3, IVector3 } from './IVector';
import { Array9 } from '../../types';
export declare class Matrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
    constructor(m: Float32Array);
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix33;
    /**
     * Create identity matrix
     */
    static identity(): IMatrix33;
    static dummy(): Matrix33;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix33): Matrix33;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix33): Matrix33;
    static invertTo(mat: Matrix33, outMat: MutableMatrix33): MutableMatrix33;
    /**
   * Create X oriented Rotation Matrix
   */
    static rotateX(radian: number): Matrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): Matrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): Matrix33;
    static rotateXYZ(x: number, y: number, z: number): Matrix33;
    static rotate(vec: Vector3): Matrix33;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector3): Matrix33;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix33, r_mat: Matrix33): Matrix33;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix33): MutableMatrix33;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: Matrix33, delta?: number): boolean;
    isStrictEqual(mat: Matrix33): boolean;
    at(row_i: number, column_i: number): number;
    v(i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector3): any;
    multiplyVectorTo(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
    getScale(): Vector3;
    getScaleTo(outVec: MutableVector3): MutableVector3;
    clone(): any;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 9 values in 3x3 style (3 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Matrix33;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): Matrix33;
    static fromCopyMatrix44(mat: Matrix44): Matrix33;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix33;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix33;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix33;
    static fromCopyMatrix33(mat: IMatrix33): Matrix33;
    static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33;
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix33;
    static fromCopyArray9RowMajor(array: Array9<number>): Matrix33;
    static fromCopyArrayRowMajor(array: Array<number>): Matrix33;
    static fromCopyQuaternion(q: Quaternion): Matrix33;
}
