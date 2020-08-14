import { IVector2, IVector3, IVector4, IVector, IMutableVector3 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { IQuaternion } from "./IQuaternion";
export declare class Vector3_<T extends TypedArrayConstructor> implements IVector, IVector3 {
    v: TypedArray;
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, { type }: {
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
    static lengthSquared(vec: IVector3): number;
    static lengthBtw(l_vec: IVector3, r_vec: IVector3): number;
    static angleOfVectors(l_vec: IVector3, r_vec: IVector3): number;
    static _zero(type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    static _one(type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    static _dummy(type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector3, r_vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * subtract(subtract)
     */
    static _subtract(l_vec: IVector3, r_vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
     * subtract(subtract)
     */
    static subtractTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * multiply(static version)
     */
    static _multiply(vec: IVector3, value: number, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
     * multiplyTo(static version)
     */
    static multiplyTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector3, r_vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
      * multiply vector(static version)
      */
    static multiplyVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
   * divide(static version)
   */
    static _divide(vec: IVector3, value: number, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * divide vector(static version)
     */
    static _divideVector(l_vec: IVector3, r_vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
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
    static _cross(l_vec: IVector3, r_vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
    /**
    * cross product(static version)
    */
    static crossTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * quaternion * vector3
     */
    static _multiplyQuaternion(quat: IQuaternion, vec: IVector3, type: TypedArrayConstructor): Vector3_<TypedArrayConstructor>;
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
    clone(): any;
}
export default class Vector3 extends Vector3_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number);
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
    clone(): Vector3;
}
export declare class Vector3d extends Vector3_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number);
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
    clone(): Vector3d;
}
export declare type Vector3f = Vector3;
