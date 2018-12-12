const singleton:any = Symbol();

export default class System {
  static __singletonEnforcer: Symbol;

  private constructor(enforcer: Symbol) {
    if (enforcer !== System.__singletonEnforcer || !(this instanceof System)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }
  }

  static getInstance() {
    const thisClass = System;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new System(thisClass.__singletonEnforcer);
    }

    return (thisClass as any)[singleton];
  }
}
