import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import EntityRepository from "../core/EntityRepository";
import Component from "../core/Component";

const singleton:any = Symbol();

export default class System {
  private static __singletonEnforcer: Symbol;
  private __processStages: Array<ProcessStageEnum> = [
    ProcessStage.Create,
    ProcessStage.Load,
    ProcessStage.Mount,
    ProcessStage.Logic,
    ProcessStage.PreRender,
    ProcessStage.Render,
    ProcessStage.Unmount,
    ProcessStage.Discard
  ];
  private __entityRepository: EntityRepository = EntityRepository.getInstance();

  private constructor(enforcer: Symbol) {
    if (enforcer !== System.__singletonEnforcer || !(this instanceof System)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }
  }

  process() {
    this.__processStages.forEach(stage=>{
      const entities = this.__entityRepository._getEntities();
      for(let i=1; i<entities.length; i++) {
        const methodName = stage.getMethodName();
        const map = this.__entityRepository._components[entities[i].entityUID] as Map<ComponentTID, Component>;

        for(let component of map.values()) {
          if (component != null) {
            const method = (component as any)[methodName];
            if (method != null) {
              method();
            }
          }
        }

      }
    });
  }

  static getInstance() {
    const thisClass = System;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new System(thisClass.__singletonEnforcer);
    }

    return (thisClass as any)[singleton];
  }
}
