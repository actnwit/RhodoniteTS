import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
import { IMatrix22 } from './IMatrix';
import { TypedArray } from '../../types/CommonTypes';
import Vector2 from './Vector2';
export default class Matrix22 implements IMatrix22 {
    v: TypedArray;
    constructor(m: null);
    constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean);
    constructor(m: Matrix22, isColumnMajor?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean);
    constructor(m0: number, m1: number, m2: number, m3: number, isColumnMajor?: boolean);
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    multiplyVector(vec: Vector2): any;
    /**
     * Make this identity matrix（static method version）
     */
    static identity(): Matrix22;
    static dummy(): Matrix22;
    isDummy(): boolean;
    clone(): Matrix22;
    /**
     * Create Rotation Matrix
     */
    static rotate(radian: number): Matrix22;
    static scale(vec: Vector2): Matrix22;
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix22;
    /**
     * transpose(static version)
     */
    static transpose(mat: Matrix22): Matrix22;
    /**
     * multiply matrixs (static version)
     */
    static multiply(l_m: Matrix22, r_m: Matrix22): Matrix22;
    determinant(): number;
    static determinant(mat: Matrix22): number;
    static invert(mat: Matrix22): Matrix22;
    get m00(): number;
    get m10(): number;
    get m01(): number;
    get m11(): number;
    toString(): string;
    nearZeroToZero(value: number): number;
    toStringApproximately(): string;
    isEqual(mat: Matrix22, delta?: number): boolean;
}
