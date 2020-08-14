import Matrix44 from "./Matrix44";
import { IMutableMatrix22, IMutableMatrix } from "./IMatrix";
import Matrix22 from "./Matrix22";
import { Index } from "../../commontypes/CommonTypes";
import Matrix33 from "./Matrix33";
import Vector2 from "./Vector2";
export default class MutableMatrix22 extends Matrix22 implements IMutableMatrix, IMutableMatrix22 {
    constructor(m: null);
    constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean);
    constructor(m: Matrix22, isColumnMajor?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean);
    constructor(m0: number, m1: number, m2: number, m3: number, isColumnMajor?: boolean);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    /**
     * Create zero matrix
     */
    static zero(): MutableMatrix22;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix22;
    static dummy(): MutableMatrix22;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix22): MutableMatrix22;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix22): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    static rotate(radian: number): MutableMatrix22;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector2): MutableMatrix22;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix22, r_mat: Matrix22): MutableMatrix22;
    clone(): MutableMatrix22;
    raw(): import("../../commontypes/CommonTypes").TypedArray;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    copyComponents(mat: Matrix22 | Matrix33 | Matrix44): this;
    /**
     * zero matrix
     */
    zero(): MutableMatrix22;
    identity(): MutableMatrix22;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    rotate(radian: number): MutableMatrix22;
    scale(vec: Vector2): MutableMatrix22;
    putScale(vec: Vector2): this;
    /**
      * multiply the input matrix from right side
      */
    multiply(mat: Matrix22): MutableMatrix22;
    multiplyByLeft(mat: Matrix22): MutableMatrix22;
}
