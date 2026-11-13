import { describe, expect, test, vi } from 'vitest';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Matrix44 } from '../../math/Matrix44';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Engine } from '../../system/Engine';
import { createMeshEntity } from '../MeshRenderer/createMeshEntity';
import { createGroupEntity } from './createGroupEntity';

describe('SceneGraph world matrix memoization', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });

  test('memoizes ancestor world matrices computed by a descendant', () => {
    const rootEntity = createGroupEntity(engine);
    const parentEntity = createGroupEntity(engine);
    const childEntity = createGroupEntity(engine);

    rootEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    parentEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    childEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    rootEntity.getSceneGraph().addChild(parentEntity.getSceneGraph());
    parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());

    const parentSceneGraph = parentEntity.getSceneGraph();
    const childSceneGraph = childEntity.getSceneGraph();
    const parentLocalMatrixSpy = vi.spyOn(parentEntity.getTransform(), 'getLocalMatrixInnerTo');
    const rootLocalMatrixSpy = vi.spyOn(rootEntity.getTransform(), 'getLocalMatrixInnerTo');
    const parentVersionBefore = parentSceneGraph.worldMatrixVersion;

    // Reading the child first must compute and memoize the root and parent too.
    const childMatrix = childSceneGraph.matrixInner;
    expect(parentSceneGraph.worldMatrixVersion).toBe(parentVersionBefore);
    expect(parentLocalMatrixSpy).toHaveBeenCalledTimes(1);
    expect(rootLocalMatrixSpy).toHaveBeenCalledTimes(1);
    expect((parentSceneGraph as any).__isWorldMatrixUpToDate).toBe(true);
    expect((rootEntity.getSceneGraph() as any).__isWorldMatrixUpToDate).toBe(true);
    expect(childMatrix.isEqual(Matrix44.fromCopy16RowMajor(1, 0, 0, 3, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), 1e-6)).toBe(
      true
    );

    // Reading the parent afterwards must not recompute it.
    parentSceneGraph.matrixInner;
    expect(parentLocalMatrixSpy).toHaveBeenCalledTimes(1);
    expect(rootLocalMatrixSpy).toHaveBeenCalledTimes(1);
  });

  test('recomputes the memoized ancestors after a dirty mark', () => {
    const rootEntity = createGroupEntity(engine);
    const parentEntity = createGroupEntity(engine);
    const childEntity = createGroupEntity(engine);

    rootEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    parentEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    childEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    rootEntity.getSceneGraph().addChild(parentEntity.getSceneGraph());
    parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());

    const parentSceneGraph = parentEntity.getSceneGraph();
    const childSceneGraph = childEntity.getSceneGraph();
    const parentLocalMatrixSpy = vi.spyOn(parentEntity.getTransform(), 'getLocalMatrixInnerTo');

    expect(
      childSceneGraph.matrixInner.isEqual(
        Matrix44.fromCopy16RowMajor(1, 0, 0, 3, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
        1e-6
      )
    ).toBe(true);
    expect(parentLocalMatrixSpy).toHaveBeenCalledTimes(1);

    parentEntity.getTransform().localPosition = Vector3.fromCopyArray([2, 0, 0]);
    const parentVersionBeforeDirty = parentSceneGraph.worldMatrixVersion;
    const childVersionBeforeDirty = childSceneGraph.worldMatrixVersion;
    parentSceneGraph.setWorldMatrixDirty();
    expect(parentSceneGraph.worldMatrixVersion).toBeGreaterThan(parentVersionBeforeDirty);
    expect(childSceneGraph.worldMatrixVersion).toBeGreaterThan(childVersionBeforeDirty);

    expect(
      childSceneGraph.matrixInner.isEqual(
        Matrix44.fromCopy16RowMajor(1, 0, 0, 4, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
        1e-6
      )
    ).toBe(true);
    expect(parentLocalMatrixSpy).toHaveBeenCalledTimes(2);
  });

  test('uses the local matrix directly when toMakeWorldMatrixTheSameAsLocalMatrix is set', () => {
    const rootEntity = createGroupEntity(engine);
    const parentEntity = createGroupEntity(engine);
    const childEntity = createGroupEntity(engine);

    rootEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    parentEntity.getTransform().localPosition = Vector3.fromCopyArray([1, 0, 0]);
    childEntity.getTransform().localPosition = Vector3.fromCopyArray([2, 0, 0]);
    rootEntity.getSceneGraph().addChild(parentEntity.getSceneGraph());
    parentEntity.getSceneGraph().addChild(childEntity.getSceneGraph());

    childEntity.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;

    expect(
      childEntity
        .getSceneGraph()
        .matrixInner.isEqual(Matrix44.fromCopy16RowMajor(1, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), 1e-6)
    ).toBe(true);
  });

  test('normal matrices are computed lazily by logicForce', () => {
    const entity = createGroupEntity(engine);
    entity.getTransform().localPosition = Vector3.fromCopyArray([1, 2, 3]);
    const sceneGraph = entity.getSceneGraph();

    sceneGraph.logicForce();
    expect((sceneGraph as any).__isWorldMatrixUpToDate).toBe(true);
    expect((sceneGraph as any).__isNormalMatrixUpToDate).toBe(false);

    const normalMatrix = sceneGraph.normalMatrixInner;
    expect((sceneGraph as any).__isNormalMatrixUpToDate).toBe(true);
    expect(normalMatrix).toBe(sceneGraph.normalMatrixInner);
  });

  test('logicForce refreshes the normal matrix of drawable meshes for the GPU instance data', () => {
    const meshEntity = createMeshEntity(engine);
    meshEntity.getTransform().localRotation = Quaternion.axisAngle(Vector3.fromCopy3(1, 0, 0), Math.PI / 2);
    const sceneGraph = meshEntity.getSceneGraph();

    expect((sceneGraph as any).__isNormalMatrixUpToDate).toBe(false);
    sceneGraph.logicForce();
    expect((sceneGraph as any).__isNormalMatrixUpToDate).toBe(true);
  });
});
