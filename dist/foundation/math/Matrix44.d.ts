import Vector3 from './Vector3';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Vector4 from './Vector4';
import { IMatrix44 } from './IMatrix';
import MutableVector3 from './MutableVector3';
import MutableMatrix44 from './MutableMatrix44';
import MutableVector4 from './MutableVector4';
import { TypedArray } from '../../commontypes/CommonTypes';
import { IVector3 } from './IVector';
declare const FloatArray: Float32ArrayConstructor;
declare type FloatArray = Float32Array;
export default class Matrix44 implements IMatrix44 {
    v: TypedArray;
    constructor(m: FloatArray, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: null);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, m9: number, m10: number, m11: number, m12: number, m13: number, m14: number, m15: number, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    static dummy(): Matrix44;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    isDummy(): boolean;
    get className(): string;
    clone(): Matrix44;
    static fromQuaternionTo(m: Quaternion, outMat: MutableMatrix44): void;
    /**
     * to the identity matrix（static version）
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
    multiplyVectorTo(vec: Vector4, outVec: MutableVector4): void;
    multiplyVectorToVec3(vec: Vector4, outVec: MutableVector3): void;
    multiplyVector3(vec: Vector3): Vector3;
    multiplyVector3To(vec: IVector3, outVec: MutableVector3): void;
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m: Matrix44, r_m: Matrix44): Matrix44;
    static multiplyTo(l_m: Matrix44, r_m: Matrix44, out: MutableMatrix44): void;
    determinant(): number;
    static determinant(m: Matrix44): number;
    static invert(m: Matrix44): Matrix44;
    static invertTo(m: Matrix44, outM: MutableMatrix44): MutableMatrix44;
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
    toString(): string;
    nearZeroToZero(value: number): number;
    toStringApproximately(): string;
    getScale(): Vector3;
    getRotate(): Matrix44;
    /**
   * get translate vector from this matrix
   */
    getTranslateTo(out: MutableVector3): void;
    /**
     * get scale vector from this matrix
     */
    getScaleTo(out: MutableVector3): void;
}
export {};
