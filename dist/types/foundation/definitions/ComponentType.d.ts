import { EnumIO } from "../misc/EnumIO";
import { TypedArray, Byte } from "../../types/CommonTypes";
export interface ComponentTypeEnum extends EnumIO {
    getSizeInBytes(): Byte;
}
declare const Byte: ComponentTypeEnum;
declare function from(index: number): ComponentTypeEnum;
declare function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum;
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
    HalfFloat: ComponentTypeEnum;
    from: typeof from;
    fromTypedArray: typeof fromTypedArray;
}>;
export {};
