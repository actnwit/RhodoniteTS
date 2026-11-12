import { describe, expect, test } from 'vitest';
import type { RnM2 } from '../../types/RnM2';
import { BoneDataType } from '../definitions/BoneDataType';
import { detectBoneDataTypeForSkin, isUniformScale } from './BoneDataTypeDetector';

type NodeDesc = { children?: number[]; scale?: number[]; matrix?: number[] };
type ChannelDesc = { node?: number; path: string; pointer?: string; output?: number[] };

/**
 * Builds a minimal glTF-like model:
 *   0: root (parent of the skinned mesh node 1 and joint 2)
 *   1: skinned mesh node
 *   2: joint (parent of joint 3)
 *   3: joint
 */
function createModel(overrides: Record<number, NodeDesc> = {}, channels: ChannelDesc[] = []) {
  const nodes: NodeDesc[] = [{ children: [1, 2] }, {}, { children: [3] }, {}];
  for (const [index, desc] of Object.entries(overrides)) {
    nodes[Number(index)] = { ...nodes[Number(index)], ...desc };
  }
  const samplers = channels.map(channel => ({
    outputObject: { extras: { typedDataArray: channel.output ? new Float32Array(channel.output) : undefined } },
  }));
  const animations =
    channels.length > 0
      ? [
          {
            channels: channels.map((channel, i) => ({
              sampler: i,
              target: {
                node: channel.node,
                path: channel.path,
                extensions: channel.pointer ? { KHR_animation_pointer: { pointer: channel.pointer } } : undefined,
              },
              samplerObject: samplers[i],
            })),
            samplers,
          },
        ]
      : [];
  const gltfModel = { nodes, animations } as unknown as RnM2;
  const skin = { joints: [2, 3] } as unknown as RnM2['skins'][number];
  return { gltfModel, skin };
}

function scaleMatrix(sx: number, sy: number, sz: number) {
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 1, 2, 3, 1];
}

describe('BoneDataType.getVec4CountPerJoint', () => {
  test('returns the number of vec4 per joint for each bone data type', () => {
    expect(BoneDataType.getVec4CountPerJoint(BoneDataType.Mat43x1)).toBe(3);
    expect(BoneDataType.getVec4CountPerJoint(BoneDataType.Vec4x2)).toBe(2);
    expect(BoneDataType.getVec4CountPerJoint(BoneDataType.Vec4x1)).toBe(1);
  });
});

describe('isUniformScale', () => {
  test('treats (almost) equal components as uniform', () => {
    expect(isUniformScale(1, 1, 1)).toBe(true);
    expect(isUniformScale(2, 2.0001, 2)).toBe(true);
    expect(isUniformScale(-1, 1, 1)).toBe(true);
    expect(isUniformScale(0, 0, 0)).toBe(true);
    expect(isUniformScale(1, 1.1, 1)).toBe(false);
  });
});

describe('detectBoneDataTypeForSkin', () => {
  test('chooses Vec4x1 when no scale is specified', () => {
    const { gltfModel, skin } = createModel();
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x1);
  });

  test('chooses Vec4x1 for uniform static scales', () => {
    const { gltfModel, skin } = createModel({ 2: { scale: [2, 2, 2] }, 3: { matrix: scaleMatrix(0.5, 0.5, 0.5) } });
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x1);
  });

  test('chooses Vec4x2 for a non-uniform static scale of a joint', () => {
    const { gltfModel, skin } = createModel({ 3: { scale: [1, 2, 1] } });
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x2);
  });

  test('chooses Vec4x2 for a non-uniform matrix scale of the skinned node', () => {
    const { gltfModel, skin } = createModel({ 1: { matrix: scaleMatrix(1, 1, 3) } });
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x2);
  });

  test('chooses Vec4x2 for a non-uniform scale of an ancestor', () => {
    const { gltfModel, skin } = createModel({ 0: { scale: [1, 1, 0.5] } });
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x2);
  });

  test('ignores nodes unrelated to the skin', () => {
    const { gltfModel, skin } = createModel();
    (gltfModel.nodes as NodeDesc[]).push({ scale: [1, 5, 1] });
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x1);
  });

  test('chooses Vec4x1 for uniform scale animations', () => {
    const { gltfModel, skin } = createModel({}, [{ node: 3, path: 'scale', output: [1, 1, 1, 2, 2, 2] }]);
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x1);
  });

  test('chooses Vec4x2 for non-uniform scale animations', () => {
    const { gltfModel, skin } = createModel({}, [{ node: 3, path: 'scale', output: [1, 1, 1, 1, 2, 1] }]);
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x2);
  });

  test('chooses Vec4x2 for non-uniform scale animations via KHR_animation_pointer', () => {
    const { gltfModel, skin } = createModel({}, [
      { path: 'pointer', pointer: '/nodes/2/scale', output: [1, 1, 1, 3, 1, 1] },
    ]);
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x2);
  });

  test('ignores rotation animations and scale animations of unrelated nodes', () => {
    const { gltfModel, skin } = createModel({}, [{ node: 2, path: 'rotation', output: [0, 0, 0, 1] }]);
    (gltfModel.nodes as NodeDesc[]).push({});
    (gltfModel.animations[0].channels as any[]).push({
      sampler: 0,
      target: { node: 4, path: 'scale' },
      samplerObject: { outputObject: { extras: { typedDataArray: new Float32Array([1, 2, 3]) } } },
    });
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1)).toBe(BoneDataType.Vec4x1);
  });

  test('chooses Vec4x2 for non-uniform inverse bind matrices', () => {
    const { gltfModel, skin } = createModel();
    const inverseBindMatrices = new Float32Array([...scaleMatrix(1, 1, 1), ...scaleMatrix(1, 2, 1)]);
    expect(detectBoneDataTypeForSkin(gltfModel, skin, 1, inverseBindMatrices)).toBe(BoneDataType.Vec4x2);
  });
});
