import { EnumIO } from "../misc/EnumIO";
export interface BoneDataTypeEnum extends EnumIO {
}
declare function from(index: number): BoneDataTypeEnum;
declare function fromString(str: string): BoneDataTypeEnum;
export declare const BoneDataType: Readonly<{
    Mat4x4: BoneDataTypeEnum;
    Vec4x2: BoneDataTypeEnum;
    Vec4x1: BoneDataTypeEnum;
    from: typeof from;
    fromString: typeof fromString;
}>;
export {};
