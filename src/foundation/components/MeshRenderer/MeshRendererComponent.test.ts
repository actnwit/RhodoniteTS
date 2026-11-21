import { describe, expect, test } from 'vitest';
import { MeshRendererComponent } from './MeshRendererComponent';

type Scratch = {
  primitives: unknown[];
  stamp: Uint32Array;
  stampTick: number;
};

const helpers = MeshRendererComponent as any;

function createScratch(stampLength = 4): Scratch {
  return { primitives: [], stamp: new Uint32Array(stampLength), stampTick: 0 };
}

function createPrimitive(primitiveUid: number) {
  return { primitiveUid };
}

function collectUids(primitives: unknown[]) {
  return (primitives as { primitiveUid: number }[]).map(primitive => primitive.primitiveUid);
}

describe('MeshRendererComponent.__removeDuplicatedPrimitives', () => {
  test('removes duplicates while keeping the first occurrence order', () => {
    const scratch = createScratch();
    const primitives = [3, 1, 3, 2, 1, 5].map(createPrimitive);

    helpers.__removeDuplicatedPrimitives(primitives, scratch);

    expect(collectUids(primitives)).toEqual([3, 1, 2, 5]);
    expect(primitives.length).toBe(4);
  });

  test('keeps the working buffers reusable across calls', () => {
    const scratch = createScratch();

    const first = [1, 1, 2].map(createPrimitive);
    helpers.__removeDuplicatedPrimitives(first, scratch);
    expect(collectUids(first)).toEqual([1, 2]);

    const second = [4, 2, 4, 1].map(createPrimitive);
    helpers.__removeDuplicatedPrimitives(second, scratch);
    expect(collectUids(second)).toEqual([4, 2, 1]);

    const third = [1, 2, 3].map(createPrimitive);
    helpers.__removeDuplicatedPrimitives(third, scratch);
    expect(collectUids(third)).toEqual([1, 2, 3]);
  });

  test('grows the stamp array when a primitive UID is out of range', () => {
    const scratch = createScratch(2);
    const primitives = [10, 2, 10, 0].map(createPrimitive);

    helpers.__removeDuplicatedPrimitives(primitives, scratch);

    expect(collectUids(primitives)).toEqual([10, 2, 0]);
    expect(scratch.stamp.length).toBeGreaterThanOrEqual(11);
  });

  test('keeps primitives without a valid UID', () => {
    const scratch = createScratch();
    const primitives = [createPrimitive(-1), createPrimitive(2), createPrimitive(-1)];

    helpers.__removeDuplicatedPrimitives(primitives, scratch);

    expect(collectUids(primitives)).toEqual([-1, 2, -1]);
  });

  test('does nothing for empty and single element lists', () => {
    const scratch = createScratch();

    const empty: unknown[] = [];
    helpers.__removeDuplicatedPrimitives(empty, scratch);
    expect(empty.length).toBe(0);

    const single = [createPrimitive(7)];
    helpers.__removeDuplicatedPrimitives(single, scratch);
    expect(collectUids(single)).toEqual([7]);
  });
});

describe('MeshRendererComponent.__createPrimitiveUids', () => {
  test('maps primitive UIDs and appends the -1 sentinel', () => {
    const primitiveUids = helpers.__createPrimitiveUids([7, 3, 5].map(createPrimitive));

    expect(primitiveUids).toEqual([7, 3, 5, -1]);
  });

  test('appends only the sentinel for an empty list', () => {
    expect(helpers.__createPrimitiveUids([])).toEqual([-1]);
  });
});

describe('MeshRendererComponent.__comparePrimitives', () => {
  test('sorts by sortkey and falls back to view depth', () => {
    const primitives = [
      { primitiveUid: 0, _sortkey: 2, _viewDepth: 5 },
      { primitiveUid: 1, _sortkey: 1, _viewDepth: 9 },
      { primitiveUid: 2, _sortkey: 2, _viewDepth: 1 },
      { primitiveUid: 3, _sortkey: 2, _viewDepth: 8 },
    ];

    primitives.sort(helpers.__comparePrimitives);

    expect(collectUids(primitives)).toEqual([1, 2, 0, 3]);
  });
});

describe('MeshRendererComponent.__cullSiblingInstances', () => {
  function createSibling(entityUID: number) {
    return { entityUID, getSceneGraph: () => ({ isVisible: true }), getTagValue: () => undefined, getMesh: () => ({}) };
  }

  function createCullingScratch() {
    return {
      culledEntityStamp: new Uint32Array(8),
      handledEntityStamp: new Uint32Array(8),
      meshCullTick: new WeakMap(),
      culledEntityCount: 0,
    };
  }

  function setUp(isGpuCullable: boolean) {
    const siblings = [createSibling(1), createSibling(2), createSibling(3)];
    const mesh = { meshEntitiesInner: siblings, _isGpuCullable: isGpuCullable };
    const meshComponent = { _isAlive: true, mesh };
    let cullingCalls = 0;
    // A frustum that culls everything it is asked about.
    const frustum = {
      culling: () => {
        cullingCalls++;
        return false;
      },
    };
    const scratch = createCullingScratch();
    // The registered entity (1) was handled by the main culling loop.
    scratch.handledEntityStamp[1] = 1;
    return { meshComponent, frustum, scratch, getCullingCalls: () => cullingCalls };
  }

  test('culls the siblings that are not registered in the render pass on the CPU', () => {
    const { meshComponent, frustum, scratch, getCullingCalls } = setUp(true);

    helpers.__cullSiblingInstances([meshComponent], frustum, scratch, 1, false);

    expect(getCullingCalls()).toBe(2);
    expect(scratch.culledEntityStamp[2]).toBe(1);
    expect(scratch.culledEntityStamp[3]).toBe(1);
    expect(scratch.culledEntityCount).toBe(2);
  });

  test('skips the meshes culled on the GPU', () => {
    const { meshComponent, frustum, scratch, getCullingCalls } = setUp(true);

    helpers.__cullSiblingInstances([meshComponent], frustum, scratch, 1, true);

    expect(getCullingCalls()).toBe(0);
    expect(scratch.culledEntityCount).toBe(0);
  });

  test('keeps culling the siblings of meshes that are not GPU cullable', () => {
    const { meshComponent, frustum, scratch, getCullingCalls } = setUp(false);

    helpers.__cullSiblingInstances([meshComponent], frustum, scratch, 1, true);

    expect(getCullingCalls()).toBe(2);
    expect(scratch.culledEntityCount).toBe(2);
  });
});
