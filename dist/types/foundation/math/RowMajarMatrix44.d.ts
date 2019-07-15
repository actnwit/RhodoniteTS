import Vector3 from './Vector3';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Vector4 from './Vector4';
import MutableVector3 from './MutableVector3';
import MutableRowMajarMatrix44 from './MutableRowMajarMatrix44';
import MutableVector4 from './MutableVector4';
import { TypedArray } from '../../types/CommonTypes';
declare const FloatArray: Float32ArrayConstructor;
declare type FloatArray = Float32Array;
export default class RowMajarMatrix44 {
    v: TypedArray;
    constructor(m: FloatArray, notCopyFloatArray?: Boolean);
    constructor(m: Array<number>, notCopyFloatArray?: Boolean);
    constructor(m: Matrix33, notCopyFloatArray?: Boolean);
    constructor(m: RowMajarMatrix44, notCopyFloatArray?: Boolean);
    constructor(m: Quaternion, notCopyFloatArray?: Boolean);
    constructor(m: null);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, m9: number, m10: number, m11: number, m12: number, m13: number, m14: number, m15: number, notCopyFloatArray?: Boolean);
    static dummy(): RowMajarMatrix44;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    isDummy(): boolean;
    readonly className: string;
    clone(): RowMajarMatrix44;
    /**
     * to the identity matrix（static版）
     */
    static identity(): RowMajarMatrix44;
    isEqual(mat: RowMajarMatrix44, delta?: number): boolean;
    getTranslate(): Vector3;
    static translate(vec: Vector3): RowMajarMatrix44;
    static scale(vec: Vector3): RowMajarMatrix44;
    /**
     * Create X oriented Rotation Matrix
    */
    static rotateX(radian: number): RowMajarMatrix44;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): RowMajarMatrix44;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): RowMajarMatrix44;
    /**
     * @return Euler Angles Rotation (x, y, z)
     */
    toEulerAngles(): Vector3;
    static zero(): RowMajarMatrix44;
    raw(): TypedArray;
    flattenAsArray(): number[];
    /**
     * transpose(static version)
     */
    static transpose(mat: RowMajarMatrix44): RowMajarMatrix44;
    static transposeTo(mat: RowMajarMatrix44, outMat: MutableRowMajarMatrix44): void;
    multiplyVector(vec: Vector4): Vector4;
    multiplyVectorTo(vec: Vector4, outVec: MutableVector4): void;
    multiplyVectorToVec3(vec: Vector4, outVec: MutableVector3): void;
    multiplyVector3(vec: Vector3): Vector3;
    multiplyVector3To(vec: Vector3, outVec: MutableVector3): void;
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m: RowMajarMatrix44, r_m: RowMajarMatrix44): RowMajarMatrix44;
    determinant(): number;
    static determinant(mat: RowMajarMatrix44): number;
    static invert(mat: RowMajarMatrix44): RowMajarMatrix44;
    static invertTo(mat: RowMajarMatrix44, outMat: MutableRowMajarMatrix44): void;
    readonly m00: number;
    readonly m01: number;
    readonly m02: number;
    readonly m03: number;
    readonly m10: number;
    readonly m11: number;
    readonly m12: number;
    readonly m13: number;
    readonly m20: number;
    readonly m21: number;
    readonly m22: number;
    readonly m23: number;
    readonly m30: number;
    readonly m31: number;
    readonly m32: number;
    readonly m33: number;
    toString(): string;
    nearZeroToZero(value: number): number;
    toStringApproximately(): string;
    getScale(): Vector3;
    getRotate(): RowMajarMatrix44;
}
export {};
