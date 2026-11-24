// src/foundation/system/Engine.ts
import { VERSION } from "../../version.js";
import { CameraComponent } from "../components/Camera/CameraComponent.js";
import { createCameraEntity } from "../components/Camera/createCameraEntity.js";
import { LightComponent } from "../components/Light/LightComponent.js";
import { MeshComponent } from "../components/Mesh/MeshComponent.js";
import { MeshRendererComponent } from "../components/MeshRenderer/MeshRendererComponent.js";
import { SceneGraphComponent } from "../components/SceneGraph/SceneGraphComponent.js";
import { SkeletalComponent } from "../components/Skeletal/SkeletalComponent.js";
import { TransformComponent } from "../components/Transform/TransformComponent.js";
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs.js";
import { Component } from "../core/Component.js";
import { ComponentMemoryRegistry } from "../core/ComponentMemoryRegistry.js";
import { ComponentRepository } from "../core/ComponentRepository.js";
import { _getComponentRuntimeHooks } from "../core/ComponentRuntimeHooks.js";
import { Config } from "../core/Config.js";
import { EntityRepository } from "../core/EntityRepository.js";
import { GlobalDataRepository } from "../core/GlobalDataRepository.js";
import { MemoryManager } from "../core/MemoryManager.js";
import { CameraType } from "../definitions/CameraType.js";
import { ProcessApproach } from "../definitions/ProcessApproach.js";
import { ProcessStage } from "../definitions/ProcessStage.js";
import { Primitive } from "../geometry/Primitive.js";
import { DummyTextures } from "../materials/core/DummyTextures.js";
import { Vector3 } from "../math/Vector3.js";
import { Vector4 } from "../math/Vector4.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { Time } from "../misc/Time.js";
import { _getPhysicsBackend } from "../physics/PhysicsBackend.js";
import { CGAPIResourceRepository } from "../renderer/CGAPIResourceRepository.js";
import { Expression } from "../renderer/Expression.js";
import { Frame } from "../renderer/Frame.js";
import { LightClusterSystem } from "../renderer/lightCluster/LightClusterSystem.js";
import { RenderPass } from "../renderer/RenderPass.js";
import { EngineState } from "./EngineState.js";
import { ModuleManager } from "./ModuleManager.js";
import { WebGLGpuTimer } from "../../webgl/WebGLGpuTimer.js";
import { _cleanupWebGLStatesCacheForEngine } from "../../webgl/WebGLStrategyCommonMethod.js";
import { RnObject } from "../core/RnObject.js";
import { _cleanupGizmosForEngine } from "../gizmos/GizmoRegistry.js";
import { _cleanupRenderPassHelperForEngine } from "../helpers/RenderPassHelper.js";
import { AbstractMaterialContent } from "../materials/core/AbstractMaterialContent.js";
import { MaterialRepository } from "../materials/core/MaterialRepository.js";
var _Engine = class _Engine extends RnObject {
  constructor(processApproach, cgApiResourceRepository, maxGPUDataStorageSize, config, rnXRModule) {
    super();
    this.__processApproach = ProcessApproach.None;
    this.__engineState = new EngineState();
    this.__renderPassTickCount = 0;
    this.__animationFrameId = -1;
    this.__args = [];
    this.__lastCameraComponentsUpdateCount = -1;
    this.__lastTransformComponentsUpdateCount = -1;
    this.__lastPrimitiveCount = -1;
    this.__lastLightComponentsUpdateCount = -1;
    /** Shader program cache map for this engine instance. Maps shader text to program UIDs. */
    this.__shaderProgramCache = /* @__PURE__ */ new Map();
    this.__gpuTimerEnabled = false;
    this.__engineUid = -1;
    this.__config = config != null ? config : new Config();
    this.__logger = new Logger();
    this.__logger.logLevel = this.__config.logLevel;
    this.__engineUid = _Engine.__engineCount;
    this.__processApproach = processApproach;
    this.__cgApiResourceRepository = cgApiResourceRepository;
    this.__componentMemoryRegistry = new ComponentMemoryRegistry();
    this.__componentRepository = new ComponentRepository(this);
    this.__entityRepository = new EntityRepository(this);
    this.__materialRepository = new MaterialRepository();
    this.__memoryManager = MemoryManager.createInstanceIfNotCreated(this, maxGPUDataStorageSize);
    if (rnXRModule != null) {
      this.__initXRSystems(rnXRModule);
    }
    this.__globalDataRepository = GlobalDataRepository.init(this);
    this.__lightClusterSystem = new LightClusterSystem(this);
    _Engine.__engineCount++;
  }
  get engineUid() {
    return this.__engineUid;
  }
  static getEngine(objectUid) {
    const engine = _Engine.__engines.get(objectUid);
    if (Is.not.exist(engine)) {
      return void 0;
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
  destroy() {
    this.stopRenderLoop();
    this.__renderLoopFunc = void 0;
    this.__args = [];
    this.__destroyResources();
  }
  /**
   * Internal method that performs the actual resource cleanup.
   * Called after the render loop has fully stopped.
   */
  __destroyResources() {
    var _a, _b;
    this.__materialRepository._makeShaderInvalidateToAllMaterials();
    const entities = this.__entityRepository._getEntities();
    for (const entity of entities) {
      this.__entityRepository.deleteEntity(entity.entityUID);
    }
    if (Is.exist(this.__dummyTextures)) {
      this.__dummyTextures.destroy();
      this.__dummyTextures = void 0;
    }
    if (Is.exist(this.__webGpuResourceRepository)) {
      this.__webGpuResourceRepository.clearCache();
      try {
        const deviceWrapper = this.__webGpuResourceRepository.getWebGpuDeviceWrapper();
        if (deviceWrapper) {
          deviceWrapper.context.unconfigure();
        }
      } catch (_e) {
      }
    }
    if (Is.exist(this.__memoryManager)) {
      this.__memoryManager.destroy();
      this.__memoryManager = void 0;
    }
    this.__cleanupComponentRuntimeHooks();
    TransformComponent._cleanupForEngine(this);
    SceneGraphComponent._cleanupForEngine(this);
    CameraComponent._cleanupForEngine(this);
    LightComponent._cleanupForEngine(this);
    MeshRendererComponent._cleanupForEngine(this);
    (_a = _getPhysicsBackend()) == null ? void 0 : _a.cleanupForEngine(this);
    _cleanupGizmosForEngine(this);
    AbstractMaterialContent._cleanupForEngine(this);
    _cleanupRenderPassHelperForEngine(this);
    _cleanupWebGLStatesCacheForEngine(this);
    (_b = this.__webglGpuTimer) == null ? void 0 : _b.destroy();
    this.__webglGpuTimer = void 0;
    this.__componentMemoryRegistry.destroy();
    this.__expressionForProcessAuto = void 0;
    this.__renderPassForProcessAuto = void 0;
    this.__renderPassTickCount = 0;
    this.__lastCameraComponentsUpdateCount = -1;
    this.__lastTransformComponentsUpdateCount = -1;
    this.__lastPrimitiveCount = -1;
    _Engine.__engines.delete(this.objectUID);
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
  startRenderLoop(renderLoopFunc, ...args) {
    this.__renderLoopFunc = renderLoopFunc;
    this.__args = args;
    if (this.__animationFrameId !== -1) {
      this.stopRenderLoop();
    }
    const animationFrameObject = this.__getAnimationFrameObject();
    this.__animationFrameObject = animationFrameObject;
    const requestAnimationFrame = animationFrameObject.requestAnimationFrame.bind(animationFrameObject);
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    const hasExtraArgs = args.length > 0;
    const callArgs = hasExtraArgs ? [0, ...args] : [];
    const invokeRenderLoopFunc = hasExtraArgs ? (time) => {
      callArgs[0] = time;
      renderLoopFunc.apply(renderLoopFunc, callArgs);
    } : (time) => {
      renderLoopFunc.call(renderLoopFunc, time);
    };
    const __renderLoopFunc = ((_time, xrFrame) => {
      if (webXRSystem == null ? void 0 : webXRSystem.isReadyForWebXR) {
        webXRSystem._preRender(_time, xrFrame);
        invokeRenderLoopFunc(_time);
        webXRSystem._postRender();
      } else if (webARSystem == null ? void 0 : webARSystem.isReadyForWebAR) {
        webARSystem._preRender(_time, xrFrame);
        invokeRenderLoopFunc(_time);
        webARSystem._postRender();
      } else {
        invokeRenderLoopFunc(_time);
      }
      this.__animationFrameId = requestAnimationFrame(__renderLoopFunc);
    });
    this.__animationFrameId = requestAnimationFrame(__renderLoopFunc);
  }
  __getAnimationFrameObject() {
    let animationFrameObject = window;
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if (webXRSystem == null ? void 0 : webXRSystem.requestedToEnterWebXR) {
      animationFrameObject = webXRSystem.xrSession;
    } else if (webARSystem == null ? void 0 : webARSystem.requestedToEnterWebAR) {
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
  stopRenderLoop() {
    var _a;
    const animationFrameObject = (_a = this.__animationFrameObject) != null ? _a : this.__getAnimationFrameObject();
    if (this.__animationFrameId !== -1) {
      animationFrameObject.cancelAnimationFrame(this.__animationFrameId);
    }
    this.__animationFrameId = -1;
    this.__animationFrameObject = void 0;
  }
  /**
   * Restart a render loop.
   */
  restartRenderLoop() {
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
  processAuto(clearColor = Vector4.fromCopy4(0, 0, 0, 1)) {
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
    this.__renderPassForProcessAuto.clearEntities();
    const entities = this.__entityRepository._getEntities();
    this.__renderPassForProcessAuto.addEntities(entities);
    this.process([this.__expressionForProcessAuto]);
  }
  process(value) {
    const gpuTimerEnabled = this.__gpuTimerEnabled;
    if (gpuTimerEnabled) {
      this.__beginGpuTimer();
    }
    Time._processBegin(this);
    this.__processComponentRuntimeHooksBeginFrame();
    let expressions = value;
    if (value instanceof Frame) {
      expressions = value.expressions;
    }
    if (CameraComponent.getCurrent(this) === Component.InvalidObjectUID) {
      _Engine.createCamera(this);
    }
    const time = this.__globalDataRepository.getValue("time", 0);
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
  get gpuTimerEnabled() {
    return this.__gpuTimerEnabled;
  }
  set gpuTimerEnabled(flag) {
    this.__gpuTimerEnabled = flag;
  }
  /**
   * Whether the GPU time can be measured in this environment.
   * Browsers may not expose GPU timer queries (e.g. for privacy reasons or on some platforms).
   */
  get isGpuTimerSupported() {
    var _a, _b;
    if (this.__processApproach === ProcessApproach.WebGPU) {
      return this.webGpuResourceRepository._getGpuTimer().isSupported;
    }
    return (_b = (_a = this.__getWebGLGpuTimer()) == null ? void 0 : _a.isSupported) != null ? _b : false;
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
  get gpuTimeMilliseconds() {
    var _a, _b;
    if (!this.__gpuTimerEnabled) {
      return void 0;
    }
    if (this.__processApproach === ProcessApproach.WebGPU) {
      return (_a = this.__webGpuResourceRepository) == null ? void 0 : _a._getGpuTimer().lastGpuTimeMilliseconds;
    }
    return (_b = this.__webglGpuTimer) == null ? void 0 : _b.lastGpuTimeMilliseconds;
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
  get gpuPassTimesMilliseconds() {
    var _a;
    if (!this.__gpuTimerEnabled || this.__processApproach !== ProcessApproach.WebGPU) {
      return void 0;
    }
    return (_a = this.__webGpuResourceRepository) == null ? void 0 : _a._getGpuTimer().lastPassGpuTimesMilliseconds;
  }
  __getWebGLGpuTimer() {
    var _a;
    if (this.__webglGpuTimer == null) {
      const glw = (_a = this.__webglResourceRepository) == null ? void 0 : _a.currentWebGLContextWrapper;
      if (glw == null) {
        return void 0;
      }
      this.__webglGpuTimer = new WebGLGpuTimer(glw.getRawContextAsWebGL2());
    }
    return this.__webglGpuTimer;
  }
  __beginGpuTimer() {
    var _a, _b;
    if (this.__processApproach === ProcessApproach.WebGPU) {
      (_a = this.__webGpuResourceRepository) == null ? void 0 : _a._getGpuTimer().beginFrame();
    } else {
      (_b = this.__getWebGLGpuTimer()) == null ? void 0 : _b.begin();
    }
  }
  __endGpuTimer() {
    var _a, _b;
    if (this.__processApproach === ProcessApproach.WebGPU) {
      (_a = this.__webGpuResourceRepository) == null ? void 0 : _a._getGpuTimer().endFrame();
    } else {
      (_b = this.__webglGpuTimer) == null ? void 0 : _b.end();
    }
  }
  __processRenderPassWebGPU({
    webGpuResourceRepository,
    renderPass,
    renderPassTickCount,
    primitiveUids,
    displayIdx,
    hasAnyEffekseerComponents,
    deferredEffekseerRenderJobs
  }) {
    renderPass.doPreRender();
    let effekseerComponents;
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
        effekseerComponents = void 0;
      }
    }
    const hasEffekseerEffects = effekseerComponents != null;
    const effekseerRenderPassOptions = hasEffekseerEffects ? webGpuResourceRepository.getEffekseerRenderPassOptions(this, renderPass, displayIdx) : void 0;
    const shouldRenderEffekseerEffects = renderPass.toRenderEffekseerEffects && hasEffekseerEffects;
    const shouldDeferEffekseerEffects = shouldRenderEffekseerEffects && renderPass.getResolveFramebuffer() != null && deferredEffekseerRenderJobs != null;
    if (shouldRenderEffekseerEffects && effekseerRenderPassOptions != null) {
      for (const effekseerComponent of effekseerComponents) {
        effekseerComponent.prepareWebGPURendering(effekseerRenderPassOptions);
      }
    }
    if (shouldDeferEffekseerEffects) {
      deferredEffekseerRenderJobs.push({
        renderPass,
        displayIdx,
        renderPassOptions: effekseerRenderPassOptions,
        effekseerComponents
      });
    }
    webGpuResourceRepository.clearFrameBuffer(this, renderPass, displayIdx);
    this.__renderMeshesWebGPU({
      webGpuResourceRepository,
      renderPass,
      renderPassTickCount,
      primitiveUids,
      displayIdx,
      shouldKeepRenderPassForEffekseer: shouldRenderEffekseerEffects && !shouldDeferEffekseerEffects
    });
    if (shouldRenderEffekseerEffects && !shouldDeferEffekseerEffects) {
      const renderPassEncoder = webGpuResourceRepository.getOrCreateRenderPassEncoderForEffekseerExternalRendering(
        this,
        renderPass,
        displayIdx
      );
      if (renderPassEncoder != null) {
        for (const effekseerComponent of effekseerComponents) {
          effekseerComponent.$renderWebGPU(renderPassEncoder, effekseerRenderPassOptions, displayIdx);
        }
      }
      webGpuResourceRepository.endRenderPassEncoderForExternalRendering();
    }
    renderPass._copyResolve1ToResolve2WebGpu();
    renderPass.doPostRender();
    return shouldRenderEffekseerEffects;
  }
  __renderDeferredEffekseerEffectsAfterResolveWebGPU({
    webGpuResourceRepository,
    currentRenderPass,
    deferredEffekseerRenderJobs,
    displayIdx
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
  __renderMeshesWebGPU({
    webGpuResourceRepository,
    renderPass,
    renderPassTickCount,
    primitiveUids,
    displayIdx,
    shouldKeepRenderPassForEffekseer
  }) {
    var _a;
    let renderPassEncoderForEffekseer;
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
      (_a = this.__engineState).webgpuRenderBundleMode || (_a.webgpuRenderBundleMode = doRender);
    }
    if (!doRender) {
      return renderPassEncoderForEffekseer;
    }
    webGpuResourceRepository.createRenderBundleEncoder(this, renderPass, displayIdx);
    const renderedSomething = MeshRendererComponent.common_$render({
      renderPass,
      renderPassTickCount,
      primitiveUids,
      displayIdx,
      engine: this
    });
    renderPass._renderedSomethingBefore = renderedSomething;
    if (!renderedSomething) {
      return renderPassEncoderForEffekseer;
    }
    if (shouldKeepRenderPassForEffekseer) {
      return webGpuResourceRepository.finishRenderBundleEncoderAndKeepRenderPass(this, renderPass, displayIdx);
    }
    webGpuResourceRepository.finishRenderBundleEncoder(this, renderPass, displayIdx);
    return void 0;
  }
  _processWebGPU(expressions) {
    var _a, _b;
    const componentTids = this.__componentRepository.getComponentTIDs();
    const webGpuResourceRepository = this.webGpuResourceRepository;
    const webxrSystem = this.__webXRSystem;
    for (const stage of Component._processStages) {
      if (stage === ProcessStage.Render) {
        this.__lightClusterSystem.update(expressions);
        MeshRendererComponent.common_$prerender(this);
        const isWebXRMode = (_a = webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) != null ? _a : false;
        const isMultiView = (_b = webxrSystem == null ? void 0 : webxrSystem.isMultiView()) != null ? _b : false;
        const xrPose = this.__engineState.xrPoseWebGPU;
        const displayCount = isWebXRMode && !isMultiView && xrPose != null ? xrPose.views.length : 1;
        const hasAnyEffekseerComponents = this.__componentRepository.hasAnyComponent(
          WellKnownComponentTIDs.EffekseerComponentTID
        );
        const isMultiDisplay = displayCount > 1;
        const renderPassTickCountMap = isMultiDisplay ? /* @__PURE__ */ new Map() : void 0;
        const primitiveUidsMap = isMultiDisplay ? /* @__PURE__ */ new Map() : void 0;
        for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
          const deferredEffekseerRenderJobs = hasAnyEffekseerComponents ? [] : void 0;
          let renderedEffekseerEffectsInDisplay = false;
          for (const exp of expressions) {
            for (const renderPass of exp.renderPasses) {
              const renderPassUid = renderPass.renderPassUID;
              let renderPassTickCount = renderPassTickCountMap == null ? void 0 : renderPassTickCountMap.get(renderPassUid);
              let primitiveUids;
              if (renderPassTickCount === void 0) {
                renderPassTickCount = this.__renderPassTickCount;
                renderPass._isChangedSortRenderResult = false;
                primitiveUids = MeshRendererComponent.sort_$render(this, renderPass);
                if (renderPassTickCountMap != null) {
                  renderPassTickCountMap.set(renderPassUid, renderPassTickCount);
                  primitiveUidsMap.set(renderPassUid, primitiveUids);
                }
              } else {
                primitiveUids = primitiveUidsMap.get(renderPassUid);
              }
              const renderedEffekseerEffects = this.__processRenderPassWebGPU({
                webGpuResourceRepository,
                renderPass,
                renderPassTickCount,
                primitiveUids,
                displayIdx,
                hasAnyEffekseerComponents,
                deferredEffekseerRenderJobs
              });
              renderedEffekseerEffectsInDisplay || (renderedEffekseerEffectsInDisplay = renderedEffekseerEffects);
              if (deferredEffekseerRenderJobs != null && deferredEffekseerRenderJobs.length > 0) {
                this.__renderDeferredEffekseerEffectsAfterResolveWebGPU({
                  webGpuResourceRepository,
                  currentRenderPass: renderPass,
                  deferredEffekseerRenderJobs,
                  displayIdx
                });
              }
              if (displayIdx === displayCount - 1) {
                renderPassTickCountMap == null ? void 0 : renderPassTickCountMap.delete(renderPassUid);
                primitiveUidsMap == null ? void 0 : primitiveUidsMap.delete(renderPassUid);
                this.__renderPassTickCount++;
              }
            }
          }
          if (displayIdx < displayCount - 1 && renderedEffekseerEffectsInDisplay) {
            webGpuResourceRepository.flush();
          }
        }
        webGpuResourceRepository.flush();
      } else {
        if (!this.__engineState.webgpuRenderBundleMode || this.__isComponentRuntimeHookDirty() || TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount || Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount || LightComponent.getUpdateCount(this) !== this.__lastLightComponentsUpdateCount) {
          const commonMethodName = `common_${stage.methodName}`;
          for (const componentTid of componentTids) {
            const componentClass = ComponentRepository.getComponentClass(componentTid);
            const componentClass_commonMethod = componentClass[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({
                processApproach: this.__processApproach,
                renderPass: void 0,
                processStage: stage,
                renderPassTickCount: this.__renderPassTickCount,
                displayIdx: 0,
                engine: this
              });
            }
            componentClass.process(this, componentClass, stage);
          }
        }
      }
      if (stage === ProcessStage.Logic) {
        SceneGraphComponent._updateTransformGizmosByCameraChange(this);
      }
    }
    this.__lastCameraComponentsUpdateCount = CameraComponent.getCurrentCameraUpdateCount(this);
    this.__processComponentRuntimeHooksMarkUpdated();
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this);
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
    this.__lastLightComponentsUpdateCount = LightComponent.getUpdateCount(this);
  }
  __processComponentRuntimeHooksBeginFrame() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      (_a = hooks.beginFrame) == null ? void 0 : _a.call(hooks, this);
    }
  }
  __isComponentRuntimeHookDirty() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      if (((_a = hooks.isDirty) == null ? void 0 : _a.call(hooks, this)) === true) {
        return true;
      }
    }
    return false;
  }
  __processComponentRuntimeHooksMarkUpdated() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      (_a = hooks.markUpdated) == null ? void 0 : _a.call(hooks, this);
    }
  }
  __cleanupComponentRuntimeHooks() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      (_a = hooks.cleanup) == null ? void 0 : _a.call(hooks, this);
    }
  }
  _processWebGL(expressions) {
    const repo = this.webglResourceRepository;
    const componentTids = this.__componentRepository.getComponentTIDs();
    const renderingComponentTids = this.__componentRepository.getRenderingComponentTIDs();
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = `common_${methodName}`;
      if (stage === ProcessStage.Render) {
        repo.getMultiDrawRepository(this).rebuildDirtyGroups();
        this.__lightClusterSystem.update(expressions);
        MeshRendererComponent.common_$prerender(this);
        for (const exp of expressions) {
          for (const componentTid of renderingComponentTids) {
            const componentClass = ComponentRepository.getComponentClass(componentTid);
            for (const renderPass of exp.renderPasses) {
              if (typeof spector !== "undefined") {
                spector.setMarker(`| ${exp.uniqueName}: ${renderPass.uniqueName}#`);
              }
              renderPass.doPreRender();
              repo.switchDepthTest(renderPass.isDepthTest);
              this.bindFramebufferWebGL(renderPass);
              this.setViewportForNormalRendering(renderPass);
              this.setScissorForNormalRendering(renderPass);
              if (componentTid === WellKnownComponentTIDs.MeshRendererComponentTID) {
                this.__cgApiResourceRepository.clearFrameBuffer(this, renderPass);
              }
              renderPass._isChangedSortRenderResult = false;
              const primitiveUids = MeshRendererComponent.sort_$render(this, renderPass);
              let doRender = renderPass._renderedSomethingBefore;
              if (doRender) {
                const componentClass_commonMethod = componentClass[commonMethodName];
                if (componentClass_commonMethod) {
                  const renderedSomething = componentClass_commonMethod({
                    processApproach: this.__processApproach,
                    renderPass,
                    processStage: stage,
                    renderPassTickCount: this.__renderPassTickCount,
                    primitiveUids,
                    displayIdx: 0,
                    engine: this
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
        if (this.__isComponentRuntimeHookDirty() || TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount || Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount || LightComponent.getUpdateCount(this) !== this.__lastLightComponentsUpdateCount) {
          for (const componentTid of componentTids) {
            const componentClass = ComponentRepository.getComponentClass(componentTid);
            const componentClass_commonMethod = componentClass[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({
                processApproach: this.__processApproach,
                renderPass: void 0,
                processStage: stage,
                renderPassTickCount: this.__renderPassTickCount,
                displayIdx: 0,
                engine: this
              });
            }
            componentClass.process(this, componentClass, stage);
          }
        }
      }
      if (stage === ProcessStage.Logic) {
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
  static createCamera(engine) {
    const cameraEntity = createCameraEntity(engine, true);
    cameraEntity.getTransform().localPosition = Vector3.fromCopyArray([0, 0, 1]);
    cameraEntity.getCamera().type = CameraType.Orthographic;
    cameraEntity.getCamera().zNear = 0.1;
    cameraEntity.getCamera().zFar = 1e4;
    const webCGApiRepository = engine.cgApiResourceRepository;
    const [width, height] = webCGApiRepository.getCanvasSize();
    cameraEntity.getCamera().xMag = width / height;
    cameraEntity.getCamera().yMag = 1;
  }
  setViewportForNormalRendering(renderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if ((!(webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) || !renderPass.isVrRendering) && !(webARSystem == null ? void 0 : webARSystem.isWebARMode)) {
      this.__cgApiResourceRepository.setViewport(this, renderPass.getViewport());
    }
  }
  /**
   * Applies the pass's scissor rectangle for normal (non-XR) rendering.
   *
   * The scissor is a culling hint; XR/AR passes use their own viewports, so they
   * run without one.
   */
  setScissorForNormalRendering(renderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    const repository = this.__cgApiResourceRepository;
    if ((!(webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) || !renderPass.isVrRendering) && !(webARSystem == null ? void 0 : webARSystem.isWebARMode)) {
      repository.setScissorRect(renderPass);
    } else {
      repository.setScissorRect(void 0);
    }
  }
  bindFramebufferWebGL(renderPass) {
    const webXRSystem = this.__webXRSystem;
    const webARSystem = this.__webARSystem;
    if ((webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && renderPass.isOutputForVr) {
      const glw = this.__cgApiResourceRepository.currentWebGLContextWrapper;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer);
    } else if (webARSystem == null ? void 0 : webARSystem.isWebARMode) {
      const glw = this.__cgApiResourceRepository.currentWebGLContextWrapper;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webARSystem.framebuffer);
    } else {
      this.__cgApiResourceRepository.bindFramebuffer(renderPass.getFramebuffer());
      this.__cgApiResourceRepository.setDrawTargets(renderPass);
    }
  }
  __displayRnInfo() {
    console.log(
      `%cRhodonite%cWeb3D Library%c %cversion%c${VERSION.version}%c %cbranch%c${VERSION.branch}%c %cmode%c${this.__processApproach.str}`,
      "font-weight: bold; padding: 4px 8px; border-radius: 6px 0px 0px 6px; background: linear-gradient(to right, #ff0084 0%,#ff0022 100%);",
      "padding: 4px; border-radius: 0px 6px 6px 0px; background: linear-gradient(to right, #8400ff 0%,#4400ff 100%);",
      "",
      "background: #666; padding: 4px; border-radius: 6px 0px 0px 6px",
      "background: firebrick; padding: 4px; border-radius: 0px 6px 6px 0px",
      "",
      "background: #666; padding: 4px; border-radius: 6px 0px 0px 6px",
      "background: green; padding: 4px; border-radius: 0px 6px 6px 0px",
      "",
      "background: #666; padding: 4px; border-radius: 6px 0px 0px 6px",
      "background: blue; padding: 4px; border-radius: 0px 6px 6px 0px"
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
  static __registerCoreComponentClasses() {
    ComponentRepository._ensureComponentClassRegistered(TransformComponent);
    ComponentRepository._ensureComponentClassRegistered(SceneGraphComponent);
    ComponentRepository._ensureComponentClassRegistered(MeshComponent);
    ComponentRepository._ensureComponentClassRegistered(MeshRendererComponent);
    ComponentRepository._ensureComponentClassRegistered(CameraComponent);
    ComponentRepository._ensureComponentClassRegistered(LightComponent);
    ComponentRepository._ensureComponentClassRegistered(SkeletalComponent);
  }
  static async init(desc) {
    var _a, _b, _c, _d, _e;
    if (desc.approach !== ProcessApproach.None && desc.approach !== ProcessApproach.WebGL2 && desc.approach !== ProcessApproach.WebGPU) {
      const value = (_b = (_a = desc.approach) == null ? void 0 : _a.str) != null ? _b : String(desc.approach);
      throw new Error(
        `Unsupported process approach "${value}". The "Uniform" and "DataTexture" modes were removed. Use ProcessApproach.WebGL2 ("WebGL2") or ProcessApproach.WebGPU ("WebGPU").`
      );
    }
    if (desc.approach === ProcessApproach.WebGL2 && typeof __RN_WEBGL__ !== "undefined" && !__RN_WEBGL__) {
      throw new Error("ProcessApproach.WebGL2 is unavailable: this build was bundled with __RN_WEBGL__ = false.");
    }
    if (desc.approach === ProcessApproach.WebGPU && typeof __RN_WEBGPU__ !== "undefined" && !__RN_WEBGPU__) {
      throw new Error("ProcessApproach.WebGPU is unavailable: this build was bundled with __RN_WEBGPU__ = false.");
    }
    _Engine.__registerCoreComponentClasses();
    const rnXRModule = ((_c = desc.xr) != null ? _c : _Engine._loadXRByDefault) ? await ModuleManager.getInstance().loadModule("xr") : void 0;
    let maxGPUDataStorageSize = 0;
    let cgApiResourceRepository;
    if (desc.approach === ProcessApproach.WebGPU) {
      let addFeature2 = function(feature) {
        if (adapter.features.has(feature)) {
          features.push(feature);
        }
      };
      var addFeature = addFeature2;
      await ModuleManager.getInstance().loadModule("webgpu");
      const webGpuResourceRepository = CGAPIResourceRepository.getWebGpuResourceRepository();
      const webgpuModule = ModuleManager.getInstance().getModule("webgpu");
      const WebGpuDeviceWrapperClass = webgpuModule.WebGpuDeviceWrapper;
      const adapter = await navigator.gpu.requestAdapter({ xrCompatible: true });
      const { maxBufferSize, maxStorageBufferBindingSize } = adapter.limits;
      const features = [];
      addFeature2("float32-filterable");
      addFeature2("rg11b10ufloat-renderable");
      addFeature2("texture-compression-bc");
      addFeature2("texture-compression-etc2");
      addFeature2("texture-compression-astc");
      addFeature2("timestamp-query");
      const device = await adapter.requestDevice({
        requiredFeatures: features,
        requiredLimits: {
          maxStorageBufferBindingSize,
          maxBufferSize
        }
      });
      maxGPUDataStorageSize = maxStorageBufferBindingSize;
      const webGpuDeviceWrapper = new WebGpuDeviceWrapperClass(desc.canvas, adapter, device);
      webGpuResourceRepository.addWebGpuDeviceWrapper(webGpuDeviceWrapper);
      webGpuResourceRepository.recreateSystemDepthTexture();
      webGpuResourceRepository.createBindGroupLayoutForDrawParameters();
      cgApiResourceRepository = webGpuResourceRepository;
    } else if (desc.approach === ProcessApproach.WebGL2) {
      await ModuleManager.getInstance().loadModule("webgl");
      cgApiResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      cgApiResourceRepository.generateWebGLContext(
        (_d = desc.config) != null ? _d : new Config(),
        desc.canvas,
        true,
        desc.webglOption
      );
      cgApiResourceRepository.switchDepthTest(true);
      maxGPUDataStorageSize = cgApiResourceRepository.currentWebGLContextWrapper.getMaxTextureSize() ** 2 * 4 * 4;
    } else {
      maxGPUDataStorageSize = 1024 ** 2 * 4 * 4;
    }
    const engine = new _Engine(desc.approach, cgApiResourceRepository, maxGPUDataStorageSize, desc.config, rnXRModule);
    engine.__engineState.currentProcessApproach = desc.approach;
    engine.__config.eventTargetDom = (_e = engine.__config.eventTargetDom) != null ? _e : desc.canvas;
    if (desc.approach === ProcessApproach.WebGPU) {
      engine.__webGpuResourceRepository = cgApiResourceRepository;
    }
    if (desc.approach === ProcessApproach.WebGL2) {
      engine.__webglResourceRepository = cgApiResourceRepository;
    }
    engine.__cgApiResourceRepository = cgApiResourceRepository;
    if (desc.notToDisplayRnInfoAtInit !== true) {
      engine.__displayRnInfo();
    }
    const globalDataRepository = engine.__globalDataRepository;
    globalDataRepository.initialize(desc.approach);
    if (desc.canvas != null && desc.approach === ProcessApproach.WebGL2) {
      desc.canvas.addEventListener(
        "webglcontextlost",
        ((event) => {
          event.preventDefault();
          engine.stopRenderLoop();
          engine.logger.error("WebGL context lost occurred.");
        }).bind(this)
      );
      desc.canvas.addEventListener("webglcontextrestored", () => {
        engine.logger.error("WebGL context restored.");
        engine.restartRenderLoop();
      });
    }
    engine.__dummyTextures = await DummyTextures.init(engine);
    engine.__engineState.viewportAspectRatio = desc.canvas != null ? desc.canvas.width / desc.canvas.height : 1;
    return engine;
  }
  get processApproach() {
    return this.__processApproach;
  }
  resizeCanvas(width, height) {
    const repo = this.cgApiResourceRepository;
    repo.resizeCanvas(width, height);
    this.__engineState.viewportAspectRatio = width / height;
  }
  getCanvasSize() {
    const repo = this.cgApiResourceRepository;
    return repo.getCanvasSize();
  }
  getCurrentWebGLContextWrapper() {
    return this.__cgApiResourceRepository.currentWebGLContextWrapper;
  }
  get entityRepository() {
    return this.__entityRepository;
  }
  get componentRepository() {
    return this.__componentRepository;
  }
  get componentMemoryRegistry() {
    return this.__componentMemoryRegistry;
  }
  /**
   * The WebXR (VR) system.
   * @throws If the XR support is not enabled (see {@link enableXR} and `EngineInitDescription.xr`)
   */
  get webXRSystem() {
    if (this.__webXRSystem == null) {
      throw new Error(_Engine.__xrNotEnabledMessage);
    }
    return this.__webXRSystem;
  }
  /**
   * The WebAR system.
   * @throws If the XR support is not enabled (see {@link enableXR} and `EngineInitDescription.xr`)
   */
  get webARSystem() {
    if (this.__webARSystem == null) {
      throw new Error(_Engine.__xrNotEnabledMessage);
    }
    return this.__webARSystem;
  }
  /** Whether the XR support (WebXR and WebAR systems) is enabled. */
  get isXREnabled() {
    return this.__webXRSystem != null;
  }
  /**
   * The WebXR system, or undefined when the XR support is not enabled.
   * Internal code uses it so that rendering without XR never needs the XR module.
   * @internal
   */
  get _webXRSystemIfEnabled() {
    return this.__webXRSystem;
  }
  /**
   * The WebAR system, or undefined when the XR support is not enabled.
   * @internal
   */
  get _webARSystemIfEnabled() {
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
  async enableXR() {
    if (this.__webXRSystem == null) {
      const rnXRModule = await ModuleManager.getInstance().loadModule("xr");
      if (this.__webXRSystem == null) {
        this.__initXRSystems(rnXRModule);
      }
    }
    return this.__webXRSystem;
  }
  __initXRSystems(rnXRModule) {
    this.__webXRSystem = rnXRModule.WebXRSystem.init(this);
    this.__webARSystem = rnXRModule.WebARSystem.init(this);
  }
  get memoryManager() {
    return this.__memoryManager;
  }
  get globalDataRepository() {
    return this.__globalDataRepository;
  }
  /**
   * The system that builds the light lists of Clustered Forward rendering.
   */
  get lightClusterSystem() {
    return this.__lightClusterSystem;
  }
  get materialRepository() {
    return this.__materialRepository;
  }
  get webglResourceRepository() {
    return this.__webglResourceRepository;
  }
  get cgApiResourceRepository() {
    return this.__cgApiResourceRepository;
  }
  get webGpuResourceRepository() {
    return this.__webGpuResourceRepository;
  }
  get dummyTextures() {
    return this.__dummyTextures;
  }
  get engineState() {
    return this.__engineState;
  }
  get config() {
    return this.__config;
  }
  get logger() {
    return this.__logger;
  }
  /**
   * Gets the shader program cache for this engine instance.
   * This cache maps shader text to compiled shader program UIDs.
   * Each engine has its own cache to prevent cross-contamination between WebGL contexts.
   * @internal
   */
  get shaderProgramCache() {
    return this.__shaderProgramCache;
  }
};
/**
 * Whether `Engine.init` loads the XR support when `EngineInitDescription.xr` is omitted.
 * The default `Rn` namespace export sets it to true for compatibility.
 * @internal
 */
_Engine._loadXRByDefault = false;
_Engine.__engines = /* @__PURE__ */ new Map();
_Engine.__engineCount = 0;
_Engine.__xrNotEnabledMessage = "The XR support is not enabled. Initialize the engine with Engine.init({ xr: true }) or call await engine.enableXR() first. The default Rn namespace export enables it automatically.";
var Engine = _Engine;
export {
  Engine
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBFZmZla3NlZXJDb21wb25lbnQgfSBmcm9tICcuLi8uLi9lZmZla3NlZXIvRWZmZWtzZWVyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQnl0ZSwgSW5kZXgsIE9iamVjdFVJRCwgUHJpbWl0aXZlVUlEIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uLy4uL3ZlcnNpb24nO1xuaW1wb3J0IHR5cGUgeyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgV2ViR3B1RGV2aWNlV3JhcHBlciB9IGZyb20gJy4uLy4uL3dlYmdwdS9XZWJHcHVEZXZpY2VXcmFwcGVyJztcbmltcG9ydCB0eXBlIHsgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vd2ViZ3B1L1dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IFJuWFIgfSBmcm9tICcuLi8uLi94ci9tYWluJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVDYW1lcmFFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL0NhbWVyYS9jcmVhdGVDYW1lcmFFbnRpdHknO1xuaW1wb3J0IHsgTGlnaHRDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0xpZ2h0L0xpZ2h0Q29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgeyBNZXNoUmVuZGVyZXJDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9NZXNoUmVuZGVyZXJDb21wb25lbnQnO1xuaW1wb3J0IHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFNrZWxldGFsQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudCc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBDb21wb25lbnRNZW1vcnlSZWdpc3RyeSB9IGZyb20gJy4uL2NvcmUvQ29tcG9uZW50TWVtb3J5UmVnaXN0cnknO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvQ29tcG9uZW50UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBfZ2V0Q29tcG9uZW50UnVudGltZUhvb2tzIH0gZnJvbSAnLi4vY29yZS9Db21wb25lbnRSdW50aW1lSG9va3MnO1xuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSAnLi4vY29yZS9Db25maWcnO1xuaW1wb3J0IHsgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBHbG9iYWxEYXRhUmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvR2xvYmFsRGF0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTWVtb3J5TWFuYWdlciB9IGZyb20gJy4uL2NvcmUvTWVtb3J5TWFuYWdlcic7XG5pbXBvcnQgeyBDYW1lcmFUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ2FtZXJhVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2gsIHR5cGUgUHJvY2Vzc0FwcHJvYWNoRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZ2VvbWV0cnkvUHJpbWl0aXZlJztcbmltcG9ydCB0eXBlIHsgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBEdW1teVRleHR1cmVzIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvRHVtbXlUZXh0dXJlcyc7XG5pbXBvcnQgdHlwZSB7IFNjYWxhciB9IGZyb20gJy4uL21hdGgvU2NhbGFyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgVGltZSB9IGZyb20gJy4uL21pc2MvVGltZSc7XG5pbXBvcnQgeyBfZ2V0UGh5c2ljc0JhY2tlbmQgfSBmcm9tICcuLi9waHlzaWNzL1BoeXNpY3NCYWNrZW5kJztcbmltcG9ydCB7IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LCB0eXBlIElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uL3JlbmRlcmVyL0NHQVBJUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB7IEV4cHJlc3Npb24gfSBmcm9tICcuLi9yZW5kZXJlci9FeHByZXNzaW9uJztcbmltcG9ydCB7IEZyYW1lIH0gZnJvbSAnLi4vcmVuZGVyZXIvRnJhbWUnO1xuaW1wb3J0IHsgTGlnaHRDbHVzdGVyU3lzdGVtIH0gZnJvbSAnLi4vcmVuZGVyZXIvbGlnaHRDbHVzdGVyL0xpZ2h0Q2x1c3RlclN5c3RlbSc7XG5pbXBvcnQgeyBSZW5kZXJQYXNzIH0gZnJvbSAnLi4vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgeyBFbmdpbmVTdGF0ZSB9IGZyb20gJy4vRW5naW5lU3RhdGUnO1xuaW1wb3J0IHsgTW9kdWxlTWFuYWdlciB9IGZyb20gJy4vTW9kdWxlTWFuYWdlcic7XG5cbmRlY2xhcmUgY29uc3Qgc3BlY3RvcjogYW55O1xuXG5pbXBvcnQgeyBXZWJHTEdwdVRpbWVyIH0gZnJvbSAnLi4vLi4vd2ViZ2wvV2ViR0xHcHVUaW1lcic7XG5pbXBvcnQgeyBfY2xlYW51cFdlYkdMU3RhdGVzQ2FjaGVGb3JFbmdpbmUgfSBmcm9tICcuLi8uLi93ZWJnbC9XZWJHTFN0cmF0ZWd5Q29tbW9uTWV0aG9kJztcbmltcG9ydCB0eXBlIHsgV2ViQVJTeXN0ZW0gfSBmcm9tICcuLi8uLi94ci9XZWJBUlN5c3RlbSc7XG5pbXBvcnQgdHlwZSB7IFdlYlhSU3lzdGVtIH0gZnJvbSAnLi4vLi4veHIvV2ViWFJTeXN0ZW0nO1xuaW1wb3J0IHsgUm5PYmplY3QgfSBmcm9tICcuLi9jb3JlL1JuT2JqZWN0JztcbmltcG9ydCB7IF9jbGVhbnVwR2l6bW9zRm9yRW5naW5lIH0gZnJvbSAnLi4vZ2l6bW9zL0dpem1vUmVnaXN0cnknO1xuaW1wb3J0IHsgX2NsZWFudXBSZW5kZXJQYXNzSGVscGVyRm9yRW5naW5lIH0gZnJvbSAnLi4vaGVscGVycy9SZW5kZXJQYXNzSGVscGVyJztcbmltcG9ydCB7IEFic3RyYWN0TWF0ZXJpYWxDb250ZW50IH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQnO1xuaW1wb3J0IHsgTWF0ZXJpYWxSZXBvc2l0b3J5IH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWxSZXBvc2l0b3J5JztcblxudHlwZSBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zID0geyBjb2xvckZvcm1hdD86IEdQVVRleHR1cmVGb3JtYXQ7IGRlcHRoRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdCB9O1xuXG50eXBlIERlZmVycmVkRWZmZWtzZWVyV2ViR1BVUmVuZGVySm9iID0ge1xuICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzO1xuICBkaXNwbGF5SWR4OiBudW1iZXI7XG4gIHJlbmRlclBhc3NPcHRpb25zPzogV2ViR1BVRXh0ZXJuYWxSZW5kZXJQYXNzT3B0aW9ucztcbiAgZWZmZWtzZWVyQ29tcG9uZW50czogRWZmZWtzZWVyQ29tcG9uZW50W107XG59O1xuXG4vKipcbiAqIFRoZSBhcmd1bWVudCB0eXBlIGZvciBFbmdpbmUuaW5pdCgpIG1ldGhvZC5cbiAqL1xuaW50ZXJmYWNlIEVuZ2luZUluaXREZXNjcmlwdGlvbiB7XG4gIGFwcHJvYWNoOiBQcm9jZXNzQXBwcm9hY2hFbnVtO1xuICBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICB3ZWJnbE9wdGlvbj86IFdlYkdMQ29udGV4dEF0dHJpYnV0ZXM7XG4gIG5vdFRvRGlzcGxheVJuSW5mb0F0SW5pdD86IGJvb2xlYW47XG4gIGNvbmZpZz86IENvbmZpZztcbiAgLyoqXG4gICAqIExvYWRzIHRoZSBXZWJYUi9XZWJBUiBzdXBwb3J0IChgZW5naW5lLndlYlhSU3lzdGVtYCwgYGVuZ2luZS53ZWJBUlN5c3RlbWApIGR1cmluZyBpbml0aWFsaXphdGlvbi5cbiAgICogRGVmYXVsdHMgdG8gZmFsc2UgZm9yIG5hbWVkIGltcG9ydHMsIGFuZCB0byB0cnVlIHdoZW4gdGhlIGRlZmF1bHQgYFJuYCBuYW1lc3BhY2UgZXhwb3J0IGlzIHVzZWQuXG4gICAqIEl0IGNhbiBhbHNvIGJlIGVuYWJsZWQgbGF0ZXIgd2l0aCBgYXdhaXQgZW5naW5lLmVuYWJsZVhSKClgLlxuICAgKi9cbiAgeHI/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRoZSBzeXN0ZW0gY2xhc3MgaXMgdGhlIGVudHJ5IHBvaW50IG9mIHRoZSBSaG9kb25pdGUgbGlicmFyeS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgXG4gKiBjb25zdCBlbmdpbmUgPSBhd2FpdCBSbi5FbmdpbmUuaW5pdCh7XG4gKiAgIGFwcHJvYWNoOiBSbi5Qcm9jZXNzQXBwcm9hY2guV2ViR0wyLFxuICogICBjYW52YXM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3b3JsZCcpIGFzIEhUTUxDYW52YXNFbGVtZW50LFxuICogfSk7XG4gKlxuICogLi4uIChjcmVhdGUgc29tZXRoaW5nKSAuLi5cbiAqXG4gKiBlbmdpbmUuc3RhcnRSZW5kZXJMb29wKCh0aW1lLCBfbXlBcmcxLCBfbXlBcmcyKSA9PiB7XG4gKiAgIFJuLkVuZ2luZS5wcm9jZXNzKFtleHByZXNzaW9uXSk7XG4gKiB9LCBteUFyZzEsIG15QXJnMik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEVuZ2luZSBleHRlbmRzIFJuT2JqZWN0IHtcbiAgcHJpdmF0ZSBfX2V4cHJlc3Npb25Gb3JQcm9jZXNzQXV0bz86IEV4cHJlc3Npb247XG4gIHByaXZhdGUgX19yZW5kZXJQYXNzRm9yUHJvY2Vzc0F1dG8/OiBSZW5kZXJQYXNzO1xuICBwcml2YXRlIF9fcHJvY2Vzc0FwcHJvYWNoOiBQcm9jZXNzQXBwcm9hY2hFbnVtID0gUHJvY2Vzc0FwcHJvYWNoLk5vbmU7XG4gIHByaXZhdGUgX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTogSUNHQVBJUmVzb3VyY2VSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk/OiBXZWJHTFJlc291cmNlUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeT86IFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX2VuZ2luZVN0YXRlID0gbmV3IEVuZ2luZVN0YXRlKCk7XG4gIHByaXZhdGUgX19yZW5kZXJQYXNzVGlja0NvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2FuaW1hdGlvbkZyYW1lSWQgPSAtMTtcbiAgLyoqIFRoZSBvYmplY3QgKFdpbmRvdyBvciBYUlNlc3Npb24pIHRoYXQgb3ducyB0aGUgY3VycmVudCBhbmltYXRpb24gZnJhbWUgY2FsbGJhY2suICovXG4gIHByaXZhdGUgX19hbmltYXRpb25GcmFtZU9iamVjdD86IFdpbmRvdyB8IFhSU2Vzc2lvbjtcblxuICBwcml2YXRlIF9fcmVuZGVyTG9vcEZ1bmM/OiAodGltZTogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBfX2FyZ3M6IHVua25vd25bXSA9IFtdO1xuICBwcml2YXRlIF9fd2ViWFJTeXN0ZW0/OiBXZWJYUlN5c3RlbTtcbiAgcHJpdmF0ZSBfX3dlYkFSU3lzdGVtPzogV2ViQVJTeXN0ZW07XG4gIC8qKlxuICAgKiBXaGV0aGVyIGBFbmdpbmUuaW5pdGAgbG9hZHMgdGhlIFhSIHN1cHBvcnQgd2hlbiBgRW5naW5lSW5pdERlc2NyaXB0aW9uLnhyYCBpcyBvbWl0dGVkLlxuICAgKiBUaGUgZGVmYXVsdCBgUm5gIG5hbWVzcGFjZSBleHBvcnQgc2V0cyBpdCB0byB0cnVlIGZvciBjb21wYXRpYmlsaXR5LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfbG9hZFhSQnlEZWZhdWx0ID0gZmFsc2U7XG4gIHByaXZhdGUgX19lbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fY29tcG9uZW50UmVwb3NpdG9yeTogQ29tcG9uZW50UmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX2NvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5OiBDb21wb25lbnRNZW1vcnlSZWdpc3RyeTtcbiAgcHJpdmF0ZSBfX21lbW9yeU1hbmFnZXI/OiBNZW1vcnlNYW5hZ2VyO1xuICBwcml2YXRlIF9fbWF0ZXJpYWxSZXBvc2l0b3J5OiBNYXRlcmlhbFJlcG9zaXRvcnk7XG4gIHByaXZhdGUgX19nbG9iYWxEYXRhUmVwb3NpdG9yeTogR2xvYmFsRGF0YVJlcG9zaXRvcnk7XG4gIHByaXZhdGUgX19saWdodENsdXN0ZXJTeXN0ZW06IExpZ2h0Q2x1c3RlclN5c3RlbTtcbiAgcHJpdmF0ZSBfX2NvbmZpZzogQ29uZmlnO1xuICBwcml2YXRlIF9fbG9nZ2VyOiBMb2dnZXI7XG4gIHByaXZhdGUgX19kdW1teVRleHR1cmVzPzogRHVtbXlUZXh0dXJlcztcbiAgcHJpdmF0ZSBfX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RQcmltaXRpdmVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBTaGFkZXIgcHJvZ3JhbSBjYWNoZSBtYXAgZm9yIHRoaXMgZW5naW5lIGluc3RhbmNlLiBNYXBzIHNoYWRlciB0ZXh0IHRvIHByb2dyYW0gVUlEcy4gKi9cbiAgcHJpdmF0ZSBfX3NoYWRlclByb2dyYW1DYWNoZTogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2dwdVRpbWVyRW5hYmxlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fd2ViZ2xHcHVUaW1lcj86IFdlYkdMR3B1VGltZXI7XG4gIHByaXZhdGUgc3RhdGljIF9fZW5naW5lczogTWFwPE9iamVjdFVJRCwgRW5naW5lPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19lbmdpbmVDb3VudCA9IDA7XG4gIHByaXZhdGUgX19lbmdpbmVVaWQ6IEluZGV4ID0gLTE7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICBwcm9jZXNzQXBwcm9hY2g6IFByb2Nlc3NBcHByb2FjaEVudW0sXG4gICAgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk6IElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICBtYXhHUFVEYXRhU3RvcmFnZVNpemU6IEJ5dGUsXG4gICAgY29uZmlnPzogQ29uZmlnLFxuICAgIHJuWFJNb2R1bGU/OiBSblhSXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2NvbmZpZyA9IGNvbmZpZyA/PyBuZXcgQ29uZmlnKCk7XG4gICAgdGhpcy5fX2xvZ2dlciA9IG5ldyBMb2dnZXIoKTtcbiAgICB0aGlzLl9fbG9nZ2VyLmxvZ0xldmVsID0gdGhpcy5fX2NvbmZpZy5sb2dMZXZlbDtcbiAgICB0aGlzLl9fZW5naW5lVWlkID0gRW5naW5lLl9fZW5naW5lQ291bnQ7XG4gICAgdGhpcy5fX3Byb2Nlc3NBcHByb2FjaCA9IHByb2Nlc3NBcHByb2FjaDtcbiAgICB0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB0aGlzLl9fY29tcG9uZW50TWVtb3J5UmVnaXN0cnkgPSBuZXcgQ29tcG9uZW50TWVtb3J5UmVnaXN0cnkoKTtcbiAgICB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeSA9IG5ldyBDb21wb25lbnRSZXBvc2l0b3J5KHRoaXMpO1xuICAgIHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5ID0gbmV3IEVudGl0eVJlcG9zaXRvcnkodGhpcyk7XG4gICAgdGhpcy5fX21hdGVyaWFsUmVwb3NpdG9yeSA9IG5ldyBNYXRlcmlhbFJlcG9zaXRvcnkoKTtcbiAgICB0aGlzLl9fbWVtb3J5TWFuYWdlciA9IE1lbW9yeU1hbmFnZXIuY3JlYXRlSW5zdGFuY2VJZk5vdENyZWF0ZWQodGhpcywgbWF4R1BVRGF0YVN0b3JhZ2VTaXplKTtcbiAgICAvLyBUaGUgWFIgc3lzdGVtcyBjcmVhdGUgdGhlaXIgdmlld2VyIGFuZCBjYW1lcmEgZW50aXRpZXMsIHNvIHRoZXkgYXJlIGluaXRpYWxpemVkIGF0IHRoZSBzYW1lIHBvaW50IGFzXG4gICAgLy8gYmVmb3JlIHRoZSBYUiBzdXBwb3J0IGJlY2FtZSBvcHRpb25hbDsgZW50aXR5IGFuZCBjb21wb25lbnQgSURzIHN0YXkgdW5jaGFuZ2VkIHdoZW4gaXQgaXMgZW5hYmxlZC5cbiAgICBpZiAocm5YUk1vZHVsZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9faW5pdFhSU3lzdGVtcyhyblhSTW9kdWxlKTtcbiAgICB9XG4gICAgdGhpcy5fX2dsb2JhbERhdGFSZXBvc2l0b3J5ID0gR2xvYmFsRGF0YVJlcG9zaXRvcnkuaW5pdCh0aGlzKTtcbiAgICB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtID0gbmV3IExpZ2h0Q2x1c3RlclN5c3RlbSh0aGlzKTtcbiAgICBFbmdpbmUuX19lbmdpbmVDb3VudCsrO1xuICB9XG5cbiAgcHVibGljIGdldCBlbmdpbmVVaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmVVaWQ7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldEVuZ2luZShvYmplY3RVaWQ6IE9iamVjdFVJRCkge1xuICAgIGNvbnN0IGVuZ2luZSA9IEVuZ2luZS5fX2VuZ2luZXMuZ2V0KG9iamVjdFVpZCk7XG4gICAgaWYgKElzLm5vdC5leGlzdChlbmdpbmUpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZW5naW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBlbmdpbmUgYW5kIHJlbGVhc2VzIGFsbCBhc3NvY2lhdGVkIHJlc291cmNlcy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgYSBjb21wcmVoZW5zaXZlIGNsZWFudXAgb2YgYWxsIGVuZ2luZSByZXNvdXJjZXMgaW5jbHVkaW5nOlxuICAgKiAtIFN0b3BwaW5nIHRoZSByZW5kZXIgbG9vcFxuICAgKiAtIERlbGV0aW5nIGFsbCBlbnRpdGllcyBhbmQgdGhlaXIgY29tcG9uZW50c1xuICAgKiAtIERlc3Ryb3lpbmcgYWxsIHRleHR1cmVzIChpbmNsdWRpbmcgZHVtbXkgdGV4dHVyZXMpXG4gICAqIC0gQ2xlYXJpbmcgbWF0ZXJpYWwgcmVwb3NpdG9yeSBkYXRhXG4gICAqIC0gUmVsZWFzaW5nIEdQVSByZXNvdXJjZXMgKFdlYkdML1dlYkdQVSlcbiAgICogLSBDbGVhcmluZyBtZW1vcnkgbWFuYWdlciBidWZmZXJzXG4gICAqXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHRoZSBlbmdpbmUgaW5zdGFuY2Ugc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGVuZ2luZSA9IGF3YWl0IFJuLkVuZ2luZS5pbml0KHsgLi4uIH0pO1xuICAgKiAvLyAuLi4gdXNlIHRoZSBlbmdpbmUgLi4uXG4gICAqIGVuZ2luZS5kZXN0cm95KCk7IC8vIENsZWFuIHVwIGFsbCByZXNvdXJjZXNcbiAgICogYGBgXG4gICAqL1xuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGVuZ2luZSBhbmQgcmVsZWFzZXMgYWxsIGFzc29jaWF0ZWQgcmVzb3VyY2VzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyBhIGNvbXByZWhlbnNpdmUgY2xlYW51cCBvZiBhbGwgZW5naW5lIHJlc291cmNlcyBpbmNsdWRpbmc6XG4gICAqIC0gU3RvcHBpbmcgdGhlIHJlbmRlciBsb29wXG4gICAqIC0gSW52YWxpZGF0aW5nIGFsbCBzaGFkZXIgY2FjaGVzIGluIG1hdGVyaWFsc1xuICAgKiAtIERlbGV0aW5nIGFsbCBlbnRpdGllcyBhbmQgdGhlaXIgY29tcG9uZW50c1xuICAgKiAtIERlc3Ryb3lpbmcgYWxsIHRleHR1cmVzIChpbmNsdWRpbmcgZHVtbXkgdGV4dHVyZXMpXG4gICAqIC0gQ2xlYXJpbmcgbWF0ZXJpYWwgcmVwb3NpdG9yeSBkYXRhXG4gICAqIC0gUmVsZWFzaW5nIEdQVSByZXNvdXJjZXMgKFdlYkdML1dlYkdQVSlcbiAgICogLSBDbGVhcmluZyBtZW1vcnkgbWFuYWdlciBidWZmZXJzXG4gICAqXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHRoZSBlbmdpbmUgaW5zdGFuY2Ugc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgKi9cbiAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5zdG9wUmVuZGVyTG9vcCgpO1xuICAgIHRoaXMuX19yZW5kZXJMb29wRnVuYyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fYXJncyA9IFtdO1xuICAgIHRoaXMuX19kZXN0cm95UmVzb3VyY2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRoYXQgcGVyZm9ybXMgdGhlIGFjdHVhbCByZXNvdXJjZSBjbGVhbnVwLlxuICAgKiBDYWxsZWQgYWZ0ZXIgdGhlIHJlbmRlciBsb29wIGhhcyBmdWxseSBzdG9wcGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2Rlc3Ryb3lSZXNvdXJjZXMoKTogdm9pZCB7XG4gICAgLy8gSW52YWxpZGF0ZSBhbGwgc2hhZGVyIGNhY2hlcyBpbiBtYXRlcmlhbHMgYmVmb3JlIGRlbGV0aW5nIGVudGl0aWVzXG4gICAgLy8gVGhpcyBlbnN1cmVzIHNoYWRlcnMgd2lsbCBiZSByZWNvbXBpbGVkIHdpdGggbmV3IFdlYkdMIHJlc291cmNlcyBvbiBuZXh0IGVuZ2luZSBpbml0XG4gICAgdGhpcy5fX21hdGVyaWFsUmVwb3NpdG9yeS5fbWFrZVNoYWRlckludmFsaWRhdGVUb0FsbE1hdGVyaWFscygpO1xuXG4gICAgLy8gRGVsZXRlIGFsbCBlbnRpdGllcyAodGhpcyBhbHNvIGNsZWFucyB1cCBhbGwgY29tcG9uZW50cylcbiAgICBjb25zdCBlbnRpdGllcyA9IHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5Ll9nZXRFbnRpdGllcygpO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeS5kZWxldGVFbnRpdHkoZW50aXR5LmVudGl0eVVJRCk7XG4gICAgfVxuXG4gICAgLy8gRGVzdHJveSBkdW1teSB0ZXh0dXJlc1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fZHVtbXlUZXh0dXJlcykpIHtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVzLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVzID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIENsZWFyIFdlYkdQVSBjYWNoZSBhbmQgdW5jb25maWd1cmUgY29udGV4dCBpZiB1c2luZyBXZWJHUFVcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSkpIHtcbiAgICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgLy8gVW5jb25maWd1cmUgdGhlIFdlYkdQVSBjYW52YXMgY29udGV4dCB0byBhbGxvdyBpdCB0byBiZSByZWNvbmZpZ3VyZWQgb24gbmV4dCBpbml0XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZXZpY2VXcmFwcGVyID0gdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk7XG4gICAgICAgIGlmIChkZXZpY2VXcmFwcGVyKSB7XG4gICAgICAgICAgZGV2aWNlV3JhcHBlci5jb250ZXh0LnVuY29uZmlndXJlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgIC8vIElnbm9yZSBlcnJvcnMgaWYgZGV2aWNlIHdyYXBwZXIgaXMgbm90IGF2YWlsYWJsZVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlc3Ryb3kgbWVtb3J5IG1hbmFnZXIgYW5kIHJlbGVhc2UgYWxsb2NhdGVkIGJ1ZmZlcnNcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX21lbW9yeU1hbmFnZXIpKSB7XG4gICAgICB0aGlzLl9fbWVtb3J5TWFuYWdlci5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9fbWVtb3J5TWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBPcHRpb25hbCBjb21wb25lbnQgbW9kdWxlcyBjbGVhbiB1cCB0aGVpciBvd24gRW5naW5lLWtleWVkIHN0YXRlLlxuICAgIHRoaXMuX19jbGVhbnVwQ29tcG9uZW50UnVudGltZUhvb2tzKCk7XG5cbiAgICAvLyBDbGVhbiB1cCBzdGF0aWMgcmVzb3VyY2VzIGluIGNvbXBvbmVudHMgdGhhdCB1c2UgRW5naW5lLWtleWVkIG1hcHNcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fY2xlYW51cEZvckVuZ2luZSh0aGlzKTtcbiAgICBDYW1lcmFDb21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgTGlnaHRDb21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuICAgIF9nZXRQaHlzaWNzQmFja2VuZCgpPy5jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgZ2l6bW8gcmVzb3VyY2VzIHRoYXQgYXJlIG1hbmFnZWQgcGVyLUVuZ2luZVxuICAgIF9jbGVhbnVwR2l6bW9zRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgbWF0ZXJpYWwgY29udGVudCBjYWNoZXMgZm9yIHRoaXMgZW5naW5lXG4gICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG5cbiAgICAvLyBDbGVhbiB1cCBSZW5kZXJQYXNzSGVscGVyIHNhbXBsZXIgY2FjaGUgZm9yIHRoaXMgZW5naW5lXG4gICAgX2NsZWFudXBSZW5kZXJQYXNzSGVscGVyRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgV2ViR0wgc3RhdGUgY2FjaGUgZm9yIHRoaXMgZW5naW5lIChibGVuZCBtb2RlcywgY3VsbCBmYWNlLCBldGMuKVxuICAgIF9jbGVhbnVwV2ViR0xTdGF0ZXNDYWNoZUZvckVuZ2luZSh0aGlzKTtcblxuICAgIHRoaXMuX193ZWJnbEdwdVRpbWVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3dlYmdsR3B1VGltZXIgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBDbGVhciBjb21wb25lbnQgbWVtb3J5IHJlZ2lzdHJ5XG4gICAgdGhpcy5fX2NvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5LmRlc3Ryb3koKTtcblxuICAgIC8vIENsZWFyIGV4cHJlc3Npb25zIGFuZCByZW5kZXIgcGFzc2VzIHVzZWQgZm9yIHByb2Nlc3NBdXRvXG4gICAgdGhpcy5fX2V4cHJlc3Npb25Gb3JQcm9jZXNzQXV0byA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmVuZGVyUGFzc0ZvclByb2Nlc3NBdXRvID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gUmVzZXQgaW50ZXJuYWwgc3RhdGVcbiAgICB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCA9IDA7XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICAgIHRoaXMuX19sYXN0UHJpbWl0aXZlQ291bnQgPSAtMTtcblxuICAgIC8vIFJlbW92ZSBmcm9tIHN0YXRpYyBlbmdpbmVzIG1hcCBhbmQgdW5yZWdpc3RlclxuICAgIEVuZ2luZS5fX2VuZ2luZXMuZGVsZXRlKHRoaXMub2JqZWN0VUlEKTtcbiAgICB0aGlzLnVucmVnaXN0ZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgYSByZW5kZXIgbG9vcC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIFJuLkVuZ2luZS5zdGFydFJlbmRlckxvb3AoKHRpbWUsIF9teUFyZzEsIF9teUFyZzIpID0+IHtcbiAgICogICBSbi5FbmdpbmUucHJvY2VzcyhbZXhwcmVzc2lvbl0pO1xuICAgKiB9LCBteUFyZzEsIG15QXJnMik7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcmVuZGVyTG9vcEZ1bmMgLSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgaW4gZWFjaCBmcmFtZVxuICAgKiBAcGFyYW0gYXJncyAtIGFyZ3VtZW50cyB5b3Ugd2FudCB0byBiZSBwYXNzZWQgdG8gcmVuZGVyTG9vcEZ1bmNcbiAgICovXG4gIHB1YmxpYyBzdGFydFJlbmRlckxvb3AocmVuZGVyTG9vcEZ1bmM6ICh0aW1lOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIHRoaXMuX19yZW5kZXJMb29wRnVuYyA9IHJlbmRlckxvb3BGdW5jO1xuICAgIHRoaXMuX19hcmdzID0gYXJncztcblxuICAgIC8vIENhbmNlbCBhIHN0aWxsIHBlbmRpbmcgZnJhbWUgZmlyc3Qgc28gdGhhdCBjYWxsaW5nIHN0YXJ0UmVuZGVyTG9vcCB0d2ljZVxuICAgIC8vIG5ldmVyIGxlYXZlcyB0d28gbG9vcHMgcnVubmluZyBpbiBwYXJhbGxlbC5cbiAgICBpZiAodGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQgIT09IC0xKSB7XG4gICAgICB0aGlzLnN0b3BSZW5kZXJMb29wKCk7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0aW9uRnJhbWVPYmplY3QgPSB0aGlzLl9fZ2V0QW5pbWF0aW9uRnJhbWVPYmplY3QoKTtcbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVPYmplY3QgPSBhbmltYXRpb25GcmFtZU9iamVjdDtcblxuICAgIC8vIENhY2hlIGV2ZXJ5dGhpbmcgdGhlIGhvdCBwYXRoIG5lZWRzIGluIGxvY2FsIHZhcmlhYmxlcy4gUmVzb2x2aW5nIHRoZVxuICAgIC8vIGBXaW5kb3cgfCBYUlNlc3Npb25gIHVuaW9uIGFuZCB0aGUgY2xhc3MgZmllbGRzIG9uIGV2ZXJ5IGZyYW1lIGNvc3RzIG1vcmVcbiAgICAvLyB0aGFuIHRoZSBsb29wIGJvZHkgaXRzZWxmLlxuICAgIGNvbnN0IHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGFuaW1hdGlvbkZyYW1lT2JqZWN0LnJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKGFuaW1hdGlvbkZyYW1lT2JqZWN0KTtcbiAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBjb25zdCB3ZWJBUlN5c3RlbSA9IHRoaXMuX193ZWJBUlN5c3RlbTtcblxuICAgIC8vIFRoZSBleHRyYSBhcmd1bWVudHMgYXJlIGltbXV0YWJsZSBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBsb29wLCBzbyB0aGV5XG4gICAgLy8gYXJlIGNvcGllZCBvbmNlLiBTbG90IDAgaXMgcmVzZXJ2ZWQgZm9yIHRoZSBjdXJyZW50IHRpbWUgYW5kIG92ZXJ3cml0dGVuXG4gICAgLy8gaW4gcGxhY2UsIHdoaWNoIGtlZXBzIHRoZSBwZXItZnJhbWUgcGF0aCBmcmVlIG9mIGFycmF5IGFsbG9jYXRpb25zIGFuZFxuICAgIC8vIHNwcmVhZC9hcHBseSBvdmVyaGVhZCBpbiB0aGUgY29tbW9uIChubyBleHRyYSBhcmdzKSBjYXNlLlxuICAgIGNvbnN0IGhhc0V4dHJhQXJncyA9IGFyZ3MubGVuZ3RoID4gMDtcbiAgICBjb25zdCBjYWxsQXJnczogYW55W10gPSBoYXNFeHRyYUFyZ3MgPyBbMCwgLi4uYXJnc10gOiBbXTtcblxuICAgIGNvbnN0IGludm9rZVJlbmRlckxvb3BGdW5jID0gaGFzRXh0cmFBcmdzXG4gICAgICA/ICh0aW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBjYWxsQXJnc1swXSA9IHRpbWU7XG4gICAgICAgICAgcmVuZGVyTG9vcEZ1bmMuYXBwbHkocmVuZGVyTG9vcEZ1bmMsIGNhbGxBcmdzIGFzIFtudW1iZXIsIC4uLmFueVtdXSk7XG4gICAgICAgIH1cbiAgICAgIDogKHRpbWU6IG51bWJlcikgPT4ge1xuICAgICAgICAgIHJlbmRlckxvb3BGdW5jLmNhbGwocmVuZGVyTG9vcEZ1bmMsIHRpbWUpO1xuICAgICAgICB9O1xuXG4gICAgY29uc3QgX19yZW5kZXJMb29wRnVuYyA9ICgoX3RpbWU6IG51bWJlciwgeHJGcmFtZTogWFJGcmFtZSkgPT4ge1xuICAgICAgaWYgKHdlYlhSU3lzdGVtPy5pc1JlYWR5Rm9yV2ViWFIpIHtcbiAgICAgICAgd2ViWFJTeXN0ZW0uX3ByZVJlbmRlcihfdGltZSwgeHJGcmFtZSk7XG4gICAgICAgIGludm9rZVJlbmRlckxvb3BGdW5jKF90aW1lKTtcbiAgICAgICAgd2ViWFJTeXN0ZW0uX3Bvc3RSZW5kZXIoKTtcbiAgICAgIH0gZWxzZSBpZiAod2ViQVJTeXN0ZW0/LmlzUmVhZHlGb3JXZWJBUikge1xuICAgICAgICB3ZWJBUlN5c3RlbS5fcHJlUmVuZGVyKF90aW1lLCB4ckZyYW1lKTtcbiAgICAgICAgaW52b2tlUmVuZGVyTG9vcEZ1bmMoX3RpbWUpO1xuICAgICAgICB3ZWJBUlN5c3RlbS5fcG9zdFJlbmRlcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW52b2tlUmVuZGVyTG9vcEZ1bmMoX3RpbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoX19yZW5kZXJMb29wRnVuYyk7XG4gICAgfSkgYXMgRnJhbWVSZXF1ZXN0Q2FsbGJhY2s7XG5cbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShfX3JlbmRlckxvb3BGdW5jKTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRBbmltYXRpb25GcmFtZU9iamVjdCgpOiBXaW5kb3cgfCBYUlNlc3Npb24ge1xuICAgIGxldCBhbmltYXRpb25GcmFtZU9iamVjdDogV2luZG93IHwgWFJTZXNzaW9uIHwgdW5kZWZpbmVkID0gd2luZG93O1xuICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICAgIGNvbnN0IHdlYkFSU3lzdGVtID0gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICAgIGlmICh3ZWJYUlN5c3RlbT8ucmVxdWVzdGVkVG9FbnRlcldlYlhSKSB7XG4gICAgICBhbmltYXRpb25GcmFtZU9iamVjdCA9IHdlYlhSU3lzdGVtLnhyU2Vzc2lvbjtcbiAgICB9IGVsc2UgaWYgKHdlYkFSU3lzdGVtPy5yZXF1ZXN0ZWRUb0VudGVyV2ViQVIpIHtcbiAgICAgIGFuaW1hdGlvbkZyYW1lT2JqZWN0ID0gd2ViQVJTeXN0ZW0uYXJTZXNzaW9uO1xuICAgIH1cbiAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkZyYW1lT2JqZWN0KSkge1xuICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG4gICAgcmV0dXJuIGFuaW1hdGlvbkZyYW1lT2JqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIGEgZXhpc3RpbmcgcmVuZGVyIGxvb3AuXG4gICAqL1xuICBwdWJsaWMgc3RvcFJlbmRlckxvb3AoKSB7XG4gICAgLy8gQ2FuY2VsIG9uIHRoZSBzYW1lIG9iamVjdCB0aGF0IHdhcyB1c2VkIHRvIHJlcXVlc3QgdGhlIGZyYW1lLiBBc2tpbmdcbiAgICAvLyBfX2dldEFuaW1hdGlvbkZyYW1lT2JqZWN0KCkgYWdhaW4gY291bGQgcmV0dXJuIGEgZGlmZmVyZW50IG9iamVjdCAoZS5nLlxuICAgIC8vIHdoZW4gYW4gWFIgc2Vzc2lvbiBoYXMganVzdCBlbmRlZCkgYW5kIHRoZSBvbGQgbG9vcCB3b3VsZCBrZWVwIHJ1bm5pbmcuXG4gICAgY29uc3QgYW5pbWF0aW9uRnJhbWVPYmplY3QgPSB0aGlzLl9fYW5pbWF0aW9uRnJhbWVPYmplY3QgPz8gdGhpcy5fX2dldEFuaW1hdGlvbkZyYW1lT2JqZWN0KCk7XG4gICAgaWYgKHRoaXMuX19hbmltYXRpb25GcmFtZUlkICE9PSAtMSkge1xuICAgICAgYW5pbWF0aW9uRnJhbWVPYmplY3QuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQpO1xuICAgIH1cbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVJZCA9IC0xO1xuICAgIHRoaXMuX19hbmltYXRpb25GcmFtZU9iamVjdCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXJ0IGEgcmVuZGVyIGxvb3AuXG4gICAqL1xuICBwdWJsaWMgcmVzdGFydFJlbmRlckxvb3AoKSB7XG4gICAgaWYgKHRoaXMuX19yZW5kZXJMb29wRnVuYyAhPSBudWxsKSB7XG4gICAgICB0aGlzLnN0YXJ0UmVuZGVyTG9vcCh0aGlzLl9fcmVuZGVyTG9vcEZ1bmMsIC4uLnRoaXMuX19hcmdzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSBTaW1wbGUgdmVyc2lvbiBvZiBwcm9jZXNzIG1ldGhvZFxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBObyBuZWVkIHRvIGNyZWF0ZSBleHByZXNzaW9ucyBhbmQgcmVuZGVyUGFzc2VzIGFuZCB0byByZWdpc3RlciBlbnRpdGllcywgZXRjLi4uXG4gICAqIEl0J3Mgc3VpdGFibGUgZm9yIHNpbXBsZSB1c2UgY2FzZXMgbGlrZSBzYW1wbGUgYXBwcy5cbiAgICpcbiAgICogQHBhcmFtIGNsZWFyQ29sb3IgLSBjb2xvciB0byBjbGVhciB0aGUgY2FudmFzXG4gICAqL1xuICBwdWJsaWMgcHJvY2Vzc0F1dG8oY2xlYXJDb2xvciA9IFZlY3RvcjQuZnJvbUNvcHk0KDAsIDAsIDAsIDEpKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvKSkge1xuICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IG5ldyBFeHByZXNzaW9uKCk7XG4gICAgICBjb25zdCByZW5kZXJQYXNzSW5pdCA9IG5ldyBSZW5kZXJQYXNzKHRoaXMpO1xuICAgICAgcmVuZGVyUGFzc0luaXQudG9DbGVhckNvbG9yQnVmZmVyID0gdHJ1ZTtcbiAgICAgIHJlbmRlclBhc3NJbml0LnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRydWU7XG4gICAgICByZW5kZXJQYXNzSW5pdC5jbGVhckNvbG9yID0gY2xlYXJDb2xvcjtcbiAgICAgIGNvbnN0IHJlbmRlclBhc3NNYWluID0gbmV3IFJlbmRlclBhc3ModGhpcyk7XG4gICAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhbcmVuZGVyUGFzc0luaXQsIHJlbmRlclBhc3NNYWluXSk7XG4gICAgICB0aGlzLl9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvID0gZXhwcmVzc2lvbjtcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRm9yUHJvY2Vzc0F1dG8gPSByZW5kZXJQYXNzTWFpbjtcbiAgICB9XG4gICAgdGhpcy5fX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0byEuY2xlYXJFbnRpdGllcygpO1xuICAgIGNvbnN0IGVudGl0aWVzID0gdGhpcy5fX2VudGl0eVJlcG9zaXRvcnkuX2dldEVudGl0aWVzKCk7XG4gICAgdGhpcy5fX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0byEuYWRkRW50aXRpZXMoZW50aXRpZXMgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eVtdKTtcbiAgICB0aGlzLnByb2Nlc3MoW3RoaXMuX19leHByZXNzaW9uRm9yUHJvY2Vzc0F1dG9dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb2Nlc3MgbWV0aG9kIHRvIHJlbmRlciBhIHNjZW5lXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFlvdSBuZWVkIHRvIGNhbGwgdGhpcyBtZXRob2QgZm9yIHJlbmRlcmluZy5cbiAgICpcbiAgICogQHBhcmFtIGZyYW1lL2V4cHJlc3Npb24gLSBhIGZyYW1lL2V4cHJlc3Npb24gb2JqZWN0XG4gICAqL1xuICBwdWJsaWMgcHJvY2VzcyhmcmFtZTogRnJhbWUpOiB2b2lkO1xuICBwdWJsaWMgcHJvY2VzcyhleHByZXNzaW9uczogRXhwcmVzc2lvbltdKTogdm9pZDtcbiAgcHVibGljIHByb2Nlc3ModmFsdWU6IGFueSkge1xuICAgIGNvbnN0IGdwdVRpbWVyRW5hYmxlZCA9IHRoaXMuX19ncHVUaW1lckVuYWJsZWQ7XG4gICAgaWYgKGdwdVRpbWVyRW5hYmxlZCkge1xuICAgICAgdGhpcy5fX2JlZ2luR3B1VGltZXIoKTtcbiAgICB9XG4gICAgVGltZS5fcHJvY2Vzc0JlZ2luKHRoaXMpO1xuICAgIHRoaXMuX19wcm9jZXNzQ29tcG9uZW50UnVudGltZUhvb2tzQmVnaW5GcmFtZSgpO1xuICAgIGxldCBleHByZXNzaW9uczogRXhwcmVzc2lvbltdID0gdmFsdWU7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnJhbWUpIHtcbiAgICAgIGV4cHJlc3Npb25zID0gdmFsdWUuZXhwcmVzc2lvbnM7XG4gICAgfVxuXG4gICAgaWYgKENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KHRoaXMpID09PSBDb21wb25lbnQuSW52YWxpZE9iamVjdFVJRCkge1xuICAgICAgRW5naW5lLmNyZWF0ZUNhbWVyYSh0aGlzKTtcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lID0gdGhpcy5fX2dsb2JhbERhdGFSZXBvc2l0b3J5LmdldFZhbHVlKCd0aW1lJywgMCkgYXMgU2NhbGFyO1xuICAgIHRpbWUuX3ZbMF0gPSBUaW1lLnRpbWVGcm9tU3lzdGVtU3RhcnQ7XG5cbiAgICBpZiAodGhpcy5wcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NXZWJHUFUoZXhwcmVzc2lvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wcm9jZXNzV2ViR0woZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIFRpbWUuX3Byb2Nlc3NFbmQoKTtcbiAgICBpZiAoZ3B1VGltZXJFbmFibGVkKSB7XG4gICAgICB0aGlzLl9fZW5kR3B1VGltZXIoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgR1BVIHRpbWUgb2YgZWFjaCBwcm9jZXNzKCkgY2FsbCBpcyBtZWFzdXJlZC5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogRGlzYWJsZWQgYnkgZGVmYXVsdC4gTWVhc3VyaW5nIHVzZXMgR1BVIHRpbWVyIHF1ZXJpZXMgKEVYVF9kaXNqb2ludF90aW1lcl9xdWVyeV93ZWJnbDIgaW4gV2ViR0wyLCB0aGVcbiAgICogYHRpbWVzdGFtcC1xdWVyeWAgZmVhdHVyZSBpbiBXZWJHUFUpLCB3aGljaCBhZGQgYSBzbWFsbCBvdmVyaGVhZC4gU2VlIHtAbGluayBncHVUaW1lTWlsbGlzZWNvbmRzfS5cbiAgICovXG4gIHB1YmxpYyBnZXQgZ3B1VGltZXJFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fZ3B1VGltZXJFbmFibGVkO1xuICB9XG5cbiAgcHVibGljIHNldCBncHVUaW1lckVuYWJsZWQoZmxhZzogYm9vbGVhbikge1xuICAgIHRoaXMuX19ncHVUaW1lckVuYWJsZWQgPSBmbGFnO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIEdQVSB0aW1lIGNhbiBiZSBtZWFzdXJlZCBpbiB0aGlzIGVudmlyb25tZW50LlxuICAgKiBCcm93c2VycyBtYXkgbm90IGV4cG9zZSBHUFUgdGltZXIgcXVlcmllcyAoZS5nLiBmb3IgcHJpdmFjeSByZWFzb25zIG9yIG9uIHNvbWUgcGxhdGZvcm1zKS5cbiAgICovXG4gIHB1YmxpYyBnZXQgaXNHcHVUaW1lclN1cHBvcnRlZCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX3Byb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgcmV0dXJuIHRoaXMud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Ll9nZXRHcHVUaW1lcigpLmlzU3VwcG9ydGVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2dldFdlYkdMR3B1VGltZXIoKT8uaXNTdXBwb3J0ZWQgPz8gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogVGhlIEdQVSB0aW1lIHNwZW50IG9uIHRoZSBsYXRlc3QgbWVhc3VyZWQgcHJvY2VzcygpIGNhbGwsIGluIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVW5kZWZpbmVkIHVudGlsIGEgcmVzdWx0IGlzIGF2YWlsYWJsZSwgb3Igd2hlbiB7QGxpbmsgZ3B1VGltZXJFbmFibGVkfSBpcyBmYWxzZSBvciB0aGUgZW52aXJvbm1lbnQgZG9lc1xuICAgKiBub3Qgc3VwcG9ydCBHUFUgdGltZXIgcXVlcmllcy4gR1BVIHJlc3VsdHMgYXJyaXZlIGFzeW5jaHJvbm91c2x5LCBzbyB0aGUgdmFsdWUgbGFncyBiZWhpbmQgYnkgYSBmZXdcbiAgICogZnJhbWVzLiBJbiBXZWJHUFUgaXQgaXMgdGhlIHN1bSBvZiB0aGUgZHVyYXRpb25zIG9mIHRoZSByZW5kZXIgcGFzc2VzIGFuZCB0aGUgY29tcHV0ZSBwYXNzZXMgKHN1Y2ggYXNcbiAgICogdGhlIGxpZ2h0IGNsdXN0ZXIgYnVpbGQpOyBpbiBXZWJHTDIgaXQgaXMgdGhlIHRpbWUgdGhlIEdQVSBzcGVudCBvbiBhbGwgdGhlIGNvbW1hbmRzIGlzc3VlZCBkdXJpbmdcbiAgICogcHJvY2VzcygpLlxuICAgKi9cbiAgcHVibGljIGdldCBncHVUaW1lTWlsbGlzZWNvbmRzKCk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9fZ3B1VGltZXJFbmFibGVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX3Byb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgcmV0dXJuIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk/Ll9nZXRHcHVUaW1lcigpLmxhc3RHcHVUaW1lTWlsbGlzZWNvbmRzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3dlYmdsR3B1VGltZXI/Lmxhc3RHcHVUaW1lTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBHUFUgdGltZSBvZiBlYWNoIHBhc3Mgb2YgdGhlIGxhdGVzdCBtZWFzdXJlZCBwcm9jZXNzKCkgY2FsbCwgaW4gbWlsbGlzZWNvbmRzLCBrZXllZCBieSB0aGUgcGFzcyBsYWJlbC5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogV2ViR1BVIG9ubHkuIFVuZGVmaW5lZCB1bnRpbCBhIGNvbXBsZXRlIHJlc3VsdCBpcyBhdmFpbGFibGUsIHdoZW4ge0BsaW5rIGdwdVRpbWVyRW5hYmxlZH0gaXMgZmFsc2UsIG9yXG4gICAqIHdoZW4gdGhlIEdQVSB0aW1lciBpcyBub3Qgc3VwcG9ydGVkLiBUaGUgbGFiZWxzIGFyZSB0aGUgbGFiZWxzIG9mIHRoZSBHUFUgcGFzc2VzOiB0aGUgdW5pcXVlIG5hbWVzIG9mIHRoZVxuICAgKiByZW5kZXIgcGFzc2VzLCBgRGVwdGhQcmVwYXNzYCwgYExpZ2h0Q2x1c3RlckJ1aWxkYCwgYW5kIHNvIG9uLiBQYXNzZXMgd2l0aCB0aGUgc2FtZSBsYWJlbCBhcmUgc3VtbWVkLlxuICAgKiBMaWtlIHtAbGluayBncHVUaW1lTWlsbGlzZWNvbmRzfSwgdGhlIHZhbHVlIGxhZ3MgYmVoaW5kIGJ5IGEgZmV3IGZyYW1lcy5cbiAgICovXG4gIHB1YmxpYyBnZXQgZ3B1UGFzc1RpbWVzTWlsbGlzZWNvbmRzKCk6IFJlYWRvbmx5TWFwPHN0cmluZywgbnVtYmVyPiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLl9fZ3B1VGltZXJFbmFibGVkIHx8IHRoaXMuX19wcm9jZXNzQXBwcm9hY2ggIT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Py5fZ2V0R3B1VGltZXIoKS5sYXN0UGFzc0dwdVRpbWVzTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFdlYkdMR3B1VGltZXIoKTogV2ViR0xHcHVUaW1lciB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuX193ZWJnbEdwdVRpbWVyID09IG51bGwpIHtcbiAgICAgIGNvbnN0IGdsdyA9IHRoaXMuX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeT8uY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgICBpZiAoZ2x3ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX193ZWJnbEdwdVRpbWVyID0gbmV3IFdlYkdMR3B1VGltZXIoZ2x3LmdldFJhd0NvbnRleHRBc1dlYkdMMigpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193ZWJnbEdwdVRpbWVyO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2JlZ2luR3B1VGltZXIoKSB7XG4gICAgaWYgKHRoaXMuX19wcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk/Ll9nZXRHcHVUaW1lcigpLmJlZ2luRnJhbWUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2dldFdlYkdMR3B1VGltZXIoKT8uYmVnaW4oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZW5kR3B1VGltZXIoKSB7XG4gICAgaWYgKHRoaXMuX19wcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk/Ll9nZXRHcHVUaW1lcigpLmVuZEZyYW1lKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX193ZWJnbEdwdVRpbWVyPy5lbmQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fcHJvY2Vzc1JlbmRlclBhc3NXZWJHUFUoe1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICByZW5kZXJQYXNzLFxuICAgIHJlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgcHJpbWl0aXZlVWlkcyxcbiAgICBkaXNwbGF5SWR4LFxuICAgIGhhc0FueUVmZmVrc2VlckNvbXBvbmVudHMsXG4gICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzLFxuICB9OiB7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5OiBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcztcbiAgICByZW5kZXJQYXNzVGlja0NvdW50OiBudW1iZXI7XG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW107XG4gICAgZGlzcGxheUlkeDogbnVtYmVyO1xuICAgIGhhc0FueUVmZmVrc2VlckNvbXBvbmVudHM6IGJvb2xlYW47XG4gICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzPzogRGVmZXJyZWRFZmZla3NlZXJXZWJHUFVSZW5kZXJKb2JbXTtcbiAgfSk6IGJvb2xlYW4ge1xuICAgIC8vIFJ1biBwcmUtcmVuZGVyIGhvb2sgcGVyLWV5ZSAoZW5zdXJlcyBwZXItdmlldyBmcmFtZWJ1ZmZlciBhZGp1c3RtZW50cylcbiAgICByZW5kZXJQYXNzLmRvUHJlUmVuZGVyKCk7XG5cbiAgICAvLyBTY2FubmluZyBldmVyeSBlbnRpdHkgZm9yIGFuIEVmZmVrc2VlckNvbXBvbmVudCBjb3N0cyBhIGNvbXBvbmVudCBsb29rdXBcbiAgICAvLyBwZXIgZW50aXR5IHBsdXMgdHdvIGFycmF5IGFsbG9jYXRpb25zIHBlciByZW5kZXIgcGFzcyAoYW5kIHBlciBleWUpLiBPbmx5XG4gICAgLy8gZG8gaXQgd2hlbiB0aGlzIHBhc3MgYWN0dWFsbHkgcmVuZGVycyBFZmZla3NlZXIgZWZmZWN0cyBhbmQgYXQgbGVhc3Qgb25lXG4gICAgLy8gRWZmZWtzZWVyQ29tcG9uZW50IGV4aXN0cyBpbiB0aGUgZW5naW5lLlxuICAgIGxldCBlZmZla3NlZXJDb21wb25lbnRzOiBFZmZla3NlZXJDb21wb25lbnRbXSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoaGFzQW55RWZmZWtzZWVyQ29tcG9uZW50cyAmJiByZW5kZXJQYXNzLnRvUmVuZGVyRWZmZWtzZWVyRWZmZWN0cykge1xuICAgICAgZWZmZWtzZWVyQ29tcG9uZW50cyA9IFtdO1xuICAgICAgY29uc3QgZW50aXRpZXMgPSByZW5kZXJQYXNzLmVudGl0aWVzO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBlZmZla3NlZXJDb21wb25lbnQgPSBlbnRpdGllc1tpXS50cnlUb0dldEVmZmVrc2VlcigpO1xuICAgICAgICBpZiAoZWZmZWtzZWVyQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgICAgICBlZmZla3NlZXJDb21wb25lbnRzLnB1c2goZWZmZWtzZWVyQ29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGVmZmVrc2VlckNvbXBvbmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGVmZmVrc2VlckNvbXBvbmVudHMgPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhhc0VmZmVrc2VlckVmZmVjdHMgPSBlZmZla3NlZXJDb21wb25lbnRzICE9IG51bGw7XG4gICAgY29uc3QgZWZmZWtzZWVyUmVuZGVyUGFzc09wdGlvbnMgPSBoYXNFZmZla3NlZXJFZmZlY3RzXG4gICAgICA/IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRFZmZla3NlZXJSZW5kZXJQYXNzT3B0aW9ucyh0aGlzLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc2hvdWxkUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyA9IHJlbmRlclBhc3MudG9SZW5kZXJFZmZla3NlZXJFZmZlY3RzICYmIGhhc0VmZmVrc2VlckVmZmVjdHM7XG4gICAgY29uc3Qgc2hvdWxkRGVmZXJFZmZla3NlZXJFZmZlY3RzID1cbiAgICAgIHNob3VsZFJlbmRlckVmZmVrc2VlckVmZmVjdHMgJiYgcmVuZGVyUGFzcy5nZXRSZXNvbHZlRnJhbWVidWZmZXIoKSAhPSBudWxsICYmIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyAhPSBudWxsO1xuICAgIGlmIChzaG91bGRSZW5kZXJFZmZla3NlZXJFZmZlY3RzICYmIGVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgZWZmZWtzZWVyQ29tcG9uZW50IG9mIGVmZmVrc2VlckNvbXBvbmVudHMhKSB7XG4gICAgICAgIGVmZmVrc2VlckNvbXBvbmVudC5wcmVwYXJlV2ViR1BVUmVuZGVyaW5nKGVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNob3VsZERlZmVyRWZmZWtzZWVyRWZmZWN0cykge1xuICAgICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzIS5wdXNoKHtcbiAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgZGlzcGxheUlkeCxcbiAgICAgICAgcmVuZGVyUGFzc09wdGlvbnM6IGVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zLFxuICAgICAgICBlZmZla3NlZXJDb21wb25lbnRzOiBlZmZla3NlZXJDb21wb25lbnRzISxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGNsZWFyIEZyYW1lYnVmZmVyXG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNsZWFyRnJhbWVCdWZmZXIodGhpcywgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG5cbiAgICB0aGlzLl9fcmVuZGVyTWVzaGVzV2ViR1BVKHtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICAgIHJlbmRlclBhc3MsXG4gICAgICByZW5kZXJQYXNzVGlja0NvdW50LFxuICAgICAgcHJpbWl0aXZlVWlkcyxcbiAgICAgIGRpc3BsYXlJZHgsXG4gICAgICBzaG91bGRLZWVwUmVuZGVyUGFzc0ZvckVmZmVrc2Vlcjogc2hvdWxkUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyAmJiAhc2hvdWxkRGVmZXJFZmZla3NlZXJFZmZlY3RzLFxuICAgIH0pO1xuXG4gICAgaWYgKHNob3VsZFJlbmRlckVmZmVrc2VlckVmZmVjdHMgJiYgIXNob3VsZERlZmVyRWZmZWtzZWVyRWZmZWN0cykge1xuICAgICAgY29uc3QgcmVuZGVyUGFzc0VuY29kZXIgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0T3JDcmVhdGVSZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlckV4dGVybmFsUmVuZGVyaW5nKFxuICAgICAgICB0aGlzLFxuICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICBkaXNwbGF5SWR4XG4gICAgICApO1xuXG4gICAgICBpZiAocmVuZGVyUGFzc0VuY29kZXIgIT0gbnVsbCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVmZmVrc2VlckNvbXBvbmVudCBvZiBlZmZla3NlZXJDb21wb25lbnRzISkge1xuICAgICAgICAgIGVmZmVrc2VlckNvbXBvbmVudC4kcmVuZGVyV2ViR1BVKHJlbmRlclBhc3NFbmNvZGVyLCBlZmZla3NlZXJSZW5kZXJQYXNzT3B0aW9ucywgZGlzcGxheUlkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5lbmRSZW5kZXJQYXNzRW5jb2RlckZvckV4dGVybmFsUmVuZGVyaW5nKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyUGFzcy5fY29weVJlc29sdmUxVG9SZXNvbHZlMldlYkdwdSgpO1xuICAgIHJlbmRlclBhc3MuZG9Qb3N0UmVuZGVyKCk7XG5cbiAgICByZXR1cm4gc2hvdWxkUmVuZGVyRWZmZWtzZWVyRWZmZWN0cztcbiAgfVxuXG4gIHByaXZhdGUgX19yZW5kZXJEZWZlcnJlZEVmZmVrc2VlckVmZmVjdHNBZnRlclJlc29sdmVXZWJHUFUoe1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICBjdXJyZW50UmVuZGVyUGFzcyxcbiAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMsXG4gICAgZGlzcGxheUlkeCxcbiAgfToge1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGN1cnJlbnRSZW5kZXJQYXNzOiBSZW5kZXJQYXNzO1xuICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9iczogRGVmZXJyZWRFZmZla3NlZXJXZWJHUFVSZW5kZXJKb2JbXTtcbiAgICBkaXNwbGF5SWR4OiBudW1iZXI7XG4gIH0pIHtcbiAgICBpZiAoZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRSZXNvbHZlRnJhbWVidWZmZXIgPSBjdXJyZW50UmVuZGVyUGFzcy5nZXRSZXNvbHZlRnJhbWVidWZmZXIoKTtcbiAgICBpZiAoY3VycmVudFJlc29sdmVGcmFtZWJ1ZmZlciA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBqb2Igb2YgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzKSB7XG4gICAgICBpZiAoam9iLmRpc3BsYXlJZHggIT09IGRpc3BsYXlJZHggfHwgam9iLnJlbmRlclBhc3MuZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCkgIT09IGN1cnJlbnRSZXNvbHZlRnJhbWVidWZmZXIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlbmRlclBhc3NFbmNvZGVyID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldE9yQ3JlYXRlUmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXJFeHRlcm5hbFJlbmRlcmluZyhcbiAgICAgICAgdGhpcyxcbiAgICAgICAgam9iLnJlbmRlclBhc3MsXG4gICAgICAgIGRpc3BsYXlJZHhcbiAgICAgICk7XG5cbiAgICAgIGlmIChyZW5kZXJQYXNzRW5jb2RlciAhPSBudWxsKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWZmZWtzZWVyQ29tcG9uZW50IG9mIGpvYi5lZmZla3NlZXJDb21wb25lbnRzKSB7XG4gICAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50LiRyZW5kZXJXZWJHUFUocmVuZGVyUGFzc0VuY29kZXIsIGpvYi5yZW5kZXJQYXNzT3B0aW9ucywgZGlzcGxheUlkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5lbmRSZW5kZXJQYXNzRW5jb2RlckZvckV4dGVybmFsUmVuZGVyaW5nKCk7XG4gICAgICBqb2IucmVuZGVyUGFzcy5fY29weVJlc29sdmUxVG9SZXNvbHZlMldlYkdwdSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19yZW5kZXJNZXNoZXNXZWJHUFUoe1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICByZW5kZXJQYXNzLFxuICAgIHJlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgcHJpbWl0aXZlVWlkcyxcbiAgICBkaXNwbGF5SWR4LFxuICAgIHNob3VsZEtlZXBSZW5kZXJQYXNzRm9yRWZmZWtzZWVyLFxuICB9OiB7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5OiBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzcztcbiAgICByZW5kZXJQYXNzVGlja0NvdW50OiBudW1iZXI7XG4gICAgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW107XG4gICAgZGlzcGxheUlkeDogbnVtYmVyO1xuICAgIHNob3VsZEtlZXBSZW5kZXJQYXNzRm9yRWZmZWtzZWVyOiBib29sZWFuO1xuICB9KTogR1BVUmVuZGVyUGFzc0VuY29kZXIgfCB1bmRlZmluZWQge1xuICAgIGxldCByZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlcjogR1BVUmVuZGVyUGFzc0VuY29kZXIgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGRvUmVuZGVyID0gcmVuZGVyUGFzcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmU7XG4gICAgaWYgKGRvUmVuZGVyKSB7XG4gICAgICBpZiAoc2hvdWxkS2VlcFJlbmRlclBhc3NGb3JFZmZla3NlZXIpIHtcbiAgICAgICAgcmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXIgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkucmVuZGVyV2l0aFJlbmRlckJ1bmRsZUFuZEtlZXBSZW5kZXJQYXNzKFxuICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICBkaXNwbGF5SWR4XG4gICAgICAgICk7XG4gICAgICAgIGRvUmVuZGVyID0gcmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXIgPT0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvUmVuZGVyID0gIXdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5yZW5kZXJXaXRoUmVuZGVyQnVuZGxlKHRoaXMsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2VuZ2luZVN0YXRlLndlYmdwdVJlbmRlckJ1bmRsZU1vZGUgfHw9IGRvUmVuZGVyO1xuICAgIH1cblxuICAgIGlmICghZG9SZW5kZXIpIHtcbiAgICAgIHJldHVybiByZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlcjtcbiAgICB9XG5cbiAgICAvLyBUaGUgcmVuZGVyIGJ1bmRsZSBjb3VsZCBub3QgYmUgcmV1c2VkIChmaXJzdCBmcmFtZSwgY2FjaGUgaW52YWxpZGF0aW9uLFxuICAgIC8vIG9yIGNoYW5nZWQgc29ydCBvcmRlciksIHNvIHJlY29yZCBmcmVzaCBjb21tYW5kcy4gQ3JlYXRpbmcgdGhlIGJ1bmRsZVxuICAgIC8vIGVuY29kZXIgb25seSBoZXJlIGF2b2lkcyBkZXNjcmlwdG9yIGNvbXB1dGF0aW9uIGFuZCBHUFUgZW5jb2RlclxuICAgIC8vIGFsbG9jYXRpb24gb24gZXZlcnkgZnJhbWUgd2hlcmUgYSBjYWNoZWQgYnVuZGxlIGlzIGV4ZWN1dGVkLlxuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVSZW5kZXJCdW5kbGVFbmNvZGVyKHRoaXMsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuXG4gICAgY29uc3QgcmVuZGVyZWRTb21ldGhpbmcgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuY29tbW9uXyRyZW5kZXIoe1xuICAgICAgcmVuZGVyUGFzczogcmVuZGVyUGFzcyxcbiAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgZGlzcGxheUlkeCxcbiAgICAgIGVuZ2luZTogdGhpcyxcbiAgICB9KTtcbiAgICByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgIGlmICghcmVuZGVyZWRTb21ldGhpbmcpIHtcbiAgICAgIHJldHVybiByZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlcjtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkS2VlcFJlbmRlclBhc3NGb3JFZmZla3NlZXIpIHtcbiAgICAgIHJldHVybiB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZmluaXNoUmVuZGVyQnVuZGxlRW5jb2RlckFuZEtlZXBSZW5kZXJQYXNzKHRoaXMsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuICAgIH1cblxuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5maW5pc2hSZW5kZXJCdW5kbGVFbmNvZGVyKHRoaXMsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIF9wcm9jZXNzV2ViR1BVKGV4cHJlc3Npb25zOiBFeHByZXNzaW9uW10pIHtcbiAgICBjb25zdCBjb21wb25lbnRUaWRzID0gdGhpcy5fX2NvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50VElEcygpO1xuICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IHdlYnhyU3lzdGVtID0gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICAgIGZvciAoY29uc3Qgc3RhZ2Ugb2YgQ29tcG9uZW50Ll9wcm9jZXNzU3RhZ2VzKSB7XG4gICAgICBpZiAoc3RhZ2UgPT09IFByb2Nlc3NTdGFnZS5SZW5kZXIpIHtcbiAgICAgICAgLy8gVGhlIGxpZ2h0IGxpc3RzIG11c3QgYmUgd3JpdHRlbiBiZWZvcmUgdGhlIHN0cmF0ZWd5IHVwbG9hZHMgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIGluIHByZXJlbmRlci5cbiAgICAgICAgdGhpcy5fX2xpZ2h0Q2x1c3RlclN5c3RlbS51cGRhdGUoZXhwcmVzc2lvbnMpO1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuY29tbW9uXyRwcmVyZW5kZXIodGhpcyk7XG4gICAgICAgIGNvbnN0IGlzV2ViWFJNb2RlID0gd2VieHJTeXN0ZW0/LmlzV2ViWFJNb2RlID8/IGZhbHNlO1xuICAgICAgICBjb25zdCBpc011bHRpVmlldyA9IHdlYnhyU3lzdGVtPy5pc011bHRpVmlldygpID8/IGZhbHNlO1xuICAgICAgICBjb25zdCB4clBvc2UgPSB0aGlzLl9fZW5naW5lU3RhdGUueHJQb3NlV2ViR1BVO1xuICAgICAgICBjb25zdCBkaXNwbGF5Q291bnQgPSBpc1dlYlhSTW9kZSAmJiAhaXNNdWx0aVZpZXcgJiYgeHJQb3NlICE9IG51bGwgPyB4clBvc2Uudmlld3MubGVuZ3RoIDogMTtcbiAgICAgICAgLy8gRWZmZWtzZWVyIGlzIHJhcmVseSB1c2VkLiBEZXRlY3QgaXQgb25jZSBwZXIgZnJhbWUgc28gdGhlIHBlci1wYXNzXG4gICAgICAgIC8vIGNvZGUgY2FuIHNraXAgZW50aXR5IHNjYW5zLCBqb2IgYXJyYXlzIGFuZCB0aGUgZGVmZXJyZWQtcmVuZGVyIGNhbGwuXG4gICAgICAgIGNvbnN0IGhhc0FueUVmZmVrc2VlckNvbXBvbmVudHMgPSB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeS5oYXNBbnlDb21wb25lbnQoXG4gICAgICAgICAgV2VsbEtub3duQ29tcG9uZW50VElEcy5FZmZla3NlZXJDb21wb25lbnRUSURcbiAgICAgICAgKTtcbiAgICAgICAgLy8gVGhlIG1hcHMgb25seSBleGlzdCB0byBzaGFyZSBzb3J0aW5nIHdvcmsgYmV0d2VlbiB0aGUgZXllcyBpbiBzdGVyZW9cbiAgICAgICAgLy8gcmVuZGVyaW5nLiBBbGxvY2F0aW5nIHRoZW0gZm9yIHRoZSBjb21tb24gc2luZ2xlLWRpc3BsYXkgY2FzZSBjb3N0c1xuICAgICAgICAvLyB0d28gTWFwIGFsbG9jYXRpb25zIG9uIGV2ZXJ5IGZyYW1lLlxuICAgICAgICBjb25zdCBpc011bHRpRGlzcGxheSA9IGRpc3BsYXlDb3VudCA+IDE7XG4gICAgICAgIGNvbnN0IHJlbmRlclBhc3NUaWNrQ291bnRNYXAgPSBpc011bHRpRGlzcGxheSA/IG5ldyBNYXA8bnVtYmVyLCBudW1iZXI+KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZHNNYXAgPSBpc011bHRpRGlzcGxheSA/IG5ldyBNYXA8bnVtYmVyLCBQcmltaXRpdmVVSURbXT4oKSA6IHVuZGVmaW5lZDtcblxuICAgICAgICBmb3IgKGxldCBkaXNwbGF5SWR4ID0gMDsgZGlzcGxheUlkeCA8IGRpc3BsYXlDb3VudDsgZGlzcGxheUlkeCsrKSB7XG4gICAgICAgICAgY29uc3QgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzOiBEZWZlcnJlZEVmZmVrc2VlcldlYkdQVVJlbmRlckpvYltdIHwgdW5kZWZpbmVkID0gaGFzQW55RWZmZWtzZWVyQ29tcG9uZW50c1xuICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgbGV0IHJlbmRlcmVkRWZmZWtzZWVyRWZmZWN0c0luRGlzcGxheSA9IGZhbHNlO1xuICAgICAgICAgIGZvciAoY29uc3QgZXhwIG9mIGV4cHJlc3Npb25zKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJlbmRlclBhc3Mgb2YgZXhwLnJlbmRlclBhc3Nlcykge1xuICAgICAgICAgICAgICBjb25zdCByZW5kZXJQYXNzVWlkID0gcmVuZGVyUGFzcy5yZW5kZXJQYXNzVUlEO1xuICAgICAgICAgICAgICBsZXQgcmVuZGVyUGFzc1RpY2tDb3VudCA9IHJlbmRlclBhc3NUaWNrQ291bnRNYXA/LmdldChyZW5kZXJQYXNzVWlkKTtcbiAgICAgICAgICAgICAgbGV0IHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdO1xuICAgICAgICAgICAgICBpZiAocmVuZGVyUGFzc1RpY2tDb3VudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudCA9IHRoaXMuX19yZW5kZXJQYXNzVGlja0NvdW50O1xuICAgICAgICAgICAgICAgIHJlbmRlclBhc3MuX2lzQ2hhbmdlZFNvcnRSZW5kZXJSZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50LnNvcnRfJHJlbmRlcih0aGlzLCByZW5kZXJQYXNzKTtcbiAgICAgICAgICAgICAgICBpZiAocmVuZGVyUGFzc1RpY2tDb3VudE1hcCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50TWFwLnNldChyZW5kZXJQYXNzVWlkLCByZW5kZXJQYXNzVGlja0NvdW50KTtcbiAgICAgICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHNNYXAhLnNldChyZW5kZXJQYXNzVWlkLCBwcmltaXRpdmVVaWRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJpbWl0aXZlVWlkcyA9IHByaW1pdGl2ZVVpZHNNYXAhLmdldChyZW5kZXJQYXNzVWlkKSE7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCByZW5kZXJlZEVmZmVrc2VlckVmZmVjdHMgPSB0aGlzLl9fcHJvY2Vzc1JlbmRlclBhc3NXZWJHUFUoe1xuICAgICAgICAgICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgICAgICAgICAgICAgcHJpbWl0aXZlVWlkcyxcbiAgICAgICAgICAgICAgICBkaXNwbGF5SWR4LFxuICAgICAgICAgICAgICAgIGhhc0FueUVmZmVrc2VlckNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVuZGVyZWRFZmZla3NlZXJFZmZlY3RzSW5EaXNwbGF5IHx8PSByZW5kZXJlZEVmZmVrc2VlckVmZmVjdHM7XG4gICAgICAgICAgICAgIGlmIChkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMgIT0gbnVsbCAmJiBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX19yZW5kZXJEZWZlcnJlZEVmZmVrc2VlckVmZmVjdHNBZnRlclJlc29sdmVXZWJHUFUoe1xuICAgICAgICAgICAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgICAgICAgICAgICAgICAgY3VycmVudFJlbmRlclBhc3M6IHJlbmRlclBhc3MsXG4gICAgICAgICAgICAgICAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMsXG4gICAgICAgICAgICAgICAgICBkaXNwbGF5SWR4LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gYWR2YW5jZSB0aWNrIGNvdW50IG9ubHkgYWZ0ZXIgdGhlIGZpbmFsIGRpc3BsYXkgaGFzIGJlZW4gcHJvY2Vzc2VkXG4gICAgICAgICAgICAgIGlmIChkaXNwbGF5SWR4ID09PSBkaXNwbGF5Q291bnQgLSAxKSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudE1hcD8uZGVsZXRlKHJlbmRlclBhc3NVaWQpO1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHNNYXA/LmRlbGV0ZShyZW5kZXJQYXNzVWlkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChkaXNwbGF5SWR4IDwgZGlzcGxheUNvdW50IC0gMSAmJiByZW5kZXJlZEVmZmVrc2VlckVmZmVjdHNJbkRpc3BsYXkpIHtcbiAgICAgICAgICAgIC8vIEVmZmVrc2VlciBXZWJHUFUgdXBkYXRlcyBjYW1lcmEgbWF0cmljZXMgaW4gYmFja2VuZCBHUFUgc3RhdGUgd2hpbGUgUmhvZG9uaXRlIGlzIHN0aWxsIHJlY29yZGluZyBjb21tYW5kcy5cbiAgICAgICAgICAgIC8vIFN1Ym1pdHRpbmcgcGVyIGV5ZSBwcmV2ZW50cyB0aGUgcmlnaHQtZXllIHVwZGF0ZSBmcm9tIGJlaW5nIG9ic2VydmVkIGJ5IGxlZnQtZXllIGRyYXcgY29tbWFuZHMuXG4gICAgICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZmx1c2goKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmZsdXNoKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgIXRoaXMuX19lbmdpbmVTdGF0ZS53ZWJncHVSZW5kZXJCdW5kbGVNb2RlIHx8XG4gICAgICAgICAgdGhpcy5fX2lzQ29tcG9uZW50UnVudGltZUhvb2tEaXJ0eSgpIHx8XG4gICAgICAgICAgVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50Q2FtZXJhVXBkYXRlQ291bnQodGhpcykgIT09IHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICAgICAgUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50KCkgIT09IHRoaXMuX19sYXN0UHJpbWl0aXZlQ291bnQgfHxcbiAgICAgICAgICBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudFxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBCdWlsdCBvbmx5IHdoZW4gdGhlIHN0YWdlIGFjdHVhbGx5IHJ1bnM6IGEgc3RhdGljIHNjZW5lIHNraXBzIGl0IG9uIGV2ZXJ5IGZyYW1lLlxuICAgICAgICAgIGNvbnN0IGNvbW1vbk1ldGhvZE5hbWUgPSBgY29tbW9uXyR7c3RhZ2UubWV0aG9kTmFtZX1gO1xuICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50VGlkIG9mIGNvbXBvbmVudFRpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50ID0gQ29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRDbGFzcyhjb21wb25lbnRUaWQpITtcblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kID0gKGNvbXBvbmVudENsYXNzIGFzIGFueSlbY29tbW9uTWV0aG9kTmFtZV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kKSB7XG4gICAgICAgICAgICAgIGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCh7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0FwcHJvYWNoOiB0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhc3M6IHZvaWQgMCxcbiAgICAgICAgICAgICAgICBwcm9jZXNzU3RhZ2U6IHN0YWdlLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IHRoaXMuX19yZW5kZXJQYXNzVGlja0NvdW50LFxuICAgICAgICAgICAgICAgIGRpc3BsYXlJZHg6IDAsXG4gICAgICAgICAgICAgICAgZW5naW5lOiB0aGlzLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29tcG9uZW50Q2xhc3MucHJvY2Vzcyh0aGlzLCBjb21wb25lbnRDbGFzcywgc3RhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHN0YWdlID09PSBQcm9jZXNzU3RhZ2UuTG9naWMpIHtcbiAgICAgICAgLy8gVGhlIHRyYW5zZm9ybSBnaXptb3Mga2VlcCBhIGNvbnN0YW50IG9uLXNjcmVlbiBzaXplLCBzbyB0aGV5IGhhdmUgdG8gYmUgcmVzY2FsZWRcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIENhbWVyYUNvbXBvbmVudCAoVElEIDkpIGhhcyB1cGRhdGVkIGl0cyBtYXRyaWNlcy4gVGhpcyBydW5zIG91dHNpZGUgdGhlXG4gICAgICAgIC8vIGNoYW5nZSBnYXRlIGFib3ZlIHNvIHRoYXQgYSBmcmFtZSB3aGljaCBza2lwcyB0aGUgTG9naWMgc3RhZ2Ugc3RpbGwgY29ycmVjdHMgdGhlbS5cbiAgICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fdXBkYXRlVHJhbnNmb3JtR2l6bW9zQnlDYW1lcmFDaGFuZ2UodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzKTtcbiAgICB0aGlzLl9fcHJvY2Vzc0NvbXBvbmVudFJ1bnRpbWVIb29rc01hcmtVcGRhdGVkKCk7XG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcyk7XG4gICAgdGhpcy5fX2xhc3RQcmltaXRpdmVDb3VudCA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudCgpO1xuICAgIHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKTtcbiAgfVxuXG4gIHByaXZhdGUgX19wcm9jZXNzQ29tcG9uZW50UnVudGltZUhvb2tzQmVnaW5GcmFtZSgpIHtcbiAgICBmb3IgKGNvbnN0IGhvb2tzIG9mIF9nZXRDb21wb25lbnRSdW50aW1lSG9va3MoKSkge1xuICAgICAgaG9va3MuYmVnaW5GcmFtZT8uKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19pc0NvbXBvbmVudFJ1bnRpbWVIb29rRGlydHkoKTogYm9vbGVhbiB7XG4gICAgZm9yIChjb25zdCBob29rcyBvZiBfZ2V0Q29tcG9uZW50UnVudGltZUhvb2tzKCkpIHtcbiAgICAgIGlmIChob29rcy5pc0RpcnR5Py4odGhpcykgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgX19wcm9jZXNzQ29tcG9uZW50UnVudGltZUhvb2tzTWFya1VwZGF0ZWQoKSB7XG4gICAgZm9yIChjb25zdCBob29rcyBvZiBfZ2V0Q29tcG9uZW50UnVudGltZUhvb2tzKCkpIHtcbiAgICAgIGhvb2tzLm1hcmtVcGRhdGVkPy4odGhpcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2NsZWFudXBDb21wb25lbnRSdW50aW1lSG9va3MoKSB7XG4gICAgZm9yIChjb25zdCBob29rcyBvZiBfZ2V0Q29tcG9uZW50UnVudGltZUhvb2tzKCkpIHtcbiAgICAgIGhvb2tzLmNsZWFudXA/Lih0aGlzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9wcm9jZXNzV2ViR0woZXhwcmVzc2lvbnM6IEV4cHJlc3Npb25bXSkge1xuICAgIC8vIFdlYkdMXG4gICAgY29uc3QgcmVwbyA9IHRoaXMud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG5cbiAgICBjb25zdCBjb21wb25lbnRUaWRzID0gdGhpcy5fX2NvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50VElEcygpO1xuICAgIGNvbnN0IHJlbmRlcmluZ0NvbXBvbmVudFRpZHMgPSB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeS5nZXRSZW5kZXJpbmdDb21wb25lbnRUSURzKCk7XG4gICAgZm9yIChjb25zdCBzdGFnZSBvZiBDb21wb25lbnQuX3Byb2Nlc3NTdGFnZXMpIHtcbiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBzdGFnZS5tZXRob2ROYW1lO1xuICAgICAgY29uc3QgY29tbW9uTWV0aG9kTmFtZSA9IGBjb21tb25fJHttZXRob2ROYW1lfWA7XG4gICAgICBpZiAoc3RhZ2UgPT09IFByb2Nlc3NTdGFnZS5SZW5kZXIpIHtcbiAgICAgICAgLy8gQ29hbGVzY2UgdGhlIEdQVSBzZXR1cCBvZiBtZXNoZXMgYWRkZWQgd2hpbGUgbG9hZGluZyBpbnRvIG9uZSBtdWx0aS1kcmF3IHJlYnVpbGQuXG4gICAgICAgIHJlcG8uZ2V0TXVsdGlEcmF3UmVwb3NpdG9yeSh0aGlzKS5yZWJ1aWxkRGlydHlHcm91cHMoKTtcbiAgICAgICAgLy8gVGhlIGxpZ2h0IGxpc3RzIG11c3QgYmUgd3JpdHRlbiBiZWZvcmUgdGhlIHN0cmF0ZWd5IHVwbG9hZHMgdGhlIEdQVSBpbnN0YW5jZSBkYXRhIGluIHByZXJlbmRlci5cbiAgICAgICAgdGhpcy5fX2xpZ2h0Q2x1c3RlclN5c3RlbS51cGRhdGUoZXhwcmVzc2lvbnMpO1xuICAgICAgICBNZXNoUmVuZGVyZXJDb21wb25lbnQuY29tbW9uXyRwcmVyZW5kZXIodGhpcyk7XG4gICAgICAgIGZvciAoY29uc3QgZXhwIG9mIGV4cHJlc3Npb25zKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRUaWQgb2YgcmVuZGVyaW5nQ29tcG9uZW50VGlkcykge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQgPSBDb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudENsYXNzKGNvbXBvbmVudFRpZCkhO1xuICAgICAgICAgICAgZm9yIChjb25zdCByZW5kZXJQYXNzIG9mIGV4cC5yZW5kZXJQYXNzZXMpIHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzcGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHNwZWN0b3Iuc2V0TWFya2VyKGB8ICR7ZXhwLnVuaXF1ZU5hbWV9OiAke3JlbmRlclBhc3MudW5pcXVlTmFtZX0jYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVuZGVyUGFzcy5kb1ByZVJlbmRlcigpO1xuXG4gICAgICAgICAgICAgIHJlcG8uc3dpdGNoRGVwdGhUZXN0KHJlbmRlclBhc3MuaXNEZXB0aFRlc3QpO1xuXG4gICAgICAgICAgICAgIC8vIGJpbmQgRnJhbWVidWZmZXJcbiAgICAgICAgICAgICAgdGhpcy5iaW5kRnJhbWVidWZmZXJXZWJHTChyZW5kZXJQYXNzKTtcblxuICAgICAgICAgICAgICAvLyBzZXQgVmlld3BvcnQgZm9yIE5vcm1hbCAoTm90IFdlYlhSKVxuICAgICAgICAgICAgICB0aGlzLnNldFZpZXdwb3J0Rm9yTm9ybWFsUmVuZGVyaW5nKHJlbmRlclBhc3MpO1xuICAgICAgICAgICAgICAvLyBzY2lzc29yIGhpbnRzIChlLmcuIHRoZSBzY3JlZW4gYm91bmRzIG9mIGFuIFNERiBwYXNzKSBmb3Igbm9ybWFsIHJlbmRlcmluZ1xuICAgICAgICAgICAgICB0aGlzLnNldFNjaXNzb3JGb3JOb3JtYWxSZW5kZXJpbmcocmVuZGVyUGFzcyk7XG5cbiAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudFRpZCA9PT0gV2VsbEtub3duQ29tcG9uZW50VElEcy5NZXNoUmVuZGVyZXJDb21wb25lbnRUSUQpIHtcbiAgICAgICAgICAgICAgICAvLyBjbGVhciBGcmFtZWJ1ZmZlclxuICAgICAgICAgICAgICAgIHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeS5jbGVhckZyYW1lQnVmZmVyKHRoaXMsIHJlbmRlclBhc3MpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmVuZGVyUGFzcy5faXNDaGFuZ2VkU29ydFJlbmRlclJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICBjb25zdCBwcmltaXRpdmVVaWRzID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50LnNvcnRfJHJlbmRlcih0aGlzLCByZW5kZXJQYXNzKTtcbiAgICAgICAgICAgICAgbGV0IGRvUmVuZGVyID0gcmVuZGVyUGFzcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmU7XG4gICAgICAgICAgICAgIGlmIChkb1JlbmRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCA9IChjb21wb25lbnRDbGFzcyBhcyBhbnkpW2NvbW1vbk1ldGhvZE5hbWVdO1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRDbGFzc19jb21tb25NZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVkU29tZXRoaW5nID0gY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kKHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc0FwcHJvYWNoOiB0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXNzOiByZW5kZXJQYXNzLFxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzU3RhZ2U6IHN0YWdlLFxuICAgICAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50OiB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICAgICAgICAgICAgICAgICAgcHJpbWl0aXZlVWlkcyxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheUlkeDogMCxcbiAgICAgICAgICAgICAgICAgICAgZW5naW5lOiB0aGlzLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZSA9IHJlbmRlcmVkU29tZXRoaW5nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoY29tcG9uZW50VGlkID09PSBXZWxsS25vd25Db21wb25lbnRUSURzLkVmZmVrc2VlckNvbXBvbmVudFRJRCAmJiByZW5kZXJQYXNzLmVudGl0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMud2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFRleHR1cmUyREJpbmRpbmdzID0gd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0Q3VycmVudFRleHR1cmUyREJpbmRpbmdzRm9yRWZmZWtzZWVyKCk7XG4gICAgICAgICAgICAgICAgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuc2V0V2ViR0xTdGF0ZVRvRGVmYXVsdEZvckVmZmVrc2VlcigpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZW50aXR5IG9mIHJlbmRlclBhc3MuZW50aXRpZXMpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGVmZmVrc2VlckNvbXBvbmVudCA9IGVudGl0eS50cnlUb0dldEVmZmVrc2VlcigpO1xuICAgICAgICAgICAgICAgICAgaWYgKGVmZmVrc2VlckNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGVmZmVrc2VlckNvbXBvbmVudC4kcmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LnJlc3RvcmVUZXh0dXJlMkRCaW5kaW5nc0ZvckVmZmVrc2VlcihjdXJyZW50VGV4dHVyZTJEQmluZGluZ3MpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuX19yZW5kZXJQYXNzVGlja0NvdW50Kys7XG5cbiAgICAgICAgICAgICAgcmVuZGVyUGFzcy5fY29weUZyYW1lYnVmZmVyVG9SZXNvbHZlRnJhbWVidWZmZXJzV2ViR0woKTtcblxuICAgICAgICAgICAgICByZW5kZXJQYXNzLmRvUG9zdFJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuX19pc0NvbXBvbmVudFJ1bnRpbWVIb29rRGlydHkoKSB8fFxuICAgICAgICAgIFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgICAgIFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudCgpICE9PSB0aGlzLl9fbGFzdFByaW1pdGl2ZUNvdW50IHx8XG4gICAgICAgICAgTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcykgIT09IHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnRcbiAgICAgICAgKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRUaWQgb2YgY29tcG9uZW50VGlkcykge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQgPSBDb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudENsYXNzKGNvbXBvbmVudFRpZCkhO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDbGFzc19jb21tb25NZXRob2QgPSAoY29tcG9uZW50Q2xhc3MgYXMgYW55KVtjb21tb25NZXRob2ROYW1lXTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRDbGFzc19jb21tb25NZXRob2QpIHtcbiAgICAgICAgICAgICAgY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kKHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzQXBwcm9hY2g6IHRoaXMuX19wcm9jZXNzQXBwcm9hY2gsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzczogdm9pZCAwLFxuICAgICAgICAgICAgICAgIHByb2Nlc3NTdGFnZTogc3RhZ2UsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudDogdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgICAgICAgICAgICAgZGlzcGxheUlkeDogMCxcbiAgICAgICAgICAgICAgICBlbmdpbmU6IHRoaXMsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb21wb25lbnRDbGFzcy5wcm9jZXNzKHRoaXMsIGNvbXBvbmVudENsYXNzLCBzdGFnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhZ2UgPT09IFByb2Nlc3NTdGFnZS5Mb2dpYykge1xuICAgICAgICAvLyBUaGUgdHJhbnNmb3JtIGdpem1vcyBrZWVwIGEgY29uc3RhbnQgb24tc2NyZWVuIHNpemUsIHNvIHRoZXkgaGF2ZSB0byBiZSByZXNjYWxlZFxuICAgICAgICAvLyBhZnRlciB0aGUgQ2FtZXJhQ29tcG9uZW50IChUSUQgOSkgaGFzIHVwZGF0ZWQgaXRzIG1hdHJpY2VzLiBUaGlzIHJ1bnMgb3V0c2lkZSB0aGVcbiAgICAgICAgLy8gY2hhbmdlIGdhdGUgYWJvdmUgc28gdGhhdCBhIGZyYW1lIHdoaWNoIHNraXBzIHRoZSBMb2dpYyBzdGFnZSBzdGlsbCBjb3JyZWN0cyB0aGVtLlxuICAgICAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll91cGRhdGVUcmFuc2Zvcm1HaXptb3NCeUNhbWVyYUNoYW5nZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMpO1xuICAgIHRoaXMuX19wcm9jZXNzQ29tcG9uZW50UnVudGltZUhvb2tzTWFya1VwZGF0ZWQoKTtcbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKTtcbiAgICB0aGlzLl9fbGFzdFByaW1pdGl2ZUNvdW50ID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50KCk7XG4gICAgdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpO1xuICB9XG5cbiAgc3RhdGljIGdldCBwcm9jZXNzVGltZSgpIHtcbiAgICByZXR1cm4gVGltZS5sYXN0VGltZVRpbWVJbnRlcnZhbEluTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgc3RhdGljIGdldCB0aW1lQXRQcm9jZXNzQmVnaW4oKSB7XG4gICAgcmV0dXJuIFRpbWUudGltZUF0UHJvY2Vzc0JlZ2luTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgc3RhdGljIGdldCB0aW1lQXRQcm9jZXNzRW5kKCkge1xuICAgIHJldHVybiBUaW1lLnRpbWVBdFByb2Nlc3NFbmRNaWxsaXNlY29uZHM7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUNhbWVyYShlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGNhbWVyYUVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIHRydWUpO1xuICAgIGNhbWVyYUVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgMV0pO1xuICAgIGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS50eXBlID0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWM7XG4gICAgY2FtZXJhRW50aXR5LmdldENhbWVyYSgpLnpOZWFyID0gMC4xO1xuICAgIGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS56RmFyID0gMTAwMDA7XG4gICAgY29uc3Qgd2ViQ0dBcGlSZXBvc2l0b3J5ID0gZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IFt3aWR0aCwgaGVpZ2h0XSA9IHdlYkNHQXBpUmVwb3NpdG9yeS5nZXRDYW52YXNTaXplKCk7XG4gICAgY2FtZXJhRW50aXR5LmdldENhbWVyYSgpLnhNYWcgPSB3aWR0aCAvIGhlaWdodDtcbiAgICBjYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkueU1hZyA9IDE7XG4gIH1cblxuICBwcml2YXRlIHNldFZpZXdwb3J0Rm9yTm9ybWFsUmVuZGVyaW5nKHJlbmRlclBhc3M6IFJlbmRlclBhc3MpIHtcbiAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBjb25zdCB3ZWJBUlN5c3RlbSA9IHRoaXMuX193ZWJBUlN5c3RlbTtcbiAgICBpZiAoKCF3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgfHwgIXJlbmRlclBhc3MuaXNWclJlbmRlcmluZykgJiYgIXdlYkFSU3lzdGVtPy5pc1dlYkFSTW9kZSkge1xuICAgICAgKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuc2V0Vmlld3BvcnQodGhpcywgcmVuZGVyUGFzcy5nZXRWaWV3cG9ydCgpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyB0aGUgcGFzcydzIHNjaXNzb3IgcmVjdGFuZ2xlIGZvciBub3JtYWwgKG5vbi1YUikgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBUaGUgc2Npc3NvciBpcyBhIGN1bGxpbmcgaGludDsgWFIvQVIgcGFzc2VzIHVzZSB0aGVpciBvd24gdmlld3BvcnRzLCBzbyB0aGV5XG4gICAqIHJ1biB3aXRob3V0IG9uZS5cbiAgICovXG4gIHByaXZhdGUgc2V0U2Npc3NvckZvck5vcm1hbFJlbmRlcmluZyhyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gICAgY29uc3Qgd2ViQVJTeXN0ZW0gPSB0aGlzLl9fd2ViQVJTeXN0ZW07XG4gICAgY29uc3QgcmVwb3NpdG9yeSA9IHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBpZiAoKCF3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgfHwgIXJlbmRlclBhc3MuaXNWclJlbmRlcmluZykgJiYgIXdlYkFSU3lzdGVtPy5pc1dlYkFSTW9kZSkge1xuICAgICAgcmVwb3NpdG9yeS5zZXRTY2lzc29yUmVjdChyZW5kZXJQYXNzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVwb3NpdG9yeS5zZXRTY2lzc29yUmVjdCh1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYmluZEZyYW1lYnVmZmVyV2ViR0wocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICAgIGNvbnN0IHdlYkFSU3lzdGVtID0gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICAgIGlmICh3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgJiYgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyKSB7XG4gICAgICBjb25zdCBnbHcgPSAodGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciE7XG4gICAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHdlYlhSU3lzdGVtLmZyYW1lYnVmZmVyISk7XG4gICAgfSBlbHNlIGlmICh3ZWJBUlN5c3RlbT8uaXNXZWJBUk1vZGUpIHtcbiAgICAgIGNvbnN0IGdsdyA9ICh0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyITtcbiAgICAgIGNvbnN0IGdsID0gZ2x3LmdldFJhd0NvbnRleHQoKTtcbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgd2ViQVJTeXN0ZW0uZnJhbWVidWZmZXIhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuYmluZEZyYW1lYnVmZmVyKHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKSk7XG4gICAgICAodGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5zZXREcmF3VGFyZ2V0cyhyZW5kZXJQYXNzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZGlzcGxheVJuSW5mbygpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGAlY1Job2Rvbml0ZSVjV2ViM0QgTGlicmFyeSVjICVjdmVyc2lvbiVjJHtWRVJTSU9OLnZlcnNpb259JWMgJWNicmFuY2glYyR7VkVSU0lPTi5icmFuY2h9JWMgJWNtb2RlJWMke3RoaXMuX19wcm9jZXNzQXBwcm9hY2guc3RyfWAsXG4gICAgICAnZm9udC13ZWlnaHQ6IGJvbGQ7IHBhZGRpbmc6IDRweCA4cHg7IGJvcmRlci1yYWRpdXM6IDZweCAwcHggMHB4IDZweDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCAjZmYwMDg0IDAlLCNmZjAwMjIgMTAwJSk7JyxcbiAgICAgICdwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDBweCA2cHggNnB4IDBweDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCAjODQwMGZmIDAlLCM0NDAwZmYgMTAwJSk7JyxcbiAgICAgICcnLFxuICAgICAgJ2JhY2tncm91bmQ6ICM2NjY7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogNnB4IDBweCAwcHggNnB4JyxcbiAgICAgICdiYWNrZ3JvdW5kOiBmaXJlYnJpY2s7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogMHB4IDZweCA2cHggMHB4JyxcbiAgICAgICcnLFxuICAgICAgJ2JhY2tncm91bmQ6ICM2NjY7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogNnB4IDBweCAwcHggNnB4JyxcbiAgICAgICdiYWNrZ3JvdW5kOiBncmVlbjsgcGFkZGluZzogNHB4OyBib3JkZXItcmFkaXVzOiAwcHggNnB4IDZweCAwcHgnLFxuICAgICAgJycsXG4gICAgICAnYmFja2dyb3VuZDogIzY2NjsgcGFkZGluZzogNHB4OyBib3JkZXItcmFkaXVzOiA2cHggMHB4IDBweCA2cHgnLFxuICAgICAgJ2JhY2tncm91bmQ6IGJsdWU7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogMHB4IDZweCA2cHggMHB4J1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgUmhvZG9uaXRlIHN5c3RlbS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogRG9uJ3QgZm9yZ2V0IGBhd2FpdGAgdG8gdXNlIHRoaXMgbWV0aG9kLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGBcbiAgICogY29uc3QgZW5naW5lID0gYXdhaXQgUm4uRW5naW5lLmluaXQoe1xuICAgKiAgIGFwcHJvYWNoOiBSbi5Qcm9jZXNzQXBwcm9hY2guV2ViR0wyLFxuICAgKiAgIGNhbnZhczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmxkJykgYXMgSFRNTENhbnZhc0VsZW1lbnQsXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGRlc2NcbiAgICogQHJldHVybnNcbiAgICovXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIGNvbXBvbmVudCBjbGFzc2VzIHRoZSBlbmdpbmUgaXRzZWxmIHByb2Nlc3NlcyBldmVyeSBmcmFtZS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogT3RoZXIgY29tcG9uZW50IGNsYXNzZXMgYXJlIHJlZ2lzdGVyZWQgb24gZmlyc3QgdXNlIGJ5IGBFbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5YC5cbiAgICogVGhlIGNvcmUgY2xhc3NlcyBhcmUgcmVnaXN0ZXJlZCBoZXJlIGJlY2F1c2UgdGhlIHJlbmRlciBsb29wIGxvb2tzIHVwIHRoZSBNZXNoUmVuZGVyZXJDb21wb25lbnQgY2xhc3NcbiAgICogYnkgaXRzIENvbXBvbmVudFRJRCwgYmVjYXVzZSBTa2VsZXRhbENvbXBvbmVudCdzIGJvbmUgZGF0YSBtZW1iZXJzIG11c3QgYmUgcmVnaXN0ZXJlZCBiZWZvcmUgYW55IHNoYWRlciBpc1xuICAgKiBnZW5lcmF0ZWQsIGFuZCBiZWNhdXNlIGVudGl0eSBoZWxwZXJzIHN1Y2ggYXMgYGNyZWF0ZUdyb3VwRW50aXR5YCBhbmQgYGNyZWF0ZU1lc2hFbnRpdHlgIGFkZFxuICAgKiB0aGVtIGJ5IENvbXBvbmVudFRJRDogaW1wb3J0aW5nIHRoZSBjbGFzc2VzIHRoZXJlIHdvdWxkIGNyZWF0ZSBjaXJjdWxhciBpbXBvcnRzIGJldHdlZW4gdGhlXG4gICAqIGNvbXBvbmVudHMsIHRoZSBnaXptb3MgYW5kIHRoZSBtZXNoIGhlbHBlcnMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3JlZ2lzdGVyQ29yZUNvbXBvbmVudENsYXNzZXMoKSB7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKFRyYW5zZm9ybUNvbXBvbmVudCk7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKFNjZW5lR3JhcGhDb21wb25lbnQpO1xuICAgIENvbXBvbmVudFJlcG9zaXRvcnkuX2Vuc3VyZUNvbXBvbmVudENsYXNzUmVnaXN0ZXJlZChNZXNoQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoTWVzaFJlbmRlcmVyQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoQ2FtZXJhQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoTGlnaHRDb21wb25lbnQpO1xuICAgIC8vIEFuaW1hdGlvbkNvbXBvbmVudCBhbmQgQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCByZWdpc3RlciB0aGVtc2VsdmVzIG9uIGZpcnN0IHVzZSBhbmQgcHJvdmlkZSB0aGVpciBvd25cbiAgICAvLyBydW50aW1lIGhvb2tzLCBzbyB0aGV5IHN0YXkgb3V0IG9mIHRoZSBjb3JlIHBhdGguXG4gICAgLy8gU2tlbGV0YWxDb21wb25lbnQgcmVnaXN0ZXJzIGl0cyBib25lIGRhdGEgbWVtYmVycyB3aGVuIGl0cyBtb2R1bGUgaXMgZXZhbHVhdGVkLCBhbmQgZXZlcnkgZ2VuZXJhdGVkXG4gICAgLy8gc2hhZGVyIGRlY2xhcmVzIHRoZSBib25lIGRhdGEgZ2V0dGVycyAoZ2V0X2JvbmVEYXRhIGV0Yy4pLCBzbyB0aGUgY2xhc3MgbXVzdCBiZSBwYXJ0IG9mIHRoZSBjb3JlXG4gICAgLy8gZXZlbiBpbiBhcHBsaWNhdGlvbnMgd2l0aG91dCBza2lubmVkIG1lc2hlcy5cbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoU2tlbGV0YWxDb21wb25lbnQpO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBhc3luYyBpbml0KGRlc2M6IEVuZ2luZUluaXREZXNjcmlwdGlvbik6IFByb21pc2U8RW5naW5lPiB7XG4gICAgaWYgKFxuICAgICAgZGVzYy5hcHByb2FjaCAhPT0gUHJvY2Vzc0FwcHJvYWNoLk5vbmUgJiZcbiAgICAgIGRlc2MuYXBwcm9hY2ggIT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIgJiZcbiAgICAgIGRlc2MuYXBwcm9hY2ggIT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFVcbiAgICApIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gKGRlc2MuYXBwcm9hY2ggYXMgYW55KT8uc3RyID8/IFN0cmluZyhkZXNjLmFwcHJvYWNoKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFVuc3VwcG9ydGVkIHByb2Nlc3MgYXBwcm9hY2ggXCIke3ZhbHVlfVwiLiBUaGUgXCJVbmlmb3JtXCIgYW5kIFwiRGF0YVRleHR1cmVcIiBtb2RlcyB3ZXJlIHJlbW92ZWQuIFVzZSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyIChcIldlYkdMMlwiKSBvciBQcm9jZXNzQXBwcm9hY2guV2ViR1BVIChcIldlYkdQVVwiKS5gXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyICYmIHR5cGVvZiBfX1JOX1dFQkdMX18gIT09ICd1bmRlZmluZWQnICYmICFfX1JOX1dFQkdMX18pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUHJvY2Vzc0FwcHJvYWNoLldlYkdMMiBpcyB1bmF2YWlsYWJsZTogdGhpcyBidWlsZCB3YXMgYnVuZGxlZCB3aXRoIF9fUk5fV0VCR0xfXyA9IGZhbHNlLicpO1xuICAgIH1cbiAgICBpZiAoZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSAmJiB0eXBlb2YgX19STl9XRUJHUFVfXyAhPT0gJ3VuZGVmaW5lZCcgJiYgIV9fUk5fV0VCR1BVX18pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSBpcyB1bmF2YWlsYWJsZTogdGhpcyBidWlsZCB3YXMgYnVuZGxlZCB3aXRoIF9fUk5fV0VCR1BVX18gPSBmYWxzZS4nKTtcbiAgICB9XG5cbiAgICBFbmdpbmUuX19yZWdpc3RlckNvcmVDb21wb25lbnRDbGFzc2VzKCk7XG5cbiAgICAvLyBUaGUgUEJSIG1vZHVsZSAodGhlIHNoZWVuIExVVCBpbWFnZSkgaXMgbG9hZGVkIG9uIGRlbWFuZCBieSBEdW1teVRleHR1cmVzLnJlcXVlc3RTaGVlbkx1dFRleHR1cmUoKS5cbiAgICAvLyBUaGUgWFIgc3VwcG9ydCBwdWxscyBpbiB0aGUgZ2xURiBpbXBvcnRlciAoY29udHJvbGxlciBtb2RlbHMpLCBzbyBpdCBpcyBsb2FkZWQgb25seSB3aGVuIHJlcXVlc3RlZC5cbiAgICBjb25zdCByblhSTW9kdWxlID1cbiAgICAgIChkZXNjLnhyID8/IEVuZ2luZS5fbG9hZFhSQnlEZWZhdWx0KSA/ICgoYXdhaXQgTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmxvYWRNb2R1bGUoJ3hyJykpIGFzIFJuWFIpIDogdW5kZWZpbmVkO1xuXG4gICAgbGV0IG1heEdQVURhdGFTdG9yYWdlU2l6ZTogQnl0ZSA9IDA7XG4gICAgbGV0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5OiBJQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIC8vIFdlYkdQVVxuICAgICAgYXdhaXQgTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmxvYWRNb2R1bGUoJ3dlYmdwdScpO1xuXG4gICAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPVxuICAgICAgICBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkoKSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgICBjb25zdCB3ZWJncHVNb2R1bGUgPSBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkuZ2V0TW9kdWxlKCd3ZWJncHUnKTtcbiAgICAgIGNvbnN0IFdlYkdwdURldmljZVdyYXBwZXJDbGFzcyA9IHdlYmdwdU1vZHVsZS5XZWJHcHVEZXZpY2VXcmFwcGVyIGFzIHR5cGVvZiBXZWJHcHVEZXZpY2VXcmFwcGVyO1xuICAgICAgY29uc3QgYWRhcHRlciA9IGF3YWl0IG5hdmlnYXRvci5ncHUucmVxdWVzdEFkYXB0ZXIoeyB4ckNvbXBhdGlibGU6IHRydWUgfSk7XG4gICAgICBjb25zdCB7IG1heEJ1ZmZlclNpemUsIG1heFN0b3JhZ2VCdWZmZXJCaW5kaW5nU2l6ZSB9ID0gYWRhcHRlciEubGltaXRzO1xuICAgICAgY29uc3QgZmVhdHVyZXM6IEdQVUZlYXR1cmVOYW1lW10gPSBbXTtcbiAgICAgIGZ1bmN0aW9uIGFkZEZlYXR1cmUoZmVhdHVyZTogR1BVRmVhdHVyZU5hbWUpIHtcbiAgICAgICAgaWYgKGFkYXB0ZXIhLmZlYXR1cmVzLmhhcyhmZWF0dXJlKSkge1xuICAgICAgICAgIGZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFkZEZlYXR1cmUoJ2Zsb2F0MzItZmlsdGVyYWJsZScpO1xuICAgICAgYWRkRmVhdHVyZSgncmcxMWIxMHVmbG9hdC1yZW5kZXJhYmxlJyk7XG4gICAgICBhZGRGZWF0dXJlKCd0ZXh0dXJlLWNvbXByZXNzaW9uLWJjJyk7XG4gICAgICBhZGRGZWF0dXJlKCd0ZXh0dXJlLWNvbXByZXNzaW9uLWV0YzInKTtcbiAgICAgIGFkZEZlYXR1cmUoJ3RleHR1cmUtY29tcHJlc3Npb24tYXN0YycpO1xuICAgICAgLy8gVXNlZCBieSB0aGUgR1BVIHRpbWVyIChFbmdpbmUuZ3B1VGltZXJFbmFibGVkKS4gRW5hYmxpbmcgdGhlIGZlYXR1cmUgaGFzIG5vIGNvc3QgdW50aWwgaXQgaXMgdXNlZC5cbiAgICAgIGFkZEZlYXR1cmUoJ3RpbWVzdGFtcC1xdWVyeScpO1xuXG4gICAgICBjb25zdCBkZXZpY2UgPSBhd2FpdCBhZGFwdGVyIS5yZXF1ZXN0RGV2aWNlKHtcbiAgICAgICAgcmVxdWlyZWRGZWF0dXJlczogZmVhdHVyZXMsXG4gICAgICAgIHJlcXVpcmVkTGltaXRzOiB7XG4gICAgICAgICAgbWF4U3RvcmFnZUJ1ZmZlckJpbmRpbmdTaXplLFxuICAgICAgICAgIG1heEJ1ZmZlclNpemUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIG1heEdQVURhdGFTdG9yYWdlU2l6ZSA9IG1heFN0b3JhZ2VCdWZmZXJCaW5kaW5nU2l6ZTtcbiAgICAgIGNvbnN0IHdlYkdwdURldmljZVdyYXBwZXIgPSBuZXcgV2ViR3B1RGV2aWNlV3JhcHBlckNsYXNzKGRlc2MuY2FudmFzLCBhZGFwdGVyISwgZGV2aWNlKTtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5hZGRXZWJHcHVEZXZpY2VXcmFwcGVyKHdlYkdwdURldmljZVdyYXBwZXIpO1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnJlY3JlYXRlU3lzdGVtRGVwdGhUZXh0dXJlKCk7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlQmluZEdyb3VwTGF5b3V0Rm9yRHJhd1BhcmFtZXRlcnMoKTtcbiAgICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIH0gZWxzZSBpZiAoZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdMMikge1xuICAgICAgLy8gV2ViR0xcbiAgICAgIGF3YWl0IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5sb2FkTW9kdWxlKCd3ZWJnbCcpO1xuXG4gICAgICBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KCk7XG4gICAgICAoY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLmdlbmVyYXRlV2ViR0xDb250ZXh0KFxuICAgICAgICBkZXNjLmNvbmZpZyA/PyBuZXcgQ29uZmlnKCksXG4gICAgICAgIGRlc2MuY2FudmFzLFxuICAgICAgICB0cnVlLFxuICAgICAgICBkZXNjLndlYmdsT3B0aW9uXG4gICAgICApO1xuICAgICAgKGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5zd2l0Y2hEZXB0aFRlc3QodHJ1ZSk7XG4gICAgICBtYXhHUFVEYXRhU3RvcmFnZVNpemUgPVxuICAgICAgICAoY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyIS5nZXRNYXhUZXh0dXJlU2l6ZSgpICoqIDIgKlxuICAgICAgICA0IC8qIHJnYmEgKi8gKlxuICAgICAgICA0IC8qIGJ5dGUgKi87XG4gICAgfSBlbHNlIHtcbiAgICAgIG1heEdQVURhdGFTdG9yYWdlU2l6ZSA9IDEwMjQgKiogMiAqIDQgLyogcmdiYSAqLyAqIDQgLyogYnl0ZSAqLztcbiAgICB9XG5cbiAgICBjb25zdCBlbmdpbmUgPSBuZXcgRW5naW5lKGRlc2MuYXBwcm9hY2gsIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ISwgbWF4R1BVRGF0YVN0b3JhZ2VTaXplLCBkZXNjLmNvbmZpZywgcm5YUk1vZHVsZSk7XG4gICAgZW5naW5lLl9fZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9IGRlc2MuYXBwcm9hY2g7XG4gICAgZW5naW5lLl9fY29uZmlnLmV2ZW50VGFyZ2V0RG9tID0gZW5naW5lLl9fY29uZmlnLmV2ZW50VGFyZ2V0RG9tID8/IGRlc2MuY2FudmFzO1xuICAgIGlmIChkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBlbmdpbmUuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgfVxuICAgIGlmIChkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyKSB7XG4gICAgICBlbmdpbmUuX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeSA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIH1cbiAgICBlbmdpbmUuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ITtcblxuICAgIGlmIChkZXNjLm5vdFRvRGlzcGxheVJuSW5mb0F0SW5pdCAhPT0gdHJ1ZSkge1xuICAgICAgZW5naW5lLl9fZGlzcGxheVJuSW5mbygpO1xuICAgIH1cblxuICAgIGNvbnN0IGdsb2JhbERhdGFSZXBvc2l0b3J5ID0gZW5naW5lLl9fZ2xvYmFsRGF0YVJlcG9zaXRvcnk7XG4gICAgZ2xvYmFsRGF0YVJlcG9zaXRvcnkuaW5pdGlhbGl6ZShkZXNjLmFwcHJvYWNoKTtcblxuICAgIGlmIChkZXNjLmNhbnZhcyAhPSBudWxsICYmIGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIpIHtcbiAgICAgIC8vIERlYWwgd2l0aCBXZWJHTCBjb250ZXh0IGxvc3QgYW5kIHJlc3RvcmVcbiAgICAgIGRlc2MuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICd3ZWJnbGNvbnRleHRsb3N0JyxcbiAgICAgICAgKChldmVudDogRXZlbnQpID0+IHtcbiAgICAgICAgICAvLyBDYWxsaW5nIHByZXZlbnREZWZhdWx0IHNpZ25hbHMgdG8gdGhlIHBhZ2UgdGhhdCB5b3UgaW50ZW50IHRvIGhhbmRsZSBjb250ZXh0IHJlc3RvcmF0aW9uLlxuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZW5naW5lLnN0b3BSZW5kZXJMb29wKCk7XG4gICAgICAgICAgZW5naW5lLmxvZ2dlci5lcnJvcignV2ViR0wgY29udGV4dCBsb3N0IG9jY3VycmVkLicpO1xuICAgICAgICB9KS5iaW5kKHRoaXMpXG4gICAgICApO1xuXG4gICAgICBkZXNjLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd3ZWJnbGNvbnRleHRyZXN0b3JlZCcsICgpID0+IHtcbiAgICAgICAgLy8gT25jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB0aGUgZ2wgY29udGV4dCB3aWxsIGJlIHJlc3RvcmVkIGJ1dCBhbnkgZ3JhcGhpY3MgcmVzb3VyY2VzXG4gICAgICAgIC8vIHRoYXQgd2VyZSBwcmV2aW91c2x5IGxvYWRlZCB3aWxsIGJlIGxvc3QsIHNvIHRoZSBzY2VuZSBzaG91bGQgYmUgcmVsb2FkZWQuXG4gICAgICAgIGVuZ2luZS5sb2dnZXIuZXJyb3IoJ1dlYkdMIGNvbnRleHQgcmVzdG9yZWQuJyk7XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCByZXN0b3JpbmcgdGhlIHByZXZpb3VzIGdyYXBoaWNzIHJlc291cmNlc1xuICAgICAgICAvLyBsb2FkU2NlbmVHcmFwaGljcyhnbCk7XG4gICAgICAgIGVuZ2luZS5yZXN0YXJ0UmVuZGVyTG9vcCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZW5naW5lLl9fZHVtbXlUZXh0dXJlcyA9IGF3YWl0IER1bW15VGV4dHVyZXMuaW5pdChlbmdpbmUpO1xuXG4gICAgZW5naW5lLl9fZW5naW5lU3RhdGUudmlld3BvcnRBc3BlY3RSYXRpbyA9IGRlc2MuY2FudmFzICE9IG51bGwgPyBkZXNjLmNhbnZhcy53aWR0aCAvIGRlc2MuY2FudmFzLmhlaWdodCA6IDE7XG5cbiAgICByZXR1cm4gZW5naW5lO1xuICB9XG5cbiAgcHVibGljIGdldCBwcm9jZXNzQXBwcm9hY2goKSB7XG4gICAgcmV0dXJuIHRoaXMuX19wcm9jZXNzQXBwcm9hY2g7XG4gIH1cblxuICBwdWJsaWMgcmVzaXplQ2FudmFzKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSB7XG4gICAgY29uc3QgcmVwbyA9IHRoaXMuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgcmVwby5yZXNpemVDYW52YXMod2lkdGgsIGhlaWdodCk7XG4gICAgdGhpcy5fX2VuZ2luZVN0YXRlLnZpZXdwb3J0QXNwZWN0UmF0aW8gPSB3aWR0aCAvIGhlaWdodDtcbiAgfVxuXG4gIHB1YmxpYyBnZXRDYW52YXNTaXplKCkge1xuICAgIGNvbnN0IHJlcG8gPSB0aGlzLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHJldHVybiByZXBvLmdldENhbnZhc1NpemUoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXRDdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlcigpIHtcbiAgICByZXR1cm4gKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVudGl0eVJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5O1xuICB9XG5cbiAgcHVibGljIGdldCBjb21wb25lbnRSZXBvc2l0b3J5KCkge1xuICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY29tcG9uZW50TWVtb3J5UmVnaXN0cnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19jb21wb25lbnRNZW1vcnlSZWdpc3RyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgV2ViWFIgKFZSKSBzeXN0ZW0uXG4gICAqIEB0aHJvd3MgSWYgdGhlIFhSIHN1cHBvcnQgaXMgbm90IGVuYWJsZWQgKHNlZSB7QGxpbmsgZW5hYmxlWFJ9IGFuZCBgRW5naW5lSW5pdERlc2NyaXB0aW9uLnhyYClcbiAgICovXG4gIHB1YmxpYyBnZXQgd2ViWFJTeXN0ZW0oKTogV2ViWFJTeXN0ZW0ge1xuICAgIGlmICh0aGlzLl9fd2ViWFJTeXN0ZW0gPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVuZ2luZS5fX3hyTm90RW5hYmxlZE1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBXZWJBUiBzeXN0ZW0uXG4gICAqIEB0aHJvd3MgSWYgdGhlIFhSIHN1cHBvcnQgaXMgbm90IGVuYWJsZWQgKHNlZSB7QGxpbmsgZW5hYmxlWFJ9IGFuZCBgRW5naW5lSW5pdERlc2NyaXB0aW9uLnhyYClcbiAgICovXG4gIHB1YmxpYyBnZXQgd2ViQVJTeXN0ZW0oKTogV2ViQVJTeXN0ZW0ge1xuICAgIGlmICh0aGlzLl9fd2ViQVJTeXN0ZW0gPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVuZ2luZS5fX3hyTm90RW5hYmxlZE1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIFhSIHN1cHBvcnQgKFdlYlhSIGFuZCBXZWJBUiBzeXN0ZW1zKSBpcyBlbmFibGVkLiAqL1xuICBwdWJsaWMgZ2V0IGlzWFJFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fd2ViWFJTeXN0ZW0gIT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgV2ViWFIgc3lzdGVtLCBvciB1bmRlZmluZWQgd2hlbiB0aGUgWFIgc3VwcG9ydCBpcyBub3QgZW5hYmxlZC5cbiAgICogSW50ZXJuYWwgY29kZSB1c2VzIGl0IHNvIHRoYXQgcmVuZGVyaW5nIHdpdGhvdXQgWFIgbmV2ZXIgbmVlZHMgdGhlIFhSIG1vZHVsZS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwdWJsaWMgZ2V0IF93ZWJYUlN5c3RlbUlmRW5hYmxlZCgpOiBXZWJYUlN5c3RlbSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgV2ViQVIgc3lzdGVtLCBvciB1bmRlZmluZWQgd2hlbiB0aGUgWFIgc3VwcG9ydCBpcyBub3QgZW5hYmxlZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwdWJsaWMgZ2V0IF93ZWJBUlN5c3RlbUlmRW5hYmxlZCgpOiBXZWJBUlN5c3RlbSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX193ZWJBUlN5c3RlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIHRoZSBXZWJYUi9XZWJBUiBzdXBwb3J0IGFmdGVyIGluaXRpYWxpemF0aW9uIGJ5IGxvYWRpbmcgdGhlIFhSIG1vZHVsZS5cbiAgICogRG9lcyBub3RoaW5nIHdoZW4gaXQgaXMgYWxyZWFkeSBlbmFibGVkIChlLmcuIGJ5IGBFbmdpbmUuaW5pdCh7IHhyOiB0cnVlIH0pYCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBXZWJYUiBzeXN0ZW1cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB3ZWJYUlN5c3RlbSA9IGF3YWl0IGVuZ2luZS5lbmFibGVYUigpO1xuICAgKiBhd2FpdCB3ZWJYUlN5c3RlbS5yZWFkeUZvcldlYlhSKGJ1dHRvbkVsZW1lbnQsIGJhc2VQYXRoKTtcbiAgICogYGBgXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZW5hYmxlWFIoKTogUHJvbWlzZTxXZWJYUlN5c3RlbT4ge1xuICAgIGlmICh0aGlzLl9fd2ViWFJTeXN0ZW0gPT0gbnVsbCkge1xuICAgICAgY29uc3Qgcm5YUk1vZHVsZSA9IChhd2FpdCBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkubG9hZE1vZHVsZSgneHInKSkgYXMgUm5YUjtcbiAgICAgIGlmICh0aGlzLl9fd2ViWFJTeXN0ZW0gPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9faW5pdFhSU3lzdGVtcyhyblhSTW9kdWxlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193ZWJYUlN5c3RlbSE7XG4gIH1cblxuICBwcml2YXRlIF9faW5pdFhSU3lzdGVtcyhyblhSTW9kdWxlOiBSblhSKSB7XG4gICAgdGhpcy5fX3dlYlhSU3lzdGVtID0gcm5YUk1vZHVsZS5XZWJYUlN5c3RlbS5pbml0KHRoaXMpO1xuICAgIHRoaXMuX193ZWJBUlN5c3RlbSA9IHJuWFJNb2R1bGUuV2ViQVJTeXN0ZW0uaW5pdCh0aGlzKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IF9feHJOb3RFbmFibGVkTWVzc2FnZSA9XG4gICAgJ1RoZSBYUiBzdXBwb3J0IGlzIG5vdCBlbmFibGVkLiBJbml0aWFsaXplIHRoZSBlbmdpbmUgd2l0aCBFbmdpbmUuaW5pdCh7IHhyOiB0cnVlIH0pIG9yIGNhbGwgJyArXG4gICAgJ2F3YWl0IGVuZ2luZS5lbmFibGVYUigpIGZpcnN0LiBUaGUgZGVmYXVsdCBSbiBuYW1lc3BhY2UgZXhwb3J0IGVuYWJsZXMgaXQgYXV0b21hdGljYWxseS4nO1xuXG4gIHB1YmxpYyBnZXQgbWVtb3J5TWFuYWdlcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX21lbW9yeU1hbmFnZXIhO1xuICB9XG5cbiAgcHVibGljIGdldCBnbG9iYWxEYXRhUmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2dsb2JhbERhdGFSZXBvc2l0b3J5O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzeXN0ZW0gdGhhdCBidWlsZHMgdGhlIGxpZ2h0IGxpc3RzIG9mIENsdXN0ZXJlZCBGb3J3YXJkIHJlbmRlcmluZy5cbiAgICovXG4gIHB1YmxpYyBnZXQgbGlnaHRDbHVzdGVyU3lzdGVtKCkge1xuICAgIHJldHVybiB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtO1xuICB9XG5cbiAgcHVibGljIGdldCBtYXRlcmlhbFJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbFJlcG9zaXRvcnk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5KCkge1xuICAgIHJldHVybiB0aGlzLl9fd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkhO1xuICB9XG5cbiAgcHVibGljIGdldCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICB9XG5cbiAgcHVibGljIGdldCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkhO1xuICB9XG5cbiAgcHVibGljIGdldCBkdW1teVRleHR1cmVzKCkge1xuICAgIHJldHVybiB0aGlzLl9fZHVtbXlUZXh0dXJlcyE7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVuZ2luZVN0YXRlKCkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lU3RhdGU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbmZpZztcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbG9nZ2VyKCkge1xuICAgIHJldHVybiB0aGlzLl9fbG9nZ2VyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNoYWRlciBwcm9ncmFtIGNhY2hlIGZvciB0aGlzIGVuZ2luZSBpbnN0YW5jZS5cbiAgICogVGhpcyBjYWNoZSBtYXBzIHNoYWRlciB0ZXh0IHRvIGNvbXBpbGVkIHNoYWRlciBwcm9ncmFtIFVJRHMuXG4gICAqIEVhY2ggZW5naW5lIGhhcyBpdHMgb3duIGNhY2hlIHRvIHByZXZlbnQgY3Jvc3MtY29udGFtaW5hdGlvbiBiZXR3ZWVuIFdlYkdMIGNvbnRleHRzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBnZXQgc2hhZGVyUHJvZ3JhbUNhY2hlKCk6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZGVyUHJvZ3JhbUNhY2hlO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxlQUFlO0FBS3hCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsNkJBQTZCO0FBQ3RDLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsK0JBQStCO0FBQ3hDLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsaUNBQWlDO0FBQzFDLFNBQVMsY0FBYztBQUN2QixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLDRCQUE0QjtBQUNyQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGlCQUFpQjtBQUUxQixTQUFTLHFCQUFxQjtBQUU5QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsVUFBVTtBQUNuQixTQUFTLGNBQWM7QUFDdkIsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsK0JBQThEO0FBQ3ZFLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsYUFBYTtBQUN0QixTQUFTLDBCQUEwQjtBQUNuQyxTQUFTLGtCQUFrQjtBQUMzQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLHFCQUFxQjtBQUk5QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHlDQUF5QztBQUdsRCxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLCtCQUErQjtBQUN4QyxTQUFTLHlDQUF5QztBQUNsRCxTQUFTLCtCQUErQjtBQUN4QyxTQUFTLDBCQUEwQjtBQTZDNUIsSUFBTSxVQUFOLE1BQU0sZ0JBQWUsU0FBUztBQUFBLEVBNkMzQixZQUNOLGlCQUNBLHlCQUNBLHVCQUNBLFFBQ0EsWUFDQTtBQUNBLFVBQU07QUFqRFIsU0FBUSxvQkFBeUMsZ0JBQWdCO0FBSWpFLFNBQVEsZ0JBQWdCLElBQUksWUFBWTtBQUN4QyxTQUFRLHdCQUF3QjtBQUNoQyxTQUFRLHFCQUFxQjtBQUs3QixTQUFRLFNBQW9CLENBQUM7QUFtQjdCLFNBQVEsb0NBQW9DO0FBQzVDLFNBQVEsdUNBQXVDO0FBQy9DLFNBQVEsdUJBQXVCO0FBQy9CLFNBQVEsbUNBQW1DO0FBRTNDO0FBQUEsU0FBUSx1QkFBNEMsb0JBQUksSUFBSTtBQUM1RCxTQUFRLG9CQUFvQjtBQUk1QixTQUFRLGNBQXFCO0FBVTNCLFNBQUssV0FBVywwQkFBVSxJQUFJLE9BQU87QUFDckMsU0FBSyxXQUFXLElBQUksT0FBTztBQUMzQixTQUFLLFNBQVMsV0FBVyxLQUFLLFNBQVM7QUFDdkMsU0FBSyxjQUFjLFFBQU87QUFDMUIsU0FBSyxvQkFBb0I7QUFDekIsU0FBSyw0QkFBNEI7QUFDakMsU0FBSyw0QkFBNEIsSUFBSSx3QkFBd0I7QUFDN0QsU0FBSyx3QkFBd0IsSUFBSSxvQkFBb0IsSUFBSTtBQUN6RCxTQUFLLHFCQUFxQixJQUFJLGlCQUFpQixJQUFJO0FBQ25ELFNBQUssdUJBQXVCLElBQUksbUJBQW1CO0FBQ25ELFNBQUssa0JBQWtCLGNBQWMsMkJBQTJCLE1BQU0scUJBQXFCO0FBRzNGLFFBQUksY0FBYyxNQUFNO0FBQ3RCLFdBQUssZ0JBQWdCLFVBQVU7QUFBQSxJQUNqQztBQUNBLFNBQUsseUJBQXlCLHFCQUFxQixLQUFLLElBQUk7QUFDNUQsU0FBSyx1QkFBdUIsSUFBSSxtQkFBbUIsSUFBSTtBQUN2RCxZQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsSUFBVyxZQUFZO0FBQ3JCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQSxFQUVBLE9BQWMsVUFBVSxXQUFzQjtBQUM1QyxVQUFNLFNBQVMsUUFBTyxVQUFVLElBQUksU0FBUztBQUM3QyxRQUFJLEdBQUcsSUFBSSxNQUFNLE1BQU0sR0FBRztBQUN4QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFzQ08sVUFBZ0I7QUFDckIsU0FBSyxlQUFlO0FBQ3BCLFNBQUssbUJBQW1CO0FBQ3hCLFNBQUssU0FBUyxDQUFDO0FBQ2YsU0FBSyxtQkFBbUI7QUFBQSxFQUMxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNUSxxQkFBMkI7QUF6T3JDO0FBNE9JLFNBQUsscUJBQXFCLG9DQUFvQztBQUc5RCxVQUFNLFdBQVcsS0FBSyxtQkFBbUIsYUFBYTtBQUN0RCxlQUFXLFVBQVUsVUFBVTtBQUM3QixXQUFLLG1CQUFtQixhQUFhLE9BQU8sU0FBUztBQUFBLElBQ3ZEO0FBR0EsUUFBSSxHQUFHLE1BQU0sS0FBSyxlQUFlLEdBQUc7QUFDbEMsV0FBSyxnQkFBZ0IsUUFBUTtBQUM3QixXQUFLLGtCQUFrQjtBQUFBLElBQ3pCO0FBR0EsUUFBSSxHQUFHLE1BQU0sS0FBSywwQkFBMEIsR0FBRztBQUM3QyxXQUFLLDJCQUEyQixXQUFXO0FBRTNDLFVBQUk7QUFDRixjQUFNLGdCQUFnQixLQUFLLDJCQUEyQix1QkFBdUI7QUFDN0UsWUFBSSxlQUFlO0FBQ2pCLHdCQUFjLFFBQVEsWUFBWTtBQUFBLFFBQ3BDO0FBQUEsTUFDRixTQUFTLElBQUk7QUFBQSxNQUViO0FBQUEsSUFDRjtBQUdBLFFBQUksR0FBRyxNQUFNLEtBQUssZUFBZSxHQUFHO0FBQ2xDLFdBQUssZ0JBQWdCLFFBQVE7QUFDN0IsV0FBSyxrQkFBa0I7QUFBQSxJQUN6QjtBQUdBLFNBQUssK0JBQStCO0FBR3BDLHVCQUFtQixrQkFBa0IsSUFBSTtBQUN6Qyx3QkFBb0Isa0JBQWtCLElBQUk7QUFDMUMsb0JBQWdCLGtCQUFrQixJQUFJO0FBQ3RDLG1CQUFlLGtCQUFrQixJQUFJO0FBQ3JDLDBCQUFzQixrQkFBa0IsSUFBSTtBQUM1Qyw2QkFBbUIsTUFBbkIsbUJBQXNCLGlCQUFpQjtBQUd2Qyw0QkFBd0IsSUFBSTtBQUc1Qiw0QkFBd0Isa0JBQWtCLElBQUk7QUFHOUMsc0NBQWtDLElBQUk7QUFHdEMsc0NBQWtDLElBQUk7QUFFdEMsZUFBSyxvQkFBTCxtQkFBc0I7QUFDdEIsU0FBSyxrQkFBa0I7QUFHdkIsU0FBSywwQkFBMEIsUUFBUTtBQUd2QyxTQUFLLDZCQUE2QjtBQUNsQyxTQUFLLDZCQUE2QjtBQUdsQyxTQUFLLHdCQUF3QjtBQUM3QixTQUFLLG9DQUFvQztBQUN6QyxTQUFLLHVDQUF1QztBQUM1QyxTQUFLLHVCQUF1QjtBQUc1QixZQUFPLFVBQVUsT0FBTyxLQUFLLFNBQVM7QUFDdEMsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZU8sZ0JBQWdCLG1CQUEyRCxNQUFhO0FBQzdGLFNBQUssbUJBQW1CO0FBQ3hCLFNBQUssU0FBUztBQUlkLFFBQUksS0FBSyx1QkFBdUIsSUFBSTtBQUNsQyxXQUFLLGVBQWU7QUFBQSxJQUN0QjtBQUVBLFVBQU0sdUJBQXVCLEtBQUssMEJBQTBCO0FBQzVELFNBQUsseUJBQXlCO0FBSzlCLFVBQU0sd0JBQXdCLHFCQUFxQixzQkFBc0IsS0FBSyxvQkFBb0I7QUFDbEcsVUFBTSxjQUFjLEtBQUs7QUFDekIsVUFBTSxjQUFjLEtBQUs7QUFNekIsVUFBTSxlQUFlLEtBQUssU0FBUztBQUNuQyxVQUFNLFdBQWtCLGVBQWUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUM7QUFFdkQsVUFBTSx1QkFBdUIsZUFDekIsQ0FBQyxTQUFpQjtBQUNoQixlQUFTLENBQUMsSUFBSTtBQUNkLHFCQUFlLE1BQU0sZ0JBQWdCLFFBQThCO0FBQUEsSUFDckUsSUFDQSxDQUFDLFNBQWlCO0FBQ2hCLHFCQUFlLEtBQUssZ0JBQWdCLElBQUk7QUFBQSxJQUMxQztBQUVKLFVBQU0sb0JBQW9CLENBQUMsT0FBZSxZQUFxQjtBQUM3RCxVQUFJLDJDQUFhLGlCQUFpQjtBQUNoQyxvQkFBWSxXQUFXLE9BQU8sT0FBTztBQUNyQyw2QkFBcUIsS0FBSztBQUMxQixvQkFBWSxZQUFZO0FBQUEsTUFDMUIsV0FBVywyQ0FBYSxpQkFBaUI7QUFDdkMsb0JBQVksV0FBVyxPQUFPLE9BQU87QUFDckMsNkJBQXFCLEtBQUs7QUFDMUIsb0JBQVksWUFBWTtBQUFBLE1BQzFCLE9BQU87QUFDTCw2QkFBcUIsS0FBSztBQUFBLE1BQzVCO0FBQ0EsV0FBSyxxQkFBcUIsc0JBQXNCLGdCQUFnQjtBQUFBLElBQ2xFO0FBRUEsU0FBSyxxQkFBcUIsc0JBQXNCLGdCQUFnQjtBQUFBLEVBQ2xFO0FBQUEsRUFFUSw0QkFBZ0Q7QUFDdEQsUUFBSSx1QkFBdUQ7QUFDM0QsVUFBTSxjQUFjLEtBQUs7QUFDekIsVUFBTSxjQUFjLEtBQUs7QUFDekIsUUFBSSwyQ0FBYSx1QkFBdUI7QUFDdEMsNkJBQXVCLFlBQVk7QUFBQSxJQUNyQyxXQUFXLDJDQUFhLHVCQUF1QjtBQUM3Qyw2QkFBdUIsWUFBWTtBQUFBLElBQ3JDO0FBQ0EsUUFBSSxHQUFHLElBQUksTUFBTSxvQkFBb0IsR0FBRztBQUN0QyxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLTyxpQkFBaUI7QUEvWTFCO0FBbVpJLFVBQU0sd0JBQXVCLFVBQUssMkJBQUwsWUFBK0IsS0FBSywwQkFBMEI7QUFDM0YsUUFBSSxLQUFLLHVCQUF1QixJQUFJO0FBQ2xDLDJCQUFxQixxQkFBcUIsS0FBSyxrQkFBa0I7QUFBQSxJQUNuRTtBQUNBLFNBQUsscUJBQXFCO0FBQzFCLFNBQUsseUJBQXlCO0FBQUEsRUFDaEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtPLG9CQUFvQjtBQUN6QixRQUFJLEtBQUssb0JBQW9CLE1BQU07QUFDakMsV0FBSyxnQkFBZ0IsS0FBSyxrQkFBa0IsR0FBRyxLQUFLLE1BQU07QUFBQSxJQUM1RDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdPLFlBQVksYUFBYSxRQUFRLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHO0FBQzdELFFBQUksR0FBRyxJQUFJLE1BQU0sS0FBSywwQkFBMEIsR0FBRztBQUNqRCxZQUFNLGFBQWEsSUFBSSxXQUFXO0FBQ2xDLFlBQU0saUJBQWlCLElBQUksV0FBVyxJQUFJO0FBQzFDLHFCQUFlLHFCQUFxQjtBQUNwQyxxQkFBZSxxQkFBcUI7QUFDcEMscUJBQWUsYUFBYTtBQUM1QixZQUFNLGlCQUFpQixJQUFJLFdBQVcsSUFBSTtBQUMxQyxpQkFBVyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsY0FBYyxDQUFDO0FBQzNELFdBQUssNkJBQTZCO0FBQ2xDLFdBQUssNkJBQTZCO0FBQUEsSUFDcEM7QUFDQSxTQUFLLDJCQUE0QixjQUFjO0FBQy9DLFVBQU0sV0FBVyxLQUFLLG1CQUFtQixhQUFhO0FBQ3RELFNBQUssMkJBQTRCLFlBQVksUUFBMEM7QUFDdkYsU0FBSyxRQUFRLENBQUMsS0FBSywwQkFBMEIsQ0FBQztBQUFBLEVBQ2hEO0FBQUEsRUFZTyxRQUFRLE9BQVk7QUFDekIsVUFBTSxrQkFBa0IsS0FBSztBQUM3QixRQUFJLGlCQUFpQjtBQUNuQixXQUFLLGdCQUFnQjtBQUFBLElBQ3ZCO0FBQ0EsU0FBSyxjQUFjLElBQUk7QUFDdkIsU0FBSyx5Q0FBeUM7QUFDOUMsUUFBSSxjQUE0QjtBQUNoQyxRQUFJLGlCQUFpQixPQUFPO0FBQzFCLG9CQUFjLE1BQU07QUFBQSxJQUN0QjtBQUVBLFFBQUksZ0JBQWdCLFdBQVcsSUFBSSxNQUFNLFVBQVUsa0JBQWtCO0FBQ25FLGNBQU8sYUFBYSxJQUFJO0FBQUEsSUFDMUI7QUFFQSxVQUFNLE9BQU8sS0FBSyx1QkFBdUIsU0FBUyxRQUFRLENBQUM7QUFDM0QsU0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLO0FBRWxCLFFBQUksS0FBSyxvQkFBb0IsZ0JBQWdCLFFBQVE7QUFDbkQsV0FBSyxlQUFlLFdBQVc7QUFBQSxJQUNqQyxPQUFPO0FBQ0wsV0FBSyxjQUFjLFdBQVc7QUFBQSxJQUNoQztBQUVBLFNBQUssWUFBWTtBQUNqQixRQUFJLGlCQUFpQjtBQUNuQixXQUFLLGNBQWM7QUFBQSxJQUNyQjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsSUFBVyxrQkFBMkI7QUFDcEMsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsSUFBVyxnQkFBZ0IsTUFBZTtBQUN4QyxTQUFLLG9CQUFvQjtBQUFBLEVBQzNCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQVcsc0JBQStCO0FBM2Y1QztBQTRmSSxRQUFJLEtBQUssc0JBQXNCLGdCQUFnQixRQUFRO0FBQ3JELGFBQU8sS0FBSyx5QkFBeUIsYUFBYSxFQUFFO0FBQUEsSUFDdEQ7QUFDQSxZQUFPLGdCQUFLLG1CQUFtQixNQUF4QixtQkFBMkIsZ0JBQTNCLFlBQTBDO0FBQUEsRUFDbkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsSUFBVyxzQkFBMEM7QUE1Z0J2RDtBQTZnQkksUUFBSSxDQUFDLEtBQUssbUJBQW1CO0FBQzNCLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxLQUFLLHNCQUFzQixnQkFBZ0IsUUFBUTtBQUNyRCxjQUFPLFVBQUssK0JBQUwsbUJBQWlDLGVBQWU7QUFBQSxJQUN6RDtBQUNBLFlBQU8sVUFBSyxvQkFBTCxtQkFBc0I7QUFBQSxFQUMvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsSUFBVywyQkFBb0U7QUEvaEJqRjtBQWdpQkksUUFBSSxDQUFDLEtBQUsscUJBQXFCLEtBQUssc0JBQXNCLGdCQUFnQixRQUFRO0FBQ2hGLGFBQU87QUFBQSxJQUNUO0FBQ0EsWUFBTyxVQUFLLCtCQUFMLG1CQUFpQyxlQUFlO0FBQUEsRUFDekQ7QUFBQSxFQUVRLHFCQUFnRDtBQXRpQjFEO0FBdWlCSSxRQUFJLEtBQUssbUJBQW1CLE1BQU07QUFDaEMsWUFBTSxPQUFNLFVBQUssOEJBQUwsbUJBQWdDO0FBQzVDLFVBQUksT0FBTyxNQUFNO0FBQ2YsZUFBTztBQUFBLE1BQ1Q7QUFDQSxXQUFLLGtCQUFrQixJQUFJLGNBQWMsSUFBSSxzQkFBc0IsQ0FBQztBQUFBLElBQ3RFO0FBQ0EsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRVEsa0JBQWtCO0FBampCNUI7QUFrakJJLFFBQUksS0FBSyxzQkFBc0IsZ0JBQWdCLFFBQVE7QUFDckQsaUJBQUssK0JBQUwsbUJBQWlDLGVBQWU7QUFBQSxJQUNsRCxPQUFPO0FBQ0wsaUJBQUssbUJBQW1CLE1BQXhCLG1CQUEyQjtBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUFBLEVBRVEsZ0JBQWdCO0FBempCMUI7QUEwakJJLFFBQUksS0FBSyxzQkFBc0IsZ0JBQWdCLFFBQVE7QUFDckQsaUJBQUssK0JBQUwsbUJBQWlDLGVBQWU7QUFBQSxJQUNsRCxPQUFPO0FBQ0wsaUJBQUssb0JBQUwsbUJBQXNCO0FBQUEsSUFDeEI7QUFBQSxFQUNGO0FBQUEsRUFFUSwwQkFBMEI7QUFBQSxJQUNoQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsR0FRWTtBQUVWLGVBQVcsWUFBWTtBQU12QixRQUFJO0FBQ0osUUFBSSw2QkFBNkIsV0FBVywwQkFBMEI7QUFDcEUsNEJBQXNCLENBQUM7QUFDdkIsWUFBTSxXQUFXLFdBQVc7QUFDNUIsZUFBUyxJQUFJLEdBQUcsSUFBSSxTQUFTLFFBQVEsS0FBSztBQUN4QyxjQUFNLHFCQUFxQixTQUFTLENBQUMsRUFBRSxrQkFBa0I7QUFDekQsWUFBSSxzQkFBc0IsTUFBTTtBQUM5Qiw4QkFBb0IsS0FBSyxrQkFBa0I7QUFBQSxRQUM3QztBQUFBLE1BQ0Y7QUFDQSxVQUFJLG9CQUFvQixXQUFXLEdBQUc7QUFDcEMsOEJBQXNCO0FBQUEsTUFDeEI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxzQkFBc0IsdUJBQXVCO0FBQ25ELFVBQU0sNkJBQTZCLHNCQUMvQix5QkFBeUIsOEJBQThCLE1BQU0sWUFBWSxVQUFVLElBQ25GO0FBQ0osVUFBTSwrQkFBK0IsV0FBVyw0QkFBNEI7QUFDNUUsVUFBTSw4QkFDSixnQ0FBZ0MsV0FBVyxzQkFBc0IsS0FBSyxRQUFRLCtCQUErQjtBQUMvRyxRQUFJLGdDQUFnQyw4QkFBOEIsTUFBTTtBQUN0RSxpQkFBVyxzQkFBc0IscUJBQXNCO0FBQ3JELDJCQUFtQix1QkFBdUIsMEJBQTBCO0FBQUEsTUFDdEU7QUFBQSxJQUNGO0FBQ0EsUUFBSSw2QkFBNkI7QUFDL0Isa0NBQTZCLEtBQUs7QUFBQSxRQUNoQztBQUFBLFFBQ0E7QUFBQSxRQUNBLG1CQUFtQjtBQUFBLFFBQ25CO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUdBLDZCQUF5QixpQkFBaUIsTUFBTSxZQUFZLFVBQVU7QUFFdEUsU0FBSyxxQkFBcUI7QUFBQSxNQUN4QjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLGtDQUFrQyxnQ0FBZ0MsQ0FBQztBQUFBLElBQ3JFLENBQUM7QUFFRCxRQUFJLGdDQUFnQyxDQUFDLDZCQUE2QjtBQUNoRSxZQUFNLG9CQUFvQix5QkFBeUI7QUFBQSxRQUNqRDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUVBLFVBQUkscUJBQXFCLE1BQU07QUFDN0IsbUJBQVcsc0JBQXNCLHFCQUFzQjtBQUNyRCw2QkFBbUIsY0FBYyxtQkFBbUIsNEJBQTRCLFVBQVU7QUFBQSxRQUM1RjtBQUFBLE1BQ0Y7QUFDQSwrQkFBeUIseUNBQXlDO0FBQUEsSUFDcEU7QUFFQSxlQUFXLDhCQUE4QjtBQUN6QyxlQUFXLGFBQWE7QUFFeEIsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLG1EQUFtRDtBQUFBLElBQ3pEO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixHQUtHO0FBQ0QsUUFBSSw0QkFBNEIsV0FBVyxHQUFHO0FBQzVDO0FBQUEsSUFDRjtBQUVBLFVBQU0sNEJBQTRCLGtCQUFrQixzQkFBc0I7QUFDMUUsUUFBSSw2QkFBNkIsTUFBTTtBQUNyQztBQUFBLElBQ0Y7QUFFQSxlQUFXLE9BQU8sNkJBQTZCO0FBQzdDLFVBQUksSUFBSSxlQUFlLGNBQWMsSUFBSSxXQUFXLHNCQUFzQixNQUFNLDJCQUEyQjtBQUN6RztBQUFBLE1BQ0Y7QUFFQSxZQUFNLG9CQUFvQix5QkFBeUI7QUFBQSxRQUNqRDtBQUFBLFFBQ0EsSUFBSTtBQUFBLFFBQ0o7QUFBQSxNQUNGO0FBRUEsVUFBSSxxQkFBcUIsTUFBTTtBQUM3QixtQkFBVyxzQkFBc0IsSUFBSSxxQkFBcUI7QUFDeEQsNkJBQW1CLGNBQWMsbUJBQW1CLElBQUksbUJBQW1CLFVBQVU7QUFBQSxRQUN2RjtBQUFBLE1BQ0Y7QUFDQSwrQkFBeUIseUNBQXlDO0FBQ2xFLFVBQUksV0FBVyw4QkFBOEI7QUFBQSxJQUMvQztBQUFBLEVBQ0Y7QUFBQSxFQUVRLHFCQUFxQjtBQUFBLElBQzNCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLEdBT3FDO0FBcHRCdkM7QUFxdEJJLFFBQUk7QUFDSixRQUFJLFdBQVcsV0FBVztBQUMxQixRQUFJLFVBQVU7QUFDWixVQUFJLGtDQUFrQztBQUNwQyx3Q0FBZ0MseUJBQXlCO0FBQUEsVUFDdkQ7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFDQSxtQkFBVyxpQ0FBaUM7QUFBQSxNQUM5QyxPQUFPO0FBQ0wsbUJBQVcsQ0FBQyx5QkFBeUIsdUJBQXVCLE1BQU0sWUFBWSxVQUFVO0FBQUEsTUFDMUY7QUFDQSxpQkFBSyxlQUFjLDJCQUFuQixHQUFtQix5QkFBMkI7QUFBQSxJQUNoRDtBQUVBLFFBQUksQ0FBQyxVQUFVO0FBQ2IsYUFBTztBQUFBLElBQ1Q7QUFNQSw2QkFBeUIsMEJBQTBCLE1BQU0sWUFBWSxVQUFVO0FBRS9FLFVBQU0sb0JBQW9CLHNCQUFzQixlQUFlO0FBQUEsTUFDN0Q7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLFFBQVE7QUFBQSxJQUNWLENBQUM7QUFDRCxlQUFXLDJCQUEyQjtBQUN0QyxRQUFJLENBQUMsbUJBQW1CO0FBQ3RCLGFBQU87QUFBQSxJQUNUO0FBRUEsUUFBSSxrQ0FBa0M7QUFDcEMsYUFBTyx5QkFBeUIsMkNBQTJDLE1BQU0sWUFBWSxVQUFVO0FBQUEsSUFDekc7QUFFQSw2QkFBeUIsMEJBQTBCLE1BQU0sWUFBWSxVQUFVO0FBQy9FLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFUSxlQUFlLGFBQTJCO0FBbndCcEQ7QUFvd0JJLFVBQU0sZ0JBQWdCLEtBQUssc0JBQXNCLGlCQUFpQjtBQUNsRSxVQUFNLDJCQUEyQixLQUFLO0FBQ3RDLFVBQU0sY0FBYyxLQUFLO0FBQ3pCLGVBQVcsU0FBUyxVQUFVLGdCQUFnQjtBQUM1QyxVQUFJLFVBQVUsYUFBYSxRQUFRO0FBRWpDLGFBQUsscUJBQXFCLE9BQU8sV0FBVztBQUM1Qyw4QkFBc0Isa0JBQWtCLElBQUk7QUFDNUMsY0FBTSxlQUFjLGdEQUFhLGdCQUFiLFlBQTRCO0FBQ2hELGNBQU0sZUFBYyxnREFBYSxrQkFBYixZQUE4QjtBQUNsRCxjQUFNLFNBQVMsS0FBSyxjQUFjO0FBQ2xDLGNBQU0sZUFBZSxlQUFlLENBQUMsZUFBZSxVQUFVLE9BQU8sT0FBTyxNQUFNLFNBQVM7QUFHM0YsY0FBTSw0QkFBNEIsS0FBSyxzQkFBc0I7QUFBQSxVQUMzRCx1QkFBdUI7QUFBQSxRQUN6QjtBQUlBLGNBQU0saUJBQWlCLGVBQWU7QUFDdEMsY0FBTSx5QkFBeUIsaUJBQWlCLG9CQUFJLElBQW9CLElBQUk7QUFDNUUsY0FBTSxtQkFBbUIsaUJBQWlCLG9CQUFJLElBQTRCLElBQUk7QUFFOUUsaUJBQVMsYUFBYSxHQUFHLGFBQWEsY0FBYyxjQUFjO0FBQ2hFLGdCQUFNLDhCQUE4RSw0QkFDaEYsQ0FBQyxJQUNEO0FBQ0osY0FBSSxvQ0FBb0M7QUFDeEMscUJBQVcsT0FBTyxhQUFhO0FBQzdCLHVCQUFXLGNBQWMsSUFBSSxjQUFjO0FBQ3pDLG9CQUFNLGdCQUFnQixXQUFXO0FBQ2pDLGtCQUFJLHNCQUFzQixpRUFBd0IsSUFBSTtBQUN0RCxrQkFBSTtBQUNKLGtCQUFJLHdCQUF3QixRQUFXO0FBQ3JDLHNDQUFzQixLQUFLO0FBQzNCLDJCQUFXLDZCQUE2QjtBQUN4QyxnQ0FBZ0Isc0JBQXNCLGFBQWEsTUFBTSxVQUFVO0FBQ25FLG9CQUFJLDBCQUEwQixNQUFNO0FBQ2xDLHlDQUF1QixJQUFJLGVBQWUsbUJBQW1CO0FBQzdELG1DQUFrQixJQUFJLGVBQWUsYUFBYTtBQUFBLGdCQUNwRDtBQUFBLGNBQ0YsT0FBTztBQUNMLGdDQUFnQixpQkFBa0IsSUFBSSxhQUFhO0FBQUEsY0FDckQ7QUFFQSxvQkFBTSwyQkFBMkIsS0FBSywwQkFBMEI7QUFBQSxnQkFDOUQ7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxjQUNGLENBQUM7QUFDRCx3RkFBc0M7QUFDdEMsa0JBQUksK0JBQStCLFFBQVEsNEJBQTRCLFNBQVMsR0FBRztBQUNqRixxQkFBSyxtREFBbUQ7QUFBQSxrQkFDdEQ7QUFBQSxrQkFDQSxtQkFBbUI7QUFBQSxrQkFDbkI7QUFBQSxrQkFDQTtBQUFBLGdCQUNGLENBQUM7QUFBQSxjQUNIO0FBR0Esa0JBQUksZUFBZSxlQUFlLEdBQUc7QUFDbkMsaUZBQXdCLE9BQU87QUFDL0IscUVBQWtCLE9BQU87QUFDekIscUJBQUs7QUFBQSxjQUNQO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFDQSxjQUFJLGFBQWEsZUFBZSxLQUFLLG1DQUFtQztBQUd0RSxxQ0FBeUIsTUFBTTtBQUFBLFVBQ2pDO0FBQUEsUUFDRjtBQUNBLGlDQUF5QixNQUFNO0FBQUEsTUFDakMsT0FBTztBQUNMLFlBQ0UsQ0FBQyxLQUFLLGNBQWMsMEJBQ3BCLEtBQUssOEJBQThCLEtBQ25DLG1CQUFtQixlQUFlLElBQUksTUFBTSxLQUFLLHdDQUNqRCxnQkFBZ0IsNEJBQTRCLElBQUksTUFBTSxLQUFLLHFDQUMzRCxVQUFVLGtCQUFrQixNQUFNLEtBQUssd0JBQ3ZDLGVBQWUsZUFBZSxJQUFJLE1BQU0sS0FBSyxrQ0FDN0M7QUFFQSxnQkFBTSxtQkFBbUIsVUFBVSxNQUFNLFVBQVU7QUFDbkQscUJBQVcsZ0JBQWdCLGVBQWU7QUFDeEMsa0JBQU0saUJBQW1DLG9CQUFvQixrQkFBa0IsWUFBWTtBQUUzRixrQkFBTSw4QkFBK0IsZUFBdUIsZ0JBQWdCO0FBQzVFLGdCQUFJLDZCQUE2QjtBQUMvQiwwQ0FBNEI7QUFBQSxnQkFDMUIsaUJBQWlCLEtBQUs7QUFBQSxnQkFDdEIsWUFBWTtBQUFBLGdCQUNaLGNBQWM7QUFBQSxnQkFDZCxxQkFBcUIsS0FBSztBQUFBLGdCQUMxQixZQUFZO0FBQUEsZ0JBQ1osUUFBUTtBQUFBLGNBQ1YsQ0FBQztBQUFBLFlBQ0g7QUFFQSwyQkFBZSxRQUFRLE1BQU0sZ0JBQWdCLEtBQUs7QUFBQSxVQUNwRDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxVQUFVLGFBQWEsT0FBTztBQUloQyw0QkFBb0IscUNBQXFDLElBQUk7QUFBQSxNQUMvRDtBQUFBLElBQ0Y7QUFDQSxTQUFLLG9DQUFvQyxnQkFBZ0IsNEJBQTRCLElBQUk7QUFDekYsU0FBSywwQ0FBMEM7QUFDL0MsU0FBSyx1Q0FBdUMsbUJBQW1CLGVBQWUsSUFBSTtBQUNsRixTQUFLLHVCQUF1QixVQUFVLGtCQUFrQjtBQUN4RCxTQUFLLG1DQUFtQyxlQUFlLGVBQWUsSUFBSTtBQUFBLEVBQzVFO0FBQUEsRUFFUSwyQ0FBMkM7QUFoNEJyRDtBQWk0QkksZUFBVyxTQUFTLDBCQUEwQixHQUFHO0FBQy9DLGtCQUFNLGVBQU4sK0JBQW1CO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBQUEsRUFFUSxnQ0FBeUM7QUF0NEJuRDtBQXU0QkksZUFBVyxTQUFTLDBCQUEwQixHQUFHO0FBQy9DLFlBQUksV0FBTSxZQUFOLCtCQUFnQixXQUFVLE1BQU07QUFDbEMsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLDRDQUE0QztBQS80QnREO0FBZzVCSSxlQUFXLFNBQVMsMEJBQTBCLEdBQUc7QUFDL0Msa0JBQU0sZ0JBQU4sK0JBQW9CO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBQUEsRUFFUSxpQ0FBaUM7QUFyNUIzQztBQXM1QkksZUFBVyxTQUFTLDBCQUEwQixHQUFHO0FBQy9DLGtCQUFNLFlBQU4sK0JBQWdCO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQUEsRUFFUSxjQUFjLGFBQTJCO0FBRS9DLFVBQU0sT0FBTyxLQUFLO0FBRWxCLFVBQU0sZ0JBQWdCLEtBQUssc0JBQXNCLGlCQUFpQjtBQUNsRSxVQUFNLHlCQUF5QixLQUFLLHNCQUFzQiwwQkFBMEI7QUFDcEYsZUFBVyxTQUFTLFVBQVUsZ0JBQWdCO0FBQzVDLFlBQU0sYUFBYSxNQUFNO0FBQ3pCLFlBQU0sbUJBQW1CLFVBQVUsVUFBVTtBQUM3QyxVQUFJLFVBQVUsYUFBYSxRQUFRO0FBRWpDLGFBQUssdUJBQXVCLElBQUksRUFBRSxtQkFBbUI7QUFFckQsYUFBSyxxQkFBcUIsT0FBTyxXQUFXO0FBQzVDLDhCQUFzQixrQkFBa0IsSUFBSTtBQUM1QyxtQkFBVyxPQUFPLGFBQWE7QUFDN0IscUJBQVcsZ0JBQWdCLHdCQUF3QjtBQUNqRCxrQkFBTSxpQkFBbUMsb0JBQW9CLGtCQUFrQixZQUFZO0FBQzNGLHVCQUFXLGNBQWMsSUFBSSxjQUFjO0FBQ3pDLGtCQUFJLE9BQU8sWUFBWSxhQUFhO0FBQ2xDLHdCQUFRLFVBQVUsS0FBSyxJQUFJLFVBQVUsS0FBSyxXQUFXLFVBQVUsR0FBRztBQUFBLGNBQ3BFO0FBQ0EseUJBQVcsWUFBWTtBQUV2QixtQkFBSyxnQkFBZ0IsV0FBVyxXQUFXO0FBRzNDLG1CQUFLLHFCQUFxQixVQUFVO0FBR3BDLG1CQUFLLDhCQUE4QixVQUFVO0FBRTdDLG1CQUFLLDZCQUE2QixVQUFVO0FBRTVDLGtCQUFJLGlCQUFpQix1QkFBdUIsMEJBQTBCO0FBRXBFLHFCQUFLLDBCQUEwQixpQkFBaUIsTUFBTSxVQUFVO0FBQUEsY0FDbEU7QUFFQSx5QkFBVyw2QkFBNkI7QUFDeEMsb0JBQU0sZ0JBQWdCLHNCQUFzQixhQUFhLE1BQU0sVUFBVTtBQUN6RSxrQkFBSSxXQUFXLFdBQVc7QUFDMUIsa0JBQUksVUFBVTtBQUNaLHNCQUFNLDhCQUErQixlQUF1QixnQkFBZ0I7QUFDNUUsb0JBQUksNkJBQTZCO0FBQy9CLHdCQUFNLG9CQUFvQiw0QkFBNEI7QUFBQSxvQkFDcEQsaUJBQWlCLEtBQUs7QUFBQSxvQkFDdEI7QUFBQSxvQkFDQSxjQUFjO0FBQUEsb0JBQ2QscUJBQXFCLEtBQUs7QUFBQSxvQkFDMUI7QUFBQSxvQkFDQSxZQUFZO0FBQUEsb0JBQ1osUUFBUTtBQUFBLGtCQUNWLENBQUM7QUFDRCw2QkFBVywyQkFBMkI7QUFBQSxnQkFDeEM7QUFBQSxjQUNGO0FBQ0Esa0JBQUksaUJBQWlCLHVCQUF1Qix5QkFBeUIsV0FBVyxTQUFTLFNBQVMsR0FBRztBQUNuRyxzQkFBTSwwQkFBMEIsS0FBSztBQUNyQyxzQkFBTSwyQkFBMkIsd0JBQXdCLHdDQUF3QztBQUNqRyx3Q0FBd0IsbUNBQW1DO0FBQzNELDJCQUFXLFVBQVUsV0FBVyxVQUFVO0FBQ3hDLHdCQUFNLHFCQUFxQixPQUFPLGtCQUFrQjtBQUNwRCxzQkFBSSxzQkFBc0IsTUFBTTtBQUM5Qix1Q0FBbUIsUUFBUTtBQUFBLGtCQUM3QjtBQUFBLGdCQUNGO0FBQ0Esd0NBQXdCLHFDQUFxQyx3QkFBd0I7QUFBQSxjQUN2RjtBQUNBLG1CQUFLO0FBRUwseUJBQVcsMkNBQTJDO0FBRXRELHlCQUFXLGFBQWE7QUFBQSxZQUMxQjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRixPQUFPO0FBQ0wsWUFDRSxLQUFLLDhCQUE4QixLQUNuQyxtQkFBbUIsZUFBZSxJQUFJLE1BQU0sS0FBSyx3Q0FDakQsZ0JBQWdCLDRCQUE0QixJQUFJLE1BQU0sS0FBSyxxQ0FDM0QsVUFBVSxrQkFBa0IsTUFBTSxLQUFLLHdCQUN2QyxlQUFlLGVBQWUsSUFBSSxNQUFNLEtBQUssa0NBQzdDO0FBQ0EscUJBQVcsZ0JBQWdCLGVBQWU7QUFDeEMsa0JBQU0saUJBQW1DLG9CQUFvQixrQkFBa0IsWUFBWTtBQUUzRixrQkFBTSw4QkFBK0IsZUFBdUIsZ0JBQWdCO0FBQzVFLGdCQUFJLDZCQUE2QjtBQUMvQiwwQ0FBNEI7QUFBQSxnQkFDMUIsaUJBQWlCLEtBQUs7QUFBQSxnQkFDdEIsWUFBWTtBQUFBLGdCQUNaLGNBQWM7QUFBQSxnQkFDZCxxQkFBcUIsS0FBSztBQUFBLGdCQUMxQixZQUFZO0FBQUEsZ0JBQ1osUUFBUTtBQUFBLGNBQ1YsQ0FBQztBQUFBLFlBQ0g7QUFFQSwyQkFBZSxRQUFRLE1BQU0sZ0JBQWdCLEtBQUs7QUFBQSxVQUNwRDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxVQUFVLGFBQWEsT0FBTztBQUloQyw0QkFBb0IscUNBQXFDLElBQUk7QUFBQSxNQUMvRDtBQUFBLElBQ0Y7QUFDQSxTQUFLLG9DQUFvQyxnQkFBZ0IsNEJBQTRCLElBQUk7QUFDekYsU0FBSywwQ0FBMEM7QUFDL0MsU0FBSyx1Q0FBdUMsbUJBQW1CLGVBQWUsSUFBSTtBQUNsRixTQUFLLHVCQUF1QixVQUFVLGtCQUFrQjtBQUN4RCxTQUFLLG1DQUFtQyxlQUFlLGVBQWUsSUFBSTtBQUFBLEVBQzVFO0FBQUEsRUFFQSxXQUFXLGNBQWM7QUFDdkIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsV0FBVyxxQkFBcUI7QUFDOUIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsV0FBVyxtQkFBbUI7QUFDNUIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsT0FBYyxhQUFhLFFBQWdCO0FBQ3pDLFVBQU0sZUFBZSxtQkFBbUIsUUFBUSxJQUFJO0FBQ3BELGlCQUFhLGFBQWEsRUFBRyxnQkFBZ0IsUUFBUSxjQUFjLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUM1RSxpQkFBYSxVQUFVLEVBQUUsT0FBTyxXQUFXO0FBQzNDLGlCQUFhLFVBQVUsRUFBRSxRQUFRO0FBQ2pDLGlCQUFhLFVBQVUsRUFBRSxPQUFPO0FBQ2hDLFVBQU0scUJBQXFCLE9BQU87QUFDbEMsVUFBTSxDQUFDLE9BQU8sTUFBTSxJQUFJLG1CQUFtQixjQUFjO0FBQ3pELGlCQUFhLFVBQVUsRUFBRSxPQUFPLFFBQVE7QUFDeEMsaUJBQWEsVUFBVSxFQUFFLE9BQU87QUFBQSxFQUNsQztBQUFBLEVBRVEsOEJBQThCLFlBQXdCO0FBQzVELFVBQU0sY0FBYyxLQUFLO0FBQ3pCLFVBQU0sY0FBYyxLQUFLO0FBQ3pCLFNBQUssRUFBQywyQ0FBYSxnQkFBZSxDQUFDLFdBQVcsa0JBQWtCLEVBQUMsMkNBQWEsY0FBYTtBQUN6RixNQUFDLEtBQUssMEJBQXNELFlBQVksTUFBTSxXQUFXLFlBQVksQ0FBQztBQUFBLElBQ3hHO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUVEsNkJBQTZCLFlBQXdCO0FBQzNELFVBQU0sY0FBYyxLQUFLO0FBQ3pCLFVBQU0sY0FBYyxLQUFLO0FBQ3pCLFVBQU0sYUFBYSxLQUFLO0FBQ3hCLFNBQUssRUFBQywyQ0FBYSxnQkFBZSxDQUFDLFdBQVcsa0JBQWtCLEVBQUMsMkNBQWEsY0FBYTtBQUN6RixpQkFBVyxlQUFlLFVBQVU7QUFBQSxJQUN0QyxPQUFPO0FBQ0wsaUJBQVcsZUFBZSxNQUFTO0FBQUEsSUFDckM7QUFBQSxFQUNGO0FBQUEsRUFFUSxxQkFBcUIsWUFBd0I7QUFDbkQsVUFBTSxjQUFjLEtBQUs7QUFDekIsVUFBTSxjQUFjLEtBQUs7QUFDekIsU0FBSSwyQ0FBYSxnQkFBZSxXQUFXLGVBQWU7QUFDeEQsWUFBTSxNQUFPLEtBQUssMEJBQXNEO0FBQ3hFLFlBQU0sS0FBSyxJQUFJLGNBQWM7QUFDN0IsU0FBRyxnQkFBZ0IsR0FBRyxhQUFhLFlBQVksV0FBWTtBQUFBLElBQzdELFdBQVcsMkNBQWEsYUFBYTtBQUNuQyxZQUFNLE1BQU8sS0FBSywwQkFBc0Q7QUFDeEUsWUFBTSxLQUFLLElBQUksY0FBYztBQUM3QixTQUFHLGdCQUFnQixHQUFHLGFBQWEsWUFBWSxXQUFZO0FBQUEsSUFDN0QsT0FBTztBQUNMLE1BQUMsS0FBSywwQkFBc0QsZ0JBQWdCLFdBQVcsZUFBZSxDQUFDO0FBQ3ZHLE1BQUMsS0FBSywwQkFBc0QsZUFBZSxVQUFVO0FBQUEsSUFDdkY7QUFBQSxFQUNGO0FBQUEsRUFFUSxrQkFBa0I7QUFDeEIsWUFBUTtBQUFBLE1BQ04sMkNBQTJDLFFBQVEsT0FBTyxnQkFBZ0IsUUFBUSxNQUFNLGNBQWMsS0FBSyxrQkFBa0IsR0FBRztBQUFBLE1BQ2hJO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQThCQSxPQUFlLGlDQUFpQztBQUM5Qyx3QkFBb0IsZ0NBQWdDLGtCQUFrQjtBQUN0RSx3QkFBb0IsZ0NBQWdDLG1CQUFtQjtBQUN2RSx3QkFBb0IsZ0NBQWdDLGFBQWE7QUFDakUsd0JBQW9CLGdDQUFnQyxxQkFBcUI7QUFDekUsd0JBQW9CLGdDQUFnQyxlQUFlO0FBQ25FLHdCQUFvQixnQ0FBZ0MsY0FBYztBQU1sRSx3QkFBb0IsZ0NBQWdDLGlCQUFpQjtBQUFBLEVBQ3ZFO0FBQUEsRUFFQSxhQUFvQixLQUFLLE1BQThDO0FBL29DekU7QUFncENJLFFBQ0UsS0FBSyxhQUFhLGdCQUFnQixRQUNsQyxLQUFLLGFBQWEsZ0JBQWdCLFVBQ2xDLEtBQUssYUFBYSxnQkFBZ0IsUUFDbEM7QUFDQSxZQUFNLFNBQVMsZ0JBQUssYUFBTCxtQkFBdUIsUUFBdkIsWUFBOEIsT0FBTyxLQUFLLFFBQVE7QUFDakUsWUFBTSxJQUFJO0FBQUEsUUFDUixpQ0FBaUMsS0FBSztBQUFBLE1BQ3hDO0FBQUEsSUFDRjtBQUVBLFFBQUksS0FBSyxhQUFhLGdCQUFnQixVQUFVLE9BQU8saUJBQWlCLGVBQWUsQ0FBQyxjQUFjO0FBQ3BHLFlBQU0sSUFBSSxNQUFNLDBGQUEwRjtBQUFBLElBQzVHO0FBQ0EsUUFBSSxLQUFLLGFBQWEsZ0JBQWdCLFVBQVUsT0FBTyxrQkFBa0IsZUFBZSxDQUFDLGVBQWU7QUFDdEcsWUFBTSxJQUFJLE1BQU0sMkZBQTJGO0FBQUEsSUFDN0c7QUFFQSxZQUFPLCtCQUErQjtBQUl0QyxVQUFNLGVBQ0gsVUFBSyxPQUFMLFlBQVcsUUFBTyxvQkFBc0IsTUFBTSxjQUFjLFlBQVksRUFBRSxXQUFXLElBQUksSUFBYztBQUUxRyxRQUFJLHdCQUE4QjtBQUNsQyxRQUFJO0FBQ0osUUFBSSxLQUFLLGFBQWEsZ0JBQWdCLFFBQVE7QUFXNUMsVUFBU0EsY0FBVCxTQUFvQixTQUF5QjtBQUMzQyxZQUFJLFFBQVMsU0FBUyxJQUFJLE9BQU8sR0FBRztBQUNsQyxtQkFBUyxLQUFLLE9BQU87QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFKUyx1QkFBQUE7QUFUVCxZQUFNLGNBQWMsWUFBWSxFQUFFLFdBQVcsUUFBUTtBQUVyRCxZQUFNLDJCQUNKLHdCQUF3Qiw0QkFBNEI7QUFDdEQsWUFBTSxlQUFlLGNBQWMsWUFBWSxFQUFFLFVBQVUsUUFBUTtBQUNuRSxZQUFNLDJCQUEyQixhQUFhO0FBQzlDLFlBQU0sVUFBVSxNQUFNLFVBQVUsSUFBSSxlQUFlLEVBQUUsY0FBYyxLQUFLLENBQUM7QUFDekUsWUFBTSxFQUFFLGVBQWUsNEJBQTRCLElBQUksUUFBUztBQUNoRSxZQUFNLFdBQTZCLENBQUM7QUFNcEMsTUFBQUEsWUFBVyxvQkFBb0I7QUFDL0IsTUFBQUEsWUFBVywwQkFBMEI7QUFDckMsTUFBQUEsWUFBVyx3QkFBd0I7QUFDbkMsTUFBQUEsWUFBVywwQkFBMEI7QUFDckMsTUFBQUEsWUFBVywwQkFBMEI7QUFFckMsTUFBQUEsWUFBVyxpQkFBaUI7QUFFNUIsWUFBTSxTQUFTLE1BQU0sUUFBUyxjQUFjO0FBQUEsUUFDMUMsa0JBQWtCO0FBQUEsUUFDbEIsZ0JBQWdCO0FBQUEsVUFDZDtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQ0QsOEJBQXdCO0FBQ3hCLFlBQU0sc0JBQXNCLElBQUkseUJBQXlCLEtBQUssUUFBUSxTQUFVLE1BQU07QUFDdEYsK0JBQXlCLHVCQUF1QixtQkFBbUI7QUFDbkUsK0JBQXlCLDJCQUEyQjtBQUNwRCwrQkFBeUIsdUNBQXVDO0FBQ2hFLGdDQUEwQjtBQUFBLElBQzVCLFdBQVcsS0FBSyxhQUFhLGdCQUFnQixRQUFRO0FBRW5ELFlBQU0sY0FBYyxZQUFZLEVBQUUsV0FBVyxPQUFPO0FBRXBELGdDQUEwQix3QkFBd0IsMkJBQTJCO0FBQzdFLE1BQUMsd0JBQW9EO0FBQUEsU0FDbkQsVUFBSyxXQUFMLFlBQWUsSUFBSSxPQUFPO0FBQUEsUUFDMUIsS0FBSztBQUFBLFFBQ0w7QUFBQSxRQUNBLEtBQUs7QUFBQSxNQUNQO0FBQ0EsTUFBQyx3QkFBb0QsZ0JBQWdCLElBQUk7QUFDekUsOEJBQ0csd0JBQW9ELDJCQUE0QixrQkFBa0IsS0FBSyxJQUN4RyxJQUNBO0FBQUEsSUFDSixPQUFPO0FBQ0wsOEJBQXdCLFFBQVEsSUFBSSxJQUFlO0FBQUEsSUFDckQ7QUFFQSxVQUFNLFNBQVMsSUFBSSxRQUFPLEtBQUssVUFBVSx5QkFBMEIsdUJBQXVCLEtBQUssUUFBUSxVQUFVO0FBQ2pILFdBQU8sY0FBYyx5QkFBeUIsS0FBSztBQUNuRCxXQUFPLFNBQVMsa0JBQWlCLFlBQU8sU0FBUyxtQkFBaEIsWUFBa0MsS0FBSztBQUN4RSxRQUFJLEtBQUssYUFBYSxnQkFBZ0IsUUFBUTtBQUM1QyxhQUFPLDZCQUE2QjtBQUFBLElBQ3RDO0FBQ0EsUUFBSSxLQUFLLGFBQWEsZ0JBQWdCLFFBQVE7QUFDNUMsYUFBTyw0QkFBNEI7QUFBQSxJQUNyQztBQUNBLFdBQU8sNEJBQTRCO0FBRW5DLFFBQUksS0FBSyw2QkFBNkIsTUFBTTtBQUMxQyxhQUFPLGdCQUFnQjtBQUFBLElBQ3pCO0FBRUEsVUFBTSx1QkFBdUIsT0FBTztBQUNwQyx5QkFBcUIsV0FBVyxLQUFLLFFBQVE7QUFFN0MsUUFBSSxLQUFLLFVBQVUsUUFBUSxLQUFLLGFBQWEsZ0JBQWdCLFFBQVE7QUFFbkUsV0FBSyxPQUFPO0FBQUEsUUFDVjtBQUFBLFNBQ0MsQ0FBQyxVQUFpQjtBQUVqQixnQkFBTSxlQUFlO0FBQ3JCLGlCQUFPLGVBQWU7QUFDdEIsaUJBQU8sT0FBTyxNQUFNLDhCQUE4QjtBQUFBLFFBQ3BELEdBQUcsS0FBSyxJQUFJO0FBQUEsTUFDZDtBQUVBLFdBQUssT0FBTyxpQkFBaUIsd0JBQXdCLE1BQU07QUFHekQsZUFBTyxPQUFPLE1BQU0seUJBQXlCO0FBRzdDLGVBQU8sa0JBQWtCO0FBQUEsTUFDM0IsQ0FBQztBQUFBLElBQ0g7QUFFQSxXQUFPLGtCQUFrQixNQUFNLGNBQWMsS0FBSyxNQUFNO0FBRXhELFdBQU8sY0FBYyxzQkFBc0IsS0FBSyxVQUFVLE9BQU8sS0FBSyxPQUFPLFFBQVEsS0FBSyxPQUFPLFNBQVM7QUFFMUcsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLElBQVcsa0JBQWtCO0FBQzNCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQSxFQUVPLGFBQWEsT0FBZSxRQUFnQjtBQUNqRCxVQUFNLE9BQU8sS0FBSztBQUNsQixTQUFLLGFBQWEsT0FBTyxNQUFNO0FBQy9CLFNBQUssY0FBYyxzQkFBc0IsUUFBUTtBQUFBLEVBQ25EO0FBQUEsRUFFTyxnQkFBZ0I7QUFDckIsVUFBTSxPQUFPLEtBQUs7QUFDbEIsV0FBTyxLQUFLLGNBQWM7QUFBQSxFQUM1QjtBQUFBLEVBRU8sZ0NBQWdDO0FBQ3JDLFdBQVEsS0FBSywwQkFBc0Q7QUFBQSxFQUNyRTtBQUFBLEVBRUEsSUFBVyxtQkFBbUI7QUFDNUIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsSUFBVyxzQkFBc0I7QUFDL0IsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsSUFBVywwQkFBMEI7QUFDbkMsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLGNBQTJCO0FBQ3BDLFFBQUksS0FBSyxpQkFBaUIsTUFBTTtBQUM5QixZQUFNLElBQUksTUFBTSxRQUFPLHFCQUFxQjtBQUFBLElBQzlDO0FBQ0EsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFXLGNBQTJCO0FBQ3BDLFFBQUksS0FBSyxpQkFBaUIsTUFBTTtBQUM5QixZQUFNLElBQUksTUFBTSxRQUFPLHFCQUFxQjtBQUFBLElBQzlDO0FBQ0EsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUEsRUFHQSxJQUFXLGNBQXVCO0FBQ2hDLFdBQU8sS0FBSyxpQkFBaUI7QUFBQSxFQUMvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLElBQVcsd0JBQWlEO0FBQzFELFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBVyx3QkFBaUQ7QUFDMUQsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBY0EsTUFBYSxXQUFpQztBQUM1QyxRQUFJLEtBQUssaUJBQWlCLE1BQU07QUFDOUIsWUFBTSxhQUFjLE1BQU0sY0FBYyxZQUFZLEVBQUUsV0FBVyxJQUFJO0FBQ3JFLFVBQUksS0FBSyxpQkFBaUIsTUFBTTtBQUM5QixhQUFLLGdCQUFnQixVQUFVO0FBQUEsTUFDakM7QUFBQSxJQUNGO0FBQ0EsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRVEsZ0JBQWdCLFlBQWtCO0FBQ3hDLFNBQUssZ0JBQWdCLFdBQVcsWUFBWSxLQUFLLElBQUk7QUFDckQsU0FBSyxnQkFBZ0IsV0FBVyxZQUFZLEtBQUssSUFBSTtBQUFBLEVBQ3ZEO0FBQUEsRUFNQSxJQUFXLGdCQUFnQjtBQUN6QixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLHVCQUF1QjtBQUNoQyxXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxJQUFXLHFCQUFxQjtBQUM5QixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLHFCQUFxQjtBQUM5QixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLDBCQUEwQjtBQUNuQyxXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLDBCQUEwQjtBQUNuQyxXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLDJCQUEyQjtBQUNwQyxXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLGdCQUFnQjtBQUN6QixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFXLGNBQWM7QUFDdkIsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBLEVBRUEsSUFBVyxTQUFTO0FBQ2xCLFdBQU8sS0FBSztBQUFBLEVBQ2Q7QUFBQSxFQUVBLElBQVcsU0FBUztBQUNsQixXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFXLHFCQUEwQztBQUNuRCxXQUFPLEtBQUs7QUFBQSxFQUNkO0FBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBajFDYSxRQXNCSixtQkFBbUI7QUF0QmYsUUF5Q0ksWUFBb0Msb0JBQUksSUFBSTtBQXpDaEQsUUEwQ0ksZ0JBQWdCO0FBMUNwQixRQXF4Q2Esd0JBQ3RCO0FBdHhDRyxJQUFNLFNBQU47IiwKICAibmFtZXMiOiBbImFkZEZlYXR1cmUiXQp9Cg==
