import { expect, test } from 'vitest';
import type { ISceneGraphEntity } from '../../../helpers/EntityHelper';
import { Quaternion, Vector3 } from '../../../math';
import { getRestHeight, getTranslationScale } from './AnimationRetarget';
import { GlobalRetarget } from './GlobalRetarget';
import { GlobalRetargetReverse } from './GlobalRetargetReverse';

type Vec3 = readonly [number, number, number];

type FakeNode = {
  entity: ISceneGraphEntity;
  sceneGraph: {
    positionRest: Vector3;
    parent: FakeNode['sceneGraph'] | null;
    getRotationRest: () => Quaternion;
    entity: ISceneGraphEntity;
  };
};

function createNode({
  positionRest = [0, 0, 0],
  parent,
  hasVrm = false,
  localPosition = [0, 0, 0],
  localPositionRest = localPosition,
}: {
  positionRest?: Vec3;
  parent?: FakeNode;
  hasVrm?: boolean;
  localPosition?: Vec3;
  localPositionRest?: Vec3;
} = {}): FakeNode {
  const sceneGraph = {
    positionRest: Vector3.fromCopy3(...positionRest),
    parent: parent?.sceneGraph ?? null,
    getRotationRest: () => Quaternion.identity(),
  } as unknown as FakeNode['sceneGraph'];
  const entity = {
    getSceneGraph: () => sceneGraph,
    getTransform: () => ({
      localPositionInner: Vector3.fromCopy3(...localPosition),
      localPositionRestInner: Vector3.fromCopy3(...localPositionRest),
    }),
    tryToGetVrm: () => (hasVrm ? {} : undefined),
  } as unknown as ISceneGraphEntity;
  sceneGraph.entity = entity;
  return { entity, sceneGraph };
}

test('getRestHeight includes the rest height stored in parent nodes', () => {
  // A VRM Animation may split the hip height into a parent node ("hipsBase"),
  // leaving only a small offset on the hips node itself.
  const root = createNode();
  const hipsBase = createNode({ positionRest: [0, 0.92, 0], parent: root });
  const hips = createNode({ positionRest: [0, 0.93, 0], parent: hipsBase, localPositionRest: [0, 0.01, 0] });

  expect(getRestHeight(hips.entity)).toBeCloseTo(0.93);
});

test('getRestHeight is measured relative to the VRM root, not the world origin', () => {
  const vrmRoot = createNode({ positionRest: [3, 5, -2], hasVrm: true });
  const hips = createNode({ positionRest: [3, 6.008, -2], parent: vrmRoot, localPositionRest: [0, 1.008, 0] });

  expect(getRestHeight(hips.entity)).toBeCloseTo(1.008);
});

test('translation scale uses the rest height ratio, not the local rest offset', () => {
  const srcRoot = createNode();
  const srcHipsBase = createNode({ positionRest: [0, 0.92, 0], parent: srcRoot });
  const srcHips = createNode({ positionRest: [0, 0.93, 0], parent: srcHipsBase, localPositionRest: [0, 0.01, 0] });
  const dstRoot = createNode({ hasVrm: true });
  const dstHips = createNode({ positionRest: [0, 1.008, 0], parent: dstRoot, localPositionRest: [0, 1.008, 0] });

  const scale = getTranslationScale(
    srcHips.entity,
    dstHips.entity,
    Vector3.fromCopy3(0, 0.01, 0),
    Vector3.fromCopy3(0, 1.008, 0)
  );

  expect(scale).toBeCloseTo(1.008 / 0.93);
});

test('translation scale falls back to local rest lengths for a degenerate rest height', () => {
  // The source bone sits on the skeleton root, so its rest height is zero.
  const srcHips = createNode({ localPositionRest: [0, 0.1, 0] });
  const dstRoot = createNode({ hasVrm: true });
  const dstHips = createNode({ positionRest: [0, 1.008, 0], parent: dstRoot, localPositionRest: [0, 1.008, 0] });

  const scale = getTranslationScale(
    srcHips.entity,
    dstHips.entity,
    Vector3.fromCopy3(0, 0.1, 0),
    Vector3.fromCopy3(0, 1.008, 0)
  );

  expect(scale).toBeCloseTo(10.08);
});

test('GlobalRetarget retargets VRMA hips translation by body proportions', () => {
  const srcRoot = createNode();
  const srcHipsBase = createNode({ positionRest: [0, 0.92, 0], parent: srcRoot });
  const srcHips = createNode({
    positionRest: [0, 0.93, 0],
    parent: srcHipsBase,
    localPosition: [0, 0.01 - 0.62, 0],
    localPositionRest: [0, 0.01, 0],
  });
  const dstRoot = createNode({ hasVrm: true });
  const dstHips = createNode({ positionRest: [0, 1.008, 0], parent: dstRoot, localPositionRest: [0, 1.008, 0] });

  const retarget = new GlobalRetarget(srcHips.entity);
  const translated = retarget.retargetTranslate(dstHips.entity);

  expect(translated.x).toBeCloseTo(0);
  expect(translated.y).toBeCloseTo(1.008 - (0.62 * 1.008) / 0.93);
  expect(translated.z).toBeCloseTo(0);
});

test('GlobalRetargetReverse retargets VRM 0.x hips translation by body proportions', () => {
  const srcRoot = createNode();
  const srcHipsBase = createNode({ positionRest: [0, 0.92, 0], parent: srcRoot });
  const srcHips = createNode({
    positionRest: [0, 0.93, 0],
    parent: srcHipsBase,
    localPosition: [0, 0.01 - 0.62, 0],
    localPositionRest: [0, 0.01, 0],
  });
  const dstRoot = createNode({ hasVrm: true });
  const dstHipsRest: Vec3 = [0.000508846249, 1.00825608, -0.0101614781];
  const dstHips = createNode({ positionRest: dstHipsRest, parent: dstRoot, localPositionRest: dstHipsRest });

  const retarget = new GlobalRetargetReverse(srcHips.entity);
  const translated = retarget.retargetTranslate(dstHips.entity);

  const dstRestHeight = Math.hypot(...dstHipsRest);
  expect(translated.y).toBeCloseTo(dstHipsRest[1] - (0.62 * dstRestHeight) / 0.93);
  // VRM 0.x faces the opposite direction, so X/Z of the rest pose are mirrored.
  expect(translated.x).toBeCloseTo(-dstHipsRest[0]);
  expect(translated.z).toBeCloseTo(-dstHipsRest[2]);
});
