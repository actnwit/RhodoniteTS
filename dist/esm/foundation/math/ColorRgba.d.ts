import { Vector4 } from './Vector4';
import { IVector4 } from './IVector';
import { IColorRgba } from './IColor';
import { Array4 } from '../../types/CommonTypes';
/**
 * A RGBA color.
 */
export declare class ColorRgba extends Vector4 implements IVector4, IColorRgba {
    constructor(r: Float32Array);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get r(): number;
    get g(): number;
    get b(): number;
    get a(): number;
    static zero(): ColorRgba;
    static one(): ColorRgba;
    static dummy(): ColorRgba;
    static normalize(vec: IVector4): ColorRgba;
    static add(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static subtract(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static multiply(vec: IVector4, value: number): ColorRgba;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static divide(vec: IVector4, value: number): ColorRgba;
    static divideVector(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    clone(): ColorRgba;
    static fromCopyArray(array: Array<number>): ColorRgba;
    static fromCopyArray4(array: Array4<number>): ColorRgba;
    static fromCopy4(x: number, y: number, z: number, w: number): ColorRgba;
    static fromCopyVector4(vec4: IVector4): ColorRgba;
}
export declare const ConstRgbaWhite: ColorRgba;
export declare const ConstRgbaBlack: ColorRgba;
