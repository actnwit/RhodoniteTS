import Vector2 from "./Vector2";
import Vector3 from "./Vector3";
import { IVector3, IVector4 } from "./IVector";
export default class MutableVector3 extends Vector3 implements IVector3 {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4, y?: number, z?: number);
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
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
    x: number;
    y: number;
    z: number;
    readonly raw: TypedArray;
}
