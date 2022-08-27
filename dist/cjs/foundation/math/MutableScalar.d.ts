import { Scalar_ } from './Scalar';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
export declare class MutableScalar_<T extends TypedArrayConstructor> extends Scalar_<T> {
    constructor(x: TypedArray, { type }: {
        type: T;
    });
    copyComponents(vec: Scalar_<T>): void;
    get x(): number;
    set x(x: number);
    get y(): number;
    get z(): number;
    get w(): number;
    /**
     * change to string
     */
    toString(): string;
    setValue(value: number): this;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    get bytesPerComponent(): number;
}
export declare class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
    constructor(x: TypedArray);
    clone(): MutableScalar;
    static one(): MutableScalar;
    static dummy(): MutableScalar;
    static zero(): MutableScalar;
    get className(): string;
}
export declare class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    clone(): MutableScalard;
    static one(): MutableScalard;
    static dummy(): MutableScalard;
    static zero(): MutableScalard;
}
export declare type MutableScalarf = MutableScalar;
