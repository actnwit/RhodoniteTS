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

/** Offsets of vertex buffers must be multiples of 4 and those of index buffers multiples of the index size. */
const RANGE_ALIGNMENT = 16;
/** queue.writeBuffer() requires the size to be a multiple of 4. */
const WRITE_ALIGNMENT = 4;
const DEFAULT_CHUNK_SIZE = 64 * 1024 * 1024;

/**
 * Sub-allocates vertex and index data from a few large GPU buffers.
 *
 * A frame that references tens of thousands of separate vertex and index buffers makes the browser's
 * GPU process (and the driver) track each of them, which dominated the frame time of scenes with many
 * meshes. Packing the data into a few buffers and binding ranges with offsets avoids that cost.
 */
export class WebGpuBufferArena {
  private __device: GPUDevice;
  private __usage: GPUBufferUsageFlags;
  private __chunkSize: number;
  private __chunks: WebGpuBufferArenaChunk[] = [];
  private __scratch = new Uint8Array(0);

  /**
   * @param device - The GPU device
   * @param usage - The usage of the chunk buffers. COPY_DST is added for uploads.
   * @param chunkSize - The size of a chunk in bytes. Larger data gets a dedicated chunk.
   */
  constructor(device: GPUDevice, usage: GPUBufferUsageFlags, chunkSize = DEFAULT_CHUNK_SIZE) {
    this.__device = device;
    this.__usage = usage | GPUBufferUsage.COPY_DST;
    this.__chunkSize = Math.min(chunkSize, device.limits.maxBufferSize);
  }

  /** The number of GPU buffers owned by the arena. */
  get chunkCount(): number {
    return this.__chunks.length;
  }

  /**
   * Allocates a range and uploads the data into it.
   * @param data - The data to upload
   * @returns The allocated range
   */
  allocate(data: Uint8Array): WebGpuBufferRange {
    const size = data.byteLength;
    const allocatedSize = Math.max(Math.ceil(size / WRITE_ALIGNMENT) * WRITE_ALIGNMENT, WRITE_ALIGNMENT);
    let chunk: WebGpuBufferArenaChunk | undefined;
    let offset = -1;
    for (let i = 0; i < this.__chunks.length; i++) {
      offset = this.__chunks[i].allocator.allocate(allocatedSize, RANGE_ALIGNMENT);
      if (offset >= 0) {
        chunk = this.__chunks[i];
        break;
      }
    }
    if (chunk == null) {
      const capacity = Math.max(this.__chunkSize, Math.ceil(allocatedSize / RANGE_ALIGNMENT) * RANGE_ALIGNMENT);
      chunk = {
        buffer: this.__device.createBuffer({ size: capacity, usage: this.__usage }),
        allocator: new RangeAllocator(capacity),
      };
      this.__chunks.push(chunk);
      offset = chunk.allocator.allocate(allocatedSize, RANGE_ALIGNMENT);
    }
    const range: WebGpuBufferRange = { buffer: chunk.buffer, offset, size, allocatedSize, chunk };
    this.write(range, data);
    return range;
  }

  /**
   * Uploads data into a range. Data larger than the range is truncated.
   * @param range - The range returned by allocate()
   * @param data - The data to upload
   */
  write(range: WebGpuBufferRange, data: Uint8Array) {
    const size = Math.min(data.byteLength, range.allocatedSize);
    if (size === 0) {
      return;
    }
    const writeSize = Math.ceil(size / WRITE_ALIGNMENT) * WRITE_ALIGNMENT;
    let source = data;
    // SharedArrayBuffer is undefined unless the page is cross-origin isolated, so test for ArrayBuffer.
    if (writeSize !== size || !(data.buffer instanceof ArrayBuffer)) {
      // Pad the data to the write alignment (and copy out of a shared buffer, which writeBuffer rejects).
      if (this.__scratch.byteLength < writeSize) {
        this.__scratch = new Uint8Array(writeSize);
      }
      source = this.__scratch.subarray(0, writeSize);
      source.set(data.subarray(0, size));
      source.fill(0, size);
    }
    this.__device.queue.writeBuffer(range.buffer, range.offset, source as Uint8Array<ArrayBuffer>, 0, writeSize);
  }

  /**
   * Releases a range. A chunk without any range left is destroyed, except the last one, which is kept
   * so that repeatedly creating and deleting a small mesh does not reallocate a whole chunk.
   * Writes to the queue are ordered after the commands submitted before, so a released range can be
   * reused for new data even if a submitted command still reads it.
   * @param range - The range returned by allocate()
   */
  release(range: WebGpuBufferRange) {
    const chunk = range.chunk;
    chunk.allocator.release(range.offset, range.allocatedSize);
    if (chunk.allocator.isEmpty && this.__chunks.length > 1) {
      const index = this.__chunks.indexOf(chunk);
      if (index >= 0) {
        this.__chunks.splice(index, 1);
      }
      chunk.buffer.destroy();
    }
  }

  /** Destroys all the chunks. */
  destroy() {
    for (const chunk of this.__chunks) {
      chunk.buffer.destroy();
    }
    this.__chunks.length = 0;
  }
}
