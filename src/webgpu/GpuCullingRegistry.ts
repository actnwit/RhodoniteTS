import { RangeAllocator } from './RangeAllocator';

/**
 * A cull group: the instances of one mesh drawn with one view (camera) in one render bundle.
 *
 * The group owns the instance slots `[rangeBase, rangeBase + instanceCount)`. The culling compute shader tests the
 * instances stored in those slots and writes the visible ones, compacted and in their original order, to the same
 * slots of the visible instance buffer. Every draw of the mesh in the bundle (each primitive, and the depth prepass)
 * binds that range as its instance vertex buffer and takes its instance count from the group.
 */
export interface GpuCullingGroup {
  /** The slot of the group in the group table. */
  readonly index: number;
  /** The first instance slot of the group. */
  readonly rangeBase: number;
  /** The number of instance slots of the group. */
  readonly instanceCount: number;
  /** The view (camera frustum) the instances are culled with. */
  readonly viewIndex: number;
  /**
   * The first chunk slot of the group. The instances are culled in chunks of `GpuCullingChunkSize` consecutive
   * instances, one workgroup per chunk, so that a group with many instances is culled in parallel.
   */
  readonly chunkBase: number;
  /** The number of chunk slots of the group (`ceil(instanceCount / GpuCullingChunkSize)`). */
  readonly chunkCount: number;
}

/** The number of instances culled by one workgroup. */
export const GpuCullingChunkSize = 64;

/** The allocations of one recorded render bundle. */
interface BundleAllocations {
  groups: GpuCullingGroup[];
  draws: number[];
}

/** The allocations released by `releaseRetired`, so that the caller can clear their GPU table entries. */
export interface GpuCullingReleased {
  groups: GpuCullingGroup[];
  draws: number[];
}

/** The capacities of the registry tables. */
export interface GpuCullingCapacities {
  /** The number of instance slots. */
  instances: number;
  /** The number of cull groups. */
  groups: number;
  /** The number of indirect draw slots. */
  draws: number;
  /** The number of chunk slots (see `GpuCullingGroup.chunkBase`). */
  chunks: number;
}

/**
 * The CPU bookkeeping of the WebGPU GPU culling: instance slot ranges, cull groups and indirect draw slots.
 *
 * The allocations are owned by the render bundles that record the indirect draws referencing them:
 * - `beginRecording` / `finishRecording` collect the allocations made while a bundle is being recorded.
 * - A bundle that is dropped (bundle cache clear) or replaced (re-recorded) retires its allocations. A retired bundle
 *   may still have been executed in the current frame, so its allocations are released only by `releaseRetired`,
 *   which the caller invokes after the frame's commands were submitted.
 * - When a table is full, the allocation fails (the caller draws without culling) and the registry records the
 *   capacity it would have needed. The caller then grows its buffers, calls `reset`, and re-records the bundles.
 *
 * It does not touch any GPU resource, so it can be unit tested.
 */
export class GpuCullingRegistry {
  private __capacities: GpuCullingCapacities;
  private __instanceAllocator: RangeAllocator;
  private __chunkAllocator: RangeAllocator;
  private __chunkHighWater = 0;
  private __usedChunkSlots = 0;
  private __freeGroups: number[] = [];
  private __groupHighWater = 0;
  private __freeDraws: number[] = [];
  private __drawHighWater = 0;
  private __bundles = new Map<string, BundleAllocations>();
  private __recording?: BundleAllocations;
  /** The groups of the bundle being recorded, by key object (the mesh) and view. */
  private __recordingGroups = new Map<object, Map<number, GpuCullingGroup>>();
  private __retired: BundleAllocations[] = [];
  private __overflowed = false;
  /** The demand of the failed allocations since the last reset. */
  private __failedDemand: GpuCullingCapacities = { instances: 0, groups: 0, draws: 0, chunks: 0 };
  private __usedInstanceSlots = 0;
  private __version = 0;

  /**
   * @param capacities - The initial capacities of the tables
   */
  constructor(capacities: GpuCullingCapacities) {
    this.__capacities = { ...capacities };
    this.__instanceAllocator = new RangeAllocator(capacities.instances);
    this.__chunkAllocator = new RangeAllocator(capacities.chunks);
  }

  /** The capacities of the tables. */
  get capacities(): Readonly<GpuCullingCapacities> {
    return this.__capacities;
  }

