import type { RnM2, RnM2Skin } from '../../types/RnM2';
import { type BoneDataTypeEnum } from '../definitions/BoneDataType';
/**
 * Checks whether the given three scale components are (almost) uniform.
 * The same criterion is used by SkeletalComponent at runtime (see MathUtil.isUniformScale).
 *
 * @param x - The x component of the scale
 * @param y - The y component of the scale
 * @param z - The z component of the scale
 * @returns True if the scale is uniform
 */
export declare function isUniformScale(x: number, y: number, z: number): boolean;
/**
 * Chooses the bone data type for a skin of a glTF model.
 *
 * The skinning result depends on the transforms of the joints, the skinned node and their ancestors,
 * and on the inverse bind matrices. If all of their scales (static values and animations) are uniform,
 * or no scale is specified, Vec4x1 (the most compact format, which supports only uniform scale) is chosen.
 * Otherwise Vec4x2 (which supports non-uniform scale) is chosen.
 * If a non-uniform scale still appears at runtime (e.g. an animation assigned later), SkeletalComponent
 * switches the automatically selected Vec4x1 to Vec4x2.
 *
 * Note: _setupAnimation must have been called before this function so that animation output data is available.
 *
 * @param gltfModel - The glTF model
 * @param skin - The skin to check
 * @param skinnedNodeIndex - The index of the node which has the skin
 * @param inverseBindMatrices - The inverse bind matrices of the skin (column-major, 16 elements per joint)
 * @returns Vec4x1 if all scales are uniform, otherwise Vec4x2
 */
export declare function detectBoneDataTypeForSkin(gltfModel: RnM2, skin: RnM2Skin, skinnedNodeIndex: number, inverseBindMatrices?: ArrayLike<number>): BoneDataTypeEnum;
