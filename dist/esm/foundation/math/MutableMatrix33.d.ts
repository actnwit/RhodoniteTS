import { Matrix44 } from './Matrix44';
import { IMutableMatrix33, IMutableMatrix, IMatrix33 } from './IMatrix';
import { Matrix33 } from './Matrix33';
import { Vector3 } from './Vector3';
import { Array9, Index } from '../../types/CommonTypes';
import { IQuaternion } from './IQuaternion';
export declare class MutableMatrix33 extends Matrix33 implements IMutableMatrix, IMutableMatrix33 {
    constructor(m: Float32Array);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m20(val: number);
    get m20(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    set m21(val: number);
    get m21(): number;
    set m02(val: number);
    get m02(): number;
    set m12(val: number);
    get m12(): number;
    set m22(val: number);
    get m22(): number;
    get className(): string;
    /**
     * zero matrix(static version)
     */
    static zero(): MutableMatrix33;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix33;
    static dummy(): MutableMatrix33;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix33): MutableMatrix33;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix33): MutableMatrix33;
    /**
   * Create X oriented Rotation Matrix
   */
    static rotateX(radian: number): MutableMatrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): MutableMatrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): MutableMatrix33;
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    static rotate(vec: Vector3): MutableMatrix33;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector3): MutableMatrix33;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix33, r_mat: Matrix33): MutableMatrix33;
    clone(): MutableMatrix33;
    raw(): Float32Array;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    copyComponents(mat: Matrix33 | Matrix44): this;
    /**
     * zero matrix
     */
    zero(): MutableMatrix33;
    identity(): MutableMatrix33;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): MutableMatrix33;
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian: number): MutableMatrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian: number): MutableMatrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian: number): MutableMatrix33;
    rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    rotate(vec: Vector3): MutableMatrix33;
    scale(vec: Vector3): MutableMatrix33;
    multiplyScale(vec: Vector3): this;
    /**
     * multiply the input matrix from right side
     */
    multiply(mat: Matrix33): MutableMatrix33;
    multiplyByLeft(mat: Matrix33): MutableMatrix33;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 9 values in 3x3 style (3 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): MutableMatrix33;
    static fromCopyMatrix44(mat: Matrix44): MutableMatrix33;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix33;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix33;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix33;
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33;
    static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33;
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33;
    static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33;
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33;
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix33;
}
