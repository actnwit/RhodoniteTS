import Vector2 from './Vector2';
import { IVector3 } from './IVector';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
export declare class Vector4_<T extends TypedArrayConstructor> implements Vector4 {
    v: TypedArray;
    constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y: number, z: number, w: number, { type }: {
        type: T;
    });
    get className(): string;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    isDummy(): boolean;
    isStrictEqual(vec: Vector4_<T>): boolean;
    isEqual(vec: Vector4_<T>, delta?: number): boolean;
    clone(): any;
    /**
     * Zero Vector
     */
    static zero(): any;
    length(): number;
    copyComponents(vec: Vector4_<T>): void;
    /**
     * add value（static version）
     */
    static add(lv: Vector4, rv: Vector4): any;
    static subtract(lv: Vector4, rv: Vector4): any;
    /**
     * add value except w component（static version）
     */
    static addWithOutW(lv: Vector4, rv: Vector4): any;
    static multiply(vec4: Vector4, val: number): any;
    static multiplyVector(vec4: Vector4, vec: Vector4): any;
    static divide(vec4: Vector4, val: number): any;
    static divideVector(lvec4: Vector4, rvec4: Vector4): any;
    static normalize(vec4: Vector4): any;
    /**
     * dot product
     */
    dotProduct(vec4: Vector4_<T>): number;
    /**
     * dot product(static version)
     */
    static dotProduct<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>): number;
    toString(): string;
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
}
export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number, w?: number);
    static zeroWithWOne(): Vector4;
    static zero(): Vector4;
    static one(): Vector4;
    static dummy(): Vector4;
    clone(): Vector4;
}
export declare class Vector4d extends Vector4_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number, w?: number);
    static zeroWithWOne(): Vector4d;
    static zero(): Vector4d;
    static one(): Vector4d;
    static dummy(): Vector4d;
    clone(): Vector4d;
}
export declare type Vector4f = Vector4;
