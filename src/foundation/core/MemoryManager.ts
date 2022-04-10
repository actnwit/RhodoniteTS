import { Buffer } from '../memory/Buffer';
import {BufferUse, BufferUseEnum} from '../definitions/BufferUse';
import {Size, Byte, ObjectUID} from '../../types/CommonTypes';
import Config from './Config';
import { RnObject } from './RnObject';
import {MiscUtil} from '../misc/MiscUtil';

/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propertyId, entityUID, isRendered)
 * );
 */
export class MemoryManager {
  private static __instance: MemoryManager;
  //__entityMaxCount: number;
  private __buffers: {[s: string]: Buffer} = {};
  private __buffersOnDemand: Map<ObjectUID, Buffer> = new Map();
  private __memorySizeRatios: {[s: string]: number} = {};

  private constructor(
    cpuGeneric: number,
    gpuInstanceData: number,
    gpuVertexData: number
  ) {
    this.__memorySizeRatios[BufferUse.CPUGeneric.str] = cpuGeneric;
    this.__memorySizeRatios[BufferUse.GPUInstanceData.str] = gpuInstanceData;
    this.__memorySizeRatios[BufferUse.GPUVertexData.str] = gpuVertexData;
  }

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
      this.__instance = new MemoryManager(
        cpuGeneric,
        gpuInstanceData,
        gpuVertexData
      );
      return this.__instance;
    }
    return this.__instance;
  }

  private __makeMultipleOf4byteSize(memorySize: number) {
    return memorySize + (memorySize % 4 === 0 ? 0 : 4 - (memorySize % 4));
  }

  static getInstance() {
    return this.__instance;
  }

  private __createBuffer(bufferUse: BufferUseEnum) {
    const memorySize =
      MemoryManager.bufferWidthLength *
      MemoryManager.bufferHeightLength /*width*height*/ *
      4 /*rgba*/ *
      4 /*byte*/ *
      this.__memorySizeRatios[bufferUse.str];
    const arrayBuffer = new ArrayBuffer(
      this.__makeMultipleOf4byteSize(memorySize)
    );

    let byteAlign = 4;
    if (
      bufferUse === BufferUse.GPUInstanceData ||
      bufferUse === BufferUse.GPUVertexData
    ) {
      byteAlign = 16;
    }

    const buffer = new Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: bufferUse.str,
      byteAlign: byteAlign,
    });
    this.__buffers[buffer.name] = buffer;

    return buffer;
  }

  getBuffer(bufferUse: BufferUseEnum): Buffer | undefined {
    const buffer = this.__buffers[bufferUse.toString()];
    return buffer;
  }

  createOrGetBuffer(bufferUse: BufferUseEnum): Buffer {
    let buffer = this.__buffers[bufferUse.toString()];
    if (buffer == null) {
      buffer = this.__createBuffer(bufferUse);
    }
    return buffer;
  }

  createBufferOnDemand(size: Byte, object: RnObject, byteAlign: Byte) {
    const arrayBuffer = new ArrayBuffer(size);
    const buffer = new Buffer({
      byteLength: arrayBuffer.byteLength,
      buffer: arrayBuffer,
      name: BufferUse.UBOGeneric.toString(),
      byteAlign: byteAlign,
    });
    this.__buffersOnDemand.set(object.objectUID, buffer);
    return buffer;
  }

  getBufferOnDemand(object: RnObject) {
    return this.__buffersOnDemand.get(object.objectUID);
  }

  static get bufferWidthLength(): Size {
    return Config.dataTextureWidth;
  }

  static get bufferHeightLength(): Size {
    return Config.dataTextureHeight;
  }

  printMemoryUsage() {
    const cpuGeneric = this.__buffers[BufferUse.CPUGeneric.toString()];
    const gpuInstanceData =
      this.__buffers[BufferUse.GPUInstanceData.toString()];
    const gpuVertexData = this.__buffers[BufferUse.GPUVertexData.toString()];
    // const uboGeneric = this.__buffers[BufferUse.UBOGeneric.toString()];

    console.log('Memory Usage in Memory Manager:');
    console.log(
      `CPUGeneric: ${cpuGeneric.takenSizeInByte} byte of ${
        cpuGeneric.byteLength
      } bytes. (${
        (cpuGeneric.takenSizeInByte / cpuGeneric.byteLength) * 100
      } %) `
    );
    console.log(
      `GPUInstanceData: ${gpuInstanceData.takenSizeInByte} byte of ${
        gpuInstanceData.byteLength
      } bytes. (${
        (gpuInstanceData.takenSizeInByte / gpuInstanceData.byteLength) * 100
      } %) `
    );
    if (gpuVertexData != null) {
      console.log(
        `GPUVertexData: ${gpuVertexData.takenSizeInByte} byte of ${
          gpuVertexData.byteLength
        } bytes. (${
          (gpuVertexData.takenSizeInByte / gpuVertexData.byteLength) * 100
        } %) `
      );
    }
    // console.log(`UBOGeneric: ${uboGeneric.takenSizeInByte} byte of ${uboGeneric.byteLength} bytes. (${uboGeneric.takenSizeInByte / uboGeneric.byteLength * 100} %) `);
  }

  dumpBuffer(bufferUse: BufferUseEnum): Buffer | undefined {
    const buffer = this.__buffers[bufferUse.toString()];

    MiscUtil.downloadArrayBuffer(bufferUse.toString(), buffer.getArrayBuffer());
    return buffer;
  }
}
