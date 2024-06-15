import { EnumClass, EnumIO } from '../misc/EnumIO';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { Gltf2AccessorComponentTypeNumber } from '../../types/glTF2';
export interface ComponentTypeEnum extends EnumIO {
    wgsl: string;
    webgpu: string;
    getSizeInBytes(): number;
    isFloatingPoint(): boolean;
    isInteger(): boolean;
}
declare class ComponentTypeClass<TypeName extends string> extends EnumClass implements ComponentTypeEnum {
    readonly __webgpu: string;
    readonly __wgsl: string;
    readonly __sizeInBytes: number;
    readonly __dummyStr: TypeName;
    constructor({ index, str, sizeInBytes, wgsl, webgpu, }: {
        index: number;
        str: TypeName;
        sizeInBytes: number;
        wgsl: string;
        webgpu: string;
    });
    get wgsl(): string;
    get webgpu(): string;
    getSizeInBytes(): number;
    isFloatingPoint(): boolean;
    isInteger(): boolean;
    isUnsignedInteger(): boolean;
}
declare const Byte: ComponentTypeClass<"BYTE">;
declare const UnsignedByte: ComponentTypeClass<"UNSIGNED_BYTE">;
declare const Short: ComponentTypeClass<"SHORT">;
declare const UnsignedShort: ComponentTypeClass<"UNSIGNED_SHORT">;
declare const Int: ComponentTypeClass<"INT">;
declare const UnsignedInt: ComponentTypeClass<"UNSIGNED_INT">;
declare const Float: ComponentTypeClass<"FLOAT">;
declare function from(index: number): ComponentTypeEnum;
declare function fromString(str: string): ComponentTypeEnum;
declare function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum;
declare function toTypedArray(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
declare function fromWgslString(str_: string): ComponentTypeEnum;
declare function fromGlslString(str_: string): ComponentTypeEnum;
export type Gltf2AccessorComponentType = typeof Byte | typeof UnsignedByte | typeof Short | typeof UnsignedShort | typeof Int | typeof UnsignedInt | typeof Float;
declare function toGltf2AccessorComponentType(componentTypeForGltf2: ComponentTypeEnum): Gltf2AccessorComponentTypeNumber;
export declare const ComponentType: Readonly<{
    Unknown: ComponentTypeClass<"UNKNOWN">;
    Byte: ComponentTypeClass<"BYTE">;
    UnsignedByte: ComponentTypeClass<"UNSIGNED_BYTE">;
    Short: ComponentTypeClass<"SHORT">;
    UnsignedShort: ComponentTypeClass<"UNSIGNED_SHORT">;
    Int: ComponentTypeClass<"INT">;
    UnsignedInt: ComponentTypeClass<"UNSIGNED_INT">;
    Float: ComponentTypeClass<"FLOAT">;
    Double: ComponentTypeClass<"DOUBLE">;
    Bool: ComponentTypeClass<"BOOL">;
    HalfFloat: ComponentTypeClass<"HALF_FLOAT">;
    from: typeof from;
    fromTypedArray: typeof fromTypedArray;
    toTypedArray: typeof toTypedArray;
    toGltf2AccessorComponentType: typeof toGltf2AccessorComponentType;
    fromString: typeof fromString;
    fromGlslString: typeof fromGlslString;
    fromWgslString: typeof fromWgslString;
}>;
export {};
