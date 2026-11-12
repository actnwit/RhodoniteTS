import { type EnumIO } from '../misc/EnumIO';
export type BoneDataTypeEnum = EnumIO;
declare function from(index: number): BoneDataTypeEnum;
declare function fromString(str: string): BoneDataTypeEnum;
/**
 * Returns how many vec4 slots one joint occupies in the GPU bone data array.
 *
 * - Mat43x1: 3 (a 4x3 matrix)
 * - Vec4x2: 2 (translation + scale, with a log-quaternion packed into the w components)
 * - Vec4x1: 1 (log-quaternion + quantized translation/uniform scale)
 *
 * @param boneDataType - The bone data type
 * @returns The number of vec4 slots per joint
 */
declare function getVec4CountPerJoint(boneDataType: BoneDataTypeEnum): number;
export declare const BoneDataType: Readonly<{
    Mat43x1: EnumIO;
    Vec4x2: EnumIO;
    Vec4x1: EnumIO;
    from: typeof from;
    fromString: typeof fromString;
    getVec4CountPerJoint: typeof getVec4CountPerJoint;
}>;
export {};
