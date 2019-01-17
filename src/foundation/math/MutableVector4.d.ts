import Vector2 from "./Vector2";
import Vector3 from "./Vector3";
import Vector4 from "./Vector4";
import { IVector4, IMutableVector4 } from "./IVector";
export default class MutableVector4 extends Vector4 implements IMutableVector4 {
    constructor(x: number | TypedArray | Vector2 | Vector3 | IVector4, y?: number, z?: number, w?: number);
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    normalize(): this;
    /**
     * add value
     */
    add(v: IVector4): this;
    /**
   * add value except w component
   */
    addWithOutW(v: IVector4 | Vector3): this;
    subtract(v: IVector4): this;
    multiply(val: number): this;
    multiplyVector(vec: IVector4): this;
    divide(val: number): this;
    divideVector(vec4: IVector4): this;
    x: number;
    y: number;
    z: number;
    w: number;
    readonly raw: TypedArray;
    private __Error;
}
