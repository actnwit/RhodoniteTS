
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
  private static __singletonEnforcer: Symbol;
  //__entityMaxCount: number;

  private constructor(enforcer: Symbol) {
    const thisClass = MemoryManager;
    if (enforcer !== thisClass.__singletonEnforcer || !(this instanceof MemoryManager)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }

    thisClass.__singletonEnforcer = Symbol();

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
}
