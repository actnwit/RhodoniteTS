import Buffer from '../memory/Buffer';
import { BufferUse, BufferUseEnum } from '../definitions/BufferUse';
import { Size } from '../../types/CommonTypes';

/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propetyId, entityUID, isRendered)
 * );
 */

export default class MemoryManager {
  private static __instance: MemoryManager;
  //__entityMaxCount: number;
  private __buffers: { [s: string]: Buffer } = {};
  private static __bufferWidthLength: Size = Math.pow(2, 12);
  private static __bufferHeightLength: Size = Math.pow(2, 12);

  private constructor(cpuGeneric: number, gpuInstanceData: number, gpuVertexData: number, UBOGeneric: number) {
    // BufferForCPU
    {

      let memorySize = MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength/*width*height*/ * 4/*rgba*/ * 8/*byte*/ * cpuGeneric;
      const arrayBuffer = new ArrayBuffer(this.__makeMultipleOf4byteSize(memorySize));
      const buffer = new Buffer({
        byteLength: arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.CPUGeneric.toString()
      });
      this.__buffers[buffer.name] = buffer;
    }

    // BufferForGPUInstanceData
    {
      let memorySize = MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength/*width*height*/ * 4/*rgba*/ * 8/*byte*/ * gpuInstanceData;
      const arrayBuffer = new ArrayBuffer(this.__makeMultipleOf4byteSize(memorySize));
      const buffer = new Buffer({
        byteLength: arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.GPUInstanceData.toString()
      });
      this.__buffers[buffer.name] = buffer;
    }

    // BufferForGPUVertexData
    {
      let memorySize = MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength/*width*height*/ * 4/*rgba*/ * 8/*byte*/ * gpuVertexData;
      const arrayBuffer = new ArrayBuffer(this.__makeMultipleOf4byteSize(memorySize));
      const buffer = new Buffer({
        byteLength: arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.GPUVertexData.toString()
      });
      this.__buffers[buffer.name] = buffer;
    }

    // BufferForUBO
    {
      let memorySize = MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength/*width*height*/ * 4/*rgba*/ * 8/*byte*/ * UBOGeneric;
      const arrayBuffer = new ArrayBuffer(this.__makeMultipleOf4byteSize(memorySize));
      const buffer = new Buffer({
        byteLength: arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.UBOGeneric.toString()
      });
      this.__buffers[buffer.name] = buffer;
    }

  }

  static createInstanceIfNotCreated(cpuGeneric: number, gpuInstanceData: number, gpuVertexData: number, UBOGeneric: number) {
    if (!this.__instance) {
      this.__instance = new MemoryManager(cpuGeneric, gpuInstanceData, gpuVertexData, UBOGeneric);
      return this.__instance;
    }
    return this.__instance;
  }

  private __makeMultipleOf4byteSize(memorySize: number) {
    return memorySize + 4 - memorySize % 4;
  }

  static getInstance() {
    return this.__instance;
  }

  getBuffer(bufferUse: BufferUseEnum): Buffer {
    return this.__buffers[bufferUse.toString()];
  }

  static get bufferWidthLength(): Size {
    return MemoryManager.__bufferWidthLength;
  }

  static get bufferHeightLength(): Size {
    return MemoryManager.__bufferHeightLength;
  }

  printMemoryUsage() {
    const cpuGeneric = this.__buffers[BufferUse.CPUGeneric.toString()];
    const gpuInstanceData = this.__buffers[BufferUse.GPUInstanceData.toString()];
    const gpuVertexData = this.__buffers[BufferUse.GPUVertexData.toString()];
    const uboGeneric = this.__buffers[BufferUse.UBOGeneric.toString()];

    console.log(`Memory Usage in Memory Manager:`);
    console.log(`CPUGeneric: ${cpuGeneric.takenSizeInByte} byte of ${cpuGeneric.byteLength} bytes. (${cpuGeneric.takenSizeInByte/cpuGeneric.byteLength * 100} %) `);
    console.log(`GPUInstanceData: ${gpuInstanceData.takenSizeInByte} byte of ${gpuInstanceData.byteLength} bytes. (${gpuInstanceData.takenSizeInByte/gpuInstanceData.byteLength * 100} %) `);
    console.log(`GPUVertexData: ${gpuVertexData.takenSizeInByte} byte of ${gpuVertexData.byteLength} bytes. (${gpuVertexData.takenSizeInByte/gpuVertexData.byteLength * 100} %) `);
    console.log(`UBOGeneric: ${uboGeneric.takenSizeInByte} byte of ${uboGeneric.byteLength} bytes. (${uboGeneric.takenSizeInByte/uboGeneric.byteLength * 100} %) `);
  }

}
