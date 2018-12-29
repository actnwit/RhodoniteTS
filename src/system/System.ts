import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import ComponentRepository from "../core/ComponentRepository";
import RenderingPipeline from "../renderer/RenderingPipeline";
import { WebGLRenderingPipeline } from "../renderer/webgl/WebGLRenderingPipeline";
import MeshRendererComponent from "../components/MeshRendererComponent";

export default class System {
  private static __instance: System;
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

  private constructor() {
  }

  process() {
    this.__processStages.forEach(stage=>{
      const methodName = stage.getMethodName();
      const args:Array<any> = [];
      let instanceIDBufferUid: CGAPIResourceHandle = 0;
      const componentTids = this.__componentRepository.getComponentTIDs();
      const commonMethod = (this.__renderingPipeline as any)['common_'+methodName];
      if (commonMethod != null) {
        instanceIDBufferUid = commonMethod.apply(this.__renderingPipeline);
      }
      args.push(instanceIDBufferUid);
      componentTids.forEach(componentTid=>{
        const components = this.__componentRepository.getComponentsWithType(componentTid)!;
        components.forEach((component)=>{
          const method = (component as any)[methodName];
          if (method != null) {
            //method.apply(component, args);
            (component as any)[methodName](args);
          }
        });
      });
    });
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new System();
    }

    return this.__instance;
  }
}
