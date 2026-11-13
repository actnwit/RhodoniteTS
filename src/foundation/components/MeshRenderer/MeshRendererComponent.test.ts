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
