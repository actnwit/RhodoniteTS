import { describe, expect, test } from 'vitest';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Vector3 } from '../../math/Vector3';
import { Engine } from '../../system/Engine';
import { createGroupEntity } from './createGroupEntity';
import type { SceneGraphComponent } from './SceneGraphComponent';

describe('SceneGraph dirty propagation', async () => {
  const engine = await Engine.init({
    approach: ProcessApproach.None,
    canvas: null as unknown as HTMLCanvasElement,
    notToDisplayRnInfoAtInit: true,
  });

  const createChain = (length: number) => {
    const nodes: SceneGraphComponent[] = [];
    for (let i = 0; i < length; i++) {
      const sg = createGroupEntity(engine).getSceneGraph();
      if (i > 0) {
        nodes[i - 1].addChild(sg);
      }
      nodes.push(sg);
    }
    return nodes;
  };
  const isAABBDirty = (sg: SceneGraphComponent) => (sg as any).__isWorldAABBDirty as boolean;

  test('marks every ancestor AABB dirty, also when siblings share the ancestors', () => {
    const [root, a, b] = createChain(3);
    const c1 = createGroupEntity(engine).getSceneGraph();
    const c2 = createGroupEntity(engine).getSceneGraph();
    b.addChild(c1);
    b.addChild(c2);
    root.worldMergedAABB;
    expect(isAABBDirty(root)).toBe(false);

    c1.setWorldMatrixDirty();
    c2.setWorldMatrixDirty();
    expect(isAABBDirty(b)).toBe(true);
    expect(isAABBDirty(a)).toBe(true);
    expect(isAABBDirty(root)).toBe(true);
  });

  test('does not stop at a node whose ancestors were cleaned after it was marked', () => {
    const [root, a, b, c] = createChain(4);
    c.setWorldMatrixDirty();
    expect(isAABBDirty(a)).toBe(true);

    // Cleaning `a` leaves `b` dirty below a clean ancestor.
    a.worldMergedAABB;
    expect(isAABBDirty(a)).toBe(false);
    expect(isAABBDirty(b)).toBe(true);

    // A later change below `b` must still reach `a` (and root).
    c.setWorldMatrixDirty();
    expect(isAABBDirty(a)).toBe(true);
    expect(isAABBDirty(root)).toBe(true);
  });

  test('does not stop at a node whose ancestors changed by reparenting', () => {
    const [, a, b, c] = createChain(4);
    c.setWorldMatrixDirty();
    const newRoot = createGroupEntity(engine).getSceneGraph();
    newRoot.worldMergedAABB;
    newRoot.addChild(b);
    newRoot.worldMergedAABB;
    expect(isAABBDirty(newRoot)).toBe(false);

    c.setWorldMatrixDirty();
    expect(isAABBDirty(newRoot)).toBe(true);
    expect(a.children.includes(b)).toBe(false);
  });

  test('removeChild refreshes the world matrix of the detached subtree', () => {
    const parent = createGroupEntity(engine);
    const child = createGroupEntity(engine);
    parent.getTransform().localPosition = Vector3.fromCopy3(5, 0, 0);
    child.getTransform().localPosition = Vector3.fromCopy3(1, 0, 0);
    parent.getSceneGraph().addChild(child.getSceneGraph());
    expect(child.getSceneGraph().matrixInner.m03).toBeCloseTo(6);

    parent.getSceneGraph().removeChild(child.getSceneGraph());
    expect(child.getSceneGraph().matrixInner.m03).toBeCloseTo(1);
  });

  test('addChild and removeChild invalidate the merged AABB of the parent chain', () => {
    const [root, a] = createChain(2);
    const child = createGroupEntity(engine).getSceneGraph();
    root.worldMergedAABB;
    a.addChild(child);
    expect(isAABBDirty(a)).toBe(true);
    expect(isAABBDirty(root)).toBe(true);

    root.worldMergedAABB;
    a.worldMergedAABB;
    a.removeChild(child);
    expect(isAABBDirty(a)).toBe(true);
    expect(isAABBDirty(root)).toBe(true);
  });
});
