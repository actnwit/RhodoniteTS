import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import Quaternion from './Quaternion';
import { IMatrix33 } from './IMatrix';
import { TypedArray } from '../../types/CommonTypes';
export default class Matrix33 implements IMatrix33 {
    v: TypedArray;
    constructor(m: null);
    constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, isColumnMajor?: boolean);
    readonly className: string;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    multiplyVector(vec: Vector3): any;
    /**
     * Make this identity matrix（static method version）
     */
    static identity(): Matrix33;
    static dummy(): Matrix33;
    isDummy(): boolean;
    clone(): Matrix33;
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
    static rotate(vec3: Vector3): Matrix33;
    static scale(vec: Vector3): Matrix33;
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix33;
    /**
     * transpose(static version)
     */
    static transpose(mat: Matrix33): Matrix33;
    /**
     * multiply matrixs (static version)
     */
    static multiply(l_m: Matrix33, r_m: Matrix33): Matrix33;
    determinant(): number;
    static determinant(mat: Matrix33): number;
    static invert(mat: Matrix33): Matrix33;
    readonly m00: number;
    readonly m10: number;
    readonly m20: number;
    readonly m01: number;
    readonly m11: number;
    readonly m21: number;
    readonly m02: number;
    readonly m12: number;
    readonly m22: number;
    toString(): string;
    nearZeroToZero(value: number): number;
    toStringApproximately(): string;
    getScale(): Vector3;
    isEqual(mat: Matrix44, delta?: number): boolean;
}