  /** One past the highest group slot that was ever allocated since the last reset (the dispatch size). */
  get groupHighWater(): number {
    return this.__groupHighWater;
  }

  /** One past the highest chunk slot that was ever allocated since the last reset (the dispatch size). */
  get chunkHighWater(): number {
    return this.__chunkHighWater;
  }

  /** One past the highest draw slot that was ever allocated since the last reset (the dispatch size). */
  get drawHighWater(): number {
    return this.__drawHighWater;
  }

  /** The number of the live (not released) groups. */
  get liveGroupCount(): number {
    return this.__groupHighWater - this.__freeGroups.length;
  }

  /** Incremented whenever an allocation is made or released, so that the GPU tables are known to be stale. */
  get version(): number {
    return this.__version;
  }

  /** Whether an allocation failed because a table was full since the last reset. */
  get isOverflowed(): boolean {
    return this.__overflowed;
  }

  /** Whether a bundle is being recorded. */
  get isRecording(): boolean {
    return this.__recording !== undefined;
  }

  /**
   * The capacities needed by the allocations that are not released yet plus the failed allocations.
   * Call it after `releaseRetired` to size the tables for a re-recording of the live bundles.
   */
  get requiredCapacities(): GpuCullingCapacities {
    const failed = this.__failedDemand;
    return {
      instances: this.__usedInstanceSlots + failed.instances,
      groups: this.liveGroupCount + failed.groups,
      draws: this.__drawHighWater - this.__freeDraws.length + failed.draws,
      chunks: this.__usedChunkSlots + failed.chunks,
    };
  }

  /**
   * Starts collecting the allocations of a render bundle being recorded.
   * A recording that was not finished is retired first.
   */
  beginRecording() {
    if (this.__recording !== undefined) {
      this.__retired.push(this.__recording);
    }
    this.__recording = { groups: [], draws: [] };
    this.__recordingGroups.clear();
  }

  /**
   * Gets the group of `key` (the mesh) and `viewIndex` in the bundle being recorded, or allocates it.
   * @param key - The object identifying the instances (the mesh)
   * @param viewIndex - The view the instances are culled with
   * @param instanceCount - The number of instances of the mesh
   * @returns The group, or undefined when no bundle is being recorded or a table is full
   */
  getOrAllocateGroup(key: object, viewIndex: number, instanceCount: number): GpuCullingGroup | undefined {
    const recording = this.__recording;
    if (recording === undefined || instanceCount <= 0) {
      return undefined;
    }
    let groupsOfKey = this.__recordingGroups.get(key);
    const existing = groupsOfKey?.get(viewIndex);
    if (existing !== undefined && existing.instanceCount === instanceCount) {
      return existing;
    }

    const chunkCount = Math.ceil(instanceCount / GpuCullingChunkSize);
    const rangeBase = this.__instanceAllocator.allocate(instanceCount, 1);
    const chunkBase = this.__chunkAllocator.allocate(chunkCount, 1);
    const hasGroupSlot = this.__freeGroups.length > 0 || this.__groupHighWater < this.__capacities.groups;
    if (rangeBase < 0 || chunkBase < 0 || !hasGroupSlot) {
      if (rangeBase >= 0) {
        this.__instanceAllocator.release(rangeBase, instanceCount);
      }
      if (chunkBase >= 0) {
        this.__chunkAllocator.release(chunkBase, chunkCount);
      }
      this.__recordOverflow(instanceCount, 1, 0, chunkCount);
      return undefined;
    }
    const index = this.__freeGroups.length > 0 ? this.__freeGroups.pop()! : this.__groupHighWater++;
    const group: GpuCullingGroup = { index, rangeBase, instanceCount, viewIndex, chunkBase, chunkCount };
    this.__usedInstanceSlots += instanceCount;
    this.__usedChunkSlots += chunkCount;
    this.__chunkHighWater = Math.max(this.__chunkHighWater, chunkBase + chunkCount);
    recording.groups.push(group);
    if (groupsOfKey === undefined) {
      groupsOfKey = new Map();
      this.__recordingGroups.set(key, groupsOfKey);
    }
    groupsOfKey.set(viewIndex, group);
    this.__version++;
    return group;
  }

