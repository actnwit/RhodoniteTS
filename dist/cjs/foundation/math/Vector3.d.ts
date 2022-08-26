import { IVector2, IVector3, IVector4, IVector, IMutableVector3 } from './IVector';
import { IQuaternion } from './IQuaternion';
import { AbstractVector } from './AbstractVector';
import { Array3, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
export declare class Vector3_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector, IVector3 {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector3): number;
    static lengthBtw(l_vec: IVector3, r_vec: IVector3): number;
    static angleOfVectors(l_vec: IVector3, r_vec: IVector3): number;
    static _zero(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _one(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * subtract(subtract)
     */
    static _subtract(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * subtract(subtract)
     */
    static subtractTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * multiply(static version)
     */
    static _multiply(vec: IVector3, value: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * multiplyTo(static version)
     */
    static multiplyTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * divide(static version)
     */
    static _divide(vec: IVector3, value: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * divide vector(static version)
     */
    static _divideVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * divide by vector(static version)
     */
    static divideVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * dot product(static version)
     */
    static dot(l_vec: IVector3, r_vec: IVector3): number;
    /**
     * cross product(static version)
     */
    static _cross(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * cross product(static version)
     */
    static crossTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * quaternion * vector3
     */
    static _multiplyQuaternion(quat: IQuaternion, vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * quaternion * vector3
     */
    static multiplyQuaternionTo(quat: IQuaternion, vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * change to string
     */
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IVector3, delta?: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    /**
     * dot product
     */
    dot(vec: IVector3): number;
    get className(): string;
    clone(): any;
    get bytesPerComponent(): number;
    static _lerp(lhs: IVector3, rhs: IVector3, ratio: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyArray3(array: Array3<number>, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
}
export declare class Vector3 extends Vector3_<Float32ArrayConstructor> {
    constructor(v: TypedArray);
    static fromCopyArray3(array: Array3<number>): Vector3;
    static fromCopy3(x: number, y: number, z: number): Vector3;
    static fromCopyArray(array: Array<number>): Vector3;
    static fromCopyVector3(vec3: IVector3): Vector3;
    static fromCopyVector4(vec4: IVector4): Vector3;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3;
    static fromFloat32Array(float32Array: Float32Array): Vector3;
    static fromCopyFloat32Array(float32Array: Float32Array): Vector3;
    static zero(): Vector3;
    static one(): Vector3;
    static dummy(): Vector3;
    static normalize(vec: IVector3): Vector3;
    static add(l_vec: IVector3, r_vec: IVector3): Vector3;
    static subtract(l_vec: IVector3, r_vec: IVector3): Vector3;
    static multiply(vec: IVector3, value: number): Vector3;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3;
    static divide(vec: IVector3, value: number): Vector3;
    static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3;
    static cross(l_vec: IVector3, r_vec: IVector3): Vector3;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3;
    static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3;
}
export declare class Vector3d extends Vector3_<Float64ArrayConstructor> {
    private constructor();
    static fromCopyArray3(array: Array3<number>): Vector3d;
    static fromCopy3(x: number, y: number, z: number): Vector3d;
    static fromCopyArray(array: Array<number>): Vector3d;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3d;
    static fromFloat64Array(float64Array: Float64Array): Vector3d;
    static zero(): Vector3d;
    static one(): Vector3d;
    static dummy(): Vector3d;
    static normalize(vec: IVector3): Vector3d;
    static add(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static subtract(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static multiply(vec: IVector3, value: number): Vector3d;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static divide(vec: IVector3, value: number): Vector3d;
    static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static cross(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3d;
    static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3d;
}
export declare type Vector3f = Vector3;
export declare const ConstVector3_1_1_1: Vector3;
export declare const ConstVector3_0_0_0: Vector3;
