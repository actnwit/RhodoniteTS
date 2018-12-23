import Buffer from '../memory/Buffer';

/**
 * Usage
 * const mm = MemoryManager.getInstance();
 * this.translate = new Vector3(
 *   mm.assignMem(componentUID, propetyId, entityUID, isRendered)
 * );
 */
const singleton = Symbol();

export default class MemoryManager {
  private static __singletonEnforcer: Symbol = Symbol();
  //__entityMaxCount: number;
  private __buffers: Map<ObjectUID, Buffer> = new Map();
  private __bufferForGPU: Buffer;
  private __bufferForCPU: Buffer;
  private __bufferLengthOfOneSide: Size = Math.pow(2,11);

  private constructor(enforcer: Symbol) {
    const thisClass = MemoryManager;
    if (enforcer !== thisClass.__singletonEnforcer || !(this instanceof MemoryManager)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    // BufferForGPU
    {
      const arrayBuffer = new ArrayBuffer(this.__bufferLengthOfOneSide*this.__bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: 'BufferForGPU'});
      this.__buffers.set(buffer.objectUid, buffer);
      this.__bufferForGPU = buffer;
    }

    // BufferForCPU
    {
      const arrayBuffer = new ArrayBuffer(this.__bufferLengthOfOneSide*this.__bufferLengthOfOneSide/*width*height*/*4/*rgba*/*8/*byte*/);
      const buffer = new Buffer({
        byteLength:arrayBuffer.byteLength,
        arrayBuffer: arrayBuffer,
        name: 'BufferForCPU'});
      this.__buffers.set(buffer.objectUid, buffer);
      this.__bufferForCPU = buffer;
    }

  }

  static getInstance() {
    const thisClass = MemoryManager;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new MemoryManager(thisClass.__singletonEnforcer);
    }
    return (thisClass as any)[singleton];
  }

  getBufferForGPU(): Buffer {
    return this.__bufferForGPU;
  }
  getBufferForCPU(): Buffer {
    return this.__bufferForCPU;
  }

  get bufferLengthOfOneSide(): Size {
    return this.__bufferLengthOfOneSide;
  }
}