  /**
   * Allocates an indirect draw slot in the bundle being recorded.
   * @returns The draw slot, or -1 when no bundle is being recorded or the draw table is full
   */
  allocateDraw(): number {
    const recording = this.__recording;
    if (recording === undefined) {
      return -1;
    }
    if (this.__freeDraws.length === 0 && this.__drawHighWater >= this.__capacities.draws) {
      this.__recordOverflow(0, 0, 1, 0);
      return -1;
    }
    const slot = this.__freeDraws.length > 0 ? this.__freeDraws.pop()! : this.__drawHighWater++;
    recording.draws.push(slot);
    this.__version++;
    return slot;
  }

  /**
   * Finishes the recording of a bundle.
   * @param bundleKey - The key the bundle is cached with. The allocations of the bundle previously cached with the
   *   same key are retired. When undefined (the bundle is not cached), the allocations are retired at once: the bundle
   *   is executed in the current frame only.
   */
  finishRecording(bundleKey: string | undefined) {
    const recording = this.__recording;
    if (recording === undefined) {
      return;
    }
    this.__recording = undefined;
    this.__recordingGroups.clear();
    if (bundleKey === undefined) {
      this.__retired.push(recording);
      return;
    }
    this.retireBundle(bundleKey);
    if (recording.groups.length > 0 || recording.draws.length > 0) {
      this.__bundles.set(bundleKey, recording);
    }
  }

  /**
   * Retires the recording in progress (the bundle encoder was dropped without being finished).
   */
  abortRecording() {
    if (this.__recording !== undefined) {
      this.__retired.push(this.__recording);
      this.__recording = undefined;
      this.__recordingGroups.clear();
    }
  }

  /**
   * Retires the allocations of a cached bundle (the bundle was dropped).
   * @param bundleKey - The key of the bundle
   */
  retireBundle(bundleKey: string) {
    const allocations = this.__bundles.get(bundleKey);
    if (allocations !== undefined) {
      this.__bundles.delete(bundleKey);
      this.__retired.push(allocations);
    }
  }

  /**
   * Retires the allocations of all the cached bundles (the bundle cache was cleared).
   */
  retireAllBundles() {
    for (const allocations of this.__bundles.values()) {
      this.__retired.push(allocations);
    }
    this.__bundles.clear();
  }

  /**
   * Releases the retired allocations. Call it after the commands of the frame were submitted: the retired bundles
   * may have been executed in that frame.
   * @returns The released groups and draws (to clear their GPU table entries), or undefined when nothing was released
   */
  releaseRetired(): GpuCullingReleased | undefined {
    const retired = this.__retired;
    if (retired.length === 0) {
      return undefined;
    }
    const released: GpuCullingReleased = { groups: [], draws: [] };
    for (const allocations of retired) {
      for (const group of allocations.groups) {
        this.__instanceAllocator.release(group.rangeBase, group.instanceCount);
        this.__usedInstanceSlots -= group.instanceCount;
        this.__chunkAllocator.release(group.chunkBase, group.chunkCount);
        this.__usedChunkSlots -= group.chunkCount;
        this.__freeGroups.push(group.index);
        released.groups.push(group);
      }
      for (const draw of allocations.draws) {
        this.__freeDraws.push(draw);
        released.draws.push(draw);
      }
    }
    retired.length = 0;
    this.__version++;
    return released;
  }

  /**
   * Drops every allocation and resizes the tables. The caller must drop every bundle recorded with the previous
   * allocations (their slots are reused).
   * @param capacities - The new capacities
   */
  reset(capacities: GpuCullingCapacities) {
    this.__capacities = { ...capacities };
    this.__instanceAllocator = new RangeAllocator(capacities.instances);
    this.__chunkAllocator = new RangeAllocator(capacities.chunks);
    this.__chunkHighWater = 0;
    this.__usedChunkSlots = 0;
    this.__freeGroups.length = 0;
    this.__groupHighWater = 0;
    this.__freeDraws.length = 0;
    this.__drawHighWater = 0;
    this.__bundles.clear();
    this.__recording = undefined;
    this.__recordingGroups.clear();
    this.__retired.length = 0;
    this.__overflowed = false;
    this.__failedDemand = { instances: 0, groups: 0, draws: 0, chunks: 0 };
    this.__usedInstanceSlots = 0;
    this.__version++;
  }

  private __recordOverflow(instances: number, groups: number, draws: number, chunks: number) {
    this.__overflowed = true;
    const failed = this.__failedDemand;
    failed.instances += instances;
    failed.groups += groups;
    failed.draws += draws;
    failed.chunks += chunks;
  }
}
