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
      if (methodName === '$prerender') {
        instanceIDBufferUid = this.__renderingPipeline.common_prerender();
        args.push(instanceIDBufferUid);
      }
      if (methodName === '$render') {
        this.__renderingPipeline.common_render();
      }
      componentTids.forEach(componentTid=>{
        const components = this.__componentRepository.getComponentsWithType(componentTid)!;
        components.forEach((component, i)=>{
          const method = (component as any)[methodName];
          if (method != null) {
            method.apply(component, args);
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
