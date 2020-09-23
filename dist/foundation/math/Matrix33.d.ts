import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import Quaternion from './Quaternion';
import { IMatrix, IMatrix33 } from './IMatrix';
import MutableMatrix33 from './MutableMatrix33';
import { TypedArray } from '../../commontypes/CommonTypes';
import MutableVector3 from './MutableVector3';
export default class Matrix33 implements IMatrix, IMatrix33 {
    v: TypedArray;
    constructor(m: null);
    constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, isColumnMajor?: boolean);
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix33;
    /**
     * Create identity matrix
     */
    static identity(): Matrix33;
    static dummy(): Matrix33;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix33): Matrix33;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix33): Matrix33;
    static invertTo(mat: Matrix33, outMat: MutableMatrix33): MutableMatrix33;
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
    static rotate(vec: Vector3): Matrix33;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector3): Matrix33;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix33, r_mat: Matrix33): Matrix33;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix33): MutableMatrix33;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: Matrix33, delta?: number): boolean;
    isStrictEqual(mat: Matrix33): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: Vector3): any;
    multiplyVectorTo(vec: Vector3, outVec: MutableVector3): MutableVector3;
    getScale(): Vector3;
    getScaleTo(outVec: MutableVector3): MutableVector3;
    clone(): Matrix33;
}
