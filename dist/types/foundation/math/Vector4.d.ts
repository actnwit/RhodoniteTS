import Vector2 from './Vector2';
import { IVector4, IVector3 } from './IVector';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
export declare class Vector4_<T extends TypedArrayConstructor> implements IVector4 {
    v: TypedArray;
    constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: {
        type: T;
    });
    readonly className: string;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
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
    static add(lv: IVector4, rv: IVector4): any;
    static subtract(lv: IVector4, rv: IVector4): any;
    /**
     * add value except w component（static version）
     */
    static addWithOutW(lv: IVector4, rv: IVector4): any;
    static multiply(vec4: IVector4, val: number): any;
    static multiplyVector(vec4: IVector4, vec: IVector4): any;
    static divide(vec4: IVector4, val: number): any;
    static divideVector(lvec4: IVector4, rvec4: IVector4): any;
    static normalize(vec4: IVector4): any;
    toString(): string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
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
