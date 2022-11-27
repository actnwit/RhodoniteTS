import { IVector4, IMutableVector, IMutableVector4 } from './IVector';
import { Array4, FloatTypedArray, FloatTypedArrayConstructor } from '../../types/CommonTypes';
import { Vector4_ } from './Vector4';
/**
 * @internal
 */
export declare class MutableVector4_<T extends FloatTypedArrayConstructor> extends Vector4_<T> implements IMutableVector, IMutableVector4 {
    constructor(x: FloatTypedArray, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    set z(z: number);
    get z(): number;
    set w(w: number);
    get w(): number;
    raw(): import("../../types/CommonTypes").TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number, z: number, w: number): this;
    copyComponents(vec: IVector4): this;
    zero(): this;
    one(): this;
    get bytesPerComponent(): number;
    /**
     * normalize
     */
    normalize(): this;
    normalize3(): this;
    /**
     * add value
     */
    add(vec: IVector4): this;
    /**
     * subtract
     */
    subtract(vec: IVector4): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector4): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
     * divide vector
     */
    divideVector(vec: IVector4): this;
    get _updateCount(): number;
    private __updateCount;
}
/**
 * Mutable 4D(x,y,z,w) Vector class with 32bit float components
 */
export declare class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
    constructor(x: Float32Array);
    static fromCopyArray(array: Array<number>): MutableVector4;
    static fromCopyArray4(array: Array4<number>): MutableVector4;
    static zero(): MutableVector4;
    static one(): MutableVector4;
    static dummy(): MutableVector4;
    static normalize(vec: IVector4): MutableVector4;
    static add(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    static subtract(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    static multiply(vec: IVector4, value: number): MutableVector4;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    static divide(vec: IVector4, value: number): MutableVector4;
    static divideVector(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    get className(): string;
    clone(): any;
}
/**
 * Mutable 4D(x,y,z,w) Vector class with 64bit float components
 */
export declare class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
    constructor(x: Float64Array);
    static zero(): MutableVector4d;
    static one(): MutableVector4d;
    static dummy(): MutableVector4d;
    static normalize(vec: IVector4): MutableVector4d;
    static add(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static subtract(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static multiply(vec: IVector4, value: number): MutableVector4d;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static divide(vec: IVector4, value: number): MutableVector4d;
    static divideVector(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static fromCopyArray4(array: Array4<number>): MutableVector4d;
    static fromCopyArray(array: Array<number>): MutableVector4d;
    clone(): MutableVector4d;
}
export declare type MutableVector4f = MutableVector4;
