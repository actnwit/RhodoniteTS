import { IVector2, IVector3, IVector4, IVector, IMutableVector2 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
export declare class Vector2_<T extends TypedArrayConstructor> implements IVector, IVector2 {
    v: TypedArray;
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get className(): string;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
      * to square length(static version)
      */
    static lengthSquared(vec: IVector2): number;
    static lengthBtw(l_vec: IVector2, r_vec: IVector2): number;
    static angleOfVectors(l_vec: IVector2, r_vec: IVector2): number;
    static _zero(type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    static _one(type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    static _dummy(type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector2, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector2, r_vec: IVector2, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
      * add value（static version）
      */
    static addTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
      * subtract value(static version)
      */
    static _subtract(l_vec: IVector2, r_vec: IVector2, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
     * subtract value(static version)
     */
    static subtractTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * multiply value(static version)
     */
    static _multiply(vec: IVector2, value: number, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
     * multiply value(static version)
     */
    static multiplyTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
      * multiply vector(static version)
      */
    static _multiplyVector(l_vec: IVector2, r_vec: IVector2, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
      * multiply vector(static version)
      */
    static multiplyVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * divide by value(static version)
     */
    static _divide(vec: IVector2, value: number, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * divide by vector(static version)
     */
    static _divideVector(l_vec: IVector2, r_vec: IVector2, type: TypedArrayConstructor): Vector2_<TypedArrayConstructor>;
    /**
     * divide by vector(static version)
     */
    static divideVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * dot product(static version)
     */
    static dot(l_vec: IVector2, r_vec: IVector2): number;
    /**
    * change to string
    */
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IVector2, delta?: number): boolean;
    isStrictEqual(vec: IVector2): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector2): number;
    /**
     * dot product
     */
    dot(vec: IVector2): number;
    clone(): any;
}
export default class Vector2 extends Vector2_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    static zero(): Vector2;
    static one(): Vector2;
    static dummy(): Vector2;
    static normalize(vec: IVector2): Vector2;
    static add(l_vec: IVector2, r_vec: IVector2): Vector2;
    static subtract(l_vec: IVector2, r_vec: IVector2): Vector2;
    static multiply(vec: IVector2, value: number): Vector2;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): Vector2;
    static divide(vec: IVector2, value: number): Vector2;
    static divideVector(l_vec: IVector2, r_vec: IVector2): Vector2;
    clone(): Vector2;
}
export declare class Vector2d extends Vector2_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number);
    static zero(): Vector2d;
    static one(): Vector2d;
    static dummy(): Vector2d;
    static normalize(vec: IVector2): Vector2d;
    static add(l_vec: IVector2, r_vec: IVector2): Vector2d;
    static subtract(l_vec: IVector2, r_vec: IVector2): Vector2d;
    static multiply(vec: IVector2, value: number): Vector2d;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): Vector2d;
    static divide(vec: IVector2, value: number): Vector2d;
    static divideVector(l_vec: IVector2, r_vec: IVector2): Vector2d;
    clone(): Vector2d;
}
export declare type Vector2f = Vector2;
