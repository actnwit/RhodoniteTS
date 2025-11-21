import type { Byte, Count, Index, ObjectUID, Ratio, Size } from '../../types/CommonTypes';
import { BufferUse, type BufferUseEnum } from '../definitions/BufferUse';
import { Buffer } from '../memory/Buffer';
import { MiscUtil } from '../misc/MiscUtil';
import { Config } from './Config';

/**
 * MemoryManager is a singleton class that manages the memory allocation and buffers for the Rhodonite library.
 * It handles different types of buffers including CPU generic data, GPU instance data, and GPU vertex data.
 */

type IndexOfBufferLayer = Index;
export class MemoryManager {
  private static __instance: MemoryManager;
  //__entityMaxCount: number;
  private __buffers: Map<BufferUseEnum, Map<IndexOfBufferLayer, Buffer>> = new Map();
  private __countOfTheBufferUsageMap: Map<BufferUseEnum, Count> = new Map();
  private __maxGPUDataStorageSize: Byte = 0;
  private __bufferSizeDivisionRatiosForGPUInstanceDataUsage = [1 / 16, 3 / 16, 8 / 16];
  private __bufferSizeDivisionRatiosForGPUVertexDataUsage = [4 / 16];

  /**
   * Private constructor to ensure singleton pattern.
   * Initializes memory size ratios for different buffer types.
   * @param maxGPUDataStorageSize - The maximum GPU data storage size in bytes
   */
  private constructor(maxGPUDataStorageSize: Byte) {
    this.__maxGPUDataStorageSize = maxGPUDataStorageSize;
  }

  /**
   * Creates a MemoryManager instance if it doesn't exist, or returns the existing instance.
   * This method enforces the singleton pattern.
   * @param maxGPUDataStorageSize - The maximum GPU data storage size in bytes
   * @returns The MemoryManager singleton instance
   */
  static createInstanceIfNotCreated(maxGPUDataStorageSize: Byte) {
    if (!this.__instance) {
      this.__instance = new MemoryManager(maxGPUDataStorageSize);
      return this.__instance;
    }
    return this.__instance;
  }

  /**
   * Ensures the memory size is a multiple of 4 bytes for proper alignment.
   * @param memorySize - The original memory size in bytes
   * @returns The adjusted memory size that is a multiple of 4 bytes
   */
  private __makeMultipleOf4byteSize(memorySize: number) {
    return memorySize + (memorySize % 4 === 0 ? 0 : 4 - (memorySize % 4));
  }

  /**
   * Gets the singleton instance of MemoryManager.
   * @returns The MemoryManager instance
   * @throws Error if the instance has not been created yet
   */
  static getInstance() {
    return this.__instance;
  }

  /**
   * Calculates the total memory size based on buffer dimensions and data format.
   * @returns The total memory size in bytes (width × height × 4 channels × 4 bytes per channel)
   */
  static getMemorySize() {
    return (
      MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength /*width*height*/ * 4 /*rgba*/ * 4 /*byte*/
    );
  }

  /**
   * Creates a new buffer for the specified buffer use type.
   * Sets appropriate byte alignment based on buffer type (4 bytes for CPU, 16 bytes for GPU).
   * @param bufferUse - The type of buffer to create
   * @returns The newly created Buffer instance
   */
  private __createBuffer(bufferUse: BufferUseEnum) {
    const count = this.getLayerCountOfTheBufferUsage(bufferUse);
    let rawMemorySize = (this.__maxGPUDataStorageSize * 1) / 16;
    if (bufferUse === BufferUse.GPUInstanceData) {
      rawMemorySize = this.__maxGPUDataStorageSize * this.__bufferSizeDivisionRatiosForGPUInstanceDataUsage[count];
    } else if (bufferUse === BufferUse.GPUVertexData) {
      rawMemorySize = this.__maxGPUDataStorageSize * this.__bufferSizeDivisionRatiosForGPUVertexDataUsage[count];
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
      byteAlign: byteAlign,
      bufferUsage: bufferUse,
      indexOfTheBufferUsage: count,
    });

    // add the buffer to the buffer map
    let bufferMap = this.__buffers.get(bufferUse);
    if (bufferMap == null) {
      bufferMap = new Map();
      this.__buffers.set(bufferUse, bufferMap);
    }
    bufferMap.set(count, buffer);

    // increment the count of the buffer usage
    this.incrementCountOfTheBufferUsage(bufferUse);

