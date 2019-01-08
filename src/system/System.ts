import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import ComponentRepository from "../core/ComponentRepository";
import RenderingPipeline from "../renderer/RenderingPipeline";
import { WebGLRenderingPipeline } from "../renderer/webgl/WebGLRenderingPipeline";
import MeshRendererComponent from "../components/MeshRendererComponent";
import { ProcessApproachEnum, ProcessApproach } from "../definitions/ProcessApproach";
import WebGLResourceRepository from "../renderer/webgl/WebGLResourceRepository";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";

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
  private __processApproach: ProcessApproachEnum = ProcessApproach.None;

  private constructor() {
  }

  process() {
    if (this.__processApproach === ProcessApproach.None) {
      throw new Error('Choose a process approach first.');
    }

    this.__processStages.forEach(stage=>{
      const methodName = stage.getMethodName();
//      const args:Array<any> = [];
      let instanceIDBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      const componentTids = this.__componentRepository.getComponentTIDs();
      const commonMethod = (this.__renderingPipeline as any)['common_'+methodName];
      if (commonMethod != null) {
        instanceIDBufferUid = commonMethod.call(this.__renderingPipeline, this.__processApproach);
      }
//      args.push(instanceIDBufferUid);
      componentTids.forEach(componentTid=>{
        const components = this.__componentRepository.getComponentsWithType(componentTid)!;
        components.forEach((component)=>{
          const method = (component as any)[methodName];
          if (method != null) {
            //method.apply(component, args);
            (component as any)[methodName](this.__processApproach, instanceIDBufferUid);
          }
        });
      });
    });
  }

  setProcessApproachAndCanvas(approach: ProcessApproachEnum, canvas: HTMLCanvasElement) {

    const repo = WebGLResourceRepository.getInstance();

    let gl;
    if (approach === ProcessApproach.DataTextureWebGL2 ||
       approach === ProcessApproach.UBOWebGL2 ||
       approach === ProcessApproach.TransformFeedbackWebGL2
       ) {
      gl = canvas.getContext('webgl2');
    } else {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    }

    repo.addWebGLContext(gl!, true);
    this.__processApproach = approach;

    return gl;
  }

  get processApproach() {
    return this.__processApproach;
  }

  static getInstance() {
    if (!this.__instance) {
     this.__instance = new System();
    }

    return this.__instance;
  }
}
