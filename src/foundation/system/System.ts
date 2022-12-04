import {ProcessStage, ProcessStageEnum} from '../definitions/ProcessStage';
import {ComponentRepository} from '../core/ComponentRepository';
import {
  ProcessApproachEnum,
  ProcessApproach,
} from '../definitions/ProcessApproach';
import {ModuleManager} from './ModuleManager';
import {CGAPIResourceRepository} from '../renderer/CGAPIResourceRepository';
import {WebGLStrategy} from '../../webgl/WebGLStrategy';
import {Component} from '../core/Component';
import {Expression} from '../renderer/Expression';
import {EntityRepository} from '../core/EntityRepository';
import {CameraComponent} from '../components/Camera/CameraComponent';
import {MemoryManager} from '../core/MemoryManager';
import {GlobalDataRepository} from '../core/GlobalDataRepository';
import {Vector3} from '../math/Vector3';
import {CameraType} from '../definitions/CameraType';
import {Time} from '../misc/Time';
import SystemState from './SystemState';
import {MiscUtil, valueWithCompensation} from '../misc/MiscUtil';
import type {RnXR} from '../../xr/main';
import {Is} from '../misc/Is';
import {EntityHelper, ISceneGraphEntity} from '../helpers/EntityHelper';
import {Config} from '../core/Config';
import {Frame} from '../renderer/Frame';
import {Vector4} from '../math/Vector4';
import {RenderPass} from '../renderer/RenderPass';
import {WebGLResourceRepository} from '../../webgl/WebGLResourceRepository';
import {WellKnownComponentTIDs} from '../components/WellKnownComponentTIDs';
import {AbstractMaterialContent} from '../materials/core/AbstractMaterialContent';

declare const spector: any;

/**
 * The argument type for System.init() method.
 */
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

/**
 * The system class is the entry point of the Rhodonite library.
 *
 * @example
 * ```
 * await Rn.System.init({
 *   approach: Rn.ProcessApproach.DataTexture,
 *   canvas: document.getElementById('world') as HTMLCanvasElement,
 * });
 *
 * ... (create something) ...
 *
 * Rn.System.startRenderLoop((time, _myArg1, _myArg2) => {
 *   Rn.System.process([expression]);
 * }, myArg1, myArg2);
 * ```
 */
export class System {
  private static __instance: System;
  private static __expressionForProcessAuto?: Expression;
  private static __renderPassForProcessAuto?: RenderPass;
  private static __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private static __webglResourceRepository: WebGLResourceRepository;
  private static __webglStrategy?: WebGLStrategy;
  private static __renderPassTickCount = 0;
  private static __animationFrameId = -1;

  private static __renderLoopFunc?: (time: number, ...args: any[]) => void;
  private static __args: unknown[] = [];
  private static __stageMethods: Map<
    typeof Component,
    Map<ProcessStageEnum, ComponentMethodName[]>
  > = new Map();

  private constructor() {}

  /**
   * Starts a render loop.
   *
   * @example
   * ```
   * Rn.System.startRenderLoop((time, _myArg1, _myArg2) => {
   *   Rn.System.process([expression]);
   * }, myArg1, myArg2);
   * ```
   *
   * @param renderLoopFunc - function to be called in each frame
   * @param args - arguments you want to be passed to renderLoopFunc
   */
  public static startRenderLoop(
    renderLoopFunc: (time: number, ...args: any[]) => void,
    ...args: any[]
  ) {
    this.__renderLoopFunc = renderLoopFunc;
    this.__args = args;
    const animationFrameObject = this.__getAnimationFrameObject();

    this.__animationFrameId = animationFrameObject.requestAnimationFrame(((
      _time: number,
      xrFrame: XRFrame
    ) => {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      if (Is.exist(rnXRModule)) {
        const webXRSystem = rnXRModule.WebXRSystem.getInstance();
        if (webXRSystem.isReadyForWebXR) {
          webXRSystem._preRender(_time, xrFrame);
        }
        const webARSystem = rnXRModule.WebARSystem.getInstance();
        if (webARSystem.isReadyForWebAR) {
          webARSystem._preRender(_time, xrFrame);
        }
      }

      renderLoopFunc.apply(renderLoopFunc, [_time, ...args]);

      if (Is.exist(rnXRModule)) {
        const webXRSystem = rnXRModule.WebXRSystem.getInstance();
        if (webXRSystem.isReadyForWebXR) {
          webXRSystem._postRender();
        }
        const webARSystem = rnXRModule.WebARSystem.getInstance();
        if (webARSystem.isReadyForWebAR) {
          webARSystem._preRender(_time, xrFrame);
        }
      }
      this.startRenderLoop(renderLoopFunc, ...args);
    }) as FrameRequestCallback);
  }

  private static __getAnimationFrameObject(): Window | XRSession {
    let animationFrameObject: Window | XRSession | undefined = window;
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as
      | RnXR
      | undefined;
    if (Is.exist(rnXRModule)) {
      const webXRSystem = rnXRModule.WebXRSystem.getInstance();
      const webARSystem = rnXRModule.WebARSystem.getInstance();
      if (webXRSystem.requestedToEnterWebXR) {
        animationFrameObject = webXRSystem.xrSession;
      } else if (webARSystem.requestedToEnterWebAR) {
        animationFrameObject = webARSystem.arSession;
      }
      if (Is.not.exist(animationFrameObject)) {
        return window;
      }
    }
    return animationFrameObject;
  }

