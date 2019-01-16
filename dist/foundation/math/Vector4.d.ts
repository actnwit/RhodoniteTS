import Vector2 from './Vector2';
import Vector3 from './Vector3';
import { IVector4 } from './IVector';
export default class Vector4 implements IVector4 {
    v: TypedArray;
    constructor(x: number | TypedArray | Vector2 | Vector3 | IVector4, y?: number, z?: number, w?: number);
    readonly className: string;
    static readonly compositionType: import("../definitions/CompositionType").CompositionTypeEnum;
    isStrictEqual(vec: Vector4): boolean;
    isEqual(vec: Vector4, delta?: number): boolean;
    clone(): Vector4;
    /**
     * Zero Vector
     */
    static zero(): Vector4;
    length(): number;
    static normalize(vec4: Vector4): Vector4;
    /**
     * add value（static version）
     */
    static add(lv: IVector4, rv: IVector4): Vector4;
    static subtract(lv: IVector4, rv: IVector4): Vector4;
    /**
     * add value except w component（static version）
     */
    static addWithOutW(lv: IVector4, rv: IVector4): Vector4;
    static multiply(vec4: IVector4, val: number): Vector4;
    static multiplyVector(vec4: IVector4, vec: IVector4): Vector4;
    static divide(vec4: IVector4, val: number): Vector4;
    static divideVector(lvec4: IVector4, rvec4: IVector4): Vector4;
    toString(): string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}
