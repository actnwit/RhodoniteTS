import Vector3 from './Vector3';
import { IVector3, IVector4 } from './IVector';
import { IColorRgb } from './IColor';
import { TypedArray } from '../../commontypes/CommonTypes';
export default class ColorRgb extends Vector3 implements IVector3, IColorRgb {
    constructor(r: number | TypedArray | IVector3 | IVector4 | Array<number> | null, g?: number, b?: number);
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
