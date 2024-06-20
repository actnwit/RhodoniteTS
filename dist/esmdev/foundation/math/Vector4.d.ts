import { IVector2, IVector3, IVector4, IMutableVector4 } from './IVector';
import { Array4, FloatTypedArray, FloatTypedArrayConstructor } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
/**
 *
 * @internal
 */
export declare class Vector4_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector4 {
    protected constructor(v: FloatTypedArray, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    static _fromCopyArray4(array: Array4<number>, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopy4(x: number, y: number, z: number, w: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: number;
        readonly __dummyStr: "VEC4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): number;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): number;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector4): number;
    static lengthBtw(l_vec: IVector4, r_vec: IVector4): number;
    /**
     * Zero Vector
     */
    static _zero(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _one(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * subtract(static version)
     */
    static _subtract(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * subtract(static version)
     */
    static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * multiply(static version)
     */
    static _multiply(vec: IVector4, value: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * multiplyTo(static version)
     */
    static multiplyTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * divide(static version)
     */
    static _divide(vec: IVector4, value: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
    /**
     * divide vector(static version)
     */
    static _divideVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
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
    get className(): string;
    clone(): any;
    get bytesPerComponent(): number;
}
/**
 * Immutable 4D(x,y,z,w) Vector class with 32bit float components
 *
 * @example
 * ```
 * const vec1 = Rn.Vector4.fromCopy4(1, 2, 3, 1);
 * const vec2 = Rn.Vector4.fromCopyArray4([2, 3, 3, 1]);
 * const dotProduct = vec1.dot(vec2);
 * ```
 */
export declare class Vector4 extends Vector4_<Float32ArrayConstructor> {
    constructor(x: Float32Array);
    static fromCopyArray(array: Array<number>): Vector4;
    static fromCopyArray4(array: Array4<number>): Vector4;
    static fromCopy4(x: number, y: number, z: number, w: number): Vector4;
    static fromCopyVector3(vec3: IVector3): Vector4;
    static fromCopyVector4(vec4: IVector4): Vector4;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4;
    static fromFloat32Array(float32Array: Float32Array): Vector4;
    static fromCopyFloat32Array(float32Array: Float32Array): Vector4;
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
/**
 * Immutable 4D(x,y,z,w) Vector class with 64bit float components
 */
export declare class Vector4d extends Vector4_<Float64ArrayConstructor> {
    private constructor();
    static fromCopyArray4(array: Array4<number>): Vector4d;
    static fromCopy4(x: number, y: number, z: number, w: number): Vector4d;
    static fromCopyArray(array: Array4<number>): Vector4d;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4d;
    static fromFloat64Array(float64Array: Float64Array): Vector4d;
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
export type Vector4f = Vector4;
export declare const ConstVector4_1_1_1_1: Vector4;
export declare const ConstVector4_0_0_0_1: Vector4;
export declare const ConstVector4_0_0_0_0: Vector4;
