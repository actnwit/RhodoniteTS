import { RangeAllocator } from './RangeAllocator';

/** The number of vertices deformed by one workgroup of the deformation compute shader. */
export const GpuDeformChunkSize = 64;

/** The capacities of the deformation tables. */
export interface GpuDeformCapacities {
  /** The number of source vertex slots (the undeformed vertices of the meshes, shared by their instances). */
  sourceVertices: number;
  /** The number of deformed vertex slots (the vertices of every instance). */
  deformedVertices: number;
  /** The number of bounding box slots (one per instance). */
  bounds: number;
  /** The number of chunk slots (one per GpuDeformChunkSize vertices of a primitive of an instance). */
  chunks: number;
}

/**
 * The deformation of the instances of a mesh, shared by the cull groups of the mesh (one per view and render bundle).
 *
 * The deformed vertices of instance `i` start at `deformedBase + i * vertexCount`, followed by the vertices of the
 * primitives of the mesh in order (see `primitiveOffsets`).
 */
export interface GpuDeformEntry {
  /** The object identifying the deformation (the instance variation data of the mesh). */
  readonly key: object;
  /** The vertex counts of the primitives of the mesh. */
  readonly primitiveVertexCounts: readonly number[];
  /** The index of the first vertex of each primitive among the vertices of the mesh. */
  readonly primitiveOffsets: readonly number[];
  /** The number of chunks of each primitive (`ceil(vertexCount / GpuDeformChunkSize)`). */
  readonly primitiveChunkCounts: readonly number[];
  /** The number of vertices of the mesh (the sum of the primitive vertex counts). */
  readonly vertexCount: number;
  /** The number of chunks of one instance (the sum of the primitive chunk counts). */
  readonly chunkCountPerInstance: number;
  readonly instanceCount: number;
  readonly sourceBase: number;
  readonly deformedBase: number;
  readonly boundsBase: number;
  readonly chunkBase: number;
  readonly chunkCount: number;
  /** The number of the cull groups that use the deformation. */
  refCount: number;
}

/**
 * The bookkeeping of the vertex deformation tables of the WebGPU GPU culling (WebGpuVertexDeformer), without GPU
 * resources.
 *
 * An entry is acquired by each cull group of a deformed mesh and released with the group, after the commands that
 * used it were submitted (GpuCullingRegistry). The ranges of an entry are allocated when it is first acquired and
 * freed when its last group is released. When a table is full, the allocation fails and records the demand, so that
 * the owner grows the tables (`requiredCapacities`) and starts over with `reset`.
 */
export class GpuDeformRegistry {
  private __capacities: GpuDeformCapacities;
  private __sourceAllocator: RangeAllocator;
  private __deformedAllocator: RangeAllocator;
  private __boundsAllocator: RangeAllocator;
  private __chunkAllocator: RangeAllocator;
  private __entries = new Map<object, GpuDeformEntry>();
  private __boundsHighWater = 0;
  private __chunkHighWater = 0;
  private __overflowed = false;
  private __failedDemand: GpuDeformCapacities = { sourceVertices: 0, deformedVertices: 0, bounds: 0, chunks: 0 };
  private __version = 0;

  /**
   * @param capacities - The capacities of the tables
   */
  constructor(capacities: GpuDeformCapacities) {
    this.__capacities = { ...capacities };
    this.__sourceAllocator = new RangeAllocator(capacities.sourceVertices);
    this.__deformedAllocator = new RangeAllocator(capacities.deformedVertices);
    this.__boundsAllocator = new RangeAllocator(capacities.bounds);
    this.__chunkAllocator = new RangeAllocator(capacities.chunks);
  }

  /** The capacities of the tables. */
  get capacities(): Readonly<GpuDeformCapacities> {
    return this.__capacities;
  }

  /** The live entries. */
  get entries(): IterableIterator<GpuDeformEntry> {
    return this.__entries.values();
  }

  /** The number of the live entries. */
  get entryCount(): number {
    return this.__entries.size;
  }

  /** One past the highest bounds slot allocated since the last reset (the range to clear before deforming). */
  get boundsHighWater(): number {
    return this.__boundsHighWater;
  }

  /** One past the highest chunk slot allocated since the last reset (the dispatch size). */
  get chunkHighWater(): number {
    return this.__chunkHighWater;
  }

  /** Incremented whenever an entry is allocated or freed. */
  get version(): number {
    return this.__version;
  }

  /** Whether an allocation failed because a table was full since the last reset. */
  get isOverflowed(): boolean {
    return this.__overflowed;
  }

  /** The capacities needed by the live entries plus the allocations that failed since the last reset. */
  get requiredCapacities(): GpuDeformCapacities {
    const used: GpuDeformCapacities = { ...this.__failedDemand };
    for (const entry of this.__entries.values()) {
      used.sourceVertices += entry.vertexCount;
      used.deformedVertices += entry.vertexCount * entry.instanceCount;
      used.bounds += entry.instanceCount;
      used.chunks += entry.chunkCount;
    }
    return used;
  }

