import { Vector3 } from './Vector3';
import { IVector3 } from './IVector';
import { IColorRgb } from './IColor';
export declare class ColorRgb extends Vector3 implements IVector3, IColorRgb {
    constructor(r: Float32Array);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get r(): number;
    get g(): number;
    get b(): number;
    get a(): number;
    static zero(): ColorRgb;
    static one(): ColorRgb;
    static dummy(): ColorRgb;
    static normalize(vec: IVector3): ColorRgb;
    static add(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static subtract(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static multiply(vec: IVector3, value: number): ColorRgb;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static divide(vec: IVector3, value: number): ColorRgb;
    static divideVector(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static cross(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    clone(): ColorRgb;
}
