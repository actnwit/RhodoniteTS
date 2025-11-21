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
  private __memorySizeRatios: { [s: string]: number } = {};
  private __countOfTheBufferUsageMap: Map<BufferUseEnum, Count> = new Map();
  private __maxGPUDataStorageSize: Byte = 0;
  private __gpuBufferUnitCount: Count = 0;

  /**
   * Private constructor to ensure singleton pattern.
   * Initializes memory size ratios for different buffer types.
   * @param cpuGeneric - Memory size ratio for CPU generic data
   * @param gpuInstanceData - Memory size ratio for GPU instance data
   * @param gpuVertexData - Memory size ratio for GPU vertex data
   */
  private constructor(maxGPUDataStorageSize: Byte, cpuGeneric: Ratio, gpuInstanceData: Ratio, gpuVertexData: Ratio) {
    this.__maxGPUDataStorageSize = maxGPUDataStorageSize;
    this.__gpuBufferUnitCount = Math.floor(maxGPUDataStorageSize / Config.gpuBufferUnitSizeInByte);
    this.__memorySizeRatios[BufferUse.CPUGeneric.str] = cpuGeneric;
    this.__memorySizeRatios[BufferUse.GPUInstanceData.str] = gpuInstanceData;
    this.__memorySizeRatios[BufferUse.GPUVertexData.str] = gpuVertexData;
  }

  /**
   * Creates a MemoryManager instance if it doesn't exist, or returns the existing instance.
   * This method enforces the singleton pattern.
   * @param config - Configuration object containing memory size ratios
   * @param config.cpuGeneric - Memory size ratio for CPU generic data
   * @param config.gpuInstanceData - Memory size ratio for GPU instance data
   * @param config.gpuVertexData - Memory size ratio for GPU vertex data
   * @returns The MemoryManager singleton instance
   */
  static createInstanceIfNotCreated({
    maxGPUDataStorageSize,
    cpuGeneric,
    gpuInstanceData,
    gpuVertexData,
  }: {
    maxGPUDataStorageSize: Byte;
    cpuGeneric: Ratio;
    gpuInstanceData: Ratio;
    gpuVertexData: Ratio;
  }) {
    if (!this.__instance) {
      this.__instance = new MemoryManager(maxGPUDataStorageSize, cpuGeneric, gpuInstanceData, gpuVertexData);
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
    const memorySize = Config.gpuBufferUnitSizeInByte;
    const arrayBuffer = new ArrayBuffer(memorySize);

    let byteAlign = 4;
    if (bufferUse === BufferUse.GPUInstanceData || bufferUse === BufferUse.GPUVertexData) {
      byteAlign = 16;
    }

    const count = this.getLayerCountOfTheBufferUsage(bufferUse);
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

  getActiveBufferLayerIndexOfTheBufferUsage(bufferUse: BufferUseEnum): Index {
    return this.getLayerCountOfTheBufferUsage(bufferUse) - 1;
  }

  getLayerCountOfTheBufferUsage(bufferUse: BufferUseEnum): Count {
    const count = this.__countOfTheBufferUsageMap.get(bufferUse);
    if (count != null) {
      return count;
    }

    this.__countOfTheBufferUsageMap.set(bufferUse, 0);

    return 0;
  }

  incrementCountOfTheBufferUsage(bufferUse: BufferUseEnum): void {
    const count = this.__countOfTheBufferUsageMap.get(bufferUse);
    if (count == null) {
      this.__countOfTheBufferUsageMap.set(bufferUse, 1);
      return;
    }

    this.__countOfTheBufferUsageMap.set(bufferUse, count + 1);
  }

  // getSizesOfTheBuffers(bufferUse: BufferUseEnum): Byte[] {
  // }
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
