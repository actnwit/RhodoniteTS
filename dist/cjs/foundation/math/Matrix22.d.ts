import { Matrix33 } from './Matrix33';
import { IMatrix22 } from './IMatrix';
import { Vector2 } from './Vector2';
import { MutableMatrix22 } from './MutableMatrix22';
import { MutableVector2 } from './MutableVector2';
import { AbstractMatrix } from './AbstractMatrix';
import { Array4 } from '../../types';
export declare class Matrix22 extends AbstractMatrix implements IMatrix22 {
    constructor(m: Float32Array);
    get m00(): number;
    get m10(): number;
    get m01(): number;
    get m11(): number;
    get className(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../../types").IndexOf16Bytes;
        readonly __dummyStr: "MAT2";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): import("../../types").Count;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../../types").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * Create zero matrix
     */
    static zero(): Matrix22;
    /**
     * Create identity matrix
     */
    static identity(): Matrix22;
    static dummy(): Matrix22;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix22): Matrix22;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix22): Matrix22;
    static invertTo(mat: Matrix22, outMat: MutableMatrix22): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    static rotate(radian: number): Matrix22;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector2): Matrix22;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix22, r_mat: Matrix22): Matrix22;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix22): MutableMatrix22;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: Matrix22, delta?: number): boolean;
    isStrictEqual(mat: Matrix22): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: Vector2): Vector2;
    multiplyVectorTo(vec: Vector2, outVec: MutableVector2): MutableVector2;
    getScale(): Vector2;
    getScaleTo(outVec: MutableVector2): MutableVector2;
    clone(): any;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 4 values in 2x2 style (2 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): Matrix22;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): Matrix22;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix22;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix22;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix22;
    static fromCopyMatrix22(mat: IMatrix22): Matrix22;
    static fromCopyArray9ColumnMajor(array: Array4<number>): Matrix22;
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix22;
    static fromCopyArray9RowMajor(array: Array4<number>): Matrix22;
    static fromCopyArrayRowMajor(array: Array<number>): Matrix22;
}
