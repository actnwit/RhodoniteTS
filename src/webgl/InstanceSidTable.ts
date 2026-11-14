import { INSTANCE_REMAP_TEXTURE_UNIT, INSTANCE_SID_TEXTURE_UNIT } from '../foundation/definitions/TextureUnit';
import type { WebGLContextWrapper } from './WebGLContextWrapper';

export { INSTANCE_REMAP_TEXTURE_UNIT, INSTANCE_SID_TEXTURE_UNIT };
/** Width of the 2D instance tables. The height grows with the number of instance slots. */
export const INSTANCE_TEXTURE_WIDTH = 2048;

type FreeRange = { start: number; count: number };

/**
 * Engine-wide table that maps a stable instance slot to its instance identity
 * (`componentSID`, `skeletalSID`, `blendShapeSID`) and, per render pass, to the
 * visible instance that a packed instance index refers to.
 *
 * The data is stored in two integer textures:
 * - SID table: RGBA32UI, one texel per stable slot.
 * - remap table: R32UI, `remap[base + packedIndex] = localStableIndex`.
 *
 * Shaders index these textures with `instanceBase + gl_InstanceID`, so a single
 * VAO can be shared by primitives of different Meshes.
 */
export class InstanceSidTable {
  private __glw: WebGLContextWrapper;
  private __records: Uint32Array;
  private __remap: Uint32Array;
  private __capacity: number;
  private __usedEnd = 0;
  private __freeRanges: FreeRange[] = [];
  private __sidTexture: WebGLTexture | null = null;
  private __remapTexture: WebGLTexture | null = null;
  private __textureSlotCapacity = 0;
  private __sidDirty = true;
  private __remapDirty = true;
  private __sidRecordsDirty = true;
  private __remapRecordsDirty = true;
  private __isSupported: boolean;

  constructor(glw: WebGLContextWrapper) {
    this.__glw = glw;
    this.__isSupported = InstanceSidTable.isSupported(glw);
    this.__capacity = 16;
    this.__records = new Uint32Array(this.__capacity * 4);
    this.__remap = new Uint32Array(this.__capacity);
  }

  /**
   * Returns whether integer textures required by the instance tables are usable.
   * Integer textures are core in WebGL2, but the check is kept defensive.
   */
  static isSupported(glw: WebGLContextWrapper): boolean {
    if (!glw.isWebGL2) {
      return false;
    }
    const gl = glw.getRawContextAsWebGL2();
    return gl.RGBA32UI != null && gl.R32UI != null && gl.RGBA_INTEGER != null && gl.RED_INTEGER != null;
  }

  get isSupported(): boolean {
    return this.__isSupported;
  }

  get width(): number {
    return INSTANCE_TEXTURE_WIDTH;
  }

  get sidTexture(): WebGLTexture | null {
    return this.__sidTexture;
  }

  get remapTexture(): WebGLTexture | null {
    return this.__remapTexture;
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
        return base;
      }
    }
    this.__ensureCapacity(this.__usedEnd + count);
    const base = this.__usedEnd;
    this.__usedEnd += count;
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
      this.__sidRecordsDirty = true;
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
      this.__remapRecordsDirty = true;
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
      this.__remapRecordsDirty = true;
      this.__remapDirty = true;
    }
  }

  /** Marks the remap table as changed without touching individual entries. */
  markRemapDirty(): void {
    this.__remapRecordsDirty = true;
    this.__remapDirty = true;
  }

  /** Uploads the tables if any of them changed since the last upload. */
  updateTexturesIfDirty(): void {
    if (!this.__isSupported) {
      return;
    }
    if (this.__sidDirty || this.__remapDirty) {
      this.__ensureCapacity(this.__usedEnd);
      if (this.__sidDirty) {
        this.__uploadSidTexture();
      }
      if (this.__remapDirty) {
        this.__uploadRemapTexture();
      }
    }
  }

  /** Destroys the GPU textures. */
  destroy(): void {
    const gl = this.__glw.getRawContextAsWebGL2();
    if (this.__sidTexture != null) {
      gl.deleteTexture(this.__sidTexture);
      this.__sidTexture = null;
    }
    if (this.__remapTexture != null) {
      gl.deleteTexture(this.__remapTexture);
      this.__remapTexture = null;
    }
    this.__textureSlotCapacity = 0;
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

  private __ensureTextures(requiredSlots: number): void {
    const gl = this.__glw.getRawContextAsWebGL2();
    const height = Math.max(1, Math.ceil(Math.max(requiredSlots, 1) / INSTANCE_TEXTURE_WIDTH));
    const slotCapacity = INSTANCE_TEXTURE_WIDTH * height;
    if (this.__sidTexture != null && this.__remapTexture != null && slotCapacity <= this.__textureSlotCapacity) {
      return;
    }
    this.destroy();
    this.__textureSlotCapacity = slotCapacity;

    const sidTexture = gl.createTexture();
    if (sidTexture == null) {
      this.__isSupported = false;
      return;
    }
    this.__glw.bindTexture2DForce(INSTANCE_SID_TEXTURE_UNIT, sidTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32UI, INSTANCE_TEXTURE_WIDTH, height);
    this.__sidTexture = sidTexture;

    const remapTexture = gl.createTexture();
    if (remapTexture == null) {
      this.__isSupported = false;
      return;
    }
    this.__glw.bindTexture2DForce(INSTANCE_REMAP_TEXTURE_UNIT, remapTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32UI, INSTANCE_TEXTURE_WIDTH, height);
    this.__remapTexture = remapTexture;

    this.__sidDirty = true;
    this.__remapDirty = true;
    // New textures must be populated even if the CPU data did not change.
    this.__sidRecordsDirty = true;
    this.__remapRecordsDirty = true;
  }

  private __uploadSidTexture(): void {
    if (!this.__sidRecordsDirty) {
      return;
    }
    this.__ensureTextures(this.__usedEnd);
    if (!this.__isSupported || this.__sidTexture == null) {
      return;
    }
    const gl = this.__glw.getRawContextAsWebGL2();
    const height = Math.max(1, Math.ceil(Math.max(this.__usedEnd, 1) / INSTANCE_TEXTURE_WIDTH));
    const data = new Uint32Array(INSTANCE_TEXTURE_WIDTH * height * 4);
    data.set(this.__records.subarray(0, Math.min(this.__records.length, data.length)));
    this.__glw.bindTexture2DForce(INSTANCE_SID_TEXTURE_UNIT, this.__sidTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, INSTANCE_TEXTURE_WIDTH, height, gl.RGBA_INTEGER, gl.UNSIGNED_INT, data);
    this.__sidDirty = false;
    this.__sidRecordsDirty = false;
  }

  private __uploadRemapTexture(): void {
    if (!this.__remapRecordsDirty) {
      return;
    }
    this.__ensureTextures(this.__usedEnd);
    if (!this.__isSupported || this.__remapTexture == null) {
      return;
    }
    const gl = this.__glw.getRawContextAsWebGL2();
    const height = Math.max(1, Math.ceil(Math.max(this.__usedEnd, 1) / INSTANCE_TEXTURE_WIDTH));
    const data = new Uint32Array(INSTANCE_TEXTURE_WIDTH * height);
    data.set(this.__remap.subarray(0, Math.min(this.__remap.length, data.length)));
    this.__glw.bindTexture2DForce(INSTANCE_REMAP_TEXTURE_UNIT, this.__remapTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, INSTANCE_TEXTURE_WIDTH, height, gl.RED_INTEGER, gl.UNSIGNED_INT, data);
    this.__remapDirty = false;
    this.__remapRecordsDirty = false;
  }
}
