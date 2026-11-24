// src/webgl/InstanceSidTable.ts
var InstanceSidTable = class _InstanceSidTable {
  constructor(glw) {
    this.__usedEnd = 0;
    this.__freeRanges = [];
    this.__sidDirty = true;
    this.__remapDirty = true;
    this.__isSupported = _InstanceSidTable.isSupported(glw);
    this.__capacity = 16;
    this.__records = new Uint32Array(this.__capacity * 4);
    this.__remap = new Uint32Array(this.__capacity);
  }
  /**
   * Whether the instance tables are usable in this context. The tables live in the
   * data texture, so WebGL2 (the data texture mode) is the only requirement.
   */
  static isSupported(glw) {
    return glw.isWebGL2;
  }
  get isSupported() {
    return this.__isSupported;
  }
  /** The number of stable slots that have been handed out. */
  get usedEnd() {
    return this.__usedEnd;
  }
  get sidDirty() {
    return this.__sidDirty;
  }
  get remapDirty() {
    return this.__remapDirty;
  }
  /**
   * Allocates a contiguous range of stable instance slots.
   * Existing ranges are never moved.
   */
  allocate(count) {
    if (count <= 0) {
      return 0;
    }
    for (let i = 0; i < this.__freeRanges.length; i++) {
      const range = this.__freeRanges[i];
      if (range.count >= count) {
        const base2 = range.start;
        range.start += count;
        range.count -= count;
        if (range.count === 0) {
          this.__freeRanges.splice(i, 1);
        }
        this.__sidDirty = true;
        this.__remapDirty = true;
        return base2;
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
  free(base, count) {
    if (count <= 0) {
      return;
    }
    this.__freeRanges.push({ start: base, count });
    this.__freeRanges.sort((a, b) => a.start - b.start);
    const merged = [];
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
  setRecord(index, componentSID, skeletalSID, blendShapeSID) {
    const offset = index * 4;
    if (this.__records[offset] !== componentSID || this.__records[offset + 1] !== skeletalSID || this.__records[offset + 2] !== blendShapeSID) {
      this.__records[offset] = componentSID;
      this.__records[offset + 1] = skeletalSID;
      this.__records[offset + 2] = blendShapeSID;
      this.__records[offset + 3] = 0;
      this.__sidDirty = true;
    }
  }
  /** Resets the remap entries of a range to the identity mapping. */
  writeIdentityRemap(base, count) {
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
  getRecord(index) {
    const offset = index * 4;
    return [this.__records[offset], this.__records[offset + 1], this.__records[offset + 2]];
  }
  /** Gets a remap entry (for tests and debugging). */
  getRemapValue(index) {
    return this.__remap[index];
  }
  /** Sets a remap entry: packed index -> local stable index. */
  setRemap(packedIndex, localIndex) {
    if (this.__remap[packedIndex] !== localIndex) {
      this.__remap[packedIndex] = localIndex;
      this.__remapDirty = true;
    }
  }
  /** Marks both tables as changed without touching individual entries. */
  markAllDirty() {
    this.__sidDirty = true;
    this.__remapDirty = true;
  }
  /** Clears the dirty flag of the SID region after it has been uploaded. */
  clearSidDirty() {
    this.__sidDirty = false;
  }
  /** Clears the dirty flag of the remap region after it has been uploaded. */
  clearRemapDirty() {
    this.__remapDirty = false;
  }
  /**
   * Writes `count` SID texels starting at `texelOffset` into a data-texture upload
   * buffer as RGBA float texels. The `0xFFFFFFFF` invalid sentinel is stored as -1
   * because float32 cannot represent 0xFFFFFFFF exactly; the shader converts the
   * components through ivec4 so the bit pattern round-trips.
   */
  writeSidTexels(dst, texelOffset, count) {
    for (let i = 0; i < count; i++) {
      const src = (texelOffset + i) * 4;
      const d = i * 4;
      dst[d] = this.__toSidFloat(this.__records[src]);
      dst[d + 1] = this.__toSidFloat(this.__records[src + 1]);
      dst[d + 2] = this.__toSidFloat(this.__records[src + 2]);
      dst[d + 3] = 0;
    }
  }
  __toSidFloat(value) {
    return value === 4294967295 ? -1 : value;
  }
  /**
   * Writes `count` remap texels (four packed entries per texel) starting at
   * `texelOffset` into a data-texture upload buffer.
   */
  writeRemapTexels(dst, texelOffset, count) {
    for (let i = 0; i < count; i++) {
      const src = (texelOffset + i) * 4;
      const d = i * 4;
      dst[d] = this.__remap[src];
      dst[d + 1] = this.__remap[src + 1];
      dst[d + 2] = this.__remap[src + 2];
      dst[d + 3] = this.__remap[src + 3];
    }
  }
  __ensureCapacity(required) {
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
};
export {
  InstanceSidTable
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdsL0luc3RhbmNlU2lkVGFibGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgV2ViR0xDb250ZXh0V3JhcHBlciB9IGZyb20gJy4vV2ViR0xDb250ZXh0V3JhcHBlcic7XG5cbnR5cGUgRnJlZVJhbmdlID0geyBzdGFydDogbnVtYmVyOyBjb3VudDogbnVtYmVyIH07XG5cbi8qKlxuICogRW5naW5lLXdpZGUgQ1BVIHRhYmxlcyBmb3IgV2ViR0wgbXVsdGktZHJhdyBpbnN0YW5jZSBpZGVudGl0eS5cbiAqXG4gKiBUaGUgdGFibGVzIGFyZSBzdG9yZWQgaW4gdGhlIHJlbmRlcmVyJ3MgZGF0YSB0ZXh0dXJlIChSR0JBMzJGLCB0ZXh0dXJlIHVuaXQgMCkgc29cbiAqIG11bHRpLWRyYXcgZG9lcyBub3QgY29uc3VtZSBhZGRpdGlvbmFsIHRleHR1cmUgdW5pdHM6XG4gKiAtIFNJRCByZWdpb246IG9uZSBSR0JBIHRleGVsIHBlciBzdGFibGUgc2xvdCBgW2NvbXBvbmVudFNJRCwgc2tlbGV0YWxTSUQsIGJsZW5kU2hhcGVTSUQsIDBdYFxuICogLSByZW1hcCByZWdpb246IGZvdXIgcGFja2VkIGVudHJpZXMgcGVyIFJHQkEgdGV4ZWxcbiAqXG4gKiBJRHMgYXJlIHdyaXR0ZW4gYXMgZmxvYXQzMiwgd2hpY2ggcmVwcmVzZW50cyBpbnRlZ2VycyBleGFjdGx5IHVwIHRvIDJeMjQuIENvbXBvbmVudFxuICogU0lEcyBzdGF5IGZhciBiZWxvdyB0aGF0IGxpbWl0IGluIHByYWN0aWNlLlxuICovXG5leHBvcnQgY2xhc3MgSW5zdGFuY2VTaWRUYWJsZSB7XG4gIHByaXZhdGUgX19yZWNvcmRzOiBVaW50MzJBcnJheTtcbiAgcHJpdmF0ZSBfX3JlbWFwOiBVaW50MzJBcnJheTtcbiAgcHJpdmF0ZSBfX2NhcGFjaXR5OiBudW1iZXI7XG4gIHByaXZhdGUgX191c2VkRW5kID0gMDtcbiAgcHJpdmF0ZSBfX2ZyZWVSYW5nZXM6IEZyZWVSYW5nZVtdID0gW107XG4gIHByaXZhdGUgX19zaWREaXJ0eSA9IHRydWU7XG4gIHByaXZhdGUgX19yZW1hcERpcnR5ID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfX2lzU3VwcG9ydGVkOiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKGdsdzogV2ViR0xDb250ZXh0V3JhcHBlcikge1xuICAgIHRoaXMuX19pc1N1cHBvcnRlZCA9IEluc3RhbmNlU2lkVGFibGUuaXNTdXBwb3J0ZWQoZ2x3KTtcbiAgICB0aGlzLl9fY2FwYWNpdHkgPSAxNjtcbiAgICB0aGlzLl9fcmVjb3JkcyA9IG5ldyBVaW50MzJBcnJheSh0aGlzLl9fY2FwYWNpdHkgKiA0KTtcbiAgICB0aGlzLl9fcmVtYXAgPSBuZXcgVWludDMyQXJyYXkodGhpcy5fX2NhcGFjaXR5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBpbnN0YW5jZSB0YWJsZXMgYXJlIHVzYWJsZSBpbiB0aGlzIGNvbnRleHQuIFRoZSB0YWJsZXMgbGl2ZSBpbiB0aGVcbiAgICogZGF0YSB0ZXh0dXJlLCBzbyBXZWJHTDIgKHRoZSBkYXRhIHRleHR1cmUgbW9kZSkgaXMgdGhlIG9ubHkgcmVxdWlyZW1lbnQuXG4gICAqL1xuICBzdGF0aWMgaXNTdXBwb3J0ZWQoZ2x3OiBXZWJHTENvbnRleHRXcmFwcGVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGdsdy5pc1dlYkdMMjtcbiAgfVxuXG4gIGdldCBpc1N1cHBvcnRlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2lzU3VwcG9ydGVkO1xuICB9XG5cbiAgLyoqIFRoZSBudW1iZXIgb2Ygc3RhYmxlIHNsb3RzIHRoYXQgaGF2ZSBiZWVuIGhhbmRlZCBvdXQuICovXG4gIGdldCB1c2VkRW5kKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX191c2VkRW5kO1xuICB9XG5cbiAgZ2V0IHNpZERpcnR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fc2lkRGlydHk7XG4gIH1cblxuICBnZXQgcmVtYXBEaXJ0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX3JlbWFwRGlydHk7XG4gIH1cblxuICAvKipcbiAgICogQWxsb2NhdGVzIGEgY29udGlndW91cyByYW5nZSBvZiBzdGFibGUgaW5zdGFuY2Ugc2xvdHMuXG4gICAqIEV4aXN0aW5nIHJhbmdlcyBhcmUgbmV2ZXIgbW92ZWQuXG4gICAqL1xuICBhbGxvY2F0ZShjb3VudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBpZiAoY291bnQgPD0gMCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIC8vIEZpcnN0IGZpdCBpbiB0aGUgZnJlZSBsaXN0LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX2ZyZWVSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5fX2ZyZWVSYW5nZXNbaV07XG4gICAgICBpZiAocmFuZ2UuY291bnQgPj0gY291bnQpIHtcbiAgICAgICAgY29uc3QgYmFzZSA9IHJhbmdlLnN0YXJ0O1xuICAgICAgICByYW5nZS5zdGFydCArPSBjb3VudDtcbiAgICAgICAgcmFuZ2UuY291bnQgLT0gY291bnQ7XG4gICAgICAgIGlmIChyYW5nZS5jb3VudCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX19mcmVlUmFuZ2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9fc2lkRGlydHkgPSB0cnVlO1xuICAgICAgICB0aGlzLl9fcmVtYXBEaXJ0eSA9IHRydWU7XG4gICAgICAgIHJldHVybiBiYXNlO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fZW5zdXJlQ2FwYWNpdHkodGhpcy5fX3VzZWRFbmQgKyBjb3VudCk7XG4gICAgY29uc3QgYmFzZSA9IHRoaXMuX191c2VkRW5kO1xuICAgIHRoaXMuX191c2VkRW5kICs9IGNvdW50O1xuICAgIHRoaXMuX19zaWREaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX3JlbWFwRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiBiYXNlO1xuICB9XG5cbiAgLyoqIFJlbGVhc2VzIGEgcmFuZ2Ugc28gdGhhdCBpdCBjYW4gYmUgcmV1c2VkIGJ5IGEgbGF0ZXIgYWxsb2NhdGlvbi4gKi9cbiAgZnJlZShiYXNlOiBudW1iZXIsIGNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoY291bnQgPD0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fZnJlZVJhbmdlcy5wdXNoKHsgc3RhcnQ6IGJhc2UsIGNvdW50IH0pO1xuICAgIC8vIEtlZXAgdGhlIGZyZWUgbGlzdCBzb3J0ZWQgc28gdGhhdCBhZGphY2VudCByYW5nZXMgY2FuIGJlIG1lcmdlZC5cbiAgICB0aGlzLl9fZnJlZVJhbmdlcy5zb3J0KChhLCBiKSA9PiBhLnN0YXJ0IC0gYi5zdGFydCk7XG4gICAgY29uc3QgbWVyZ2VkOiBGcmVlUmFuZ2VbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgcmFuZ2Ugb2YgdGhpcy5fX2ZyZWVSYW5nZXMpIHtcbiAgICAgIGNvbnN0IGxhc3QgPSBtZXJnZWRbbWVyZ2VkLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGxhc3QgIT0gbnVsbCAmJiBsYXN0LnN0YXJ0ICsgbGFzdC5jb3VudCA9PT0gcmFuZ2Uuc3RhcnQpIHtcbiAgICAgICAgbGFzdC5jb3VudCArPSByYW5nZS5jb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lcmdlZC5wdXNoKHsgc3RhcnQ6IHJhbmdlLnN0YXJ0LCBjb3VudDogcmFuZ2UuY291bnQgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19mcmVlUmFuZ2VzID0gbWVyZ2VkO1xuICB9XG5cbiAgLyoqIFdyaXRlcyBvbmUgaW5zdGFuY2UgaWRlbnRpdHkgcmVjb3JkLiAqL1xuICBzZXRSZWNvcmQoaW5kZXg6IG51bWJlciwgY29tcG9uZW50U0lEOiBudW1iZXIsIHNrZWxldGFsU0lEOiBudW1iZXIsIGJsZW5kU2hhcGVTSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IG9mZnNldCA9IGluZGV4ICogNDtcbiAgICBpZiAoXG4gICAgICB0aGlzLl9fcmVjb3Jkc1tvZmZzZXRdICE9PSBjb21wb25lbnRTSUQgfHxcbiAgICAgIHRoaXMuX19yZWNvcmRzW29mZnNldCArIDFdICE9PSBza2VsZXRhbFNJRCB8fFxuICAgICAgdGhpcy5fX3JlY29yZHNbb2Zmc2V0ICsgMl0gIT09IGJsZW5kU2hhcGVTSURcbiAgICApIHtcbiAgICAgIHRoaXMuX19yZWNvcmRzW29mZnNldF0gPSBjb21wb25lbnRTSUQ7XG4gICAgICB0aGlzLl9fcmVjb3Jkc1tvZmZzZXQgKyAxXSA9IHNrZWxldGFsU0lEO1xuICAgICAgdGhpcy5fX3JlY29yZHNbb2Zmc2V0ICsgMl0gPSBibGVuZFNoYXBlU0lEO1xuICAgICAgdGhpcy5fX3JlY29yZHNbb2Zmc2V0ICsgM10gPSAwO1xuICAgICAgdGhpcy5fX3NpZERpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVzZXRzIHRoZSByZW1hcCBlbnRyaWVzIG9mIGEgcmFuZ2UgdG8gdGhlIGlkZW50aXR5IG1hcHBpbmcuICovXG4gIHdyaXRlSWRlbnRpdHlSZW1hcChiYXNlOiBudW1iZXIsIGNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgaWYgKHRoaXMuX19yZW1hcFtiYXNlICsgaV0gIT09IGkpIHtcbiAgICAgICAgdGhpcy5fX3JlbWFwW2Jhc2UgKyBpXSA9IGk7XG4gICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgdGhpcy5fX3JlbWFwRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXRzIHRoZSBTSUQgY29tcG9uZW50cyBvZiBhIHN0YWJsZSBzbG90IChmb3IgdGVzdHMgYW5kIGRlYnVnZ2luZykuICovXG4gIGdldFJlY29yZChpbmRleDogbnVtYmVyKTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdIHtcbiAgICBjb25zdCBvZmZzZXQgPSBpbmRleCAqIDQ7XG4gICAgcmV0dXJuIFt0aGlzLl9fcmVjb3Jkc1tvZmZzZXRdLCB0aGlzLl9fcmVjb3Jkc1tvZmZzZXQgKyAxXSwgdGhpcy5fX3JlY29yZHNbb2Zmc2V0ICsgMl1dO1xuICB9XG5cbiAgLyoqIEdldHMgYSByZW1hcCBlbnRyeSAoZm9yIHRlc3RzIGFuZCBkZWJ1Z2dpbmcpLiAqL1xuICBnZXRSZW1hcFZhbHVlKGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fcmVtYXBbaW5kZXhdO1xuICB9XG5cbiAgLyoqIFNldHMgYSByZW1hcCBlbnRyeTogcGFja2VkIGluZGV4IC0+IGxvY2FsIHN0YWJsZSBpbmRleC4gKi9cbiAgc2V0UmVtYXAocGFja2VkSW5kZXg6IG51bWJlciwgbG9jYWxJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19yZW1hcFtwYWNrZWRJbmRleF0gIT09IGxvY2FsSW5kZXgpIHtcbiAgICAgIHRoaXMuX19yZW1hcFtwYWNrZWRJbmRleF0gPSBsb2NhbEluZGV4O1xuICAgICAgdGhpcy5fX3JlbWFwRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBNYXJrcyBib3RoIHRhYmxlcyBhcyBjaGFuZ2VkIHdpdGhvdXQgdG91Y2hpbmcgaW5kaXZpZHVhbCBlbnRyaWVzLiAqL1xuICBtYXJrQWxsRGlydHkoKTogdm9pZCB7XG4gICAgdGhpcy5fX3NpZERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fcmVtYXBEaXJ0eSA9IHRydWU7XG4gIH1cblxuICAvKiogQ2xlYXJzIHRoZSBkaXJ0eSBmbGFnIG9mIHRoZSBTSUQgcmVnaW9uIGFmdGVyIGl0IGhhcyBiZWVuIHVwbG9hZGVkLiAqL1xuICBjbGVhclNpZERpcnR5KCk6IHZvaWQge1xuICAgIHRoaXMuX19zaWREaXJ0eSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqIENsZWFycyB0aGUgZGlydHkgZmxhZyBvZiB0aGUgcmVtYXAgcmVnaW9uIGFmdGVyIGl0IGhhcyBiZWVuIHVwbG9hZGVkLiAqL1xuICBjbGVhclJlbWFwRGlydHkoKTogdm9pZCB7XG4gICAgdGhpcy5fX3JlbWFwRGlydHkgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgYGNvdW50YCBTSUQgdGV4ZWxzIHN0YXJ0aW5nIGF0IGB0ZXhlbE9mZnNldGAgaW50byBhIGRhdGEtdGV4dHVyZSB1cGxvYWRcbiAgICogYnVmZmVyIGFzIFJHQkEgZmxvYXQgdGV4ZWxzLiBUaGUgYDB4RkZGRkZGRkZgIGludmFsaWQgc2VudGluZWwgaXMgc3RvcmVkIGFzIC0xXG4gICAqIGJlY2F1c2UgZmxvYXQzMiBjYW5ub3QgcmVwcmVzZW50IDB4RkZGRkZGRkYgZXhhY3RseTsgdGhlIHNoYWRlciBjb252ZXJ0cyB0aGVcbiAgICogY29tcG9uZW50cyB0aHJvdWdoIGl2ZWM0IHNvIHRoZSBiaXQgcGF0dGVybiByb3VuZC10cmlwcy5cbiAgICovXG4gIHdyaXRlU2lkVGV4ZWxzKGRzdDogRmxvYXQzMkFycmF5LCB0ZXhlbE9mZnNldDogbnVtYmVyLCBjb3VudDogbnVtYmVyKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBzcmMgPSAodGV4ZWxPZmZzZXQgKyBpKSAqIDQ7XG4gICAgICBjb25zdCBkID0gaSAqIDQ7XG4gICAgICBkc3RbZF0gPSB0aGlzLl9fdG9TaWRGbG9hdCh0aGlzLl9fcmVjb3Jkc1tzcmNdKTtcbiAgICAgIGRzdFtkICsgMV0gPSB0aGlzLl9fdG9TaWRGbG9hdCh0aGlzLl9fcmVjb3Jkc1tzcmMgKyAxXSk7XG4gICAgICBkc3RbZCArIDJdID0gdGhpcy5fX3RvU2lkRmxvYXQodGhpcy5fX3JlY29yZHNbc3JjICsgMl0pO1xuICAgICAgZHN0W2QgKyAzXSA9IDA7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3RvU2lkRmxvYXQodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAweGZmZmZfZmZmZiA/IC0xIDogdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIGBjb3VudGAgcmVtYXAgdGV4ZWxzIChmb3VyIHBhY2tlZCBlbnRyaWVzIHBlciB0ZXhlbCkgc3RhcnRpbmcgYXRcbiAgICogYHRleGVsT2Zmc2V0YCBpbnRvIGEgZGF0YS10ZXh0dXJlIHVwbG9hZCBidWZmZXIuXG4gICAqL1xuICB3cml0ZVJlbWFwVGV4ZWxzKGRzdDogRmxvYXQzMkFycmF5LCB0ZXhlbE9mZnNldDogbnVtYmVyLCBjb3VudDogbnVtYmVyKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBzcmMgPSAodGV4ZWxPZmZzZXQgKyBpKSAqIDQ7XG4gICAgICBjb25zdCBkID0gaSAqIDQ7XG4gICAgICBkc3RbZF0gPSB0aGlzLl9fcmVtYXBbc3JjXTtcbiAgICAgIGRzdFtkICsgMV0gPSB0aGlzLl9fcmVtYXBbc3JjICsgMV07XG4gICAgICBkc3RbZCArIDJdID0gdGhpcy5fX3JlbWFwW3NyYyArIDJdO1xuICAgICAgZHN0W2QgKyAzXSA9IHRoaXMuX19yZW1hcFtzcmMgKyAzXTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZW5zdXJlQ2FwYWNpdHkocmVxdWlyZWQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChyZXF1aXJlZCA8PSB0aGlzLl9fY2FwYWNpdHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IG5ld0NhcGFjaXR5ID0gdGhpcy5fX2NhcGFjaXR5O1xuICAgIHdoaWxlIChuZXdDYXBhY2l0eSA8IHJlcXVpcmVkKSB7XG4gICAgICBuZXdDYXBhY2l0eSAqPSAyO1xuICAgIH1cbiAgICBjb25zdCBuZXdSZWNvcmRzID0gbmV3IFVpbnQzMkFycmF5KG5ld0NhcGFjaXR5ICogNCk7XG4gICAgbmV3UmVjb3Jkcy5zZXQodGhpcy5fX3JlY29yZHMpO1xuICAgIGNvbnN0IG5ld1JlbWFwID0gbmV3IFVpbnQzMkFycmF5KG5ld0NhcGFjaXR5KTtcbiAgICBuZXdSZW1hcC5zZXQodGhpcy5fX3JlbWFwKTtcbiAgICB0aGlzLl9fcmVjb3JkcyA9IG5ld1JlY29yZHM7XG4gICAgdGhpcy5fX3JlbWFwID0gbmV3UmVtYXA7XG4gICAgdGhpcy5fX2NhcGFjaXR5ID0gbmV3Q2FwYWNpdHk7XG4gICAgdGhpcy5fX3NpZERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9fcmVtYXBEaXJ0eSA9IHRydWU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFlTyxJQUFNLG1CQUFOLE1BQU0sa0JBQWlCO0FBQUEsRUFVNUIsWUFBWSxLQUEwQjtBQU50QyxTQUFRLFlBQVk7QUFDcEIsU0FBUSxlQUE0QixDQUFDO0FBQ3JDLFNBQVEsYUFBYTtBQUNyQixTQUFRLGVBQWU7QUFJckIsU0FBSyxnQkFBZ0Isa0JBQWlCLFlBQVksR0FBRztBQUNyRCxTQUFLLGFBQWE7QUFDbEIsU0FBSyxZQUFZLElBQUksWUFBWSxLQUFLLGFBQWEsQ0FBQztBQUNwRCxTQUFLLFVBQVUsSUFBSSxZQUFZLEtBQUssVUFBVTtBQUFBLEVBQ2hEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLE9BQU8sWUFBWSxLQUFtQztBQUNwRCxXQUFPLElBQUk7QUFBQSxFQUNiO0FBQUEsRUFFQSxJQUFJLGNBQXVCO0FBQ3pCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBLEVBR0EsSUFBSSxVQUFrQjtBQUNwQixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFJLFdBQW9CO0FBQ3RCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQSxFQUVBLElBQUksYUFBc0I7QUFDeEIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxTQUFTLE9BQXVCO0FBQzlCLFFB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
