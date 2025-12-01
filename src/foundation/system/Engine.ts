import type { Byte, PrimitiveUID } from '../../types/CommonTypes';
import { VERSION } from '../../version';
import type { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { WebGpuDeviceWrapper } from '../../webgpu/WebGpuDeviceWrapper';
import { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import type { RnXR } from '../../xr/main';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { createCameraEntity } from '../components/Camera/createCameraEntity';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { Component } from '../core/Component';
import { ComponentRepository } from '../core/ComponentRepository';
import { Config } from '../core/Config';
import { EntityRepository } from '../core/EntityRepository';
import { GlobalDataRepository } from '../core/GlobalDataRepository';
import { MemoryManager } from '../core/MemoryManager';
import { CameraType } from '../definitions/CameraType';
import { ProcessApproach, type ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStage, ProcessStageEnum } from '../definitions/ProcessStage';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { Primitive } from '../geometry/Primitive';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { initDefaultTextures } from '../materials/core/DummyTextures';
import type { Scalar } from '../math/Scalar';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { MiscUtil } from '../misc/MiscUtil';
import { Time } from '../misc/Time';
import { CGAPIResourceRepository, type ICGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Expression } from '../renderer/Expression';
import { Frame } from '../renderer/Frame';
import { RenderPass } from '../renderer/RenderPass';
import { EngineState } from './EngineState';
import { ModuleManager } from './ModuleManager';
declare const spector: any;
import type { WebARSystem } from '../../xr/WebARSystem';
import type { WebXRSystem } from '../../xr/WebXRSystem';

/**
 * The argument type for Engine.init() method.
 */
interface EngineInitDescription {
  approach: ProcessApproachEnum;
  canvas: HTMLCanvasElement;
  webglOption?: WebGLContextAttributes;
  notToDisplayRnInfoAtInit?: boolean;
}

/**
 * The system class is the entry point of the Rhodonite library.
 *
 * @example
 * ```
 * const engine = await Rn.Engine.init({
 *   approach: Rn.ProcessApproach.DataTexture,
 *   canvas: document.getElementById('world') as HTMLCanvasElement,
 * });
 *
 * ... (create something) ...
 *
 * engine.startRenderLoop((time, _myArg1, _myArg2) => {
 *   Rn.Engine.process([expression]);
 * }, myArg1, myArg2);
 * ```
 */
export class Engine {
  private __expressionForProcessAuto?: Expression;
  private __renderPassForProcessAuto?: RenderPass;
  private __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private __cgApiResourceRepository: ICGAPIResourceRepository;
  private __renderPassTickCount = 0;
  private __animationFrameId = -1;

  private __renderLoopFunc?: (time: number, ...args: any[]) => void;
  private __args: unknown[] = [];
  private __rnXRModule?: RnXR;
  private __webXRSystem: WebXRSystem;
  private __webARSystem: WebARSystem;
  private __entityRepository: EntityRepository;
  private __componentRepository: ComponentRepository;
  private __memoryManager?: MemoryManager;
  private __globalDataRepository: GlobalDataRepository;
  private __lastCameraComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastPrimitiveCount = -1;

  private constructor(
    processApproach: ProcessApproachEnum,
    cgApiResourceRepository: ICGAPIResourceRepository,
    maxGPUDataStorageSize: Byte
  ) {
    this.__processApproach = processApproach;
    this.__cgApiResourceRepository = cgApiResourceRepository;
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    this.__componentRepository = new ComponentRepository(this);
    this.__entityRepository = new EntityRepository(this);
    this.__memoryManager = MemoryManager.createInstanceIfNotCreated(this, maxGPUDataStorageSize);
    this.__webXRSystem = rnXRModule.WebXRSystem.init(this);
    this.__webARSystem = rnXRModule.WebARSystem.init(this);
    this.__globalDataRepository = GlobalDataRepository.init(this);
  }

  /**
   * Starts a render loop.
   *
   * @example
   * ```
   * Rn.Engine.startRenderLoop((time, _myArg1, _myArg2) => {
   *   Rn.Engine.process([expression]);
   * }, myArg1, myArg2);
   * ```
   *
   * @param renderLoopFunc - function to be called in each frame
   * @param args - arguments you want to be passed to renderLoopFunc
   */
  public startRenderLoop(renderLoopFunc: (time: number, ...args: any[]) => void, ...args: any[]) {
    this.__renderLoopFunc = renderLoopFunc;
    this.__args = args;
    const animationFrameObject = this.__getAnimationFrameObject();
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;

    const __renderLoopFunc = ((_time: number, xrFrame: XRFrame) => {
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
      this.__animationFrameId = animationFrameObject.requestAnimationFrame(__renderLoopFunc);
    }) as FrameRequestCallback;

    this.__animationFrameId = animationFrameObject.requestAnimationFrame(__renderLoopFunc);
  }

  private __getAnimationFrameObject(): Window | XRSession {
    let animationFrameObject: Window | XRSession | undefined = window;
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if (webXRSystem.requestedToEnterWebXR) {
      animationFrameObject = webXRSystem.xrSession;
    } else if (webARSystem.requestedToEnterWebAR) {
      animationFrameObject = webARSystem.arSession;
    }
    if (Is.not.exist(animationFrameObject)) {
      return window;
    }
    return animationFrameObject;
  }

  /**
   * Stops a existing render loop.
   */
  public stopRenderLoop() {
    const animationFrameObject = this.__getAnimationFrameObject();
    animationFrameObject.cancelAnimationFrame(this.__animationFrameId);
    this.__animationFrameId = -1;
  }

  /**
   * Restart a render loop.
   */
  public restartRenderLoop() {
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
  public processAuto(clearColor = Vector4.fromCopy4(0, 0, 0, 1)) {
    if (Is.not.exist(this.__expressionForProcessAuto)) {
      const expression = new Expression();
      const renderPassInit = new RenderPass(this);
      renderPassInit.toClearColorBuffer = true;
      renderPassInit.toClearDepthBuffer = true;
      renderPassInit.clearColor = clearColor;
      const renderPassMain = new RenderPass(this);
      expression.addRenderPasses([renderPassInit, renderPassMain]);
      this.__expressionForProcessAuto = expression;
      this.__renderPassForProcessAuto = renderPassMain;
    }
    this.__renderPassForProcessAuto!.clearEntities();
    const entities = this.__entityRepository._getEntities();
    this.__renderPassForProcessAuto!.addEntities(entities as unknown as ISceneGraphEntity[]);
    this.process([this.__expressionForProcessAuto]);
  }

  /**
   * A process method to render a scene
   *
   * @remarks
   * You need to call this method for rendering.
   *
   * @param frame/expression - a frame/expression object
   */
  public process(frame: Frame): void;
  public process(expressions: Expression[]): void;
  public process(value: any) {
    Time._processBegin();
    let expressions: Expression[] = value;
    if (value instanceof Frame) {
      expressions = value.expressions;
    }

    if (CameraComponent.current === Component.InvalidObjectUID) {
      Engine.createCamera(this);
    }

    const time = this.__globalDataRepository.getValue('time', 0) as Scalar;
    time._v[0] = Time.timeFromSystemStart;

    if (this.processApproach === ProcessApproach.WebGPU) {
      this._processWebGPU(expressions);
    } else {
      this._processWebGL(expressions);
    }

    Time._processEnd();
  }

  private _processWebGPU(expressions: Expression[]) {
    const componentTids = this.__componentRepository.getComponentTIDs();
    const webGpuResourceRepository = WebGpuResourceRepository.getInstance();
    const webxrSystem = this.__webXRSystem;
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = `common_${methodName}`;
      if (stage === ProcessStage.Render) {
        MeshRendererComponent.common_$prerender(this);
        const isWebXRMode = webxrSystem.isWebXRMode;
        const isMultiView = webxrSystem.isMultiView();
        const xrPose = EngineState.xrPoseWebGPU;
        const displayCount = isWebXRMode && !isMultiView && xrPose != null ? xrPose.views.length : 1;
        const renderPassTickCountMap = new Map<number, number>();
        const primitiveUidsMap = new Map<number, PrimitiveUID[]>();

        for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
          for (const exp of expressions) {
            for (const renderPass of exp.renderPasses) {
              const renderPassUid = renderPass.renderPassUID;
              let renderPassTickCount = renderPassTickCountMap.get(renderPassUid);
              if (renderPassTickCount === undefined) {
                renderPassTickCount = this.__renderPassTickCount;
                renderPassTickCountMap.set(renderPassUid, renderPassTickCount);
                renderPass._isChangedSortRenderResult = false;
                primitiveUidsMap.set(renderPassUid, MeshRendererComponent.sort_$render(this, renderPass));
              }

              const primitiveUids =
                primitiveUidsMap.get(renderPassUid) ?? MeshRendererComponent.sort_$render(this, renderPass);

              // Run pre-render hook per-eye (ensures per-view framebuffer adjustments)
              renderPass.doPreRender();

              // clear Framebuffer
              webGpuResourceRepository.clearFrameBuffer(this, renderPass, displayIdx);

              webGpuResourceRepository.createRenderBundleEncoder(this, renderPass, displayIdx);

              let doRender = renderPass._renderedSomethingBefore;
              if (doRender) {
                doRender = !webGpuResourceRepository.renderWithRenderBundle(this, renderPass, displayIdx);
                EngineState.webgpuRenderBundleMode ||= doRender;
              }

              if (doRender) {
                const renderedSomething = MeshRendererComponent.common_$render({
                  renderPass: renderPass,
                  renderPassTickCount,
                  primitiveUids,
                  displayIdx,
                });
                renderPass._renderedSomethingBefore = renderedSomething;
                if (renderedSomething) {
                  webGpuResourceRepository.finishRenderBundleEncoder(this, renderPass, displayIdx);
                }
              }

              renderPass._copyResolve1ToResolve2WebGpu();
              renderPass.doPostRender();

              // advance tick count only after the final display has been processed
              if (displayIdx === displayCount - 1) {
                renderPassTickCountMap.delete(renderPassUid);
                primitiveUidsMap.delete(renderPassUid);
                this.__renderPassTickCount++;
              }
            }
          }
        }
        webGpuResourceRepository.flush();
      } else {
        if (
          !EngineState.webgpuRenderBundleMode ||
          AnimationComponent.isAnimating ||
          TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
          CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount ||
          CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount ||
          Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount
        ) {
          for (const componentTid of componentTids) {
            const componentClass: typeof Component = ComponentRepository.getComponentClass(componentTid)!;

            const componentClass_commonMethod = (componentClass as any)[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({
                processApproach: this.__processApproach,
                renderPass: void 0,
                processStage: stage,
                renderPassTickCount: this.__renderPassTickCount,
                displayIdx: 0,
                engine: this,
              });
            }

            componentClass.process(this, componentClass, stage);
          }
        }
      }
    }
    this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this);
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
    this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
  }

  private _processWebGL(expressions: Expression[]) {
    // WebGL
    const repo = CGAPIResourceRepository.getWebGLResourceRepository();

    const componentTids = this.__componentRepository.getComponentTIDs();
    const renderingComponentTids = this.__componentRepository.getRenderingComponentTIDs();
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = `common_${methodName}`;
      if (stage === ProcessStage.Render) {
        MeshRendererComponent.common_$prerender(this);
        for (const exp of expressions) {
          for (const componentTid of renderingComponentTids) {
            const componentClass: typeof Component = ComponentRepository.getComponentClass(componentTid)!;
            for (const renderPass of exp.renderPasses) {
              if (typeof spector !== 'undefined') {
                spector.setMarker(`| ${exp.uniqueName}: ${renderPass.uniqueName}#`);
              }
              renderPass.doPreRender();

              repo.switchDepthTest(renderPass.isDepthTest);

              // bind Framebuffer
              this.bindFramebufferWebGL(renderPass);

              // set Viewport for Normal (Not WebXR)
              this.setViewportForNormalRendering(renderPass);

              if (componentTid === WellKnownComponentTIDs.MeshRendererComponentTID) {
                // clear Framebuffer
                this.__cgApiResourceRepository.clearFrameBuffer(this, renderPass);
              }

              renderPass._isChangedSortRenderResult = false;
              const primitiveUids = MeshRendererComponent.sort_$render(this, renderPass);
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
                    displayIdx: 0,
                    engine: this,
                  });
                  renderPass._renderedSomethingBefore = renderedSomething;
                }
              }
              if (componentTid === WellKnownComponentTIDs.EffekseerComponentTID && renderPass.entities.length > 0) {
                const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
                const currentTexture2DBindings = webGLResourceRepository.getCurrentTexture2DBindingsForEffekseer();
                webGLResourceRepository.setWebGLStateToDefaultForEffekseer();
                for (const entity of renderPass.entities) {
                  const effekseerComponent = entity.tryToGetEffekseer();
                  if (effekseerComponent != null) {
                    effekseerComponent.$render();
                  }
                }
                webGLResourceRepository.restoreTexture2DBindingsForEffekseer(currentTexture2DBindings);
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
          CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount ||
          CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount ||
          Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount
        ) {
          for (const componentTid of componentTids) {
            const componentClass: typeof Component = ComponentRepository.getComponentClass(componentTid)!;

            const componentClass_commonMethod = (componentClass as any)[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({
                processApproach: this.__processApproach,
                renderPass: void 0,
                processStage: stage,
                renderPassTickCount: this.__renderPassTickCount,
                displayIdx: 0,
                engine: this,
              });
            }

            componentClass.process(this, componentClass, stage);
          }
        }
      }
    }
    this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this);
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
    this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
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

  public static createCamera(engine: Engine) {
    const cameraEntity = createCameraEntity(engine, true);
    cameraEntity.getTransform()!.localPosition = Vector3.fromCopyArray([0, 0, 1]);
    cameraEntity.getCamera().type = CameraType.Orthographic;
    cameraEntity.getCamera().zNear = 0.1;
    cameraEntity.getCamera().zFar = 10000;
    const webCGApiRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    const [width, height] = webCGApiRepository.getCanvasSize();
    cameraEntity.getCamera().xMag = width / height;
    cameraEntity.getCamera().yMag = 1;
  }

  private setViewportForNormalRendering(renderPass: RenderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if ((!webXRSystem.isWebXRMode || !renderPass.isVrRendering) && !webARSystem.isWebARMode) {
      (this.__cgApiResourceRepository as WebGLResourceRepository).setViewport(renderPass.getViewport());
    }
  }

  private bindFramebufferWebGL(renderPass: RenderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if (webXRSystem?.isWebXRMode && renderPass.isOutputForVr) {
      const glw = (this.__cgApiResourceRepository as WebGLResourceRepository).currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer!);
    } else if (webARSystem?.isWebARMode) {
      const glw = (this.__cgApiResourceRepository as WebGLResourceRepository).currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webARSystem.framebuffer!);
    } else {
      (this.__cgApiResourceRepository as WebGLResourceRepository).bindFramebuffer(renderPass.getFramebuffer());
      (this.__cgApiResourceRepository as WebGLResourceRepository).setDrawTargets(renderPass);
    }
  }

  private __displayRnInfo() {
    console.log(
      `%cRhodonite%cWeb3D Library%c %cversion%c${VERSION.version}%c %cbranch%c${VERSION.branch}%c %cmode%c${this.__processApproach.str}`,
      'font-weight: bold; padding: 4px 8px; border-radius: 6px 0px 0px 6px; background: linear-gradient(to right, #ff0084 0%,#ff0022 100%);',
      'padding: 4px; border-radius: 0px 6px 6px 0px; background: linear-gradient(to right, #8400ff 0%,#4400ff 100%);',
      '',
      'background: #666; padding: 4px; border-radius: 6px 0px 0px 6px',
      'background: firebrick; padding: 4px; border-radius: 0px 6px 6px 0px',
      '',
      'background: #666; padding: 4px; border-radius: 6px 0px 0px 6px',
      'background: green; padding: 4px; border-radius: 0px 6px 6px 0px',
      '',
      'background: #666; padding: 4px; border-radius: 6px 0px 0px 6px',
      'background: blue; padding: 4px; border-radius: 0px 6px 6px 0px'
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
   * const engine = await Rn.Engine.init({
   *   approach: Rn.ProcessApproach.DataTexture,
   *   canvas: document.getElementById('world') as HTMLCanvasElement,
   * });
   * ```
   *
   * @param desc
   * @returns
   */
  public static async init(desc: EngineInitDescription): Promise<Engine> {
    EngineState.currentProcessApproach = desc.approach;
    await ModuleManager.getInstance().loadModule('pbr');
    await ModuleManager.getInstance().loadModule('xr');
    Config.eventTargetDom = desc.canvas;

    let maxGPUDataStorageSize: Byte = 0;
    if (desc.approach === ProcessApproach.WebGPU) {
      // WebGPU
      await ModuleManager.getInstance().loadModule('webgpu');

      const webGpuResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository() as WebGpuResourceRepository;
      const webgpuModule = ModuleManager.getInstance().getModule('webgpu');
      const WebGpuDeviceWrapperClass = webgpuModule.WebGpuDeviceWrapper as typeof WebGpuDeviceWrapper;
      const adapter = await navigator.gpu.requestAdapter({ xrCompatible: true });
      const { maxBufferSize, maxStorageBufferBindingSize } = adapter!.limits;
      const features: GPUFeatureName[] = [];
      function addFeature(feature: GPUFeatureName) {
        if (adapter!.features.has(feature)) {
          features.push(feature);
        }
      }
      addFeature('float32-filterable');
      addFeature('rg11b10ufloat-renderable');
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
      maxGPUDataStorageSize = maxStorageBufferBindingSize;
      const webGpuDeviceWrapper = new WebGpuDeviceWrapperClass(desc.canvas, adapter!, device);
      webGpuResourceRepository.addWebGpuDeviceWrapper(webGpuDeviceWrapper);
      webGpuResourceRepository.recreateSystemDepthTexture();
      webGpuResourceRepository.createBindGroupLayoutForDrawParameters();
    } else if (desc.approach === ProcessApproach.Uniform || desc.approach === ProcessApproach.DataTexture) {
      // WebGL
      await ModuleManager.getInstance().loadModule('webgl');

      const repo = CGAPIResourceRepository.getWebGLResourceRepository();
      repo.generateWebGLContext(desc.canvas, true, desc.webglOption);
      repo.switchDepthTest(true);
      maxGPUDataStorageSize = repo.currentWebGLContextWrapper!.getMaxTextureSize() ** 2 * 4 /* rgba */ * 4 /* byte */;
    } else {
      maxGPUDataStorageSize = 1024 ** 2 * 4 /* rgba */ * 4 /* byte */;
    }

    const engine = new Engine(
      desc.approach,
      CGAPIResourceRepository.getCgApiResourceRepository(),
      maxGPUDataStorageSize
    );

    if (desc.notToDisplayRnInfoAtInit !== true) {
      engine.__displayRnInfo();
    }

    const globalDataRepository = engine.__globalDataRepository;
    globalDataRepository.initialize(desc.approach);

    if (MiscUtil.isMobile() && ProcessApproach.isUniformApproach(desc.approach)) {
      Logger.warn(
        'The number of Uniform variables available on mobile devices is limited and may interfere with rendering. Use the DataTexture ProcessApproach for this device.'
      );
    }

    if (
      desc.canvas != null &&
      (desc.approach === ProcessApproach.DataTexture || desc.approach === ProcessApproach.Uniform)
    ) {
      // Deal with WebGL context lost and restore
      desc.canvas.addEventListener(
        'webglcontextlost',
        ((event: Event) => {
          // Calling preventDefault signals to the page that you intent to handle context restoration.
          event.preventDefault();
          engine.stopRenderLoop();
          Logger.error('WebGL context lost occurred.');
        }).bind(this)
      );

      desc.canvas.addEventListener('webglcontextrestored', () => {
        // Once this function is called the gl context will be restored but any graphics resources
        // that were previously loaded will be lost, so the scene should be reloaded.
        Logger.error('WebGL context restored.');
        // TODO: Implement restoring the previous graphics resources
        // loadSceneGraphics(gl);
        engine.restartRenderLoop();
      });
    }

    await initDefaultTextures();

    EngineState.viewportAspectRatio = desc.canvas != null ? desc.canvas.width / desc.canvas.height : 1;

    return engine;
  }

  public get processApproach() {
    return this.__processApproach;
  }

  public resizeCanvas(width: number, height: number) {
    const repo = CGAPIResourceRepository.getCgApiResourceRepository();
    repo.resizeCanvas(width, height);
    EngineState.viewportAspectRatio = width / height;
  }

  public getCanvasSize() {
    const repo = CGAPIResourceRepository.getCgApiResourceRepository();
    return repo.getCanvasSize();
  }

  public getCurrentWebGLContextWrapper() {
    return (this.__cgApiResourceRepository as WebGLResourceRepository).currentWebGLContextWrapper;
  }

  public get entityRepository() {
    return this.__entityRepository;
  }

  public get componentRepository() {
    return this.__componentRepository;
  }

  public get webXRSystem() {
    return this.__webXRSystem;
  }

  public get webARSystem() {
    return this.__webARSystem;
  }

  public get memoryManager() {
    return this.__memoryManager!;
  }

  public get globalDataRepository() {
    return this.__globalDataRepository;
  }
}
