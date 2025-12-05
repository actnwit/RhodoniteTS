import type { Byte, Index, ObjectUID, PrimitiveUID } from '../../types/CommonTypes';
import { VERSION } from '../../version';
import type { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { WebGpuDeviceWrapper } from '../../webgpu/WebGpuDeviceWrapper';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import type { RnXR } from '../../xr/main';
import { AnimationComponent } from '../components/Animation/AnimationComponent';
import { AnimationStateRepository } from '../components/Animation/AnimationStateRepository';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { createCameraEntity } from '../components/Camera/createCameraEntity';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { Component } from '../core/Component';
import { ComponentMemoryRegistry } from '../core/ComponentMemoryRegistry';
import { ComponentRepository } from '../core/ComponentRepository';
import { Config } from '../core/Config';
import { EntityRepository } from '../core/EntityRepository';
import { GlobalDataRepository } from '../core/GlobalDataRepository';
import { MemoryManager } from '../core/MemoryManager';
import { CameraType } from '../definitions/CameraType';
import { ProcessApproach, type ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStage, ProcessStageEnum } from '../definitions/ProcessStage';
import { Primitive } from '../geometry/Primitive';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { DummyTextures } from '../materials/core/DummyTextures';
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
import { RnObject } from '../core/RnObject';
import { MaterialRepository } from '../materials/core/MaterialRepository';
import { TranslationGizmo } from '../gizmos/TranslationGizmo';
import { ScaleGizmo } from '../gizmos/ScaleGizmo';
import { RotationGizmo } from '../gizmos/RotationGizmo';
import { AABBGizmo } from '../gizmos/AABBGizmo';
import { LocatorGizmo } from '../gizmos/LocatorGizmo';
import { AbstractMaterialContent } from '../materials/core/AbstractMaterialContent';
import { _cleanupWebGLStatesCacheForEngine } from '../../webgl/WebGLStrategyCommonMethod';

/**
 * The argument type for Engine.init() method.
 */
interface EngineInitDescription {
  approach: ProcessApproachEnum;
  canvas: HTMLCanvasElement;
  webglOption?: WebGLContextAttributes;
  notToDisplayRnInfoAtInit?: boolean;
  config?: Config;
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
export class Engine extends RnObject {
  private __expressionForProcessAuto?: Expression;
  private __renderPassForProcessAuto?: RenderPass;
  private __processApproach: ProcessApproachEnum = ProcessApproach.None;
  private __cgApiResourceRepository: ICGAPIResourceRepository;
  private __webglResourceRepository?: WebGLResourceRepository;
  private __webGpuResourceRepository?: WebGpuResourceRepository;
  private __engineState = new EngineState();
  private __renderPassTickCount = 0;
  private __animationFrameId = -1;

  private __renderLoopFunc?: (time: number, ...args: any[]) => void;
  private __args: unknown[] = [];
  private __webXRSystem: WebXRSystem;
  private __webARSystem: WebARSystem;
  private __entityRepository: EntityRepository;
  private __componentRepository: ComponentRepository;
  private __componentMemoryRegistry: ComponentMemoryRegistry;
  private __memoryManager?: MemoryManager;
  private __materialRepository: MaterialRepository;
  private __globalDataRepository: GlobalDataRepository;
  private __config: Config;
  private __logger: Logger;
  private __dummyTextures?: DummyTextures;
  private __lastCameraComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastPrimitiveCount = -1;
  /** Shader program cache map for this engine instance. Maps shader text to program UIDs. */
  private __shaderProgramCache: Map<string, number> = new Map();
  private static __engines: Map<ObjectUID, Engine> = new Map();
  private static __engineCount = 0;
  private __engineUid: Index = -1;

  private constructor(
    processApproach: ProcessApproachEnum,
    cgApiResourceRepository: ICGAPIResourceRepository,
    maxGPUDataStorageSize: Byte,
    config?: Config
  ) {
    super();
    this.__config = config ?? new Config();
    this.__logger = new Logger();
    this.__logger.logLevel = this.__config.logLevel;
    this.__engineUid = Engine.__engineCount;
    this.__processApproach = processApproach;
    this.__cgApiResourceRepository = cgApiResourceRepository;
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    this.__componentMemoryRegistry = new ComponentMemoryRegistry();
    this.__componentRepository = new ComponentRepository(this);
    this.__entityRepository = new EntityRepository(this);
    this.__materialRepository = new MaterialRepository();
    this.__memoryManager = MemoryManager.createInstanceIfNotCreated(this, maxGPUDataStorageSize);
    this.__webXRSystem = rnXRModule.WebXRSystem.init(this);
    this.__webARSystem = rnXRModule.WebARSystem.init(this);
    this.__globalDataRepository = GlobalDataRepository.init(this);
    Engine.__engineCount++;
  }

  public get engineUid() {
    return this.__engineUid;
  }

  public static getEngine(objectUid: ObjectUID) {
    const engine = Engine.__engines.get(objectUid);
    if (Is.not.exist(engine)) {
      return undefined;
    }
    return engine;
  }

  /**
   * Destroys the engine and releases all associated resources.
   *
   * @remarks
   * This method performs a comprehensive cleanup of all engine resources including:
   * - Stopping the render loop
   * - Deleting all entities and their components
   * - Destroying all textures (including dummy textures)
   * - Clearing material repository data
   * - Releasing GPU resources (WebGL/WebGPU)
   * - Clearing memory manager buffers
   *
   * After calling this method, the engine instance should not be used.
   *
   * @example
   * ```typescript
   * const engine = await Rn.Engine.init({ ... });
   * // ... use the engine ...
   * engine.destroy(); // Clean up all resources
   * ```
   */
  /**
   * Destroys the engine and releases all associated resources.
   *
   * @remarks
   * This method performs a comprehensive cleanup of all engine resources including:
   * - Stopping the render loop
   * - Invalidating all shader caches in materials
   * - Deleting all entities and their components
   * - Destroying all textures (including dummy textures)
   * - Clearing material repository data
   * - Releasing GPU resources (WebGL/WebGPU)
   * - Clearing memory manager buffers
   *
   * After calling this method, the engine instance should not be used.
   */
  public destroy(): void {
    this.stopRenderLoop();
    this.__renderLoopFunc = undefined;
    this.__args = [];
    this.__destroyResources();
  }

  /**
   * Internal method that performs the actual resource cleanup.
   * Called after the render loop has fully stopped.
   */
  private __destroyResources(): void {
    // Invalidate all shader caches in materials before deleting entities
    // This ensures shaders will be recompiled with new WebGL resources on next engine init
    this.__materialRepository._makeShaderInvalidateToAllMaterials();

    // Delete all entities (this also cleans up all components)
    const entities = this.__entityRepository._getEntities();
    for (const entity of entities) {
      this.__entityRepository.deleteEntity(entity.entityUID);
    }

    // Destroy dummy textures
    if (Is.exist(this.__dummyTextures)) {
      this.__dummyTextures.destroy();
      this.__dummyTextures = undefined;
    }

    // Clear WebGPU cache and unconfigure context if using WebGPU
    if (Is.exist(this.__webGpuResourceRepository)) {
      this.__webGpuResourceRepository.clearCache();
      // Unconfigure the WebGPU canvas context to allow it to be reconfigured on next init
      try {
        const deviceWrapper = this.__webGpuResourceRepository.getWebGpuDeviceWrapper();
        if (deviceWrapper) {
          deviceWrapper.context.unconfigure();
        }
      } catch (_e) {
        // Ignore errors if device wrapper is not available
      }
    }

    // Destroy memory manager and release allocated buffers
    if (Is.exist(this.__memoryManager)) {
      this.__memoryManager.destroy();
      this.__memoryManager = undefined;
    }

    // Clean up static resources in components that use Engine-keyed maps
    AnimationStateRepository._cleanupForEngine(this);
    AnimationComponent._cleanupForEngine(this);
    TransformComponent._cleanupForEngine(this);
    SceneGraphComponent._cleanupForEngine(this);
    CameraControllerComponent._cleanupForEngine(this);
    CameraComponent._cleanupForEngine(this);
    MeshRendererComponent._cleanupForEngine(this);

    // Clean up gizmo resources that are managed per-Engine
    TranslationGizmo._cleanupForEngine(this);
    ScaleGizmo._cleanupForEngine(this);
    RotationGizmo._cleanupForEngine(this);
    AABBGizmo._cleanupForEngine(this);
    LocatorGizmo._cleanupForEngine(this);

    // Clean up material content caches for this engine
    AbstractMaterialContent._cleanupForEngine(this);

    // Clean up WebGL state cache for this engine (blend modes, cull face, etc.)
    _cleanupWebGLStatesCacheForEngine(this);

    // Clear component memory registry
    this.__componentMemoryRegistry.destroy();

    // Clear expressions and render passes used for processAuto
    this.__expressionForProcessAuto = undefined;
    this.__renderPassForProcessAuto = undefined;

    // Reset internal state
    this.__renderPassTickCount = 0;
    this.__lastCameraComponentsUpdateCount = -1;
    this.__lastCameraControllerComponentsUpdateCount = -1;
    this.__lastTransformComponentsUpdateCount = -1;
    this.__lastPrimitiveCount = -1;

    // Remove from static engines map and unregister
    Engine.__engines.delete(this.objectUID);
    this.unregister();
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

    if (CameraComponent.getCurrent(this) === Component.InvalidObjectUID) {
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
    const webGpuResourceRepository = this.webGpuResourceRepository;
    const webxrSystem = this.__webXRSystem;
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = `common_${methodName}`;
      if (stage === ProcessStage.Render) {
        MeshRendererComponent.common_$prerender(this);
        const isWebXRMode = webxrSystem.isWebXRMode;
        const isMultiView = webxrSystem.isMultiView();
        const xrPose = this.__engineState.xrPoseWebGPU;
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
                this.__engineState.webgpuRenderBundleMode ||= doRender;
              }

              if (doRender) {
                const renderedSomething = MeshRendererComponent.common_$render({
                  renderPass: renderPass,
                  renderPassTickCount,
                  primitiveUids,
                  displayIdx,
                  engine: this,
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
          !this.__engineState.webgpuRenderBundleMode ||
          AnimationComponent.getIsAnimating(this) ||
          TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount ||
          CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount ||
          CameraControllerComponent.getUpdateCount(this) !== this.__lastCameraControllerComponentsUpdateCount ||
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
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this);
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this);
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
  }

  private _processWebGL(expressions: Expression[]) {
    // WebGL
    const repo = this.webglResourceRepository;

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
                const webGLResourceRepository = this.webglResourceRepository;
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
          AnimationComponent.getIsAnimating(this) ||
          TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount ||
          CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount ||
          CameraControllerComponent.getUpdateCount(this) !== this.__lastCameraControllerComponentsUpdateCount ||
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
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this);
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this);
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
    const webCGApiRepository = engine.cgApiResourceRepository;
    const [width, height] = webCGApiRepository.getCanvasSize();
    cameraEntity.getCamera().xMag = width / height;
    cameraEntity.getCamera().yMag = 1;
  }

  private setViewportForNormalRendering(renderPass: RenderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if ((!webXRSystem.isWebXRMode || !renderPass.isVrRendering) && !webARSystem.isWebARMode) {
      (this.__cgApiResourceRepository as WebGLResourceRepository).setViewport(this, renderPass.getViewport());
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
    await ModuleManager.getInstance().loadModule('pbr');
    await ModuleManager.getInstance().loadModule('xr');

    let maxGPUDataStorageSize: Byte = 0;
    let cgApiResourceRepository: ICGAPIResourceRepository | undefined;
    if (desc.approach === ProcessApproach.WebGPU) {
      // WebGPU
      await ModuleManager.getInstance().loadModule('webgpu');

      const webGpuResourceRepository =
        CGAPIResourceRepository.getWebGpuResourceRepository() as WebGpuResourceRepository;
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
      cgApiResourceRepository = webGpuResourceRepository;
    } else if (desc.approach === ProcessApproach.Uniform || desc.approach === ProcessApproach.DataTexture) {
      // WebGL
      await ModuleManager.getInstance().loadModule('webgl');

      cgApiResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      (cgApiResourceRepository as WebGLResourceRepository).generateWebGLContext(
        desc.config ?? new Config(),
        desc.canvas,
        true,
        desc.webglOption
      );
      (cgApiResourceRepository as WebGLResourceRepository).switchDepthTest(true);
      maxGPUDataStorageSize =
        (cgApiResourceRepository as WebGLResourceRepository).currentWebGLContextWrapper!.getMaxTextureSize() ** 2 *
        4 /* rgba */ *
        4 /* byte */;
    } else {
      maxGPUDataStorageSize = 1024 ** 2 * 4 /* rgba */ * 4 /* byte */;
    }

    const engine = new Engine(desc.approach, cgApiResourceRepository!, maxGPUDataStorageSize, desc.config);
    engine.__engineState.currentProcessApproach = desc.approach;
    engine.__config.eventTargetDom = engine.__config.eventTargetDom ?? desc.canvas;
    if (desc.approach === ProcessApproach.WebGPU) {
      engine.__webGpuResourceRepository = cgApiResourceRepository as WebGpuResourceRepository;
    }
    if (desc.approach === ProcessApproach.Uniform || desc.approach === ProcessApproach.DataTexture) {
      engine.__webglResourceRepository = cgApiResourceRepository as WebGLResourceRepository;
    }
    engine.__cgApiResourceRepository = cgApiResourceRepository!;

    if (desc.notToDisplayRnInfoAtInit !== true) {
      engine.__displayRnInfo();
    }

    const globalDataRepository = engine.__globalDataRepository;
    globalDataRepository.initialize(desc.approach);

    if (MiscUtil.isMobile() && ProcessApproach.isUniformApproach(desc.approach)) {
      engine.logger.warn(
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
          engine.logger.error('WebGL context lost occurred.');
        }).bind(this)
      );

      desc.canvas.addEventListener('webglcontextrestored', () => {
        // Once this function is called the gl context will be restored but any graphics resources
        // that were previously loaded will be lost, so the scene should be reloaded.
        engine.logger.error('WebGL context restored.');
        // TODO: Implement restoring the previous graphics resources
        // loadSceneGraphics(gl);
        engine.restartRenderLoop();
      });
    }

    engine.__dummyTextures = await DummyTextures.init(engine);

    engine.__engineState.viewportAspectRatio = desc.canvas != null ? desc.canvas.width / desc.canvas.height : 1;

    return engine;
  }

  public get processApproach() {
    return this.__processApproach;
  }

  public resizeCanvas(width: number, height: number) {
    const repo = this.cgApiResourceRepository;
    repo.resizeCanvas(width, height);
    this.__engineState.viewportAspectRatio = width / height;
  }

  public getCanvasSize() {
    const repo = this.cgApiResourceRepository;
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

  public get componentMemoryRegistry() {
    return this.__componentMemoryRegistry;
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

  public get materialRepository() {
    return this.__materialRepository;
  }

  public get webglResourceRepository() {
    return this.__webglResourceRepository!;
  }

  public get cgApiResourceRepository() {
    return this.__cgApiResourceRepository;
  }

  public get webGpuResourceRepository() {
    return this.__webGpuResourceRepository!;
  }

  public get dummyTextures() {
    return this.__dummyTextures!;
  }

  public get engineState() {
    return this.__engineState;
  }

  public get config() {
    return this.__config;
  }

  public get logger() {
    return this.__logger;
  }

  /**
   * Gets the shader program cache for this engine instance.
   * This cache maps shader text to compiled shader program UIDs.
   * Each engine has its own cache to prevent cross-contamination between WebGL contexts.
   * @internal
   */
  public get shaderProgramCache(): Map<string, number> {
    return this.__shaderProgramCache;
  }
}
