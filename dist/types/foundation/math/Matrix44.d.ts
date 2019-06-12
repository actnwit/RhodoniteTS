import Vector3 from './Vector3';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Vector4 from './Vector4';
import RowMajarMatrix44 from './RowMajarMatrix44';
import { IMatrix44 } from './IMatrix';
import MutableVector3 from './MutableVector3';
import MutableMatrix44 from './MutableMatrix44';
declare const FloatArray: Float32ArrayConstructor;
declare type FloatArray = Float32Array;
export default class Matrix44 implements IMatrix44 {
    v: TypedArray;
    constructor(m: FloatArray, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: RowMajarMatrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: null);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, m9: number, m10: number, m11: number, m12: number, m13: number, m14: number, m15: number, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    static dummy(): Matrix44;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    isDummy(): boolean;
    readonly className: string;
    clone(): Matrix44;
    static fromQuaternionTo(m: Quaternion, outMat: MutableMatrix44): void;
    /**
     * to the identity matrix（static版）
     */
    static identity(): Matrix44;
    isEqual(mat: Matrix44, delta?: number): boolean;
    getTranslate(): Vector3;
    static translate(vec: Vector3): Matrix44;
    static scale(vec: Vector3): Matrix44;
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
    /**
     * @return Euler Angles Rotation (x, y, z)
     */
    toEulerAngles(): Vector3;
    toEulerAnglesTo(outVec3: MutableVector3): void;
    static zero(): Matrix44;
    flattenAsArray(): number[];
    /**
     * transpose(static version)
     */
    static transpose(mat: Matrix44): Matrix44;
    multiplyVector(vec: Vector4): Vector4;
    multiplyVector3(vec: Vector3): Vector3;
    multiplyVector3To(vec: Vector3, outVec: MutableVector3): void;
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m: Matrix44, r_m: Matrix44): Matrix44;
    determinant(): number;
    static determinant(m: Matrix44): number;
    static invert(m: Matrix44 | RowMajarMatrix44): Matrix44;
    static invertTo(m: Matrix44, outM: MutableMatrix44): void;
    readonly m00: number;
    readonly m10: number;
    readonly m20: number;
    readonly m30: number;
    readonly m01: number;
    readonly m11: number;
    readonly m21: number;
    readonly m31: number;
    readonly m02: number;
    readonly m12: number;
    readonly m22: number;
    readonly m32: number;
    readonly m03: number;
    readonly m13: number;
    readonly m23: number;
    readonly m33: number;
    toString(): string;
    nearZeroToZero(value: number): number;
    toStringApproximately(): string;
    getScale(): Vector3;
    getRotate(): Matrix44;
}
export {};
