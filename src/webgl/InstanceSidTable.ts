import type { WebGLContextWrapper } from './WebGLContextWrapper';

type FreeRange = { start: number; count: number };

/**
 * Engine-wide CPU tables for WebGL multi-draw instance identity.
 *
 * The tables are stored in the renderer's data texture (RGBA32F, texture unit 0) so
 * multi-draw does not consume additional texture units:
 * - SID region: one RGBA texel per stable slot `[componentSID, skeletalSID, blendShapeSID, 0]`
 * - remap region: four packed entries per RGBA texel
 *
 * IDs are written as float32, which represents integers exactly up to 2^24. Component
 * SIDs stay far below that limit in practice.
 */
export class InstanceSidTable {
  private __records: Uint32Array;
  private __remap: Uint32Array;
  private __capacity: number;
  private __usedEnd = 0;
  private __freeRanges: FreeRange[] = [];
  private __sidDirty = true;
  private __remapDirty = true;
  private __isSupported: boolean;

  constructor(glw: WebGLContextWrapper) {
    this.__isSupported = InstanceSidTable.isSupported(glw);
    this.__capacity = 16;
    this.__records = new Uint32Array(this.__capacity * 4);
    this.__remap = new Uint32Array(this.__capacity);
  }

  /**
   * Whether the instance tables are usable in this context. The tables live in the
   * data texture, so WebGL2 (the data texture mode) is the only requirement.
   */
  static isSupported(glw: WebGLContextWrapper): boolean {
    return glw.isWebGL2;
  }

  get isSupported(): boolean {
    return this.__isSupported;
  }

  /** The number of stable slots that have been handed out. */
  get usedEnd(): number {
    return this.__usedEnd;
  }

  get sidDirty(): boolean {
    return this.__sidDirty;
  }

  get remapDirty(): boolean {
    return this.__remapDirty;
  }

  /**
   * Allocates a contiguous range of stable instance slots.
   * Existing ranges are never moved.
   */
  allocate(count: number): number {
    if (count <= 0) {
      return 0;
    }
    // First fit in the free list.
    for (let i = 0; i < this.__freeRanges.length; i++) {
      const range = this.__freeRanges[i];
      if (range.count >= count) {
        const base = range.start;
        range.start += count;
        range.count -= count;
        if (range.count === 0) {
          this.__freeRanges.splice(i, 1);
        }
        this.__sidDirty = true;
        this.__remapDirty = true;
        return base;
      }
    }
    this.__ensureCapacity(this.__usedEnd + count);
    const base = this.__usedEnd;
    this.__usedEnd += count;
    this.__sidDirty = true;
    this.__remapDirty = true;
    return base;
  }

  /** Releases a range so that it can be reused by a later allocation. */
  free(base: number, count: number): void {
    if (count <= 0) {
      return;
    }
    this.__freeRanges.push({ start: base, count });
    // Keep the free list sorted so that adjacent ranges can be merged.
    this.__freeRanges.sort((a, b) => a.start - b.start);
    const merged: FreeRange[] = [];
    for (const range of this.__freeRanges) {
      const last = merged[merged.length - 1];
      if (last != null && last.start + last.count === range.start) {
        last.count += range.count;
      } else {
        merged.push({ start: range.start, count: range.count });
      }
    }
    this.__freeRanges = merged;
  }

  /** Writes one instance identity record. */
  setRecord(index: number, componentSID: number, skeletalSID: number, blendShapeSID: number): void {
    const offset = index * 4;
    if (
      this.__records[offset] !== componentSID ||
      this.__records[offset + 1] !== skeletalSID ||
      this.__records[offset + 2] !== blendShapeSID
    ) {
      this.__records[offset] = componentSID;
      this.__records[offset + 1] = skeletalSID;
      this.__records[offset + 2] = blendShapeSID;
      this.__records[offset + 3] = 0;
      this.__sidDirty = true;
    }
  }

  /** Resets the remap entries of a range to the identity mapping. */
  writeIdentityRemap(base: number, count: number): void {
    let changed = false;
    for (let i = 0; i < count; i++) {
      if (this.__remap[base + i] !== i) {
        this.__remap[base + i] = i;
        changed = true;
      }
    }
    if (changed) {
      this.__remapDirty = true;
    }
  }

  /** Gets the SID components of a stable slot (for tests and debugging). */
  getRecord(index: number): [number, number, number] {
    const offset = index * 4;
    return [this.__records[offset], this.__records[offset + 1], this.__records[offset + 2]];
  }

  /** Gets a remap entry (for tests and debugging). */
  getRemapValue(index: number): number {
    return this.__remap[index];
  }

  /** Sets a remap entry: packed index -> local stable index. */
  setRemap(packedIndex: number, localIndex: number): void {
    if (this.__remap[packedIndex] !== localIndex) {
      this.__remap[packedIndex] = localIndex;
      this.__remapDirty = true;
    }
  }

  /** Marks both tables as changed without touching individual entries. */
  markAllDirty(): void {
    this.__sidDirty = true;
    this.__remapDirty = true;
  }

  /** Clears the dirty flag of the SID region after it has been uploaded. */
  clearSidDirty(): void {
    this.__sidDirty = false;
  }

  /** Clears the dirty flag of the remap region after it has been uploaded. */
  clearRemapDirty(): void {
    this.__remapDirty = false;
  }

  /**
   * Writes `count` SID texels starting at `texelOffset` into a data-texture upload
   * buffer as RGBA float texels. The `0xFFFFFFFF` invalid sentinel is stored as -1
   * because float32 cannot represent 0xFFFFFFFF exactly; the shader converts the
   * components through ivec4 so the bit pattern round-trips.
   */
  writeSidTexels(dst: Float32Array, texelOffset: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const src = (texelOffset + i) * 4;
      const d = i * 4;
      dst[d] = this.__toSidFloat(this.__records[src]);
      dst[d + 1] = this.__toSidFloat(this.__records[src + 1]);
      dst[d + 2] = this.__toSidFloat(this.__records[src + 2]);
      dst[d + 3] = 0;
    }
  }

  private __toSidFloat(value: number): number {
    return value === 0xffff_ffff ? -1 : value;
  }

  /**
   * Writes `count` remap texels (four packed entries per texel) starting at
   * `texelOffset` into a data-texture upload buffer.
   */
  writeRemapTexels(dst: Float32Array, texelOffset: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const src = (texelOffset + i) * 4;
      const d = i * 4;
      dst[d] = this.__remap[src];
      dst[d + 1] = this.__remap[src + 1];
      dst[d + 2] = this.__remap[src + 2];
      dst[d + 3] = this.__remap[src + 3];
    }
  }

  private __ensureCapacity(required: number): void {
    if (required <= this.__capacity) {
      return;
    }
    let newCapacity = this.__capacity;
    while (newCapacity < required) {
      newCapacity *= 2;
    }
    const newRecords = new Uint32Array(newCapacity * 4);
    newRecords.set(this.__records);
    const newRemap = new Uint32Array(newCapacity);
    newRemap.set(this.__remap);
    this.__records = newRecords;
    this.__remap = newRemap;
    this.__capacity = newCapacity;
    this.__sidDirty = true;
    this.__remapDirty = true;
  }
}
