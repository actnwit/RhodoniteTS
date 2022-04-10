import {ProcessStage, ProcessStageEnum} from '../definitions/ProcessStage';
import { ComponentRepository } from '../core/ComponentRepository';
import {
  ProcessApproachEnum,
  ProcessApproach,
} from '../definitions/ProcessApproach';
import { ModuleManager } from './ModuleManager';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import { Component } from '../core/Component';
import { Expression } from '../renderer/Expression';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { EntityRepository } from '../core/EntityRepository';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { MemoryManager } from '../core/MemoryManager';
import GlobalDataRepository from '../core/GlobalDataRepository';
import { Vector3 } from '../math/Vector3';
import {CameraType} from '../definitions/CameraType';
import Time from '../misc/Time';
import SystemState from './SystemState';
import {MiscUtil, valueWithCompensation} from '../misc/MiscUtil';
import {XRFrame, XRSession} from 'webxr';
import type {RnXR} from '../../xr/main';
import type WebVRSystem from '../../xr/WebVRSystem';
import {Is} from '../misc/Is';
import EntityHelper, {ISceneGraphEntity} from '../helpers/EntityHelper';
import Config from '../core/Config';
import { Frame } from '../renderer/Frame';
import { Vector4 } from '../math/Vector4';
import { RenderPass } from '../renderer/RenderPass';
import WebGLResourceRepository from '../../webgl/WebGLResourceRepository';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import { WebXRSystem } from '../..';

declare const spector: any;

interface SystemInitDescription {
  approach: ProcessApproachEnum;
  canvas: HTMLCanvasElement;
  memoryUsageOrder?: {
    cpuGeneric: number;
    gpuInstanceData: number;
    gpuVertexData: number;
  };
  webglOption?: WebGLContextAttributes;
  rnWebGLDebug?: boolean;
  fallback3dApi?: boolean;
}

type ComponentMethodName = string;

export class System {
  private static __instance: System;
  private static __expressionForProcessAuto?: Expression;
  private static __renderPassForProcessAuto?: RenderPass;
  private static __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private static __webglResourceRepository: WebGLResourceRepository;
  private static __webglStrategy?: WebGLStrategy;
  private static __renderPassTickCount = 0;
  private static __animationFrameId = -1;

  private static __renderLoopFunc?: Function;
  private static __args: unknown[] = [];
  private static __stageMethods: Map<
    typeof Component,
    Map<ProcessStageEnum, ComponentMethodName[]>
  > = new Map();

  private constructor() {}

  static startRenderLoop(renderLoopFunc: Function, ...args: unknown[]) {
    this.__renderLoopFunc = renderLoopFunc;
    this.__args = args;
    const animationFrameObject = this.__getAnimationFrameObject();

    this.__animationFrameId = animationFrameObject.requestAnimationFrame(((
      _time: number,
      xrFrame: XRFrame
    ) => {
      const rnVRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webXRSystem = rnVRModule?.WebXRSystem.getInstance();
      if (Is.exist(rnVRModule)) {
        let webVRSystem: WebVRSystem;
        if (webXRSystem.isReadyForWebXR) {
          webXRSystem._preRender(_time, xrFrame);
        } else {
          webVRSystem = rnVRModule.WebVRSystem.getInstance();
          if (webVRSystem.isReadyForWebVR) {
            webVRSystem.preRender();
          }
        }
      }

      renderLoopFunc.apply(renderLoopFunc, [_time, ...args]);

      if (Is.exist(rnVRModule)) {
        if (webXRSystem.isReadyForWebXR) {
          webXRSystem._postRender();
        } else {
          const webVRSystem = rnVRModule.WebVRSystem.getInstance();
          if (webVRSystem.isReadyForWebVR) {
            webVRSystem.postRender();
          }
        }
      }
      this.startRenderLoop(renderLoopFunc, ...args);
    }) as FrameRequestCallback);
  }

  private static __getAnimationFrameObject(): Window | VRDisplay | XRSession {
    let animationFrameObject: Window | VRDisplay | XRSession | undefined =
      window;
    const rnVRModule = ModuleManager.getInstance().getModule('xr') as
      | RnXR
      | undefined;
    if (Is.exist(rnVRModule)) {
      const webVRSystem = rnVRModule.WebVRSystem.getInstance();
      const webXRSystem = rnVRModule.WebXRSystem.getInstance();
      if (webXRSystem.requestedToEnterWebXR) {
        animationFrameObject = webXRSystem.xrSession;
      } else if (webVRSystem.isWebVRMode) {
        animationFrameObject = webVRSystem.vrDisplay;
      }
      if (Is.not.exist(animationFrameObject)) {
        return window;
      }
    }
    return animationFrameObject;
  }

  public static stopRenderLoop() {
    const animationFrameObject = this.__getAnimationFrameObject();
    animationFrameObject.cancelAnimationFrame(this.__animationFrameId);
    this.__animationFrameId = -1;
  }

