import { Vector2_ } from "./Vector2";
import { IVector2, IVector3, IVector4, IMutableVector, IMutableVector2 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
export declare class MutableVector2_<T extends TypedArrayConstructor> extends Vector2_<T> implements IMutableVector, IMutableVector2 {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    raw(): TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number): this;
    copyComponents(vec: IVector2): this;
    zero(): this;
    one(): this;
    normalize(): this;
    /**
     * add value
     */
    add(vec: IVector2): this;
    /**
      * subtract
      */
    subtract(vec: IVector2): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector2): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
      * divide vector
      */
    divideVector(vec: IVector2): this;
}
export default class MutableVector2 extends MutableVector2_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    static zero(): MutableVector2;
    static one(): MutableVector2;
    static dummy(): MutableVector2;
    static normalize(vec: IVector2): MutableVector2;
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static multiply(vec: IVector2, value: number): MutableVector2;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static divide(vec: IVector2, value: number): MutableVector2;
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    clone(): MutableVector2;
}
export declare class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    static zero(): MutableVector2d;
    static one(): MutableVector2d;
    static dummy(): MutableVector2d;
    static normalize(vec: IVector2): MutableVector2d;
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static multiply(vec: IVector2, value: number): MutableVector2d;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static divide(vec: IVector2, value: number): MutableVector2d;
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    clone(): MutableVector2d;
}
export declare type MutableVector2f = MutableVector2;
