import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import ComponentRepository from "../core/ComponentRepository";
import RenderingPipeline from "../renderer/RenderingPipeline";
import { ProcessApproachEnum, ProcessApproach } from "../definitions/ProcessApproach";
import ModuleManager from "./ModuleManager";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import WebGLStrategy from "../../webgl/WebGLStrategy";
import Component from "../core/Component";

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
      const componentTids = this.__componentRepository.getComponentTIDs();
      componentTids.forEach(componentTid=>{
        const componentClass: typeof Component = ComponentRepository.getComponentClass(componentTid)!;

        const componentClass_commonMethod = (componentClass as any)['common_'+methodName];
        if (componentClass_commonMethod) {
          componentClass_commonMethod(this.__processApproach);
        }

        componentClass.updateComponentsOfEachProcessStage(componentClass, stage, this.__componentRepository);
        componentClass.process({
          componentType: componentClass,
          processStage:stage,
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

    repo.addWebGLContext(gl!, canvas.width, canvas.height, true);
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
