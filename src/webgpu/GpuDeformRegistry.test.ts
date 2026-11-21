import { decodeOrderedFloat, encodeOrderedFloat, GpuDeformChunkSize, GpuDeformRegistry } from './GpuDeformRegistry';

const capacities = { sourceVertices: 1000, deformedVertices: 4000, bounds: 16, chunks: 64 };

test('GpuDeformRegistry lays out the primitives and instances of an entry', () => {
  const registry = new GpuDeformRegistry(capacities);
  const key = {};
  const result = registry.acquire(key, [100, 30], 3)!;
  expect(result.isNew).toBe(true);
  const entry = result.entry;
  expect(entry.vertexCount).toBe(130);
  expect(entry.primitiveOffsets).toEqual([0, 100]);
  expect(entry.primitiveChunkCounts).toEqual([Math.ceil(100 / GpuDeformChunkSize), 1]);
  expect(entry.chunkCountPerInstance).toBe(3);
  expect(entry.chunkCount).toBe(9);
  expect(entry.instanceCount).toBe(3);
  expect(registry.boundsHighWater).toBe(entry.boundsBase + 3);
  expect(registry.chunkHighWater).toBe(entry.chunkBase + 9);
});

test('GpuDeformRegistry shares an entry between its references and frees it with the last one', () => {
  const registry = new GpuDeformRegistry(capacities);
  const key = {};
  const first = registry.acquire(key, [10], 2)!;
  const second = registry.acquire(key, [10], 2)!;
  expect(second.isNew).toBe(false);
  expect(second.entry).toBe(first.entry);
  expect(first.entry.refCount).toBe(2);
  const version = registry.version;

  expect(registry.release(first.entry)).toBe(false);
  expect(registry.entryCount).toBe(1);
  expect(registry.release(first.entry)).toBe(true);
  expect(registry.entryCount).toBe(0);
  expect(registry.version).toBeGreaterThan(version);
  // A released entry is not released twice.
  expect(registry.release(first.entry)).toBe(false);

  // The freed ranges are reused.
  const again = registry.acquire({}, [10], 2)!;
  expect(again.entry.sourceBase).toBe(first.entry.sourceBase);
  expect(again.entry.deformedBase).toBe(first.entry.deformedBase);
});

test('GpuDeformRegistry keeps the ranges of the entries apart', () => {
  const registry = new GpuDeformRegistry(capacities);
  const a = registry.acquire({}, [64, 64], 2)!.entry;
  const b = registry.acquire({}, [10], 3)!.entry;
  const overlaps = (x0: number, x1: number, y0: number, y1: number) => x0 < y1 && y0 < x1;
  expect(overlaps(a.sourceBase, a.sourceBase + a.vertexCount, b.sourceBase, b.sourceBase + b.vertexCount)).toBe(false);
  expect(
    overlaps(
      a.deformedBase,
      a.deformedBase + a.vertexCount * a.instanceCount,
      b.deformedBase,
      b.deformedBase + b.vertexCount * b.instanceCount
    )
  ).toBe(false);
  expect(overlaps(a.boundsBase, a.boundsBase + 2, b.boundsBase, b.boundsBase + 3)).toBe(false);
  expect(overlaps(a.chunkBase, a.chunkBase + a.chunkCount, b.chunkBase, b.chunkBase + b.chunkCount)).toBe(false);
});

test('GpuDeformRegistry records the demand of a failed allocation and starts over on reset', () => {
  const registry = new GpuDeformRegistry(capacities);
  registry.acquire({}, [500], 4);
  expect(registry.isOverflowed).toBe(false);
  // 4000 deformed vertex slots: 500 x 4 + 500 x 5 does not fit.
  expect(registry.acquire({}, [500], 5)).toBeUndefined();
  expect(registry.isOverflowed).toBe(true);
  const required = registry.requiredCapacities;
  expect(required.sourceVertices).toBe(1000);
  expect(required.deformedVertices).toBe(4500);
  expect(required.bounds).toBe(9);
  expect(required.chunks).toBe(9 * Math.ceil(500 / GpuDeformChunkSize));

  const grown = { sourceVertices: 2000, deformedVertices: 8000, bounds: 16, chunks: 128 };
  registry.reset(grown);
  expect(registry.isOverflowed).toBe(false);
  expect(registry.entryCount).toBe(0);
  expect(registry.capacities).toEqual(grown);
  expect(registry.acquire({}, [500], 4)).toBeDefined();
  expect(registry.acquire({}, [500], 5)).toBeDefined();
});

test('GpuDeformRegistry rejects an entry without vertices or instances', () => {
  const registry = new GpuDeformRegistry(capacities);
  expect(registry.acquire({}, [], 1)).toBeUndefined();
  expect(registry.acquire({}, [0], 1)).toBeUndefined();
  expect(registry.acquire({}, [10], 0)).toBeUndefined();
  expect(registry.isOverflowed).toBe(false);
});

test('The ordered float encoding keeps the order of the floats and round-trips', () => {
  const f32 = new Float32Array(1);
  const u32 = new Uint32Array(f32.buffer);
  const bitsOf = (value: number) => {
    f32[0] = value;
    return u32[0];
  };
  const floatOf = (bits: number) => {
    u32[0] = bits;
    return f32[0];
  };
  const values = [-1e30, -123.5, -1, -1e-20, -0, 0, 1e-20, 0.5, 1, 77.25, 1e30];
  const encoded = values.map(v => encodeOrderedFloat(bitsOf(v)));
  for (let i = 0; i < values.length; i++) {
    expect(encoded[i]).not.toBe(0);
    expect(floatOf(decodeOrderedFloat(encoded[i]))).toBe(Math.fround(values[i]));
    if (i > 0) {
      // -0 and 0 are adjacent; every other pair is strictly ordered.
      expect(encoded[i]).toBeGreaterThanOrEqual(encoded[i - 1]);
    }
  }
  // The minimum is the maximum of the inverted encodings (the deformation's atomicMax of ~encoded).
  const maxOfInverted = Math.max(...encoded.map(e => ~e >>> 0));
  expect(floatOf(decodeOrderedFloat(~maxOfInverted >>> 0))).toBe(Math.fround(-1e30));
});