    return buffer;
  }

  /**
   * Retrieves an existing buffer for the specified buffer use type.
   * @param bufferUse - The type of buffer to retrieve
   * @returns The Buffer instance if it exists, undefined otherwise
   */
  public getBuffer(bufferUse: BufferUseEnum, indexOfTheBufferLayer?: Index): Buffer | undefined {
    const bufferMap = this.__buffers.get(bufferUse);
    if (bufferMap == null) {
      return undefined;
    }
    const count = indexOfTheBufferLayer ?? this.getActiveBufferLayerIndexOfTheBufferUsage(bufferUse);
    return bufferMap.get(count);
  }

  /**
   * Gets an existing buffer or creates a new one if it doesn't exist.
   * @param bufferUse - The type of buffer to retrieve or create
   * @returns The Buffer instance (existing or newly created)
   */
  public createOrGetBuffer(bufferUse: BufferUseEnum, addNewLayer = false): Buffer {
    if (addNewLayer) {
      return this.__createBuffer(bufferUse);
    }
    let buffer = this.getBuffer(bufferUse);
    return buffer ?? this.__createBuffer(bufferUse);
  }

  /**
   * Creates a buffer on-demand with custom size and alignment for a specific object.
   * @param bufferUse - The type of buffer to create
   * @param size - The size of the buffer in bytes
   * @param byteAlign - The byte alignment requirement for the buffer
   * @returns The newly created Buffer instance
   */
  public createBufferOnDemand(bufferUse: BufferUseEnum, size: Byte, byteAlign: Byte) {
    const arrayBuffer = new ArrayBuffer(size);
    const count = this.getLayerCountOfTheBufferUsage(bufferUse);
    const buffer = new Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: bufferUse.toString(),
      byteAlign: byteAlign,
      bufferUsage: bufferUse,
      indexOfTheBufferUsage: count,
    });
    this.incrementCountOfTheBufferUsage(bufferUse);
    return buffer;
  }

  /**
   * Gets the index of the active buffer layer for the specified buffer use type.
   * @param bufferUse - The type of buffer to get the active layer index of
   * @returns The index of the active buffer layer
   */
  getActiveBufferLayerIndexOfTheBufferUsage(bufferUse: BufferUseEnum): Index {
    return this.getLayerCountOfTheBufferUsage(bufferUse) - 1;
  }

  /**
   * Gets the count of the buffer layers for the specified buffer use type.
   * @param bufferUse - The type of buffer to get the count of layers of
   * @returns The count of the buffer layers
   */
  getLayerCountOfTheBufferUsage(bufferUse: BufferUseEnum): Count {
    const count = this.__countOfTheBufferUsageMap.get(bufferUse);
    if (count != null) {
      return count;
    }

    this.__countOfTheBufferUsageMap.set(bufferUse, 0);

    return 0;
  }

  /**
   * Increments the count of the buffer layers for the specified buffer use type.
   * @param bufferUse - The type of buffer to increment the count of layers of
   */
  incrementCountOfTheBufferUsage(bufferUse: BufferUseEnum): void {
    const count = this.__countOfTheBufferUsageMap.get(bufferUse);
    if (count == null) {
      this.__countOfTheBufferUsageMap.set(bufferUse, 1);
      return;
    }

    this.__countOfTheBufferUsageMap.set(bufferUse, count + 1);
  }

  /**
   * Gets the sizes of the buffers for the specified buffer use type.
   * @param bufferUse - The type of buffer to get the sizes of
   * @returns The sizes of the buffers in bytes
   */
  getSizesOfTheBuffers(bufferUse: BufferUseEnum): Byte[] {
    const sizes: Byte[] = [];
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

  /**
   * Gets the byte offset of the existing buffers for the specified buffer use type and index of the buffer layer.
   * @param bufferUse - The type of buffer to get the byte offset of
   * @param indexOfTheBufferLayer - The index of the buffer layer to get the byte offset of
   * @returns The byte offset of the existing buffers in bytes
   */
  getByteOffsetOfExistingBuffers(bufferUse: BufferUseEnum, indexOfTheBufferLayer: Index): Byte {
    const sizesOfTheBuffers = this.getSizesOfTheBuffers(bufferUse).slice(0, indexOfTheBufferLayer);
    const byteOffsetOfExistingBuffers = sizesOfTheBuffers.reduce((acc, size) => acc + size, 0);
    return byteOffsetOfExistingBuffers;
  }

  /**
   * Gets the buffer width length from the configuration.
   * @returns The data texture width from Config
   */
  static get bufferWidthLength(): Size {
    return Config.dataTextureWidth;
  }

  /**
   * Gets the buffer height length from the configuration.
   * @returns The data texture height from Config
   */
  static get bufferHeightLength(): Size {
    return Config.dataTextureHeight;
  }

  /**
   * Prints memory usage statistics for all managed buffers to the console.
   * Shows used bytes, total bytes, and usage percentage for each buffer type.
   */
  public printMemoryUsage() {
    console.log('Memory Usage in Memory Manager\n');

    const printBufferUsage = (bufferUse: BufferUseEnum): void => {
      const bufferCount = this.getLayerCountOfTheBufferUsage(bufferUse);
      for (let i = 0; i < bufferCount; i++) {
        const buffer = this.getBuffer(bufferUse, i);
        if (buffer == null) {
          continue;
        }
        console.log(
          `${bufferUse.str} ${i}: ${buffer.takenSizeInByte} byte of ${buffer.byteLength} bytes. (${(buffer.takenSizeInByte / buffer.byteLength) * 100} %) `
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
  public dumpBuffer(bufferUse: BufferUseEnum): void {
    const bufferCount = this.getLayerCountOfTheBufferUsage(bufferUse);
    for (let i = 0; i < bufferCount; i++) {
      const buffer = this.getBuffer(bufferUse, i);
      if (buffer == null) {
        continue;
      }
      MiscUtil.downloadArrayBuffer(bufferUse.str + i, buffer.getArrayBuffer());
    }
  }
}
