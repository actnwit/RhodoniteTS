import { Vector2_ } from './Vector2';
import { IVector2, IMutableVector, IMutableVector2 } from './IVector';
import { TypedArray, FloatTypedArrayConstructor, Array2 } from '../../types/CommonTypes';
/**
 * @internal
 */
export declare class MutableVector2_<T extends FloatTypedArrayConstructor> extends Vector2_<T> {
    constructor(x: TypedArray, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    get z(): number;
    get w(): number;
    raw(): TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number): this;
    copyComponents(vec: IVector2): this;
    zero(): this;
    one(): this;
    normalize(): this;
    /**
     * add value
     */
    add(vec: IVector2): this;
    /**
     * subtract
     */
    subtract(vec: IVector2): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector2): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
     * divide vector
     */
    divideVector(vec: IVector2): this;
    get bytesPerComponent(): number;
}
/**
 * Mutable 2D(x,y) Vector class with 32bit float components
 */
export declare class MutableVector2 extends MutableVector2_<Float32ArrayConstructor> implements IMutableVector, IMutableVector2 {
    constructor(x: TypedArray);
    static fromCopyArray2(array: Array2<number>): MutableVector2;
    static fromCopyArray(array: Array<number>): MutableVector2;
    static fromFloat32Array(float32Array: Float32Array): MutableVector2;
    static fromCopyFloat32Array(float32Array: Float32Array): MutableVector2;
    static zero(): MutableVector2;
    static one(): MutableVector2;
    static dummy(): MutableVector2;
    static normalize(vec: IVector2): MutableVector2;
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static multiply(vec: IVector2, value: number): MutableVector2;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static divide(vec: IVector2, value: number): MutableVector2;
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    get className(): string;
    clone(): MutableVector2;
}
/**
 * Mutable 2D(x,y) Vector class with 64bit float components
 */
export declare class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyArray(array: Array2<number>): MutableVector2d;
    static zero(): MutableVector2d;
    static one(): MutableVector2d;
    static dummy(): MutableVector2d;
    static normalize(vec: IVector2): MutableVector2d;
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static multiply(vec: IVector2, value: number): MutableVector2d;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static divide(vec: IVector2, value: number): MutableVector2d;
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    clone(): MutableVector2d;
}
export declare type MutableVector2f = MutableVector2;
