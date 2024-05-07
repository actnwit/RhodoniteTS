import { IVector2, IVector3, IVector4, IVector, IMutableVector2 } from './IVector';
import type { Array2, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
/**
 * @internal
 */
export declare class Vector2_<T extends FloatTypedArrayConstructor> extends AbstractVector {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector2): number;
    static lengthBtw(l_vec: IVector2, r_vec: IVector2): number;
    static angleOfVectors(l_vec: IVector2, r_vec: IVector2): number;
    static _zero(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _one(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * subtract value(static version)
     */
    static _subtract(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * subtract value(static version)
     */
    static subtractTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * multiply value(static version)
     */
    static _multiply(vec: IVector2, value: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * multiply value(static version)
     */
    static multiplyTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * divide by value(static version)
     */
    static _divide(vec: IVector2, value: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * divide by vector(static version)
     */
    static _divideVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
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
    static _fromCopyArray2(array: Array2<number>, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopy2(x: number, y: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    get bytesPerComponent(): number;
}
/**
 * Immutable 2D(x,y) Vector class with 32bit float components
 */
export declare class Vector2 extends Vector2_<Float32ArrayConstructor> implements IVector, IVector2 {
    constructor(x: TypedArray);
    static fromCopyArray2(array: Array2<number>): Vector2;
    static fromCopy2(x: number, y: number): Vector2;
    static fromCopyArray(array: Array<number>): Vector2;
    static fromCopyVector2(vec2: IVector2): Vector2;
    static fromCopyVector4(vec4: IVector4): Vector2;
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
    get className(): string;
    clone(): Vector2;
}
/**
 * Immutable 2D(x,y) Vector class with 64bit float components
 */
export declare class Vector2d extends Vector2_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyArray2(array: Array2<number>): Vector2d;
    static fromCopy2(x: number, y: number): Vector2d;
    static fromCopyArray(array: Array<number>): Vector2d;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector2d;
    static fromFloat64Array(float64Array: Float64Array): Vector2d;
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
export type Vector2f = Vector2;
export declare const ConstVector2_1_1: Vector2;
export declare const ConstVector2_0_0: Vector2;
