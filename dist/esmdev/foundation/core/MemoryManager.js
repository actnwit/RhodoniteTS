// src/foundation/core/MemoryManager.ts
import { BufferUse } from "../definitions/BufferUse.js";
import { Buffer } from "../memory/Buffer.js";
import { DataUtil } from "../misc/DataUtil.js";
import { MiscUtil } from "../misc/MiscUtil.js";
var MemoryManager = class _MemoryManager {
  /**
   * Private constructor to ensure singleton pattern.
   * Initializes memory size ratios for different buffer types.
   * @param maxGPUDataStorageSize - The maximum GPU data storage size in bytes
   */
  constructor(engine, maxGPUDataStorageSize) {
    this.ej = /* @__PURE__ */ new Map();
    this.fj = /* @__PURE__ */ new Map();
    this.gj = 0;
    // private __bufferSizeDivisionRatiosForGPUInstanceDataUsage = [
    //   1 / 8192,
    //   1 / 4096,
    //   1 / 2048,
    //   1 / 1024,
    //   1 / 512,
    //   1 / 256,
    //   1 / 128,
    //   1 / 64,
    //   1 / 32,
    //   1 / 16,
    //   3 / 16,
    //   8 / 16,
    // ];
    this.jj = [8 / 32];
    this.c = engine;
    this.hj = engine.config.bufferSizeDivisionRatiosForGPUInstanceDataUsage;
    this.gj = maxGPUDataStorageSize;
  }
  /**
   * Creates a MemoryManager instance if it doesn't exist, or returns the existing instance.
   * This method enforces the singleton pattern.
   * @param maxGPUDataStorageSize - The maximum GPU data storage size in bytes
   * @returns The MemoryManager singleton instance
   */
  static createInstanceIfNotCreated(engine, maxGPUDataStorageSize) {
    return new _MemoryManager(engine, maxGPUDataStorageSize);
  }
  /**
   * Ensures the memory size is a multiple of 4 bytes for proper alignment.
   * @param memorySize - The original memory size in bytes
   * @returns The adjusted memory size that is a multiple of 4 bytes
   */
  kj(memorySize) {
    return memorySize + (memorySize % 4 === 0 ? 0 : 4 - memorySize % 4);
  }
  /**
   * Creates a new buffer for the specified buffer use type.
   * Sets appropriate byte alignment based on buffer type (4 bytes for CPU, 16 bytes for GPU).
   * @param bufferUse - The type of buffer to create
   * @returns The newly created Buffer instance
   */
  ij(bufferUse) {
    const count = this.getLayerCountOfTheBufferUsage(bufferUse);
    let rawMemorySize = this.gj * 1 / 16;
    if (bufferUse === BufferUse.GPUInstanceData) {
      rawMemorySize = this.gj * this.hj[count];
    } else if (bufferUse === BufferUse.GPUVertexData) {
      rawMemorySize = this.gj * this.jj[count];
    }
    const memorySize = Math.floor(rawMemorySize / 16) * 16;
    const arrayBuffer = new ArrayBuffer(memorySize);
    let byteAlign = 4;
    if (bufferUse === BufferUse.GPUInstanceData || bufferUse === BufferUse.GPUVertexData) {
      byteAlign = 16;
    }
    const buffer = new Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: bufferUse.str,
      byteAlign,
      bufferUsage: bufferUse,
      indexOfTheBufferUsage: count
    });
    let bufferMap = this.ej.get(bufferUse);
    if (bufferMap == null) {
      bufferMap = /* @__PURE__ */ new Map();
      this.ej.set(bufferUse, bufferMap);
    }
    bufferMap.set(count, buffer);
    this.incrementCountOfTheBufferUsage(bufferUse);
    return buffer;
  }
  /**
   * Retrieves an existing buffer for the specified buffer use type.
   * @param bufferUse - The type of buffer to retrieve
   * @returns The Buffer instance if it exists, undefined otherwise
   */
  getBuffer(bufferUse, indexOfTheBufferLayer) {
    const bufferMap = this.ej.get(bufferUse);
    if (bufferMap == null) {
      return void 0;
    }
    const count = indexOfTheBufferLayer != null ? indexOfTheBufferLayer : this.getActiveBufferLayerIndexOfTheBufferUsage(bufferUse);
    return bufferMap.get(count);
  }
  /**
   * Gets an existing buffer or creates a new one if it doesn't exist.
   * @param bufferUse - The type of buffer to retrieve or create
   * @param requireIndexOfTheBufferLayer - The index of the buffer layer to retrieve or create
   * @returns The Buffer instance (existing or newly created)
   */
  createOrGetBuffer(bufferUse, requireIndexOfTheBufferLayer = 0) {
    const currentBufferLayerCount = this.getLayerCountOfTheBufferUsage(bufferUse);
    if (requireIndexOfTheBufferLayer >= currentBufferLayerCount) {
      return this.ij(bufferUse);
    }
    let buffer = this.getBuffer(bufferUse, Math.min(requireIndexOfTheBufferLayer, currentBufferLayerCount - 1));
    return buffer != null ? buffer : this.ij(bufferUse);
  }
  /**
   * Creates a buffer on-demand with custom size and alignment for a specific object.
   * @param bufferUse - The type of buffer to create
   * @param size - The size of the buffer in bytes
   * @param byteAlign - The byte alignment requirement for the buffer
   * @returns The newly created Buffer instance
   */
  createBufferOnDemand(bufferUse, size, byteAlign) {
    const alignedSize = DataUtil.addPaddingBytes(size, byteAlign);
    const arrayBuffer = new ArrayBuffer(alignedSize);
    const count = this.getLayerCountOfTheBufferUsage(bufferUse);
    const buffer = new Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: bufferUse.toString(),
      byteAlign,
      bufferUsage: bufferUse,
      indexOfTheBufferUsage: count
    });
    let bufferMap = this.ej.get(bufferUse);
    if (bufferMap == null) {
      bufferMap = /* @__PURE__ */ new Map();
      this.ej.set(bufferUse, bufferMap);
    }
    bufferMap.set(count, buffer);
    this.incrementCountOfTheBufferUsage(bufferUse);
    return buffer;
  }
  /**
   * Gets the index of the active buffer layer for the specified buffer use type.
   * @param bufferUse - The type of buffer to get the active layer index of
   * @returns The index of the active buffer layer
   */
  getActiveBufferLayerIndexOfTheBufferUsage(bufferUse) {
    return this.getLayerCountOfTheBufferUsage(bufferUse) - 1;
  }
  /**
   * Gets the count of the buffer layers for the specified buffer use type.
   * @param bufferUse - The type of buffer to get the count of layers of
   * @returns The count of the buffer layers
   */
  getLayerCountOfTheBufferUsage(bufferUse) {
    const count = this.fj.get(bufferUse);
    if (count != null) {
      return count;
    }
    this.fj.set(bufferUse, 0);
    return 0;
  }
  /**
   * Increments the count of the buffer layers for the specified buffer use type.
   * @param bufferUse - The type of buffer to increment the count of layers of
   */
  incrementCountOfTheBufferUsage(bufferUse) {
    const count = this.fj.get(bufferUse);
    if (count == null) {
      this.fj.set(bufferUse, 1);
      return;
    }
    this.fj.set(bufferUse, count + 1);
  }
  /**
   * Gets the sizes of the buffers for the specified buffer use type.
   * @param bufferUse - The type of buffer to get the sizes of
   * @returns The sizes of the buffers in bytes
   */
  getSizesOfTheBuffers(bufferUse) {
    const sizes = [];
    const bufferCount = this.getLayerCountOfTheBufferUsage(bufferUse);
    for (let i = 0; i < bufferCount; i++) {
      const buffer = this.getBuffer(bufferUse, i);
      if (buffer == null) {
        continue;
      }
      sizes.push(buffer.byteLength);
    }
    return sizes;
  }
  getBuffers(bufferUse) {
    const buffers = [];
    const bufferCount = this.getLayerCountOfTheBufferUsage(bufferUse);
    for (let i = 0; i < bufferCount; i++) {
      const buffer = this.getBuffer(bufferUse, i);
      if (buffer != null) {
        buffers.push(buffer);
      }
    }
    return buffers;
  }
  /**
   * Gets the byte offset of the existing buffers for the specified buffer use type and index of the buffer layer.
   * @param bufferUse - The type of buffer to get the byte offset of
   * @param indexOfTheBufferLayer - The index of the buffer layer to get the byte offset of
   * @returns The byte offset of the existing buffers in bytes
   */
  getByteOffsetOfExistingBuffers(bufferUse, indexOfTheBufferLayer) {
    const sizesOfTheBuffers = this.getSizesOfTheBuffers(bufferUse).slice(0, indexOfTheBufferLayer);
    const byteOffsetOfExistingBuffers = sizesOfTheBuffers.reduce((acc, size) => acc + size, 0);
    return byteOffsetOfExistingBuffers;
  }
  /**
   * Reads float values from the concatenated layers of a buffer usage.
   *
   * This is intended for debugging tools. The returned array is a copy when the range
   * spans buffer layers, and a view into the layer otherwise.
   *
   * @param bufferUse - The buffer usage to read
   * @param byteOffset - Byte offset from the start of the first layer
   * @param count - Number of float values to read
   * @returns The read values, or null when the range is outside the allocated buffers
   */
  readFloat32Array(bufferUse, byteOffset, count) {
    if (byteOffset < 0 || count <= 0) {
      return null;
    }
    const buffers = this.getBuffers(bufferUse);
    let remainingByteOffset = byteOffset;
    let written = 0;
    const result = new Float32Array(count);
    for (const buffer of buffers) {
      const layerByteLength = buffer.byteLength;
      if (remainingByteOffset >= layerByteLength) {
        remainingByteOffset -= layerByteLength;
        continue;
      }
      const availableFloats = Math.floor((layerByteLength - remainingByteOffset) / 4);
      const floatsToRead = Math.min(availableFloats, count - written);
      if (floatsToRead > 0) {
        const alignedByteOffset = Math.floor(remainingByteOffset / 4) * 4;
        const source = new Float32Array(buffer.getArrayBuffer(), alignedByteOffset, floatsToRead);
        result.set(source, written);
        written += floatsToRead;
      }
      remainingByteOffset = 0;
      if (written >= count) {
        break;
      }
    }
    return written >= count ? result : null;
  }
  /**
   * Prints memory usage statistics for all managed buffers to the console.
   * Shows used bytes, total bytes, and usage percentage for each buffer type.
   */
  printMemoryUsage() {
    console.log("Memory Usage in Memory Manager\n");
    const printBufferUsage = (bufferUse) => {
      const bufferCount = this.getLayerCountOfTheBufferUsage(bufferUse);
      for (let i = 0; i < bufferCount; i++) {
        const buffer = this.getBuffer(bufferUse, i);
        if (buffer == null) {
          continue;
        }
        console.log(
          `${bufferUse.str} ${i}: ${buffer.takenSizeInByte} byte of ${buffer.byteLength} bytes. (${buffer.takenSizeInByte / buffer.byteLength * 100} %) `
        );
      }
    };
    printBufferUsage(BufferUse.CPUGeneric);
    printBufferUsage(BufferUse.GPUInstanceData);
    printBufferUsage(BufferUse.GPUVertexData);
  }
  /**
   * Dumps the contents of a buffer to a downloadable file for debugging purposes.
   * @param bufferUse - The type of buffer to dump
   */
  dumpBuffer(bufferUse) {
    const bufferCount = this.getLayerCountOfTheBufferUsage(bufferUse);
    for (let i = 0; i < bufferCount; i++) {
      const buffer = this.getBuffer(bufferUse, i);
      if (buffer == null) {
        continue;
      }
      MiscUtil.downloadArrayBuffer(bufferUse.str + i, buffer.getArrayBuffer());
    }
  }
  /**
   * Destroys all allocated buffers and clears internal state.
   *
   * @remarks
   * This method clears all buffer maps and resets the buffer usage counters.
   * After calling this method, the MemoryManager should not be used.
   */
  destroy() {
    this.ej.clear();
    this.fj.clear();
  }
};
export {
  MemoryManager
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9NZW1vcnlNYW5hZ2VyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEJ5dGUsIENvdW50LCBJbmRleCB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IEJ1ZmZlclVzZSwgdHlwZSBCdWZmZXJVc2VFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJy4uL21lbW9yeS9CdWZmZXInO1xuaW1wb3J0IHsgRGF0YVV0aWwgfSBmcm9tICcuLi9taXNjL0RhdGFVdGlsJztcbmltcG9ydCB7IE1pc2NVdGlsIH0gZnJvbSAnLi4vbWlzYy9NaXNjVXRpbCc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuXG4vKipcbiAqIE1lbW9yeU1hbmFnZXIgaXMgYSBzaW5nbGV0b24gY2xhc3MgdGhhdCBtYW5hZ2VzIHRoZSBtZW1vcnkgYWxsb2NhdGlvbiBhbmQgYnVmZmVycyBmb3IgdGhlIFJob2Rvbml0ZSBsaWJyYXJ5LlxuICogSXQgaGFuZGxlcyBkaWZmZXJlbnQgdHlwZXMgb2YgYnVmZmVycyBpbmNsdWRpbmcgQ1BVIGdlbmVyaWMgZGF0YSwgR1BVIGluc3RhbmNlIGRhdGEsIGFuZCBHUFUgdmVydGV4IGRhdGEuXG4gKi9cblxudHlwZSBJbmRleE9mQnVmZmVyTGF5ZXIgPSBJbmRleDtcbmV4cG9ydCBjbGFzcyBNZW1vcnlNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBfX2VuZ2luZTogRW5naW5lO1xuICBwcml2YXRlIF9fYnVmZmVyczogTWFwPEJ1ZmZlclVzZUVudW0sIE1hcDxJbmRleE9mQnVmZmVyTGF5ZXIsIEJ1ZmZlcj4+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fY291bnRPZlRoZUJ1ZmZlclVzYWdlTWFwOiBNYXA8QnVmZmVyVXNlRW51bSwgQ291bnQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fbWF4R1BVRGF0YVN0b3JhZ2VTaXplOiBCeXRlID0gMDtcbiAgcHJpdmF0ZSBfX2J1ZmZlclNpemVEaXZpc2lvblJhdGlvc0ZvckdQVUluc3RhbmNlRGF0YVVzYWdlO1xuICAvLyBwcml2YXRlIF9fYnVmZmVyU2l6ZURpdmlzaW9uUmF0aW9zRm9yR1BVSW5zdGFuY2VEYXRhVXNhZ2UgPSBbXG4gIC8vICAgMSAvIDgxOTIsXG4gIC8vICAgMSAvIDQwOTYsXG4gIC8vICAgMSAvIDIwNDgsXG4gIC8vICAgMSAvIDEwMjQsXG4gIC8vICAgMSAvIDUxMixcbiAgLy8gICAxIC8gMjU2LFxuICAvLyAgIDEgLyAxMjgsXG4gIC8vICAgMSAvIDY0LFxuICAvLyAgIDEgLyAzMixcbiAgLy8gICAxIC8gMTYsXG4gIC8vICAgMyAvIDE2LFxuICAvLyAgIDggLyAxNixcbiAgLy8gXTtcbiAgcHJpdmF0ZSBfX2J1ZmZlclNpemVEaXZpc2lvblJhdGlvc0ZvckdQVVZlcnRleERhdGFVc2FnZSA9IFs4IC8gMzJdO1xuXG4gIC8qKlxuICAgKiBQcml2YXRlIGNvbnN0cnVjdG9yIHRvIGVuc3VyZSBzaW5nbGV0b24gcGF0dGVybi5cbiAgICogSW5pdGlhbGl6ZXMgbWVtb3J5IHNpemUgcmF0aW9zIGZvciBkaWZmZXJlbnQgYnVmZmVyIHR5cGVzLlxuICAgKiBAcGFyYW0gbWF4R1BVRGF0YVN0b3JhZ2VTaXplIC0gVGhlIG1heGltdW0gR1BVIGRhdGEgc3RvcmFnZSBzaXplIGluIGJ5dGVzXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lLCBtYXhHUFVEYXRhU3RvcmFnZVNpemU6IEJ5dGUpIHtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICAgIHRoaXMuX19idWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVJbnN0YW5jZURhdGFVc2FnZSA9XG4gICAgICBlbmdpbmUuY29uZmlnLmJ1ZmZlclNpemVEaXZpc2lvblJhdGlvc0ZvckdQVUluc3RhbmNlRGF0YVVzYWdlO1xuICAgIHRoaXMuX19tYXhHUFVEYXRhU3RvcmFnZVNpemUgPSBtYXhHUFVEYXRhU3RvcmFnZVNpemU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIE1lbW9yeU1hbmFnZXIgaW5zdGFuY2UgaWYgaXQgZG9lc24ndCBleGlzdCwgb3IgcmV0dXJucyB0aGUgZXhpc3RpbmcgaW5zdGFuY2UuXG4gICAqIFRoaXMgbWV0aG9kIGVuZm9yY2VzIHRoZSBzaW5nbGV0b24gcGF0dGVybi5cbiAgICogQHBhcmFtIG1heEdQVURhdGFTdG9yYWdlU2l6ZSAtIFRoZSBtYXhpbXVtIEdQVSBkYXRhIHN0b3JhZ2Ugc2l6ZSBpbiBieXRlc1xuICAgKiBAcmV0dXJucyBUaGUgTWVtb3J5TWFuYWdlciBzaW5nbGV0b24gaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBjcmVhdGVJbnN0YW5jZUlmTm90Q3JlYXRlZChlbmdpbmU6IEVuZ2luZSwgbWF4R1BVRGF0YVN0b3JhZ2VTaXplOiBCeXRlKSB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlNYW5hZ2VyKGVuZ2luZSwgbWF4R1BVRGF0YVN0b3JhZ2VTaXplKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbnN1cmVzIHRoZSBtZW1vcnkgc2l6ZSBpcyBhIG11bHRpcGxlIG9mIDQgYnl0ZXMgZm9yIHByb3BlciBhbGlnbm1lbnQuXG4gICAqIEBwYXJhbSBtZW1vcnlTaXplIC0gVGhlIG9yaWdpbmFsIG1lbW9yeSBzaXplIGluIGJ5dGVzXG4gICAqIEByZXR1cm5zIFRoZSBhZGp1c3RlZCBtZW1vcnkgc2l6ZSB0aGF0IGlzIGEgbXVsdGlwbGUgb2YgNCBieXRlc1xuICAgKi9cbiAgcHJpdmF0ZSBfX21ha2VNdWx0aXBsZU9mNGJ5dGVTaXplKG1lbW9yeVNpemU6IG51bWJlcikge1xuICAgIHJldHVybiBtZW1vcnlTaXplICsgKG1lbW9yeVNpemUgJSA0ID09PSAwID8gMCA6IDQgLSAobWVtb3J5U2l6ZSAlIDQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGJ1ZmZlciBmb3IgdGhlIHNwZWNpZmllZCBidWZmZXIgdXNlIHR5cGUuXG4gICAqIFNldHMgYXBwcm9wcmlhdGUgYnl0ZSBhbGlnbm1lbnQgYmFzZWQgb24gYnVmZmVyIHR5cGUgKDQgYnl0ZXMgZm9yIENQVSwgMTYgYnl0ZXMgZm9yIEdQVSkuXG4gICAqIEBwYXJhbSBidWZmZXJVc2UgLSBUaGUgdHlwZSBvZiBidWZmZXIgdG8gY3JlYXRlXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBjcmVhdGVkIEJ1ZmZlciBpbnN0YW5jZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2NyZWF0ZUJ1ZmZlcihidWZmZXJVc2U6IEJ1ZmZlclVzZUVudW0pIHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuZ2V0TGF5ZXJDb3VudE9mVGhlQnVmZmVyVXNhZ2UoYnVmZmVyVXNlKTtcbiAgICBsZXQgcmF3TWVtb3J5U2l6ZSA9ICh0aGlzLl9fbWF4R1BVRGF0YVN0b3JhZ2VTaXplICogMSkgLyAxNjtcbiAgICBpZiAoYnVmZmVyVXNlID09PSBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhKSB7XG4gICAgICByYXdNZW1vcnlTaXplID0gdGhpcy5fX21heEdQVURhdGFTdG9yYWdlU2l6ZSAqIHRoaXMuX19idWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVJbnN0YW5jZURhdGFVc2FnZVtjb3VudF07XG4gICAgfSBlbHNlIGlmIChidWZmZXJVc2UgPT09IEJ1ZmZlclVzZS5HUFVWZXJ0ZXhEYXRhKSB7XG4gICAgICByYXdNZW1vcnlTaXplID0gdGhpcy5fX21heEdQVURhdGFTdG9yYWdlU2l6ZSAqIHRoaXMuX19idWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVWZXJ0ZXhEYXRhVXNhZ2VbY291bnRdO1xuICAgIH1cbiAgICBjb25zdCBtZW1vcnlTaXplID0gTWF0aC5mbG9vcihyYXdNZW1vcnlTaXplIC8gMTYpICogMTY7XG4gICAgY29uc3QgYXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIobWVtb3J5U2l6ZSk7XG5cbiAgICBsZXQgYnl0ZUFsaWduID0gNDtcbiAgICBpZiAoYnVmZmVyVXNlID09PSBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhIHx8IGJ1ZmZlclVzZSA9PT0gQnVmZmVyVXNlLkdQVVZlcnRleERhdGEpIHtcbiAgICAgIGJ5dGVBbGlnbiA9IDE2O1xuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBCdWZmZXIoe1xuICAgICAgYnl0ZUxlbmd0aDogYXJyYXlCdWZmZXIuYnl0ZUxlbmd0aCxcbiAgICAgIGJ1ZmZlcjogYXJyYXlCdWZmZXIsXG4gICAgICBuYW1lOiBidWZmZXJVc2Uuc3RyLFxuICAgICAgYnl0ZUFsaWduOiBieXRlQWxpZ24sXG4gICAgICBidWZmZXJVc2FnZTogYnVmZmVyVXNlLFxuICAgICAgaW5kZXhPZlRoZUJ1ZmZlclVzYWdlOiBjb3VudCxcbiAgICB9KTtcblxuICAgIC8vIGFkZCB0aGUgYnVmZmVyIHRvIHRoZSBidWZmZXIgbWFwXG4gICAgbGV0IGJ1ZmZlck1hcCA9IHRoaXMuX19idWZmZXJzLmdldChidWZmZXJVc2UpO1xuICAgIGlmIChidWZmZXJNYXAgPT0gbnVsbCkge1xuICAgICAgYnVmZmVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgdGhpcy5fX2J1ZmZlcnMuc2V0KGJ1ZmZlclVzZSwgYnVmZmVyTWFwKTtcbiAgICB9XG4gICAgYnVmZmVyTWFwLnNldChjb3VudCwgYnVmZmVyKTtcblxuICAgIC8vIGluY3JlbWVudCB0aGUgY291bnQgb2YgdGhlIGJ1ZmZlciB1c2FnZVxuICAgIHRoaXMuaW5jcmVtZW50Q291bnRPZlRoZUJ1ZmZlclVzYWdlKGJ1ZmZlclVzZSk7XG5cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBleGlzdGluZyBidWZmZXIgZm9yIHRoZSBzcGVjaWZpZWQgYnVmZmVyIHVzZSB0eXBlLlxuICAgKiBAcGFyYW0gYnVmZmVyVXNlIC0gVGhlIHR5cGUgb2YgYnVmZmVyIHRvIHJldHJpZXZlXG4gICAqIEByZXR1cm5zIFRoZSBCdWZmZXIgaW5zdGFuY2UgaWYgaXQgZXhpc3RzLCB1bmRlZmluZWQgb3RoZXJ3aXNlXG4gICAqL1xuICBwdWJsaWMgZ2V0QnVmZmVyKGJ1ZmZlclVzZTogQnVmZmVyVXNlRW51bSwgaW5kZXhPZlRoZUJ1ZmZlckxheWVyPzogSW5kZXgpOiBCdWZmZXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGJ1ZmZlck1hcCA9IHRoaXMuX19idWZmZXJzLmdldChidWZmZXJVc2UpO1xuICAgIGlmIChidWZmZXJNYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgY291bnQgPSBpbmRleE9mVGhlQnVmZmVyTGF5ZXIgPz8gdGhpcy5nZXRBY3RpdmVCdWZmZXJMYXllckluZGV4T2ZUaGVCdWZmZXJVc2FnZShidWZmZXJVc2UpO1xuICAgIHJldHVybiBidWZmZXJNYXAuZ2V0KGNvdW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIGV4aXN0aW5nIGJ1ZmZlciBvciBjcmVhdGVzIGEgbmV3IG9uZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgKiBAcGFyYW0gYnVmZmVyVXNlIC0gVGhlIHR5cGUgb2YgYnVmZmVyIHRvIHJldHJpZXZlIG9yIGNyZWF0ZVxuICAgKiBAcGFyYW0gcmVxdWlyZUluZGV4T2ZUaGVCdWZmZXJMYXllciAtIFRoZSBpbmRleCBvZiB0aGUgYnVmZmVyIGxheWVyIHRvIHJldHJpZXZlIG9yIGNyZWF0ZVxuICAgKiBAcmV0dXJucyBUaGUgQnVmZmVyIGluc3RhbmNlIChleGlzdGluZyBvciBuZXdseSBjcmVhdGVkKVxuICAgKi9cbiAgcHVibGljIGNyZWF0ZU9yR2V0QnVmZmVyKGJ1ZmZlclVzZTogQnVmZmVyVXNlRW51bSwgcmVxdWlyZUluZGV4T2ZUaGVCdWZmZXJMYXllcjogSW5kZXggPSAwKTogQnVmZmVyIHtcbiAgICBjb25zdCBjdXJyZW50QnVmZmVyTGF5ZXJDb3VudCA9IHRoaXMuZ2V0TGF5ZXJDb3VudE9mVGhlQnVmZmVyVXNhZ2UoYnVmZmVyVXNlKTtcbiAgICBpZiAocmVxdWlyZUluZGV4T2ZUaGVCdWZmZXJMYXllciA+PSBjdXJyZW50QnVmZmVyTGF5ZXJDb3VudCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19jcmVhdGVCdWZmZXIoYnVmZmVyVXNlKTtcbiAgICB9XG4gICAgbGV0IGJ1ZmZlciA9IHRoaXMuZ2V0QnVmZmVyKGJ1ZmZlclVzZSwgTWF0aC5taW4ocmVxdWlyZUluZGV4T2ZUaGVCdWZmZXJMYXllciwgY3VycmVudEJ1ZmZlckxheWVyQ291bnQgLSAxKSk7XG4gICAgcmV0dXJuIGJ1ZmZlciA/PyB0aGlzLl9fY3JlYXRlQnVmZmVyKGJ1ZmZlclVzZSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGJ1ZmZlciBvbi1kZW1hbmQgd2l0aCBjdXN0b20gc2l6ZSBhbmQgYWxpZ25tZW50IGZvciBhIHNwZWNpZmljIG9iamVjdC5cbiAgICogQHBhcmFtIGJ1ZmZlclVzZSAtIFRoZSB0eXBlIG9mIGJ1ZmZlciB0byBjcmVhdGVcbiAgICogQHBhcmFtIHNpemUgLSBUaGUgc2l6ZSBvZiB0aGUgYnVmZmVyIGluIGJ5dGVzXG4gICAqIEBwYXJhbSBieXRlQWxpZ24gLSBUaGUgYnl0ZSBhbGlnbm1lbnQgcmVxdWlyZW1lbnQgZm9yIHRoZSBidWZmZXJcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGNyZWF0ZWQgQnVmZmVyIGluc3RhbmNlXG4gICAqL1xuICBwdWJsaWMgY3JlYXRlQnVmZmVyT25EZW1hbmQoYnVmZmVyVXNlOiBCdWZmZXJVc2VFbnVtLCBzaXplOiBCeXRlLCBieXRlQWxpZ246IEJ5dGUpIHtcbiAgICBjb25zdCBhbGlnbmVkU2l6ZSA9IERhdGFVdGlsLmFkZFBhZGRpbmdCeXRlcyhzaXplLCBieXRlQWxpZ24pO1xuICAgIGNvbnN0IGFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGFsaWduZWRTaXplKTtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuZ2V0TGF5ZXJDb3VudE9mVGhlQnVmZmVyVXNhZ2UoYnVmZmVyVXNlKTtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKHtcbiAgICAgIGJ5dGVMZW5ndGg6IGFycmF5QnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICBidWZmZXI6IGFycmF5QnVmZmVyLFxuICAgICAgbmFtZTogYnVmZmVyVXNlLnRvU3RyaW5nKCksXG4gICAgICBieXRlQWxpZ246IGJ5dGVBbGlnbixcbiAgICAgIGJ1ZmZlclVzYWdlOiBidWZmZXJVc2UsXG4gICAgICBpbmRleE9mVGhlQnVmZmVyVXNhZ2U6IGNvdW50LFxuICAgIH0pO1xuXG4gICAgLy8gYWRkIHRoZSBidWZmZXIgdG8gdGhlIGJ1ZmZlciBtYXBcbiAgICBsZXQgYnVmZmVyTWFwID0gdGhpcy5fX2J1ZmZlcnMuZ2V0KGJ1ZmZlclVzZSk7XG4gICAgaWYgKGJ1ZmZlck1hcCA9PSBudWxsKSB7XG4gICAgICBidWZmZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICB0aGlzLl9fYnVmZmVycy5zZXQoYnVmZmVyVXNlLCBidWZmZXJNYXApO1xuICAgIH1cbiAgICBidWZmZXJNYXAuc2V0KGNvdW50LCBidWZmZXIpO1xuXG4gICAgdGhpcy5pbmNyZW1lbnRDb3VudE9mVGhlQnVmZmVyVXNhZ2UoYnVmZmVyVXNlKTtcbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IG9mIHRoZSBhY3RpdmUgYnVmZmVyIGxheWVyIGZvciB0aGUgc3BlY2lmaWVkIGJ1ZmZlciB1c2UgdHlwZS5cbiAgICogQHBhcmFtIGJ1ZmZlclVzZSAtIFRoZSB0eXBlIG9mIGJ1ZmZlciB0byBnZXQgdGhlIGFjdGl2ZSBsYXllciBpbmRleCBvZlxuICAgKiBAcmV0dXJucyBUaGUgaW5kZXggb2YgdGhlIGFjdGl2ZSBidWZmZXIgbGF5ZXJcbiAgICovXG4gIGdldEFjdGl2ZUJ1ZmZlckxheWVySW5kZXhPZlRoZUJ1ZmZlclVzYWdlKGJ1ZmZlclVzZTogQnVmZmVyVXNlRW51bSk6IEluZGV4IHtcbiAgICByZXR1cm4gdGhpcy5nZXRMYXllckNvdW50T2ZUaGVCdWZmZXJVc2FnZShidWZmZXJVc2UpIC0gMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb3VudCBvZiB0aGUgYnVmZmVyIGxheWVycyBmb3IgdGhlIHNwZWNpZmllZCBidWZmZXIgdXNlIHR5cGUuXG4gICAqIEBwYXJhbSBidWZmZXJVc2UgLSBUaGUgdHlwZSBvZiBidWZmZXIgdG8gZ2V0IHRoZSBjb3VudCBvZiBsYXllcnMgb2ZcbiAgICogQHJldHVybnMgVGhlIGNvdW50IG9mIHRoZSBidWZmZXIgbGF5ZXJzXG4gICAqL1xuICBnZXRMYXllckNvdW50T2ZUaGVCdWZmZXJVc2FnZShidWZmZXJVc2U6IEJ1ZmZlclVzZUVudW0pOiBDb3VudCB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLl9fY291bnRPZlRoZUJ1ZmZlclVzYWdlTWFwLmdldChidWZmZXJVc2UpO1xuICAgIGlmIChjb3VudCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuXG4gICAgdGhpcy5fX2NvdW50T2ZUaGVCdWZmZXJVc2FnZU1hcC5zZXQoYnVmZmVyVXNlLCAwKTtcblxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEluY3JlbWVudHMgdGhlIGNvdW50IG9mIHRoZSBidWZmZXIgbGF5ZXJzIGZvciB0aGUgc3BlY2lmaWVkIGJ1ZmZlciB1c2UgdHlwZS5cbiAgICogQHBhcmFtIGJ1ZmZlclVzZSAtIFRoZSB0eXBlIG9mIGJ1ZmZlciB0byBpbmNyZW1lbnQgdGhlIGNvdW50IG9mIGxheWVycyBvZlxuICAgKi9cbiAgaW5jcmVtZW50Q291bnRPZlRoZUJ1ZmZlclVzYWdlKGJ1ZmZlclVzZTogQnVmZmVyVXNlRW51bSk6IHZvaWQge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5fX2NvdW50T2ZUaGVCdWZmZXJVc2FnZU1hcC5nZXQoYnVmZmVyVXNlKTtcbiAgICBpZiAoY291bnQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2NvdW50T2ZUaGVCdWZmZXJVc2FnZU1hcC5zZXQoYnVmZmVyVXNlLCAxKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fY291bnRPZlRoZUJ1ZmZlclVzYWdlTWFwLnNldChidWZmZXJVc2UsIGNvdW50ICsgMSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2l6ZXMgb2YgdGhlIGJ1ZmZlcnMgZm9yIHRoZSBzcGVjaWZpZWQgYnVmZmVyIHVzZSB0eXBlLlxuICAgKiBAcGFyYW0gYnVmZmVyVXNlIC0gVGhlIHR5cGUgb2YgYnVmZmVyIHRvIGdldCB0aGUgc2l6ZXMgb2ZcbiAgICogQHJldHVybnMgVGhlIHNpemVzIG9mIHRoZSBidWZmZXJzIGluIGJ5dGVzXG4gICAqL1xuICBnZXRTaXplc09mVGhlQnVmZmVycyhidWZmZXJVc2U6IEJ1ZmZlclVzZUVudW0pOiBCeXRlW10ge1xuICAgIGNvbnN0IHNpemVzOiBCeXRlW10gPSBbXTtcbiAgICBjb25zdCBidWZmZXJDb3VudCA9IHRoaXMuZ2V0TGF5ZXJDb3VudE9mVGhlQnVmZmVyVXNhZ2UoYnVmZmVyVXNlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZmZlckNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuZ2V0QnVmZmVyKGJ1ZmZlclVzZSwgaSk7XG4gICAgICBpZiAoYnVmZmVyID09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzaXplcy5wdXNoKGJ1ZmZlci5ieXRlTGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNpemVzO1xuICB9XG5cbiAgZ2V0QnVmZmVycyhidWZmZXJVc2U6IEJ1ZmZlclVzZUVudW0pOiBCdWZmZXJbXSB7XG4gICAgY29uc3QgYnVmZmVyczogQnVmZmVyW10gPSBbXTtcbiAgICBjb25zdCBidWZmZXJDb3VudCA9IHRoaXMuZ2V0TGF5ZXJDb3VudE9mVGhlQnVmZmVyVXNhZ2UoYnVmZmVyVXNlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZmZlckNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuZ2V0QnVmZmVyKGJ1ZmZlclVzZSwgaSk7XG4gICAgICBpZiAoYnVmZmVyICE9IG51bGwpIHtcbiAgICAgICAgYnVmZmVycy5wdXNoKGJ1ZmZlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBidWZmZXJzO1xuICB9XG4gIC8qKlxuICAgKiBHZXRzIHRoZSBieXRlIG9mZnNldCBvZiB0aGUgZXhpc3RpbmcgYnVmZmVycyBmb3IgdGhlIHNwZWNpZmllZCBidWZmZXIgdXNlIHR5cGUgYW5kIGluZGV4IG9mIHRoZSBidWZmZXIgbGF5ZXIuXG4gICAqIEBwYXJhbSBidWZmZXJVc2UgLSBUaGUgdHlwZSBvZiBidWZmZXIgdG8gZ2V0IHRoZSBieXRlIG9mZnNldCBvZlxuICAgKiBAcGFyYW0gaW5kZXhPZlRoZUJ1ZmZlckxheWVyIC0gVGhlIGluZGV4IG9mIHRoZSBidWZmZXIgbGF5ZXIgdG8gZ2V0IHRoZSBieXRlIG9mZnNldCBvZlxuICAgKiBAcmV0dXJucyBUaGUgYnl0ZSBvZmZzZXQgb2YgdGhlIGV4aXN0aW5nIGJ1ZmZlcnMgaW4gYnl0ZXNcbiAgICovXG4gIGdldEJ5dGVPZmZzZXRPZkV4aXN0aW5nQnVmZmVycyhidWZmZXJVc2U6IEJ1ZmZlclVzZUVudW0sIGluZGV4T2ZUaGVCdWZmZXJMYXllcjogSW5kZXgpOiBCeXRlIHtcbiAgICBjb25zdCBzaXplc09mVGhlQnVmZmVycyA9IHRoaXMuZ2V0U2l6ZXNPZlRoZUJ1ZmZlcnMoYnVmZmVyVXNlKS5zbGljZSgwLCBpbmRleE9mVGhlQnVmZmVyTGF5ZXIpO1xuICAgIGNvbnN0IGJ5dGVPZmZzZXRPZkV4aXN0aW5nQnVmZmVycyA9IHNpemVzT2ZUaGVCdWZmZXJzLnJlZHVjZSgoYWNjLCBzaXplKSA9PiBhY2MgKyBzaXplLCAwKTtcbiAgICByZXR1cm4gYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIGZsb2F0IHZhbHVlcyBmcm9tIHRoZSBjb25jYXRlbmF0ZWQgbGF5ZXJzIG9mIGEgYnVmZmVyIHVzYWdlLlxuICAgKlxuICAgKiBUaGlzIGlzIGludGVuZGVkIGZvciBkZWJ1Z2dpbmcgdG9vbHMuIFRoZSByZXR1cm5lZCBhcnJheSBpcyBhIGNvcHkgd2hlbiB0aGUgcmFuZ2VcbiAgICogc3BhbnMgYnVmZmVyIGxheWVycywgYW5kIGEgdmlldyBpbnRvIHRoZSBsYXllciBvdGhlcndpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBidWZmZXJVc2UgLSBUaGUgYnVmZmVyIHVzYWdlIHRvIHJlYWRcbiAgICogQHBhcmFtIGJ5dGVPZmZzZXQgLSBCeXRlIG9mZnNldCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgZmlyc3QgbGF5ZXJcbiAgICogQHBhcmFtIGNvdW50IC0gTnVtYmVyIG9mIGZsb2F0IHZhbHVlcyB0byByZWFkXG4gICAqIEByZXR1cm5zIFRoZSByZWFkIHZhbHVlcywgb3IgbnVsbCB3aGVuIHRoZSByYW5nZSBpcyBvdXRzaWRlIHRoZSBhbGxvY2F0ZWQgYnVmZmVyc1xuICAgKi9cbiAgcHVibGljIHJlYWRGbG9hdDMyQXJyYXkoYnVmZmVyVXNlOiBCdWZmZXJVc2VFbnVtLCBieXRlT2Zmc2V0OiBCeXRlLCBjb3VudDogQ291bnQpOiBGbG9hdDMyQXJyYXkgfCBudWxsIHtcbiAgICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgY291bnQgPD0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGJ1ZmZlcnMgPSB0aGlzLmdldEJ1ZmZlcnMoYnVmZmVyVXNlKTtcbiAgICBsZXQgcmVtYWluaW5nQnl0ZU9mZnNldCA9IGJ5dGVPZmZzZXQ7XG4gICAgbGV0IHdyaXR0ZW4gPSAwO1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQpO1xuXG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgY29uc3QgbGF5ZXJCeXRlTGVuZ3RoID0gYnVmZmVyLmJ5dGVMZW5ndGg7XG4gICAgICBpZiAocmVtYWluaW5nQnl0ZU9mZnNldCA+PSBsYXllckJ5dGVMZW5ndGgpIHtcbiAgICAgICAgcmVtYWluaW5nQnl0ZU9mZnNldCAtPSBsYXllckJ5dGVMZW5ndGg7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYXZhaWxhYmxlRmxvYXRzID0gTWF0aC5mbG9vcigobGF5ZXJCeXRlTGVuZ3RoIC0gcmVtYWluaW5nQnl0ZU9mZnNldCkgLyA0KTtcbiAgICAgIGNvbnN0IGZsb2F0c1RvUmVhZCA9IE1hdGgubWluKGF2YWlsYWJsZUZsb2F0cywgY291bnQgLSB3cml0dGVuKTtcbiAgICAgIGlmIChmbG9hdHNUb1JlYWQgPiAwKSB7XG4gICAgICAgIGNvbnN0IGFsaWduZWRCeXRlT2Zmc2V0ID0gTWF0aC5mbG9vcihyZW1haW5pbmdCeXRlT2Zmc2V0IC8gNCkgKiA0O1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpLCBhbGlnbmVkQnl0ZU9mZnNldCwgZmxvYXRzVG9SZWFkKTtcbiAgICAgICAgcmVzdWx0LnNldChzb3VyY2UsIHdyaXR0ZW4pO1xuICAgICAgICB3cml0dGVuICs9IGZsb2F0c1RvUmVhZDtcbiAgICAgIH1cbiAgICAgIHJlbWFpbmluZ0J5dGVPZmZzZXQgPSAwO1xuICAgICAgaWYgKHdyaXR0ZW4gPj0gY291bnQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHdyaXR0ZW4gPj0gY291bnQgPyByZXN1bHQgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaW50cyBtZW1vcnkgdXNhZ2Ugc3RhdGlzdGljcyBmb3IgYWxsIG1hbmFnZWQgYnVmZmVycyB0byB0aGUgY29uc29sZS5cbiAgICogU2hvd3MgdXNlZCBieXRlcywgdG90YWwgYnl0ZXMsIGFuZCB1c2FnZSBwZXJjZW50YWdlIGZvciBlYWNoIGJ1ZmZlciB0eXBlLlxuICAgKi9cbiAgcHVibGljIHByaW50TWVtb3J5VXNhZ2UoKSB7XG4gICAgY29uc29sZS5sb2coJ01lbW9yeSBVc2FnZSBpbiBNZW1vcnkgTWFuYWdlclxcbicpO1xuXG4gICAgY29uc3QgcHJpbnRCdWZmZXJVc2FnZSA9IChidWZmZXJVc2U6IEJ1ZmZlclVzZUVudW0pOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IGJ1ZmZlckNvdW50ID0gdGhpcy5nZXRMYXllckNvdW50T2ZUaGVCdWZmZXJVc2FnZShidWZmZXJVc2UpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBidWZmZXJDb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuZ2V0QnVmZmVyKGJ1ZmZlclVzZSwgaSk7XG4gICAgICAgIGlmIChidWZmZXIgPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIGAke2J1ZmZlclVzZS5zdHJ9ICR7aX06ICR7YnVmZmVyLnRha2VuU2l6ZUluQnl0ZX0gYnl0ZSBvZiAke2J1ZmZlci5ieXRlTGVuZ3RofSBieXRlcy4gKCR7KGJ1ZmZlci50YWtlblNpemVJbkJ5dGUgLyBidWZmZXIuYnl0ZUxlbmd0aCkgKiAxMDB9ICUpIGBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJpbnRCdWZmZXJVc2FnZShCdWZmZXJVc2UuQ1BVR2VuZXJpYyk7XG4gICAgcHJpbnRCdWZmZXJVc2FnZShCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhKTtcbiAgICBwcmludEJ1ZmZlclVzYWdlKEJ1ZmZlclVzZS5HUFVWZXJ0ZXhEYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEdW1wcyB0aGUgY29udGVudHMgb2YgYSBidWZmZXIgdG8gYSBkb3dubG9hZGFibGUgZmlsZSBmb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxuICAgKiBAcGFyYW0gYnVmZmVyVXNlIC0gVGhlIHR5cGUgb2YgYnVmZmVyIHRvIGR1bXBcbiAgICovXG4gIHB1YmxpYyBkdW1wQnVmZmVyKGJ1ZmZlclVzZTogQnVmZmVyVXNlRW51bSk6IHZvaWQge1xuICAgIGNvbnN0IGJ1ZmZlckNvdW50ID0gdGhpcy5nZXRMYXllckNvdW50T2ZUaGVCdWZmZXJVc2FnZShidWZmZXJVc2UpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVyQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5nZXRCdWZmZXIoYnVmZmVyVXNlLCBpKTtcbiAgICAgIGlmIChidWZmZXIgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIE1pc2NVdGlsLmRvd25sb2FkQXJyYXlCdWZmZXIoYnVmZmVyVXNlLnN0ciArIGksIGJ1ZmZlci5nZXRBcnJheUJ1ZmZlcigpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYWxsIGFsbG9jYXRlZCBidWZmZXJzIGFuZCBjbGVhcnMgaW50ZXJuYWwgc3RhdGUuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIGNsZWFycyBhbGwgYnVmZmVyIG1hcHMgYW5kIHJlc2V0cyB0aGUgYnVmZmVyIHVzYWdlIGNvdW50ZXJzLlxuICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB0aGUgTWVtb3J5TWFuYWdlciBzaG91bGQgbm90IGJlIHVzZWQuXG4gICAqL1xuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAvLyBDbGVhciBhbGwgYnVmZmVyc1xuICAgIHRoaXMuX19idWZmZXJzLmNsZWFyKCk7XG5cbiAgICAvLyBSZXNldCBhbGwgYnVmZmVyIHVzYWdlIGNvdW50c1xuICAgIHRoaXMuX19jb3VudE9mVGhlQnVmZmVyVXNhZ2VNYXAuY2xlYXIoKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNB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SyxPQUFPLGVBQWUsWUFBWSxPQUFPLFVBQVUsWUFBYSxPQUFPLGtCQUFrQixPQUFPLGFBQWMsR0FBRztBQUFBLFFBQzdJO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxxQkFBaUIsVUFBVSxVQUFVO0FBQ3JDLHFCQUFpQixVQUFVLGVBQWU7QUFDMUMscUJBQWlCLFVBQVUsYUFBYTtBQUFBLEVBQzFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1PLFdBQVcsV0FBZ0M7QUFDaEQsVUFBTSxjQUFjLEtBQUssOEJBQThCLFNBQVM7QUFDaEUsYUFBUyxJQUFJLEdBQUcsSUFBSSxhQUFhLEtBQUs7QUFDcEMsWUFBTSxTQUFTLEtBQUssVUFBVSxXQUFXLENBQUM7QUFDMUMsVUFBSSxVQUFVLE1BQU07QUFDbEI7QUFBQSxNQUNGO0FBQ0EsZUFBUyxvQkFBb0IsVUFBVSxNQUFNLEdBQUcsT0FBTyxlQUFlLENBQUM7QUFBQSxJQUN6RTtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU08sVUFBZ0I7QUFFckIsU0FBS0QsR0FBVSxNQUFNO0FBR3JCLFNBQUtDLEdBQTJCLE1BQU07QUFBQSxFQUN4QztBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2J1ZmZlcnMiLCAiX19jb3VudE9mVGhlQnVmZmVyVXNhZ2VNYXAiLCAiX19tYXhHUFVEYXRhU3RvcmFnZVNpemUiLCAiX19idWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVWZXJ0ZXhEYXRhVXNhZ2UiLCAiX19lbmdpbmUiLCAiX19idWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVJbnN0YW5jZURhdGFVc2FnZSIsICJfX21ha2VNdWx0aXBsZU9mNGJ5dGVTaXplIiwgIl9fY3JlYXRlQnVmZmVyIl0KfQo=
