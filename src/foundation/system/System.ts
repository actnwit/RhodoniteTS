import { ProcessStage, ProcessStageEnum } from '../definitions/ProcessStage';
import { ComponentRepository } from '../core/ComponentRepository';
import { ProcessApproachEnum, ProcessApproach } from '../definitions/ProcessApproach';
import { ModuleManager } from './ModuleManager';
import {
  CGAPIResourceRepository,
  ICGAPIResourceRepository,
} from '../renderer/CGAPIResourceRepository';
import { Component } from '../core/Component';
import { Expression } from '../renderer/Expression';
import { EntityRepository } from '../core/EntityRepository';
import { MemoryManager } from '../core/MemoryManager';
import { GlobalDataRepository } from '../core/GlobalDataRepository';
import { Vector3 } from '../math/Vector3';
import { CameraType } from '../definitions/CameraType';
import { Time } from '../misc/Time';
import { SystemState } from './SystemState';
import { MiscUtil } from '../misc/MiscUtil';
import type { RnXR } from '../../xr/main';
import { Is } from '../misc/Is';
import { EntityHelper, ISceneGraphEntity } from '../helpers/EntityHelper';
import { Config } from '../core/Config';
import { Frame } from '../renderer/Frame';
import { Vector4 } from '../math/Vector4';
import { RenderPass } from '../renderer/RenderPass';
import { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { initDefaultTextures } from '../materials/core/DummyTextures';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import { WebGpuDeviceWrapper } from '../../webgpu/WebGpuDeviceWrapper';
import { WebGpuStrategyBasic } from '../../webgpu/WebGpuStrategyBasic';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { Primitive } from '../geometry/Primitive';
import { VERSION } from '../../version';
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
  notToDisplayRnInfoAtInit?: boolean;
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
  private static __expressionForProcessAuto?: Expression;
  private static __renderPassForProcessAuto?: RenderPass;
  private static __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private static __cgApiResourceRepository: ICGAPIResourceRepository;
  private static __renderPassTickCount = 0;
  private static __animationFrameId = -1;

  private static __renderLoopFunc?: (time: number, ...args: any[]) => void;
  private static __args: unknown[] = [];
  private static __rnXRModule?: RnXR;

  private static __lastCameraControllerComponentsUpdateCount = -1;
  private static __lastTransformComponentsUpdateCount = -1;
  private static __lastPrimitiveCount = -1;

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
    if (this.__rnXRModule === undefined) {
      this.__rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    }

    this.__animationFrameId = animationFrameObject.requestAnimationFrame(((
      _time: number,
      xrFrame: XRFrame
    ) => {
      if (this.__rnXRModule !== undefined) {
        const webXRSystem = this.__rnXRModule.WebXRSystem.getInstance();
        const webARSystem = this.__rnXRModule.WebARSystem.getInstance();
        if (webXRSystem.isReadyForWebXR) {
          webXRSystem._preRender(_time, xrFrame);
          renderLoopFunc.apply(renderLoopFunc, [_time, ...args]);
          webXRSystem._postRender();
        } else if (webARSystem.isReadyForWebAR) {
          webARSystem._preRender(_time, xrFrame);
          renderLoopFunc.apply(renderLoopFunc, [_time, ...args]);
          webARSystem._preRender(_time, xrFrame);
        } else {
          renderLoopFunc.apply(renderLoopFunc, [_time, ...args]);
        }
      } else {
        renderLoopFunc.apply(renderLoopFunc, [_time, ...args]);
      }

      this.startRenderLoop(renderLoopFunc, ...args);
    }) as FrameRequestCallback);
  }

  private static __getAnimationFrameObject(): Window | XRSession {
    let animationFrameObject: Window | XRSession | undefined = window;
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR | undefined;
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
    System.__renderPassForProcessAuto!.addEntities(entities as unknown as ISceneGraphEntity[]);
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
    Time._processBegin();
    let expressions: Expression[] = value;
    if (value instanceof Frame) {
      expressions = value.expressions;
    }

    if (CameraComponent.current === Component.InvalidObjectUID) {
      System.createCamera();
    }

    if (this.processApproach === ProcessApproach.WebGPU) {
      const componentTids = ComponentRepository.getComponentTIDs();
      const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
      for (const stage of Component._processStages) {
        const methodName = stage.methodName;
        const commonMethodName = 'common_' + methodName;
        if (stage === ProcessStage.Render) {
          const webGpuStrategyBasic = WebGpuStrategyBasic.getInstance();
          MeshRendererComponent.common_$prerender();
          for (const exp of expressions) {
            for (const renderPass of exp.renderPasses) {
              // clear Framebuffer
              this.__cgApiResourceRepository.clearFrameBuffer(renderPass);

              renderPass._isChangedSortRenderResult = false;
              const primitiveUids = MeshRendererComponent.sort_$render(renderPass);
              let doRender = renderPass._renderedSomethingBefore;
              if (doRender) {
                doRender = !webGpuStrategyBasic.renderWithRenderBundle(renderPass);
                SystemState.webgpuRenderBundleMode ||= doRender;
              }

              if (doRender) {
                const renderedSomething = MeshRendererComponent.common_$render({
                  renderPass: renderPass,
                  processStage: stage,
                  renderPassTickCount: this.__renderPassTickCount,
                  primitiveUids,
                });
                renderPass._renderedSomethingBefore = renderedSomething;
                if (renderedSomething) {
                  webGpuResourceRepository.finishRenderBundleEncoder(renderPass);
                }
              }
              renderPass._copyResolve1ToResolve2WebGpu();
              renderPass.doPostRender();
              this.__renderPassTickCount++;
            }
          }
          webGpuResourceRepository.flush();
        } else {
          if (
            !SystemState.webgpuRenderBundleMode ||
            AnimationComponent.isAnimating ||
            TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
            CameraControllerComponent.updateCount !==
              this.__lastCameraControllerComponentsUpdateCount
          ) {
            for (const componentTid of componentTids) {
              const componentClass: typeof Component =
                ComponentRepository.getComponentClass(componentTid)!;

              const componentClass_commonMethod = (componentClass as any)[commonMethodName];
              if (componentClass_commonMethod) {
                componentClass_commonMethod({
                  processApproach: this.__processApproach,
                  renderPass: void 0,
                  processStage: stage,
                  renderPassTickCount: this.__renderPassTickCount,
                });
              }

              componentClass.process(componentClass, stage);
            }
          }
        }
      }
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
    } else {
      const repo = CGAPIResourceRepository.getWebGLResourceRepository();
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR | undefined;

      const componentTids = ComponentRepository.getComponentTIDs();
      const renderingComponentTids = ComponentRepository.getRenderingComponentTIDs();
      for (const stage of Component._processStages) {
        const methodName = stage.methodName;
        const commonMethodName = 'common_' + methodName;
        if (stage === ProcessStage.Render) {
          MeshRendererComponent.common_$prerender();
          for (const exp of expressions) {
            for (const componentTid of renderingComponentTids) {
              const componentClass: typeof Component =
                ComponentRepository.getComponentClass(componentTid)!;
              for (const renderPass of exp.renderPasses) {
                if (typeof spector !== 'undefined') {
                  spector.setMarker(`| ${exp.uniqueName}: ${renderPass.uniqueName}#`);
                }
                repo.switchDepthTest(renderPass.isDepthTest);

                if (componentTid === WellKnownComponentTIDs.MeshRendererComponentTID) {
                  // bind Framebuffer
                  System.bindFramebufferWebGL(renderPass, rnXRModule);

                  // set Viewport for Normal (Not WebXR)
                  System.setViewportForNormalRendering(renderPass, rnXRModule);
                }
                if (componentTid === WellKnownComponentTIDs.MeshRendererComponentTID) {
                  // clear Framebuffer
                  this.__cgApiResourceRepository.clearFrameBuffer(renderPass);
                }

                renderPass._isChangedSortRenderResult = false;
                const primitiveUids = MeshRendererComponent.sort_$render(renderPass);
                let doRender = renderPass._renderedSomethingBefore;
                if (doRender) {
                  const componentClass_commonMethod = (componentClass as any)[commonMethodName];
                  if (componentClass_commonMethod) {
                    const renderedSomething = componentClass_commonMethod({
                      processApproach: this.__processApproach,
                      renderPass: renderPass,
                      processStage: stage,
                      renderPassTickCount: this.__renderPassTickCount,
                      primitiveUids,
                    });
                    renderPass._renderedSomethingBefore = renderedSomething;
                  }

                  if (componentTid !== WellKnownComponentTIDs.MeshRendererComponentTID) {
                    componentClass.process(componentClass, stage);
                  }
                }
                this.__renderPassTickCount++;

                renderPass._copyFramebufferToResolveFramebuffersWebGL();

                renderPass.doPostRender();
              }
            }
          }
        } else {
          if (
            AnimationComponent.isAnimating ||
            TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
            CameraControllerComponent.updateCount !==
              this.__lastCameraControllerComponentsUpdateCount ||
            Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount
          ) {
            for (const componentTid of componentTids) {
              const componentClass: typeof Component =
                ComponentRepository.getComponentClass(componentTid)!;

              const componentClass_commonMethod = (componentClass as any)[commonMethodName];
              if (componentClass_commonMethod) {
                componentClass_commonMethod({
                  processApproach: this.__processApproach,
                  renderPass: void 0,
                  processStage: stage,
                  renderPassTickCount: this.__renderPassTickCount,
                });
              }

              componentClass.process(componentClass, stage);
            }
          }
        }
      }
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
      this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
    }

    Time._processEnd();
  }

  static get processTime() {
    return Time.lastTimeTimeIntervalInMilliseconds;
  }

  static get timeAtProcessBegin() {
    return Time.timeAtProcessBeginMilliseconds;
  }

  static get timeAtProcessEnd() {
    return Time.timeAtProcessEndMilliseconds;
  }

  private static createCamera() {
    const cameraEntity = EntityHelper.createCameraEntity();
    cameraEntity.getTransform()!.localPosition = Vector3.fromCopyArray([0, 0, 1]);
    cameraEntity.getCamera().type = CameraType.Orthographic;
    cameraEntity.getCamera().zNear = 0.1;
    cameraEntity.getCamera().zFar = 10000;
    const webCGApiRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const [width, height] = webCGApiRepository.getCanvasSize();
    cameraEntity.getCamera().xMag = width / height;
    cameraEntity.getCamera().yMag = 1;
  }

  private static setViewportForNormalRendering(renderPass: RenderPass, rnXRModule?: RnXR) {
    const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
    const webARSystem = rnXRModule?.WebARSystem.getInstance();
    if ((!webXRSystem?.isWebXRMode || !renderPass.isVrRendering) && !webARSystem?.isWebARMode) {
      (this.__cgApiResourceRepository as WebGLResourceRepository).setViewport(
        renderPass.getViewport()
      );
    }
  }

  private static bindFramebufferWebGL(renderPass: RenderPass, rnXRModule?: RnXR) {
    const webXRSystem = rnXRModule?.WebXRSystem.getInstance();
    const webARSystem = rnXRModule?.WebARSystem.getInstance();
    if (webXRSystem?.isWebXRMode && renderPass.isOutputForVr) {
      const glw = (this.__cgApiResourceRepository as WebGLResourceRepository)
        .currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer!);
    } else if (webARSystem?.isWebARMode) {
      const glw = (this.__cgApiResourceRepository as WebGLResourceRepository)
        .currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webARSystem.framebuffer!);
    } else {
      (this.__cgApiResourceRepository as WebGLResourceRepository).bindFramebuffer(
        renderPass.getFramebuffer()
      );
      (this.__cgApiResourceRepository as WebGLResourceRepository).setDrawTargets(renderPass);
    }
  }

  private static __displayRnInfo() {
    console.log(
      `%cRhodonite%cWeb3D Library%c %cversion%c${VERSION.version}%c %cbranch%c${VERSION.branch}`,
      `font-weight: bold; padding: 4px 8px; border-radius: 6px 0px 0px 6px; background: linear-gradient(to right, #ff0084 0%,#ff0022 100%);`,
      `padding: 4px; border-radius: 0px 6px 6px 0px; background: linear-gradient(to right, #8400ff 0%,#4400ff 100%);`,
      ``,
      `background: #666; padding: 4px; border-radius: 6px 0px 0px 6px`,
      `background: firebrick; padding: 4px; border-radius: 0px 6px 6px 0px`,
      ``,
      `background: #666; padding: 4px; border-radius: 6px 0px 0px 6px`,
      `background: green; padding: 4px; border-radius: 0px 6px 6px 0px`
    );
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
  public static async init(desc: SystemInitDescription): Promise<void> {
    if (desc.notToDisplayRnInfoAtInit !== true) {
      this.__displayRnInfo();
    }
    await ModuleManager.getInstance().loadModule('webgl');
    await ModuleManager.getInstance().loadModule('webgpu');
    await ModuleManager.getInstance().loadModule('pbr');
    await ModuleManager.getInstance().loadModule('xr');
    this.__processApproach = desc.approach;
    SystemState.currentProcessApproach = desc.approach;
    Config.eventTargetDom = desc.canvas;

    // Memory Settings
    MemoryManager.createInstanceIfNotCreated({
      cpuGeneric: Is.exist(desc.memoryUsageOrder) ? desc.memoryUsageOrder.cpuGeneric : 0.1,
      gpuInstanceData: Is.exist(desc.memoryUsageOrder)
        ? desc.memoryUsageOrder.gpuInstanceData
        : 0.5,
      gpuVertexData: Is.exist(desc.memoryUsageOrder) ? desc.memoryUsageOrder.gpuVertexData : 0.5,
    });

    System.__cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    if (desc.approach === ProcessApproach.WebGPU) {
      // WebGPU

      const memoryManager = MemoryManager.getInstance();
      const requiredBufferSize = memoryManager.getMemorySize();

      const webGpuResourceRepository =
        CGAPIResourceRepository.getCgApiResourceRepository() as WebGpuResourceRepository;
      const module = ModuleManager.getInstance().getModule('webgpu');
      const WebGpuDeviceWrapperClass = module.WebGpuDeviceWrapper as typeof WebGpuDeviceWrapper;
      const adapter = await navigator.gpu.requestAdapter();
      const { maxBufferSize, maxStorageBufferBindingSize } = adapter!.limits;
      if (maxBufferSize < requiredBufferSize || maxStorageBufferBindingSize < requiredBufferSize) {
        throw new Error('The required buffer size is too large for this device.');
      }
      const features: GPUFeatureName[]  = [];
      function addFeature(feature: GPUFeatureName) {
        if (adapter!.features.has(feature)) {
          features.push(feature);
        }
      }
      addFeature('float32-filterable');
      addFeature('texture-compression-bc');
      addFeature('texture-compression-etc2');
      addFeature('texture-compression-astc');

      const device = await adapter!.requestDevice({
        requiredFeatures: features,
        requiredLimits: {
          maxStorageBufferBindingSize,
          maxBufferSize,
        },
      });
      const webGpuDeviceWrapper = new WebGpuDeviceWrapperClass(desc.canvas, adapter!, device);
      webGpuResourceRepository.addWebGpuDeviceWrapper(webGpuDeviceWrapper);
      webGpuResourceRepository.recreateSystemDepthTexture();
      webGpuResourceRepository.createUniformMorphOffsetsBuffer();
      webGpuResourceRepository.createUniformMorphWeightsBuffer();
    } else {
      // WebGL
      const repo = CGAPIResourceRepository.getWebGLResourceRepository();
      repo.generateWebGLContext(desc.canvas, true, desc.webglOption);
      repo.switchDepthTest(true);
    }

    const globalDataRepository = GlobalDataRepository.getInstance();
    globalDataRepository.initialize(desc.approach);

    if (MiscUtil.isMobile() && ProcessApproach.isUniformApproach(desc.approach)) {
      console.warn(
        'The number of Uniform variables available on mobile devices is limited and may interfere with rendering. Use the DataTexture ProcessApproach for this device.'
      );
    }

    // Deal with WebGL context lost and restore
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

    await initDefaultTextures();

    SystemState.viewportAspectRatio = desc.canvas.width / desc.canvas.height;
  }

  public static get processApproach() {
    return this.__processApproach;
  }

  public static resizeCanvas(width: number, height: number) {
    const repo = CGAPIResourceRepository.getCgApiResourceRepository();
    repo.resizeCanvas(width, height);
    SystemState.viewportAspectRatio = width / height;
  }

  public static getCanvasSize() {
    const repo = CGAPIResourceRepository.getCgApiResourceRepository();
    return repo.getCanvasSize();
  }

  public static getCurrentWebGLContextWrapper() {
    return (this.__cgApiResourceRepository as WebGLResourceRepository).currentWebGLContextWrapper;
  }
}
