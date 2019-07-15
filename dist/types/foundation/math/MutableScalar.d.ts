import { IScalar } from "./IVector";
import { Scalar_ } from "./Scalar";
import { TypedArray, TypedArrayConstructor } from "../../types/CommonTypes";
export declare class MutableScalar_<T extends TypedArrayConstructor> extends Scalar_<T> implements IScalar {
    constructor(x: number | TypedArray | null, { type }: {
        type: T;
    });
    x: number;
    setValue(value: number): void;
}
export default class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
    constructor(x: number | TypedArray | null);
    clone(): MutableScalar;
    static one(): MutableScalar;
    static dummy(): MutableScalar;
    static zero(): MutableScalar;
}
export declare class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
    constructor(x: number | TypedArray | null);
    clone(): MutableScalard;
    static one(): MutableScalard;
    static dummy(): MutableScalard;
    static zero(): MutableScalard;
}
export declare type MutableScalarf = MutableScalar;
