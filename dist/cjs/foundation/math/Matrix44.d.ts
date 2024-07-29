import { Vector3 } from './Vector3';
import { IMatrix, IMatrix33, IMatrix44 } from './IMatrix';
import { MutableVector3 } from './MutableVector3';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableVector4 } from './MutableVector4';
import { IVector3 } from './IVector';
import { IVector4 } from './IVector';
import { IdentityMatrix44 } from './IdentityMatrix44';
import { AbstractMatrix } from './AbstractMatrix';
import { Array16, ArrayType } from '../../types/CommonTypes';
import { IQuaternion } from './IQuaternion';
declare const FloatArray: Float32ArrayConstructor;
type FloatArray = Float32Array;
export declare class Matrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
    constructor(m: FloatArray);
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m30(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m31(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get m32(): number;
    get m03(): number;
    get m13(): number;
    get m23(): number;
    get m33(): number;
    get translateX(): number;
    get translateY(): number;
    get translateZ(): number;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../../types/CommonTypes").IndexOf16Bytes;
        readonly __dummyStr: "MAT4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): import("../../types/CommonTypes").Count;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../../types/CommonTypes").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix44;
    /**
     * Create identity matrix
     */
    static identity(): IdentityMatrix44;
    static dummy(): Matrix44;
    /**
     * Create transpose matrix
     */
    static transpose(mat: IMatrix44): IMatrix44 | Matrix44;
    /**
     * Create invert matrix
     */
    static invert(mat: IMatrix44): IMatrix44;
    static invertTo(mat: IMatrix44, outMat: MutableMatrix44): MutableMatrix44;
    /**
     * Create translation Matrix
     */
    static translate(vec: Vector3): Matrix44;
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian: number): Matrix44;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): Matrix44;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): Matrix44;
    static rotateXYZ(x: number, y: number, z: number): Matrix44;
    static rotate(vec: IVector3): Matrix44;
    /**
     * Create Scale Matrix
     */
    static scale(vec: IVector3): Matrix44;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: IMatrix44, r_mat: IMatrix44): IMatrix44;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: IMatrix44, r_mat: IMatrix44, outMat: MutableMatrix44): MutableMatrix44;
    static multiplyTypedArrayTo(l_mat: IMatrix44, r_array: ArrayType, outMat: MutableMatrix44, offsetAsComposition: number): MutableMatrix44;
    static fromQuaternionTo(quat: IQuaternion, outMat: MutableMatrix44): MutableMatrix44;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: IMatrix44, delta?: number): boolean;
    isStrictEqual(mat: IMatrix44): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector4): IVector4;
    multiplyVectorTo(vec: IVector4, outVec: MutableVector4): MutableVector4;
    multiplyVectorToVec3(vec: IVector4, outVec: MutableVector3): MutableVector3;
    multiplyVector3(vec: IVector3): IVector3;
    multiplyVector3To(vec: IVector3, outVec: MutableVector3): MutableVector3;
    getTranslate(): Vector3;
    /**
     * get translate vector from this matrix
     */
    getTranslateTo(outVec: MutableVector3): MutableVector3;
    getScale(): Vector3;
    /**
     * get scale vector from this matrix
     */
    getScaleTo(outVec: MutableVector3): MutableVector3;
    /**
     * @return Euler Angles Rotation (x, y, z)
     */
    toEulerAngles(): Vector3;
    toEulerAnglesTo(outVec3: MutableVector3): MutableVector3;
    clone(): Matrix44;
    getRotate(): Matrix44;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 16 values in 4x4 style (4 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): Matrix44;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): Matrix44;
    static fromCopyMatrix44(mat: Matrix44): Matrix44;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix44;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix44;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix44;
    static fromCopyMatrix33(mat: IMatrix33): Matrix44;
    static fromCopyArray16ColumnMajor(array: Array16<number>): Matrix44;
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix44;
    static fromCopyArray16RowMajor(array: Array16<number>): Matrix44;
    static fromCopyArrayRowMajor(array: Array<number>): Matrix44;
    static fromCopyQuaternion(q: IQuaternion): Matrix44;
}
export {};
