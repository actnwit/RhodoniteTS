import Vector2 from "./Vector2";
import Vector3 from "./Vector3";
import { Vector4_ } from "./Vector4";
import { IVector4, IMutableVector4, IVector3 } from "./IVector";
export declare class MutableVector4_<T extends TypedArrayConstructor> extends Vector4_<T> implements IMutableVector4 {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: {
        type: T;
    });
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    normalize(): this;
    normalize3(): void;
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
export default class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number);
    clone(): MutableVector4;
    static one(): MutableVector4;
    static dummy(): MutableVector4;
    static zero(): MutableVector4;
    static zeroWithWOne(): MutableVector4;
}
export declare class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number);
    clone(): MutableVector4d;
    static one(): MutableVector4d;
    static dummy(): MutableVector4d;
    static zero(): MutableVector4d;
    static zeroWithWOne(): MutableVector4d;
}
export declare type MutableVector4f = MutableVector4;
