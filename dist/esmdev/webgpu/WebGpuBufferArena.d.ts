import { RangeAllocator } from './RangeAllocator';
/** A range of a GPU buffer owned by WebGpuBufferArena. */
export type WebGpuBufferRange = {
    buffer: GPUBuffer;
    offset: number;
    /** The size of the data in bytes, as passed to setVertexBuffer()/setIndexBuffer(). */
    size: number;
    /** The allocated size in bytes (the data size rounded up to the write alignment). */
    allocatedSize: number;
    chunk: WebGpuBufferArenaChunk;
};
type WebGpuBufferArenaChunk = {
    buffer: GPUBuffer;
    allocator: RangeAllocator;
};
/**
 * Sub-allocates vertex and index data from a few large GPU buffers.
 *
 * A frame that references tens of thousands of separate vertex and index buffers makes the browser's
 * GPU process (and the driver) track each of them, which dominated the frame time of scenes with many
 * meshes. Packing the data into a few buffers and binding ranges with offsets avoids that cost.
 */
export declare class WebGpuBufferArena {
    private __device;
    private __usage;
    private __chunkSize;
    private __chunks;
    private __scratch;
    /**
     * @param device - The GPU device
     * @param usage - The usage of the chunk buffers. COPY_DST is added for uploads.
     * @param chunkSize - The size of a chunk in bytes. Larger data gets a dedicated chunk.
     */
    constructor(device: GPUDevice, usage: GPUBufferUsageFlags, chunkSize?: number);
    /** The number of GPU buffers owned by the arena. */
    get chunkCount(): number;
    /**
     * Allocates a range and uploads the data into it.
     * @param data - The data to upload
     * @returns The allocated range
     */
    allocate(data: Uint8Array): WebGpuBufferRange;
    /**
     * Uploads data into a range. Data larger than the range is truncated.
     * @param range - The range returned by allocate()
     * @param data - The data to upload
     */
    write(range: WebGpuBufferRange, data: Uint8Array): void;
    /**
     * Releases a range. A chunk without any range left is destroyed, except the last one, which is kept
     * so that repeatedly creating and deleting a small mesh does not reallocate a whole chunk.
     * Writes to the queue are ordered after the commands submitted before, so a released range can be
     * reused for new data even if a submitted command still reads it.
     * @param range - The range returned by allocate()
     */
    release(range: WebGpuBufferRange): void;
    /** Destroys all the chunks. */
    destroy(): void;
}
export {};
