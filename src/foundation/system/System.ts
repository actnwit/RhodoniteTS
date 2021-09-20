import {ProcessStage} from '../definitions/ProcessStage';
import ComponentRepository from '../core/ComponentRepository';
import {
  ProcessApproachEnum,
  ProcessApproach,
} from '../definitions/ProcessApproach';
import ModuleManager from './ModuleManager';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import Component from '../core/Component';
import Expression from '../renderer/Expression';
import MeshRendererComponent from '../components/MeshRendererComponent';
import EntityRepository from '../core/EntityRepository';
import CameraComponent from '../components/CameraComponent';
import MemoryManager from '../core/MemoryManager';
import GlobalDataRepository from '../core/GlobalDataRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Vector3 from '../math/Vector3';
import {CameraType} from '../definitions/CameraType';
import Time from '../misc/Time';
import SystemState from './SystemState';
import {MiscUtil} from '../misc/MiscUtil';
import {XRFrame, XRSession} from 'webxr';
import type {RnXR} from '../../xr/main';
import type WebVRSystem from '../../xr/WebVRSystem';
import {Is} from '../misc/Is';

export default class System {
  private static __instance: System;
  private __componentRepository: ComponentRepository =
    ComponentRepository.getInstance();
  private __entityRepository: EntityRepository = EntityRepository.getInstance();
  private __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private __webglResourceRepository =
    CGAPIResourceRepository.getWebGLResourceRepository();
  private __webglStrategy?: WebGLStrategy;
  private __renderPassTickCount = 0;
  private __animationFrameId = -1;

  private __renderLoopFunc?: Function;
  private __args?: unknown[];

  private constructor() {}

  doRenderLoop(renderLoopFunc: Function, time: number, ...args: unknown[]) {
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
          webXRSystem._preRender(time, xrFrame);
        } else {
          webVRSystem = rnVRModule.WebVRSystem.getInstance();
          if (webVRSystem.isReadyForWebVR) {
            webVRSystem.preRender();
          }
        }
      }

      args.splice(0, 0, time);
      renderLoopFunc.apply(renderLoopFunc, args);

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
      this.doRenderLoop(renderLoopFunc, _time, args);
    }) as FrameRequestCallback);
  }

  private __getAnimationFrameObject(): Window | VRDisplay | XRSession {
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

  stopRenderLoop() {
    const animationFrameObject = this.__getAnimationFrameObject();
    animationFrameObject.cancelAnimationFrame(this.__animationFrameId);
    this.__animationFrameId = -1;
  }

  restartRenderLoop() {
    if (this.__renderLoopFunc != null) {
      this.doRenderLoop(this.__renderLoopFunc, 0, this.__args);
    }
  }

  process(expressions: Expression[]) {
    if (this.__processApproach === ProcessApproach.None) {
      throw new Error('Choose a process approach first.');
    }
    Time._processBegin();

    if (CameraComponent.main === Component.InvalidObjectUID) {
      const cameraEntity = this.__entityRepository.createEntity([
        TransformComponent,
        SceneGraphComponent,
        CameraComponent,
      ]);
      cameraEntity.getTransform().translate = new Vector3(0, 0, 1);
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

    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = 'common_' + methodName;
      const componentTids = this.__componentRepository.getComponentTIDs();
      for (const componentTid of componentTids) {
        if (stage === ProcessStage.Render) {
          for (const exp of expressions) {
            let loopN = 1;
            if (componentTid === MeshRendererComponent.componentTID) {
              loopN = exp!.renderPasses.length;
            }

            for (let i = 0; i < loopN; i++) {
              const renderPass = exp!.renderPasses[i];
              renderPass.doPreRender();
              repo.switchDepthTest(renderPass.isDepthTest);
              if (
                componentTid === MeshRendererComponent.componentTID &&
                stage === ProcessStage.Render
              ) {
                if (webXRSystem?.isWebXRMode && renderPass.isOutputForVr) {
                  const glw =
                    this.__webglResourceRepository.currentWebGLContextWrapper!;
                  const gl = glw.getRawContext();
                  gl?.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer!);
                  // glw.drawBuffers([RenderBufferTarget.ColorAttachment0]);
                } else {
                  this.__webglResourceRepository.bindFramebuffer(
                    renderPass.getFramebuffer()
                  );
                  this.__webglResourceRepository.setDrawTargets(
                    renderPass.getFramebuffer()
                  );
                }

                if (!webXRSystem?.isWebXRMode || !renderPass.isVrRendering) {
                  this.__webglResourceRepository.setViewport(
                    renderPass.getViewport()
                  );
                }

                this.__webglResourceRepository.clearFrameBuffer(renderPass);
              }

              const componentClass: typeof Component =
                ComponentRepository.getComponentClass(componentTid)!;
              componentClass.updateComponentsOfEachProcessStage(
                componentClass,
                stage,
                this.__componentRepository,
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
                componentRepository: this.__componentRepository,
                strategy: this.__webglStrategy!,
                renderPass: renderPass,
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
          const componentClass: typeof Component =
            ComponentRepository.getComponentClass(componentTid)!;
          componentClass.updateComponentsOfEachProcessStage(
            componentClass,
            stage,
            this.__componentRepository
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
            componentRepository: this.__componentRepository,
            strategy: this.__webglStrategy!,
            renderPass: void 0,
            renderPassTickCount: this.__renderPassTickCount,
          });
        }
      }
    }

    Time._processEnd();
  }

  setProcessApproachAndCanvas(
    approach: ProcessApproachEnum,
    canvas: HTMLCanvasElement,
    memoryUsageOrder = 1,
    webglOption: WebGLContextAttributes = {},
    rnWebGLDebug = true,
    fallback3dApi = true
  ) {
    const repo = CGAPIResourceRepository.getWebGLResourceRepository();
    MemoryManager.createInstanceIfNotCreated(
      0.125 * memoryUsageOrder,
      0.0625 * memoryUsageOrder,
      0.9375 * memoryUsageOrder
    );
    const globalDataRepository = GlobalDataRepository.getInstance();
    globalDataRepository.initialize(approach);

    const gl = repo.generateWebGLContext(
      canvas,
      webglOption,
      approach.webGLVersion,
      true,
      rnWebGLDebug,
      fallback3dApi
    );

    repo.switchDepthTest(true);
    this.__processApproach = approach;
    SystemState.currentProcessApproach = approach;

    if (
      rnWebGLDebug &&
      MiscUtil.isMobile() &&
      ProcessApproach.isUniformApproach(approach)
    ) {
      alert(
        'Use the FastestWebGL1/FastestWebGL2 as the argument of setProcessApproachAndCanvas method for this device.'
      );
    }

    canvas.addEventListener(
      'webglcontextlost',
      ((event: Event) => {
        // Calling preventDefault signals to the page that you intent to handle context restoration.
        event.preventDefault();
        this.stopRenderLoop();
        console.error('WebGL context lost occurred.');
      }).bind(this)
    );

    canvas.addEventListener('webglcontextrestored', () => {
      // Once this function is called the gl context will be restored but any graphics resources
      // that were previously loaded will be lost, so the scene should be reloaded.
      console.error('WebGL context restored.');
      // TODO: Implement restoring the previous graphics resources
      // loadSceneGraphics(gl);
      this.restartRenderLoop();
    });
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
