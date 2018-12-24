import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import EntityRepository from "../core/EntityRepository";
import Component from "../core/Component";
import ComponentRepository from "../core/ComponentRepository";
import RenderingPipeline from "../renderer/RenderingPipeline";
import { WebGLRenderingPipeline } from "../renderer/webgl/WebGLRenderingPipeline";

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
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __renderingPipeline: RenderingPipeline = WebGLRenderingPipeline;

  private constructor(enforcer: Symbol) {
    if (enforcer !== System.__singletonEnforcer || !(this instanceof System)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }
  }

  process() {
    this.__processStages.forEach(stage=>{
      const methodName = stage.getMethodName();
      const args:Array<any> = [];
      let instanceIDBufferUid: CGAPIResourceHandle = 0;
      if (methodName === '$prerender') {
        instanceIDBufferUid = this.__renderingPipeline.common_prerender();
        args.push(instanceIDBufferUid);
      }
      const componentTids = this.__componentRepository.getComponentTIDs();
      componentTids.forEach(componentTid=>{
        const components = this.__componentRepository.getComponentsWithType(componentTid)!;
        components.forEach(component=>{
          const method = (component as any)[methodName];
          if (method != null) {
            method.apply(component, args);
          }
        });
      });
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
