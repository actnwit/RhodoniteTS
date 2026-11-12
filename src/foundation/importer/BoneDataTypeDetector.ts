import type { RnM2, RnM2Skin } from '../../types/RnM2';
import { BoneDataType, type BoneDataTypeEnum } from '../definitions/BoneDataType';

/**
 * Relative tolerance used to decide whether a scale is uniform.
 * (max - min) <= tolerance * max is treated as uniform.
 */
const UNIFORM_SCALE_RELATIVE_TOLERANCE = 1e-3;

const NODE_SCALE_POINTER_REGEX = /^\/nodes\/([0-9]+)\/scale$/;

/**
 * Checks whether the given three scale components are (almost) uniform.
 *
 * @param x - The x component of the scale
 * @param y - The y component of the scale
 * @param z - The z component of the scale
 * @returns True if the scale is uniform
 */
export function isUniformScale(x: number, y: number, z: number): boolean {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  const max = Math.max(ax, ay, az);
  const min = Math.min(ax, ay, az);
  return max - min <= UNIFORM_SCALE_RELATIVE_TOLERANCE * max;
}

/**
 * Checks whether the scale part of a column-major 4x4 matrix is uniform.
 *
 * @param m - The matrix elements (column-major)
 * @param offset - The offset of the first element in the array
 * @returns True if the scale is uniform
 */
function isUniformScaleOfMatrix(m: ArrayLike<number>, offset = 0): boolean {
  const sx = Math.hypot(m[offset + 0], m[offset + 1], m[offset + 2]);
  const sy = Math.hypot(m[offset + 4], m[offset + 5], m[offset + 6]);
  const sz = Math.hypot(m[offset + 8], m[offset + 9], m[offset + 10]);
  return isUniformScale(sx, sy, sz);
}

/**
 * Checks whether all vec3 scales packed in an array are uniform.
 *
 * @param values - Flattened vec3 values
 * @returns True if all scales are uniform
 */
function areAllUniformScales(values: ArrayLike<number>): boolean {
  for (let i = 0; i + 2 < values.length; i += 3) {
    if (!isUniformScale(values[i], values[i + 1], values[i + 2])) {
      return false;
    }
  }
  return true;
}

/**
 * Chooses the bone data type for a skin of a glTF model.
 *
 * The skinning result depends on the transforms of the joints, the skinned node and their ancestors,
 * and on the inverse bind matrices. If all of their scales (static values and animations) are uniform,
 * or no scale is specified, Vec4x1 (the most compact format, which supports only uniform scale) is chosen.
 * Otherwise Vec4x2 (which supports non-uniform scale) is chosen.
 *
 * Note: _setupAnimation must have been called before this function so that animation output data is available.
 *
 * @param gltfModel - The glTF model
 * @param skin - The skin to check
 * @param skinnedNodeIndex - The index of the node which has the skin
 * @param inverseBindMatrices - The inverse bind matrices of the skin (column-major, 16 elements per joint)
 * @returns Vec4x1 if all scales are uniform, otherwise Vec4x2
 */
export function detectBoneDataTypeForSkin(
  gltfModel: RnM2,
  skin: RnM2Skin,
  skinnedNodeIndex: number,
  inverseBindMatrices?: ArrayLike<number>
): BoneDataTypeEnum {
  const nodes = gltfModel.nodes ?? [];

  // Build a child -> parent map
  const parentMap = new Map<number, number>();
  for (let i = 0; i < nodes.length; i++) {
    const children = nodes[i].children;
    if (children == null) {
      continue;
    }
    for (const child of children) {
      parentMap.set(child, i);
    }
  }

  // Collect the joints, the skinned node, the skeleton root and all of their ancestors
  const targetNodeIndices = new Set<number>();
  const addWithAncestors = (nodeIndex: number | undefined) => {
    let current = nodeIndex;
    while (current != null && !targetNodeIndices.has(current)) {
      targetNodeIndices.add(current);
      current = parentMap.get(current);
    }
  };
  for (const jointIndex of skin.joints) {
    addWithAncestors(jointIndex);
  }
  addWithAncestors(skinnedNodeIndex);
  addWithAncestors(skin.skeleton);

  // Static scales
  for (const nodeIndex of targetNodeIndices) {
    const node = nodes[nodeIndex];
    if (node == null) {
      continue;
    }
    if (node.scale != null && !isUniformScale(node.scale[0], node.scale[1], node.scale[2])) {
      return BoneDataType.Vec4x2;
    }
    if (node.matrix != null && !isUniformScaleOfMatrix(node.matrix)) {
      return BoneDataType.Vec4x2;
    }
  }

  // Animated scales (including KHR_animation_pointer to /nodes/{n}/scale)
  for (const animation of gltfModel.animations ?? []) {
    for (const channel of animation.channels) {
      let nodeIndex: number | undefined;
      if (channel.target.path === 'scale') {
        nodeIndex = channel.target.node;
      } else if (channel.target.path === 'pointer') {
        const pointer = channel.target.extensions?.KHR_animation_pointer?.pointer;
        const match = typeof pointer === 'string' ? pointer.match(NODE_SCALE_POINTER_REGEX) : null;
        if (match != null) {
          nodeIndex = Number.parseInt(match[1], 10);
        }
      }
      if (nodeIndex == null || !targetNodeIndices.has(nodeIndex)) {
        continue;
      }
      const outputValues =
        channel.samplerObject?.outputObject?.extras?.typedDataArray ??
        animation.samplers[channel.sampler]?.outputObject?.extras?.typedDataArray;
      if (outputValues == null) {
        // The values cannot be inspected. Choose the safe format.
        return BoneDataType.Vec4x2;
      }
      // This also checks the in/out tangents of CUBICSPLINE (they are vec3 triplets as well)
      if (!areAllUniformScales(outputValues)) {
        return BoneDataType.Vec4x2;
      }
    }
  }

  // Inverse bind matrices
  if (inverseBindMatrices != null) {
    for (let offset = 0; offset + 15 < inverseBindMatrices.length; offset += 16) {
      if (!isUniformScaleOfMatrix(inverseBindMatrices, offset)) {
        return BoneDataType.Vec4x2;
      }
    }
  }

  return BoneDataType.Vec4x1;
}
