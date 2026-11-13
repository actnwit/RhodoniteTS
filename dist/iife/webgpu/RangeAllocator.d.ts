/**
 * A first-fit allocator of byte ranges within a fixed-size region.
 *
 * Free ranges are kept sorted by offset and merged with their neighbors on release, so the region does
 * not fragment into unusable pieces when ranges are allocated and released repeatedly.
 * It does not touch any GPU resource; WebGpuBufferArena uses it to sub-allocate large GPU buffers.
 */
export declare class RangeAllocator {
    private readonly __capacity;
    /** Sorted, non-overlapping, non-adjacent free ranges. */
    private __freeOffsets;
    private __freeSizes;
    private __usedSize;
    /**
     * @param capacity - The size of the region in bytes
     */
    constructor(capacity: number);
    /** The size of the region in bytes. */
    get capacity(): number;
    /** The total size of the allocated ranges in bytes. */
    get usedSize(): number;
    /** Whether no range is allocated. */
    get isEmpty(): boolean;
    /**
     * Allocates a range.
     * @param size - The size in bytes
     * @param alignment - The alignment of the returned offset in bytes
     * @returns The offset of the range, or -1 if no free range is large enough
     */
    allocate(size: number, alignment: number): number;
    /**
     * Releases a range returned by allocate().
     * @param offset - The offset of the range
     * @param size - The size of the range in bytes
     */
    release(offset: number, size: number): void;
    /** The free ranges as [offset, size] pairs, for tests and debugging. */
    getFreeRanges(): [number, number][];
}
