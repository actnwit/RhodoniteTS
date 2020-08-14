import Vector3 from './Vector3';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Vector4 from './Vector4';
import { IMatrix, IMatrix44 } from './IMatrix';
import MutableVector3 from './MutableVector3';
import MutableMatrix44 from './MutableMatrix44';
import MutableVector4 from './MutableVector4';
import { TypedArray } from '../../commontypes/CommonTypes';
import { IVector3 } from './IVector';
declare const FloatArray: Float32ArrayConstructor;
declare type FloatArray = Float32Array;
export default class Matrix44 implements IMatrix, IMatrix44 {
    v: TypedArray;
    constructor(m: FloatArray, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: null);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, m9: number, m10: number, m11: number, m12: number, m13: number, m14: number, m15: number, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
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
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix44;
    /**
     * Create identity matrix
     */
    static identity(): Matrix44;
    static dummy(): Matrix44;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix44): Matrix44;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix44): Matrix44;
    static invertTo(mat: Matrix44, outMat: MutableMatrix44): MutableMatrix44;
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
    static rotate(vec: Vector3): Matrix44;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector3): Matrix44;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix44, r_mat: Matrix44): Matrix44;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: Matrix44, r_mat: Matrix44, outMat: MutableMatrix44): MutableMatrix44;
    static fromQuaternionTo(quat: Quaternion, outMat: MutableMatrix44): MutableMatrix44;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: Matrix44, delta?: number): boolean;
    isStrictEqual(mat: Matrix44): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: Vector4): Vector4;
    multiplyVectorTo(vec: Vector4, outVec: MutableVector4): MutableVector4;
    multiplyVectorToVec3(vec: Vector4, outVec: MutableVector3): MutableVector3;
    multiplyVector3(vec: Vector3): Vector3;
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
}
export {};
