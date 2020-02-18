import { Vector2_ } from "./Vector2";
import { IVector2, IVector3, IVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
export declare class MutableVector2_<T extends TypedArrayConstructor> extends Vector2_<T> implements IVector2 {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    set x(x: number);
    set y(y: number);
    multiply(val: number): this;
}
export default class MutableVector2 extends MutableVector2_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    clone(): MutableVector2;
    static one(): MutableVector2;
    static dummy(): MutableVector2;
    static zero(): MutableVector2;
}
export declare class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    clone(): MutableVector2d;
    static one(): MutableVector2d;
    static dummy(): MutableVector2d;
    static zero(): MutableVector2d;
}
export declare type MutableVector2f = MutableVector2;
