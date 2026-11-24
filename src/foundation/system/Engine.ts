import type { EffekseerComponent } from '../../effekseer/EffekseerComponent';
import type { Byte, Index, ObjectUID, PrimitiveUID } from '../../types/CommonTypes';
import { VERSION } from '../../version';
import type { WebGLResourceRepository } from '../../webgl/WebGLResourceRepository';
import type { WebGpuDeviceWrapper } from '../../webgpu/WebGpuDeviceWrapper';
import type { WebGpuResourceRepository } from '../../webgpu/WebGpuResourceRepository';
import type { RnXR } from '../../xr/main';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { createCameraEntity } from '../components/Camera/createCameraEntity';
import { LightComponent } from '../components/Light/LightComponent';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { MeshRendererComponent } from '../components/MeshRenderer/MeshRendererComponent';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { SkeletalComponent } from '../components/Skeletal/SkeletalComponent';
import { TransformComponent } from '../components/Transform/TransformComponent';
import { WellKnownComponentTIDs } from '../components/WellKnownComponentTIDs';
import { Component } from '../core/Component';
import { ComponentMemoryRegistry } from '../core/ComponentMemoryRegistry';
import { ComponentRepository } from '../core/ComponentRepository';
import { _getComponentRuntimeHooks } from '../core/ComponentRuntimeHooks';
import { Config } from '../core/Config';
import { EntityRepository } from '../core/EntityRepository';
import { GlobalDataRepository } from '../core/GlobalDataRepository';
import { MemoryManager } from '../core/MemoryManager';
import { CameraType } from '../definitions/CameraType';
import { ProcessApproach, type ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStage } from '../definitions/ProcessStage';
import { Primitive } from '../geometry/Primitive';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import { DummyTextures } from '../materials/core/DummyTextures';
import type { Scalar } from '../math/Scalar';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { Time } from '../misc/Time';
import { _getPhysicsBackend } from '../physics/PhysicsBackend';
import { CGAPIResourceRepository, type ICGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { Expression } from '../renderer/Expression';
import { Frame } from '../renderer/Frame';
import type { ILightClusterSystem } from '../renderer/lightCluster/LightClusterSystemStub';
import { LightClusterSystemStub } from '../renderer/lightCluster/LightClusterSystemStub';
import { RenderPass } from '../renderer/RenderPass';
import { EngineState } from './EngineState';
import { ModuleManager } from './ModuleManager';

declare const spector: any;

import { WebGLGpuTimer } from '../../webgl/WebGLGpuTimer';
import { _cleanupWebGLStatesCacheForEngine } from '../../webgl/WebGLStrategyCommonMethod';
import type { WebARSystem } from '../../xr/WebARSystem';
import type { WebXRSystem } from '../../xr/WebXRSystem';
import { RnObject } from '../core/RnObject';
import { _cleanupGizmosForEngine } from '../gizmos/GizmoRegistry';
import { _cleanupRenderPassHelperForEngine } from '../helpers/RenderPassHelper';
import { AbstractMaterialContent } from '../materials/core/AbstractMaterialContent';
import { MaterialRepository } from '../materials/core/MaterialRepository';

type WebGPUExternalRenderPassOptions = { colorFormat?: GPUTextureFormat; depthFormat?: GPUTextureFormat };

type DeferredEffekseerWebGPURenderJob = {
  renderPass: RenderPass;
  displayIdx: number;
  renderPassOptions?: WebGPUExternalRenderPassOptions;
  effekseerComponents: EffekseerComponent[];
};

/**
 * The argument type for Engine.init() method.
 */
interface EngineInitDescription {
  approach: ProcessApproachEnum;
  canvas: HTMLCanvasElement;
  webglOption?: WebGLContextAttributes;
  notToDisplayRnInfoAtInit?: boolean;
  config?: Config;
  /**
   * Loads the WebXR/WebAR support (`engine.webXRSystem`, `engine.webARSystem`) during initialization.
   * Defaults to false for named imports, and to true when the default `Rn` namespace export is used.
   * It can also be enabled later with `await engine.enableXR()`.
   */
  xr?: boolean;
}

/**
 * The system class is the entry point of the Rhodonite library.
 *
 * @example
 * ```
 * const engine = await Rn.Engine.init({
 *   approach: Rn.ProcessApproach.WebGL2,
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
  /** The object (Window or XRSession) that owns the current animation frame callback. */
  private __animationFrameObject?: Window | XRSession;

  private __renderLoopFunc?: (time: number, ...args: any[]) => void;
  private __args: unknown[] = [];
  private __webXRSystem?: WebXRSystem;
  private __webARSystem?: WebARSystem;
  /**
   * Whether `Engine.init` loads the XR support when `EngineInitDescription.xr` is omitted.
   * The default `Rn` namespace export sets it to true for compatibility.
   * @internal
   */
  static _loadXRByDefault = false;
  private __entityRepository: EntityRepository;
  private __componentRepository: ComponentRepository;
  private __componentMemoryRegistry: ComponentMemoryRegistry;
  private __memoryManager?: MemoryManager;
  private __materialRepository: MaterialRepository;
  private __globalDataRepository: GlobalDataRepository;
  private __lightClusterSystem: ILightClusterSystem = new LightClusterSystemStub();
  private __lightClusterSystemPromise?: Promise<void>;
  private __isLightClusterSystemLoaded = false;
  private __isDestroyed = false;
  private __config: Config;
  private __logger: Logger;
  private __dummyTextures?: DummyTextures;
  private __lastCameraComponentsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastPrimitiveCount = -1;
  private __lastLightComponentsUpdateCount = -1;
  /** Shader program cache map for this engine instance. Maps shader text to program UIDs. */
  private __shaderProgramCache: Map<string, number> = new Map();
  private __gpuTimerEnabled = false;
  private __webglGpuTimer?: WebGLGpuTimer;
  private static __engines: Map<ObjectUID, Engine> = new Map();
  private static __engineCount = 0;
  private __engineUid: Index = -1;

  private constructor(
    processApproach: ProcessApproachEnum,
    cgApiResourceRepository: ICGAPIResourceRepository,
    maxGPUDataStorageSize: Byte,
    config?: Config,
    rnXRModule?: RnXR
  ) {
    super();
    this.__config = config ?? new Config();
    this.__logger = new Logger();
    this.__logger.logLevel = this.__config.logLevel;
    this.__engineUid = Engine.__engineCount;
    this.__processApproach = processApproach;
    this.__cgApiResourceRepository = cgApiResourceRepository;
    this.__componentMemoryRegistry = new ComponentMemoryRegistry();
    this.__componentRepository = new ComponentRepository(this);
    this.__entityRepository = new EntityRepository(this);
    this.__materialRepository = new MaterialRepository();
    this.__memoryManager = MemoryManager.createInstanceIfNotCreated(this, maxGPUDataStorageSize);
    // The XR systems create their viewer and camera entities, so they are initialized at the same point as
    // before the XR support became optional; entity and component IDs stay unchanged when it is enabled.
    if (rnXRModule != null) {
      this.__initXRSystems(rnXRModule);
    }
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
    this.__isDestroyed = true;

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

    // Optional component modules clean up their own Engine-keyed state.
    this.__cleanupComponentRuntimeHooks();

    // Clean up static resources in components that use Engine-keyed maps
    TransformComponent._cleanupForEngine(this);
    SceneGraphComponent._cleanupForEngine(this);
    CameraComponent._cleanupForEngine(this);
    LightComponent._cleanupForEngine(this);
    MeshRendererComponent._cleanupForEngine(this);
    _getPhysicsBackend()?.cleanupForEngine(this);

    // Clean up gizmo resources that are managed per-Engine
    _cleanupGizmosForEngine(this);

    // Clean up material content caches for this engine
    AbstractMaterialContent._cleanupForEngine(this);

    // Clean up RenderPassHelper sampler cache for this engine
    _cleanupRenderPassHelperForEngine(this);

    // Clean up WebGL state cache for this engine (blend modes, cull face, etc.)
    _cleanupWebGLStatesCacheForEngine(this);

    this.__webglGpuTimer?.destroy();
    this.__webglGpuTimer = undefined;

    // Clear component memory registry
    this.__componentMemoryRegistry.destroy();

    // Clear expressions and render passes used for processAuto
    this.__expressionForProcessAuto = undefined;
    this.__renderPassForProcessAuto = undefined;

    // Reset internal state
    this.__renderPassTickCount = 0;
    this.__lastCameraComponentsUpdateCount = -1;
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

    // Cancel a still pending frame first so that calling startRenderLoop twice
    // never leaves two loops running in parallel.
    if (this.__animationFrameId !== -1) {
      this.stopRenderLoop();
    }

    const animationFrameObject = this.__getAnimationFrameObject();
    this.__animationFrameObject = animationFrameObject;

    // Cache everything the hot path needs in local variables. Resolving the
    // `Window | XRSession` union and the class fields on every frame costs more
    // than the loop body itself.
    const requestAnimationFrame = animationFrameObject.requestAnimationFrame.bind(animationFrameObject);
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;

    // The extra arguments are immutable for the lifetime of the loop, so they
    // are copied once. Slot 0 is reserved for the current time and overwritten
    // in place, which keeps the per-frame path free of array allocations and
    // spread/apply overhead in the common (no extra args) case.
    const hasExtraArgs = args.length > 0;
    const callArgs: any[] = hasExtraArgs ? [0, ...args] : [];

    const invokeRenderLoopFunc = hasExtraArgs
      ? (time: number) => {
          callArgs[0] = time;
          renderLoopFunc.apply(renderLoopFunc, callArgs as [number, ...any[]]);
        }
      : (time: number) => {
          renderLoopFunc.call(renderLoopFunc, time);
        };

    const __renderLoopFunc = ((_time: number, xrFrame: XRFrame) => {
      if (webXRSystem?.isReadyForWebXR) {
        webXRSystem._preRender(_time, xrFrame);
        invokeRenderLoopFunc(_time);
        webXRSystem._postRender();
      } else if (webARSystem?.isReadyForWebAR) {
        webARSystem._preRender(_time, xrFrame);
        invokeRenderLoopFunc(_time);
        webARSystem._postRender();
      } else {
        invokeRenderLoopFunc(_time);
      }
      this.__animationFrameId = requestAnimationFrame(__renderLoopFunc);
    }) as FrameRequestCallback;

    this.__animationFrameId = requestAnimationFrame(__renderLoopFunc);
  }

  private __getAnimationFrameObject(): Window | XRSession {
    let animationFrameObject: Window | XRSession | undefined = window;
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if (webXRSystem?.requestedToEnterWebXR) {
      animationFrameObject = webXRSystem.xrSession;
    } else if (webARSystem?.requestedToEnterWebAR) {
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
    // Cancel on the same object that was used to request the frame. Asking
    // __getAnimationFrameObject() again could return a different object (e.g.
    // when an XR session has just ended) and the old loop would keep running.
    const animationFrameObject = this.__animationFrameObject ?? this.__getAnimationFrameObject();
    if (this.__animationFrameId !== -1) {
      animationFrameObject.cancelAnimationFrame(this.__animationFrameId);
    }
    this.__animationFrameId = -1;
    this.__animationFrameObject = undefined;
  }

  /**
   * Restart a render loop.
   */
  public restartRenderLoop() {
    if (this.__renderLoopFunc != null) {
      this.startRenderLoop(this.__renderLoopFunc, ...this.__args);
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
    const gpuTimerEnabled = this.__gpuTimerEnabled;
    if (gpuTimerEnabled) {
      this.__beginGpuTimer();
    }
    Time._processBegin(this);
    this.__processComponentRuntimeHooksBeginFrame();
    if (!this.__isLightClusterSystemLoaded && LightComponent.getUpdateCount(this) > 0) {
      this._requestLightClusterSystem();
    }
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
    if (gpuTimerEnabled) {
      this.__endGpuTimer();
    }
  }

  /**
   * Whether the GPU time of each process() call is measured.
   *
   * @remarks
   * Disabled by default. Measuring uses GPU timer queries (EXT_disjoint_timer_query_webgl2 in WebGL2, the
   * `timestamp-query` feature in WebGPU), which add a small overhead. See {@link gpuTimeMilliseconds}.
   */
  public get gpuTimerEnabled(): boolean {
    return this.__gpuTimerEnabled;
  }

  public set gpuTimerEnabled(flag: boolean) {
    this.__gpuTimerEnabled = flag;
  }

  /**
   * Whether the GPU time can be measured in this environment.
   * Browsers may not expose GPU timer queries (e.g. for privacy reasons or on some platforms).
   */
  public get isGpuTimerSupported(): boolean {
    if (this.__processApproach === ProcessApproach.WebGPU) {
      return this.webGpuResourceRepository._getGpuTimer().isSupported;
    }
    return this.__getWebGLGpuTimer()?.isSupported ?? false;
  }

  /**
   * The GPU time spent on the latest measured process() call, in milliseconds.
   *
   * @remarks
   * Undefined until a result is available, or when {@link gpuTimerEnabled} is false or the environment does
   * not support GPU timer queries. GPU results arrive asynchronously, so the value lags behind by a few
   * frames. In WebGPU it is the sum of the durations of the render passes and the compute passes (such as
   * the light cluster build); in WebGL2 it is the time the GPU spent on all the commands issued during
   * process().
   */
  public get gpuTimeMilliseconds(): number | undefined {
    if (!this.__gpuTimerEnabled) {
      return undefined;
    }
    if (this.__processApproach === ProcessApproach.WebGPU) {
      return this.__webGpuResourceRepository?._getGpuTimer().lastGpuTimeMilliseconds;
    }
    return this.__webglGpuTimer?.lastGpuTimeMilliseconds;
  }

  /**
   * The GPU time of each pass of the latest measured process() call, in milliseconds, keyed by the pass label.
   *
   * @remarks
   * WebGPU only. Undefined until a complete result is available, when {@link gpuTimerEnabled} is false, or
   * when the GPU timer is not supported. The labels are the labels of the GPU passes: the unique names of the
   * render passes, `DepthPrepass`, `LightClusterBuild`, and so on. Passes with the same label are summed.
   * Like {@link gpuTimeMilliseconds}, the value lags behind by a few frames.
   */
  public get gpuPassTimesMilliseconds(): ReadonlyMap<string, number> | undefined {
    if (!this.__gpuTimerEnabled || this.__processApproach !== ProcessApproach.WebGPU) {
      return undefined;
    }
    return this.__webGpuResourceRepository?._getGpuTimer().lastPassGpuTimesMilliseconds;
  }

  private __getWebGLGpuTimer(): WebGLGpuTimer | undefined {
    if (this.__webglGpuTimer == null) {
      const glw = this.__webglResourceRepository?.currentWebGLContextWrapper;
      if (glw == null) {
        return undefined;
      }
      this.__webglGpuTimer = new WebGLGpuTimer(glw.getRawContextAsWebGL2());
    }
    return this.__webglGpuTimer;
  }

  private __beginGpuTimer() {
    if (this.__processApproach === ProcessApproach.WebGPU) {
      this.__webGpuResourceRepository?._getGpuTimer().beginFrame();
    } else {
      this.__getWebGLGpuTimer()?.begin();
    }
  }

  private __endGpuTimer() {
    if (this.__processApproach === ProcessApproach.WebGPU) {
      this.__webGpuResourceRepository?._getGpuTimer().endFrame();
    } else {
      this.__webglGpuTimer?.end();
    }
  }

  private __processRenderPassWebGPU({
    webGpuResourceRepository,
    renderPass,
    renderPassTickCount,
    primitiveUids,
    displayIdx,
    hasAnyEffekseerComponents,
    deferredEffekseerRenderJobs,
  }: {
    webGpuResourceRepository: WebGpuResourceRepository;
    renderPass: RenderPass;
    renderPassTickCount: number;
    primitiveUids: PrimitiveUID[];
    displayIdx: number;
    hasAnyEffekseerComponents: boolean;
    deferredEffekseerRenderJobs?: DeferredEffekseerWebGPURenderJob[];
  }): boolean {
    // Run pre-render hook per-eye (ensures per-view framebuffer adjustments)
    renderPass.doPreRender();

    // Scanning every entity for an EffekseerComponent costs a component lookup
    // per entity plus two array allocations per render pass (and per eye). Only
    // do it when this pass actually renders Effekseer effects and at least one
    // EffekseerComponent exists in the engine.
    let effekseerComponents: EffekseerComponent[] | undefined;
    if (hasAnyEffekseerComponents && renderPass.toRenderEffekseerEffects) {
      effekseerComponents = [];
      const entities = renderPass.entities;
      for (let i = 0; i < entities.length; i++) {
        const effekseerComponent = entities[i].tryToGetEffekseer();
        if (effekseerComponent != null) {
          effekseerComponents.push(effekseerComponent);
        }
      }
      if (effekseerComponents.length === 0) {
        effekseerComponents = undefined;
      }
    }
    const hasEffekseerEffects = effekseerComponents != null;
    const effekseerRenderPassOptions = hasEffekseerEffects
      ? webGpuResourceRepository.getEffekseerRenderPassOptions(this, renderPass, displayIdx)
      : undefined;
    const shouldRenderEffekseerEffects = renderPass.toRenderEffekseerEffects && hasEffekseerEffects;
    const shouldDeferEffekseerEffects =
      shouldRenderEffekseerEffects && renderPass.getResolveFramebuffer() != null && deferredEffekseerRenderJobs != null;
    if (shouldRenderEffekseerEffects && effekseerRenderPassOptions != null) {
      for (const effekseerComponent of effekseerComponents!) {
        effekseerComponent.prepareWebGPURendering(effekseerRenderPassOptions);
      }
    }
    if (shouldDeferEffekseerEffects) {
      deferredEffekseerRenderJobs!.push({
        renderPass,
        displayIdx,
        renderPassOptions: effekseerRenderPassOptions,
        effekseerComponents: effekseerComponents!,
      });
    }

    // clear Framebuffer
    webGpuResourceRepository.clearFrameBuffer(this, renderPass, displayIdx);

    this.__renderMeshesWebGPU({
      webGpuResourceRepository,
      renderPass,
      renderPassTickCount,
      primitiveUids,
      displayIdx,
      shouldKeepRenderPassForEffekseer: shouldRenderEffekseerEffects && !shouldDeferEffekseerEffects,
    });

    if (shouldRenderEffekseerEffects && !shouldDeferEffekseerEffects) {
      const renderPassEncoder = webGpuResourceRepository.getOrCreateRenderPassEncoderForEffekseerExternalRendering(
        this,
        renderPass,
        displayIdx
      );

      if (renderPassEncoder != null) {
        for (const effekseerComponent of effekseerComponents!) {
          effekseerComponent.$renderWebGPU(renderPassEncoder, effekseerRenderPassOptions, displayIdx);
        }
      }
      webGpuResourceRepository.endRenderPassEncoderForExternalRendering();
    }

    renderPass._copyResolve1ToResolve2WebGpu();
    renderPass.doPostRender();

    return shouldRenderEffekseerEffects;
  }

  private __renderDeferredEffekseerEffectsAfterResolveWebGPU({
    webGpuResourceRepository,
    currentRenderPass,
    deferredEffekseerRenderJobs,
    displayIdx,
  }: {
    webGpuResourceRepository: WebGpuResourceRepository;
    currentRenderPass: RenderPass;
    deferredEffekseerRenderJobs: DeferredEffekseerWebGPURenderJob[];
    displayIdx: number;
  }) {
    if (deferredEffekseerRenderJobs.length === 0) {
      return;
    }

    const currentResolveFramebuffer = currentRenderPass.getResolveFramebuffer();
    if (currentResolveFramebuffer == null) {
      return;
    }

    for (const job of deferredEffekseerRenderJobs) {
      if (job.displayIdx !== displayIdx || job.renderPass.getResolveFramebuffer() !== currentResolveFramebuffer) {
        continue;
      }

      const renderPassEncoder = webGpuResourceRepository.getOrCreateRenderPassEncoderForEffekseerExternalRendering(
        this,
        job.renderPass,
        displayIdx
      );

      if (renderPassEncoder != null) {
        for (const effekseerComponent of job.effekseerComponents) {
          effekseerComponent.$renderWebGPU(renderPassEncoder, job.renderPassOptions, displayIdx);
        }
      }
      webGpuResourceRepository.endRenderPassEncoderForExternalRendering();
      job.renderPass._copyResolve1ToResolve2WebGpu();
    }
  }

  private __renderMeshesWebGPU({
    webGpuResourceRepository,
    renderPass,
    renderPassTickCount,
    primitiveUids,
    displayIdx,
    shouldKeepRenderPassForEffekseer,
  }: {
    webGpuResourceRepository: WebGpuResourceRepository;
    renderPass: RenderPass;
    renderPassTickCount: number;
    primitiveUids: PrimitiveUID[];
    displayIdx: number;
    shouldKeepRenderPassForEffekseer: boolean;
  }): GPURenderPassEncoder | undefined {
    let renderPassEncoderForEffekseer: GPURenderPassEncoder | undefined;
    let doRender = renderPass._renderedSomethingBefore;
    if (doRender) {
      if (shouldKeepRenderPassForEffekseer) {
        renderPassEncoderForEffekseer = webGpuResourceRepository.renderWithRenderBundleAndKeepRenderPass(
          this,
          renderPass,
          displayIdx
        );
        doRender = renderPassEncoderForEffekseer == null;
      } else {
        doRender = !webGpuResourceRepository.renderWithRenderBundle(this, renderPass, displayIdx);
      }
      this.__engineState.webgpuRenderBundleMode ||= doRender;
    }

    if (!doRender) {
      return renderPassEncoderForEffekseer;
    }

    // The render bundle could not be reused (first frame, cache invalidation,
    // or changed sort order), so record fresh commands. Creating the bundle
    // encoder only here avoids descriptor computation and GPU encoder
    // allocation on every frame where a cached bundle is executed.
    webGpuResourceRepository.createRenderBundleEncoder(this, renderPass, displayIdx);

    const renderedSomething = MeshRendererComponent.common_$render({
      renderPass: renderPass,
      renderPassTickCount,
      primitiveUids,
      displayIdx,
      engine: this,
    });
    renderPass._renderedSomethingBefore = renderedSomething;
    if (!renderedSomething) {
      return renderPassEncoderForEffekseer;
    }

    if (shouldKeepRenderPassForEffekseer) {
      return webGpuResourceRepository.finishRenderBundleEncoderAndKeepRenderPass(this, renderPass, displayIdx);
    }

    webGpuResourceRepository.finishRenderBundleEncoder(this, renderPass, displayIdx);
    return undefined;
  }

  private _processWebGPU(expressions: Expression[]) {
    const componentTids = this.__componentRepository.getComponentTIDs();
    const webGpuResourceRepository = this.webGpuResourceRepository;
    const webxrSystem = this.__webXRSystem;
    for (const stage of Component._processStages) {
      if (stage === ProcessStage.Render) {
        // The light lists must be written before the strategy uploads the GPU instance data in prerender.
        this.__lightClusterSystem.update(expressions);
        MeshRendererComponent.common_$prerender(this);
        const isWebXRMode = webxrSystem?.isWebXRMode ?? false;
        const isMultiView = webxrSystem?.isMultiView() ?? false;
        const xrPose = this.__engineState.xrPoseWebGPU;
        const displayCount = isWebXRMode && !isMultiView && xrPose != null ? xrPose.views.length : 1;
        // Effekseer is rarely used. Detect it once per frame so the per-pass
        // code can skip entity scans, job arrays and the deferred-render call.
        const hasAnyEffekseerComponents = this.__componentRepository.hasAnyComponent(
          WellKnownComponentTIDs.EffekseerComponentTID
        );
        // The maps only exist to share sorting work between the eyes in stereo
        // rendering. Allocating them for the common single-display case costs
        // two Map allocations on every frame.
        const isMultiDisplay = displayCount > 1;
        const renderPassTickCountMap = isMultiDisplay ? new Map<number, number>() : undefined;
        const primitiveUidsMap = isMultiDisplay ? new Map<number, PrimitiveUID[]>() : undefined;

        for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
          const deferredEffekseerRenderJobs: DeferredEffekseerWebGPURenderJob[] | undefined = hasAnyEffekseerComponents
            ? []
            : undefined;
          let renderedEffekseerEffectsInDisplay = false;
          for (const exp of expressions) {
            for (const renderPass of exp.renderPasses) {
              const renderPassUid = renderPass.renderPassUID;
              let renderPassTickCount = renderPassTickCountMap?.get(renderPassUid);
              let primitiveUids: PrimitiveUID[];
              if (renderPassTickCount === undefined) {
                renderPassTickCount = this.__renderPassTickCount;
                renderPass._isChangedSortRenderResult = false;
                primitiveUids = MeshRendererComponent.sort_$render(this, renderPass);
                if (renderPassTickCountMap != null) {
                  renderPassTickCountMap.set(renderPassUid, renderPassTickCount);
                  primitiveUidsMap!.set(renderPassUid, primitiveUids);
                }
              } else {
                primitiveUids = primitiveUidsMap!.get(renderPassUid)!;
              }

              const renderedEffekseerEffects = this.__processRenderPassWebGPU({
                webGpuResourceRepository,
                renderPass,
                renderPassTickCount,
                primitiveUids,
                displayIdx,
                hasAnyEffekseerComponents,
                deferredEffekseerRenderJobs,
              });
              renderedEffekseerEffectsInDisplay ||= renderedEffekseerEffects;
              if (deferredEffekseerRenderJobs != null && deferredEffekseerRenderJobs.length > 0) {
                this.__renderDeferredEffekseerEffectsAfterResolveWebGPU({
                  webGpuResourceRepository,
                  currentRenderPass: renderPass,
                  deferredEffekseerRenderJobs,
                  displayIdx,
                });
              }

              // advance tick count only after the final display has been processed
              if (displayIdx === displayCount - 1) {
                renderPassTickCountMap?.delete(renderPassUid);
                primitiveUidsMap?.delete(renderPassUid);
                this.__renderPassTickCount++;
              }
            }
          }
          if (displayIdx < displayCount - 1 && renderedEffekseerEffectsInDisplay) {
            // Effekseer WebGPU updates camera matrices in backend GPU state while Rhodonite is still recording commands.
            // Submitting per eye prevents the right-eye update from being observed by left-eye draw commands.
            webGpuResourceRepository.flush();
          }
        }
        webGpuResourceRepository.flush();
      } else {
        if (
          !this.__engineState.webgpuRenderBundleMode ||
          this.__isComponentRuntimeHookDirty() ||
          TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount ||
          CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount ||
          Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount ||
          LightComponent.getUpdateCount(this) !== this.__lastLightComponentsUpdateCount
        ) {
          // Built only when the stage actually runs: a static scene skips it on every frame.
          const commonMethodName = `common_${stage.methodName}`;
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
      if (stage === ProcessStage.Logic) {
        // The transform gizmos keep a constant on-screen size, so they have to be rescaled
        // after the CameraComponent (TID 9) has updated its matrices. This runs outside the
        // change gate above so that a frame which skips the Logic stage still corrects them.
        SceneGraphComponent._updateTransformGizmosByCameraChange(this);
      }
    }
    this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this);
    this.__processComponentRuntimeHooksMarkUpdated();
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this);
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
    this.__lastLightComponentsUpdateCount = LightComponent.getUpdateCount(this);
  }

  private __processComponentRuntimeHooksBeginFrame() {
    for (const hooks of _getComponentRuntimeHooks()) {
      hooks.beginFrame?.(this);
    }
  }

  private __isComponentRuntimeHookDirty(): boolean {
    for (const hooks of _getComponentRuntimeHooks()) {
      if (hooks.isDirty?.(this) === true) {
        return true;
      }
    }
    return false;
  }

  private __processComponentRuntimeHooksMarkUpdated() {
    for (const hooks of _getComponentRuntimeHooks()) {
      hooks.markUpdated?.(this);
    }
  }

  private __cleanupComponentRuntimeHooks() {
    for (const hooks of _getComponentRuntimeHooks()) {
      hooks.cleanup?.(this);
    }
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
        // Coalesce the GPU setup of meshes added while loading into one multi-draw rebuild.
        repo.getMultiDrawRepository(this).rebuildDirtyGroups();
        // The light lists must be written before the strategy uploads the GPU instance data in prerender.
        this.__lightClusterSystem.update(expressions);
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
              // scissor hints (e.g. the screen bounds of an SDF pass) for normal rendering
              this.setScissorForNormalRendering(renderPass);

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
          this.__isComponentRuntimeHookDirty() ||
          TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount ||
          CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount ||
          Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount ||
          LightComponent.getUpdateCount(this) !== this.__lastLightComponentsUpdateCount
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
      if (stage === ProcessStage.Logic) {
        // The transform gizmos keep a constant on-screen size, so they have to be rescaled
        // after the CameraComponent (TID 9) has updated its matrices. This runs outside the
        // change gate above so that a frame which skips the Logic stage still corrects them.
        SceneGraphComponent._updateTransformGizmosByCameraChange(this);
      }
    }
    this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this);
    this.__processComponentRuntimeHooksMarkUpdated();
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this);
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
    this.__lastLightComponentsUpdateCount = LightComponent.getUpdateCount(this);
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
    if ((!webXRSystem?.isWebXRMode || !renderPass.isVrRendering) && !webARSystem?.isWebARMode) {
      (this.__cgApiResourceRepository as WebGLResourceRepository).setViewport(this, renderPass.getViewport());
    }
  }

  /**
   * Applies the pass's scissor rectangle for normal (non-XR) rendering.
   *
   * The scissor is a culling hint; XR/AR passes use their own viewports, so they
   * run without one.
   */
  private setScissorForNormalRendering(renderPass: RenderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    const repository = this.__cgApiResourceRepository as WebGLResourceRepository;
    if ((!webXRSystem?.isWebXRMode || !renderPass.isVrRendering) && !webARSystem?.isWebARMode) {
      repository.setScissorRect(renderPass);
    } else {
      repository.setScissorRect(undefined);
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
   *   approach: Rn.ProcessApproach.WebGL2,
   *   canvas: document.getElementById('world') as HTMLCanvasElement,
   * });
   * ```
   *
   * @param desc
   * @returns
   */
  /**
   * Registers the component classes the engine itself processes every frame.
   *
   * @remarks
   * Other component classes are registered on first use by `EntityRepository.addComponentToEntity`.
   * The core classes are registered here because the render loop looks up the MeshRendererComponent class
   * by its ComponentTID, because SkeletalComponent's bone data members must be registered before any shader is
   * generated, and because entity helpers such as `createGroupEntity` and `createMeshEntity` add
   * them by ComponentTID: importing the classes there would create circular imports between the
   * components, the gizmos and the mesh helpers.
   */
  private static __registerCoreComponentClasses() {
    ComponentRepository._ensureComponentClassRegistered(TransformComponent);
    ComponentRepository._ensureComponentClassRegistered(SceneGraphComponent);
    ComponentRepository._ensureComponentClassRegistered(MeshComponent);
    ComponentRepository._ensureComponentClassRegistered(MeshRendererComponent);
    ComponentRepository._ensureComponentClassRegistered(CameraComponent);
    ComponentRepository._ensureComponentClassRegistered(LightComponent);
    // AnimationComponent and CameraControllerComponent register themselves on first use and provide their own
    // runtime hooks, so they stay out of the core path.
    // SkeletalComponent registers its bone data members when its module is evaluated, and every generated
    // shader declares the bone data getters (get_boneData etc.), so the class must be part of the core
    // even in applications without skinned meshes.
    ComponentRepository._ensureComponentClassRegistered(SkeletalComponent);
  }

  public static async init(desc: EngineInitDescription): Promise<Engine> {
    if (
      desc.approach !== ProcessApproach.None &&
      desc.approach !== ProcessApproach.WebGL2 &&
      desc.approach !== ProcessApproach.WebGPU
    ) {
      const value = (desc.approach as any)?.str ?? String(desc.approach);
      throw new Error(
        `Unsupported process approach "${value}". The "Uniform" and "DataTexture" modes were removed. Use ProcessApproach.WebGL2 ("WebGL2") or ProcessApproach.WebGPU ("WebGPU").`
      );
    }

    if (desc.approach === ProcessApproach.WebGL2 && typeof __RN_WEBGL__ !== 'undefined' && !__RN_WEBGL__) {
      throw new Error('ProcessApproach.WebGL2 is unavailable: this build was bundled with __RN_WEBGL__ = false.');
    }
    if (desc.approach === ProcessApproach.WebGPU && typeof __RN_WEBGPU__ !== 'undefined' && !__RN_WEBGPU__) {
      throw new Error('ProcessApproach.WebGPU is unavailable: this build was bundled with __RN_WEBGPU__ = false.');
    }

    Engine.__registerCoreComponentClasses();

    // The PBR module (the sheen LUT image) is loaded on demand by DummyTextures.requestSheenLutTexture().
    // The XR support pulls in the glTF importer (controller models), so it is loaded only when requested.
    const rnXRModule =
      (desc.xr ?? Engine._loadXRByDefault) ? ((await ModuleManager.getInstance().loadModule('xr')) as RnXR) : undefined;

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
      // Used by the GPU timer (Engine.gpuTimerEnabled). Enabling the feature has no cost until it is used.
      addFeature('timestamp-query');

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
    } else if (desc.approach === ProcessApproach.WebGL2) {
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

    const engine = new Engine(desc.approach, cgApiResourceRepository!, maxGPUDataStorageSize, desc.config, rnXRModule);
    engine.__engineState.currentProcessApproach = desc.approach;
    engine.__config.eventTargetDom = engine.__config.eventTargetDom ?? desc.canvas;
    if (desc.approach === ProcessApproach.WebGPU) {
      engine.__webGpuResourceRepository = cgApiResourceRepository as WebGpuResourceRepository;
    }
    if (desc.approach === ProcessApproach.WebGL2) {
      engine.__webglResourceRepository = cgApiResourceRepository as WebGLResourceRepository;
    }
    engine.__cgApiResourceRepository = cgApiResourceRepository!;

    if (desc.notToDisplayRnInfoAtInit !== true) {
      engine.__displayRnInfo();
    }

    const globalDataRepository = engine.__globalDataRepository;
    globalDataRepository.initialize(desc.approach);

    if (desc.canvas != null && desc.approach === ProcessApproach.WebGL2) {
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

  /**
   * The WebXR (VR) system.
   * @throws If the XR support is not enabled (see {@link enableXR} and `EngineInitDescription.xr`)
   */
  public get webXRSystem(): WebXRSystem {
    if (this.__webXRSystem == null) {
      throw new Error(Engine.__xrNotEnabledMessage);
    }
    return this.__webXRSystem;
  }

  /**
   * The WebAR system.
   * @throws If the XR support is not enabled (see {@link enableXR} and `EngineInitDescription.xr`)
   */
  public get webARSystem(): WebARSystem {
    if (this.__webARSystem == null) {
      throw new Error(Engine.__xrNotEnabledMessage);
    }
    return this.__webARSystem;
  }

  /** Whether the XR support (WebXR and WebAR systems) is enabled. */
  public get isXREnabled(): boolean {
    return this.__webXRSystem != null;
  }

  /**
   * The WebXR system, or undefined when the XR support is not enabled.
   * Internal code uses it so that rendering without XR never needs the XR module.
   * @internal
   */
  public get _webXRSystemIfEnabled(): WebXRSystem | undefined {
    return this.__webXRSystem;
  }

  /**
   * The WebAR system, or undefined when the XR support is not enabled.
   * @internal
   */
  public get _webARSystemIfEnabled(): WebARSystem | undefined {
    return this.__webARSystem;
  }

  /**
   * Enables the WebXR/WebAR support after initialization by loading the XR module.
   * Does nothing when it is already enabled (e.g. by `Engine.init({ xr: true })`).
   *
   * @returns The WebXR system
   *
   * @example
   * ```typescript
   * const webXRSystem = await engine.enableXR();
   * await webXRSystem.readyForWebXR(buttonElement, basePath);
   * ```
   */
  public async enableXR(): Promise<WebXRSystem> {
    if (this.__webXRSystem == null) {
      const rnXRModule = (await ModuleManager.getInstance().loadModule('xr')) as RnXR;
      if (this.__webXRSystem == null) {
        this.__initXRSystems(rnXRModule);
      }
    }
    return this.__webXRSystem!;
  }

  private __initXRSystems(rnXRModule: RnXR) {
    this.__webXRSystem = rnXRModule.WebXRSystem.init(this);
    this.__webARSystem = rnXRModule.WebARSystem.init(this);
  }

  private static readonly __xrNotEnabledMessage =
    'The XR support is not enabled. Initialize the engine with Engine.init({ xr: true }) or call ' +
    'await engine.enableXR() first. The default Rn namespace export enables it automatically.';

  public get memoryManager() {
    return this.__memoryManager!;
  }

  public get globalDataRepository() {
    return this.__globalDataRepository;
  }

  /**
   * Starts loading the light cluster system. Called when the first light is added; applications without lights
   * never download it.
   * @internal
   */
  _requestLightClusterSystem(): void {
    if (this.__isDestroyed || this.__lightClusterSystemPromise != null) {
      return;
    }
    this.__lightClusterSystemPromise = import('../renderer/lightCluster/LightClusterSystem')
      .then(({ LightClusterSystem }) => {
        if (this.__isDestroyed) {
          return;
        }
        this.__lightClusterSystem = new LightClusterSystem(this);
        this.__isLightClusterSystemLoaded = true;
      })
      .catch(error => {
        Logger.default.warn(`Failed to load the light cluster system: ${error}`);
      });
  }

  /**
   * Waits for the real light cluster system. Tests and applications that need it immediately call this.
   * @internal
   */
  async _ensureLightClusterSystem(): Promise<ILightClusterSystem> {
    this._requestLightClusterSystem();
    await this.__lightClusterSystemPromise;
    return this.__lightClusterSystem;
  }

  /**
   * The system that builds the light lists of Clustered Forward rendering.
   */
  public get lightClusterSystem(): ILightClusterSystem {
    return this.__lightClusterSystem;
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
