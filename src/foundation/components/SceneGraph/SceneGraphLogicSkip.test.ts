import { describe, expect, test } from 'vitest';
import { Component } from '../../core/Component';
import { ComponentRepository } from '../../core/ComponentRepository';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { ProcessStage, type ProcessStageEnum } from '../../definitions/ProcessStage';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import { Engine } from '../../system/Engine';
import { createMeshEntity } from '../MeshRenderer/createMeshEntity';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { createGroupEntity } from './createGroupEntity';
import type { SceneGraphComponent } from './SceneGraphComponent';

describe('SceneGraph Logic stage', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });

  /**
   * Runs one stage of the Transform and SceneGraph components the same way Engine.process does.
   * Rendering components are left out since this engine has no rendering backend.
   */
  const runStage = (stage: ProcessStageEnum) => {
    for (const tid of [WellKnownComponentTIDs.TransformComponentTID, WellKnownComponentTIDs.SceneGraphComponentTID]) {
      const componentClass = ComponentRepository.getComponentClass(tid)! as any;
      componentClass[`common_${stage.methodName}`]?.({ engine, processStage: stage });
      Component.process(engine, componentClass, stage);
    }
  };
  const runFrame = () => {
    runStage(ProcessStage.Load);
    runStage(ProcessStage.Logic);
  };

  /** World matrix computed independently from the local matrices of the ancestors. */
  const expectedWorldMatrix = (entity: ISceneGraphEntity) => {
    const result = MutableMatrix44.identity();
    let sg: SceneGraphComponent | undefined = entity.getSceneGraph();
    while (sg != null) {
      result.multiplyByLeft(sg.entity.getTransform().localMatrix);
      sg = sg.parent;
    }
    return result;
  };
  const expectWorldMatricesCorrect = (entities: ISceneGraphEntity[]) => {
    for (const entity of entities) {
      const sg = entity.getSceneGraph();
      // Read the cached matrix without triggering a recomputation.
      expect((sg as any).__isWorldMatrixUpToDate).toBe(true);
      expect((sg as any)._worldMatrix.isEqual(expectedWorldMatrix(entity), 1e-5)).toBe(true);
    }
  };

  /** A small tree created children-first, so that SIDs do not follow the hierarchy. */
  const createTree = () => {
    const leafA = createGroupEntity(engine);
    const leafB = createGroupEntity(engine);
    const mid = createGroupEntity(engine);
    const root = createGroupEntity(engine);
    root.getSceneGraph().addChild(mid.getSceneGraph());
    mid.getSceneGraph().addChild(leafA.getSceneGraph());
    mid.getSceneGraph().addChild(leafB.getSceneGraph());
    const entities = [root, mid, leafA, leafB];
    entities.forEach((e, i) => {
      e.getTransform().localPosition = Vector3.fromCopy3(i + 1, 0, 0);
    });
    runFrame();
    return { root, mid, leafA, leafB, entities };
  };

  test('updates the world matrices of changed subtrees in the Logic stage', () => {
    const { root, leafA, entities } = createTree();
    expectWorldMatricesCorrect(entities);

    root.getTransform().localRotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 1, 0), 0.5);
    leafA.getTransform().localScale = Vector3.fromCopy3(2, 2, 2);
    runFrame();
    expectWorldMatricesCorrect(entities);
  });

  test('advances the world matrix version of every descendant of a changed node', () => {
    const { mid, leafA, leafB, root } = createTree();
    const versions = [root, mid, leafA, leafB].map(e => e.getSceneGraph().worldMatrixVersion);

    mid.getTransform().localPosition = Vector3.fromCopy3(0, 3, 0);
    runFrame();
    expect(root.getSceneGraph().worldMatrixVersion).toBe(versions[0]);
    expect(mid.getSceneGraph().worldMatrixVersion).toBeGreaterThan(versions[1]);
    expect(leafA.getSceneGraph().worldMatrixVersion).toBeGreaterThan(versions[2]);
    expect(leafB.getSceneGraph().worldMatrixVersion).toBeGreaterThan(versions[3]);
  });

  test('marks the merged AABB of the ancestors of a changed node dirty', () => {
    const { root, mid, leafA } = createTree();
    root.getSceneGraph().worldMergedAABB;
    mid.getSceneGraph().worldMergedAABB;

    leafA.getTransform().localPosition = Vector3.fromCopy3(0, 0, 9);
    runFrame();
    expect((mid.getSceneGraph() as any).__isWorldAABBDirty).toBe(true);
    expect((root.getSceneGraph() as any).__isWorldAABBDirty).toBe(true);
  });

  test('follows hierarchy changes made between frames', () => {
    const { root, leafA, leafB, entities } = createTree();
    leafB.getSceneGraph().addChild(leafA.getSceneGraph());
    root.getTransform().localPosition = Vector3.fromCopy3(0, -1, 0);
    runFrame();
    expectWorldMatricesCorrect(entities);

    const newNode = createGroupEntity(engine);
    newNode.getTransform().localPosition = Vector3.fromCopy3(0, 0, 4);
    leafA.getSceneGraph().addChild(newNode.getSceneGraph());
    runFrame();
    root.getTransform().localPosition = Vector3.fromCopy3(0, 1, 0);
    runFrame();
    expectWorldMatricesCorrect([...entities, newNode]);
  });

  test('skips settled nodes but still refreshes a node whose mesh was attached later', () => {
    const static1 = createMeshEntity(engine);
    static1.getTransform().localRotation = Quaternion.fromAxisAngle(Vector3.fromCopy3(1, 0, 0), Math.PI / 2);
    runFrame();
    const sg = static1.getSceneGraph();
    expect((sg as any).__isNormalMatrixUpToDate).toBe(true);
    const normalMatrix = sg.normalMatrixInner;

    // Another transform changes, so the SceneGraph Logic stage runs, but this node is settled.
    const { root } = createTree();
    root.getTransform().localPosition = Vector3.fromCopy3(5, 5, 5);
    runFrame();
    expect(sg.normalMatrixInner).toBe(normalMatrix);

    // A group node that becomes drawable must get its normal matrix computed.
    const group = createGroupEntity(engine);
    runFrame();
    expect((group.getSceneGraph() as any).__isNormalMatrixUpToDate).toBe(false);
    engine.entityRepository.addComponentToEntity(
      ComponentRepository.getComponentClass(static1.getMesh().componentTID)! as any,
      group
    );
    root.getTransform().localPosition = Vector3.fromCopy3(6, 5, 5);
    runFrame();
    expect((group.getSceneGraph() as any).__isNormalMatrixUpToDate).toBe(true);
  });

  test('invalidates the subtree when TransformComponent.$logic is called directly', () => {
    const { mid, leafA } = createTree();
    mid.getTransform().localPosition = Vector3.fromCopy3(7, 0, 0);
    // Calling $logic directly (as ShapeGizmo does) must invalidate the subtree immediately.
    mid.getTransform().$logic();
    expect(
      leafA
        .getSceneGraph()
        .matrixInner.isEqual(Matrix44.multiply(expectedWorldMatrix(mid), leafA.getTransform().localMatrix), 1e-5)
    ).toBe(true);
  });
});
