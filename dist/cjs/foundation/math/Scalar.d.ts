import { IScalar } from './IVector';
import { FloatTypedArrayConstructor, TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
export declare class Scalar_<T extends TypedArrayConstructor> extends AbstractVector {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    getValue(): number;
    getValueInArray(): number[];
    get x(): number;
    get raw(): TypedArray;
    isStrictEqual(scalar: Scalar_<T>): boolean;
    isEqual(scalar: Scalar_<T>, delta?: number): boolean;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    static _fromCopyNumber(value: number, type: FloatTypedArrayConstructor): Scalar_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Scalar_<FloatTypedArrayConstructor>;
    static get compositionType(): import("../definitions/CompositionType").CompositionTypeEnum;
    get bytesPerComponent(): number;
}
export declare class Scalar extends Scalar_<Float32ArrayConstructor> implements IScalar {
    constructor(x: TypedArray);
    static fromCopyNumber(value: number): Scalar;
    static zero(): Scalar;
    static one(): Scalar;
    static dummy(): Scalar;
    get className(): string;
    /**
     * change to string
     */
    toString(): string;
    clone(): Scalar;
}
export declare class Scalard extends Scalar_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyNumber(value: number): Scalard;
    static zero(): Scalard;
    static one(): Scalard;
    static dummy(): Scalard;
    clone(): Scalard;
}
export declare type Scalarf = Scalar;
