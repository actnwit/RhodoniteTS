/**
 * A first-fit allocator of byte ranges within a fixed-size region.
 *
 * Free ranges are kept sorted by offset and merged with their neighbors on release, so the region does
 * not fragment into unusable pieces when ranges are allocated and released repeatedly.
 * It does not touch any GPU resource; WebGpuBufferArena uses it to sub-allocate large GPU buffers.
 */
export class RangeAllocator {
  private readonly __capacity: number;
  /** Sorted, non-overlapping, non-adjacent free ranges. */
  private __freeOffsets: number[] = [];
  private __freeSizes: number[] = [];
  private __usedSize = 0;

  /**
   * @param capacity - The size of the region in bytes
   */
  constructor(capacity: number) {
    this.__capacity = capacity;
    if (capacity > 0) {
      this.__freeOffsets.push(0);
      this.__freeSizes.push(capacity);
    }
  }

  /** The size of the region in bytes. */
  get capacity(): number {
    return this.__capacity;
  }

  /** The total size of the allocated ranges in bytes. */
  get usedSize(): number {
    return this.__usedSize;
  }

  /** Whether no range is allocated. */
  get isEmpty(): boolean {
    return this.__usedSize === 0;
  }

  /**
   * Allocates a range.
   * @param size - The size in bytes
   * @param alignment - The alignment of the returned offset in bytes
   * @returns The offset of the range, or -1 if no free range is large enough
   */
  allocate(size: number, alignment: number): number {
    const offsets = this.__freeOffsets;
    const sizes = this.__freeSizes;
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
      // Replace the free range with the padding before and the remainder after the allocation.
      const replacementOffsets: number[] = [];
      const replacementSizes: number[] = [];
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
      this.__usedSize += size;
      return alignedOffset;
    }
    return -1;
  }

  /**
   * Releases a range returned by allocate().
   * @param offset - The offset of the range
   * @param size - The size of the range in bytes
   */
  release(offset: number, size: number) {
    const offsets = this.__freeOffsets;
    const sizes = this.__freeSizes;
    // Index of the first free range after the released one.
    let low = 0;
    let high = offsets.length;
    while (low < high) {
      const mid = (low + high) >> 1;
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
    this.__usedSize -= size;
  }

  /** The free ranges as [offset, size] pairs, for tests and debugging. */
  getFreeRanges(): [number, number][] {
    return this.__freeOffsets.map((offset, i) => [offset, this.__freeSizes[i]]);
  }
}
