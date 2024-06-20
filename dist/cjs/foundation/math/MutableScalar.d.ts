import { Scalar_ } from './Scalar';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
/**
 * @internal
 */
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
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
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
 * Mutable Scalar class with 32bit float components
 */
export declare class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
    constructor(x: TypedArray);
    clone(): MutableScalar;
    static one(): MutableScalar;
    static dummy(): MutableScalar;
    static zero(): MutableScalar;
    get className(): string;
}
/**
 * Mutable Scalar class with 64bit float components
 */
export declare class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    clone(): MutableScalard;
    static one(): MutableScalard;
    static dummy(): MutableScalard;
    static zero(): MutableScalard;
}
export type MutableScalarf = MutableScalar;
