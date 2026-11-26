import { expect, test } from 'vitest';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Engine } from '../../system/Engine';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';
import type { SceneGraphComponent } from '../SceneGraph/SceneGraphComponent';
import { createSkeletalEntity } from './createSkeletalEntity';

const engine = await Engine.init({
  approach: ProcessApproach.None,
  canvas: document.createElement('canvas'),
  notToDisplayRnInfoAtInit: true,
});

function createSkeletal(jointCount: number) {
  const skeletal = createSkeletalEntity(engine).getSkeletal();
  const joints: SceneGraphComponent[] = [];
  for (let i = 0; i < jointCount; i++) {
    joints.push(createGroupEntity(engine).getSceneGraph());
  }
  skeletal.setJoints(joints);
  return skeletal;
}

function previousInfoOf(skeletal: ReturnType<typeof createSkeletal>) {
  return Array.from((skeletal as any)._previousBoneDataInfo._v as Float32Array);
}

test('the previous bone data is a single vec4 until it is enabled', () => {
  const skeletal = createSkeletal(5);
  expect(skeletal._previousBoneDataArray.length).toBe(4);
  expect(skeletal._updatePreviousBoneData()).toBe(false);
});

test('enabling allocates the previous bone data with the length of the bone data', () => {
  const skeletal = createSkeletal(5);
  skeletal._enablePreviousBoneData();
  expect(skeletal._previousBoneDataArray.length).toBe(skeletal.boneDataArray.length);
  // Not received yet: the shaders use the current bone data.
  expect(previousInfoOf(skeletal)[3]).toBe(-1);
  // The previous bone data does not overlap the bone data.
  skeletal.boneDataArray.fill(1);
  expect(Array.from(skeletal._previousBoneDataArray).every(v => v === 0)).toBe(true);
});

test('the previous bone data follows the bone data one frame later and settles', () => {
  const skeletal = createSkeletal(3);
  skeletal._enablePreviousBoneData();

  // Frame 1 (before its logic stage): the bone data of frame 0 becomes the previous bone data.
  skeletal.boneDataArray.fill(1);
  expect(skeletal._updatePreviousBoneData()).toBe(true);
  expect(Array.from(skeletal._previousBoneDataArray).every(v => v === 1)).toBe(true);
  expect(previousInfoOf(skeletal)).toEqual(Array.from(skeletal.boneDataInfo._v));

  // The skeleton moves in frame 1.
  skeletal.boneDataArray.fill(2);
  // Frame 2: the previous bone data is the pose of frame 1.
  expect(skeletal._updatePreviousBoneData()).toBe(true);
  expect(Array.from(skeletal._previousBoneDataArray).every(v => v === 2)).toBe(true);
  // Frame 3 and later: nothing moved, nothing to write.
  expect(skeletal._updatePreviousBoneData()).toBe(false);
});

test('re-allocating the bone data re-allocates the enabled previous bone data', () => {
  const skeletal = createSkeletal(2);
  skeletal._enablePreviousBoneData();
  const joints: SceneGraphComponent[] = [];
  for (let i = 0; i < 6; i++) {
    joints.push(createGroupEntity(engine).getSceneGraph());
  }
  skeletal.setJoints(joints);
  expect(skeletal._previousBoneDataArray.length).toBe(skeletal.boneDataArray.length);
  expect(previousInfoOf(skeletal)[3]).toBe(-1);
});
