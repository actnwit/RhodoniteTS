import Vector2 from "./Vector2";
import Vector3, { Vector3_ } from "./Vector3";
import { IVector3, IVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
export declare class MutableVector3_<T extends TypedArrayConstructor> extends Vector3_<T> implements IVector3 {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, { type }: {
        type: T;
    });
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    zero(): this;
    one(): this;
    /**
     * to square length
     */
    lengthSquared(): number;
    /**
     * cross product
     */
    cross(v: Vector3): this;
    /**
   * normalize
   */
    normalize(): this;
    /**
   * add value
   */
    add(v: Vector3): this;
    /**
   * subtract
   */
    subtract(v: Vector3): this;
    /**
     * divide
     */
    divide(val: number): this;
    /**
     * multiply
     */
    multiply(val: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: Vector3): this;
    /**
   * divide vector
   */
    divideVector(vec3: Vector3): this;
    get x(): number;
    set x(x: number);
    get y(): number;
    set y(y: number);
    get z(): number;
    set z(z: number);
    get raw(): TypedArray;
    setAt(i: number, value: number): void;
}
export default class MutableVector3 extends MutableVector3_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number);
    clone(): MutableVector3;
    static one(): MutableVector3;
    static dummy(): MutableVector3;
    static zero(): MutableVector3;
}
export declare class MutableVector3d extends MutableVector3_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number);
    clone(): MutableVector3d;
    static one(): MutableVector3d;
    static dummy(): MutableVector3d;
    static zero(): MutableVector3d;
}
export declare type MutableVector3f = MutableVector3;
