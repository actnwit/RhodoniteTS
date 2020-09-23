import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
import { IMatrix, IMatrix22 } from './IMatrix';
import { TypedArray } from '../../commontypes/CommonTypes';
import Vector2 from './Vector2';
import MutableMatrix22 from './MutableMatrix22';
import MutableVector2 from './MutableVector2';
export default class Matrix22 implements IMatrix, IMatrix22 {
    v: TypedArray;
    constructor(m: null);
    constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean);
    constructor(m: Matrix22, isColumnMajor?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean);
    constructor(m0: number, m1: number, m2: number, m3: number, isColumnMajor?: boolean);
    get m00(): number;
    get m10(): number;
    get m01(): number;
    get m11(): number;
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
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
    multiplyVector(vec: Vector2): any;
    multiplyVectorTo(vec: Vector2, outVec: MutableVector2): MutableVector2;
    getScale(): Vector2;
    getScaleTo(outVec: MutableVector2): MutableVector2;
    clone(): Matrix22;
}
