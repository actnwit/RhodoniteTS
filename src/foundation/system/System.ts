import { ProcessStageEnum, ProcessStage } from "../definitions/ProcessStage";
import ComponentRepository from "../core/ComponentRepository";
import { ProcessApproachEnum, ProcessApproach } from "../definitions/ProcessApproach";
import ModuleManager from "./ModuleManager";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import WebGLStrategy from "../../webgl/WebGLStrategy";
import Component from "../core/Component";
import Expression from "../renderer/Expression";
import RenderPass from "../renderer/RenderPass";
import MeshRendererComponent from "../components/MeshRendererComponent";
import EntityRepository from "../core/EntityRepository";
import { ComponentType } from "../definitions/ComponentType";
import CameraComponent from "../components/CameraComponent";
import MemoryManager from "../core/MemoryManager";
import GlobalDataRepository from "../core/GlobalDataRepository";
import TransformComponent from "../components/TransformComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import Vector3 from "../math/Vector3";
import { CameraType } from "../definitions/CameraType";
import Vector4 from "../math/Vector4";
import Time from "../misc/Time";

export default class System {
  private static __instance: System;
  private __processStages: Array<ProcessStageEnum> = [
    ProcessStage.Create,
    ProcessStage.Load,
    // ProcessStage.Mount,
    ProcessStage.Logic,
    ProcessStage.PreRender,
    ProcessStage.Render,
    // ProcessStage.Unmount,
    // ProcessStage.Discard
  ];
  private __componentRepository: ComponentRepository = ComponentRepository.getInstance();
  private __entityRepository: EntityRepository = EntityRepository.getInstance();
  private __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private __webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
  private __webglStrategy?: WebGLStrategy;
  private __localExpression = new Expression();
  private __lastEntitiesNumber = -1;
  private __renderPassTickCount = 0;

  private constructor() {
  }

  process(expressions: Expression[]) {
    if (this.__processApproach === ProcessApproach.None) {
      throw new Error('Choose a process approach first.');
    }
    Time._processBegin();

    if (CameraComponent.main === Component.InvalidObjectUID) {
      const cameraEntity = this.__entityRepository.createEntity([TransformComponent, SceneGraphComponent, CameraComponent]);
      cameraEntity.getTransform().translate = new Vector3(0, 0, 1);
      cameraEntity.getCamera().type = CameraType.Orthographic;
      cameraEntity.getCamera().zNear = 0.1;
      cameraEntity.getCamera().zFar = 10000;
      const wgl = this.__webglResourceRepository.currentWebGLContextWrapper!;
      cameraEntity.getCamera().xMag = wgl.width / wgl.height;
      cameraEntity.getCamera().yMag = 1;
    }


    for (let stage of this.__processStages) {
      const methodName = stage.methodName;
      const commonMethodName = 'common_' + methodName;
      const componentTids = this.__componentRepository.getComponentTIDs();
      for (let componentTid of componentTids) {
        for (let exp of expressions) {
          let loopN = 1;
          if (componentTid === MeshRendererComponent.componentTID) {
            loopN = exp!.renderPasses.length;
          }

          for (let i = 0; i < loopN; i++) {
            const renderPass = exp!.renderPasses[i];
            if (componentTid === MeshRendererComponent.componentTID && (stage == ProcessStage.Render)) {
              this.__webglResourceRepository.bindFramebuffer(renderPass.getFramebuffer());
              this.__webglResourceRepository.setViewport(renderPass.getViewport());
              this.__webglResourceRepository.setDrawTargets(renderPass.getFramebuffer());
              this.__webglResourceRepository.clearFrameBuffer(renderPass);
            }

            const componentClass: typeof Component = ComponentRepository.getComponentClass(componentTid)!;
            componentClass.updateComponentsOfEachProcessStage(componentClass, stage, this.__componentRepository, renderPass);

            const componentClass_commonMethod = (componentClass as any)[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({ processApproach: this.__processApproach, renderPass: renderPass, processStage: stage, renderPassTickCount: this.__renderPassTickCount });
            }

            componentClass.process({
              componentType: componentClass,
              processStage: stage,
              processApproach: this.__processApproach,
              componentRepository: this.__componentRepository,
              strategy: this.__webglStrategy!,
              renderPass: renderPass,
              renderPassTickCount: this.__renderPassTickCount
            });

            this.__renderPassTickCount++;
          }
        }
      }
    }

    Time._processEnd();
  }

  setProcessApproachAndCanvas(approach: ProcessApproachEnum, canvas: HTMLCanvasElement, memoryUsageOrder: number = 1, webglOption: any = {}) {
    const moduleManager = ModuleManager.getInstance();
    const moduleName = 'webgl';
    const webglModule = (moduleManager.getModule(moduleName)! as any);
    this.__webglStrategy = webglModule.getRenderingStrategy(approach);
    const repo = webglModule.WebGLResourceRepository.getInstance();

    let gl: WebGLRenderingContext | null;
    if (approach === ProcessApproach.DataTextureWebGL2 ||
      approach === ProcessApproach.UBOWebGL2 ||
      approach === ProcessApproach.TransformFeedbackWebGL2 ||
      approach === ProcessApproach.UniformWebGL2
    ) {
      gl = canvas.getContext('webgl2', webglOption) as WebGL2RenderingContext;
    } else {
      gl = canvas.getContext('webgl', webglOption) as WebGLRenderingContext ||
        canvas.getContext('experimental-webgl', webglOption) as WebGLRenderingContext;
    }

    gl!.enable(gl!.DEPTH_TEST);

    MemoryManager.createInstanceIfNotCreated(0.125 * memoryUsageOrder, 0.0625 * memoryUsageOrder, 1.0 * memoryUsageOrder, 0.0 * memoryUsageOrder);
    const globalDataRepository = GlobalDataRepository.getInstance();
    globalDataRepository.initialize();

    repo.addWebGLContext(gl!, canvas, true);
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
