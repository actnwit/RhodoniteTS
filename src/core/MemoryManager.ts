import Buffer from '../memory/Buffer';

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
  private __buffers: Map<ObjectUID, Buffer> = new Map();
  private __bufferForGPU: Buffer;
  private __bufferForCPU: Buffer;
  private static __bufferLengthOfOneSide: Size = Math.pow(2,9);

  private constructor() {

    // BufferForGPU
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: 'BufferForGPU'});
      this.__buffers.set(buffer.objectUid, buffer);
      this.__bufferForGPU = buffer;
    }

    // BufferForCPU
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: 'BufferForCPU'});
      this.__buffers.set(buffer.objectUid, buffer);
      this.__bufferForCPU = buffer;
    }

  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new MemoryManager();
    }
    return this.__instance;
  }

  getBufferForGPU(): Buffer {
    return this.__bufferForGPU;
  }
  getBufferForCPU(): Buffer {
    return this.__bufferForCPU;
  }

  static get bufferLengthOfOneSide(): Size {
    return MemoryManager.__bufferLengthOfOneSide;
  }
}
