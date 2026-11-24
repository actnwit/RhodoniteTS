// src/foundation/system/Engine.ts
import { VERSION } from "../../version.js";
import { AnimationComponent } from "../components/Animation/AnimationComponent.js";
import { AnimationStateRepository } from "../components/Animation/AnimationStateRepository.js";
import { CameraComponent } from "../components/Camera/CameraComponent.js";
import { createCameraEntity } from "../components/Camera/createCameraEntity.js";
import { CameraControllerComponent } from "../components/CameraController/CameraControllerComponent.js";
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
    this.__lastCameraControllerComponentsUpdateCount = -1;
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
    AnimationStateRepository._cleanupForEngine(this);
    AnimationComponent._cleanupForEngine(this);
    TransformComponent._cleanupForEngine(this);
    SceneGraphComponent._cleanupForEngine(this);
    CameraControllerComponent._cleanupForEngine(this);
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
    this.__lastCameraControllerComponentsUpdateCount = -1;
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
    AnimationStateRepository.beginProcessFrame(this);
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
        if (!this.__engineState.webgpuRenderBundleMode || AnimationComponent.getIsAnimating(this) || TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount || CameraControllerComponent.getUpdateCount(this) !== this.__lastCameraControllerComponentsUpdateCount || Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount || LightComponent.getUpdateCount(this) !== this.__lastLightComponentsUpdateCount) {
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
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this);
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this);
    this.__lastPrimitiveCount = Primitive.getPrimitiveCount();
    this.__lastLightComponentsUpdateCount = LightComponent.getUpdateCount(this);
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
        if (AnimationComponent.getIsAnimating(this) || TransformComponent.getUpdateCount(this) !== this.__lastTransformComponentsUpdateCount || CameraComponent.getCurrentCameraUpdateCount(this) !== this.__lastCameraComponentsUpdateCount || CameraControllerComponent.getUpdateCount(this) !== this.__lastCameraControllerComponentsUpdateCount || Primitive.getPrimitiveCount() !== this.__lastPrimitiveCount || LightComponent.getUpdateCount(this) !== this.__lastLightComponentsUpdateCount) {
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
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this);
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
    ComponentRepository._ensureComponentClassRegistered(CameraControllerComponent);
    ComponentRepository._ensureComponentClassRegistered(LightComponent);
    ComponentRepository._ensureComponentClassRegistered(AnimationComponent);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBFZmZla3NlZXJDb21wb25lbnQgfSBmcm9tICcuLi8uLi9lZmZla3NlZXIvRWZmZWtzZWVyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQnl0ZSwgSW5kZXgsIE9iamVjdFVJRCwgUHJpbWl0aXZlVUlEIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uLy4uL3ZlcnNpb24nO1xuaW1wb3J0IHR5cGUgeyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgV2ViR3B1RGV2aWNlV3JhcHBlciB9IGZyb20gJy4uLy4uL3dlYmdwdS9XZWJHcHVEZXZpY2VXcmFwcGVyJztcbmltcG9ydCB0eXBlIHsgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vd2ViZ3B1L1dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IFJuWFIgfSBmcm9tICcuLi8uLi94ci9tYWluJztcbmltcG9ydCB7IEFuaW1hdGlvbkNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQW5pbWF0aW9uL0FuaW1hdGlvbkNvbXBvbmVudCc7XG5pbXBvcnQgeyBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkgfSBmcm9tICcuLi9jb21wb25lbnRzL0FuaW1hdGlvbi9BbmltYXRpb25TdGF0ZVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB7IGNyZWF0ZUNhbWVyYUVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL2NyZWF0ZUNhbWVyYUVudGl0eSc7XG5pbXBvcnQgeyBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9DYW1lcmFDb250cm9sbGVyL0NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQnO1xuaW1wb3J0IHsgTGlnaHRDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0xpZ2h0L0xpZ2h0Q29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgeyBNZXNoUmVuZGVyZXJDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9NZXNoUmVuZGVyZXJDb21wb25lbnQnO1xuaW1wb3J0IHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFNrZWxldGFsQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudCc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBDb21wb25lbnRNZW1vcnlSZWdpc3RyeSB9IGZyb20gJy4uL2NvcmUvQ29tcG9uZW50TWVtb3J5UmVnaXN0cnknO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvQ29tcG9uZW50UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDb25maWcgfSBmcm9tICcuLi9jb3JlL0NvbmZpZyc7XG5pbXBvcnQgeyBFbnRpdHlSZXBvc2l0b3J5IH0gZnJvbSAnLi4vY29yZS9FbnRpdHlSZXBvc2l0b3J5JztcbmltcG9ydCB7IEdsb2JhbERhdGFSZXBvc2l0b3J5IH0gZnJvbSAnLi4vY29yZS9HbG9iYWxEYXRhUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1vcnlNYW5hZ2VyIH0gZnJvbSAnLi4vY29yZS9NZW1vcnlNYW5hZ2VyJztcbmltcG9ydCB7IENhbWVyYVR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9DYW1lcmFUeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCwgdHlwZSBQcm9jZXNzQXBwcm9hY2hFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB7IFByb2Nlc3NTdGFnZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHR5cGUgeyBJU2NlbmVHcmFwaEVudGl0eSB9IGZyb20gJy4uL2hlbHBlcnMvRW50aXR5SGVscGVyJztcbmltcG9ydCB7IER1bW15VGV4dHVyZXMgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9EdW1teVRleHR1cmVzJztcbmltcG9ydCB0eXBlIHsgU2NhbGFyIH0gZnJvbSAnLi4vbWF0aC9TY2FsYXInO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9WZWN0b3I0JztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgeyBUaW1lIH0gZnJvbSAnLi4vbWlzYy9UaW1lJztcbmltcG9ydCB7IF9nZXRQaHlzaWNzQmFja2VuZCB9IGZyb20gJy4uL3BoeXNpY3MvUGh5c2ljc0JhY2tlbmQnO1xuaW1wb3J0IHsgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnksIHR5cGUgSUNHQVBJUmVzb3VyY2VSZXBvc2l0b3J5IH0gZnJvbSAnLi4vcmVuZGVyZXIvQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRXhwcmVzc2lvbiB9IGZyb20gJy4uL3JlbmRlcmVyL0V4cHJlc3Npb24nO1xuaW1wb3J0IHsgRnJhbWUgfSBmcm9tICcuLi9yZW5kZXJlci9GcmFtZSc7XG5pbXBvcnQgeyBMaWdodENsdXN0ZXJTeXN0ZW0gfSBmcm9tICcuLi9yZW5kZXJlci9saWdodENsdXN0ZXIvTGlnaHRDbHVzdGVyU3lzdGVtJztcbmltcG9ydCB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB7IEVuZ2luZVN0YXRlIH0gZnJvbSAnLi9FbmdpbmVTdGF0ZSc7XG5pbXBvcnQgeyBNb2R1bGVNYW5hZ2VyIH0gZnJvbSAnLi9Nb2R1bGVNYW5hZ2VyJztcblxuZGVjbGFyZSBjb25zdCBzcGVjdG9yOiBhbnk7XG5cbmltcG9ydCB7IFdlYkdMR3B1VGltZXIgfSBmcm9tICcuLi8uLi93ZWJnbC9XZWJHTEdwdVRpbWVyJztcbmltcG9ydCB7IF9jbGVhbnVwV2ViR0xTdGF0ZXNDYWNoZUZvckVuZ2luZSB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMU3RyYXRlZ3lDb21tb25NZXRob2QnO1xuaW1wb3J0IHR5cGUgeyBXZWJBUlN5c3RlbSB9IGZyb20gJy4uLy4uL3hyL1dlYkFSU3lzdGVtJztcbmltcG9ydCB0eXBlIHsgV2ViWFJTeXN0ZW0gfSBmcm9tICcuLi8uLi94ci9XZWJYUlN5c3RlbSc7XG5pbXBvcnQgeyBSbk9iamVjdCB9IGZyb20gJy4uL2NvcmUvUm5PYmplY3QnO1xuaW1wb3J0IHsgX2NsZWFudXBHaXptb3NGb3JFbmdpbmUgfSBmcm9tICcuLi9naXptb3MvR2l6bW9SZWdpc3RyeSc7XG5pbXBvcnQgeyBfY2xlYW51cFJlbmRlclBhc3NIZWxwZXJGb3JFbmdpbmUgfSBmcm9tICcuLi9oZWxwZXJzL1JlbmRlclBhc3NIZWxwZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9BYnN0cmFjdE1hdGVyaWFsQ29udGVudCc7XG5pbXBvcnQgeyBNYXRlcmlhbFJlcG9zaXRvcnkgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbFJlcG9zaXRvcnknO1xuXG50eXBlIFdlYkdQVUV4dGVybmFsUmVuZGVyUGFzc09wdGlvbnMgPSB7IGNvbG9yRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDsgZGVwdGhGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0IH07XG5cbnR5cGUgRGVmZXJyZWRFZmZla3NlZXJXZWJHUFVSZW5kZXJKb2IgPSB7XG4gIHJlbmRlclBhc3M6IFJlbmRlclBhc3M7XG4gIGRpc3BsYXlJZHg6IG51bWJlcjtcbiAgcmVuZGVyUGFzc09wdGlvbnM/OiBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zO1xuICBlZmZla3NlZXJDb21wb25lbnRzOiBFZmZla3NlZXJDb21wb25lbnRbXTtcbn07XG5cbi8qKlxuICogVGhlIGFyZ3VtZW50IHR5cGUgZm9yIEVuZ2luZS5pbml0KCkgbWV0aG9kLlxuICovXG5pbnRlcmZhY2UgRW5naW5lSW5pdERlc2NyaXB0aW9uIHtcbiAgYXBwcm9hY2g6IFByb2Nlc3NBcHByb2FjaEVudW07XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIHdlYmdsT3B0aW9uPzogV2ViR0xDb250ZXh0QXR0cmlidXRlcztcbiAgbm90VG9EaXNwbGF5Um5JbmZvQXRJbml0PzogYm9vbGVhbjtcbiAgY29uZmlnPzogQ29uZmlnO1xuICAvKipcbiAgICogTG9hZHMgdGhlIFdlYlhSL1dlYkFSIHN1cHBvcnQgKGBlbmdpbmUud2ViWFJTeXN0ZW1gLCBgZW5naW5lLndlYkFSU3lzdGVtYCkgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgKiBEZWZhdWx0cyB0byBmYWxzZSBmb3IgbmFtZWQgaW1wb3J0cywgYW5kIHRvIHRydWUgd2hlbiB0aGUgZGVmYXVsdCBgUm5gIG5hbWVzcGFjZSBleHBvcnQgaXMgdXNlZC5cbiAgICogSXQgY2FuIGFsc28gYmUgZW5hYmxlZCBsYXRlciB3aXRoIGBhd2FpdCBlbmdpbmUuZW5hYmxlWFIoKWAuXG4gICAqL1xuICB4cj86IGJvb2xlYW47XG59XG5cbi8qKlxuICogVGhlIHN5c3RlbSBjbGFzcyBpcyB0aGUgZW50cnkgcG9pbnQgb2YgdGhlIFJob2Rvbml0ZSBsaWJyYXJ5LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIGNvbnN0IGVuZ2luZSA9IGF3YWl0IFJuLkVuZ2luZS5pbml0KHtcbiAqICAgYXBwcm9hY2g6IFJuLlByb2Nlc3NBcHByb2FjaC5XZWJHTDIsXG4gKiAgIGNhbnZhczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmxkJykgYXMgSFRNTENhbnZhc0VsZW1lbnQsXG4gKiB9KTtcbiAqXG4gKiAuLi4gKGNyZWF0ZSBzb21ldGhpbmcpIC4uLlxuICpcbiAqIGVuZ2luZS5zdGFydFJlbmRlckxvb3AoKHRpbWUsIF9teUFyZzEsIF9teUFyZzIpID0+IHtcbiAqICAgUm4uRW5naW5lLnByb2Nlc3MoW2V4cHJlc3Npb25dKTtcbiAqIH0sIG15QXJnMSwgbXlBcmcyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgRW5naW5lIGV4dGVuZHMgUm5PYmplY3Qge1xuICBwcml2YXRlIF9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvPzogRXhwcmVzc2lvbjtcbiAgcHJpdmF0ZSBfX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0bz86IFJlbmRlclBhc3M7XG4gIHByaXZhdGUgX19wcm9jZXNzQXBwcm9hY2g6IFByb2Nlc3NBcHByb2FjaEVudW0gPSBQcm9jZXNzQXBwcm9hY2guTm9uZTtcbiAgcHJpdmF0ZSBfX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5OiBJQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnk7XG4gIHByaXZhdGUgX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeT86IFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5PzogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fZW5naW5lU3RhdGUgPSBuZXcgRW5naW5lU3RhdGUoKTtcbiAgcHJpdmF0ZSBfX3JlbmRlclBhc3NUaWNrQ291bnQgPSAwO1xuICBwcml2YXRlIF9fYW5pbWF0aW9uRnJhbWVJZCA9IC0xO1xuICAvKiogVGhlIG9iamVjdCAoV2luZG93IG9yIFhSU2Vzc2lvbikgdGhhdCBvd25zIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBmcmFtZSBjYWxsYmFjay4gKi9cbiAgcHJpdmF0ZSBfX2FuaW1hdGlvbkZyYW1lT2JqZWN0PzogV2luZG93IHwgWFJTZXNzaW9uO1xuXG4gIHByaXZhdGUgX19yZW5kZXJMb29wRnVuYz86ICh0aW1lOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuICBwcml2YXRlIF9fYXJnczogdW5rbm93bltdID0gW107XG4gIHByaXZhdGUgX193ZWJYUlN5c3RlbT86IFdlYlhSU3lzdGVtO1xuICBwcml2YXRlIF9fd2ViQVJTeXN0ZW0/OiBXZWJBUlN5c3RlbTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgYEVuZ2luZS5pbml0YCBsb2FkcyB0aGUgWFIgc3VwcG9ydCB3aGVuIGBFbmdpbmVJbml0RGVzY3JpcHRpb24ueHJgIGlzIG9taXR0ZWQuXG4gICAqIFRoZSBkZWZhdWx0IGBSbmAgbmFtZXNwYWNlIGV4cG9ydCBzZXRzIGl0IHRvIHRydWUgZm9yIGNvbXBhdGliaWxpdHkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkWFJCeURlZmF1bHQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2VudGl0eVJlcG9zaXRvcnk6IEVudGl0eVJlcG9zaXRvcnk7XG4gIHByaXZhdGUgX19jb21wb25lbnRSZXBvc2l0b3J5OiBDb21wb25lbnRSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fY29tcG9uZW50TWVtb3J5UmVnaXN0cnk6IENvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5O1xuICBwcml2YXRlIF9fbWVtb3J5TWFuYWdlcj86IE1lbW9yeU1hbmFnZXI7XG4gIHByaXZhdGUgX19tYXRlcmlhbFJlcG9zaXRvcnk6IE1hdGVyaWFsUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX2dsb2JhbERhdGFSZXBvc2l0b3J5OiBHbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX2xpZ2h0Q2x1c3RlclN5c3RlbTogTGlnaHRDbHVzdGVyU3lzdGVtO1xuICBwcml2YXRlIF9fY29uZmlnOiBDb25maWc7XG4gIHByaXZhdGUgX19sb2dnZXI6IExvZ2dlcjtcbiAgcHJpdmF0ZSBfX2R1bW15VGV4dHVyZXM/OiBEdW1teVRleHR1cmVzO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RQcmltaXRpdmVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIC8qKiBTaGFkZXIgcHJvZ3JhbSBjYWNoZSBtYXAgZm9yIHRoaXMgZW5naW5lIGluc3RhbmNlLiBNYXBzIHNoYWRlciB0ZXh0IHRvIHByb2dyYW0gVUlEcy4gKi9cbiAgcHJpdmF0ZSBfX3NoYWRlclByb2dyYW1DYWNoZTogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2dwdVRpbWVyRW5hYmxlZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fd2ViZ2xHcHVUaW1lcj86IFdlYkdMR3B1VGltZXI7XG4gIHByaXZhdGUgc3RhdGljIF9fZW5naW5lczogTWFwPE9iamVjdFVJRCwgRW5naW5lPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19lbmdpbmVDb3VudCA9IDA7XG4gIHByaXZhdGUgX19lbmdpbmVVaWQ6IEluZGV4ID0gLTE7XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICBwcm9jZXNzQXBwcm9hY2g6IFByb2Nlc3NBcHByb2FjaEVudW0sXG4gICAgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk6IElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICBtYXhHUFVEYXRhU3RvcmFnZVNpemU6IEJ5dGUsXG4gICAgY29uZmlnPzogQ29uZmlnLFxuICAgIHJuWFJNb2R1bGU/OiBSblhSXG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2NvbmZpZyA9IGNvbmZpZyA/PyBuZXcgQ29uZmlnKCk7XG4gICAgdGhpcy5fX2xvZ2dlciA9IG5ldyBMb2dnZXIoKTtcbiAgICB0aGlzLl9fbG9nZ2VyLmxvZ0xldmVsID0gdGhpcy5fX2NvbmZpZy5sb2dMZXZlbDtcbiAgICB0aGlzLl9fZW5naW5lVWlkID0gRW5naW5lLl9fZW5naW5lQ291bnQ7XG4gICAgdGhpcy5fX3Byb2Nlc3NBcHByb2FjaCA9IHByb2Nlc3NBcHByb2FjaDtcbiAgICB0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB0aGlzLl9fY29tcG9uZW50TWVtb3J5UmVnaXN0cnkgPSBuZXcgQ29tcG9uZW50TWVtb3J5UmVnaXN0cnkoKTtcbiAgICB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeSA9IG5ldyBDb21wb25lbnRSZXBvc2l0b3J5KHRoaXMpO1xuICAgIHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5ID0gbmV3IEVudGl0eVJlcG9zaXRvcnkodGhpcyk7XG4gICAgdGhpcy5fX21hdGVyaWFsUmVwb3NpdG9yeSA9IG5ldyBNYXRlcmlhbFJlcG9zaXRvcnkoKTtcbiAgICB0aGlzLl9fbWVtb3J5TWFuYWdlciA9IE1lbW9yeU1hbmFnZXIuY3JlYXRlSW5zdGFuY2VJZk5vdENyZWF0ZWQodGhpcywgbWF4R1BVRGF0YVN0b3JhZ2VTaXplKTtcbiAgICAvLyBUaGUgWFIgc3lzdGVtcyBjcmVhdGUgdGhlaXIgdmlld2VyIGFuZCBjYW1lcmEgZW50aXRpZXMsIHNvIHRoZXkgYXJlIGluaXRpYWxpemVkIGF0IHRoZSBzYW1lIHBvaW50IGFzXG4gICAgLy8gYmVmb3JlIHRoZSBYUiBzdXBwb3J0IGJlY2FtZSBvcHRpb25hbDsgZW50aXR5IGFuZCBjb21wb25lbnQgSURzIHN0YXkgdW5jaGFuZ2VkIHdoZW4gaXQgaXMgZW5hYmxlZC5cbiAgICBpZiAocm5YUk1vZHVsZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9faW5pdFhSU3lzdGVtcyhyblhSTW9kdWxlKTtcbiAgICB9XG4gICAgdGhpcy5fX2dsb2JhbERhdGFSZXBvc2l0b3J5ID0gR2xvYmFsRGF0YVJlcG9zaXRvcnkuaW5pdCh0aGlzKTtcbiAgICB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtID0gbmV3IExpZ2h0Q2x1c3RlclN5c3RlbSh0aGlzKTtcbiAgICBFbmdpbmUuX19lbmdpbmVDb3VudCsrO1xuICB9XG5cbiAgcHVibGljIGdldCBlbmdpbmVVaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmVVaWQ7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGdldEVuZ2luZShvYmplY3RVaWQ6IE9iamVjdFVJRCkge1xuICAgIGNvbnN0IGVuZ2luZSA9IEVuZ2luZS5fX2VuZ2luZXMuZ2V0KG9iamVjdFVpZCk7XG4gICAgaWYgKElzLm5vdC5leGlzdChlbmdpbmUpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZW5naW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBlbmdpbmUgYW5kIHJlbGVhc2VzIGFsbCBhc3NvY2lhdGVkIHJlc291cmNlcy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBtZXRob2QgcGVyZm9ybXMgYSBjb21wcmVoZW5zaXZlIGNsZWFudXAgb2YgYWxsIGVuZ2luZSByZXNvdXJjZXMgaW5jbHVkaW5nOlxuICAgKiAtIFN0b3BwaW5nIHRoZSByZW5kZXIgbG9vcFxuICAgKiAtIERlbGV0aW5nIGFsbCBlbnRpdGllcyBhbmQgdGhlaXIgY29tcG9uZW50c1xuICAgKiAtIERlc3Ryb3lpbmcgYWxsIHRleHR1cmVzIChpbmNsdWRpbmcgZHVtbXkgdGV4dHVyZXMpXG4gICAqIC0gQ2xlYXJpbmcgbWF0ZXJpYWwgcmVwb3NpdG9yeSBkYXRhXG4gICAqIC0gUmVsZWFzaW5nIEdQVSByZXNvdXJjZXMgKFdlYkdML1dlYkdQVSlcbiAgICogLSBDbGVhcmluZyBtZW1vcnkgbWFuYWdlciBidWZmZXJzXG4gICAqXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHRoZSBlbmdpbmUgaW5zdGFuY2Ugc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGVuZ2luZSA9IGF3YWl0IFJuLkVuZ2luZS5pbml0KHsgLi4uIH0pO1xuICAgKiAvLyAuLi4gdXNlIHRoZSBlbmdpbmUgLi4uXG4gICAqIGVuZ2luZS5kZXN0cm95KCk7IC8vIENsZWFuIHVwIGFsbCByZXNvdXJjZXNcbiAgICogYGBgXG4gICAqL1xuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGVuZ2luZSBhbmQgcmVsZWFzZXMgYWxsIGFzc29jaWF0ZWQgcmVzb3VyY2VzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyBhIGNvbXByZWhlbnNpdmUgY2xlYW51cCBvZiBhbGwgZW5naW5lIHJlc291cmNlcyBpbmNsdWRpbmc6XG4gICAqIC0gU3RvcHBpbmcgdGhlIHJlbmRlciBsb29wXG4gICAqIC0gSW52YWxpZGF0aW5nIGFsbCBzaGFkZXIgY2FjaGVzIGluIG1hdGVyaWFsc1xuICAgKiAtIERlbGV0aW5nIGFsbCBlbnRpdGllcyBhbmQgdGhlaXIgY29tcG9uZW50c1xuICAgKiAtIERlc3Ryb3lpbmcgYWxsIHRleHR1cmVzIChpbmNsdWRpbmcgZHVtbXkgdGV4dHVyZXMpXG4gICAqIC0gQ2xlYXJpbmcgbWF0ZXJpYWwgcmVwb3NpdG9yeSBkYXRhXG4gICAqIC0gUmVsZWFzaW5nIEdQVSByZXNvdXJjZXMgKFdlYkdML1dlYkdQVSlcbiAgICogLSBDbGVhcmluZyBtZW1vcnkgbWFuYWdlciBidWZmZXJzXG4gICAqXG4gICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHRoZSBlbmdpbmUgaW5zdGFuY2Ugc2hvdWxkIG5vdCBiZSB1c2VkLlxuICAgKi9cbiAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5zdG9wUmVuZGVyTG9vcCgpO1xuICAgIHRoaXMuX19yZW5kZXJMb29wRnVuYyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fYXJncyA9IFtdO1xuICAgIHRoaXMuX19kZXN0cm95UmVzb3VyY2VzKCk7XG4gIH1cblxuICAvKipcbiAgICogSW50ZXJuYWwgbWV0aG9kIHRoYXQgcGVyZm9ybXMgdGhlIGFjdHVhbCByZXNvdXJjZSBjbGVhbnVwLlxuICAgKiBDYWxsZWQgYWZ0ZXIgdGhlIHJlbmRlciBsb29wIGhhcyBmdWxseSBzdG9wcGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2Rlc3Ryb3lSZXNvdXJjZXMoKTogdm9pZCB7XG4gICAgLy8gSW52YWxpZGF0ZSBhbGwgc2hhZGVyIGNhY2hlcyBpbiBtYXRlcmlhbHMgYmVmb3JlIGRlbGV0aW5nIGVudGl0aWVzXG4gICAgLy8gVGhpcyBlbnN1cmVzIHNoYWRlcnMgd2lsbCBiZSByZWNvbXBpbGVkIHdpdGggbmV3IFdlYkdMIHJlc291cmNlcyBvbiBuZXh0IGVuZ2luZSBpbml0XG4gICAgdGhpcy5fX21hdGVyaWFsUmVwb3NpdG9yeS5fbWFrZVNoYWRlckludmFsaWRhdGVUb0FsbE1hdGVyaWFscygpO1xuXG4gICAgLy8gRGVsZXRlIGFsbCBlbnRpdGllcyAodGhpcyBhbHNvIGNsZWFucyB1cCBhbGwgY29tcG9uZW50cylcbiAgICBjb25zdCBlbnRpdGllcyA9IHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5Ll9nZXRFbnRpdGllcygpO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeS5kZWxldGVFbnRpdHkoZW50aXR5LmVudGl0eVVJRCk7XG4gICAgfVxuXG4gICAgLy8gRGVzdHJveSBkdW1teSB0ZXh0dXJlc1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fZHVtbXlUZXh0dXJlcykpIHtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVzLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVzID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIENsZWFyIFdlYkdQVSBjYWNoZSBhbmQgdW5jb25maWd1cmUgY29udGV4dCBpZiB1c2luZyBXZWJHUFVcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSkpIHtcbiAgICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgLy8gVW5jb25maWd1cmUgdGhlIFdlYkdQVSBjYW52YXMgY29udGV4dCB0byBhbGxvdyBpdCB0byBiZSByZWNvbmZpZ3VyZWQgb24gbmV4dCBpbml0XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZXZpY2VXcmFwcGVyID0gdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk7XG4gICAgICAgIGlmIChkZXZpY2VXcmFwcGVyKSB7XG4gICAgICAgICAgZGV2aWNlV3JhcHBlci5jb250ZXh0LnVuY29uZmlndXJlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgIC8vIElnbm9yZSBlcnJvcnMgaWYgZGV2aWNlIHdyYXBwZXIgaXMgbm90IGF2YWlsYWJsZVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlc3Ryb3kgbWVtb3J5IG1hbmFnZXIgYW5kIHJlbGVhc2UgYWxsb2NhdGVkIGJ1ZmZlcnNcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX21lbW9yeU1hbmFnZXIpKSB7XG4gICAgICB0aGlzLl9fbWVtb3J5TWFuYWdlci5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9fbWVtb3J5TWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCBzdGF0aWMgcmVzb3VyY2VzIGluIGNvbXBvbmVudHMgdGhhdCB1c2UgRW5naW5lLWtleWVkIG1hcHNcbiAgICBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgQW5pbWF0aW9uQ29tcG9uZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuICAgIFRyYW5zZm9ybUNvbXBvbmVudC5fY2xlYW51cEZvckVuZ2luZSh0aGlzKTtcbiAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuICAgIENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgQ2FtZXJhQ29tcG9uZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuICAgIExpZ2h0Q29tcG9uZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5fY2xlYW51cEZvckVuZ2luZSh0aGlzKTtcbiAgICBfZ2V0UGh5c2ljc0JhY2tlbmQoKT8uY2xlYW51cEZvckVuZ2luZSh0aGlzKTtcblxuICAgIC8vIENsZWFuIHVwIGdpem1vIHJlc291cmNlcyB0aGF0IGFyZSBtYW5hZ2VkIHBlci1FbmdpbmVcbiAgICBfY2xlYW51cEdpem1vc0ZvckVuZ2luZSh0aGlzKTtcblxuICAgIC8vIENsZWFuIHVwIG1hdGVyaWFsIGNvbnRlbnQgY2FjaGVzIGZvciB0aGlzIGVuZ2luZVxuICAgIEFic3RyYWN0TWF0ZXJpYWxDb250ZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgUmVuZGVyUGFzc0hlbHBlciBzYW1wbGVyIGNhY2hlIGZvciB0aGlzIGVuZ2luZVxuICAgIF9jbGVhbnVwUmVuZGVyUGFzc0hlbHBlckZvckVuZ2luZSh0aGlzKTtcblxuICAgIC8vIENsZWFuIHVwIFdlYkdMIHN0YXRlIGNhY2hlIGZvciB0aGlzIGVuZ2luZSAoYmxlbmQgbW9kZXMsIGN1bGwgZmFjZSwgZXRjLilcbiAgICBfY2xlYW51cFdlYkdMU3RhdGVzQ2FjaGVGb3JFbmdpbmUodGhpcyk7XG5cbiAgICB0aGlzLl9fd2ViZ2xHcHVUaW1lcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuX193ZWJnbEdwdVRpbWVyID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gQ2xlYXIgY29tcG9uZW50IG1lbW9yeSByZWdpc3RyeVxuICAgIHRoaXMuX19jb21wb25lbnRNZW1vcnlSZWdpc3RyeS5kZXN0cm95KCk7XG5cbiAgICAvLyBDbGVhciBleHByZXNzaW9ucyBhbmQgcmVuZGVyIHBhc3NlcyB1c2VkIGZvciBwcm9jZXNzQXV0b1xuICAgIHRoaXMuX19leHByZXNzaW9uRm9yUHJvY2Vzc0F1dG8gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0byA9IHVuZGVmaW5lZDtcblxuICAgIC8vIFJlc2V0IGludGVybmFsIHN0YXRlXG4gICAgdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQgPSAwO1xuICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgICB0aGlzLl9fbGFzdFByaW1pdGl2ZUNvdW50ID0gLTE7XG5cbiAgICAvLyBSZW1vdmUgZnJvbSBzdGF0aWMgZW5naW5lcyBtYXAgYW5kIHVucmVnaXN0ZXJcbiAgICBFbmdpbmUuX19lbmdpbmVzLmRlbGV0ZSh0aGlzLm9iamVjdFVJRCk7XG4gICAgdGhpcy51bnJlZ2lzdGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGEgcmVuZGVyIGxvb3AuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYFxuICAgKiBSbi5FbmdpbmUuc3RhcnRSZW5kZXJMb29wKCh0aW1lLCBfbXlBcmcxLCBfbXlBcmcyKSA9PiB7XG4gICAqICAgUm4uRW5naW5lLnByb2Nlc3MoW2V4cHJlc3Npb25dKTtcbiAgICogfSwgbXlBcmcxLCBteUFyZzIpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHJlbmRlckxvb3BGdW5jIC0gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGluIGVhY2ggZnJhbWVcbiAgICogQHBhcmFtIGFyZ3MgLSBhcmd1bWVudHMgeW91IHdhbnQgdG8gYmUgcGFzc2VkIHRvIHJlbmRlckxvb3BGdW5jXG4gICAqL1xuICBwdWJsaWMgc3RhcnRSZW5kZXJMb29wKHJlbmRlckxvb3BGdW5jOiAodGltZTogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSkgPT4gdm9pZCwgLi4uYXJnczogYW55W10pIHtcbiAgICB0aGlzLl9fcmVuZGVyTG9vcEZ1bmMgPSByZW5kZXJMb29wRnVuYztcbiAgICB0aGlzLl9fYXJncyA9IGFyZ3M7XG5cbiAgICAvLyBDYW5jZWwgYSBzdGlsbCBwZW5kaW5nIGZyYW1lIGZpcnN0IHNvIHRoYXQgY2FsbGluZyBzdGFydFJlbmRlckxvb3AgdHdpY2VcbiAgICAvLyBuZXZlciBsZWF2ZXMgdHdvIGxvb3BzIHJ1bm5pbmcgaW4gcGFyYWxsZWwuXG4gICAgaWYgKHRoaXMuX19hbmltYXRpb25GcmFtZUlkICE9PSAtMSkge1xuICAgICAgdGhpcy5zdG9wUmVuZGVyTG9vcCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGFuaW1hdGlvbkZyYW1lT2JqZWN0ID0gdGhpcy5fX2dldEFuaW1hdGlvbkZyYW1lT2JqZWN0KCk7XG4gICAgdGhpcy5fX2FuaW1hdGlvbkZyYW1lT2JqZWN0ID0gYW5pbWF0aW9uRnJhbWVPYmplY3Q7XG5cbiAgICAvLyBDYWNoZSBldmVyeXRoaW5nIHRoZSBob3QgcGF0aCBuZWVkcyBpbiBsb2NhbCB2YXJpYWJsZXMuIFJlc29sdmluZyB0aGVcbiAgICAvLyBgV2luZG93IHwgWFJTZXNzaW9uYCB1bmlvbiBhbmQgdGhlIGNsYXNzIGZpZWxkcyBvbiBldmVyeSBmcmFtZSBjb3N0cyBtb3JlXG4gICAgLy8gdGhhbiB0aGUgbG9vcCBib2R5IGl0c2VsZi5cbiAgICBjb25zdCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBhbmltYXRpb25GcmFtZU9iamVjdC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZChhbmltYXRpb25GcmFtZU9iamVjdCk7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gICAgY29uc3Qgd2ViQVJTeXN0ZW0gPSB0aGlzLl9fd2ViQVJTeXN0ZW07XG5cbiAgICAvLyBUaGUgZXh0cmEgYXJndW1lbnRzIGFyZSBpbW11dGFibGUgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgbG9vcCwgc28gdGhleVxuICAgIC8vIGFyZSBjb3BpZWQgb25jZS4gU2xvdCAwIGlzIHJlc2VydmVkIGZvciB0aGUgY3VycmVudCB0aW1lIGFuZCBvdmVyd3JpdHRlblxuICAgIC8vIGluIHBsYWNlLCB3aGljaCBrZWVwcyB0aGUgcGVyLWZyYW1lIHBhdGggZnJlZSBvZiBhcnJheSBhbGxvY2F0aW9ucyBhbmRcbiAgICAvLyBzcHJlYWQvYXBwbHkgb3ZlcmhlYWQgaW4gdGhlIGNvbW1vbiAobm8gZXh0cmEgYXJncykgY2FzZS5cbiAgICBjb25zdCBoYXNFeHRyYUFyZ3MgPSBhcmdzLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgY2FsbEFyZ3M6IGFueVtdID0gaGFzRXh0cmFBcmdzID8gWzAsIC4uLmFyZ3NdIDogW107XG5cbiAgICBjb25zdCBpbnZva2VSZW5kZXJMb29wRnVuYyA9IGhhc0V4dHJhQXJnc1xuICAgICAgPyAodGltZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgY2FsbEFyZ3NbMF0gPSB0aW1lO1xuICAgICAgICAgIHJlbmRlckxvb3BGdW5jLmFwcGx5KHJlbmRlckxvb3BGdW5jLCBjYWxsQXJncyBhcyBbbnVtYmVyLCAuLi5hbnlbXV0pO1xuICAgICAgICB9XG4gICAgICA6ICh0aW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICByZW5kZXJMb29wRnVuYy5jYWxsKHJlbmRlckxvb3BGdW5jLCB0aW1lKTtcbiAgICAgICAgfTtcblxuICAgIGNvbnN0IF9fcmVuZGVyTG9vcEZ1bmMgPSAoKF90aW1lOiBudW1iZXIsIHhyRnJhbWU6IFhSRnJhbWUpID0+IHtcbiAgICAgIGlmICh3ZWJYUlN5c3RlbT8uaXNSZWFkeUZvcldlYlhSKSB7XG4gICAgICAgIHdlYlhSU3lzdGVtLl9wcmVSZW5kZXIoX3RpbWUsIHhyRnJhbWUpO1xuICAgICAgICBpbnZva2VSZW5kZXJMb29wRnVuYyhfdGltZSk7XG4gICAgICAgIHdlYlhSU3lzdGVtLl9wb3N0UmVuZGVyKCk7XG4gICAgICB9IGVsc2UgaWYgKHdlYkFSU3lzdGVtPy5pc1JlYWR5Rm9yV2ViQVIpIHtcbiAgICAgICAgd2ViQVJTeXN0ZW0uX3ByZVJlbmRlcihfdGltZSwgeHJGcmFtZSk7XG4gICAgICAgIGludm9rZVJlbmRlckxvb3BGdW5jKF90aW1lKTtcbiAgICAgICAgd2ViQVJTeXN0ZW0uX3Bvc3RSZW5kZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGludm9rZVJlbmRlckxvb3BGdW5jKF90aW1lKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19hbmltYXRpb25GcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKF9fcmVuZGVyTG9vcEZ1bmMpO1xuICAgIH0pIGFzIEZyYW1lUmVxdWVzdENhbGxiYWNrO1xuXG4gICAgdGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoX19yZW5kZXJMb29wRnVuYyk7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0QW5pbWF0aW9uRnJhbWVPYmplY3QoKTogV2luZG93IHwgWFJTZXNzaW9uIHtcbiAgICBsZXQgYW5pbWF0aW9uRnJhbWVPYmplY3Q6IFdpbmRvdyB8IFhSU2Vzc2lvbiB8IHVuZGVmaW5lZCA9IHdpbmRvdztcbiAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBjb25zdCB3ZWJBUlN5c3RlbSA9IHRoaXMuX193ZWJBUlN5c3RlbTtcbiAgICBpZiAod2ViWFJTeXN0ZW0/LnJlcXVlc3RlZFRvRW50ZXJXZWJYUikge1xuICAgICAgYW5pbWF0aW9uRnJhbWVPYmplY3QgPSB3ZWJYUlN5c3RlbS54clNlc3Npb247XG4gICAgfSBlbHNlIGlmICh3ZWJBUlN5c3RlbT8ucmVxdWVzdGVkVG9FbnRlcldlYkFSKSB7XG4gICAgICBhbmltYXRpb25GcmFtZU9iamVjdCA9IHdlYkFSU3lzdGVtLmFyU2Vzc2lvbjtcbiAgICB9XG4gICAgaWYgKElzLm5vdC5leGlzdChhbmltYXRpb25GcmFtZU9iamVjdCkpIHtcbiAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuICAgIHJldHVybiBhbmltYXRpb25GcmFtZU9iamVjdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBhIGV4aXN0aW5nIHJlbmRlciBsb29wLlxuICAgKi9cbiAgcHVibGljIHN0b3BSZW5kZXJMb29wKCkge1xuICAgIC8vIENhbmNlbCBvbiB0aGUgc2FtZSBvYmplY3QgdGhhdCB3YXMgdXNlZCB0byByZXF1ZXN0IHRoZSBmcmFtZS4gQXNraW5nXG4gICAgLy8gX19nZXRBbmltYXRpb25GcmFtZU9iamVjdCgpIGFnYWluIGNvdWxkIHJldHVybiBhIGRpZmZlcmVudCBvYmplY3QgKGUuZy5cbiAgICAvLyB3aGVuIGFuIFhSIHNlc3Npb24gaGFzIGp1c3QgZW5kZWQpIGFuZCB0aGUgb2xkIGxvb3Agd291bGQga2VlcCBydW5uaW5nLlxuICAgIGNvbnN0IGFuaW1hdGlvbkZyYW1lT2JqZWN0ID0gdGhpcy5fX2FuaW1hdGlvbkZyYW1lT2JqZWN0ID8/IHRoaXMuX19nZXRBbmltYXRpb25GcmFtZU9iamVjdCgpO1xuICAgIGlmICh0aGlzLl9fYW5pbWF0aW9uRnJhbWVJZCAhPT0gLTEpIHtcbiAgICAgIGFuaW1hdGlvbkZyYW1lT2JqZWN0LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX19hbmltYXRpb25GcmFtZUlkKTtcbiAgICB9XG4gICAgdGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQgPSAtMTtcbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVPYmplY3QgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGFydCBhIHJlbmRlciBsb29wLlxuICAgKi9cbiAgcHVibGljIHJlc3RhcnRSZW5kZXJMb29wKCkge1xuICAgIGlmICh0aGlzLl9fcmVuZGVyTG9vcEZ1bmMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zdGFydFJlbmRlckxvb3AodGhpcy5fX3JlbmRlckxvb3BGdW5jLCAuLi50aGlzLl9fYXJncyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgU2ltcGxlIHZlcnNpb24gb2YgcHJvY2VzcyBtZXRob2RcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogTm8gbmVlZCB0byBjcmVhdGUgZXhwcmVzc2lvbnMgYW5kIHJlbmRlclBhc3NlcyBhbmQgdG8gcmVnaXN0ZXIgZW50aXRpZXMsIGV0Yy4uLlxuICAgKiBJdCdzIHN1aXRhYmxlIGZvciBzaW1wbGUgdXNlIGNhc2VzIGxpa2Ugc2FtcGxlIGFwcHMuXG4gICAqXG4gICAqIEBwYXJhbSBjbGVhckNvbG9yIC0gY29sb3IgdG8gY2xlYXIgdGhlIGNhbnZhc1xuICAgKi9cbiAgcHVibGljIHByb2Nlc3NBdXRvKGNsZWFyQ29sb3IgPSBWZWN0b3I0LmZyb21Db3B5NCgwLCAwLCAwLCAxKSkge1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX2V4cHJlc3Npb25Gb3JQcm9jZXNzQXV0bykpIHtcbiAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBuZXcgRXhwcmVzc2lvbigpO1xuICAgICAgY29uc3QgcmVuZGVyUGFzc0luaXQgPSBuZXcgUmVuZGVyUGFzcyh0aGlzKTtcbiAgICAgIHJlbmRlclBhc3NJbml0LnRvQ2xlYXJDb2xvckJ1ZmZlciA9IHRydWU7XG4gICAgICByZW5kZXJQYXNzSW5pdC50b0NsZWFyRGVwdGhCdWZmZXIgPSB0cnVlO1xuICAgICAgcmVuZGVyUGFzc0luaXQuY2xlYXJDb2xvciA9IGNsZWFyQ29sb3I7XG4gICAgICBjb25zdCByZW5kZXJQYXNzTWFpbiA9IG5ldyBSZW5kZXJQYXNzKHRoaXMpO1xuICAgICAgZXhwcmVzc2lvbi5hZGRSZW5kZXJQYXNzZXMoW3JlbmRlclBhc3NJbml0LCByZW5kZXJQYXNzTWFpbl0pO1xuICAgICAgdGhpcy5fX2V4cHJlc3Npb25Gb3JQcm9jZXNzQXV0byA9IGV4cHJlc3Npb247XG4gICAgICB0aGlzLl9fcmVuZGVyUGFzc0ZvclByb2Nlc3NBdXRvID0gcmVuZGVyUGFzc01haW47XG4gICAgfVxuICAgIHRoaXMuX19yZW5kZXJQYXNzRm9yUHJvY2Vzc0F1dG8hLmNsZWFyRW50aXRpZXMoKTtcbiAgICBjb25zdCBlbnRpdGllcyA9IHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5Ll9nZXRFbnRpdGllcygpO1xuICAgIHRoaXMuX19yZW5kZXJQYXNzRm9yUHJvY2Vzc0F1dG8hLmFkZEVudGl0aWVzKGVudGl0aWVzIGFzIHVua25vd24gYXMgSVNjZW5lR3JhcGhFbnRpdHlbXSk7XG4gICAgdGhpcy5wcm9jZXNzKFt0aGlzLl9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvXSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9jZXNzIG1ldGhvZCB0byByZW5kZXIgYSBzY2VuZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBZb3UgbmVlZCB0byBjYWxsIHRoaXMgbWV0aG9kIGZvciByZW5kZXJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBmcmFtZS9leHByZXNzaW9uIC0gYSBmcmFtZS9leHByZXNzaW9uIG9iamVjdFxuICAgKi9cbiAgcHVibGljIHByb2Nlc3MoZnJhbWU6IEZyYW1lKTogdm9pZDtcbiAgcHVibGljIHByb2Nlc3MoZXhwcmVzc2lvbnM6IEV4cHJlc3Npb25bXSk6IHZvaWQ7XG4gIHB1YmxpYyBwcm9jZXNzKHZhbHVlOiBhbnkpIHtcbiAgICBjb25zdCBncHVUaW1lckVuYWJsZWQgPSB0aGlzLl9fZ3B1VGltZXJFbmFibGVkO1xuICAgIGlmIChncHVUaW1lckVuYWJsZWQpIHtcbiAgICAgIHRoaXMuX19iZWdpbkdwdVRpbWVyKCk7XG4gICAgfVxuICAgIFRpbWUuX3Byb2Nlc3NCZWdpbih0aGlzKTtcbiAgICBBbmltYXRpb25TdGF0ZVJlcG9zaXRvcnkuYmVnaW5Qcm9jZXNzRnJhbWUodGhpcyk7XG4gICAgbGV0IGV4cHJlc3Npb25zOiBFeHByZXNzaW9uW10gPSB2YWx1ZTtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGcmFtZSkge1xuICAgICAgZXhwcmVzc2lvbnMgPSB2YWx1ZS5leHByZXNzaW9ucztcbiAgICB9XG5cbiAgICBpZiAoQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQodGhpcykgPT09IENvbXBvbmVudC5JbnZhbGlkT2JqZWN0VUlEKSB7XG4gICAgICBFbmdpbmUuY3JlYXRlQ2FtZXJhKHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWUgPSB0aGlzLl9fZ2xvYmFsRGF0YVJlcG9zaXRvcnkuZ2V0VmFsdWUoJ3RpbWUnLCAwKSBhcyBTY2FsYXI7XG4gICAgdGltZS5fdlswXSA9IFRpbWUudGltZUZyb21TeXN0ZW1TdGFydDtcblxuICAgIGlmICh0aGlzLnByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fcHJvY2Vzc1dlYkdQVShleHByZXNzaW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NXZWJHTChleHByZXNzaW9ucyk7XG4gICAgfVxuXG4gICAgVGltZS5fcHJvY2Vzc0VuZCgpO1xuICAgIGlmIChncHVUaW1lckVuYWJsZWQpIHtcbiAgICAgIHRoaXMuX19lbmRHcHVUaW1lcigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBHUFUgdGltZSBvZiBlYWNoIHByb2Nlc3MoKSBjYWxsIGlzIG1lYXN1cmVkLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBEaXNhYmxlZCBieSBkZWZhdWx0LiBNZWFzdXJpbmcgdXNlcyBHUFUgdGltZXIgcXVlcmllcyAoRVhUX2Rpc2pvaW50X3RpbWVyX3F1ZXJ5X3dlYmdsMiBpbiBXZWJHTDIsIHRoZVxuICAgKiBgdGltZXN0YW1wLXF1ZXJ5YCBmZWF0dXJlIGluIFdlYkdQVSksIHdoaWNoIGFkZCBhIHNtYWxsIG92ZXJoZWFkLiBTZWUge0BsaW5rIGdwdVRpbWVNaWxsaXNlY29uZHN9LlxuICAgKi9cbiAgcHVibGljIGdldCBncHVUaW1lckVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX19ncHVUaW1lckVuYWJsZWQ7XG4gIH1cblxuICBwdWJsaWMgc2V0IGdwdVRpbWVyRW5hYmxlZChmbGFnOiBib29sZWFuKSB7XG4gICAgdGhpcy5fX2dwdVRpbWVyRW5hYmxlZCA9IGZsYWc7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgR1BVIHRpbWUgY2FuIGJlIG1lYXN1cmVkIGluIHRoaXMgZW52aXJvbm1lbnQuXG4gICAqIEJyb3dzZXJzIG1heSBub3QgZXhwb3NlIEdQVSB0aW1lciBxdWVyaWVzIChlLmcuIGZvciBwcml2YWN5IHJlYXNvbnMgb3Igb24gc29tZSBwbGF0Zm9ybXMpLlxuICAgKi9cbiAgcHVibGljIGdldCBpc0dwdVRpbWVyU3VwcG9ydGVkKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gdGhpcy53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuX2dldEdwdVRpbWVyKCkuaXNTdXBwb3J0ZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fZ2V0V2ViR0xHcHVUaW1lcigpPy5pc1N1cHBvcnRlZCA/PyBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgR1BVIHRpbWUgc3BlbnQgb24gdGhlIGxhdGVzdCBtZWFzdXJlZCBwcm9jZXNzKCkgY2FsbCwgaW4gbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBVbmRlZmluZWQgdW50aWwgYSByZXN1bHQgaXMgYXZhaWxhYmxlLCBvciB3aGVuIHtAbGluayBncHVUaW1lckVuYWJsZWR9IGlzIGZhbHNlIG9yIHRoZSBlbnZpcm9ubWVudCBkb2VzXG4gICAqIG5vdCBzdXBwb3J0IEdQVSB0aW1lciBxdWVyaWVzLiBHUFUgcmVzdWx0cyBhcnJpdmUgYXN5bmNocm9ub3VzbHksIHNvIHRoZSB2YWx1ZSBsYWdzIGJlaGluZCBieSBhIGZld1xuICAgKiBmcmFtZXMuIEluIFdlYkdQVSBpdCBpcyB0aGUgc3VtIG9mIHRoZSBkdXJhdGlvbnMgb2YgdGhlIHJlbmRlciBwYXNzZXMgYW5kIHRoZSBjb21wdXRlIHBhc3NlcyAoc3VjaCBhc1xuICAgKiB0aGUgbGlnaHQgY2x1c3RlciBidWlsZCk7IGluIFdlYkdMMiBpdCBpcyB0aGUgdGltZSB0aGUgR1BVIHNwZW50IG9uIGFsbCB0aGUgY29tbWFuZHMgaXNzdWVkIGR1cmluZ1xuICAgKiBwcm9jZXNzKCkuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGdwdVRpbWVNaWxsaXNlY29uZHMoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX19ncHVUaW1lckVuYWJsZWQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeT8uX2dldEdwdVRpbWVyKCkubGFzdEdwdVRpbWVNaWxsaXNlY29uZHM7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fd2ViZ2xHcHVUaW1lcj8ubGFzdEdwdVRpbWVNaWxsaXNlY29uZHM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIEdQVSB0aW1lIG9mIGVhY2ggcGFzcyBvZiB0aGUgbGF0ZXN0IG1lYXN1cmVkIHByb2Nlc3MoKSBjYWxsLCBpbiBtaWxsaXNlY29uZHMsIGtleWVkIGJ5IHRoZSBwYXNzIGxhYmVsLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBXZWJHUFUgb25seS4gVW5kZWZpbmVkIHVudGlsIGEgY29tcGxldGUgcmVzdWx0IGlzIGF2YWlsYWJsZSwgd2hlbiB7QGxpbmsgZ3B1VGltZXJFbmFibGVkfSBpcyBmYWxzZSwgb3JcbiAgICogd2hlbiB0aGUgR1BVIHRpbWVyIGlzIG5vdCBzdXBwb3J0ZWQuIFRoZSBsYWJlbHMgYXJlIHRoZSBsYWJlbHMgb2YgdGhlIEdQVSBwYXNzZXM6IHRoZSB1bmlxdWUgbmFtZXMgb2YgdGhlXG4gICAqIHJlbmRlciBwYXNzZXMsIGBEZXB0aFByZXBhc3NgLCBgTGlnaHRDbHVzdGVyQnVpbGRgLCBhbmQgc28gb24uIFBhc3NlcyB3aXRoIHRoZSBzYW1lIGxhYmVsIGFyZSBzdW1tZWQuXG4gICAqIExpa2Uge0BsaW5rIGdwdVRpbWVNaWxsaXNlY29uZHN9LCB0aGUgdmFsdWUgbGFncyBiZWhpbmQgYnkgYSBmZXcgZnJhbWVzLlxuICAgKi9cbiAgcHVibGljIGdldCBncHVQYXNzVGltZXNNaWxsaXNlY29uZHMoKTogUmVhZG9ubHlNYXA8c3RyaW5nLCBudW1iZXI+IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuX19ncHVUaW1lckVuYWJsZWQgfHwgdGhpcy5fX3Byb2Nlc3NBcHByb2FjaCAhPT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk/Ll9nZXRHcHVUaW1lcigpLmxhc3RQYXNzR3B1VGltZXNNaWxsaXNlY29uZHM7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0V2ViR0xHcHVUaW1lcigpOiBXZWJHTEdwdVRpbWVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fX3dlYmdsR3B1VGltZXIgPT0gbnVsbCkge1xuICAgICAgY29uc3QgZ2x3ID0gdGhpcy5fX3dlYmdsUmVzb3VyY2VSZXBvc2l0b3J5Py5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlcjtcbiAgICAgIGlmIChnbHcgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3dlYmdsR3B1VGltZXIgPSBuZXcgV2ViR0xHcHVUaW1lcihnbHcuZ2V0UmF3Q29udGV4dEFzV2ViR0wyKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3dlYmdsR3B1VGltZXI7XG4gIH1cblxuICBwcml2YXRlIF9fYmVnaW5HcHVUaW1lcigpIHtcbiAgICBpZiAodGhpcy5fX3Byb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeT8uX2dldEdwdVRpbWVyKCkuYmVnaW5GcmFtZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fZ2V0V2ViR0xHcHVUaW1lcigpPy5iZWdpbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19lbmRHcHVUaW1lcigpIHtcbiAgICBpZiAodGhpcy5fX3Byb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeT8uX2dldEdwdVRpbWVyKCkuZW5kRnJhbWUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX3dlYmdsR3B1VGltZXI/LmVuZCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19wcm9jZXNzUmVuZGVyUGFzc1dlYkdQVSh7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgIHJlbmRlclBhc3MsXG4gICAgcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICBwcmltaXRpdmVVaWRzLFxuICAgIGRpc3BsYXlJZHgsXG4gICAgaGFzQW55RWZmZWtzZWVyQ29tcG9uZW50cyxcbiAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMsXG4gIH06IHtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk6IFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzO1xuICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IG51bWJlcjtcbiAgICBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXTtcbiAgICBkaXNwbGF5SWR4OiBudW1iZXI7XG4gICAgaGFzQW55RWZmZWtzZWVyQ29tcG9uZW50czogYm9vbGVhbjtcbiAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnM/OiBEZWZlcnJlZEVmZmVrc2VlcldlYkdQVVJlbmRlckpvYltdO1xuICB9KTogYm9vbGVhbiB7XG4gICAgLy8gUnVuIHByZS1yZW5kZXIgaG9vayBwZXItZXllIChlbnN1cmVzIHBlci12aWV3IGZyYW1lYnVmZmVyIGFkanVzdG1lbnRzKVxuICAgIHJlbmRlclBhc3MuZG9QcmVSZW5kZXIoKTtcblxuICAgIC8vIFNjYW5uaW5nIGV2ZXJ5IGVudGl0eSBmb3IgYW4gRWZmZWtzZWVyQ29tcG9uZW50IGNvc3RzIGEgY29tcG9uZW50IGxvb2t1cFxuICAgIC8vIHBlciBlbnRpdHkgcGx1cyB0d28gYXJyYXkgYWxsb2NhdGlvbnMgcGVyIHJlbmRlciBwYXNzIChhbmQgcGVyIGV5ZSkuIE9ubHlcbiAgICAvLyBkbyBpdCB3aGVuIHRoaXMgcGFzcyBhY3R1YWxseSByZW5kZXJzIEVmZmVrc2VlciBlZmZlY3RzIGFuZCBhdCBsZWFzdCBvbmVcbiAgICAvLyBFZmZla3NlZXJDb21wb25lbnQgZXhpc3RzIGluIHRoZSBlbmdpbmUuXG4gICAgbGV0IGVmZmVrc2VlckNvbXBvbmVudHM6IEVmZmVrc2VlckNvbXBvbmVudFtdIHwgdW5kZWZpbmVkO1xuICAgIGlmIChoYXNBbnlFZmZla3NlZXJDb21wb25lbnRzICYmIHJlbmRlclBhc3MudG9SZW5kZXJFZmZla3NlZXJFZmZlY3RzKSB7XG4gICAgICBlZmZla3NlZXJDb21wb25lbnRzID0gW107XG4gICAgICBjb25zdCBlbnRpdGllcyA9IHJlbmRlclBhc3MuZW50aXRpZXM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGVmZmVrc2VlckNvbXBvbmVudCA9IGVudGl0aWVzW2ldLnRyeVRvR2V0RWZmZWtzZWVyKCk7XG4gICAgICAgIGlmIChlZmZla3NlZXJDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICAgIGVmZmVrc2VlckNvbXBvbmVudHMucHVzaChlZmZla3NlZXJDb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZWZmZWtzZWVyQ29tcG9uZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50cyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFzRWZmZWtzZWVyRWZmZWN0cyA9IGVmZmVrc2VlckNvbXBvbmVudHMgIT0gbnVsbDtcbiAgICBjb25zdCBlZmZla3NlZXJSZW5kZXJQYXNzT3B0aW9ucyA9IGhhc0VmZmVrc2VlckVmZmVjdHNcbiAgICAgID8gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldEVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zKHRoaXMsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpXG4gICAgICA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBzaG91bGRSZW5kZXJFZmZla3NlZXJFZmZlY3RzID0gcmVuZGVyUGFzcy50b1JlbmRlckVmZmVrc2VlckVmZmVjdHMgJiYgaGFzRWZmZWtzZWVyRWZmZWN0cztcbiAgICBjb25zdCBzaG91bGREZWZlckVmZmVrc2VlckVmZmVjdHMgPVxuICAgICAgc2hvdWxkUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyAmJiByZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpICE9IG51bGwgJiYgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzICE9IG51bGw7XG4gICAgaWYgKHNob3VsZFJlbmRlckVmZmVrc2VlckVmZmVjdHMgJiYgZWZmZWtzZWVyUmVuZGVyUGFzc09wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgZm9yIChjb25zdCBlZmZla3NlZXJDb21wb25lbnQgb2YgZWZmZWtzZWVyQ29tcG9uZW50cyEpIHtcbiAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50LnByZXBhcmVXZWJHUFVSZW5kZXJpbmcoZWZmZWtzZWVyUmVuZGVyUGFzc09wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2hvdWxkRGVmZXJFZmZla3NlZXJFZmZlY3RzKSB7XG4gICAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMhLnB1c2goe1xuICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICBkaXNwbGF5SWR4LFxuICAgICAgICByZW5kZXJQYXNzT3B0aW9uczogZWZmZWtzZWVyUmVuZGVyUGFzc09wdGlvbnMsXG4gICAgICAgIGVmZmVrc2VlckNvbXBvbmVudHM6IGVmZmVrc2VlckNvbXBvbmVudHMhLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gY2xlYXIgRnJhbWVidWZmZXJcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJGcmFtZUJ1ZmZlcih0aGlzLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcblxuICAgIHRoaXMuX19yZW5kZXJNZXNoZXNXZWJHUFUoe1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgICAgcmVuZGVyUGFzcyxcbiAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgZGlzcGxheUlkeCxcbiAgICAgIHNob3VsZEtlZXBSZW5kZXJQYXNzRm9yRWZmZWtzZWVyOiBzaG91bGRSZW5kZXJFZmZla3NlZXJFZmZlY3RzICYmICFzaG91bGREZWZlckVmZmVrc2VlckVmZmVjdHMsXG4gICAgfSk7XG5cbiAgICBpZiAoc2hvdWxkUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyAmJiAhc2hvdWxkRGVmZXJFZmZla3NlZXJFZmZlY3RzKSB7XG4gICAgICBjb25zdCByZW5kZXJQYXNzRW5jb2RlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRPckNyZWF0ZVJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyRXh0ZXJuYWxSZW5kZXJpbmcoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgIGRpc3BsYXlJZHhcbiAgICAgICk7XG5cbiAgICAgIGlmIChyZW5kZXJQYXNzRW5jb2RlciAhPSBudWxsKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWZmZWtzZWVyQ29tcG9uZW50IG9mIGVmZmVrc2VlckNvbXBvbmVudHMhKSB7XG4gICAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50LiRyZW5kZXJXZWJHUFUocmVuZGVyUGFzc0VuY29kZXIsIGVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zLCBkaXNwbGF5SWR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmVuZFJlbmRlclBhc3NFbmNvZGVyRm9yRXh0ZXJuYWxSZW5kZXJpbmcoKTtcbiAgICB9XG5cbiAgICByZW5kZXJQYXNzLl9jb3B5UmVzb2x2ZTFUb1Jlc29sdmUyV2ViR3B1KCk7XG4gICAgcmVuZGVyUGFzcy5kb1Bvc3RSZW5kZXIoKTtcblxuICAgIHJldHVybiBzaG91bGRSZW5kZXJFZmZla3NlZXJFZmZlY3RzO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3JlbmRlckRlZmVycmVkRWZmZWtzZWVyRWZmZWN0c0FmdGVyUmVzb2x2ZVdlYkdQVSh7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgIGN1cnJlbnRSZW5kZXJQYXNzLFxuICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyxcbiAgICBkaXNwbGF5SWR4LFxuICB9OiB7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5OiBXZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY3VycmVudFJlbmRlclBhc3M6IFJlbmRlclBhc3M7XG4gICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzOiBEZWZlcnJlZEVmZmVrc2VlcldlYkdQVVJlbmRlckpvYltdO1xuICAgIGRpc3BsYXlJZHg6IG51bWJlcjtcbiAgfSkge1xuICAgIGlmIChkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFJlc29sdmVGcmFtZWJ1ZmZlciA9IGN1cnJlbnRSZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpO1xuICAgIGlmIChjdXJyZW50UmVzb2x2ZUZyYW1lYnVmZmVyID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGpvYiBvZiBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMpIHtcbiAgICAgIGlmIChqb2IuZGlzcGxheUlkeCAhPT0gZGlzcGxheUlkeCB8fCBqb2IucmVuZGVyUGFzcy5nZXRSZXNvbHZlRnJhbWVidWZmZXIoKSAhPT0gY3VycmVudFJlc29sdmVGcmFtZWJ1ZmZlcikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVuZGVyUGFzc0VuY29kZXIgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0T3JDcmVhdGVSZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlckV4dGVybmFsUmVuZGVyaW5nKFxuICAgICAgICB0aGlzLFxuICAgICAgICBqb2IucmVuZGVyUGFzcyxcbiAgICAgICAgZGlzcGxheUlkeFxuICAgICAgKTtcblxuICAgICAgaWYgKHJlbmRlclBhc3NFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChjb25zdCBlZmZla3NlZXJDb21wb25lbnQgb2Ygam9iLmVmZmVrc2VlckNvbXBvbmVudHMpIHtcbiAgICAgICAgICBlZmZla3NlZXJDb21wb25lbnQuJHJlbmRlcldlYkdQVShyZW5kZXJQYXNzRW5jb2Rlciwgam9iLnJlbmRlclBhc3NPcHRpb25zLCBkaXNwbGF5SWR4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmVuZFJlbmRlclBhc3NFbmNvZGVyRm9yRXh0ZXJuYWxSZW5kZXJpbmcoKTtcbiAgICAgIGpvYi5yZW5kZXJQYXNzLl9jb3B5UmVzb2x2ZTFUb1Jlc29sdmUyV2ViR3B1KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3JlbmRlck1lc2hlc1dlYkdQVSh7XG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgIHJlbmRlclBhc3MsXG4gICAgcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICBwcmltaXRpdmVVaWRzLFxuICAgIGRpc3BsYXlJZHgsXG4gICAgc2hvdWxkS2VlcFJlbmRlclBhc3NGb3JFZmZla3NlZXIsXG4gIH06IHtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk6IFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICByZW5kZXJQYXNzOiBSZW5kZXJQYXNzO1xuICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IG51bWJlcjtcbiAgICBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXTtcbiAgICBkaXNwbGF5SWR4OiBudW1iZXI7XG4gICAgc2hvdWxkS2VlcFJlbmRlclBhc3NGb3JFZmZla3NlZXI6IGJvb2xlYW47XG4gIH0pOiBHUFVSZW5kZXJQYXNzRW5jb2RlciB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IHJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyOiBHUFVSZW5kZXJQYXNzRW5jb2RlciB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZG9SZW5kZXIgPSByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZTtcbiAgICBpZiAoZG9SZW5kZXIpIHtcbiAgICAgIGlmIChzaG91bGRLZWVwUmVuZGVyUGFzc0ZvckVmZmVrc2Vlcikge1xuICAgICAgICByZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5yZW5kZXJXaXRoUmVuZGVyQnVuZGxlQW5kS2VlcFJlbmRlclBhc3MoXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICByZW5kZXJQYXNzLFxuICAgICAgICAgIGRpc3BsYXlJZHhcbiAgICAgICAgKTtcbiAgICAgICAgZG9SZW5kZXIgPSByZW5kZXJQYXNzRW5jb2RlckZvckVmZmVrc2VlciA9PSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9SZW5kZXIgPSAhd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnJlbmRlcldpdGhSZW5kZXJCdW5kbGUodGhpcywgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fZW5naW5lU3RhdGUud2ViZ3B1UmVuZGVyQnVuZGxlTW9kZSB8fD0gZG9SZW5kZXI7XG4gICAgfVxuXG4gICAgaWYgKCFkb1JlbmRlcikge1xuICAgICAgcmV0dXJuIHJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyO1xuICAgIH1cblxuICAgIC8vIFRoZSByZW5kZXIgYnVuZGxlIGNvdWxkIG5vdCBiZSByZXVzZWQgKGZpcnN0IGZyYW1lLCBjYWNoZSBpbnZhbGlkYXRpb24sXG4gICAgLy8gb3IgY2hhbmdlZCBzb3J0IG9yZGVyKSwgc28gcmVjb3JkIGZyZXNoIGNvbW1hbmRzLiBDcmVhdGluZyB0aGUgYnVuZGxlXG4gICAgLy8gZW5jb2RlciBvbmx5IGhlcmUgYXZvaWRzIGRlc2NyaXB0b3IgY29tcHV0YXRpb24gYW5kIEdQVSBlbmNvZGVyXG4gICAgLy8gYWxsb2NhdGlvbiBvbiBldmVyeSBmcmFtZSB3aGVyZSBhIGNhY2hlZCBidW5kbGUgaXMgZXhlY3V0ZWQuXG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZVJlbmRlckJ1bmRsZUVuY29kZXIodGhpcywgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG5cbiAgICBjb25zdCByZW5kZXJlZFNvbWV0aGluZyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5jb21tb25fJHJlbmRlcih7XG4gICAgICByZW5kZXJQYXNzOiByZW5kZXJQYXNzLFxuICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICBkaXNwbGF5SWR4LFxuICAgICAgZW5naW5lOiB0aGlzLFxuICAgIH0pO1xuICAgIHJlbmRlclBhc3MuX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlID0gcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgaWYgKCFyZW5kZXJlZFNvbWV0aGluZykge1xuICAgICAgcmV0dXJuIHJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRLZWVwUmVuZGVyUGFzc0ZvckVmZmVrc2Vlcikge1xuICAgICAgcmV0dXJuIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5maW5pc2hSZW5kZXJCdW5kbGVFbmNvZGVyQW5kS2VlcFJlbmRlclBhc3ModGhpcywgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG4gICAgfVxuXG4gICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmZpbmlzaFJlbmRlckJ1bmRsZUVuY29kZXIodGhpcywgcmVuZGVyUGFzcywgZGlzcGxheUlkeCk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX3Byb2Nlc3NXZWJHUFUoZXhwcmVzc2lvbnM6IEV4cHJlc3Npb25bXSkge1xuICAgIGNvbnN0IGNvbXBvbmVudFRpZHMgPSB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRUSURzKCk7XG4gICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgY29uc3Qgd2VieHJTeXN0ZW0gPSB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gICAgZm9yIChjb25zdCBzdGFnZSBvZiBDb21wb25lbnQuX3Byb2Nlc3NTdGFnZXMpIHtcbiAgICAgIGlmIChzdGFnZSA9PT0gUHJvY2Vzc1N0YWdlLlJlbmRlcikge1xuICAgICAgICAvLyBUaGUgbGlnaHQgbGlzdHMgbXVzdCBiZSB3cml0dGVuIGJlZm9yZSB0aGUgc3RyYXRlZ3kgdXBsb2FkcyB0aGUgR1BVIGluc3RhbmNlIGRhdGEgaW4gcHJlcmVuZGVyLlxuICAgICAgICB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtLnVwZGF0ZShleHByZXNzaW9ucyk7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5jb21tb25fJHByZXJlbmRlcih0aGlzKTtcbiAgICAgICAgY29uc3QgaXNXZWJYUk1vZGUgPSB3ZWJ4clN5c3RlbT8uaXNXZWJYUk1vZGUgPz8gZmFsc2U7XG4gICAgICAgIGNvbnN0IGlzTXVsdGlWaWV3ID0gd2VieHJTeXN0ZW0/LmlzTXVsdGlWaWV3KCkgPz8gZmFsc2U7XG4gICAgICAgIGNvbnN0IHhyUG9zZSA9IHRoaXMuX19lbmdpbmVTdGF0ZS54clBvc2VXZWJHUFU7XG4gICAgICAgIGNvbnN0IGRpc3BsYXlDb3VudCA9IGlzV2ViWFJNb2RlICYmICFpc011bHRpVmlldyAmJiB4clBvc2UgIT0gbnVsbCA/IHhyUG9zZS52aWV3cy5sZW5ndGggOiAxO1xuICAgICAgICAvLyBFZmZla3NlZXIgaXMgcmFyZWx5IHVzZWQuIERldGVjdCBpdCBvbmNlIHBlciBmcmFtZSBzbyB0aGUgcGVyLXBhc3NcbiAgICAgICAgLy8gY29kZSBjYW4gc2tpcCBlbnRpdHkgc2NhbnMsIGpvYiBhcnJheXMgYW5kIHRoZSBkZWZlcnJlZC1yZW5kZXIgY2FsbC5cbiAgICAgICAgY29uc3QgaGFzQW55RWZmZWtzZWVyQ29tcG9uZW50cyA9IHRoaXMuX19jb21wb25lbnRSZXBvc2l0b3J5Lmhhc0FueUNvbXBvbmVudChcbiAgICAgICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLkVmZmVrc2VlckNvbXBvbmVudFRJRFxuICAgICAgICApO1xuICAgICAgICAvLyBUaGUgbWFwcyBvbmx5IGV4aXN0IHRvIHNoYXJlIHNvcnRpbmcgd29yayBiZXR3ZWVuIHRoZSBleWVzIGluIHN0ZXJlb1xuICAgICAgICAvLyByZW5kZXJpbmcuIEFsbG9jYXRpbmcgdGhlbSBmb3IgdGhlIGNvbW1vbiBzaW5nbGUtZGlzcGxheSBjYXNlIGNvc3RzXG4gICAgICAgIC8vIHR3byBNYXAgYWxsb2NhdGlvbnMgb24gZXZlcnkgZnJhbWUuXG4gICAgICAgIGNvbnN0IGlzTXVsdGlEaXNwbGF5ID0gZGlzcGxheUNvdW50ID4gMTtcbiAgICAgICAgY29uc3QgcmVuZGVyUGFzc1RpY2tDb3VudE1hcCA9IGlzTXVsdGlEaXNwbGF5ID8gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgcHJpbWl0aXZlVWlkc01hcCA9IGlzTXVsdGlEaXNwbGF5ID8gbmV3IE1hcDxudW1iZXIsIFByaW1pdGl2ZVVJRFtdPigpIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIGZvciAobGV0IGRpc3BsYXlJZHggPSAwOyBkaXNwbGF5SWR4IDwgZGlzcGxheUNvdW50OyBkaXNwbGF5SWR4KyspIHtcbiAgICAgICAgICBjb25zdCBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnM6IERlZmVycmVkRWZmZWtzZWVyV2ViR1BVUmVuZGVySm9iW10gfCB1bmRlZmluZWQgPSBoYXNBbnlFZmZla3NlZXJDb21wb25lbnRzXG4gICAgICAgICAgICA/IFtdXG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBsZXQgcmVuZGVyZWRFZmZla3NlZXJFZmZlY3RzSW5EaXNwbGF5ID0gZmFsc2U7XG4gICAgICAgICAgZm9yIChjb25zdCBleHAgb2YgZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiBleHAucmVuZGVyUGFzc2VzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlbmRlclBhc3NVaWQgPSByZW5kZXJQYXNzLnJlbmRlclBhc3NVSUQ7XG4gICAgICAgICAgICAgIGxldCByZW5kZXJQYXNzVGlja0NvdW50ID0gcmVuZGVyUGFzc1RpY2tDb3VudE1hcD8uZ2V0KHJlbmRlclBhc3NVaWQpO1xuICAgICAgICAgICAgICBsZXQgcHJpbWl0aXZlVWlkczogUHJpbWl0aXZlVUlEW107XG4gICAgICAgICAgICAgIGlmIChyZW5kZXJQYXNzVGlja0NvdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50ID0gdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQ7XG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzcy5faXNDaGFuZ2VkU29ydFJlbmRlclJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHMgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuc29ydF8kcmVuZGVyKHRoaXMsIHJlbmRlclBhc3MpO1xuICAgICAgICAgICAgICAgIGlmIChyZW5kZXJQYXNzVGlja0NvdW50TWFwICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnRNYXAuc2V0KHJlbmRlclBhc3NVaWQsIHJlbmRlclBhc3NUaWNrQ291bnQpO1xuICAgICAgICAgICAgICAgICAgcHJpbWl0aXZlVWlkc01hcCEuc2V0KHJlbmRlclBhc3NVaWQsIHByaW1pdGl2ZVVpZHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzID0gcHJpbWl0aXZlVWlkc01hcCEuZ2V0KHJlbmRlclBhc3NVaWQpITtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVkRWZmZWtzZWVyRWZmZWN0cyA9IHRoaXMuX19wcm9jZXNzUmVuZGVyUGFzc1dlYkdQVSh7XG4gICAgICAgICAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgICAgICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlJZHgsXG4gICAgICAgICAgICAgICAgaGFzQW55RWZmZWtzZWVyQ29tcG9uZW50cyxcbiAgICAgICAgICAgICAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZW5kZXJlZEVmZmVrc2VlckVmZmVjdHNJbkRpc3BsYXkgfHw9IHJlbmRlcmVkRWZmZWtzZWVyRWZmZWN0cztcbiAgICAgICAgICAgICAgaWYgKGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyAhPSBudWxsICYmIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3JlbmRlckRlZmVycmVkRWZmZWtzZWVyRWZmZWN0c0FmdGVyUmVzb2x2ZVdlYkdQVSh7XG4gICAgICAgICAgICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnksXG4gICAgICAgICAgICAgICAgICBjdXJyZW50UmVuZGVyUGFzczogcmVuZGVyUGFzcyxcbiAgICAgICAgICAgICAgICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyxcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXlJZHgsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRpY2sgY291bnQgb25seSBhZnRlciB0aGUgZmluYWwgZGlzcGxheSBoYXMgYmVlbiBwcm9jZXNzZWRcbiAgICAgICAgICAgICAgaWYgKGRpc3BsYXlJZHggPT09IGRpc3BsYXlDb3VudCAtIDEpIHtcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50TWFwPy5kZWxldGUocmVuZGVyUGFzc1VpZCk7XG4gICAgICAgICAgICAgICAgcHJpbWl0aXZlVWlkc01hcD8uZGVsZXRlKHJlbmRlclBhc3NVaWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19yZW5kZXJQYXNzVGlja0NvdW50Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRpc3BsYXlJZHggPCBkaXNwbGF5Q291bnQgLSAxICYmIHJlbmRlcmVkRWZmZWtzZWVyRWZmZWN0c0luRGlzcGxheSkge1xuICAgICAgICAgICAgLy8gRWZmZWtzZWVyIFdlYkdQVSB1cGRhdGVzIGNhbWVyYSBtYXRyaWNlcyBpbiBiYWNrZW5kIEdQVSBzdGF0ZSB3aGlsZSBSaG9kb25pdGUgaXMgc3RpbGwgcmVjb3JkaW5nIGNvbW1hbmRzLlxuICAgICAgICAgICAgLy8gU3VibWl0dGluZyBwZXIgZXllIHByZXZlbnRzIHRoZSByaWdodC1leWUgdXBkYXRlIGZyb20gYmVpbmcgb2JzZXJ2ZWQgYnkgbGVmdC1leWUgZHJhdyBjb21tYW5kcy5cbiAgICAgICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5mbHVzaCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZmx1c2goKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhdGhpcy5fX2VuZ2luZVN0YXRlLndlYmdwdVJlbmRlckJ1bmRsZU1vZGUgfHxcbiAgICAgICAgICBBbmltYXRpb25Db21wb25lbnQuZ2V0SXNBbmltYXRpbmcodGhpcykgfHxcbiAgICAgICAgICBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcykgIT09IHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgICAgICBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgICAgICBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnQoKSAhPT0gdGhpcy5fX2xhc3RQcmltaXRpdmVDb3VudCB8fFxuICAgICAgICAgIExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50XG4gICAgICAgICkge1xuICAgICAgICAgIC8vIEJ1aWx0IG9ubHkgd2hlbiB0aGUgc3RhZ2UgYWN0dWFsbHkgcnVuczogYSBzdGF0aWMgc2NlbmUgc2tpcHMgaXQgb24gZXZlcnkgZnJhbWUuXG4gICAgICAgICAgY29uc3QgY29tbW9uTWV0aG9kTmFtZSA9IGBjb21tb25fJHtzdGFnZS5tZXRob2ROYW1lfWA7XG4gICAgICAgICAgZm9yIChjb25zdCBjb21wb25lbnRUaWQgb2YgY29tcG9uZW50VGlkcykge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQgPSBDb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudENsYXNzKGNvbXBvbmVudFRpZCkhO1xuXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDbGFzc19jb21tb25NZXRob2QgPSAoY29tcG9uZW50Q2xhc3MgYXMgYW55KVtjb21tb25NZXRob2ROYW1lXTtcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRDbGFzc19jb21tb25NZXRob2QpIHtcbiAgICAgICAgICAgICAgY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kKHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzQXBwcm9hY2g6IHRoaXMuX19wcm9jZXNzQXBwcm9hY2gsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzczogdm9pZCAwLFxuICAgICAgICAgICAgICAgIHByb2Nlc3NTdGFnZTogc3RhZ2UsXG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudDogdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgICAgICAgICAgICAgZGlzcGxheUlkeDogMCxcbiAgICAgICAgICAgICAgICBlbmdpbmU6IHRoaXMsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb21wb25lbnRDbGFzcy5wcm9jZXNzKHRoaXMsIGNvbXBvbmVudENsYXNzLCBzdGFnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhZ2UgPT09IFByb2Nlc3NTdGFnZS5Mb2dpYykge1xuICAgICAgICAvLyBUaGUgdHJhbnNmb3JtIGdpem1vcyBrZWVwIGEgY29uc3RhbnQgb24tc2NyZWVuIHNpemUsIHNvIHRoZXkgaGF2ZSB0byBiZSByZXNjYWxlZFxuICAgICAgICAvLyBhZnRlciB0aGUgQ2FtZXJhQ29tcG9uZW50IChUSUQgOSkgaGFzIHVwZGF0ZWQgaXRzIG1hdHJpY2VzLiBUaGlzIHJ1bnMgb3V0c2lkZSB0aGVcbiAgICAgICAgLy8gY2hhbmdlIGdhdGUgYWJvdmUgc28gdGhhdCBhIGZyYW1lIHdoaWNoIHNraXBzIHRoZSBMb2dpYyBzdGFnZSBzdGlsbCBjb3JyZWN0cyB0aGVtLlxuICAgICAgICBTY2VuZUdyYXBoQ29tcG9uZW50Ll91cGRhdGVUcmFuc2Zvcm1HaXptb3NCeUNhbWVyYUNoYW5nZSh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMpO1xuICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcyk7XG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcyk7XG4gICAgdGhpcy5fX2xhc3RQcmltaXRpdmVDb3VudCA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudCgpO1xuICAgIHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Byb2Nlc3NXZWJHTChleHByZXNzaW9uczogRXhwcmVzc2lvbltdKSB7XG4gICAgLy8gV2ViR0xcbiAgICBjb25zdCByZXBvID0gdGhpcy53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcblxuICAgIGNvbnN0IGNvbXBvbmVudFRpZHMgPSB0aGlzLl9fY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRUSURzKCk7XG4gICAgY29uc3QgcmVuZGVyaW5nQ29tcG9uZW50VGlkcyA9IHRoaXMuX19jb21wb25lbnRSZXBvc2l0b3J5LmdldFJlbmRlcmluZ0NvbXBvbmVudFRJRHMoKTtcbiAgICBmb3IgKGNvbnN0IHN0YWdlIG9mIENvbXBvbmVudC5fcHJvY2Vzc1N0YWdlcykge1xuICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IHN0YWdlLm1ldGhvZE5hbWU7XG4gICAgICBjb25zdCBjb21tb25NZXRob2ROYW1lID0gYGNvbW1vbl8ke21ldGhvZE5hbWV9YDtcbiAgICAgIGlmIChzdGFnZSA9PT0gUHJvY2Vzc1N0YWdlLlJlbmRlcikge1xuICAgICAgICAvLyBDb2FsZXNjZSB0aGUgR1BVIHNldHVwIG9mIG1lc2hlcyBhZGRlZCB3aGlsZSBsb2FkaW5nIGludG8gb25lIG11bHRpLWRyYXcgcmVidWlsZC5cbiAgICAgICAgcmVwby5nZXRNdWx0aURyYXdSZXBvc2l0b3J5KHRoaXMpLnJlYnVpbGREaXJ0eUdyb3VwcygpO1xuICAgICAgICAvLyBUaGUgbGlnaHQgbGlzdHMgbXVzdCBiZSB3cml0dGVuIGJlZm9yZSB0aGUgc3RyYXRlZ3kgdXBsb2FkcyB0aGUgR1BVIGluc3RhbmNlIGRhdGEgaW4gcHJlcmVuZGVyLlxuICAgICAgICB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtLnVwZGF0ZShleHByZXNzaW9ucyk7XG4gICAgICAgIE1lc2hSZW5kZXJlckNvbXBvbmVudC5jb21tb25fJHByZXJlbmRlcih0aGlzKTtcbiAgICAgICAgZm9yIChjb25zdCBleHAgb2YgZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFRpZCBvZiByZW5kZXJpbmdDb21wb25lbnRUaWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50Q2xhc3MoY29tcG9uZW50VGlkKSE7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJlbmRlclBhc3Mgb2YgZXhwLnJlbmRlclBhc3Nlcykge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIHNwZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc3BlY3Rvci5zZXRNYXJrZXIoYHwgJHtleHAudW5pcXVlTmFtZX06ICR7cmVuZGVyUGFzcy51bmlxdWVOYW1lfSNgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZW5kZXJQYXNzLmRvUHJlUmVuZGVyKCk7XG5cbiAgICAgICAgICAgICAgcmVwby5zd2l0Y2hEZXB0aFRlc3QocmVuZGVyUGFzcy5pc0RlcHRoVGVzdCk7XG5cbiAgICAgICAgICAgICAgLy8gYmluZCBGcmFtZWJ1ZmZlclxuICAgICAgICAgICAgICB0aGlzLmJpbmRGcmFtZWJ1ZmZlcldlYkdMKHJlbmRlclBhc3MpO1xuXG4gICAgICAgICAgICAgIC8vIHNldCBWaWV3cG9ydCBmb3IgTm9ybWFsIChOb3QgV2ViWFIpXG4gICAgICAgICAgICAgIHRoaXMuc2V0Vmlld3BvcnRGb3JOb3JtYWxSZW5kZXJpbmcocmVuZGVyUGFzcyk7XG4gICAgICAgICAgICAgIC8vIHNjaXNzb3IgaGludHMgKGUuZy4gdGhlIHNjcmVlbiBib3VuZHMgb2YgYW4gU0RGIHBhc3MpIGZvciBub3JtYWwgcmVuZGVyaW5nXG4gICAgICAgICAgICAgIHRoaXMuc2V0U2Npc3NvckZvck5vcm1hbFJlbmRlcmluZyhyZW5kZXJQYXNzKTtcblxuICAgICAgICAgICAgICBpZiAoY29tcG9uZW50VGlkID09PSBXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hSZW5kZXJlckNvbXBvbmVudFRJRCkge1xuICAgICAgICAgICAgICAgIC8vIGNsZWFyIEZyYW1lYnVmZmVyXG4gICAgICAgICAgICAgICAgdGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmNsZWFyRnJhbWVCdWZmZXIodGhpcywgcmVuZGVyUGFzcyk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZW5kZXJQYXNzLl9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGNvbnN0IHByaW1pdGl2ZVVpZHMgPSBNZXNoUmVuZGVyZXJDb21wb25lbnQuc29ydF8kcmVuZGVyKHRoaXMsIHJlbmRlclBhc3MpO1xuICAgICAgICAgICAgICBsZXQgZG9SZW5kZXIgPSByZW5kZXJQYXNzLl9yZW5kZXJlZFNvbWV0aGluZ0JlZm9yZTtcbiAgICAgICAgICAgICAgaWYgKGRvUmVuZGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kID0gKGNvbXBvbmVudENsYXNzIGFzIGFueSlbY29tbW9uTWV0aG9kTmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVuZGVyZWRTb21ldGhpbmcgPSBjb21wb25lbnRDbGFzc19jb21tb25NZXRob2Qoe1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzQXBwcm9hY2g6IHRoaXMuX19wcm9jZXNzQXBwcm9hY2gsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhc3M6IHJlbmRlclBhc3MsXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NTdGFnZTogc3RhZ2UsXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IHRoaXMuX19yZW5kZXJQYXNzVGlja0NvdW50LFxuICAgICAgICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzLFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5SWR4OiAwLFxuICAgICAgICAgICAgICAgICAgICBlbmdpbmU6IHRoaXMsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIHJlbmRlclBhc3MuX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlID0gcmVuZGVyZWRTb21ldGhpbmc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChjb21wb25lbnRUaWQgPT09IFdlbGxLbm93bkNvbXBvbmVudFRJRHMuRWZmZWtzZWVyQ29tcG9uZW50VElEICYmIHJlbmRlclBhc3MuZW50aXRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5ID0gdGhpcy53ZWJnbFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50VGV4dHVyZTJEQmluZGluZ3MgPSB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeS5nZXRDdXJyZW50VGV4dHVyZTJEQmluZGluZ3NGb3JFZmZla3NlZXIoKTtcbiAgICAgICAgICAgICAgICB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeS5zZXRXZWJHTFN0YXRlVG9EZWZhdWx0Rm9yRWZmZWtzZWVyKCk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnRpdHkgb2YgcmVuZGVyUGFzcy5lbnRpdGllcykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgZWZmZWtzZWVyQ29tcG9uZW50ID0gZW50aXR5LnRyeVRvR2V0RWZmZWtzZWVyKCk7XG4gICAgICAgICAgICAgICAgICBpZiAoZWZmZWtzZWVyQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50LiRyZW5kZXIoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkucmVzdG9yZVRleHR1cmUyREJpbmRpbmdzRm9yRWZmZWtzZWVyKGN1cnJlbnRUZXh0dXJlMkRCaW5kaW5ncyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQrKztcblxuICAgICAgICAgICAgICByZW5kZXJQYXNzLl9jb3B5RnJhbWVidWZmZXJUb1Jlc29sdmVGcmFtZWJ1ZmZlcnNXZWJHTCgpO1xuXG4gICAgICAgICAgICAgIHJlbmRlclBhc3MuZG9Qb3N0UmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgQW5pbWF0aW9uQ29tcG9uZW50LmdldElzQW5pbWF0aW5nKHRoaXMpIHx8XG4gICAgICAgICAgVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50Q2FtZXJhVXBkYXRlQ291bnQodGhpcykgIT09IHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICAgICAgQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICAgICAgUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50KCkgIT09IHRoaXMuX19sYXN0UHJpbWl0aXZlQ291bnQgfHxcbiAgICAgICAgICBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudFxuICAgICAgICApIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFRpZCBvZiBjb21wb25lbnRUaWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50Q2xhc3MoY29tcG9uZW50VGlkKSE7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCA9IChjb21wb25lbnRDbGFzcyBhcyBhbnkpW2NvbW1vbk1ldGhvZE5hbWVdO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCkge1xuICAgICAgICAgICAgICBjb21wb25lbnRDbGFzc19jb21tb25NZXRob2Qoe1xuICAgICAgICAgICAgICAgIHByb2Nlc3NBcHByb2FjaDogdGhpcy5fX3Byb2Nlc3NBcHByb2FjaCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzOiB2b2lkIDAsXG4gICAgICAgICAgICAgICAgcHJvY2Vzc1N0YWdlOiBzdGFnZSxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50OiB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICAgICAgICAgICAgICBkaXNwbGF5SWR4OiAwLFxuICAgICAgICAgICAgICAgIGVuZ2luZTogdGhpcyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbXBvbmVudENsYXNzLnByb2Nlc3ModGhpcywgY29tcG9uZW50Q2xhc3MsIHN0YWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzdGFnZSA9PT0gUHJvY2Vzc1N0YWdlLkxvZ2ljKSB7XG4gICAgICAgIC8vIFRoZSB0cmFuc2Zvcm0gZ2l6bW9zIGtlZXAgYSBjb25zdGFudCBvbi1zY3JlZW4gc2l6ZSwgc28gdGhleSBoYXZlIHRvIGJlIHJlc2NhbGVkXG4gICAgICAgIC8vIGFmdGVyIHRoZSBDYW1lcmFDb21wb25lbnQgKFRJRCA5KSBoYXMgdXBkYXRlZCBpdHMgbWF0cmljZXMuIFRoaXMgcnVucyBvdXRzaWRlIHRoZVxuICAgICAgICAvLyBjaGFuZ2UgZ2F0ZSBhYm92ZSBzbyB0aGF0IGEgZnJhbWUgd2hpY2ggc2tpcHMgdGhlIExvZ2ljIHN0YWdlIHN0aWxsIGNvcnJlY3RzIHRoZW0uXG4gICAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX3VwZGF0ZVRyYW5zZm9ybUdpem1vc0J5Q2FtZXJhQ2hhbmdlKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50Q2FtZXJhVXBkYXRlQ291bnQodGhpcyk7XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKTtcbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKTtcbiAgICB0aGlzLl9fbGFzdFByaW1pdGl2ZUNvdW50ID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUNvdW50KCk7XG4gICAgdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpO1xuICB9XG5cbiAgc3RhdGljIGdldCBwcm9jZXNzVGltZSgpIHtcbiAgICByZXR1cm4gVGltZS5sYXN0VGltZVRpbWVJbnRlcnZhbEluTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgc3RhdGljIGdldCB0aW1lQXRQcm9jZXNzQmVnaW4oKSB7XG4gICAgcmV0dXJuIFRpbWUudGltZUF0UHJvY2Vzc0JlZ2luTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgc3RhdGljIGdldCB0aW1lQXRQcm9jZXNzRW5kKCkge1xuICAgIHJldHVybiBUaW1lLnRpbWVBdFByb2Nlc3NFbmRNaWxsaXNlY29uZHM7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUNhbWVyYShlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGNhbWVyYUVudGl0eSA9IGNyZWF0ZUNhbWVyYUVudGl0eShlbmdpbmUsIHRydWUpO1xuICAgIGNhbWVyYUVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbiA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgMV0pO1xuICAgIGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS50eXBlID0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWM7XG4gICAgY2FtZXJhRW50aXR5LmdldENhbWVyYSgpLnpOZWFyID0gMC4xO1xuICAgIGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS56RmFyID0gMTAwMDA7XG4gICAgY29uc3Qgd2ViQ0dBcGlSZXBvc2l0b3J5ID0gZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNvbnN0IFt3aWR0aCwgaGVpZ2h0XSA9IHdlYkNHQXBpUmVwb3NpdG9yeS5nZXRDYW52YXNTaXplKCk7XG4gICAgY2FtZXJhRW50aXR5LmdldENhbWVyYSgpLnhNYWcgPSB3aWR0aCAvIGhlaWdodDtcbiAgICBjYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkueU1hZyA9IDE7XG4gIH1cblxuICBwcml2YXRlIHNldFZpZXdwb3J0Rm9yTm9ybWFsUmVuZGVyaW5nKHJlbmRlclBhc3M6IFJlbmRlclBhc3MpIHtcbiAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBjb25zdCB3ZWJBUlN5c3RlbSA9IHRoaXMuX193ZWJBUlN5c3RlbTtcbiAgICBpZiAoKCF3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgfHwgIXJlbmRlclBhc3MuaXNWclJlbmRlcmluZykgJiYgIXdlYkFSU3lzdGVtPy5pc1dlYkFSTW9kZSkge1xuICAgICAgKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuc2V0Vmlld3BvcnQodGhpcywgcmVuZGVyUGFzcy5nZXRWaWV3cG9ydCgpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyB0aGUgcGFzcydzIHNjaXNzb3IgcmVjdGFuZ2xlIGZvciBub3JtYWwgKG5vbi1YUikgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBUaGUgc2Npc3NvciBpcyBhIGN1bGxpbmcgaGludDsgWFIvQVIgcGFzc2VzIHVzZSB0aGVpciBvd24gdmlld3BvcnRzLCBzbyB0aGV5XG4gICAqIHJ1biB3aXRob3V0IG9uZS5cbiAgICovXG4gIHByaXZhdGUgc2V0U2Npc3NvckZvck5vcm1hbFJlbmRlcmluZyhyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gICAgY29uc3Qgd2ViQVJTeXN0ZW0gPSB0aGlzLl9fd2ViQVJTeXN0ZW07XG4gICAgY29uc3QgcmVwb3NpdG9yeSA9IHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBpZiAoKCF3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgfHwgIXJlbmRlclBhc3MuaXNWclJlbmRlcmluZykgJiYgIXdlYkFSU3lzdGVtPy5pc1dlYkFSTW9kZSkge1xuICAgICAgcmVwb3NpdG9yeS5zZXRTY2lzc29yUmVjdChyZW5kZXJQYXNzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVwb3NpdG9yeS5zZXRTY2lzc29yUmVjdCh1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYmluZEZyYW1lYnVmZmVyV2ViR0wocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICAgIGNvbnN0IHdlYkFSU3lzdGVtID0gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICAgIGlmICh3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUgJiYgcmVuZGVyUGFzcy5pc091dHB1dEZvclZyKSB7XG4gICAgICBjb25zdCBnbHcgPSAodGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciE7XG4gICAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHdlYlhSU3lzdGVtLmZyYW1lYnVmZmVyISk7XG4gICAgfSBlbHNlIGlmICh3ZWJBUlN5c3RlbT8uaXNXZWJBUk1vZGUpIHtcbiAgICAgIGNvbnN0IGdsdyA9ICh0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyITtcbiAgICAgIGNvbnN0IGdsID0gZ2x3LmdldFJhd0NvbnRleHQoKTtcbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgd2ViQVJTeXN0ZW0uZnJhbWVidWZmZXIhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuYmluZEZyYW1lYnVmZmVyKHJlbmRlclBhc3MuZ2V0RnJhbWVidWZmZXIoKSk7XG4gICAgICAodGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5zZXREcmF3VGFyZ2V0cyhyZW5kZXJQYXNzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fZGlzcGxheVJuSW5mbygpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGAlY1Job2Rvbml0ZSVjV2ViM0QgTGlicmFyeSVjICVjdmVyc2lvbiVjJHtWRVJTSU9OLnZlcnNpb259JWMgJWNicmFuY2glYyR7VkVSU0lPTi5icmFuY2h9JWMgJWNtb2RlJWMke3RoaXMuX19wcm9jZXNzQXBwcm9hY2guc3RyfWAsXG4gICAgICAnZm9udC13ZWlnaHQ6IGJvbGQ7IHBhZGRpbmc6IDRweCA4cHg7IGJvcmRlci1yYWRpdXM6IDZweCAwcHggMHB4IDZweDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCAjZmYwMDg0IDAlLCNmZjAwMjIgMTAwJSk7JyxcbiAgICAgICdwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDBweCA2cHggNnB4IDBweDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCAjODQwMGZmIDAlLCM0NDAwZmYgMTAwJSk7JyxcbiAgICAgICcnLFxuICAgICAgJ2JhY2tncm91bmQ6ICM2NjY7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogNnB4IDBweCAwcHggNnB4JyxcbiAgICAgICdiYWNrZ3JvdW5kOiBmaXJlYnJpY2s7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogMHB4IDZweCA2cHggMHB4JyxcbiAgICAgICcnLFxuICAgICAgJ2JhY2tncm91bmQ6ICM2NjY7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogNnB4IDBweCAwcHggNnB4JyxcbiAgICAgICdiYWNrZ3JvdW5kOiBncmVlbjsgcGFkZGluZzogNHB4OyBib3JkZXItcmFkaXVzOiAwcHggNnB4IDZweCAwcHgnLFxuICAgICAgJycsXG4gICAgICAnYmFja2dyb3VuZDogIzY2NjsgcGFkZGluZzogNHB4OyBib3JkZXItcmFkaXVzOiA2cHggMHB4IDBweCA2cHgnLFxuICAgICAgJ2JhY2tncm91bmQ6IGJsdWU7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogMHB4IDZweCA2cHggMHB4J1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgUmhvZG9uaXRlIHN5c3RlbS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogRG9uJ3QgZm9yZ2V0IGBhd2FpdGAgdG8gdXNlIHRoaXMgbWV0aG9kLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGBcbiAgICogY29uc3QgZW5naW5lID0gYXdhaXQgUm4uRW5naW5lLmluaXQoe1xuICAgKiAgIGFwcHJvYWNoOiBSbi5Qcm9jZXNzQXBwcm9hY2guV2ViR0wyLFxuICAgKiAgIGNhbnZhczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmxkJykgYXMgSFRNTENhbnZhc0VsZW1lbnQsXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGRlc2NcbiAgICogQHJldHVybnNcbiAgICovXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIGNvbXBvbmVudCBjbGFzc2VzIHRoZSBlbmdpbmUgaXRzZWxmIHByb2Nlc3NlcyBldmVyeSBmcmFtZS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogT3RoZXIgY29tcG9uZW50IGNsYXNzZXMgYXJlIHJlZ2lzdGVyZWQgb24gZmlyc3QgdXNlIGJ5IGBFbnRpdHlSZXBvc2l0b3J5LmFkZENvbXBvbmVudFRvRW50aXR5YC5cbiAgICogVGhlIGNvcmUgY2xhc3NlcyBhcmUgcmVnaXN0ZXJlZCBoZXJlIGJlY2F1c2UgdGhlIHJlbmRlciBsb29wIGxvb2tzIHVwIHRoZSBNZXNoUmVuZGVyZXJDb21wb25lbnQgY2xhc3NcbiAgICogYnkgaXRzIENvbXBvbmVudFRJRCwgYmVjYXVzZSBTa2VsZXRhbENvbXBvbmVudCdzIGJvbmUgZGF0YSBtZW1iZXJzIG11c3QgYmUgcmVnaXN0ZXJlZCBiZWZvcmUgYW55IHNoYWRlciBpc1xuICAgKiBnZW5lcmF0ZWQsIGFuZCBiZWNhdXNlIGVudGl0eSBoZWxwZXJzIHN1Y2ggYXMgYGNyZWF0ZUdyb3VwRW50aXR5YCBhbmQgYGNyZWF0ZU1lc2hFbnRpdHlgIGFkZFxuICAgKiB0aGVtIGJ5IENvbXBvbmVudFRJRDogaW1wb3J0aW5nIHRoZSBjbGFzc2VzIHRoZXJlIHdvdWxkIGNyZWF0ZSBjaXJjdWxhciBpbXBvcnRzIGJldHdlZW4gdGhlXG4gICAqIGNvbXBvbmVudHMsIHRoZSBnaXptb3MgYW5kIHRoZSBtZXNoIGhlbHBlcnMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX3JlZ2lzdGVyQ29yZUNvbXBvbmVudENsYXNzZXMoKSB7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKFRyYW5zZm9ybUNvbXBvbmVudCk7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKFNjZW5lR3JhcGhDb21wb25lbnQpO1xuICAgIENvbXBvbmVudFJlcG9zaXRvcnkuX2Vuc3VyZUNvbXBvbmVudENsYXNzUmVnaXN0ZXJlZChNZXNoQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoTWVzaFJlbmRlcmVyQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoQ2FtZXJhQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCk7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKExpZ2h0Q29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoQW5pbWF0aW9uQ29tcG9uZW50KTtcbiAgICAvLyBTa2VsZXRhbENvbXBvbmVudCByZWdpc3RlcnMgaXRzIGJvbmUgZGF0YSBtZW1iZXJzIHdoZW4gaXRzIG1vZHVsZSBpcyBldmFsdWF0ZWQsIGFuZCBldmVyeSBnZW5lcmF0ZWRcbiAgICAvLyBzaGFkZXIgZGVjbGFyZXMgdGhlIGJvbmUgZGF0YSBnZXR0ZXJzIChnZXRfYm9uZURhdGEgZXRjLiksIHNvIHRoZSBjbGFzcyBtdXN0IGJlIHBhcnQgb2YgdGhlIGNvcmVcbiAgICAvLyBldmVuIGluIGFwcGxpY2F0aW9ucyB3aXRob3V0IHNraW5uZWQgbWVzaGVzLlxuICAgIENvbXBvbmVudFJlcG9zaXRvcnkuX2Vuc3VyZUNvbXBvbmVudENsYXNzUmVnaXN0ZXJlZChTa2VsZXRhbENvbXBvbmVudCk7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGluaXQoZGVzYzogRW5naW5lSW5pdERlc2NyaXB0aW9uKTogUHJvbWlzZTxFbmdpbmU+IHtcbiAgICBpZiAoXG4gICAgICBkZXNjLmFwcHJvYWNoICE9PSBQcm9jZXNzQXBwcm9hY2guTm9uZSAmJlxuICAgICAgZGVzYy5hcHByb2FjaCAhPT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdMMiAmJlxuICAgICAgZGVzYy5hcHByb2FjaCAhPT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVVxuICAgICkge1xuICAgICAgY29uc3QgdmFsdWUgPSAoZGVzYy5hcHByb2FjaCBhcyBhbnkpPy5zdHIgPz8gU3RyaW5nKGRlc2MuYXBwcm9hY2gpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgVW5zdXBwb3J0ZWQgcHJvY2VzcyBhcHByb2FjaCBcIiR7dmFsdWV9XCIuIFRoZSBcIlVuaWZvcm1cIiBhbmQgXCJEYXRhVGV4dHVyZVwiIG1vZGVzIHdlcmUgcmVtb3ZlZC4gVXNlIFByb2Nlc3NBcHByb2FjaC5XZWJHTDIgKFwiV2ViR0wyXCIpIG9yIFByb2Nlc3NBcHByb2FjaC5XZWJHUFUgKFwiV2ViR1BVXCIpLmBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIgJiYgdHlwZW9mIF9fUk5fV0VCR0xfXyAhPT0gJ3VuZGVmaW5lZCcgJiYgIV9fUk5fV0VCR0xfXykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9jZXNzQXBwcm9hY2guV2ViR0wyIGlzIHVuYXZhaWxhYmxlOiB0aGlzIGJ1aWxkIHdhcyBidW5kbGVkIHdpdGggX19STl9XRUJHTF9fID0gZmFsc2UuJyk7XG4gICAgfVxuICAgIGlmIChkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVICYmIHR5cGVvZiBfX1JOX1dFQkdQVV9fICE9PSAndW5kZWZpbmVkJyAmJiAhX19STl9XRUJHUFVfXykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcm9jZXNzQXBwcm9hY2guV2ViR1BVIGlzIHVuYXZhaWxhYmxlOiB0aGlzIGJ1aWxkIHdhcyBidW5kbGVkIHdpdGggX19STl9XRUJHUFVfXyA9IGZhbHNlLicpO1xuICAgIH1cblxuICAgIEVuZ2luZS5fX3JlZ2lzdGVyQ29yZUNvbXBvbmVudENsYXNzZXMoKTtcblxuICAgIC8vIFRoZSBQQlIgbW9kdWxlICh0aGUgc2hlZW4gTFVUIGltYWdlKSBpcyBsb2FkZWQgb24gZGVtYW5kIGJ5IER1bW15VGV4dHVyZXMucmVxdWVzdFNoZWVuTHV0VGV4dHVyZSgpLlxuICAgIC8vIFRoZSBYUiBzdXBwb3J0IHB1bGxzIGluIHRoZSBnbFRGIGltcG9ydGVyIChjb250cm9sbGVyIG1vZGVscyksIHNvIGl0IGlzIGxvYWRlZCBvbmx5IHdoZW4gcmVxdWVzdGVkLlxuICAgIGNvbnN0IHJuWFJNb2R1bGUgPVxuICAgICAgKGRlc2MueHIgPz8gRW5naW5lLl9sb2FkWFJCeURlZmF1bHQpID8gKChhd2FpdCBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkubG9hZE1vZHVsZSgneHInKSkgYXMgUm5YUikgOiB1bmRlZmluZWQ7XG5cbiAgICBsZXQgbWF4R1BVRGF0YVN0b3JhZ2VTaXplOiBCeXRlID0gMDtcbiAgICBsZXQgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk6IElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgLy8gV2ViR1BVXG4gICAgICBhd2FpdCBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkubG9hZE1vZHVsZSgnd2ViZ3B1Jyk7XG5cbiAgICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9XG4gICAgICAgIENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSgpIGFzIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICAgIGNvbnN0IHdlYmdwdU1vZHVsZSA9IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5nZXRNb2R1bGUoJ3dlYmdwdScpO1xuICAgICAgY29uc3QgV2ViR3B1RGV2aWNlV3JhcHBlckNsYXNzID0gd2ViZ3B1TW9kdWxlLldlYkdwdURldmljZVdyYXBwZXIgYXMgdHlwZW9mIFdlYkdwdURldmljZVdyYXBwZXI7XG4gICAgICBjb25zdCBhZGFwdGVyID0gYXdhaXQgbmF2aWdhdG9yLmdwdS5yZXF1ZXN0QWRhcHRlcih7IHhyQ29tcGF0aWJsZTogdHJ1ZSB9KTtcbiAgICAgIGNvbnN0IHsgbWF4QnVmZmVyU2l6ZSwgbWF4U3RvcmFnZUJ1ZmZlckJpbmRpbmdTaXplIH0gPSBhZGFwdGVyIS5saW1pdHM7XG4gICAgICBjb25zdCBmZWF0dXJlczogR1BVRmVhdHVyZU5hbWVbXSA9IFtdO1xuICAgICAgZnVuY3Rpb24gYWRkRmVhdHVyZShmZWF0dXJlOiBHUFVGZWF0dXJlTmFtZSkge1xuICAgICAgICBpZiAoYWRhcHRlciEuZmVhdHVyZXMuaGFzKGZlYXR1cmUpKSB7XG4gICAgICAgICAgZmVhdHVyZXMucHVzaChmZWF0dXJlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYWRkRmVhdHVyZSgnZmxvYXQzMi1maWx0ZXJhYmxlJyk7XG4gICAgICBhZGRGZWF0dXJlKCdyZzExYjEwdWZsb2F0LXJlbmRlcmFibGUnKTtcbiAgICAgIGFkZEZlYXR1cmUoJ3RleHR1cmUtY29tcHJlc3Npb24tYmMnKTtcbiAgICAgIGFkZEZlYXR1cmUoJ3RleHR1cmUtY29tcHJlc3Npb24tZXRjMicpO1xuICAgICAgYWRkRmVhdHVyZSgndGV4dHVyZS1jb21wcmVzc2lvbi1hc3RjJyk7XG4gICAgICAvLyBVc2VkIGJ5IHRoZSBHUFUgdGltZXIgKEVuZ2luZS5ncHVUaW1lckVuYWJsZWQpLiBFbmFibGluZyB0aGUgZmVhdHVyZSBoYXMgbm8gY29zdCB1bnRpbCBpdCBpcyB1c2VkLlxuICAgICAgYWRkRmVhdHVyZSgndGltZXN0YW1wLXF1ZXJ5Jyk7XG5cbiAgICAgIGNvbnN0IGRldmljZSA9IGF3YWl0IGFkYXB0ZXIhLnJlcXVlc3REZXZpY2Uoe1xuICAgICAgICByZXF1aXJlZEZlYXR1cmVzOiBmZWF0dXJlcyxcbiAgICAgICAgcmVxdWlyZWRMaW1pdHM6IHtcbiAgICAgICAgICBtYXhTdG9yYWdlQnVmZmVyQmluZGluZ1NpemUsXG4gICAgICAgICAgbWF4QnVmZmVyU2l6ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgbWF4R1BVRGF0YVN0b3JhZ2VTaXplID0gbWF4U3RvcmFnZUJ1ZmZlckJpbmRpbmdTaXplO1xuICAgICAgY29uc3Qgd2ViR3B1RGV2aWNlV3JhcHBlciA9IG5ldyBXZWJHcHVEZXZpY2VXcmFwcGVyQ2xhc3MoZGVzYy5jYW52YXMsIGFkYXB0ZXIhLCBkZXZpY2UpO1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmFkZFdlYkdwdURldmljZVdyYXBwZXIod2ViR3B1RGV2aWNlV3JhcHBlcik7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkucmVjcmVhdGVTeXN0ZW1EZXB0aFRleHR1cmUoKTtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jcmVhdGVCaW5kR3JvdXBMYXlvdXRGb3JEcmF3UGFyYW1ldGVycygpO1xuICAgICAgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgfSBlbHNlIGlmIChkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyKSB7XG4gICAgICAvLyBXZWJHTFxuICAgICAgYXdhaXQgTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmxvYWRNb2R1bGUoJ3dlYmdsJyk7XG5cbiAgICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkoKTtcbiAgICAgIChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuZ2VuZXJhdGVXZWJHTENvbnRleHQoXG4gICAgICAgIGRlc2MuY29uZmlnID8/IG5ldyBDb25maWcoKSxcbiAgICAgICAgZGVzYy5jYW52YXMsXG4gICAgICAgIHRydWUsXG4gICAgICAgIGRlc2Mud2ViZ2xPcHRpb25cbiAgICAgICk7XG4gICAgICAoY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLnN3aXRjaERlcHRoVGVzdCh0cnVlKTtcbiAgICAgIG1heEdQVURhdGFTdG9yYWdlU2l6ZSA9XG4gICAgICAgIChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIhLmdldE1heFRleHR1cmVTaXplKCkgKiogMiAqXG4gICAgICAgIDQgLyogcmdiYSAqLyAqXG4gICAgICAgIDQgLyogYnl0ZSAqLztcbiAgICB9IGVsc2Uge1xuICAgICAgbWF4R1BVRGF0YVN0b3JhZ2VTaXplID0gMTAyNCAqKiAyICogNCAvKiByZ2JhICovICogNCAvKiBieXRlICovO1xuICAgIH1cblxuICAgIGNvbnN0IGVuZ2luZSA9IG5ldyBFbmdpbmUoZGVzYy5hcHByb2FjaCwgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkhLCBtYXhHUFVEYXRhU3RvcmFnZVNpemUsIGRlc2MuY29uZmlnLCByblhSTW9kdWxlKTtcbiAgICBlbmdpbmUuX19lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID0gZGVzYy5hcHByb2FjaDtcbiAgICBlbmdpbmUuX19jb25maWcuZXZlbnRUYXJnZXREb20gPSBlbmdpbmUuX19jb25maWcuZXZlbnRUYXJnZXREb20gPz8gZGVzYy5jYW52YXM7XG4gICAgaWYgKGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGVuZ2luZS5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB9XG4gICAgaWYgKGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIpIHtcbiAgICAgIGVuZ2luZS5fX3dlYmdsUmVzb3VyY2VSZXBvc2l0b3J5ID0gY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgfVxuICAgIGVuZ2luZS5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5ID0gY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkhO1xuXG4gICAgaWYgKGRlc2Mubm90VG9EaXNwbGF5Um5JbmZvQXRJbml0ICE9PSB0cnVlKSB7XG4gICAgICBlbmdpbmUuX19kaXNwbGF5Um5JbmZvKCk7XG4gICAgfVxuXG4gICAgY29uc3QgZ2xvYmFsRGF0YVJlcG9zaXRvcnkgPSBlbmdpbmUuX19nbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgICBnbG9iYWxEYXRhUmVwb3NpdG9yeS5pbml0aWFsaXplKGRlc2MuYXBwcm9hY2gpO1xuXG4gICAgaWYgKGRlc2MuY2FudmFzICE9IG51bGwgJiYgZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdMMikge1xuICAgICAgLy8gRGVhbCB3aXRoIFdlYkdMIGNvbnRleHQgbG9zdCBhbmQgcmVzdG9yZVxuICAgICAgZGVzYy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ3dlYmdsY29udGV4dGxvc3QnLFxuICAgICAgICAoKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICAgIC8vIENhbGxpbmcgcHJldmVudERlZmF1bHQgc2lnbmFscyB0byB0aGUgcGFnZSB0aGF0IHlvdSBpbnRlbnQgdG8gaGFuZGxlIGNvbnRleHQgcmVzdG9yYXRpb24uXG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBlbmdpbmUuc3RvcFJlbmRlckxvb3AoKTtcbiAgICAgICAgICBlbmdpbmUubG9nZ2VyLmVycm9yKCdXZWJHTCBjb250ZXh0IGxvc3Qgb2NjdXJyZWQuJyk7XG4gICAgICAgIH0pLmJpbmQodGhpcylcbiAgICAgICk7XG5cbiAgICAgIGRlc2MuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dHJlc3RvcmVkJywgKCkgPT4ge1xuICAgICAgICAvLyBPbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHRoZSBnbCBjb250ZXh0IHdpbGwgYmUgcmVzdG9yZWQgYnV0IGFueSBncmFwaGljcyByZXNvdXJjZXNcbiAgICAgICAgLy8gdGhhdCB3ZXJlIHByZXZpb3VzbHkgbG9hZGVkIHdpbGwgYmUgbG9zdCwgc28gdGhlIHNjZW5lIHNob3VsZCBiZSByZWxvYWRlZC5cbiAgICAgICAgZW5naW5lLmxvZ2dlci5lcnJvcignV2ViR0wgY29udGV4dCByZXN0b3JlZC4nKTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IHJlc3RvcmluZyB0aGUgcHJldmlvdXMgZ3JhcGhpY3MgcmVzb3VyY2VzXG4gICAgICAgIC8vIGxvYWRTY2VuZUdyYXBoaWNzKGdsKTtcbiAgICAgICAgZW5naW5lLnJlc3RhcnRSZW5kZXJMb29wKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBlbmdpbmUuX19kdW1teVRleHR1cmVzID0gYXdhaXQgRHVtbXlUZXh0dXJlcy5pbml0KGVuZ2luZSk7XG5cbiAgICBlbmdpbmUuX19lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvID0gZGVzYy5jYW52YXMgIT0gbnVsbCA/IGRlc2MuY2FudmFzLndpZHRoIC8gZGVzYy5jYW52YXMuaGVpZ2h0IDogMTtcblxuICAgIHJldHVybiBlbmdpbmU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHByb2Nlc3NBcHByb2FjaCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3Byb2Nlc3NBcHByb2FjaDtcbiAgfVxuXG4gIHB1YmxpYyByZXNpemVDYW52YXMod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcbiAgICBjb25zdCByZXBvID0gdGhpcy5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICByZXBvLnJlc2l6ZUNhbnZhcyh3aWR0aCwgaGVpZ2h0KTtcbiAgICB0aGlzLl9fZW5naW5lU3RhdGUudmlld3BvcnRBc3BlY3RSYXRpbyA9IHdpZHRoIC8gaGVpZ2h0O1xuICB9XG5cbiAgcHVibGljIGdldENhbnZhc1NpemUoKSB7XG4gICAgY29uc3QgcmVwbyA9IHRoaXMuY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgcmV0dXJuIHJlcG8uZ2V0Q2FudmFzU2l6ZSgpO1xuICB9XG5cbiAgcHVibGljIGdldEN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyKCkge1xuICAgIHJldHVybiAodGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZW50aXR5UmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2VudGl0eVJlcG9zaXRvcnk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbXBvbmVudFJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19jb21wb25lbnRSZXBvc2l0b3J5O1xuICB9XG5cbiAgcHVibGljIGdldCBjb21wb25lbnRNZW1vcnlSZWdpc3RyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBXZWJYUiAoVlIpIHN5c3RlbS5cbiAgICogQHRocm93cyBJZiB0aGUgWFIgc3VwcG9ydCBpcyBub3QgZW5hYmxlZCAoc2VlIHtAbGluayBlbmFibGVYUn0gYW5kIGBFbmdpbmVJbml0RGVzY3JpcHRpb24ueHJgKVxuICAgKi9cbiAgcHVibGljIGdldCB3ZWJYUlN5c3RlbSgpOiBXZWJYUlN5c3RlbSB7XG4gICAgaWYgKHRoaXMuX193ZWJYUlN5c3RlbSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRW5naW5lLl9feHJOb3RFbmFibGVkTWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gIH1cblxuICAvKipcbiAgICogVGhlIFdlYkFSIHN5c3RlbS5cbiAgICogQHRocm93cyBJZiB0aGUgWFIgc3VwcG9ydCBpcyBub3QgZW5hYmxlZCAoc2VlIHtAbGluayBlbmFibGVYUn0gYW5kIGBFbmdpbmVJbml0RGVzY3JpcHRpb24ueHJgKVxuICAgKi9cbiAgcHVibGljIGdldCB3ZWJBUlN5c3RlbSgpOiBXZWJBUlN5c3RlbSB7XG4gICAgaWYgKHRoaXMuX193ZWJBUlN5c3RlbSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRW5naW5lLl9feHJOb3RFbmFibGVkTWVzc2FnZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fd2ViQVJTeXN0ZW07XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgWFIgc3VwcG9ydCAoV2ViWFIgYW5kIFdlYkFSIHN5c3RlbXMpIGlzIGVuYWJsZWQuICovXG4gIHB1YmxpYyBnZXQgaXNYUkVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX193ZWJYUlN5c3RlbSAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBXZWJYUiBzeXN0ZW0sIG9yIHVuZGVmaW5lZCB3aGVuIHRoZSBYUiBzdXBwb3J0IGlzIG5vdCBlbmFibGVkLlxuICAgKiBJbnRlcm5hbCBjb2RlIHVzZXMgaXQgc28gdGhhdCByZW5kZXJpbmcgd2l0aG91dCBYUiBuZXZlciBuZWVkcyB0aGUgWFIgbW9kdWxlLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBnZXQgX3dlYlhSU3lzdGVtSWZFbmFibGVkKCk6IFdlYlhSU3lzdGVtIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBXZWJBUiBzeXN0ZW0sIG9yIHVuZGVmaW5lZCB3aGVuIHRoZSBYUiBzdXBwb3J0IGlzIG5vdCBlbmFibGVkLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBnZXQgX3dlYkFSU3lzdGVtSWZFbmFibGVkKCk6IFdlYkFSU3lzdGVtIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgdGhlIFdlYlhSL1dlYkFSIHN1cHBvcnQgYWZ0ZXIgaW5pdGlhbGl6YXRpb24gYnkgbG9hZGluZyB0aGUgWFIgbW9kdWxlLlxuICAgKiBEb2VzIG5vdGhpbmcgd2hlbiBpdCBpcyBhbHJlYWR5IGVuYWJsZWQgKGUuZy4gYnkgYEVuZ2luZS5pbml0KHsgeHI6IHRydWUgfSlgKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFdlYlhSIHN5c3RlbVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHdlYlhSU3lzdGVtID0gYXdhaXQgZW5naW5lLmVuYWJsZVhSKCk7XG4gICAqIGF3YWl0IHdlYlhSU3lzdGVtLnJlYWR5Rm9yV2ViWFIoYnV0dG9uRWxlbWVudCwgYmFzZVBhdGgpO1xuICAgKiBgYGBcbiAgICovXG4gIHB1YmxpYyBhc3luYyBlbmFibGVYUigpOiBQcm9taXNlPFdlYlhSU3lzdGVtPiB7XG4gICAgaWYgKHRoaXMuX193ZWJYUlN5c3RlbSA9PSBudWxsKSB7XG4gICAgICBjb25zdCByblhSTW9kdWxlID0gKGF3YWl0IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5sb2FkTW9kdWxlKCd4cicpKSBhcyBSblhSO1xuICAgICAgaWYgKHRoaXMuX193ZWJYUlN5c3RlbSA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX19pbml0WFJTeXN0ZW1zKHJuWFJNb2R1bGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3dlYlhSU3lzdGVtITtcbiAgfVxuXG4gIHByaXZhdGUgX19pbml0WFJTeXN0ZW1zKHJuWFJNb2R1bGU6IFJuWFIpIHtcbiAgICB0aGlzLl9fd2ViWFJTeXN0ZW0gPSByblhSTW9kdWxlLldlYlhSU3lzdGVtLmluaXQodGhpcyk7XG4gICAgdGhpcy5fX3dlYkFSU3lzdGVtID0gcm5YUk1vZHVsZS5XZWJBUlN5c3RlbS5pbml0KHRoaXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX194ck5vdEVuYWJsZWRNZXNzYWdlID1cbiAgICAnVGhlIFhSIHN1cHBvcnQgaXMgbm90IGVuYWJsZWQuIEluaXRpYWxpemUgdGhlIGVuZ2luZSB3aXRoIEVuZ2luZS5pbml0KHsgeHI6IHRydWUgfSkgb3IgY2FsbCAnICtcbiAgICAnYXdhaXQgZW5naW5lLmVuYWJsZVhSKCkgZmlyc3QuIFRoZSBkZWZhdWx0IFJuIG5hbWVzcGFjZSBleHBvcnQgZW5hYmxlcyBpdCBhdXRvbWF0aWNhbGx5Lic7XG5cbiAgcHVibGljIGdldCBtZW1vcnlNYW5hZ2VyKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWVtb3J5TWFuYWdlciE7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGdsb2JhbERhdGFSZXBvc2l0b3J5KCkge1xuICAgIHJldHVybiB0aGlzLl9fZ2xvYmFsRGF0YVJlcG9zaXRvcnk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHN5c3RlbSB0aGF0IGJ1aWxkcyB0aGUgbGlnaHQgbGlzdHMgb2YgQ2x1c3RlcmVkIEZvcndhcmQgcmVuZGVyaW5nLlxuICAgKi9cbiAgcHVibGljIGdldCBsaWdodENsdXN0ZXJTeXN0ZW0oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19saWdodENsdXN0ZXJTeXN0ZW07XG4gIH1cblxuICBwdWJsaWMgZ2V0IG1hdGVyaWFsUmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsUmVwb3NpdG9yeTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeSE7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5KCkge1xuICAgIHJldHVybiB0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSE7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGR1bW15VGV4dHVyZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kdW1teVRleHR1cmVzITtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZW5naW5lU3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmVTdGF0ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY29uZmlnKCkge1xuICAgIHJldHVybiB0aGlzLl9fY29uZmlnO1xuICB9XG5cbiAgcHVibGljIGdldCBsb2dnZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19sb2dnZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2hhZGVyIHByb2dyYW0gY2FjaGUgZm9yIHRoaXMgZW5naW5lIGluc3RhbmNlLlxuICAgKiBUaGlzIGNhY2hlIG1hcHMgc2hhZGVyIHRleHQgdG8gY29tcGlsZWQgc2hhZGVyIHByb2dyYW0gVUlEcy5cbiAgICogRWFjaCBlbmdpbmUgaGFzIGl0cyBvd24gY2FjaGUgdG8gcHJldmVudCBjcm9zcy1jb250YW1pbmF0aW9uIGJldHdlZW4gV2ViR0wgY29udGV4dHMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHVibGljIGdldCBzaGFkZXJQcm9ncmFtQ2FjaGUoKTogTWFwPHN0cmluZywgbnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMuX19zaGFkZXJQcm9ncmFtQ2FjaGU7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUFTLGVBQWU7QUFLeEIsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyxnQ0FBZ0M7QUFDekMsU0FBUyx1QkFBdUI7QUFDaEMs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
