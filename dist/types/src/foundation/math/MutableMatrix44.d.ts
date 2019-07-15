import Matrix44 from "./Matrix44";
import { IMutableMatrix44 } from "./IMatrix";
import Matrix33 from "./Matrix33";
import Quaternion from "./Quaternion";
import RowMajarMatrix44 from "./RowMajarMatrix44";
import Vector3 from "./Vector3";
declare const FloatArray: Float32ArrayConstructor;
declare type FloatArray = Float32Array;
export default class MutableMatrix44 extends Matrix44 implements IMutableMatrix44 {
    constructor(m: FloatArray, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: RowMajarMatrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: null);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, m9: number, m10: number, m11: number, m12: number, m13: number, m14: number, m15: number, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    setComponents(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): this;
    copyComponents(mat4: Matrix44): void;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    static dummy(): MutableMatrix44;
    /**
     * to the identity matrix（static版）
     */
    static identity(): MutableMatrix44;
    translate(vec: Vector3): this;
    putTranslate(vec: Vector3): void;
    scale(vec: Vector3): this;
    addScale(vec: Vector3): this;
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian: number): this;
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian: number): this;
    /**
   * Create Z oriented Rotation Matrix
   */
    rotateZ(radian: number): this;
    rotateXYZ(x: number, y: number, z: number): this;
    /**
     * to the identity matrix
     */
    identity(): this;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    /**
   * multiply zero matrix and zero matrix
   */
    multiply(mat: Matrix44 | RowMajarMatrix44): this;
    multiplyByLeft(mat: Matrix44 | RowMajarMatrix44): this;
    invert(): this;
    /**
     * multiply zero matrix and zero matrix(static version)
     */
    static multiply(l_m: Matrix44, r_m: Matrix44): MutableMatrix44;
    /**
     * zero matrix
     */
    zero(): this;
    static zero(): MutableMatrix44;
    m00: any;
    m10: any;
    m20: any;
    m30: any;
    m01: any;
    m11: any;
    m21: any;
    m31: any;
    m02: any;
    m12: any;
    m22: any;
    m32: any;
    m03: any;
    m13: any;
    m23: any;
    m33: any;
}
export {};
