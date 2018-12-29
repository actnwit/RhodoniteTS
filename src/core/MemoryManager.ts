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
  private __bufferForGPUInstanceData: Buffer;
  private __bufferForGPUVertexData: Buffer;
  private __bufferForCPU: Buffer;
  private static __bufferLengthOfOneSide: Size = Math.pow(2,10);

  private constructor() {

    // BufferForGPUInstanceData
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: 'BufferForGPUInstanceData'});
      this.__buffers.set(buffer.objectUid, buffer);
      this.__bufferForGPUInstanceData = buffer;
    }

    // BufferForGPUVertexData
    {
      const arrayBuffer = new ArrayBuffer(MemoryManager.bufferLengthOfOneSide*MemoryManager.bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: 'BufferForGPUVertexData'});
      this.__buffers.set(buffer.objectUid, buffer);
      this.__bufferForGPUVertexData = buffer;
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

  getBufferForGPUInstanceData(): Buffer {
    return this.__bufferForGPUInstanceData;
  }

  getBufferForGPUVertexData(): Buffer {
    return this.__bufferForGPUVertexData;
  }

  getBufferForCPU(): Buffer {
    return this.__bufferForCPU;
  }

  static get bufferLengthOfOneSide(): Size {
    return MemoryManager.__bufferLengthOfOneSide;
  }
}
