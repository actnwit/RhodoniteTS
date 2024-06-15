import { IScalar } from './IVector';
import { FloatTypedArrayConstructor, TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { AbstractVector } from './AbstractVector';
/**
 * @internal
 */
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
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: number;
        readonly __dummyStr: "SCALAR";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): number;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): number;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    get bytesPerComponent(): number;
}
/**
 * Immutable Scalar class with 32bit float components
 */
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
/**
 * Immutable Scalar class with 64bit float components
 */
export declare class Scalard extends Scalar_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyNumber(value: number): Scalard;
    static zero(): Scalard;
    static one(): Scalard;
    static dummy(): Scalard;
    clone(): Scalard;
}
export type Scalarf = Scalar;
