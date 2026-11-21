import { GpuCullingChunkSize, GpuCullingRegistry } from './GpuCullingRegistry';

const capacities = { instances: 16, groups: 4, draws: 8, chunks: 16 };

test('GpuCullingRegistry shares a group between the draws of a mesh and view in one bundle', () => {
  const registry = new GpuCullingRegistry(capacities);
  const meshA = {};
  const meshB = {};
  registry.beginRecording();
  const a0 = registry.getOrAllocateGroup(meshA, 0, 5)!;
  const a0Again = registry.getOrAllocateGroup(meshA, 0, 5)!;
  const a1 = registry.getOrAllocateGroup(meshA, 1, 5)!;
  const b0 = registry.getOrAllocateGroup(meshB, 0, 3)!;
  expect(a0Again).toBe(a0);
  expect(a1).not.toBe(a0);
  expect(new Set([a0.index, a1.index, b0.index]).size).toBe(3);
  // The instance ranges do not overlap.
  const ranges = [a0, a1, b0].map(g => [g.rangeBase, g.rangeBase + g.instanceCount]).sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < ranges.length; i++) {
    expect(ranges[i][0]).toBeGreaterThanOrEqual(ranges[i - 1][1]);
  }
  expect(registry.allocateDraw()).toBe(0);
  expect(registry.allocateDraw()).toBe(1);
  registry.finishRecording('pass-0');
  expect(registry.groupHighWater).toBe(3);
  expect(registry.drawHighWater).toBe(2);
});

test('GpuCullingRegistry does not share groups across bundles', () => {
  const registry = new GpuCullingRegistry(capacities);
  const mesh = {};
  registry.beginRecording();
  const first = registry.getOrAllocateGroup(mesh, 0, 2)!;
  registry.finishRecording('pass-0');
  registry.beginRecording();
  const second = registry.getOrAllocateGroup(mesh, 0, 2)!;
  registry.finishRecording('pass-1');
  expect(second.index).not.toBe(first.index);
});

test('GpuCullingRegistry allocates nothing outside of a recording', () => {
  const registry = new GpuCullingRegistry(capacities);
  expect(registry.getOrAllocateGroup({}, 0, 1)).toBeUndefined();
  expect(registry.allocateDraw()).toBe(-1);
  expect(registry.isOverflowed).toBe(false);
});

test('GpuCullingRegistry releases the allocations of a replaced bundle only in releaseRetired', () => {
  const registry = new GpuCullingRegistry(capacities);
  const mesh = {};
  registry.beginRecording();
  const old = registry.getOrAllocateGroup(mesh, 0, 16)!;
  registry.allocateDraw();
  registry.finishRecording('pass-0');

  // Re-recording the same bundle in the same frame: the old allocations are still in use (the old bundle may have
  // been executed), so the new recording cannot reuse them yet.
  registry.beginRecording();
  expect(registry.getOrAllocateGroup(mesh, 0, 16)).toBeUndefined();
  expect(registry.isOverflowed).toBe(true);
  registry.finishRecording('pass-0');

  const released = registry.releaseRetired()!;
  expect(released.groups).toEqual([old]);
  expect(released.draws).toEqual([0]);
  expect(registry.releaseRetired()).toBeUndefined();
  expect(registry.liveGroupCount).toBe(0);

  registry.beginRecording();
  const reused = registry.getOrAllocateGroup(mesh, 0, 16)!;
  expect(reused.rangeBase).toBe(0);
  expect(reused.index).toBe(old.index);
  expect(registry.allocateDraw()).toBe(0);
});

test('GpuCullingRegistry retires every cached bundle on retireAllBundles', () => {
  const registry = new GpuCullingRegistry(capacities);
  for (const key of ['a', 'b']) {
    registry.beginRecording();
    registry.getOrAllocateGroup({}, 0, 4);
    registry.allocateDraw();
    registry.finishRecording(key);
  }
  expect(registry.liveGroupCount).toBe(2);
  registry.retireAllBundles();
  const released = registry.releaseRetired()!;
  expect(released.groups.length).toBe(2);
  expect(released.draws.length).toBe(2);
  expect(registry.liveGroupCount).toBe(0);
});

test('GpuCullingRegistry retires the allocations of an uncached or aborted bundle', () => {
  const registry = new GpuCullingRegistry(capacities);
  registry.beginRecording();
  registry.getOrAllocateGroup({}, 0, 4);
  registry.finishRecording(undefined);
  registry.beginRecording();
  registry.getOrAllocateGroup({}, 0, 4);
  registry.abortRecording();
  expect(registry.isRecording).toBe(false);
  expect(registry.releaseRetired()!.groups.length).toBe(2);
});

test('GpuCullingRegistry reports the capacities needed after an overflow', () => {
  const registry = new GpuCullingRegistry(capacities);
  registry.beginRecording();
  for (let i = 0; i < 4; i++) {
    expect(registry.getOrAllocateGroup({}, 0, 2)).toBeDefined();
  }
  // The group table is full.
  expect(registry.getOrAllocateGroup({}, 0, 3)).toBeUndefined();
  for (let i = 0; i < 8; i++) {
    expect(registry.allocateDraw()).toBeGreaterThanOrEqual(0);
  }
  expect(registry.allocateDraw()).toBe(-1);
  registry.finishRecording('pass-0');

  expect(registry.isOverflowed).toBe(true);
  expect(registry.requiredCapacities).toEqual({ instances: 8 + 3, groups: 5, draws: 9, chunks: 4 + 1 });

  registry.reset({ instances: 32, groups: 8, draws: 16, chunks: 16 });
  expect(registry.isOverflowed).toBe(false);
  expect(registry.groupHighWater).toBe(0);
  expect(registry.capacities).toEqual({ instances: 32, groups: 8, draws: 16, chunks: 16 });
  registry.beginRecording();
  expect(registry.getOrAllocateGroup({}, 0, 32)!.rangeBase).toBe(0);
});

test('GpuCullingRegistry bumps its version on allocation and release', () => {
  const registry = new GpuCullingRegistry(capacities);
  const v0 = registry.version;
  registry.beginRecording();
  registry.getOrAllocateGroup({}, 0, 1);
  const v1 = registry.version;
  expect(v1).toBeGreaterThan(v0);
  registry.finishRecording(undefined);
  registry.releaseRetired();
  expect(registry.version).toBeGreaterThan(v1);
});

test('GpuCullingRegistry splits a group into chunks of GpuCullingChunkSize instances', () => {
  const registry = new GpuCullingRegistry({ instances: 4096, groups: 4, draws: 4, chunks: 32 });
  registry.beginRecording();
  const a = registry.getOrAllocateGroup({}, 0, 1)!;
  const b = registry.getOrAllocateGroup({}, 0, GpuCullingChunkSize * 2 + 1)!;
  expect(a.chunkCount).toBe(1);
  expect(b.chunkCount).toBe(3);
  expect(b.chunkBase).toBe(a.chunkBase + a.chunkCount);
  expect(registry.chunkHighWater).toBe(4);
  // The chunk table is full.
  expect(registry.getOrAllocateGroup({}, 0, GpuCullingChunkSize * 28 + 1)).toBeUndefined();
  expect(registry.isOverflowed).toBe(true);
  registry.finishRecording(undefined);
  registry.releaseRetired();
  registry.beginRecording();
  expect(registry.getOrAllocateGroup({}, 0, GpuCullingChunkSize * 32)!.chunkBase).toBe(0);
});
