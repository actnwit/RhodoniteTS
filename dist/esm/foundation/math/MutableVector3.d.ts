import { IVector3, IMutableVector, IMutableVector3 } from './IVector';
import { TypedArray, FloatTypedArrayConstructor, Array3 } from '../../types/CommonTypes';
import { Vector3_ } from './Vector3';
import { IQuaternion } from './IQuaternion';
export declare class MutableVector3_<T extends FloatTypedArrayConstructor> extends Vector3_<T> implements IMutableVector, IMutableVector3 {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    set z(z: number);
    get z(): number;
    get w(): number;
    raw(): TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number, z: number): this;
    copyComponents(vec: IVector3): this;
    zero(): this;
    one(): this;
    /**
     * normalize
     */
    normalize(): this;
    /**
     * add value
     */
    add(vec: IVector3): this;
    /**
     * subtract
     */
    subtract(vec: IVector3): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector3): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
     * divide vector
     */
    divideVector(vec: IVector3): this;
    /**
     * cross product
     */
    cross(vec: IVector3): this;
    /**
     * quaternion * vector3
     */
    multiplyQuaternion(quat: IQuaternion): this;
    get bytesPerComponent(): number;
    static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor): MutableVector3_<FloatTypedArrayConstructor>;
}
export declare class MutableVector3 extends MutableVector3_<Float32ArrayConstructor> {
    constructor(v: TypedArray);
    static zero(): MutableVector3;
    static one(): MutableVector3;
    static dummy(): MutableVector3;
    static normalize(vec: IVector3): MutableVector3;
    static add(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static subtract(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static multiply(vec: IVector3, value: number): MutableVector3;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static divide(vec: IVector3, value: number): MutableVector3;
    static divideVector(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static cross(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): MutableVector3;
    get className(): string;
    static fromCopy3(x: number, y: number, z: number): MutableVector3;
    static fromCopyArray3(array: Array3<number>): MutableVector3;
    static fromCopyArray(array: Array<number>): MutableVector3;
    static fromFloat32Array(float32Array: Float32Array): MutableVector3;
    static fromCopyFloat32Array(float32Array: Float32Array): MutableVector3;
    clone(): MutableVector3;
}
export declare class MutableVector3d extends MutableVector3_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static zero(): MutableVector3d;
    static one(): MutableVector3d;
    static dummy(): MutableVector3d;
    static normalize(vec: IVector3): MutableVector3d;
    static add(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static subtract(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static multiply(vec: IVector3, value: number): MutableVector3d;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static divide(vec: IVector3, value: number): MutableVector3d;
    static divideVector(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static cross(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): MutableVector3d;
    static fromCopy3(x: number, y: number, z: number): MutableVector3d;
    static fromCopyArray3(array: Array3<number>): MutableVector3d;
    static fromCopyArray(array: Array<number>): MutableVector3d;
    clone(): MutableVector3d;
}
export declare type MutableVector3f = MutableVector3;
