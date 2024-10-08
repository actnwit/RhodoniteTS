import { MutableVector4 } from './MutableVector4';
import { IVector4, IMutableVector4 } from './IVector';
import { IMutableColorRgba } from './IColor';
export declare class MutableColorRgba extends MutableVector4 implements IMutableVector4, IMutableColorRgba {
    constructor(r: Float32Array);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
    get w(): number;
    set w(val: number);
    get r(): number;
    set r(val: number);
    get g(): number;
    set g(val: number);
    get b(): number;
    set b(val: number);
    get a(): number;
    set a(val: number);
    static zero(): MutableColorRgba;
    static one(): MutableColorRgba;
    static dummy(): MutableColorRgba;
    static normalize(vec: IVector4): MutableColorRgba;
    static add(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    static subtract(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    static multiply(vec: IVector4, value: number): MutableColorRgba;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    static divide(vec: IVector4, value: number): MutableColorRgba;
    static divideVector(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    clone(): MutableColorRgba;
}
