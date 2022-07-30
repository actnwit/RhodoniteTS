import { Matrix44 } from './Matrix44';
import { IMutableMatrix22, IMutableMatrix, IMatrix22 } from './IMatrix';
import { Matrix22 } from './Matrix22';
import { Array4, Index } from '../../types/CommonTypes';
import { Matrix33 } from './Matrix33';
import { Vector2 } from './Vector2';
export declare class MutableMatrix22 extends Matrix22 implements IMutableMatrix, IMutableMatrix22 {
    constructor(m: Float32Array);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    get className(): string;
    /**
     * Create zero matrix
     */
    static zero(): MutableMatrix22;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix22;
    static dummy(): MutableMatrix22;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix22): MutableMatrix22;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix22): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    static rotate(radian: number): MutableMatrix22;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector2): MutableMatrix22;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix22, r_mat: Matrix22): MutableMatrix22;
    clone(): MutableMatrix22;
    raw(): Float32Array;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    copyComponents(mat: Matrix22 | Matrix33 | Matrix44): this;
    /**
     * zero matrix
     */
    zero(): MutableMatrix22;
    identity(): MutableMatrix22;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    rotate(radian: number): MutableMatrix22;
    scale(vec: Vector2): MutableMatrix22;
    multiplyScale(vec: Vector2): this;
    /**
     * multiply the input matrix from right side
     */
    multiply(mat: Matrix22): MutableMatrix22;
    multiplyByLeft(mat: Matrix22): MutableMatrix22;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 4 values in 2x2 style (2 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix22;
    static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22;
    static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22;
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22;
    static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22;
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22;
}
