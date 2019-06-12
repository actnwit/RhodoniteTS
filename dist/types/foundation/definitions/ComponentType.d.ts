import { EnumIO } from "../misc/EnumIO";
export interface ComponentTypeEnum extends EnumIO {
    getSizeInBytes(): Byte;
}
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
    Bool: ComponentTypeEnum;
    HalfFloat: ComponentTypeEnum;
    from: typeof from;
    fromTypedArray: typeof fromTypedArray;
}>;
export {};
