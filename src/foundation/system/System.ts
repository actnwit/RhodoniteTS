import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import ComponentRepository from "../core/ComponentRepository";
import RenderingPipeline from "../renderer/RenderingPipeline";
import { ProcessApproachEnum, ProcessApproach } from "../definitions/ProcessApproach";
import Component, { ComponentConstructor } from "../core/Component";
import ModuleManager from "./ModuleManager";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import WebGLStrategy from "../../webgl/WebGLStrategy";

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
  private __renderingPipeline?: RenderingPipeline;
  private __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private __webglStrategy?: WebGLStrategy;

  private constructor() {
  }

  process() {
    if (this.__processApproach === ProcessApproach.None) {
      throw new Error('Choose a process approach first.');
    }

    this.__processStages.forEach(stage=>{
      const methodName = stage.getMethodName();
      let instanceIDBufferUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      const componentTids = this.__componentRepository.getComponentTIDs();
      const commonMethod = (this.__renderingPipeline as any)['common_'+methodName];
      if (commonMethod != null) {
        instanceIDBufferUid = commonMethod.call(this.__renderingPipeline, this.__processApproach);
      }
      componentTids.forEach(componentTid=>{
        const componentClass: ComponentConstructor = ComponentRepository.getComponentClass(componentTid)!;

        const componentClass_commonMethod = (componentClass as any)['common_'+methodName];
        if (componentClass_commonMethod) {
          componentClass_commonMethod();
        }

        componentClass.updateComponentsOfEachProcessStage(componentTid, stage, this.__componentRepository);
        componentClass.process({
          componentTid:componentTid,
          processStage:stage,
          instanceIDBufferUid:instanceIDBufferUid,
          processApproach:this.__processApproach,
          componentRepository: this.__componentRepository,
          strategy: this.__webglStrategy!
        });
      });
    });
  }

  setProcessApproachAndCanvas(approach: ProcessApproachEnum, canvas: HTMLCanvasElement) {
    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any).default;
    this.__webglStrategy = webglModule.getRenderingStrategy(approach);
    this.__renderingPipeline = webglModule.WebGLRenderingPipeline.getInstance();
    const repo = webglModule.WebGLResourceRepository.getInstance();

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
