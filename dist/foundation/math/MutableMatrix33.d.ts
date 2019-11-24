import Matrix44 from "./Matrix44";
import Quaternion from "./Quaternion";
import { IMutableMatrix33 } from "./IMatrix";
import Matrix33 from "./Matrix33";
import Vector3 from "./Vector3";
import { Index } from "../../types/CommonTypes";
export default class MutableMatrix33 extends Matrix33 implements IMutableMatrix33 {
    constructor(m: null);
    constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
    constructor(m: Array<number>, isColumnMajor?: boolean);
    constructor(m: Matrix33, isColumnMajor?: boolean);
    constructor(m: Matrix44, isColumnMajor?: boolean);
    constructor(m: Quaternion, isColumnMajor?: boolean);
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, m6: number, m7: number, m8: number, isColumnMajor?: boolean);
    setComponents(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    copyComponents(mat: Matrix33 | Matrix44): void;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    static dummy(): MutableMatrix33;
    identity(): this;
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian: number): MutableMatrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian: number): this;
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian: number): MutableMatrix33;
    /**
   * Create X oriented Rotation Matrix
   */
    static rotateX(radian: number): MutableMatrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): MutableMatrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): MutableMatrix33;
    scale(vec: Vector3): MutableMatrix33;
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    static rotate(vec3: Vector3): MutableMatrix33;
    /**
     * zero matrix
     */
    zero(): this;
    raw(): import("../../types/CommonTypes").TypedArray;
    flattenAsArray(): number[];
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    /**
     * multiply zero matrix and zero matrix
     */
    multiply(mat: Matrix33): MutableMatrix33;
    invert(): MutableMatrix33;
    addScale(vec: Vector3): this;
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m20(val: number);
    get m20(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    set m21(val: number);
    get m21(): number;
    set m02(val: number);
    get m02(): number;
    set m12(val: number);
    get m12(): number;
    set m22(val: number);
    get m22(): number;
}
