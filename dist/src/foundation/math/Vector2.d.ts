import { IVector2, IVector3, IVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../types/CommonTypes";
export declare class Vector2_<T extends TypedArrayConstructor> implements IVector2 {
    v: TypedArray;
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, { type }: {
        type: T;
    });
    get className(): string;
    clone(): Vector2;
    static add<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>): any;
    static subtract<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>): any;
    isStrictEqual(vec: Vector2_<T>): boolean;
    isEqual(vec: Vector2_<T>, delta?: number): boolean;
    static multiply<T extends TypedArrayConstructor>(vec2: Vector2_<T>, val: number): any;
    get x(): number;
    get y(): number;
    get raw(): TypedArray;
}
export default class Vector2 extends Vector2_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    static zero(): Vector2;
    static one(): Vector2;
    static dummy(): Vector2;
    clone(): Vector2;
}
export declare class Vector2d extends Vector2_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    static zero(): Vector2d;
    static one(): Vector2d;
    static dummy(): Vector2d;
    clone(): Vector2d;
}
export declare type Vector2f = Vector2;
