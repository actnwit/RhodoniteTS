import { IVector2, IVector3, IVector4, IVector, IMutableVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
export declare class Vector4_<T extends TypedArrayConstructor> implements IVector, IVector4 {
    v: TypedArray;
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get className(): string;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector4): number;
    static lengthBtw(l_vec: IVector4, r_vec: IVector4): number;
    /**
     * Zero Vector
     */
    static _zero(type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    static _one(type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    static _dummy(type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector4, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * subtract(static version)
     */
    static _subtract(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * subtract(static version)
     */
    static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * multiply(static version)
     */
    static _multiply(vec: IVector4, value: number, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * multiplyTo(static version)
     */
    static multiplyTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * divide(static version)
     */
    static _divide(vec: IVector4, value: number, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
    /**
     * divide vector(static version)
     */
    static _divideVector(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor): Vector4_<TypedArrayConstructor>;
    /**
     * divide by vector(static version)
     */
    static divideVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * dot product(static version)
     */
    static dot(l_vec: IVector4, r_vec: IVector4): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IVector4, delta?: number): boolean;
    isStrictEqual(vec: IVector4): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector4): number;
    /**
     * dot product
     */
    dot(vec: IVector4): number;
    clone(): any;
}
export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number);
    static zero(): Vector4;
    static one(): Vector4;
    static dummy(): Vector4;
    static normalize(vec: IVector4): Vector4;
    static add(l_vec: IVector4, r_vec: IVector4): Vector4;
    static subtract(l_vec: IVector4, r_vec: IVector4): Vector4;
    static multiply(vec: IVector4, value: number): Vector4;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): Vector4;
    static divide(vec: IVector4, value: number): Vector4;
    static divideVector(l_vec: IVector4, r_vec: IVector4): Vector4;
    clone(): Vector4;
}
export declare class Vector4d extends Vector4_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number);
    static zero(): Vector4d;
    static one(): Vector4d;
    static dummy(): Vector4d;
    static normalize(vec: IVector4): Vector4d;
    static add(l_vec: IVector4, r_vec: IVector4): Vector4d;
    static subtract(l_vec: IVector4, r_vec: IVector4): Vector4d;
    static multiply(vec: IVector4, value: number): Vector4d;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): Vector4d;
    static divide(vec: IVector4, value: number): Vector4d;
    static divideVector(l_vec: IVector4, r_vec: IVector4): Vector4d;
    clone(): Vector4d;
}
export declare type Vector4f = Vector4;
