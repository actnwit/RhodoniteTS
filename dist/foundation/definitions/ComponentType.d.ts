import { EnumIO } from "../misc/EnumIO";
import { TypedArray, Byte } from "../../types/CommonTypes";
export interface ComponentTypeEnum extends EnumIO {
    getSizeInBytes(): Byte;
}
declare const Byte: ComponentTypeEnum;
declare function from(index: number): ComponentTypeEnum;
declare function fromString(str: string): ComponentTypeEnum;
declare function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum;
declare function fromGlslString(str_: string): ComponentTypeEnum;
export declare const ComponentType: Readonly<{
    Unknown: ComponentTypeEnum;
    Byte: ComponentTypeEnum;
    UnsignedByte: ComponentTypeEnum;
    Short: ComponentTypeEnum;
    UnsignedShort: ComponentTypeEnum;
    Int: ComponentTypeEnum;
    UnsingedInt: ComponentTypeEnum;
    Float: ComponentTypeEnum;
    Double: ComponentTypeEnum;
    Bool: ComponentTypeEnum;
    HalfFloat: ComponentTypeEnum;
    from: typeof from;
    fromTypedArray: typeof fromTypedArray;
    fromString: typeof fromString;
    fromGlslString: typeof fromGlslString;
}>;
export {};