  /**
   * Stops a existing render loop.
   */
  public static stopRenderLoop() {
    const animationFrameObject = this.__getAnimationFrameObject();
    animationFrameObject.cancelAnimationFrame(this.__animationFrameId);
    this.__animationFrameId = -1;
  }

  /**
   * Restart a render loop.
   */
  public static restartRenderLoop() {
    if (this.__renderLoopFunc != null) {
      this.startRenderLoop(this.__renderLoopFunc, 0, this.__args);
    }
  }

  /**
   * A Simple version of process method
   *
   * @remarks
   * No need to create expressions and renderPasses and to register entities, etc...
   * It's suitable for simple use cases like sample apps.
   *
   * @param clearColor - color to clear the canvas
   */
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

  /**
   * A process method to render a scene
   *
   * @remarks
   * You need to call this method for rendering.
   *
   * @param frame/expression - a frame/expression object
   */
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

    if (CameraComponent.current === Component.InvalidObjectUID) {
      System.createCamera();
    }

    const repo = CGAPIResourceRepository.getWebGLResourceRepository();
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as
      | RnXR
      | undefined;

    const componentTids = ComponentRepository.getComponentTIDs();
    const renderingComponentTids =
      ComponentRepository.getRenderingComponentTIDs();
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = 'common_' + methodName;
      if (stage === ProcessStage.Render) {
        for (const exp of expressions) {
          for (const componentTid of renderingComponentTids) {
            const componentClass: typeof Component =
              ComponentRepository.getComponentClass(componentTid)!;
            const renderPassN = exp.renderPasses.length;

            for (let i = 0; i < renderPassN; i++) {
              const renderPass = exp.renderPasses[i];
              if (typeof spector !== 'undefined') {
                spector.setMarker(
                  `| ${exp.uniqueName}: ${renderPass.uniqueName}#`
                );
              }
              repo.switchDepthTest(renderPass.isDepthTest);
              if (
                componentTid === WellKnownComponentTIDs.MeshRendererComponentTID
              ) {
                // bind Framebuffer
                System.bindFramebuffer(renderPass, rnXRModule);

                // set Viewport for Normal (Not WebXR)
                System.setViewportForNormalRendering(renderPass, rnXRModule);

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

              if (renderPass.getResolveFramebuffer()) {
                renderPass.copyFramebufferToResolveFramebuffer();
              }
              if (renderPass.getResolveFramebuffer2()) {
                renderPass.copyFramebufferToResolveFramebuffer2();
              }
            }
          }
        }
      } else {
        for (const componentTid of componentTids) {
          const componentClass: typeof Component =
            ComponentRepository.getComponentClass(componentTid)!;
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

  private static createCamera() {
    const cameraEntity = EntityHelper.createCameraEntity();
    cameraEntity.getTransform()!.translate = Vector3.fromCopyArray([0, 0, 1]);
    cameraEntity.getCamera().type = CameraType.Orthographic;
    cameraEntity.getCamera().zNear = 0.1;
    cameraEntity.getCamera().zFar = 10000;
    const wgl = this.__webglResourceRepository.currentWebGLContextWrapper!;
    cameraEntity.getCamera().xMag = wgl.width / wgl.height;
    cameraEntity.getCamera().yMag = 1;
  }

  private static setViewportForNormalRendering(
    renderPass: RenderPass,
    rnXRModule?: RnXR
  ) {
    const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
    const webARSystem = rnXRModule?.WebARSystem.getInstance();
    if (
      (!webXRSystem?.isWebXRMode || !renderPass.isVrRendering) &&
      !webARSystem?.isWebARMode
    ) {
      this.__webglResourceRepository.setViewport(renderPass.getViewport());
    }
  }

  private static bindFramebuffer(renderPass: RenderPass, rnXRModule?: RnXR) {
    const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
    const webARSystem = rnXRModule?.WebARSystem.getInstance();
    if (webXRSystem?.isWebXRMode && renderPass.isOutputForVr) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer!);
    } else if (webARSystem?.isWebARMode) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webARSystem.framebuffer!);
    } else {
      this.__webglResourceRepository.bindFramebuffer(
        renderPass.getFramebuffer()
      );
      this.__webglResourceRepository.setDrawTargets(renderPass);
    }
  }

  /**
   * Initialize the Rhodonite system.
   *
   * @remarks
   * Don't forget `await` to use this method.
   *
   * @example
   * ```
   * await Rn.System.init({
   *   approach: Rn.ProcessApproach.DataTexture,
   *   canvas: document.getElementById('world') as HTMLCanvasElement,
   * });
   * ```
   *
   * @param desc
   * @returns
   */
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
      desc.rnWebGLDebug ? desc.rnWebGLDebug : true,
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
        'Use the DataTexture/DataTexture as the argument of setProcessApproachAndCanvas method for this device.'
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

    await AbstractMaterialContent.initDefaultTextures();

    return gl;
  }

  public static get processApproach() {
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

  public static getCurrentWebGLContextWrapper() {
    return this.__webglResourceRepository?.currentWebGLContextWrapper;
  }
}
