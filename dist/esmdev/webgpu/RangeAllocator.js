// src/webgpu/RangeAllocator.ts
var RangeAllocator = class {
  /**
   * @param capacity - The size of the region in bytes
   */
  constructor(capacity) {
    /** Sorted, non-overlapping, non-adjacent free ranges. */
    this.tG = [];
    this.uG = [];
    this.vG = 0;
    this.ly = capacity;
    if (capacity > 0) {
      this.tG.push(0);
      this.uG.push(capacity);
    }
  }
  /** The size of the region in bytes. */
  get capacity() {
    return this.ly;
  }
  /** The total size of the allocated ranges in bytes. */
  get usedSize() {
    return this.vG;
  }
  /** Whether no range is allocated. */
  get isEmpty() {
    return this.vG === 0;
  }
  /**
   * Allocates a range.
   * @param size - The size in bytes
   * @param alignment - The alignment of the returned offset in bytes
   * @returns The offset of the range, or -1 if no free range is large enough
   */
  allocate(size, alignment) {
    const offsets = this.tG;
    const sizes = this.uG;
    for (let i = 0; i < offsets.length; i++) {
      const freeOffset = offsets[i];
      const freeSize = sizes[i];
      const alignedOffset = Math.ceil(freeOffset / alignment) * alignment;
      const padding = alignedOffset - freeOffset;
      if (padding + size > freeSize) {
        continue;
      }
      const tailOffset = alignedOffset + size;
      const tailSize = freeOffset + freeSize - tailOffset;
      const replacementOffsets = [];
      const replacementSizes = [];
      if (padding > 0) {
        replacementOffsets.push(freeOffset);
        replacementSizes.push(padding);
      }
      if (tailSize > 0) {
        replacementOffsets.push(tailOffset);
        replacementSizes.push(tailSize);
      }
      offsets.splice(i, 1, ...replacementOffsets);
      sizes.splice(i, 1, ...replacementSizes);
      this.vG += size;
      return alignedOffset;
    }
    return -1;
  }
  /**
   * Releases a range returned by allocate().
   * @param offset - The offset of the range
   * @param size - The size of the range in bytes
   */
  release(offset, size) {
    const offsets = this.tG;
    const sizes = this.uG;
    let low = 0;
    let high = offsets.length;
    while (low < high) {
      const mid = low + high >> 1;
      if (offsets[mid] < offset) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    const next = low;
    const prev = next - 1;
    const mergesPrev = prev >= 0 && offsets[prev] + sizes[prev] === offset;
    const mergesNext = next < offsets.length && offset + size === offsets[next];
    if (mergesPrev && mergesNext) {
      sizes[prev] += size + sizes[next];
      offsets.splice(next, 1);
      sizes.splice(next, 1);
    } else if (mergesPrev) {
      sizes[prev] += size;
    } else if (mergesNext) {
      offsets[next] = offset;
      sizes[next] += size;
    } else {
      offsets.splice(next, 0, offset);
      sizes.splice(next, 0, size);
    }
    this.vG -= size;
  }
  /** The free ranges as [offset, size] pairs, for tests and debugging. */
  getFreeRanges() {
    return this.tG.map((offset, i) => [offset, this.uG[i]]);
  }
};
export {
  RangeAllocator
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL3dlYmdwdS9SYW5nZUFsbG9jYXRvci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBBIGZpcnN0LWZpdCBhbGxvY2F0b3Igb2YgYnl0ZSByYW5nZXMgd2l0aGluIGEgZml4ZWQtc2l6ZSByZWdpb24uXG4gKlxuICogRnJlZSByYW5nZXMgYXJlIGtlcHQgc29ydGVkIGJ5IG9mZnNldCBhbmQgbWVyZ2VkIHdpdGggdGhlaXIgbmVpZ2hib3JzIG9uIHJlbGVhc2UsIHNvIHRoZSByZWdpb24gZG9lc1xuICogbm90IGZyYWdtZW50IGludG8gdW51c2FibGUgcGllY2VzIHdoZW4gcmFuZ2VzIGFyZSBhbGxvY2F0ZWQgYW5kIHJlbGVhc2VkIHJlcGVhdGVkbHkuXG4gKiBJdCBkb2VzIG5vdCB0b3VjaCBhbnkgR1BVIHJlc291cmNlOyBXZWJHcHVCdWZmZXJBcmVuYSB1c2VzIGl0IHRvIHN1Yi1hbGxvY2F0ZSBsYXJnZSBHUFUgYnVmZmVycy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJhbmdlQWxsb2NhdG9yIHtcbiAgcHJpdmF0ZSByZWFkb25seSBfX2NhcGFjaXR5OiBudW1iZXI7XG4gIC8qKiBTb3J0ZWQsIG5vbi1vdmVybGFwcGluZywgbm9uLWFkamFjZW50IGZyZWUgcmFuZ2VzLiAqL1xuICBwcml2YXRlIF9fZnJlZU9mZnNldHM6IG51bWJlcltdID0gW107XG4gIHByaXZhdGUgX19mcmVlU2l6ZXM6IG51bWJlcltdID0gW107XG4gIHByaXZhdGUgX191c2VkU2l6ZSA9IDA7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBjYXBhY2l0eSAtIFRoZSBzaXplIG9mIHRoZSByZWdpb24gaW4gYnl0ZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNhcGFjaXR5OiBudW1iZXIpIHtcbiAgICB0aGlzLl9fY2FwYWNpdHkgPSBjYXBhY2l0eTtcbiAgICBpZiAoY2FwYWNpdHkgPiAwKSB7XG4gICAgICB0aGlzLl9fZnJlZU9mZnNldHMucHVzaCgwKTtcbiAgICAgIHRoaXMuX19mcmVlU2l6ZXMucHVzaChjYXBhY2l0eSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFRoZSBzaXplIG9mIHRoZSByZWdpb24gaW4gYnl0ZXMuICovXG4gIGdldCBjYXBhY2l0eSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fY2FwYWNpdHk7XG4gIH1cblxuICAvKiogVGhlIHRvdGFsIHNpemUgb2YgdGhlIGFsbG9jYXRlZCByYW5nZXMgaW4gYnl0ZXMuICovXG4gIGdldCB1c2VkU2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fdXNlZFNpemU7XG4gIH1cblxuICAvKiogV2hldGhlciBubyByYW5nZSBpcyBhbGxvY2F0ZWQuICovXG4gIGdldCBpc0VtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fdXNlZFNpemUgPT09IDA7XG4gIH1cblxuICAvKipcbiAgICogQWxsb2NhdGVzIGEgcmFuZ2UuXG4gICAqIEBwYXJhbSBzaXplIC0gVGhlIHNpemUgaW4gYnl0ZXNcbiAgICogQHBhcmFtIGFsaWdubWVudCAtIFRoZSBhbGlnbm1lbnQgb2YgdGhlIHJldHVybmVkIG9mZnNldCBpbiBieXRlc1xuICAgKiBAcmV0dXJucyBUaGUgb2Zmc2V0IG9mIHRoZSByYW5nZSwgb3IgLTEgaWYgbm8gZnJlZSByYW5nZSBpcyBsYXJnZSBlbm91Z2hcbiAgICovXG4gIGFsbG9jYXRlKHNpemU6IG51bWJlciwgYWxpZ25tZW50OiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IG9mZnNldHMgPSB0aGlzLl9fZnJlZU9mZnNldHM7XG4gICAgY29uc3Qgc2l6ZXMgPSB0aGlzLl9fZnJlZVNpemVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2Zmc2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZnJlZU9mZnNldCA9IG9mZnNldHNbaV07XG4gICAgICBjb25zdCBmcmVlU2l6ZSA9IHNpemVzW2ldO1xuICAgICAgY29uc3QgYWxpZ25lZE9mZnNldCA9IE1hdGguY2VpbChmcmVlT2Zmc2V0IC8gYWxpZ25tZW50KSAqIGFsaWdubWVudDtcbiAgICAgIGNvbnN0IHBhZGRpbmcgPSBhbGlnbmVkT2Zmc2V0IC0gZnJlZU9mZnNldDtcbiAgICAgIGlmIChwYWRkaW5nICsgc2l6ZSA+IGZyZWVTaXplKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgdGFpbE9mZnNldCA9IGFsaWduZWRPZmZzZXQgKyBzaXplO1xuICAgICAgY29uc3QgdGFpbFNpemUgPSBmcmVlT2Zmc2V0ICsgZnJlZVNpemUgLSB0YWlsT2Zmc2V0O1xuICAgICAgLy8gUmVwbGFjZSB0aGUgZnJlZSByYW5nZSB3aXRoIHRoZSBwYWRkaW5nIGJlZm9yZSBhbmQgdGhlIHJlbWFpbmRlciBhZnRlciB0aGUgYWxsb2NhdGlvbi5cbiAgICAgIGNvbnN0IHJlcGxhY2VtZW50T2Zmc2V0czogbnVtYmVyW10gPSBbXTtcbiAgICAgIGNvbnN0IHJlcGxhY2VtZW50U2l6ZXM6IG51bWJlcltdID0gW107XG4gICAgICBpZiAocGFkZGluZyA+IDApIHtcbiAgICAgICAgcmVwbGFjZW1lbnRPZmZzZXRzLnB1c2goZnJlZU9mZnNldCk7XG4gICAgICAgIHJlcGxhY2VtZW50U2l6ZXMucHVzaChwYWRkaW5nKTtcbiAgICAgIH1cbiAgICAgIGlmICh0YWlsU2l6ZSA+IDApIHtcbiAgICAgICAgcmVwbGFjZW1lbnRPZmZzZXRzLnB1c2godGFpbE9mZnNldCk7XG4gICAgICAgIHJlcGxhY2VtZW50U2l6ZXMucHVzaCh0YWlsU2l6ZSk7XG4gICAgICB9XG4gICAgICBvZmZzZXRzLnNwbGljZShpLCAxLCAuLi5yZXBsYWNlbWVudE9mZnNldHMpO1xuICAgICAgc2l6ZXMuc3BsaWNlKGksIDEsIC4uLnJlcGxhY2VtZW50U2l6ZXMpO1xuICAgICAgdGhpcy5fX3VzZWRTaXplICs9IHNpemU7XG4gICAgICByZXR1cm4gYWxpZ25lZE9mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2VzIGEgcmFuZ2UgcmV0dXJuZWQgYnkgYWxsb2NhdGUoKS5cbiAgICogQHBhcmFtIG9mZnNldCAtIFRoZSBvZmZzZXQgb2YgdGhlIHJhbmdlXG4gICAqIEBwYXJhbSBzaXplIC0gVGhlIHNpemUgb2YgdGhlIHJhbmdlIGluIGJ5dGVzXG4gICAqL1xuICByZWxlYXNlKG9mZnNldDogbnVtYmVyLCBzaXplOiBudW1iZXIpIHtcbiAgICBjb25zdCBvZmZzZXRzID0gdGhpcy5fX2ZyZWVPZmZzZXRzO1xuICAgIGNvbnN0IHNpemVzID0gdGhpcy5fX2ZyZWVTaXplcztcbiAgICAvLyBJbmRleCBvZiB0aGUgZmlyc3QgZnJlZSByYW5nZSBhZnRlciB0aGUgcmVsZWFzZWQgb25lLlxuICAgIGxldCBsb3cgPSAwO1xuICAgIGxldCBoaWdoID0gb2Zmc2V0cy5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIGNvbnN0IG1pZCA9IChsb3cgKyBoaWdoKSA+PiAxO1xuICAgICAgaWYgKG9mZnNldHNbbWlkXSA8IG9mZnNldCkge1xuICAgICAgICBsb3cgPSBtaWQgKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGlnaCA9IG1pZDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgbmV4dCA9IGxvdztcbiAgICBjb25zdCBwcmV2ID0gbmV4dCAtIDE7XG4gICAgY29uc3QgbWVyZ2VzUHJldiA9IHByZXYgPj0gMCAmJiBvZmZzZXRzW3ByZXZdICsgc2l6ZXNbcHJldl0gPT09IG9mZnNldDtcbiAgICBjb25zdCBtZXJnZXNOZXh0ID0gbmV4dCA8IG9mZnNldHMubGVuZ3RoICYmIG9mZnNldCArIHNpemUgPT09IG9mZnNldHNbbmV4dF07XG4gICAgaWYgKG1lcmdlc1ByZXYgJiYgbWVyZ2VzTmV4dCkge1xuICAgICAgc2l6ZXNbcHJldl0gKz0gc2l6ZSArIHNpemVzW25leHRdO1xuICAgICAgb2Zmc2V0cy5zcGxpY2UobmV4dCwgMSk7XG4gICAgICBzaXplcy5zcGxpY2UobmV4dCwgMSk7XG4gICAgfSBlbHNlIGlmIChtZXJnZXNQcmV2KSB7XG4gICAgICBzaXplc1twcmV2XSArPSBzaXplO1xuICAgIH0gZWxzZSBpZiAobWVyZ2VzTmV4dCkge1xuICAgICAgb2Zmc2V0c1tuZXh0XSA9IG9mZnNldDtcbiAgICAgIHNpemVzW25leHRdICs9IHNpemU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9mZnNldHMuc3BsaWNlKG5leHQsIDAsIG9mZnNldCk7XG4gICAgICBzaXplcy5zcGxpY2UobmV4dCwgMCwgc2l6ZSk7XG4gICAgfVxuICAgIHRoaXMuX191c2VkU2l6ZSAtPSBzaXplO1xuICB9XG5cbiAgLyoqIFRoZSBmcmVlIHJhbmdlcyBhcyBbb2Zmc2V0LCBzaXplXSBwYWlycywgZm9yIHRlc3RzIGFuZCBkZWJ1Z2dpbmcuICovXG4gIGdldEZyZWVSYW5nZXMoKTogW251bWJlciwgbnVtYmVyXVtdIHtcbiAgICByZXR1cm4gdGhpcy5fX2ZyZWVPZmZzZXRzLm1hcCgob2Zmc2V0LCBpKSA9PiBbb2Zmc2V0LCB0aGlzLl9fZnJlZVNpemVzW2ldXSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFPTyxJQUFNLGlCQUFOLE1BQXFCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVMUIsWUFBWSxVQUFrQjtBQVA5QjtBQUFBLFNBQVFBLEtBQTBCLENBQUM7QUFDbkMsU0FBUUMsS0FBd0IsQ0FBQztBQUNqQyxTQUFRQyxLQUFhO0FBTW5CLFNBQUtDLEtBQWE7QUFDbEIsUUFBSSxXQUFXLEdBQUc7QUFDaEIsV0FBS0gsR0FBYyxLQUFLLENBQUM7QUFDekIsV0FBS0MsR0FBWSxLQUFLLFFBQVE7QUFBQSxJQUNoQztBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsSUFBSSxXQUFtQjtBQUNyQixXQUFPLEtBQUtFO0FBQUEsRUFDZDtBQUFBO0FBQUEsRUFHQSxJQUFJLFdBQW1CO0FBQ3JCLFdBQU8sS0FBS0Q7QUFBQSxFQUNkO0FBQUE7QUFBQSxFQUdBLElBQUksVUFBbUI7QUFDckIsV0FBTyxLQUFLQSxPQUFlO0FBQUEsRUFDN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFNBQVMsTUFBYyxXQUEyQjtBQUNoRCxVQUFNLFVBQVUsS0FBS0Y7QUFDckIsVUFBTSxRQUFRLEtBQUtDO0FBQ25CLGFBQVMsSUFBSSxHQUFHLElBQUksUUFBUSxRQUFRLEtBQUs7QUFDdkMsWUFBTSxhQUFhLFFBQVEsQ0FBQztBQUM1QixZQUFNLFdBQVcsTUFBTSxDQUFDO0FBQ3hCLFlBQU0sZ0JBQWdCLEtBQUssS0FBSyxhQUFhLFNBQVMsSUFBSTtBQUMxRCxZQUFNLFVBQVUsZ0JBQWdCO0FBQ2hDLFVBQUksVUFBVSxPQUFPLFVBQVU7QUFDN0I7QUFBQSxNQUNGO0FBQ0EsWUFBTSxhQUFhLGdCQUFnQjtBQUNuQyxZQUFNLFdBQVcsYUFBYSxXQUFXO0FBRXpDLFlBQU0scUJBQStCLENBQUM7QUFDdEMsWUFBTSxtQkFBNkIsQ0FBQztBQUNwQyxVQUFJLFVBQVUsR0FBRztBQUNmLDJCQUFtQixLQUFLLFVBQVU7QUFDbEMseUJBQWlCLEtBQUssT0FBTztBQUFBLE1BQy9CO0FBQ0EsVUFBSSxXQUFXLEdBQUc7QUFDaEIsMkJBQW1CLEtBQUssVUFBVTtBQUNsQyx5QkFBaUIsS0FBSyxRQUFRO0FBQUEsTUFDaEM7QUFDQSxjQUFRLE9BQU8sR0FBRyxHQUFHLEdBQUcsa0JBQWtCO0FBQzFDLFlBQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxnQkFBZ0I7QUFDdEMsV0FBS0MsTUFBYztBQUNuQixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsUUFBUSxRQUFnQixNQUFjO0FBQ3BDLFVBQU0sVUFBVSxLQUFLRjtBQUNyQixVQUFNLFFBQVEsS0FBS0M7QUFFbkIsUUFBSSxNQUFNO0FBQ1YsUUFBSSxPQUFPLFFBQVE7QUFDbkIsV0FBTyxNQUFNLE1BQU07QUFDakIsWUFBTSxNQUFPLE1BQU0sUUFBUztBQUM1QixVQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVE7QUFDekIsY0FBTSxNQUFNO0FBQUEsTUFDZCxPQUFPO0FBQ0wsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPO0FBQ2IsVUFBTSxPQUFPLE9BQU87QUFDcEIsVUFBTSxhQUFhLFFBQVEsS0FBSyxRQUFRLElBQUksSUFBSSxNQUFNLElBQUksTUFBTTtBQUNoRSxVQUFNLGFBQWEsT0FBTyxRQUFRLFVBQVUsU0FBUyxTQUFTLFFBQVEsSUFBSTtBQUMxRSxRQUFJLGNBQWMsWUFBWTtBQUM1QixZQUFNLElBQUksS0FBSyxPQUFPLE1BQU0sSUFBSTtBQUNoQyxjQUFRLE9BQU8sTUFBTSxDQUFDO0FBQ3RCLFlBQU0sT0FBTyxNQUFNLENBQUM7QUFBQSxJQUN0QixXQUFXLFlBQVk7QUFDckIsWUFBTSxJQUFJLEtBQUs7QUFBQSxJQUNqQixXQUFXLFlBQVk7QUFDckIsY0FBUSxJQUFJLElBQUk7QUFDaEIsWUFBTSxJQUFJLEtBQUs7QUFBQSxJQUNqQixPQUFPO0FBQ0wsY0FBUSxPQUFPLE1BQU0sR0FBRyxNQUFNO0FBQzlCLFlBQU0sT0FBTyxNQUFNLEdBQUcsSUFBSTtBQUFBLElBQzVCO0FBQ0EsU0FBS0MsTUFBYztBQUFBLEVBQ3JCO0FBQUE7QUFBQSxFQUdBLGdCQUFvQztBQUNsQyxXQUFPLEtBQUtGLEdBQWMsSUFBSSxDQUFDLFFBQVEsTUFBTSxDQUFDLFFBQVEsS0FBS0MsR0FBWSxDQUFDLENBQUMsQ0FBQztBQUFBLEVBQzVFO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fZnJlZU9mZnNldHMiLCAiX19mcmVlU2l6ZXMiLCAiX191c2VkU2l6ZSIsICJfX2NhcGFjaXR5Il0KfQo=
