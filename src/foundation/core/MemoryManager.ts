import type { Byte, ObjectUID, Size } from '../../types/CommonTypes';
import { BufferUse, type BufferUseEnum } from '../definitions/BufferUse';
import { Buffer } from '../memory/Buffer';
import { MiscUtil } from '../misc/MiscUtil';
import { Config } from './Config';
import type { RnObject } from './RnObject';

/**
 * MemoryManager is a singleton class that manages the memory allocation and buffers for the Rhodonite library.
 * It handles different types of buffers including CPU generic data, GPU instance data, and GPU vertex data.
 */
export class MemoryManager {
  private static __instance: MemoryManager;
  //__entityMaxCount: number;
  private __buffers: { [s: string]: Buffer } = {};
  private __buffersOnDemand: Map<ObjectUID, Buffer> = new Map();
  private __memorySizeRatios: { [s: string]: number } = {};

  /**
   * Private constructor to ensure singleton pattern.
   * Initializes memory size ratios for different buffer types.
   * @param cpuGeneric - Memory size ratio for CPU generic data
   * @param gpuInstanceData - Memory size ratio for GPU instance data
   * @param gpuVertexData - Memory size ratio for GPU vertex data
   */
  private constructor(cpuGeneric: number, gpuInstanceData: number, gpuVertexData: number) {
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
    cpuGeneric,
    gpuInstanceData,
    gpuVertexData,
  }: {
    cpuGeneric: number;
    gpuInstanceData: number;
    gpuVertexData: number;
  }) {
    if (!this.__instance) {
      this.__instance = new MemoryManager(cpuGeneric, gpuInstanceData, gpuVertexData);
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
  getMemorySize() {
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
    const memorySize = this.getMemorySize() * this.__memorySizeRatios[bufferUse.str];
    const arrayBuffer = new ArrayBuffer(this.__makeMultipleOf4byteSize(memorySize));

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
      indexOfTheBufferUsage: 0,
    });
    this.__buffers[buffer.name] = buffer;

    return buffer;
  }

  /**
   * Retrieves an existing buffer for the specified buffer use type.
   * @param bufferUse - The type of buffer to retrieve
   * @returns The Buffer instance if it exists, undefined otherwise
   */
  public getBuffer(bufferUse: BufferUseEnum): Buffer | undefined {
    const buffer = this.__buffers[bufferUse.toString()];
    return buffer;
  }

  /**
   * Gets an existing buffer or creates a new one if it doesn't exist.
   * @param bufferUse - The type of buffer to retrieve or create
   * @returns The Buffer instance (existing or newly created)
   */
  public createOrGetBuffer(bufferUse: BufferUseEnum): Buffer {
    let buffer = this.__buffers[bufferUse.toString()];
    if (buffer == null) {
      buffer = this.__createBuffer(bufferUse);
    }
    return buffer;
  }

  /**
   * Creates a buffer on-demand with custom size and alignment for a specific object.
   * @param size - The size of the buffer in bytes
   * @param object - The RnObject that will own this buffer
   * @param byteAlign - The byte alignment requirement for the buffer
   * @returns The newly created Buffer instance
   */
  public createBufferOnDemand(size: Byte, object: RnObject, byteAlign: Byte) {
    const arrayBuffer = new ArrayBuffer(size);
    const buffer = new Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: BufferUse.CPUGeneric.toString(),
      byteAlign: byteAlign,
      bufferUsage: BufferUse.CPUGeneric,
      indexOfTheBufferUsage: 0,
    });
    this.__buffersOnDemand.set(object.objectUID, buffer);
    return buffer;
  }

  /**
   * Retrieves an on-demand buffer associated with a specific object.
   * @param object - The RnObject whose buffer to retrieve
   * @returns The Buffer instance if it exists, undefined otherwise
   */
  public getBufferOnDemand(object: RnObject) {
    return this.__buffersOnDemand.get(object.objectUID);
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
    const cpuGeneric = this.__buffers[BufferUse.CPUGeneric.toString()];
    const gpuInstanceData = this.__buffers[BufferUse.GPUInstanceData.toString()];
    const gpuVertexData = this.__buffers[BufferUse.GPUVertexData.toString()];
    // const uboGeneric = this.__buffers[BufferUse.UBOGeneric.toString()];

    console.log('Memory Usage in Memory Manager:');
    console.log(
      `CPUGeneric: ${cpuGeneric.takenSizeInByte} byte of ${cpuGeneric.byteLength} bytes. (${
        (cpuGeneric.takenSizeInByte / cpuGeneric.byteLength) * 100
      } %) `
    );
    console.log(
      `GPUInstanceData: ${gpuInstanceData.takenSizeInByte} byte of ${
        gpuInstanceData.byteLength
      } bytes. (${(gpuInstanceData.takenSizeInByte / gpuInstanceData.byteLength) * 100} %) `
    );
    if (gpuVertexData != null) {
      console.log(
        `GPUVertexData: ${gpuVertexData.takenSizeInByte} byte of ${
          gpuVertexData.byteLength
        } bytes. (${(gpuVertexData.takenSizeInByte / gpuVertexData.byteLength) * 100} %) `
      );
    }
    // console.log(`UBOGeneric: ${uboGeneric.takenSizeInByte} byte of ${uboGeneric.byteLength} bytes. (${uboGeneric.takenSizeInByte / uboGeneric.byteLength * 100} %) `);
  }

  /**
   * Dumps the contents of a buffer to a downloadable file for debugging purposes.
   * @param bufferUse - The type of buffer to dump
   * @returns The Buffer instance that was dumped, or undefined if the buffer doesn't exist
   */
  public dumpBuffer(bufferUse: BufferUseEnum): Buffer | undefined {
    const buffer = this.__buffers[bufferUse.toString()];

    MiscUtil.downloadArrayBuffer(bufferUse.toString(), buffer.getArrayBuffer());
    return buffer;
  }
}
