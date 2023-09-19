import { EnumIO } from '../misc/EnumIO';
export declare type BoneDataTypeEnum = EnumIO;
declare function from(index: number): BoneDataTypeEnum;
declare function fromString(str: string): BoneDataTypeEnum;
export declare const BoneDataType: Readonly<{
    Mat43x1: EnumIO;
    Vec4x2: EnumIO;
    Vec4x2Old: EnumIO;
    Vec4x1: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
