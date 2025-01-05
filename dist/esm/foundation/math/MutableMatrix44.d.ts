import { Matrix44 } from './Matrix44';
import { IMutableMatrix44, IMutableMatrix, IMatrix44, IMatrix33 } from './IMatrix';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
import { Array16, Index } from '../../types/CommonTypes';
import { IQuaternion } from './IQuaternion';
import { MutableVector3 } from './MutableVector3';
declare const FloatArray: Float32ArrayConstructor;
type FloatArray = Float32Array;
export declare class MutableMatrix44 extends Matrix44 implements IMutableMatrix, IMutableMatrix44 {
    constructor(m: FloatArray);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m20(val: number);
    get m20(): number;
    set m30(val: number);
    get m30(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    set m21(val: number);
    get m21(): number;
    set m31(val: number);
    get m31(): number;
    set m02(val: number);
    get m02(): number;
    set m12(val: number);
    get m12(): number;
    set m22(val: number);
    get m22(): number;
    set m32(val: number);
    get m32(): number;
    set m03(val: number);
    get m03(): number;
    set m13(val: number);
    get m13(): number;
    set m23(val: number);
    get m23(): number;
    set m33(val: number);
    get m33(): number;
    get translateX(): number;
    set translateX(val: number);
    get translateY(): number;
    set translateY(val: number);
    get translateZ(): number;
    set translateZ(val: number);
    get className(): string;
    /**
     * zero matrix(static version)
     */
    static zero(): MutableMatrix44;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix44;
    static dummy(): MutableMatrix44;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix44): Matrix44;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix44): MutableMatrix44;
    /**
     * Create translation Matrix
     */
    static translate(vec: Vector3): MutableMatrix44;
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian: number): MutableMatrix44;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): MutableMatrix44;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): MutableMatrix44;
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix44;
    static rotate(vec: Vector3): MutableMatrix44;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector3): MutableMatrix44;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix44, r_mat: Matrix44): MutableMatrix44;
    clone(): MutableMatrix44;
    getRotate(): MutableMatrix44;
    getTranslate(): MutableVector3;
    getTranslateTo(outVec: MutableVector3): MutableVector3;
    getScale(): MutableVector3;
    raw(): Float32Array;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): this;
    copyComponents(mat: IMatrix44): this;
    /**
     * zero matrix
     */
    zero(): this;
    /**
     * to the identity matrix
     */
    identity(): this;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): this;
    translate(vec: Vector3): this;
    putTranslate(vec: Vector3): this;
    addTranslate(vec: Vector3): this;
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian: number): this;
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian: number): this;
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian: number): this;
    rotateXYZ(x: number, y: number, z: number): this;
    rotate(vec: Vector3): this;
    scale(vec: Vector3): this;
    multiplyScale(vec: Vector3): this;
    /**
     * multiply the input matrix from right side
     */
    multiply(mat: Matrix44): this;
    multiplyByLeft(mat: Matrix44): this;
    fromQuaternion(quat: IQuaternion): this;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 16 values in 4x4 style (4 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): MutableMatrix44;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): MutableMatrix44;
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix44;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix44;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix44;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix44;
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix44;
    static fromCopyArray16ColumnMajor(array: Array16<number>): MutableMatrix44;
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix44;
    static fromCopyArray16RowMajor(array: Array16<number>): MutableMatrix44;
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix44;
    static fromCopyQuaternion(q: Quaternion): MutableMatrix44;
}
export {};