  public static restartRenderLoop() {
    if (this.__renderLoopFunc != null) {
      this.startRenderLoop(this.__renderLoopFunc, 0, this.__args);
    }
  }

  public static processAuto(clearColor = Vector4.fromCopy4(0, 0, 0, 1)) {
    if (Is.not.exist(System.__expressionForProcessAuto)) {
      const expression = new Expression();
      const renderPassInit = new RenderPass();
      renderPassInit.toClearColorBuffer = true;
      renderPassInit.toClearDepthBuffer = true;
      renderPassInit.clearColor = clearColor;
      const renderPassMain = new RenderPass();
      expression.addRenderPasses([renderPassInit, renderPassMain]);
      System.__expressionForProcessAuto = expression;
      System.__renderPassForProcessAuto = renderPassMain;
    }
    System.__renderPassForProcessAuto!.clearEntities();
    const entities = EntityRepository._getEntities();
    System.__renderPassForProcessAuto!.addEntities(
      entities as unknown as ISceneGraphEntity[]
    );
    this.process([System.__expressionForProcessAuto]);
  }

  public static process(frame: Frame): void;
  public static process(expressions: Expression[]): void;
  public static process(value: any) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('Rn#');
    }
    if (this.__processApproach === ProcessApproach.None) {
      throw new Error('Choose a process approach first.');
    }
    Time._processBegin();
    let expressions: Expression[] = value;
    if (value instanceof Frame) {
      expressions = value.expressions;
    }

    if (CameraComponent.main === Component.InvalidObjectUID) {
      const cameraEntity = EntityHelper.createCameraEntity();
      cameraEntity.getTransform()!.translate = Vector3.fromCopyArray([0, 0, 1]);
      cameraEntity.getCamera().type = CameraType.Orthographic;
      cameraEntity.getCamera().zNear = 0.1;
      cameraEntity.getCamera().zFar = 10000;
      const wgl = this.__webglResourceRepository.currentWebGLContextWrapper!;
      cameraEntity.getCamera().xMag = wgl.width / wgl.height;
      cameraEntity.getCamera().yMag = 1;
    }

    const repo = CGAPIResourceRepository.getWebGLResourceRepository();
    const rnVRModule = ModuleManager.getInstance().getModule('xr') as
      | RnXR
      | undefined;
    const webXRSystem = rnVRModule?.WebXRSystem.getInstance();

    const componentTids = ComponentRepository.getComponentTIDs();
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = 'common_' + methodName;
      for (const componentTid of componentTids) {
        const componentClass: typeof Component =
          ComponentRepository.getComponentClass(componentTid)!;
        if (stage === ProcessStage.Render) {
          for (const exp of expressions) {
            let renderPassN = 1;
            if (componentTid === MeshRendererComponent.componentTID) {
              renderPassN = exp!.renderPasses.length;
            }

            for (let i = 0; i < renderPassN; i++) {
              const renderPass = exp!.renderPasses[i];
              if (typeof spector !== 'undefined') {
                spector.setMarker(
                  `| ${exp.uniqueName}: ${renderPass.uniqueName}#`
                );
              }
              renderPass.doPreRender();
              repo.switchDepthTest(renderPass.isDepthTest);
              if (
                componentTid === MeshRendererComponent.componentTID &&
                stage === ProcessStage.Render
              ) {
                // bind Framebuffer
                System.bindFramebuffer(webXRSystem, renderPass);

                // set Viewport for Normal (Not WebXR)
                System.setViewportForNormalRendering(webXRSystem, renderPass);

                // clear Framebuffer
                this.__webglResourceRepository.clearFrameBuffer(renderPass);
              }

              componentClass.updateComponentsOfEachProcessStage(
                componentClass,
                stage,
                renderPass
              );

              const componentClass_commonMethod = (componentClass as any)[
                commonMethodName
              ];
              if (componentClass_commonMethod) {
                componentClass_commonMethod({
                  processApproach: this.__processApproach,
                  renderPass: renderPass,
                  processStage: stage,
                  renderPassTickCount: this.__renderPassTickCount,
                });
              }

              componentClass.process({
                componentType: componentClass,
                processStage: stage,
                processApproach: this.__processApproach,
                strategy: this.__webglStrategy!,
                renderPass: void 0,
                renderPassTickCount: this.__renderPassTickCount,
              });

              this.__renderPassTickCount++;

              if (
                stage === ProcessStage.Render &&
                renderPass.getResolveFramebuffer()
              ) {
                renderPass.copyFramebufferToResolveFramebuffer();
              }
            }
          }
        } else {
          componentClass.updateComponentsOfEachProcessStage(
            componentClass,
            stage
          );

          const componentClass_commonMethod = (componentClass as any)[
            commonMethodName
          ];
          if (componentClass_commonMethod) {
            componentClass_commonMethod({
              processApproach: this.__processApproach,
              renderPass: void 0,
              processStage: stage,
              renderPassTickCount: this.__renderPassTickCount,
            });
          }

          componentClass.process({
            componentType: componentClass,
            processStage: stage,
            processApproach: this.__processApproach,
            strategy: this.__webglStrategy!,
            renderPass: void 0,
            renderPassTickCount: this.__renderPassTickCount,
          });
        }
      }
    }

    Time._processEnd();
  }

  private static setViewportForNormalRendering(
    webXRSystem: WebXRSystem | undefined,
    renderPass: RenderPass
  ) {
    if (!webXRSystem?.isWebXRMode || !renderPass.isVrRendering) {
      this.__webglResourceRepository.setViewport(renderPass.getViewport());
    }
  }

  private static bindFramebuffer(
    webXRSystem: WebXRSystem | undefined,
    renderPass: RenderPass
  ) {
    if (webXRSystem?.isWebXRMode && renderPass.isOutputForVr) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer!);
    } else {
      this.__webglResourceRepository.bindFramebuffer(
        renderPass.getFramebuffer()
      );
      this.__webglResourceRepository.setDrawTargets(
        renderPass.getFramebuffer()
      );
    }
  }

  public static async init(desc: SystemInitDescription) {
    await ModuleManager.getInstance().loadModule('webgl');
    await ModuleManager.getInstance().loadModule('pbr');
    System.__webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    Config.eventTargetDom = desc.canvas;
    const repo = CGAPIResourceRepository.getWebGLResourceRepository();
    MemoryManager.createInstanceIfNotCreated({
      cpuGeneric: Is.exist(desc.memoryUsageOrder)
        ? desc.memoryUsageOrder.cpuGeneric
        : 0.3,
      gpuInstanceData: Is.exist(desc.memoryUsageOrder)
        ? desc.memoryUsageOrder.gpuInstanceData
        : 0.4,
      gpuVertexData: Is.exist(desc.memoryUsageOrder)
        ? desc.memoryUsageOrder.gpuVertexData
        : 0.6,
    });
    const globalDataRepository = GlobalDataRepository.getInstance();
    globalDataRepository.initialize(desc.approach);

    const gl = repo.generateWebGLContext(
      desc.canvas,
      desc.approach.webGLVersion,
      true,
      desc.rnWebGLDebug ? desc.rnWebGLDebug : false,
      desc.webglOption,
      desc.fallback3dApi
    );

    repo.switchDepthTest(true);
    this.__processApproach = desc.approach;
    SystemState.currentProcessApproach = desc.approach;

    if (
      desc.rnWebGLDebug &&
      MiscUtil.isMobile() &&
      ProcessApproach.isUniformApproach(desc.approach)
    ) {
      alert(
        'Use the FastestWebGL1/FastestWebGL2 as the argument of setProcessApproachAndCanvas method for this device.'
      );
    }

    desc.canvas.addEventListener(
      'webglcontextlost',
      ((event: Event) => {
        // Calling preventDefault signals to the page that you intent to handle context restoration.
        event.preventDefault();
        this.stopRenderLoop();
        console.error('WebGL context lost occurred.');
      }).bind(this)
    );

    desc.canvas.addEventListener('webglcontextrestored', () => {
      // Once this function is called the gl context will be restored but any graphics resources
      // that were previously loaded will be lost, so the scene should be reloaded.
      console.error('WebGL context restored.');
      // TODO: Implement restoring the previous graphics resources
      // loadSceneGraphics(gl);
      this.restartRenderLoop();
    });

    // this.detectComponentMethods();

    return gl;
  }

  static detectComponentMethods() {
    const wellKnownComponentTIDs = Array.from(
      Object.values(WellKnownComponentTIDs)
    );
    for (const componentTid of wellKnownComponentTIDs) {
      const methods = [];
      for (const stage of Component._processStages) {
        const componentClass: typeof Component =
          ComponentRepository.getComponentClass(componentTid)!;
        const exist = componentClass.doesTheProcessStageMethodExist(
          componentClass,
          stage
        );
        if (exist) {
          const map = valueWithCompensation({
            value: this.__stageMethods.get(componentClass),
            compensation: () => new Map(),
          });
          // map.set()
          // this.__stageMethods.set(componentClass, stage.methodName);
        }
      }
    }
  }

  static get processApproach() {
    return this.__processApproach;
  }

  public static resizeCanvas(width: number, height: number) {
    const repo = CGAPIResourceRepository.getWebGLResourceRepository();
    repo.resizeCanvas(width, height);
  }

  public static getCanvasSize() {
    const repo = CGAPIResourceRepository.getWebGLResourceRepository();
    return repo.getCanvasSize();
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new System();
    }

    return this.__instance;
  }
}
