import { EnumIO } from '../misc/EnumIO';
import { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import { Gltf2AccessorComponentTypeNumber } from '../../types/glTF2';
export interface ComponentTypeEnum extends EnumIO {
    getSizeInBytes(): number;
    isFloatingPoint(): boolean;
    isInteger(): boolean;
}
declare const Byte: ComponentTypeEnum;
declare const UnsignedByte: ComponentTypeEnum;
declare const Short: ComponentTypeEnum;
declare const UnsignedShort: ComponentTypeEnum;
declare const Int: ComponentTypeEnum;
declare const UnsignedInt: ComponentTypeEnum;
declare const Float: ComponentTypeEnum;
declare function from(index: number): ComponentTypeEnum;
declare function fromString(str: string): ComponentTypeEnum;
declare function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum;
declare function toTypedArray(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
declare function fromGlslString(str_: string): ComponentTypeEnum;
export declare type Gltf2AccessorComponentType = typeof Byte | typeof UnsignedByte | typeof Short | typeof UnsignedShort | typeof Int | typeof UnsignedInt | typeof Float;
declare function toGltf2AccessorComponentType(componentTypeForGltf2: Gltf2AccessorComponentType): Gltf2AccessorComponentTypeNumber;
export declare const ComponentType: Readonly<{
    Unknown: ComponentTypeEnum;
    Byte: ComponentTypeEnum;
    UnsignedByte: ComponentTypeEnum;
    Short: ComponentTypeEnum;
    UnsignedShort: ComponentTypeEnum;
    Int: ComponentTypeEnum;
    UnsignedInt: ComponentTypeEnum;
    Float: ComponentTypeEnum;
    Double: ComponentTypeEnum;
    Bool: ComponentTypeEnum;
    HalfFloat: ComponentTypeEnum;
    from: typeof from;
    fromTypedArray: typeof fromTypedArray;
    toTypedArray: typeof toTypedArray;
    toGltf2AccessorComponentType: typeof toGltf2AccessorComponentType;
    fromString: typeof fromString;
    fromGlslString: typeof fromGlslString;
}>;
export {};