  /**
   * Gets the entry of `key` and adds a reference to it, allocating it on first use.
   *
   * @param key - The object identifying the deformation; a new key (new instance variation data) is a new entry
   * @param primitiveVertexCounts - The vertex counts of the primitives of the mesh
   * @param instanceCount - The number of instances
   * @returns The entry and whether it was just allocated, or undefined when a table is full
   */
  acquire(
    key: object,
    primitiveVertexCounts: readonly number[],
    instanceCount: number
  ): { entry: GpuDeformEntry; isNew: boolean } | undefined {
    const existing = this.__entries.get(key);
    if (existing !== undefined) {
      existing.refCount++;
      return { entry: existing, isNew: false };
    }
    if (instanceCount <= 0 || primitiveVertexCounts.length === 0) {
      return undefined;
    }
    const primitiveOffsets: number[] = [];
    const primitiveChunkCounts: number[] = [];
    let vertexCount = 0;
    let chunkCountPerInstance = 0;
    for (const count of primitiveVertexCounts) {
      primitiveOffsets.push(vertexCount);
      const chunks = Math.ceil(count / GpuDeformChunkSize);
      primitiveChunkCounts.push(chunks);
      vertexCount += count;
      chunkCountPerInstance += chunks;
    }
    if (vertexCount === 0) {
      return undefined;
    }
    const deformedCount = vertexCount * instanceCount;
    const chunkCount = chunkCountPerInstance * instanceCount;

    const sourceBase = this.__sourceAllocator.allocate(vertexCount, 1);
    const deformedBase = this.__deformedAllocator.allocate(deformedCount, 1);
    const boundsBase = this.__boundsAllocator.allocate(instanceCount, 1);
    const chunkBase = this.__chunkAllocator.allocate(chunkCount, 1);
    if (sourceBase < 0 || deformedBase < 0 || boundsBase < 0 || chunkBase < 0) {
      if (sourceBase >= 0) {
        this.__sourceAllocator.release(sourceBase, vertexCount);
      }
      if (deformedBase >= 0) {
        this.__deformedAllocator.release(deformedBase, deformedCount);
      }
      if (boundsBase >= 0) {
        this.__boundsAllocator.release(boundsBase, instanceCount);
      }
      if (chunkBase >= 0) {
        this.__chunkAllocator.release(chunkBase, chunkCount);
      }
      this.__overflowed = true;
      const failed = this.__failedDemand;
      failed.sourceVertices += vertexCount;
      failed.deformedVertices += deformedCount;
      failed.bounds += instanceCount;
      failed.chunks += chunkCount;
      return undefined;
    }
    const entry: GpuDeformEntry = {
      key,
      primitiveVertexCounts: primitiveVertexCounts.slice(),
      primitiveOffsets,
      primitiveChunkCounts,
      vertexCount,
      chunkCountPerInstance,
      instanceCount,
      sourceBase,
      deformedBase,
      boundsBase,
      chunkBase,
      chunkCount,
      refCount: 1,
    };
    this.__entries.set(key, entry);
    this.__boundsHighWater = Math.max(this.__boundsHighWater, boundsBase + instanceCount);
    this.__chunkHighWater = Math.max(this.__chunkHighWater, chunkBase + chunkCount);
    this.__version++;
    return { entry, isNew: true };
  }

  /**
   * Removes a reference to an entry, freeing its ranges when it was the last one.
   *
   * @returns True when the entry was freed (the caller clears its table slots)
   */
  release(entry: GpuDeformEntry): boolean {
    if (this.__entries.get(entry.key) !== entry) {
      return false;
    }
    entry.refCount--;
    if (entry.refCount > 0) {
      return false;
    }
    this.__entries.delete(entry.key);
    this.__sourceAllocator.release(entry.sourceBase, entry.vertexCount);
    this.__deformedAllocator.release(entry.deformedBase, entry.vertexCount * entry.instanceCount);
    this.__boundsAllocator.release(entry.boundsBase, entry.instanceCount);
    this.__chunkAllocator.release(entry.chunkBase, entry.chunkCount);
    this.__version++;
    return true;
  }

  /**
   * Drops every entry and replaces the tables (e.g. with larger capacities).
   */
  reset(capacities: GpuDeformCapacities) {
    this.__capacities = { ...capacities };
    this.__sourceAllocator = new RangeAllocator(capacities.sourceVertices);
    this.__deformedAllocator = new RangeAllocator(capacities.deformedVertices);
    this.__boundsAllocator = new RangeAllocator(capacities.bounds);
    this.__chunkAllocator = new RangeAllocator(capacities.chunks);
    this.__entries.clear();
    this.__boundsHighWater = 0;
    this.__chunkHighWater = 0;
    this.__overflowed = false;
    this.__failedDemand = { sourceVertices: 0, deformedVertices: 0, bounds: 0, chunks: 0 };
    this.__version++;
  }
}

/**
 * Encodes a float as a u32 whose unsigned order is the order of the floats, so that the bounding boxes can be
 * computed with atomicMax (must match encodeOrderedFloat in WebGpuVertexDeformer and decodeOrderedFloat in the
 * culling shader). The encoding of a non-NaN float is never 0, which marks an empty bound.
 */
export function encodeOrderedFloat(bits: number): number {
  return (bits & 0x80000000) !== 0 ? ~bits >>> 0 : (bits | 0x80000000) >>> 0;
}

/** Decodes a float encoded by `encodeOrderedFloat` (returns its bits). */
export function decodeOrderedFloat(encoded: number): number {
  return (encoded & 0x80000000) !== 0 ? (encoded & 0x7fffffff) >>> 0 : ~encoded >>> 0;
}
