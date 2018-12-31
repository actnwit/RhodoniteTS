import Buffer from '../memory/Buffer';
import { BufferUse, BufferUseEnum } from '../definitions/BufferUse';

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
  private __buffers: {[s: string]: Buffer} = {};
  private static __bufferLengthOfOneSide: Size = Math.pow(2,10);

  private constructor() {

    // BufferForGPUInstanceData
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.GPUInstanceData.toString()});
      this.__buffers[buffer.name] = buffer;
    }

    // BufferForGPUVertexData
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.GPUVertexData.toString()});
      this.__buffers[buffer.name] = buffer;
    }

    // BufferForUBO
    {
      const arrayBuffer = new ArrayBuffer((MemoryManager.bufferLengthOfOneSide-1)*(MemoryManager.bufferLengthOfOneSide-1)/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.UBOGeneric.toString()});
      this.__buffers[buffer.name] = buffer;
    }

    // BufferForCPU
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: BufferUse.CPUGeneric.toString()});
      this.__buffers[buffer.name] = buffer;
    }

  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new MemoryManager();
    }
    return this.__instance;
  }

  getBuffer(bufferUse: BufferUseEnum): Buffer {
    return this.__buffers[bufferUse.toString()];
  }

  static get bufferLengthOfOneSide(): Size {
    return MemoryManager.__bufferLengthOfOneSide;
  }
}
