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
  private __renderingMemoryPool: Float64Array;
  private static __singletonEnforcer: Symbol = Symbol();
  //__entityMaxCount: number;
  private __buffers: Map<ObjectUID, Buffer> = new Map();
  private __bufferForGPU: Buffer;

  private constructor(enforcer: Symbol) {
    const thisClass = MemoryManager;
    if (enforcer !== thisClass.__singletonEnforcer || !(this instanceof MemoryManager)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    const arrayBuffer = new ArrayBuffer((2^12)*(2^12)/*width*height*/*4/*rgba*/*8/*byte*/);
    const buffer = new Buffer({
      byteLength:arrayBuffer.byteLength,
      arrayBuffer: arrayBuffer,
      name: 'BufferForGPU'});
    this.__buffers.set(buffer.objectUid, buffer);
    this.__bufferForGPU = buffer;
    this.__renderingMemoryPool = new Float64Array(67108864); //(2^12)*(2^12)*4(rgba)
    //this.__entityMaxCount = 1000000;
  }

  static getInstance() {
    const thisClass = MemoryManager;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new MemoryManager(thisClass.__singletonEnforcer);
    }
    return (thisClass as any)[singleton];
  }

  allocate(begin: number, size: number): Float64Array {
    return this.__renderingMemoryPool.subarray(begin, begin+size);
  }

  getBufferForGPU() {
    this.__bufferForGPU;
  }
}
