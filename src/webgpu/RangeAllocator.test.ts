import { RangeAllocator } from './RangeAllocator';

test('RangeAllocator allocates aligned, non-overlapping ranges', () => {
  const allocator = new RangeAllocator(256);
  const a = allocator.allocate(20, 16);
  const b = allocator.allocate(32, 16);
  expect(a).toBe(0);
  expect(b).toBe(32);
  expect(b % 16).toBe(0);
  expect(allocator.usedSize).toBe(52);
  // The padding between a and b stays free.
  expect(allocator.getFreeRanges()).toEqual([
    [20, 12],
    [64, 192],
  ]);
});

test('RangeAllocator returns -1 when no free range fits', () => {
  const allocator = new RangeAllocator(64);
  expect(allocator.allocate(48, 16)).toBe(0);
  expect(allocator.allocate(32, 16)).toBe(-1);
  expect(allocator.allocate(16, 16)).toBe(48);
  expect(allocator.allocate(4, 4)).toBe(-1);
});

test('RangeAllocator merges released ranges with their neighbors', () => {
  const allocator = new RangeAllocator(64);
  const a = allocator.allocate(16, 16);
  const b = allocator.allocate(16, 16);
  const c = allocator.allocate(16, 16);
  allocator.release(a, 16);
  allocator.release(c, 16);
  expect(allocator.getFreeRanges()).toEqual([
    [0, 16],
    [32, 32],
  ]);
  allocator.release(b, 16);
  expect(allocator.getFreeRanges()).toEqual([[0, 64]]);
  expect(allocator.isEmpty).toBe(true);
  // The whole region is usable again.
  expect(allocator.allocate(64, 16)).toBe(0);
});

test('RangeAllocator keeps its bookkeeping consistent under random use', () => {
  let seed = 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const capacity = 1 << 16;
  const allocator = new RangeAllocator(capacity);
  const live: [number, number][] = [];
  for (let step = 0; step < 1500; step++) {
    if (live.length > 0 && random() < 0.45) {
      const [offset, size] = live.splice(Math.floor(random() * live.length), 1)[0];
      allocator.release(offset, size);
    } else {
      const size = 4 * (1 + Math.floor(random() * 64));
      const offset = allocator.allocate(size, 4);
      if (offset >= 0) {
        live.push([offset, size]);
      }
    }
    // No two live ranges overlap, and free + used covers the whole region exactly.
    const ranges = [...live, ...allocator.getFreeRanges()].sort((x, y) => x[0] - y[0]);
    let cursor = 0;
    for (const [offset, size] of ranges) {
      expect(offset).toBe(cursor);
      cursor = offset + size;
    }
    expect(cursor).toBe(capacity);
  }
  for (const [offset, size] of live) {
    allocator.release(offset, size);
  }
  expect(allocator.getFreeRanges()).toEqual([[0, capacity]]);
});
