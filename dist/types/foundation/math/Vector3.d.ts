import Vector2 from './Vector2';
import Vector4 from './Vector4';
import { IVector3 } from './IVector';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
export declare class Vector3_<T extends TypedArrayConstructor> implements IVector3 {
    v: TypedArray;
    constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y: number, z: number, { type }: {
        type: T;
    });
    readonly className: string;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    isStrictEqual(vec: Vector3_<T>): boolean;
    isEqual(vec: Vector3_<T>, delta?: number): boolean;
    isDummy(): boolean;
    length(): number;
    copyComponents(vec: Vector3_<T>): void;
    /**
     * to square length(static verison)
     */
    static lengthSquared<T extends TypedArrayConstructor>(vec3: Vector3_<T>): number;
    lengthTo(vec3: Vector3_<T>): number;
    static lengthBtw<T extends TypedArrayConstructor>(lhv: Vector3_<T>, rhv: Vector3_<T>): number;
    /**
     * dot product
     */
    dotProduct(vec3: Vector3_<T>): number;
    /**
     * dot product(static version)
     */
    static dotProduct<T extends TypedArrayConstructor>(lv: Vector3_<T>, rv: Vector3_<T>): number;
    /**
    * cross product(static version)
    */
    static cross<T extends TypedArrayConstructor>(lv: Vector3_<T>, rv: Vector3_<T>): any;
    /**
     * normalize(static version)
     */
    static normalize<T extends TypedArrayConstructor>(vec3: Vector3_<T>): any;
    /**
     * add value（static version）
     */
    static add<T extends TypedArrayConstructor>(lv: Vector3_<T>, rv: Vector3_<T>): any;
    /**
     * subtract(subtract)
     */
    static subtract<T extends TypedArrayConstructor>(lv: Vector3_<T>, rv: Vector3_<T>): any;
    /**
     * divide(static version)
     */
    static divide<T extends TypedArrayConstructor>(vec3: Vector3_<T>, val: number): any;
    /**
     * multiply(static version)
     */
    static multiply<T extends TypedArrayConstructor>(vec3: Vector3_<T>, val: number): any;
    /**
     * multiply vector(static version)
     */
    static multiplyVector<T extends TypedArrayConstructor>(vec3: Vector3_<T>, vec: Vector3_<T>): any;
    static angleOfVectors<T extends TypedArrayConstructor>(lhv: Vector3_<T>, rhv: Vector3_<T>): number;
    /**
     * divide vector(static version)
     */
    static divideVector<T extends TypedArrayConstructor>(lvec3: Vector3_<T>, rvec3: Vector3_<T>): any;
    /**
     * change to string
     */
    toString(): string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    readonly raw: TypedArray;
}
export default class Vector3 extends Vector3_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number);
    static zero(): Vector3;
    static one(): Vector3;
    static dummy(): Vector3;
    clone(): Vector3;
}
export declare class Vector3d extends Vector3_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number);
    static zero(): Vector3d;
    static one(): Vector3d;
    static dummy(): Vector3d;
    clone(): Vector3d;
}
export declare type Vector3f = Vector3;
