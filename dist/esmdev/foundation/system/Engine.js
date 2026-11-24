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
import { LightClusterSystemStub } from "../renderer/lightCluster/LightClusterSystemStub.js";
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
    this.iA = ProcessApproach.None;
    this.mA = new EngineState();
    this.nA = 0;
    this.pA = -1;
    this.DA = [];
    this.rA = new LightClusterSystemStub();
    this.IA = false;
    this.g = false;
    this.uA = -1;
    this.Hc = -1;
    this.vA = -1;
    this.Ic = -1;
    /** Shader program cache map for this engine instance. Maps shader text to program UIDs. */
    this.SA = /* @__PURE__ */ new Map();
    this.wA = false;
    this.LA = -1;
    this.sA = config != null ? config : new Config();
    this.HA = new Logger();
    this.HA.logLevel = this.sA.logLevel;
    this.LA = _Engine.KA;
    this.iA = processApproach;
    this.jA = cgApiResourceRepository;
    this.EA = new ComponentMemoryRegistry();
    this.qA = new ComponentRepository(this);
    this.Se = new EntityRepository(this);
    this.FA = new MaterialRepository();
    this.wi = MemoryManager.createInstanceIfNotCreated(this, maxGPUDataStorageSize);
    if (rnXRModule != null) {
      this.MA(rnXRModule);
    }
    this.AA = GlobalDataRepository.init(this);
    _Engine.KA++;
  }
  get engineUid() {
    return this.LA;
  }
  static getEngine(objectUid) {
    const engine = _Engine.JA.get(objectUid);
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
    this.zA = void 0;
    this.DA = [];
    this.Kz();
  }
  /**
   * Internal method that performs the actual resource cleanup.
   * Called after the render loop has fully stopped.
   */
  Kz() {
    var _a, _b;
    this.g = true;
    this.FA._makeShaderInvalidateToAllMaterials();
    const entities = this.Se._getEntities();
    for (const entity of entities) {
      this.Se.deleteEntity(entity.entityUID);
    }
    if (Is.exist(this.tA)) {
      this.tA.destroy();
      this.tA = void 0;
    }
    if (Is.exist(this.kA)) {
      this.kA.clearCache();
      try {
        const deviceWrapper = this.kA.getWebGpuDeviceWrapper();
        if (deviceWrapper) {
          deviceWrapper.context.unconfigure();
        }
      } catch (_e) {
      }
    }
    if (Is.exist(this.wi)) {
      this.wi.destroy();
      this.wi = void 0;
    }
    this.TA();
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
    (_b = this.oA) == null ? void 0 : _b.destroy();
    this.oA = void 0;
    this.EA.destroy();
    this.xA = void 0;
    this.yA = void 0;
    this.nA = 0;
    this.uA = -1;
    this.Hc = -1;
    this.vA = -1;
    _Engine.JA.delete(this.objectUID);
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
    this.zA = renderLoopFunc;
    this.DA = args;
    if (this.pA !== -1) {
      this.stopRenderLoop();
    }
    const animationFrameObject = this.NA();
    this.CA = animationFrameObject;
    const requestAnimationFrame = animationFrameObject.requestAnimationFrame.bind(animationFrameObject);
    const webXRSystem = this.hA;
    const webARSystem = this.lA;
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
      this.pA = requestAnimationFrame(__renderLoopFunc);
    });
    this.pA = requestAnimationFrame(__renderLoopFunc);
  }
  NA() {
    let animationFrameObject = window;
    const webXRSystem = this.hA;
    const webARSystem = this.lA;
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
    const animationFrameObject = (_a = this.CA) != null ? _a : this.NA();
    if (this.pA !== -1) {
      animationFrameObject.cancelAnimationFrame(this.pA);
    }
    this.pA = -1;
    this.CA = void 0;
  }
  /**
   * Restart a render loop.
   */
  restartRenderLoop() {
    if (this.zA != null) {
      this.startRenderLoop(this.zA, ...this.DA);
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
    if (Is.not.exist(this.xA)) {
      const expression = new Expression();
      const renderPassInit = new RenderPass(this);
      renderPassInit.toClearColorBuffer = true;
      renderPassInit.toClearDepthBuffer = true;
      renderPassInit.clearColor = clearColor;
      const renderPassMain = new RenderPass(this);
      expression.addRenderPasses([renderPassInit, renderPassMain]);
      this.xA = expression;
      this.yA = renderPassMain;
    }
    this.yA.clearEntities();
    const entities = this.Se._getEntities();
    this.yA.addEntities(entities);
    this.process([this.xA]);
  }
  process(value) {
    const gpuTimerEnabled = this.wA;
    if (gpuTimerEnabled) {
      this.UA();
    }
    Time._processBegin(this);
    this.VA();
    if (!this.IA && LightComponent.getUpdateCount(this) > 0) {
      this._requestLightClusterSystem();
    }
    let expressions = value;
    if (value instanceof Frame) {
      expressions = value.expressions;
    }
    if (CameraComponent.getCurrent(this) === Component.InvalidObjectUID) {
      _Engine.createCamera(this);
    }
    const time = this.AA.getValue("time", 0);
    time._v[0] = Time.timeFromSystemStart;
    if (this.processApproach === ProcessApproach.WebGPU) {
      this._processWebGPU(expressions);
    } else {
      this._processWebGL(expressions);
    }
    Time._processEnd();
    if (gpuTimerEnabled) {
      this.WA();
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
    return this.wA;
  }
  set gpuTimerEnabled(flag) {
    this.wA = flag;
  }
  /**
   * Whether the GPU time can be measured in this environment.
   * Browsers may not expose GPU timer queries (e.g. for privacy reasons or on some platforms).
   */
  get isGpuTimerSupported() {
    var _a, _b;
    if (this.iA === ProcessApproach.WebGPU) {
      return this.webGpuResourceRepository._getGpuTimer().isSupported;
    }
    return (_b = (_a = this.OA()) == null ? void 0 : _a.isSupported) != null ? _b : false;
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
    if (!this.wA) {
      return void 0;
    }
    if (this.iA === ProcessApproach.WebGPU) {
      return (_a = this.kA) == null ? void 0 : _a._getGpuTimer().lastGpuTimeMilliseconds;
    }
    return (_b = this.oA) == null ? void 0 : _b.lastGpuTimeMilliseconds;
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
    if (!this.wA || this.iA !== ProcessApproach.WebGPU) {
      return void 0;
    }
    return (_a = this.kA) == null ? void 0 : _a._getGpuTimer().lastPassGpuTimesMilliseconds;
  }
  OA() {
    var _a;
    if (this.oA == null) {
      const glw = (_a = this.BA) == null ? void 0 : _a.currentWebGLContextWrapper;
      if (glw == null) {
        return void 0;
      }
      this.oA = new WebGLGpuTimer(glw.getRawContextAsWebGL2());
    }
    return this.oA;
  }
  UA() {
    var _a, _b;
    if (this.iA === ProcessApproach.WebGPU) {
      (_a = this.kA) == null ? void 0 : _a._getGpuTimer().beginFrame();
    } else {
      (_b = this.OA()) == null ? void 0 : _b.begin();
    }
  }
  WA() {
    var _a, _b;
    if (this.iA === ProcessApproach.WebGPU) {
      (_a = this.kA) == null ? void 0 : _a._getGpuTimer().endFrame();
    } else {
      (_b = this.oA) == null ? void 0 : _b.end();
    }
  }
  XA({
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
    this.YA({
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
  ZA({
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
  YA({
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
      (_a = this.mA).webgpuRenderBundleMode || (_a.webgpuRenderBundleMode = doRender);
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
    const componentTids = this.qA.getComponentTIDs();
    const webGpuResourceRepository = this.webGpuResourceRepository;
    const webxrSystem = this.hA;
    for (const stage of Component._processStages) {
      if (stage === ProcessStage.Render) {
        this.rA.update(expressions);
        MeshRendererComponent.common_$prerender(this);
        const isWebXRMode = (_a = webxrSystem == null ? void 0 : webxrSystem.isWebXRMode) != null ? _a : false;
        const isMultiView = (_b = webxrSystem == null ? void 0 : webxrSystem.isMultiView()) != null ? _b : false;
        const xrPose = this.mA.xrPoseWebGPU;
        const displayCount = isWebXRMode && !isMultiView && xrPose != null ? xrPose.views.length : 1;
        const hasAnyEffekseerComponents = this.qA.hasAnyComponent(
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
                renderPassTickCount = this.nA;
                renderPass._isChangedSortRenderResult = false;
                primitiveUids = MeshRendererComponent.sort_$render(this, renderPass);
                if (renderPassTickCountMap != null) {
                  renderPassTickCountMap.set(renderPassUid, renderPassTickCount);
                  primitiveUidsMap.set(renderPassUid, primitiveUids);
                }
              } else {
                primitiveUids = primitiveUidsMap.get(renderPassUid);
              }
              const renderedEffekseerEffects = this.XA({
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
                this.ZA({
                  webGpuResourceRepository,
                  currentRenderPass: renderPass,
                  deferredEffekseerRenderJobs,
                  displayIdx
                });
              }
              if (displayIdx === displayCount - 1) {
                renderPassTickCountMap == null ? void 0 : renderPassTickCountMap.delete(renderPassUid);
                primitiveUidsMap == null ? void 0 : primitiveUidsMap.delete(renderPassUid);
                this.nA++;
              }
            }
          }
          if (displayIdx < displayCount - 1 && renderedEffekseerEffectsInDisplay) {
            webGpuResourceRepository.flush();
          }
        }
        webGpuResourceRepository.flush();
      } else {
        if (!this.mA.webgpuRenderBundleMode || this.PA() || TransformComponent.getUpdateCount(this) !== this.Hc || CameraComponent.getCurrentCameraUpdateCount(this) !== this.uA || Primitive.getPrimitiveCount() !== this.vA || LightComponent.getUpdateCount(this) !== this.Ic) {
          const commonMethodName = `common_${stage.methodName}`;
          for (const componentTid of componentTids) {
            const componentClass = ComponentRepository.getComponentClass(componentTid);
            const componentClass_commonMethod = componentClass[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({
                processApproach: this.iA,
                renderPass: void 0,
                processStage: stage,
                renderPassTickCount: this.nA,
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
    this.uA = CameraComponent.getCurrentCameraUpdateCount(this);
    this.QA();
    this.Hc = TransformComponent.getUpdateCount(this);
    this.vA = Primitive.getPrimitiveCount();
    this.Ic = LightComponent.getUpdateCount(this);
  }
  VA() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      (_a = hooks.beginFrame) == null ? void 0 : _a.call(hooks, this);
    }
  }
  PA() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      if (((_a = hooks.isDirty) == null ? void 0 : _a.call(hooks, this)) === true) {
        return true;
      }
    }
    return false;
  }
  QA() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      (_a = hooks.markUpdated) == null ? void 0 : _a.call(hooks, this);
    }
  }
  TA() {
    var _a;
    for (const hooks of _getComponentRuntimeHooks()) {
      (_a = hooks.cleanup) == null ? void 0 : _a.call(hooks, this);
    }
  }
  _processWebGL(expressions) {
    const repo = this.webglResourceRepository;
    const componentTids = this.qA.getComponentTIDs();
    const renderingComponentTids = this.qA.getRenderingComponentTIDs();
    for (const stage of Component._processStages) {
      const methodName = stage.methodName;
      const commonMethodName = `common_${methodName}`;
      if (stage === ProcessStage.Render) {
        repo.getMultiDrawRepository(this).rebuildDirtyGroups();
        this.rA.update(expressions);
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
                this.jA.clearFrameBuffer(this, renderPass);
              }
              renderPass._isChangedSortRenderResult = false;
              const primitiveUids = MeshRendererComponent.sort_$render(this, renderPass);
              let doRender = renderPass._renderedSomethingBefore;
              if (doRender) {
                const componentClass_commonMethod = componentClass[commonMethodName];
                if (componentClass_commonMethod) {
                  const renderedSomething = componentClass_commonMethod({
                    processApproach: this.iA,
                    renderPass,
                    processStage: stage,
                    renderPassTickCount: this.nA,
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
              this.nA++;
              renderPass._copyFramebufferToResolveFramebuffersWebGL();
              renderPass.doPostRender();
            }
          }
        }
      } else {
        if (this.PA() || TransformComponent.getUpdateCount(this) !== this.Hc || CameraComponent.getCurrentCameraUpdateCount(this) !== this.uA || Primitive.getPrimitiveCount() !== this.vA || LightComponent.getUpdateCount(this) !== this.Ic) {
          for (const componentTid of componentTids) {
            const componentClass = ComponentRepository.getComponentClass(componentTid);
            const componentClass_commonMethod = componentClass[commonMethodName];
            if (componentClass_commonMethod) {
              componentClass_commonMethod({
                processApproach: this.iA,
                renderPass: void 0,
                processStage: stage,
                renderPassTickCount: this.nA,
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
    this.uA = CameraComponent.getCurrentCameraUpdateCount(this);
    this.QA();
    this.Hc = TransformComponent.getUpdateCount(this);
    this.vA = Primitive.getPrimitiveCount();
    this.Ic = LightComponent.getUpdateCount(this);
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
    const webXRSystem = this.hA;
    const webARSystem = this.lA;
    if ((!(webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) || !renderPass.isVrRendering) && !(webARSystem == null ? void 0 : webARSystem.isWebARMode)) {
      this.jA.setViewport(this, renderPass.getViewport());
    }
  }
  /**
   * Applies the pass's scissor rectangle for normal (non-XR) rendering.
   *
   * The scissor is a culling hint; XR/AR passes use their own viewports, so they
   * run without one.
   */
  setScissorForNormalRendering(renderPass) {
    const webXRSystem = this.hA;
    const webARSystem = this.lA;
    const repository = this.jA;
    if ((!(webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) || !renderPass.isVrRendering) && !(webARSystem == null ? void 0 : webARSystem.isWebARMode)) {
      repository.setScissorRect(renderPass);
    } else {
      repository.setScissorRect(void 0);
    }
  }
  bindFramebufferWebGL(renderPass) {
    const webXRSystem = this.hA;
    const webARSystem = this.lA;
    if ((webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) && renderPass.isOutputForVr) {
      const glw = this.jA.currentWebGLContextWrapper;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webXRSystem.framebuffer);
    } else if (webARSystem == null ? void 0 : webARSystem.isWebARMode) {
      const glw = this.jA.currentWebGLContextWrapper;
      const gl = glw.getRawContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, webARSystem.framebuffer);
    } else {
      this.jA.bindFramebuffer(renderPass.getFramebuffer());
      this.jA.setDrawTargets(renderPass);
    }
  }
  _A() {
    console.log(
      `%cRhodonite%cWeb3D Library%c %cversion%c${VERSION.version}%c %cbranch%c${VERSION.branch}%c %cmode%c${this.iA.str}`,
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
  static $A() {
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
    _Engine.$A();
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
    engine.mA.currentProcessApproach = desc.approach;
    engine.sA.eventTargetDom = (_e = engine.sA.eventTargetDom) != null ? _e : desc.canvas;
    if (desc.approach === ProcessApproach.WebGPU) {
      engine.kA = cgApiResourceRepository;
    }
    if (desc.approach === ProcessApproach.WebGL2) {
      engine.BA = cgApiResourceRepository;
    }
    engine.jA = cgApiResourceRepository;
    if (desc.notToDisplayRnInfoAtInit !== true) {
      engine._A();
    }
    const globalDataRepository = engine.AA;
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
    engine.tA = await DummyTextures.init(engine);
    engine.mA.viewportAspectRatio = desc.canvas != null ? desc.canvas.width / desc.canvas.height : 1;
    return engine;
  }
  get processApproach() {
    return this.iA;
  }
  resizeCanvas(width, height) {
    const repo = this.cgApiResourceRepository;
    repo.resizeCanvas(width, height);
    this.mA.viewportAspectRatio = width / height;
  }
  getCanvasSize() {
    const repo = this.cgApiResourceRepository;
    return repo.getCanvasSize();
  }
  getCurrentWebGLContextWrapper() {
    return this.jA.currentWebGLContextWrapper;
  }
  get entityRepository() {
    return this.Se;
  }
  get componentRepository() {
    return this.qA;
  }
  get componentMemoryRegistry() {
    return this.EA;
  }
  /**
   * The WebXR (VR) system.
   * @throws If the XR support is not enabled (see {@link enableXR} and `EngineInitDescription.xr`)
   */
  get webXRSystem() {
    if (this.hA == null) {
      throw new Error(_Engine.RA);
    }
    return this.hA;
  }
  /**
   * The WebAR system.
   * @throws If the XR support is not enabled (see {@link enableXR} and `EngineInitDescription.xr`)
   */
  get webARSystem() {
    if (this.lA == null) {
      throw new Error(_Engine.RA);
    }
    return this.lA;
  }
  /** Whether the XR support (WebXR and WebAR systems) is enabled. */
  get isXREnabled() {
    return this.hA != null;
  }
  /**
   * The WebXR system, or undefined when the XR support is not enabled.
   * Internal code uses it so that rendering without XR never needs the XR module.
   * @internal
   */
  get _webXRSystemIfEnabled() {
    return this.hA;
  }
  /**
   * The WebAR system, or undefined when the XR support is not enabled.
   * @internal
   */
  get _webARSystemIfEnabled() {
    return this.lA;
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
    if (this.hA == null) {
      const rnXRModule = await ModuleManager.getInstance().loadModule("xr");
      if (this.hA == null) {
        this.MA(rnXRModule);
      }
    }
    return this.hA;
  }
  MA(rnXRModule) {
    this.hA = rnXRModule.WebXRSystem.init(this);
    this.lA = rnXRModule.WebARSystem.init(this);
  }
  get memoryManager() {
    return this.wi;
  }
  get globalDataRepository() {
    return this.AA;
  }
  /**
   * Starts loading the light cluster system. Called when the first light is added; applications without lights
   * never download it.
   * @internal
   */
  _requestLightClusterSystem() {
    if (this.g || this.GA != null) {
      return;
    }
    this.GA = import("../renderer/lightCluster/LightClusterSystem.js").then(({ LightClusterSystem }) => {
      if (this.g) {
        return;
      }
      this.rA = new LightClusterSystem(this);
      this.IA = true;
    }).catch((error) => {
      Logger.default.warn(`Failed to load the light cluster system: ${error}`);
    });
  }
  /**
   * Waits for the real light cluster system. Tests and applications that need it immediately call this.
   * @internal
   */
  async _ensureLightClusterSystem() {
    this._requestLightClusterSystem();
    await this.GA;
    return this.rA;
  }
  /**
   * The system that builds the light lists of Clustered Forward rendering.
   */
  get lightClusterSystem() {
    return this.rA;
  }
  get materialRepository() {
    return this.FA;
  }
  get webglResourceRepository() {
    return this.BA;
  }
  get cgApiResourceRepository() {
    return this.jA;
  }
  get webGpuResourceRepository() {
    return this.kA;
  }
  get dummyTextures() {
    return this.tA;
  }
  get engineState() {
    return this.mA;
  }
  get config() {
    return this.sA;
  }
  get logger() {
    return this.HA;
  }
  /**
   * Gets the shader program cache for this engine instance.
   * This cache maps shader text to compiled shader program UIDs.
   * Each engine has its own cache to prevent cross-contamination between WebGL contexts.
   * @internal
   */
  get shaderProgramCache() {
    return this.SA;
  }
};
/**
 * Whether `Engine.init` loads the XR support when `EngineInitDescription.xr` is omitted.
 * The default `Rn` namespace export sets it to true for compatibility.
 * @internal
 */
_Engine._loadXRByDefault = false;
_Engine.JA = /* @__PURE__ */ new Map();
_Engine.KA = 0;
_Engine.RA = "The XR support is not enabled. Initialize the engine with Engine.init({ xr: true }) or call await engine.enableXR() first. The default Rn namespace export enables it automatically.";
var Engine = _Engine;
export {
  Engine
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBFZmZla3NlZXJDb21wb25lbnQgfSBmcm9tICcuLi8uLi9lZmZla3NlZXIvRWZmZWtzZWVyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQnl0ZSwgSW5kZXgsIE9iamVjdFVJRCwgUHJpbWl0aXZlVUlEIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gJy4uLy4uL3ZlcnNpb24nO1xuaW1wb3J0IHR5cGUgeyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB0eXBlIHsgV2ViR3B1RGV2aWNlV3JhcHBlciB9IGZyb20gJy4uLy4uL3dlYmdwdS9XZWJHcHVEZXZpY2VXcmFwcGVyJztcbmltcG9ydCB0eXBlIHsgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vd2ViZ3B1L1dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgdHlwZSB7IFJuWFIgfSBmcm9tICcuLi8uLi94ci9tYWluJztcbmltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgeyBjcmVhdGVDYW1lcmFFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL0NhbWVyYS9jcmVhdGVDYW1lcmFFbnRpdHknO1xuaW1wb3J0IHsgTGlnaHRDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0xpZ2h0L0xpZ2h0Q29tcG9uZW50JztcbmltcG9ydCB7IE1lc2hDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2gvTWVzaENvbXBvbmVudCc7XG5pbXBvcnQgeyBNZXNoUmVuZGVyZXJDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9NZXNoUmVuZGVyZXJDb21wb25lbnQnO1xuaW1wb3J0IHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IFNrZWxldGFsQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9Ta2VsZXRhbC9Ta2VsZXRhbENvbXBvbmVudCc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBDb21wb25lbnRNZW1vcnlSZWdpc3RyeSB9IGZyb20gJy4uL2NvcmUvQ29tcG9uZW50TWVtb3J5UmVnaXN0cnknO1xuaW1wb3J0IHsgQ29tcG9uZW50UmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvQ29tcG9uZW50UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBfZ2V0Q29tcG9uZW50UnVudGltZUhvb2tzIH0gZnJvbSAnLi4vY29yZS9Db21wb25lbnRSdW50aW1lSG9va3MnO1xuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSAnLi4vY29yZS9Db25maWcnO1xuaW1wb3J0IHsgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBHbG9iYWxEYXRhUmVwb3NpdG9yeSB9IGZyb20gJy4uL2NvcmUvR2xvYmFsRGF0YVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTWVtb3J5TWFuYWdlciB9IGZyb20gJy4uL2NvcmUvTWVtb3J5TWFuYWdlcic7XG5pbXBvcnQgeyBDYW1lcmFUeXBlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ2FtZXJhVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2gsIHR5cGUgUHJvY2Vzc0FwcHJvYWNoRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgUHJpbWl0aXZlIH0gZnJvbSAnLi4vZ2VvbWV0cnkvUHJpbWl0aXZlJztcbmltcG9ydCB0eXBlIHsgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBEdW1teVRleHR1cmVzIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvRHVtbXlUZXh0dXJlcyc7XG5pbXBvcnQgdHlwZSB7IFNjYWxhciB9IGZyb20gJy4uL21hdGgvU2NhbGFyJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgVGltZSB9IGZyb20gJy4uL21pc2MvVGltZSc7XG5pbXBvcnQgeyBfZ2V0UGh5c2ljc0JhY2tlbmQgfSBmcm9tICcuLi9waHlzaWNzL1BoeXNpY3NCYWNrZW5kJztcbmltcG9ydCB7IENHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LCB0eXBlIElDR0FQSVJlc291cmNlUmVwb3NpdG9yeSB9IGZyb20gJy4uL3JlbmRlcmVyL0NHQVBJUmVzb3VyY2VSZXBvc2l0b3J5JztcbmltcG9ydCB7IEV4cHJlc3Npb24gfSBmcm9tICcuLi9yZW5kZXJlci9FeHByZXNzaW9uJztcbmltcG9ydCB7IEZyYW1lIH0gZnJvbSAnLi4vcmVuZGVyZXIvRnJhbWUnO1xuaW1wb3J0IHR5cGUgeyBJTGlnaHRDbHVzdGVyU3lzdGVtIH0gZnJvbSAnLi4vcmVuZGVyZXIvbGlnaHRDbHVzdGVyL0xpZ2h0Q2x1c3RlclN5c3RlbVN0dWInO1xuaW1wb3J0IHsgTGlnaHRDbHVzdGVyU3lzdGVtU3R1YiB9IGZyb20gJy4uL3JlbmRlcmVyL2xpZ2h0Q2x1c3Rlci9MaWdodENsdXN0ZXJTeXN0ZW1TdHViJztcbmltcG9ydCB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB7IEVuZ2luZVN0YXRlIH0gZnJvbSAnLi9FbmdpbmVTdGF0ZSc7XG5pbXBvcnQgeyBNb2R1bGVNYW5hZ2VyIH0gZnJvbSAnLi9Nb2R1bGVNYW5hZ2VyJztcblxuZGVjbGFyZSBjb25zdCBzcGVjdG9yOiBhbnk7XG5cbmltcG9ydCB7IFdlYkdMR3B1VGltZXIgfSBmcm9tICcuLi8uLi93ZWJnbC9XZWJHTEdwdVRpbWVyJztcbmltcG9ydCB7IF9jbGVhbnVwV2ViR0xTdGF0ZXNDYWNoZUZvckVuZ2luZSB9IGZyb20gJy4uLy4uL3dlYmdsL1dlYkdMU3RyYXRlZ3lDb21tb25NZXRob2QnO1xuaW1wb3J0IHR5cGUgeyBXZWJBUlN5c3RlbSB9IGZyb20gJy4uLy4uL3hyL1dlYkFSU3lzdGVtJztcbmltcG9ydCB0eXBlIHsgV2ViWFJTeXN0ZW0gfSBmcm9tICcuLi8uLi94ci9XZWJYUlN5c3RlbSc7XG5pbXBvcnQgeyBSbk9iamVjdCB9IGZyb20gJy4uL2NvcmUvUm5PYmplY3QnO1xuaW1wb3J0IHsgX2NsZWFudXBHaXptb3NGb3JFbmdpbmUgfSBmcm9tICcuLi9naXptb3MvR2l6bW9SZWdpc3RyeSc7XG5pbXBvcnQgeyBfY2xlYW51cFJlbmRlclBhc3NIZWxwZXJGb3JFbmdpbmUgfSBmcm9tICcuLi9oZWxwZXJzL1JlbmRlclBhc3NIZWxwZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9BYnN0cmFjdE1hdGVyaWFsQ29udGVudCc7XG5pbXBvcnQgeyBNYXRlcmlhbFJlcG9zaXRvcnkgfSBmcm9tICcuLi9tYXRlcmlhbHMvY29yZS9NYXRlcmlhbFJlcG9zaXRvcnknO1xuXG50eXBlIFdlYkdQVUV4dGVybmFsUmVuZGVyUGFzc09wdGlvbnMgPSB7IGNvbG9yRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDsgZGVwdGhGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0IH07XG5cbnR5cGUgRGVmZXJyZWRFZmZla3NlZXJXZWJHUFVSZW5kZXJKb2IgPSB7XG4gIHJlbmRlclBhc3M6IFJlbmRlclBhc3M7XG4gIGRpc3BsYXlJZHg6IG51bWJlcjtcbiAgcmVuZGVyUGFzc09wdGlvbnM/OiBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zO1xuICBlZmZla3NlZXJDb21wb25lbnRzOiBFZmZla3NlZXJDb21wb25lbnRbXTtcbn07XG5cbi8qKlxuICogVGhlIGFyZ3VtZW50IHR5cGUgZm9yIEVuZ2luZS5pbml0KCkgbWV0aG9kLlxuICovXG5pbnRlcmZhY2UgRW5naW5lSW5pdERlc2NyaXB0aW9uIHtcbiAgYXBwcm9hY2g6IFByb2Nlc3NBcHByb2FjaEVudW07XG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIHdlYmdsT3B0aW9uPzogV2ViR0xDb250ZXh0QXR0cmlidXRlcztcbiAgbm90VG9EaXNwbGF5Um5JbmZvQXRJbml0PzogYm9vbGVhbjtcbiAgY29uZmlnPzogQ29uZmlnO1xuICAvKipcbiAgICogTG9hZHMgdGhlIFdlYlhSL1dlYkFSIHN1cHBvcnQgKGBlbmdpbmUud2ViWFJTeXN0ZW1gLCBgZW5naW5lLndlYkFSU3lzdGVtYCkgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgKiBEZWZhdWx0cyB0byBmYWxzZSBmb3IgbmFtZWQgaW1wb3J0cywgYW5kIHRvIHRydWUgd2hlbiB0aGUgZGVmYXVsdCBgUm5gIG5hbWVzcGFjZSBleHBvcnQgaXMgdXNlZC5cbiAgICogSXQgY2FuIGFsc28gYmUgZW5hYmxlZCBsYXRlciB3aXRoIGBhd2FpdCBlbmdpbmUuZW5hYmxlWFIoKWAuXG4gICAqL1xuICB4cj86IGJvb2xlYW47XG59XG5cbi8qKlxuICogVGhlIHN5c3RlbSBjbGFzcyBpcyB0aGUgZW50cnkgcG9pbnQgb2YgdGhlIFJob2Rvbml0ZSBsaWJyYXJ5LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqIGNvbnN0IGVuZ2luZSA9IGF3YWl0IFJuLkVuZ2luZS5pbml0KHtcbiAqICAgYXBwcm9hY2g6IFJuLlByb2Nlc3NBcHByb2FjaC5XZWJHTDIsXG4gKiAgIGNhbnZhczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvcmxkJykgYXMgSFRNTENhbnZhc0VsZW1lbnQsXG4gKiB9KTtcbiAqXG4gKiAuLi4gKGNyZWF0ZSBzb21ldGhpbmcpIC4uLlxuICpcbiAqIGVuZ2luZS5zdGFydFJlbmRlckxvb3AoKHRpbWUsIF9teUFyZzEsIF9teUFyZzIpID0+IHtcbiAqICAgUm4uRW5naW5lLnByb2Nlc3MoW2V4cHJlc3Npb25dKTtcbiAqIH0sIG15QXJnMSwgbXlBcmcyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgRW5naW5lIGV4dGVuZHMgUm5PYmplY3Qge1xuICBwcml2YXRlIF9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvPzogRXhwcmVzc2lvbjtcbiAgcHJpdmF0ZSBfX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0bz86IFJlbmRlclBhc3M7XG4gIHByaXZhdGUgX19wcm9jZXNzQXBwcm9hY2g6IFByb2Nlc3NBcHByb2FjaEVudW0gPSBQcm9jZXNzQXBwcm9hY2guTm9uZTtcbiAgcHJpdmF0ZSBfX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5OiBJQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnk7XG4gIHByaXZhdGUgX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeT86IFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5PzogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fZW5naW5lU3RhdGUgPSBuZXcgRW5naW5lU3RhdGUoKTtcbiAgcHJpdmF0ZSBfX3JlbmRlclBhc3NUaWNrQ291bnQgPSAwO1xuICBwcml2YXRlIF9fYW5pbWF0aW9uRnJhbWVJZCA9IC0xO1xuICAvKiogVGhlIG9iamVjdCAoV2luZG93IG9yIFhSU2Vzc2lvbikgdGhhdCBvd25zIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBmcmFtZSBjYWxsYmFjay4gKi9cbiAgcHJpdmF0ZSBfX2FuaW1hdGlvbkZyYW1lT2JqZWN0PzogV2luZG93IHwgWFJTZXNzaW9uO1xuXG4gIHByaXZhdGUgX19yZW5kZXJMb29wRnVuYz86ICh0aW1lOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuICBwcml2YXRlIF9fYXJnczogdW5rbm93bltdID0gW107XG4gIHByaXZhdGUgX193ZWJYUlN5c3RlbT86IFdlYlhSU3lzdGVtO1xuICBwcml2YXRlIF9fd2ViQVJTeXN0ZW0/OiBXZWJBUlN5c3RlbTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgYEVuZ2luZS5pbml0YCBsb2FkcyB0aGUgWFIgc3VwcG9ydCB3aGVuIGBFbmdpbmVJbml0RGVzY3JpcHRpb24ueHJgIGlzIG9taXR0ZWQuXG4gICAqIFRoZSBkZWZhdWx0IGBSbmAgbmFtZXNwYWNlIGV4cG9ydCBzZXRzIGl0IHRvIHRydWUgZm9yIGNvbXBhdGliaWxpdHkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9sb2FkWFJCeURlZmF1bHQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2VudGl0eVJlcG9zaXRvcnk6IEVudGl0eVJlcG9zaXRvcnk7XG4gIHByaXZhdGUgX19jb21wb25lbnRSZXBvc2l0b3J5OiBDb21wb25lbnRSZXBvc2l0b3J5O1xuICBwcml2YXRlIF9fY29tcG9uZW50TWVtb3J5UmVnaXN0cnk6IENvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5O1xuICBwcml2YXRlIF9fbWVtb3J5TWFuYWdlcj86IE1lbW9yeU1hbmFnZXI7XG4gIHByaXZhdGUgX19tYXRlcmlhbFJlcG9zaXRvcnk6IE1hdGVyaWFsUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX2dsb2JhbERhdGFSZXBvc2l0b3J5OiBHbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgcHJpdmF0ZSBfX2xpZ2h0Q2x1c3RlclN5c3RlbTogSUxpZ2h0Q2x1c3RlclN5c3RlbSA9IG5ldyBMaWdodENsdXN0ZXJTeXN0ZW1TdHViKCk7XG4gIHByaXZhdGUgX19saWdodENsdXN0ZXJTeXN0ZW1Qcm9taXNlPzogUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBfX2lzTGlnaHRDbHVzdGVyU3lzdGVtTG9hZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19pc0Rlc3Ryb3llZCA9IGZhbHNlO1xuICBwcml2YXRlIF9fY29uZmlnOiBDb25maWc7XG4gIHByaXZhdGUgX19sb2dnZXI6IExvZ2dlcjtcbiAgcHJpdmF0ZSBfX2R1bW15VGV4dHVyZXM/OiBEdW1teVRleHR1cmVzO1xuICBwcml2YXRlIF9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFByaW1pdGl2ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgLyoqIFNoYWRlciBwcm9ncmFtIGNhY2hlIG1hcCBmb3IgdGhpcyBlbmdpbmUgaW5zdGFuY2UuIE1hcHMgc2hhZGVyIHRleHQgdG8gcHJvZ3JhbSBVSURzLiAqL1xuICBwcml2YXRlIF9fc2hhZGVyUHJvZ3JhbUNhY2hlOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fZ3B1VGltZXJFbmFibGVkID0gZmFsc2U7XG4gIHByaXZhdGUgX193ZWJnbEdwdVRpbWVyPzogV2ViR0xHcHVUaW1lcjtcbiAgcHJpdmF0ZSBzdGF0aWMgX19lbmdpbmVzOiBNYXA8T2JqZWN0VUlELCBFbmdpbmU+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyBfX2VuZ2luZUNvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2VuZ2luZVVpZDogSW5kZXggPSAtMTtcblxuICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgIHByb2Nlc3NBcHByb2FjaDogUHJvY2Vzc0FwcHJvYWNoRW51bSxcbiAgICBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeTogSUNHQVBJUmVzb3VyY2VSZXBvc2l0b3J5LFxuICAgIG1heEdQVURhdGFTdG9yYWdlU2l6ZTogQnl0ZSxcbiAgICBjb25maWc/OiBDb25maWcsXG4gICAgcm5YUk1vZHVsZT86IFJuWFJcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9fY29uZmlnID0gY29uZmlnID8/IG5ldyBDb25maWcoKTtcbiAgICB0aGlzLl9fbG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuICAgIHRoaXMuX19sb2dnZXIubG9nTGV2ZWwgPSB0aGlzLl9fY29uZmlnLmxvZ0xldmVsO1xuICAgIHRoaXMuX19lbmdpbmVVaWQgPSBFbmdpbmUuX19lbmdpbmVDb3VudDtcbiAgICB0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoID0gcHJvY2Vzc0FwcHJvYWNoO1xuICAgIHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHRoaXMuX19jb21wb25lbnRNZW1vcnlSZWdpc3RyeSA9IG5ldyBDb21wb25lbnRNZW1vcnlSZWdpc3RyeSgpO1xuICAgIHRoaXMuX19jb21wb25lbnRSZXBvc2l0b3J5ID0gbmV3IENvbXBvbmVudFJlcG9zaXRvcnkodGhpcyk7XG4gICAgdGhpcy5fX2VudGl0eVJlcG9zaXRvcnkgPSBuZXcgRW50aXR5UmVwb3NpdG9yeSh0aGlzKTtcbiAgICB0aGlzLl9fbWF0ZXJpYWxSZXBvc2l0b3J5ID0gbmV3IE1hdGVyaWFsUmVwb3NpdG9yeSgpO1xuICAgIHRoaXMuX19tZW1vcnlNYW5hZ2VyID0gTWVtb3J5TWFuYWdlci5jcmVhdGVJbnN0YW5jZUlmTm90Q3JlYXRlZCh0aGlzLCBtYXhHUFVEYXRhU3RvcmFnZVNpemUpO1xuICAgIC8vIFRoZSBYUiBzeXN0ZW1zIGNyZWF0ZSB0aGVpciB2aWV3ZXIgYW5kIGNhbWVyYSBlbnRpdGllcywgc28gdGhleSBhcmUgaW5pdGlhbGl6ZWQgYXQgdGhlIHNhbWUgcG9pbnQgYXNcbiAgICAvLyBiZWZvcmUgdGhlIFhSIHN1cHBvcnQgYmVjYW1lIG9wdGlvbmFsOyBlbnRpdHkgYW5kIGNvbXBvbmVudCBJRHMgc3RheSB1bmNoYW5nZWQgd2hlbiBpdCBpcyBlbmFibGVkLlxuICAgIGlmIChyblhSTW9kdWxlICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19pbml0WFJTeXN0ZW1zKHJuWFJNb2R1bGUpO1xuICAgIH1cbiAgICB0aGlzLl9fZ2xvYmFsRGF0YVJlcG9zaXRvcnkgPSBHbG9iYWxEYXRhUmVwb3NpdG9yeS5pbml0KHRoaXMpO1xuICAgIEVuZ2luZS5fX2VuZ2luZUNvdW50Kys7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVuZ2luZVVpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZVVpZDtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0RW5naW5lKG9iamVjdFVpZDogT2JqZWN0VUlEKSB7XG4gICAgY29uc3QgZW5naW5lID0gRW5naW5lLl9fZW5naW5lcy5nZXQob2JqZWN0VWlkKTtcbiAgICBpZiAoSXMubm90LmV4aXN0KGVuZ2luZSkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBlbmdpbmU7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGVuZ2luZSBhbmQgcmVsZWFzZXMgYWxsIGFzc29jaWF0ZWQgcmVzb3VyY2VzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCBwZXJmb3JtcyBhIGNvbXByZWhlbnNpdmUgY2xlYW51cCBvZiBhbGwgZW5naW5lIHJlc291cmNlcyBpbmNsdWRpbmc6XG4gICAqIC0gU3RvcHBpbmcgdGhlIHJlbmRlciBsb29wXG4gICAqIC0gRGVsZXRpbmcgYWxsIGVudGl0aWVzIGFuZCB0aGVpciBjb21wb25lbnRzXG4gICAqIC0gRGVzdHJveWluZyBhbGwgdGV4dHVyZXMgKGluY2x1ZGluZyBkdW1teSB0ZXh0dXJlcylcbiAgICogLSBDbGVhcmluZyBtYXRlcmlhbCByZXBvc2l0b3J5IGRhdGFcbiAgICogLSBSZWxlYXNpbmcgR1BVIHJlc291cmNlcyAoV2ViR0wvV2ViR1BVKVxuICAgKiAtIENsZWFyaW5nIG1lbW9yeSBtYW5hZ2VyIGJ1ZmZlcnNcbiAgICpcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlIGVuZ2luZSBpbnN0YW5jZSBzaG91bGQgbm90IGJlIHVzZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgZW5naW5lID0gYXdhaXQgUm4uRW5naW5lLmluaXQoeyAuLi4gfSk7XG4gICAqIC8vIC4uLiB1c2UgdGhlIGVuZ2luZSAuLi5cbiAgICogZW5naW5lLmRlc3Ryb3koKTsgLy8gQ2xlYW4gdXAgYWxsIHJlc291cmNlc1xuICAgKiBgYGBcbiAgICovXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZW5naW5lIGFuZCByZWxlYXNlcyBhbGwgYXNzb2NpYXRlZCByZXNvdXJjZXMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgbWV0aG9kIHBlcmZvcm1zIGEgY29tcHJlaGVuc2l2ZSBjbGVhbnVwIG9mIGFsbCBlbmdpbmUgcmVzb3VyY2VzIGluY2x1ZGluZzpcbiAgICogLSBTdG9wcGluZyB0aGUgcmVuZGVyIGxvb3BcbiAgICogLSBJbnZhbGlkYXRpbmcgYWxsIHNoYWRlciBjYWNoZXMgaW4gbWF0ZXJpYWxzXG4gICAqIC0gRGVsZXRpbmcgYWxsIGVudGl0aWVzIGFuZCB0aGVpciBjb21wb25lbnRzXG4gICAqIC0gRGVzdHJveWluZyBhbGwgdGV4dHVyZXMgKGluY2x1ZGluZyBkdW1teSB0ZXh0dXJlcylcbiAgICogLSBDbGVhcmluZyBtYXRlcmlhbCByZXBvc2l0b3J5IGRhdGFcbiAgICogLSBSZWxlYXNpbmcgR1BVIHJlc291cmNlcyAoV2ViR0wvV2ViR1BVKVxuICAgKiAtIENsZWFyaW5nIG1lbW9yeSBtYW5hZ2VyIGJ1ZmZlcnNcbiAgICpcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgdGhlIGVuZ2luZSBpbnN0YW5jZSBzaG91bGQgbm90IGJlIHVzZWQuXG4gICAqL1xuICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnN0b3BSZW5kZXJMb29wKCk7XG4gICAgdGhpcy5fX3JlbmRlckxvb3BGdW5jID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19hcmdzID0gW107XG4gICAgdGhpcy5fX2Rlc3Ryb3lSZXNvdXJjZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgdGhhdCBwZXJmb3JtcyB0aGUgYWN0dWFsIHJlc291cmNlIGNsZWFudXAuXG4gICAqIENhbGxlZCBhZnRlciB0aGUgcmVuZGVyIGxvb3AgaGFzIGZ1bGx5IHN0b3BwZWQuXG4gICAqL1xuICBwcml2YXRlIF9fZGVzdHJveVJlc291cmNlcygpOiB2b2lkIHtcbiAgICB0aGlzLl9faXNEZXN0cm95ZWQgPSB0cnVlO1xuXG4gICAgLy8gSW52YWxpZGF0ZSBhbGwgc2hhZGVyIGNhY2hlcyBpbiBtYXRlcmlhbHMgYmVmb3JlIGRlbGV0aW5nIGVudGl0aWVzXG4gICAgLy8gVGhpcyBlbnN1cmVzIHNoYWRlcnMgd2lsbCBiZSByZWNvbXBpbGVkIHdpdGggbmV3IFdlYkdMIHJlc291cmNlcyBvbiBuZXh0IGVuZ2luZSBpbml0XG4gICAgdGhpcy5fX21hdGVyaWFsUmVwb3NpdG9yeS5fbWFrZVNoYWRlckludmFsaWRhdGVUb0FsbE1hdGVyaWFscygpO1xuXG4gICAgLy8gRGVsZXRlIGFsbCBlbnRpdGllcyAodGhpcyBhbHNvIGNsZWFucyB1cCBhbGwgY29tcG9uZW50cylcbiAgICBjb25zdCBlbnRpdGllcyA9IHRoaXMuX19lbnRpdHlSZXBvc2l0b3J5Ll9nZXRFbnRpdGllcygpO1xuICAgIGZvciAoY29uc3QgZW50aXR5IG9mIGVudGl0aWVzKSB7XG4gICAgICB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeS5kZWxldGVFbnRpdHkoZW50aXR5LmVudGl0eVVJRCk7XG4gICAgfVxuXG4gICAgLy8gRGVzdHJveSBkdW1teSB0ZXh0dXJlc1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fZHVtbXlUZXh0dXJlcykpIHtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVzLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX19kdW1teVRleHR1cmVzID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIENsZWFyIFdlYkdQVSBjYWNoZSBhbmQgdW5jb25maWd1cmUgY29udGV4dCBpZiB1c2luZyBXZWJHUFVcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSkpIHtcbiAgICAgIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJDYWNoZSgpO1xuICAgICAgLy8gVW5jb25maWd1cmUgdGhlIFdlYkdQVSBjYW52YXMgY29udGV4dCB0byBhbGxvdyBpdCB0byBiZSByZWNvbmZpZ3VyZWQgb24gbmV4dCBpbml0XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkZXZpY2VXcmFwcGVyID0gdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk7XG4gICAgICAgIGlmIChkZXZpY2VXcmFwcGVyKSB7XG4gICAgICAgICAgZGV2aWNlV3JhcHBlci5jb250ZXh0LnVuY29uZmlndXJlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgIC8vIElnbm9yZSBlcnJvcnMgaWYgZGV2aWNlIHdyYXBwZXIgaXMgbm90IGF2YWlsYWJsZVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlc3Ryb3kgbWVtb3J5IG1hbmFnZXIgYW5kIHJlbGVhc2UgYWxsb2NhdGVkIGJ1ZmZlcnNcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX21lbW9yeU1hbmFnZXIpKSB7XG4gICAgICB0aGlzLl9fbWVtb3J5TWFuYWdlci5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9fbWVtb3J5TWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBPcHRpb25hbCBjb21wb25lbnQgbW9kdWxlcyBjbGVhbiB1cCB0aGVpciBvd24gRW5naW5lLWtleWVkIHN0YXRlLlxuICAgIHRoaXMuX19jbGVhbnVwQ29tcG9uZW50UnVudGltZUhvb2tzKCk7XG5cbiAgICAvLyBDbGVhbiB1cCBzdGF0aWMgcmVzb3VyY2VzIGluIGNvbXBvbmVudHMgdGhhdCB1c2UgRW5naW5lLWtleWVkIG1hcHNcbiAgICBUcmFuc2Zvcm1Db21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgU2NlbmVHcmFwaENvbXBvbmVudC5fY2xlYW51cEZvckVuZ2luZSh0aGlzKTtcbiAgICBDYW1lcmFDb21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgTGlnaHRDb21wb25lbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG4gICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50Ll9jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuICAgIF9nZXRQaHlzaWNzQmFja2VuZCgpPy5jbGVhbnVwRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgZ2l6bW8gcmVzb3VyY2VzIHRoYXQgYXJlIG1hbmFnZWQgcGVyLUVuZ2luZVxuICAgIF9jbGVhbnVwR2l6bW9zRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgbWF0ZXJpYWwgY29udGVudCBjYWNoZXMgZm9yIHRoaXMgZW5naW5lXG4gICAgQWJzdHJhY3RNYXRlcmlhbENvbnRlbnQuX2NsZWFudXBGb3JFbmdpbmUodGhpcyk7XG5cbiAgICAvLyBDbGVhbiB1cCBSZW5kZXJQYXNzSGVscGVyIHNhbXBsZXIgY2FjaGUgZm9yIHRoaXMgZW5naW5lXG4gICAgX2NsZWFudXBSZW5kZXJQYXNzSGVscGVyRm9yRW5naW5lKHRoaXMpO1xuXG4gICAgLy8gQ2xlYW4gdXAgV2ViR0wgc3RhdGUgY2FjaGUgZm9yIHRoaXMgZW5naW5lIChibGVuZCBtb2RlcywgY3VsbCBmYWNlLCBldGMuKVxuICAgIF9jbGVhbnVwV2ViR0xTdGF0ZXNDYWNoZUZvckVuZ2luZSh0aGlzKTtcblxuICAgIHRoaXMuX193ZWJnbEdwdVRpbWVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5fX3dlYmdsR3B1VGltZXIgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBDbGVhciBjb21wb25lbnQgbWVtb3J5IHJlZ2lzdHJ5XG4gICAgdGhpcy5fX2NvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5LmRlc3Ryb3koKTtcblxuICAgIC8vIENsZWFyIGV4cHJlc3Npb25zIGFuZCByZW5kZXIgcGFzc2VzIHVzZWQgZm9yIHByb2Nlc3NBdXRvXG4gICAgdGhpcy5fX2V4cHJlc3Npb25Gb3JQcm9jZXNzQXV0byA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fcmVuZGVyUGFzc0ZvclByb2Nlc3NBdXRvID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gUmVzZXQgaW50ZXJuYWwgc3RhdGVcbiAgICB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCA9IDA7XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICAgIHRoaXMuX19sYXN0UHJpbWl0aXZlQ291bnQgPSAtMTtcblxuICAgIC8vIFJlbW92ZSBmcm9tIHN0YXRpYyBlbmdpbmVzIG1hcCBhbmQgdW5yZWdpc3RlclxuICAgIEVuZ2luZS5fX2VuZ2luZXMuZGVsZXRlKHRoaXMub2JqZWN0VUlEKTtcbiAgICB0aGlzLnVucmVnaXN0ZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgYSByZW5kZXIgbG9vcC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIFJuLkVuZ2luZS5zdGFydFJlbmRlckxvb3AoKHRpbWUsIF9teUFyZzEsIF9teUFyZzIpID0+IHtcbiAgICogICBSbi5FbmdpbmUucHJvY2VzcyhbZXhwcmVzc2lvbl0pO1xuICAgKiB9LCBteUFyZzEsIG15QXJnMik7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcmVuZGVyTG9vcEZ1bmMgLSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgaW4gZWFjaCBmcmFtZVxuICAgKiBAcGFyYW0gYXJncyAtIGFyZ3VtZW50cyB5b3Ugd2FudCB0byBiZSBwYXNzZWQgdG8gcmVuZGVyTG9vcEZ1bmNcbiAgICovXG4gIHB1YmxpYyBzdGFydFJlbmRlckxvb3AocmVuZGVyTG9vcEZ1bmM6ICh0aW1lOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIHRoaXMuX19yZW5kZXJMb29wRnVuYyA9IHJlbmRlckxvb3BGdW5jO1xuICAgIHRoaXMuX19hcmdzID0gYXJncztcblxuICAgIC8vIENhbmNlbCBhIHN0aWxsIHBlbmRpbmcgZnJhbWUgZmlyc3Qgc28gdGhhdCBjYWxsaW5nIHN0YXJ0UmVuZGVyTG9vcCB0d2ljZVxuICAgIC8vIG5ldmVyIGxlYXZlcyB0d28gbG9vcHMgcnVubmluZyBpbiBwYXJhbGxlbC5cbiAgICBpZiAodGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQgIT09IC0xKSB7XG4gICAgICB0aGlzLnN0b3BSZW5kZXJMb29wKCk7XG4gICAgfVxuXG4gICAgY29uc3QgYW5pbWF0aW9uRnJhbWVPYmplY3QgPSB0aGlzLl9fZ2V0QW5pbWF0aW9uRnJhbWVPYmplY3QoKTtcbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVPYmplY3QgPSBhbmltYXRpb25GcmFtZU9iamVjdDtcblxuICAgIC8vIENhY2hlIGV2ZXJ5dGhpbmcgdGhlIGhvdCBwYXRoIG5lZWRzIGluIGxvY2FsIHZhcmlhYmxlcy4gUmVzb2x2aW5nIHRoZVxuICAgIC8vIGBXaW5kb3cgfCBYUlNlc3Npb25gIHVuaW9uIGFuZCB0aGUgY2xhc3MgZmllbGRzIG9uIGV2ZXJ5IGZyYW1lIGNvc3RzIG1vcmVcbiAgICAvLyB0aGFuIHRoZSBsb29wIGJvZHkgaXRzZWxmLlxuICAgIGNvbnN0IHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGFuaW1hdGlvbkZyYW1lT2JqZWN0LnJlcXVlc3RBbmltYXRpb25GcmFtZS5iaW5kKGFuaW1hdGlvbkZyYW1lT2JqZWN0KTtcbiAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBjb25zdCB3ZWJBUlN5c3RlbSA9IHRoaXMuX193ZWJBUlN5c3RlbTtcblxuICAgIC8vIFRoZSBleHRyYSBhcmd1bWVudHMgYXJlIGltbXV0YWJsZSBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBsb29wLCBzbyB0aGV5XG4gICAgLy8gYXJlIGNvcGllZCBvbmNlLiBTbG90IDAgaXMgcmVzZXJ2ZWQgZm9yIHRoZSBjdXJyZW50IHRpbWUgYW5kIG92ZXJ3cml0dGVuXG4gICAgLy8gaW4gcGxhY2UsIHdoaWNoIGtlZXBzIHRoZSBwZXItZnJhbWUgcGF0aCBmcmVlIG9mIGFycmF5IGFsbG9jYXRpb25zIGFuZFxuICAgIC8vIHNwcmVhZC9hcHBseSBvdmVyaGVhZCBpbiB0aGUgY29tbW9uIChubyBleHRyYSBhcmdzKSBjYXNlLlxuICAgIGNvbnN0IGhhc0V4dHJhQXJncyA9IGFyZ3MubGVuZ3RoID4gMDtcbiAgICBjb25zdCBjYWxsQXJnczogYW55W10gPSBoYXNFeHRyYUFyZ3MgPyBbMCwgLi4uYXJnc10gOiBbXTtcblxuICAgIGNvbnN0IGludm9rZVJlbmRlckxvb3BGdW5jID0gaGFzRXh0cmFBcmdzXG4gICAgICA/ICh0aW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBjYWxsQXJnc1swXSA9IHRpbWU7XG4gICAgICAgICAgcmVuZGVyTG9vcEZ1bmMuYXBwbHkocmVuZGVyTG9vcEZ1bmMsIGNhbGxBcmdzIGFzIFtudW1iZXIsIC4uLmFueVtdXSk7XG4gICAgICAgIH1cbiAgICAgIDogKHRpbWU6IG51bWJlcikgPT4ge1xuICAgICAgICAgIHJlbmRlckxvb3BGdW5jLmNhbGwocmVuZGVyTG9vcEZ1bmMsIHRpbWUpO1xuICAgICAgICB9O1xuXG4gICAgY29uc3QgX19yZW5kZXJMb29wRnVuYyA9ICgoX3RpbWU6IG51bWJlciwgeHJGcmFtZTogWFJGcmFtZSkgPT4ge1xuICAgICAgaWYgKHdlYlhSU3lzdGVtPy5pc1JlYWR5Rm9yV2ViWFIpIHtcbiAgICAgICAgd2ViWFJTeXN0ZW0uX3ByZVJlbmRlcihfdGltZSwgeHJGcmFtZSk7XG4gICAgICAgIGludm9rZVJlbmRlckxvb3BGdW5jKF90aW1lKTtcbiAgICAgICAgd2ViWFJTeXN0ZW0uX3Bvc3RSZW5kZXIoKTtcbiAgICAgIH0gZWxzZSBpZiAod2ViQVJTeXN0ZW0/LmlzUmVhZHlGb3JXZWJBUikge1xuICAgICAgICB3ZWJBUlN5c3RlbS5fcHJlUmVuZGVyKF90aW1lLCB4ckZyYW1lKTtcbiAgICAgICAgaW52b2tlUmVuZGVyTG9vcEZ1bmMoX3RpbWUpO1xuICAgICAgICB3ZWJBUlN5c3RlbS5fcG9zdFJlbmRlcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW52b2tlUmVuZGVyTG9vcEZ1bmMoX3RpbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoX19yZW5kZXJMb29wRnVuYyk7XG4gICAgfSkgYXMgRnJhbWVSZXF1ZXN0Q2FsbGJhY2s7XG5cbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShfX3JlbmRlckxvb3BGdW5jKTtcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRBbmltYXRpb25GcmFtZU9iamVjdCgpOiBXaW5kb3cgfCBYUlNlc3Npb24ge1xuICAgIGxldCBhbmltYXRpb25GcmFtZU9iamVjdDogV2luZG93IHwgWFJTZXNzaW9uIHwgdW5kZWZpbmVkID0gd2luZG93O1xuICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICAgIGNvbnN0IHdlYkFSU3lzdGVtID0gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICAgIGlmICh3ZWJYUlN5c3RlbT8ucmVxdWVzdGVkVG9FbnRlcldlYlhSKSB7XG4gICAgICBhbmltYXRpb25GcmFtZU9iamVjdCA9IHdlYlhSU3lzdGVtLnhyU2Vzc2lvbjtcbiAgICB9IGVsc2UgaWYgKHdlYkFSU3lzdGVtPy5yZXF1ZXN0ZWRUb0VudGVyV2ViQVIpIHtcbiAgICAgIGFuaW1hdGlvbkZyYW1lT2JqZWN0ID0gd2ViQVJTeXN0ZW0uYXJTZXNzaW9uO1xuICAgIH1cbiAgICBpZiAoSXMubm90LmV4aXN0KGFuaW1hdGlvbkZyYW1lT2JqZWN0KSkge1xuICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG4gICAgcmV0dXJuIGFuaW1hdGlvbkZyYW1lT2JqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIGEgZXhpc3RpbmcgcmVuZGVyIGxvb3AuXG4gICAqL1xuICBwdWJsaWMgc3RvcFJlbmRlckxvb3AoKSB7XG4gICAgLy8gQ2FuY2VsIG9uIHRoZSBzYW1lIG9iamVjdCB0aGF0IHdhcyB1c2VkIHRvIHJlcXVlc3QgdGhlIGZyYW1lLiBBc2tpbmdcbiAgICAvLyBfX2dldEFuaW1hdGlvbkZyYW1lT2JqZWN0KCkgYWdhaW4gY291bGQgcmV0dXJuIGEgZGlmZmVyZW50IG9iamVjdCAoZS5nLlxuICAgIC8vIHdoZW4gYW4gWFIgc2Vzc2lvbiBoYXMganVzdCBlbmRlZCkgYW5kIHRoZSBvbGQgbG9vcCB3b3VsZCBrZWVwIHJ1bm5pbmcuXG4gICAgY29uc3QgYW5pbWF0aW9uRnJhbWVPYmplY3QgPSB0aGlzLl9fYW5pbWF0aW9uRnJhbWVPYmplY3QgPz8gdGhpcy5fX2dldEFuaW1hdGlvbkZyYW1lT2JqZWN0KCk7XG4gICAgaWYgKHRoaXMuX19hbmltYXRpb25GcmFtZUlkICE9PSAtMSkge1xuICAgICAgYW5pbWF0aW9uRnJhbWVPYmplY3QuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fX2FuaW1hdGlvbkZyYW1lSWQpO1xuICAgIH1cbiAgICB0aGlzLl9fYW5pbWF0aW9uRnJhbWVJZCA9IC0xO1xuICAgIHRoaXMuX19hbmltYXRpb25GcmFtZU9iamVjdCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0YXJ0IGEgcmVuZGVyIGxvb3AuXG4gICAqL1xuICBwdWJsaWMgcmVzdGFydFJlbmRlckxvb3AoKSB7XG4gICAgaWYgKHRoaXMuX19yZW5kZXJMb29wRnVuYyAhPSBudWxsKSB7XG4gICAgICB0aGlzLnN0YXJ0UmVuZGVyTG9vcCh0aGlzLl9fcmVuZGVyTG9vcEZ1bmMsIC4uLnRoaXMuX19hcmdzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSBTaW1wbGUgdmVyc2lvbiBvZiBwcm9jZXNzIG1ldGhvZFxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBObyBuZWVkIHRvIGNyZWF0ZSBleHByZXNzaW9ucyBhbmQgcmVuZGVyUGFzc2VzIGFuZCB0byByZWdpc3RlciBlbnRpdGllcywgZXRjLi4uXG4gICAqIEl0J3Mgc3VpdGFibGUgZm9yIHNpbXBsZSB1c2UgY2FzZXMgbGlrZSBzYW1wbGUgYXBwcy5cbiAgICpcbiAgICogQHBhcmFtIGNsZWFyQ29sb3IgLSBjb2xvciB0byBjbGVhciB0aGUgY2FudmFzXG4gICAqL1xuICBwdWJsaWMgcHJvY2Vzc0F1dG8oY2xlYXJDb2xvciA9IFZlY3RvcjQuZnJvbUNvcHk0KDAsIDAsIDAsIDEpKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvKSkge1xuICAgICAgY29uc3QgZXhwcmVzc2lvbiA9IG5ldyBFeHByZXNzaW9uKCk7XG4gICAgICBjb25zdCByZW5kZXJQYXNzSW5pdCA9IG5ldyBSZW5kZXJQYXNzKHRoaXMpO1xuICAgICAgcmVuZGVyUGFzc0luaXQudG9DbGVhckNvbG9yQnVmZmVyID0gdHJ1ZTtcbiAgICAgIHJlbmRlclBhc3NJbml0LnRvQ2xlYXJEZXB0aEJ1ZmZlciA9IHRydWU7XG4gICAgICByZW5kZXJQYXNzSW5pdC5jbGVhckNvbG9yID0gY2xlYXJDb2xvcjtcbiAgICAgIGNvbnN0IHJlbmRlclBhc3NNYWluID0gbmV3IFJlbmRlclBhc3ModGhpcyk7XG4gICAgICBleHByZXNzaW9uLmFkZFJlbmRlclBhc3NlcyhbcmVuZGVyUGFzc0luaXQsIHJlbmRlclBhc3NNYWluXSk7XG4gICAgICB0aGlzLl9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvID0gZXhwcmVzc2lvbjtcbiAgICAgIHRoaXMuX19yZW5kZXJQYXNzRm9yUHJvY2Vzc0F1dG8gPSByZW5kZXJQYXNzTWFpbjtcbiAgICB9XG4gICAgdGhpcy5fX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0byEuY2xlYXJFbnRpdGllcygpO1xuICAgIGNvbnN0IGVudGl0aWVzID0gdGhpcy5fX2VudGl0eVJlcG9zaXRvcnkuX2dldEVudGl0aWVzKCk7XG4gICAgdGhpcy5fX3JlbmRlclBhc3NGb3JQcm9jZXNzQXV0byEuYWRkRW50aXRpZXMoZW50aXRpZXMgYXMgdW5rbm93biBhcyBJU2NlbmVHcmFwaEVudGl0eVtdKTtcbiAgICB0aGlzLnByb2Nlc3MoW3RoaXMuX19leHByZXNzaW9uRm9yUHJvY2Vzc0F1dG9dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb2Nlc3MgbWV0aG9kIHRvIHJlbmRlciBhIHNjZW5lXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFlvdSBuZWVkIHRvIGNhbGwgdGhpcyBtZXRob2QgZm9yIHJlbmRlcmluZy5cbiAgICpcbiAgICogQHBhcmFtIGZyYW1lL2V4cHJlc3Npb24gLSBhIGZyYW1lL2V4cHJlc3Npb24gb2JqZWN0XG4gICAqL1xuICBwdWJsaWMgcHJvY2VzcyhmcmFtZTogRnJhbWUpOiB2b2lkO1xuICBwdWJsaWMgcHJvY2VzcyhleHByZXNzaW9uczogRXhwcmVzc2lvbltdKTogdm9pZDtcbiAgcHVibGljIHByb2Nlc3ModmFsdWU6IGFueSkge1xuICAgIGNvbnN0IGdwdVRpbWVyRW5hYmxlZCA9IHRoaXMuX19ncHVUaW1lckVuYWJsZWQ7XG4gICAgaWYgKGdwdVRpbWVyRW5hYmxlZCkge1xuICAgICAgdGhpcy5fX2JlZ2luR3B1VGltZXIoKTtcbiAgICB9XG4gICAgVGltZS5fcHJvY2Vzc0JlZ2luKHRoaXMpO1xuICAgIHRoaXMuX19wcm9jZXNzQ29tcG9uZW50UnVudGltZUhvb2tzQmVnaW5GcmFtZSgpO1xuICAgIGlmICghdGhpcy5fX2lzTGlnaHRDbHVzdGVyU3lzdGVtTG9hZGVkICYmIExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpID4gMCkge1xuICAgICAgdGhpcy5fcmVxdWVzdExpZ2h0Q2x1c3RlclN5c3RlbSgpO1xuICAgIH1cbiAgICBsZXQgZXhwcmVzc2lvbnM6IEV4cHJlc3Npb25bXSA9IHZhbHVlO1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZyYW1lKSB7XG4gICAgICBleHByZXNzaW9ucyA9IHZhbHVlLmV4cHJlc3Npb25zO1xuICAgIH1cblxuICAgIGlmIChDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzKSA9PT0gQ29tcG9uZW50LkludmFsaWRPYmplY3RVSUQpIHtcbiAgICAgIEVuZ2luZS5jcmVhdGVDYW1lcmEodGhpcyk7XG4gICAgfVxuXG4gICAgY29uc3QgdGltZSA9IHRoaXMuX19nbG9iYWxEYXRhUmVwb3NpdG9yeS5nZXRWYWx1ZSgndGltZScsIDApIGFzIFNjYWxhcjtcbiAgICB0aW1lLl92WzBdID0gVGltZS50aW1lRnJvbVN5c3RlbVN0YXJ0O1xuXG4gICAgaWYgKHRoaXMucHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICB0aGlzLl9wcm9jZXNzV2ViR1BVKGV4cHJlc3Npb25zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcHJvY2Vzc1dlYkdMKGV4cHJlc3Npb25zKTtcbiAgICB9XG5cbiAgICBUaW1lLl9wcm9jZXNzRW5kKCk7XG4gICAgaWYgKGdwdVRpbWVyRW5hYmxlZCkge1xuICAgICAgdGhpcy5fX2VuZEdwdVRpbWVyKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIEdQVSB0aW1lIG9mIGVhY2ggcHJvY2VzcygpIGNhbGwgaXMgbWVhc3VyZWQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIERpc2FibGVkIGJ5IGRlZmF1bHQuIE1lYXN1cmluZyB1c2VzIEdQVSB0aW1lciBxdWVyaWVzIChFWFRfZGlzam9pbnRfdGltZXJfcXVlcnlfd2ViZ2wyIGluIFdlYkdMMiwgdGhlXG4gICAqIGB0aW1lc3RhbXAtcXVlcnlgIGZlYXR1cmUgaW4gV2ViR1BVKSwgd2hpY2ggYWRkIGEgc21hbGwgb3ZlcmhlYWQuIFNlZSB7QGxpbmsgZ3B1VGltZU1pbGxpc2Vjb25kc30uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGdwdVRpbWVyRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2dwdVRpbWVyRW5hYmxlZDtcbiAgfVxuXG4gIHB1YmxpYyBzZXQgZ3B1VGltZXJFbmFibGVkKGZsYWc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9fZ3B1VGltZXJFbmFibGVkID0gZmxhZztcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBHUFUgdGltZSBjYW4gYmUgbWVhc3VyZWQgaW4gdGhpcyBlbnZpcm9ubWVudC5cbiAgICogQnJvd3NlcnMgbWF5IG5vdCBleHBvc2UgR1BVIHRpbWVyIHF1ZXJpZXMgKGUuZy4gZm9yIHByaXZhY3kgcmVhc29ucyBvciBvbiBzb21lIHBsYXRmb3JtcykuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGlzR3B1VGltZXJTdXBwb3J0ZWQoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX19wcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHJldHVybiB0aGlzLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5fZ2V0R3B1VGltZXIoKS5pc1N1cHBvcnRlZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19nZXRXZWJHTEdwdVRpbWVyKCk/LmlzU3VwcG9ydGVkID8/IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBHUFUgdGltZSBzcGVudCBvbiB0aGUgbGF0ZXN0IG1lYXN1cmVkIHByb2Nlc3MoKSBjYWxsLCBpbiBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFVuZGVmaW5lZCB1bnRpbCBhIHJlc3VsdCBpcyBhdmFpbGFibGUsIG9yIHdoZW4ge0BsaW5rIGdwdVRpbWVyRW5hYmxlZH0gaXMgZmFsc2Ugb3IgdGhlIGVudmlyb25tZW50IGRvZXNcbiAgICogbm90IHN1cHBvcnQgR1BVIHRpbWVyIHF1ZXJpZXMuIEdQVSByZXN1bHRzIGFycml2ZSBhc3luY2hyb25vdXNseSwgc28gdGhlIHZhbHVlIGxhZ3MgYmVoaW5kIGJ5IGEgZmV3XG4gICAqIGZyYW1lcy4gSW4gV2ViR1BVIGl0IGlzIHRoZSBzdW0gb2YgdGhlIGR1cmF0aW9ucyBvZiB0aGUgcmVuZGVyIHBhc3NlcyBhbmQgdGhlIGNvbXB1dGUgcGFzc2VzIChzdWNoIGFzXG4gICAqIHRoZSBsaWdodCBjbHVzdGVyIGJ1aWxkKTsgaW4gV2ViR0wyIGl0IGlzIHRoZSB0aW1lIHRoZSBHUFUgc3BlbnQgb24gYWxsIHRoZSBjb21tYW5kcyBpc3N1ZWQgZHVyaW5nXG4gICAqIHByb2Nlc3MoKS5cbiAgICovXG4gIHB1YmxpYyBnZXQgZ3B1VGltZU1pbGxpc2Vjb25kcygpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5fX2dwdVRpbWVyRW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19wcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Py5fZ2V0R3B1VGltZXIoKS5sYXN0R3B1VGltZU1pbGxpc2Vjb25kcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193ZWJnbEdwdVRpbWVyPy5sYXN0R3B1VGltZU1pbGxpc2Vjb25kcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgR1BVIHRpbWUgb2YgZWFjaCBwYXNzIG9mIHRoZSBsYXRlc3QgbWVhc3VyZWQgcHJvY2VzcygpIGNhbGwsIGluIG1pbGxpc2Vjb25kcywga2V5ZWQgYnkgdGhlIHBhc3MgbGFiZWwuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFdlYkdQVSBvbmx5LiBVbmRlZmluZWQgdW50aWwgYSBjb21wbGV0ZSByZXN1bHQgaXMgYXZhaWxhYmxlLCB3aGVuIHtAbGluayBncHVUaW1lckVuYWJsZWR9IGlzIGZhbHNlLCBvclxuICAgKiB3aGVuIHRoZSBHUFUgdGltZXIgaXMgbm90IHN1cHBvcnRlZC4gVGhlIGxhYmVscyBhcmUgdGhlIGxhYmVscyBvZiB0aGUgR1BVIHBhc3NlczogdGhlIHVuaXF1ZSBuYW1lcyBvZiB0aGVcbiAgICogcmVuZGVyIHBhc3NlcywgYERlcHRoUHJlcGFzc2AsIGBMaWdodENsdXN0ZXJCdWlsZGAsIGFuZCBzbyBvbi4gUGFzc2VzIHdpdGggdGhlIHNhbWUgbGFiZWwgYXJlIHN1bW1lZC5cbiAgICogTGlrZSB7QGxpbmsgZ3B1VGltZU1pbGxpc2Vjb25kc30sIHRoZSB2YWx1ZSBsYWdzIGJlaGluZCBieSBhIGZldyBmcmFtZXMuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGdwdVBhc3NUaW1lc01pbGxpc2Vjb25kcygpOiBSZWFkb25seU1hcDxzdHJpbmcsIG51bWJlcj4gfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5fX2dwdVRpbWVyRW5hYmxlZCB8fCB0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoICE9PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeT8uX2dldEdwdVRpbWVyKCkubGFzdFBhc3NHcHVUaW1lc01pbGxpc2Vjb25kcztcbiAgfVxuXG4gIHByaXZhdGUgX19nZXRXZWJHTEdwdVRpbWVyKCk6IFdlYkdMR3B1VGltZXIgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9fd2ViZ2xHcHVUaW1lciA9PSBudWxsKSB7XG4gICAgICBjb25zdCBnbHcgPSB0aGlzLl9fd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnk/LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgICAgaWYgKGdsdyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICB0aGlzLl9fd2ViZ2xHcHVUaW1lciA9IG5ldyBXZWJHTEdwdVRpbWVyKGdsdy5nZXRSYXdDb250ZXh0QXNXZWJHTDIoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fd2ViZ2xHcHVUaW1lcjtcbiAgfVxuXG4gIHByaXZhdGUgX19iZWdpbkdwdVRpbWVyKCkge1xuICAgIGlmICh0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICB0aGlzLl9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Py5fZ2V0R3B1VGltZXIoKS5iZWdpbkZyYW1lKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19nZXRXZWJHTEdwdVRpbWVyKCk/LmJlZ2luKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2VuZEdwdVRpbWVyKCkge1xuICAgIGlmICh0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICB0aGlzLl9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5Py5fZ2V0R3B1VGltZXIoKS5lbmRGcmFtZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fd2ViZ2xHcHVUaW1lcj8uZW5kKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX3Byb2Nlc3NSZW5kZXJQYXNzV2ViR1BVKHtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnksXG4gICAgcmVuZGVyUGFzcyxcbiAgICByZW5kZXJQYXNzVGlja0NvdW50LFxuICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgZGlzcGxheUlkeCxcbiAgICBoYXNBbnlFZmZla3NlZXJDb21wb25lbnRzLFxuICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyxcbiAgfToge1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3M7XG4gICAgcmVuZGVyUGFzc1RpY2tDb3VudDogbnVtYmVyO1xuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdO1xuICAgIGRpc3BsYXlJZHg6IG51bWJlcjtcbiAgICBoYXNBbnlFZmZla3NlZXJDb21wb25lbnRzOiBib29sZWFuO1xuICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icz86IERlZmVycmVkRWZmZWtzZWVyV2ViR1BVUmVuZGVySm9iW107XG4gIH0pOiBib29sZWFuIHtcbiAgICAvLyBSdW4gcHJlLXJlbmRlciBob29rIHBlci1leWUgKGVuc3VyZXMgcGVyLXZpZXcgZnJhbWVidWZmZXIgYWRqdXN0bWVudHMpXG4gICAgcmVuZGVyUGFzcy5kb1ByZVJlbmRlcigpO1xuXG4gICAgLy8gU2Nhbm5pbmcgZXZlcnkgZW50aXR5IGZvciBhbiBFZmZla3NlZXJDb21wb25lbnQgY29zdHMgYSBjb21wb25lbnQgbG9va3VwXG4gICAgLy8gcGVyIGVudGl0eSBwbHVzIHR3byBhcnJheSBhbGxvY2F0aW9ucyBwZXIgcmVuZGVyIHBhc3MgKGFuZCBwZXIgZXllKS4gT25seVxuICAgIC8vIGRvIGl0IHdoZW4gdGhpcyBwYXNzIGFjdHVhbGx5IHJlbmRlcnMgRWZmZWtzZWVyIGVmZmVjdHMgYW5kIGF0IGxlYXN0IG9uZVxuICAgIC8vIEVmZmVrc2VlckNvbXBvbmVudCBleGlzdHMgaW4gdGhlIGVuZ2luZS5cbiAgICBsZXQgZWZmZWtzZWVyQ29tcG9uZW50czogRWZmZWtzZWVyQ29tcG9uZW50W10gfCB1bmRlZmluZWQ7XG4gICAgaWYgKGhhc0FueUVmZmVrc2VlckNvbXBvbmVudHMgJiYgcmVuZGVyUGFzcy50b1JlbmRlckVmZmVrc2VlckVmZmVjdHMpIHtcbiAgICAgIGVmZmVrc2VlckNvbXBvbmVudHMgPSBbXTtcbiAgICAgIGNvbnN0IGVudGl0aWVzID0gcmVuZGVyUGFzcy5lbnRpdGllcztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZWZmZWtzZWVyQ29tcG9uZW50ID0gZW50aXRpZXNbaV0udHJ5VG9HZXRFZmZla3NlZXIoKTtcbiAgICAgICAgaWYgKGVmZmVrc2VlckNvbXBvbmVudCAhPSBudWxsKSB7XG4gICAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50cy5wdXNoKGVmZmVrc2VlckNvbXBvbmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChlZmZla3NlZXJDb21wb25lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBlZmZla3NlZXJDb21wb25lbnRzID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYXNFZmZla3NlZXJFZmZlY3RzID0gZWZmZWtzZWVyQ29tcG9uZW50cyAhPSBudWxsO1xuICAgIGNvbnN0IGVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zID0gaGFzRWZmZWtzZWVyRWZmZWN0c1xuICAgICAgPyB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0RWZmZWtzZWVyUmVuZGVyUGFzc09wdGlvbnModGhpcywgcmVuZGVyUGFzcywgZGlzcGxheUlkeClcbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHNob3VsZFJlbmRlckVmZmVrc2VlckVmZmVjdHMgPSByZW5kZXJQYXNzLnRvUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyAmJiBoYXNFZmZla3NlZXJFZmZlY3RzO1xuICAgIGNvbnN0IHNob3VsZERlZmVyRWZmZWtzZWVyRWZmZWN0cyA9XG4gICAgICBzaG91bGRSZW5kZXJFZmZla3NlZXJFZmZlY3RzICYmIHJlbmRlclBhc3MuZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCkgIT0gbnVsbCAmJiBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnMgIT0gbnVsbDtcbiAgICBpZiAoc2hvdWxkUmVuZGVyRWZmZWtzZWVyRWZmZWN0cyAmJiBlZmZla3NlZXJSZW5kZXJQYXNzT3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGNvbnN0IGVmZmVrc2VlckNvbXBvbmVudCBvZiBlZmZla3NlZXJDb21wb25lbnRzISkge1xuICAgICAgICBlZmZla3NlZXJDb21wb25lbnQucHJlcGFyZVdlYkdQVVJlbmRlcmluZyhlZmZla3NlZXJSZW5kZXJQYXNzT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzaG91bGREZWZlckVmZmVrc2VlckVmZmVjdHMpIHtcbiAgICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyEucHVzaCh7XG4gICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgIGRpc3BsYXlJZHgsXG4gICAgICAgIHJlbmRlclBhc3NPcHRpb25zOiBlZmZla3NlZXJSZW5kZXJQYXNzT3B0aW9ucyxcbiAgICAgICAgZWZmZWtzZWVyQ29tcG9uZW50czogZWZmZWtzZWVyQ29tcG9uZW50cyEsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBjbGVhciBGcmFtZWJ1ZmZlclxuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5jbGVhckZyYW1lQnVmZmVyKHRoaXMsIHJlbmRlclBhc3MsIGRpc3BsYXlJZHgpO1xuXG4gICAgdGhpcy5fX3JlbmRlck1lc2hlc1dlYkdQVSh7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnksXG4gICAgICByZW5kZXJQYXNzLFxuICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICBkaXNwbGF5SWR4LFxuICAgICAgc2hvdWxkS2VlcFJlbmRlclBhc3NGb3JFZmZla3NlZXI6IHNob3VsZFJlbmRlckVmZmVrc2VlckVmZmVjdHMgJiYgIXNob3VsZERlZmVyRWZmZWtzZWVyRWZmZWN0cyxcbiAgICB9KTtcblxuICAgIGlmIChzaG91bGRSZW5kZXJFZmZla3NlZXJFZmZlY3RzICYmICFzaG91bGREZWZlckVmZmVrc2VlckVmZmVjdHMpIHtcbiAgICAgIGNvbnN0IHJlbmRlclBhc3NFbmNvZGVyID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldE9yQ3JlYXRlUmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXJFeHRlcm5hbFJlbmRlcmluZyhcbiAgICAgICAgdGhpcyxcbiAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgZGlzcGxheUlkeFxuICAgICAgKTtcblxuICAgICAgaWYgKHJlbmRlclBhc3NFbmNvZGVyICE9IG51bGwpIHtcbiAgICAgICAgZm9yIChjb25zdCBlZmZla3NlZXJDb21wb25lbnQgb2YgZWZmZWtzZWVyQ29tcG9uZW50cyEpIHtcbiAgICAgICAgICBlZmZla3NlZXJDb21wb25lbnQuJHJlbmRlcldlYkdQVShyZW5kZXJQYXNzRW5jb2RlciwgZWZmZWtzZWVyUmVuZGVyUGFzc09wdGlvbnMsIGRpc3BsYXlJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZW5kUmVuZGVyUGFzc0VuY29kZXJGb3JFeHRlcm5hbFJlbmRlcmluZygpO1xuICAgIH1cblxuICAgIHJlbmRlclBhc3MuX2NvcHlSZXNvbHZlMVRvUmVzb2x2ZTJXZWJHcHUoKTtcbiAgICByZW5kZXJQYXNzLmRvUG9zdFJlbmRlcigpO1xuXG4gICAgcmV0dXJuIHNob3VsZFJlbmRlckVmZmVrc2VlckVmZmVjdHM7XG4gIH1cblxuICBwcml2YXRlIF9fcmVuZGVyRGVmZXJyZWRFZmZla3NlZXJFZmZlY3RzQWZ0ZXJSZXNvbHZlV2ViR1BVKHtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnksXG4gICAgY3VycmVudFJlbmRlclBhc3MsXG4gICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzLFxuICAgIGRpc3BsYXlJZHgsXG4gIH06IHtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnk6IFdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjdXJyZW50UmVuZGVyUGFzczogUmVuZGVyUGFzcztcbiAgICBkZWZlcnJlZEVmZmVrc2VlclJlbmRlckpvYnM6IERlZmVycmVkRWZmZWtzZWVyV2ViR1BVUmVuZGVySm9iW107XG4gICAgZGlzcGxheUlkeDogbnVtYmVyO1xuICB9KSB7XG4gICAgaWYgKGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50UmVzb2x2ZUZyYW1lYnVmZmVyID0gY3VycmVudFJlbmRlclBhc3MuZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCk7XG4gICAgaWYgKGN1cnJlbnRSZXNvbHZlRnJhbWVidWZmZXIgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgam9iIG9mIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icykge1xuICAgICAgaWYgKGpvYi5kaXNwbGF5SWR4ICE9PSBkaXNwbGF5SWR4IHx8IGpvYi5yZW5kZXJQYXNzLmdldFJlc29sdmVGcmFtZWJ1ZmZlcigpICE9PSBjdXJyZW50UmVzb2x2ZUZyYW1lYnVmZmVyKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZW5kZXJQYXNzRW5jb2RlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRPckNyZWF0ZVJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyRXh0ZXJuYWxSZW5kZXJpbmcoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGpvYi5yZW5kZXJQYXNzLFxuICAgICAgICBkaXNwbGF5SWR4XG4gICAgICApO1xuXG4gICAgICBpZiAocmVuZGVyUGFzc0VuY29kZXIgIT0gbnVsbCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVmZmVrc2VlckNvbXBvbmVudCBvZiBqb2IuZWZmZWtzZWVyQ29tcG9uZW50cykge1xuICAgICAgICAgIGVmZmVrc2VlckNvbXBvbmVudC4kcmVuZGVyV2ViR1BVKHJlbmRlclBhc3NFbmNvZGVyLCBqb2IucmVuZGVyUGFzc09wdGlvbnMsIGRpc3BsYXlJZHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZW5kUmVuZGVyUGFzc0VuY29kZXJGb3JFeHRlcm5hbFJlbmRlcmluZygpO1xuICAgICAgam9iLnJlbmRlclBhc3MuX2NvcHlSZXNvbHZlMVRvUmVzb2x2ZTJXZWJHcHUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9fcmVuZGVyTWVzaGVzV2ViR1BVKHtcbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnksXG4gICAgcmVuZGVyUGFzcyxcbiAgICByZW5kZXJQYXNzVGlja0NvdW50LFxuICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgZGlzcGxheUlkeCxcbiAgICBzaG91bGRLZWVwUmVuZGVyUGFzc0ZvckVmZmVrc2VlcixcbiAgfToge1xuICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTogV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHJlbmRlclBhc3M6IFJlbmRlclBhc3M7XG4gICAgcmVuZGVyUGFzc1RpY2tDb3VudDogbnVtYmVyO1xuICAgIHByaW1pdGl2ZVVpZHM6IFByaW1pdGl2ZVVJRFtdO1xuICAgIGRpc3BsYXlJZHg6IG51bWJlcjtcbiAgICBzaG91bGRLZWVwUmVuZGVyUGFzc0ZvckVmZmVrc2VlcjogYm9vbGVhbjtcbiAgfSk6IEdQVVJlbmRlclBhc3NFbmNvZGVyIHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgcmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXI6IEdQVVJlbmRlclBhc3NFbmNvZGVyIHwgdW5kZWZpbmVkO1xuICAgIGxldCBkb1JlbmRlciA9IHJlbmRlclBhc3MuX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlO1xuICAgIGlmIChkb1JlbmRlcikge1xuICAgICAgaWYgKHNob3VsZEtlZXBSZW5kZXJQYXNzRm9yRWZmZWtzZWVyKSB7XG4gICAgICAgIHJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LnJlbmRlcldpdGhSZW5kZXJCdW5kbGVBbmRLZWVwUmVuZGVyUGFzcyhcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIHJlbmRlclBhc3MsXG4gICAgICAgICAgZGlzcGxheUlkeFxuICAgICAgICApO1xuICAgICAgICBkb1JlbmRlciA9IHJlbmRlclBhc3NFbmNvZGVyRm9yRWZmZWtzZWVyID09IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb1JlbmRlciA9ICF3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkucmVuZGVyV2l0aFJlbmRlckJ1bmRsZSh0aGlzLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19lbmdpbmVTdGF0ZS53ZWJncHVSZW5kZXJCdW5kbGVNb2RlIHx8PSBkb1JlbmRlcjtcbiAgICB9XG5cbiAgICBpZiAoIWRvUmVuZGVyKSB7XG4gICAgICByZXR1cm4gcmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXI7XG4gICAgfVxuXG4gICAgLy8gVGhlIHJlbmRlciBidW5kbGUgY291bGQgbm90IGJlIHJldXNlZCAoZmlyc3QgZnJhbWUsIGNhY2hlIGludmFsaWRhdGlvbixcbiAgICAvLyBvciBjaGFuZ2VkIHNvcnQgb3JkZXIpLCBzbyByZWNvcmQgZnJlc2ggY29tbWFuZHMuIENyZWF0aW5nIHRoZSBidW5kbGVcbiAgICAvLyBlbmNvZGVyIG9ubHkgaGVyZSBhdm9pZHMgZGVzY3JpcHRvciBjb21wdXRhdGlvbiBhbmQgR1BVIGVuY29kZXJcbiAgICAvLyBhbGxvY2F0aW9uIG9uIGV2ZXJ5IGZyYW1lIHdoZXJlIGEgY2FjaGVkIGJ1bmRsZSBpcyBleGVjdXRlZC5cbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlUmVuZGVyQnVuZGxlRW5jb2Rlcih0aGlzLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcblxuICAgIGNvbnN0IHJlbmRlcmVkU29tZXRoaW5nID0gTWVzaFJlbmRlcmVyQ29tcG9uZW50LmNvbW1vbl8kcmVuZGVyKHtcbiAgICAgIHJlbmRlclBhc3M6IHJlbmRlclBhc3MsXG4gICAgICByZW5kZXJQYXNzVGlja0NvdW50LFxuICAgICAgcHJpbWl0aXZlVWlkcyxcbiAgICAgIGRpc3BsYXlJZHgsXG4gICAgICBlbmdpbmU6IHRoaXMsXG4gICAgfSk7XG4gICAgcmVuZGVyUGFzcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmUgPSByZW5kZXJlZFNvbWV0aGluZztcbiAgICBpZiAoIXJlbmRlcmVkU29tZXRoaW5nKSB7XG4gICAgICByZXR1cm4gcmVuZGVyUGFzc0VuY29kZXJGb3JFZmZla3NlZXI7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZEtlZXBSZW5kZXJQYXNzRm9yRWZmZWtzZWVyKSB7XG4gICAgICByZXR1cm4gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmZpbmlzaFJlbmRlckJ1bmRsZUVuY29kZXJBbmRLZWVwUmVuZGVyUGFzcyh0aGlzLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcbiAgICB9XG5cbiAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZmluaXNoUmVuZGVyQnVuZGxlRW5jb2Rlcih0aGlzLCByZW5kZXJQYXNzLCBkaXNwbGF5SWR4KTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfcHJvY2Vzc1dlYkdQVShleHByZXNzaW9uczogRXhwcmVzc2lvbltdKSB7XG4gICAgY29uc3QgY29tcG9uZW50VGlkcyA9IHRoaXMuX19jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudFRJRHMoKTtcbiAgICBjb25zdCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCB3ZWJ4clN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBmb3IgKGNvbnN0IHN0YWdlIG9mIENvbXBvbmVudC5fcHJvY2Vzc1N0YWdlcykge1xuICAgICAgaWYgKHN0YWdlID09PSBQcm9jZXNzU3RhZ2UuUmVuZGVyKSB7XG4gICAgICAgIC8vIFRoZSBsaWdodCBsaXN0cyBtdXN0IGJlIHdyaXR0ZW4gYmVmb3JlIHRoZSBzdHJhdGVneSB1cGxvYWRzIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSBpbiBwcmVyZW5kZXIuXG4gICAgICAgIHRoaXMuX19saWdodENsdXN0ZXJTeXN0ZW0udXBkYXRlKGV4cHJlc3Npb25zKTtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50LmNvbW1vbl8kcHJlcmVuZGVyKHRoaXMpO1xuICAgICAgICBjb25zdCBpc1dlYlhSTW9kZSA9IHdlYnhyU3lzdGVtPy5pc1dlYlhSTW9kZSA/PyBmYWxzZTtcbiAgICAgICAgY29uc3QgaXNNdWx0aVZpZXcgPSB3ZWJ4clN5c3RlbT8uaXNNdWx0aVZpZXcoKSA/PyBmYWxzZTtcbiAgICAgICAgY29uc3QgeHJQb3NlID0gdGhpcy5fX2VuZ2luZVN0YXRlLnhyUG9zZVdlYkdQVTtcbiAgICAgICAgY29uc3QgZGlzcGxheUNvdW50ID0gaXNXZWJYUk1vZGUgJiYgIWlzTXVsdGlWaWV3ICYmIHhyUG9zZSAhPSBudWxsID8geHJQb3NlLnZpZXdzLmxlbmd0aCA6IDE7XG4gICAgICAgIC8vIEVmZmVrc2VlciBpcyByYXJlbHkgdXNlZC4gRGV0ZWN0IGl0IG9uY2UgcGVyIGZyYW1lIHNvIHRoZSBwZXItcGFzc1xuICAgICAgICAvLyBjb2RlIGNhbiBza2lwIGVudGl0eSBzY2Fucywgam9iIGFycmF5cyBhbmQgdGhlIGRlZmVycmVkLXJlbmRlciBjYWxsLlxuICAgICAgICBjb25zdCBoYXNBbnlFZmZla3NlZXJDb21wb25lbnRzID0gdGhpcy5fX2NvbXBvbmVudFJlcG9zaXRvcnkuaGFzQW55Q29tcG9uZW50KFxuICAgICAgICAgIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuRWZmZWtzZWVyQ29tcG9uZW50VElEXG4gICAgICAgICk7XG4gICAgICAgIC8vIFRoZSBtYXBzIG9ubHkgZXhpc3QgdG8gc2hhcmUgc29ydGluZyB3b3JrIGJldHdlZW4gdGhlIGV5ZXMgaW4gc3RlcmVvXG4gICAgICAgIC8vIHJlbmRlcmluZy4gQWxsb2NhdGluZyB0aGVtIGZvciB0aGUgY29tbW9uIHNpbmdsZS1kaXNwbGF5IGNhc2UgY29zdHNcbiAgICAgICAgLy8gdHdvIE1hcCBhbGxvY2F0aW9ucyBvbiBldmVyeSBmcmFtZS5cbiAgICAgICAgY29uc3QgaXNNdWx0aURpc3BsYXkgPSBkaXNwbGF5Q291bnQgPiAxO1xuICAgICAgICBjb25zdCByZW5kZXJQYXNzVGlja0NvdW50TWFwID0gaXNNdWx0aURpc3BsYXkgPyBuZXcgTWFwPG51bWJlciwgbnVtYmVyPigpIDogdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBwcmltaXRpdmVVaWRzTWFwID0gaXNNdWx0aURpc3BsYXkgPyBuZXcgTWFwPG51bWJlciwgUHJpbWl0aXZlVUlEW10+KCkgOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgZm9yIChsZXQgZGlzcGxheUlkeCA9IDA7IGRpc3BsYXlJZHggPCBkaXNwbGF5Q291bnQ7IGRpc3BsYXlJZHgrKykge1xuICAgICAgICAgIGNvbnN0IGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9iczogRGVmZXJyZWRFZmZla3NlZXJXZWJHUFVSZW5kZXJKb2JbXSB8IHVuZGVmaW5lZCA9IGhhc0FueUVmZmVrc2VlckNvbXBvbmVudHNcbiAgICAgICAgICAgID8gW11cbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGxldCByZW5kZXJlZEVmZmVrc2VlckVmZmVjdHNJbkRpc3BsYXkgPSBmYWxzZTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGV4cCBvZiBleHByZXNzaW9ucykge1xuICAgICAgICAgICAgZm9yIChjb25zdCByZW5kZXJQYXNzIG9mIGV4cC5yZW5kZXJQYXNzZXMpIHtcbiAgICAgICAgICAgICAgY29uc3QgcmVuZGVyUGFzc1VpZCA9IHJlbmRlclBhc3MucmVuZGVyUGFzc1VJRDtcbiAgICAgICAgICAgICAgbGV0IHJlbmRlclBhc3NUaWNrQ291bnQgPSByZW5kZXJQYXNzVGlja0NvdW50TWFwPy5nZXQocmVuZGVyUGFzc1VpZCk7XG4gICAgICAgICAgICAgIGxldCBwcmltaXRpdmVVaWRzOiBQcmltaXRpdmVVSURbXTtcbiAgICAgICAgICAgICAgaWYgKHJlbmRlclBhc3NUaWNrQ291bnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQgPSB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudDtcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzLl9pc0NoYW5nZWRTb3J0UmVuZGVyUmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcHJpbWl0aXZlVWlkcyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5zb3J0XyRyZW5kZXIodGhpcywgcmVuZGVyUGFzcyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlbmRlclBhc3NUaWNrQ291bnRNYXAgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudE1hcC5zZXQocmVuZGVyUGFzc1VpZCwgcmVuZGVyUGFzc1RpY2tDb3VudCk7XG4gICAgICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzTWFwIS5zZXQocmVuZGVyUGFzc1VpZCwgcHJpbWl0aXZlVWlkcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHMgPSBwcmltaXRpdmVVaWRzTWFwIS5nZXQocmVuZGVyUGFzc1VpZCkhO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgcmVuZGVyZWRFZmZla3NlZXJFZmZlY3RzID0gdGhpcy5fX3Byb2Nlc3NSZW5kZXJQYXNzV2ViR1BVKHtcbiAgICAgICAgICAgICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnksXG4gICAgICAgICAgICAgICAgcmVuZGVyUGFzcyxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50LFxuICAgICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICAgICAgICAgICAgZGlzcGxheUlkeCxcbiAgICAgICAgICAgICAgICBoYXNBbnlFZmZla3NlZXJDb21wb25lbnRzLFxuICAgICAgICAgICAgICAgIGRlZmVycmVkRWZmZWtzZWVyUmVuZGVySm9icyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJlbmRlcmVkRWZmZWtzZWVyRWZmZWN0c0luRGlzcGxheSB8fD0gcmVuZGVyZWRFZmZla3NlZXJFZmZlY3RzO1xuICAgICAgICAgICAgICBpZiAoZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzICE9IG51bGwgJiYgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmVuZGVyRGVmZXJyZWRFZmZla3NlZXJFZmZlY3RzQWZ0ZXJSZXNvbHZlV2ViR1BVKHtcbiAgICAgICAgICAgICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSxcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRSZW5kZXJQYXNzOiByZW5kZXJQYXNzLFxuICAgICAgICAgICAgICAgICAgZGVmZXJyZWRFZmZla3NlZXJSZW5kZXJKb2JzLFxuICAgICAgICAgICAgICAgICAgZGlzcGxheUlkeCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIGFkdmFuY2UgdGljayBjb3VudCBvbmx5IGFmdGVyIHRoZSBmaW5hbCBkaXNwbGF5IGhhcyBiZWVuIHByb2Nlc3NlZFxuICAgICAgICAgICAgICBpZiAoZGlzcGxheUlkeCA9PT0gZGlzcGxheUNvdW50IC0gMSkge1xuICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnRNYXA/LmRlbGV0ZShyZW5kZXJQYXNzVWlkKTtcbiAgICAgICAgICAgICAgICBwcmltaXRpdmVVaWRzTWFwPy5kZWxldGUocmVuZGVyUGFzc1VpZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZGlzcGxheUlkeCA8IGRpc3BsYXlDb3VudCAtIDEgJiYgcmVuZGVyZWRFZmZla3NlZXJFZmZlY3RzSW5EaXNwbGF5KSB7XG4gICAgICAgICAgICAvLyBFZmZla3NlZXIgV2ViR1BVIHVwZGF0ZXMgY2FtZXJhIG1hdHJpY2VzIGluIGJhY2tlbmQgR1BVIHN0YXRlIHdoaWxlIFJob2Rvbml0ZSBpcyBzdGlsbCByZWNvcmRpbmcgY29tbWFuZHMuXG4gICAgICAgICAgICAvLyBTdWJtaXR0aW5nIHBlciBleWUgcHJldmVudHMgdGhlIHJpZ2h0LWV5ZSB1cGRhdGUgZnJvbSBiZWluZyBvYnNlcnZlZCBieSBsZWZ0LWV5ZSBkcmF3IGNvbW1hbmRzLlxuICAgICAgICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmZsdXNoKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5mbHVzaCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICF0aGlzLl9fZW5naW5lU3RhdGUud2ViZ3B1UmVuZGVyQnVuZGxlTW9kZSB8fFxuICAgICAgICAgIHRoaXMuX19pc0NvbXBvbmVudFJ1bnRpbWVIb29rRGlydHkoKSB8fFxuICAgICAgICAgIFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCB8fFxuICAgICAgICAgIFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudCgpICE9PSB0aGlzLl9fbGFzdFByaW1pdGl2ZUNvdW50IHx8XG4gICAgICAgICAgTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcykgIT09IHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnRcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy8gQnVpbHQgb25seSB3aGVuIHRoZSBzdGFnZSBhY3R1YWxseSBydW5zOiBhIHN0YXRpYyBzY2VuZSBza2lwcyBpdCBvbiBldmVyeSBmcmFtZS5cbiAgICAgICAgICBjb25zdCBjb21tb25NZXRob2ROYW1lID0gYGNvbW1vbl8ke3N0YWdlLm1ldGhvZE5hbWV9YDtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNvbXBvbmVudFRpZCBvZiBjb21wb25lbnRUaWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudCA9IENvbXBvbmVudFJlcG9zaXRvcnkuZ2V0Q29tcG9uZW50Q2xhc3MoY29tcG9uZW50VGlkKSE7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCA9IChjb21wb25lbnRDbGFzcyBhcyBhbnkpW2NvbW1vbk1ldGhvZE5hbWVdO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCkge1xuICAgICAgICAgICAgICBjb21wb25lbnRDbGFzc19jb21tb25NZXRob2Qoe1xuICAgICAgICAgICAgICAgIHByb2Nlc3NBcHByb2FjaDogdGhpcy5fX3Byb2Nlc3NBcHByb2FjaCxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzOiB2b2lkIDAsXG4gICAgICAgICAgICAgICAgcHJvY2Vzc1N0YWdlOiBzdGFnZSxcbiAgICAgICAgICAgICAgICByZW5kZXJQYXNzVGlja0NvdW50OiB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCxcbiAgICAgICAgICAgICAgICBkaXNwbGF5SWR4OiAwLFxuICAgICAgICAgICAgICAgIGVuZ2luZTogdGhpcyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbXBvbmVudENsYXNzLnByb2Nlc3ModGhpcywgY29tcG9uZW50Q2xhc3MsIHN0YWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzdGFnZSA9PT0gUHJvY2Vzc1N0YWdlLkxvZ2ljKSB7XG4gICAgICAgIC8vIFRoZSB0cmFuc2Zvcm0gZ2l6bW9zIGtlZXAgYSBjb25zdGFudCBvbi1zY3JlZW4gc2l6ZSwgc28gdGhleSBoYXZlIHRvIGJlIHJlc2NhbGVkXG4gICAgICAgIC8vIGFmdGVyIHRoZSBDYW1lcmFDb21wb25lbnQgKFRJRCA5KSBoYXMgdXBkYXRlZCBpdHMgbWF0cmljZXMuIFRoaXMgcnVucyBvdXRzaWRlIHRoZVxuICAgICAgICAvLyBjaGFuZ2UgZ2F0ZSBhYm92ZSBzbyB0aGF0IGEgZnJhbWUgd2hpY2ggc2tpcHMgdGhlIExvZ2ljIHN0YWdlIHN0aWxsIGNvcnJlY3RzIHRoZW0uXG4gICAgICAgIFNjZW5lR3JhcGhDb21wb25lbnQuX3VwZGF0ZVRyYW5zZm9ybUdpem1vc0J5Q2FtZXJhQ2hhbmdlKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50Q2FtZXJhVXBkYXRlQ291bnQodGhpcyk7XG4gICAgdGhpcy5fX3Byb2Nlc3NDb21wb25lbnRSdW50aW1lSG9va3NNYXJrVXBkYXRlZCgpO1xuICAgIHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpO1xuICAgIHRoaXMuX19sYXN0UHJpbWl0aXZlQ291bnQgPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnQoKTtcbiAgICB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gTGlnaHRDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcyk7XG4gIH1cblxuICBwcml2YXRlIF9fcHJvY2Vzc0NvbXBvbmVudFJ1bnRpbWVIb29rc0JlZ2luRnJhbWUoKSB7XG4gICAgZm9yIChjb25zdCBob29rcyBvZiBfZ2V0Q29tcG9uZW50UnVudGltZUhvb2tzKCkpIHtcbiAgICAgIGhvb2tzLmJlZ2luRnJhbWU/Lih0aGlzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9faXNDb21wb25lbnRSdW50aW1lSG9va0RpcnR5KCk6IGJvb2xlYW4ge1xuICAgIGZvciAoY29uc3QgaG9va3Mgb2YgX2dldENvbXBvbmVudFJ1bnRpbWVIb29rcygpKSB7XG4gICAgICBpZiAoaG9va3MuaXNEaXJ0eT8uKHRoaXMpID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIF9fcHJvY2Vzc0NvbXBvbmVudFJ1bnRpbWVIb29rc01hcmtVcGRhdGVkKCkge1xuICAgIGZvciAoY29uc3QgaG9va3Mgb2YgX2dldENvbXBvbmVudFJ1bnRpbWVIb29rcygpKSB7XG4gICAgICBob29rcy5tYXJrVXBkYXRlZD8uKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19jbGVhbnVwQ29tcG9uZW50UnVudGltZUhvb2tzKCkge1xuICAgIGZvciAoY29uc3QgaG9va3Mgb2YgX2dldENvbXBvbmVudFJ1bnRpbWVIb29rcygpKSB7XG4gICAgICBob29rcy5jbGVhbnVwPy4odGhpcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfcHJvY2Vzc1dlYkdMKGV4cHJlc3Npb25zOiBFeHByZXNzaW9uW10pIHtcbiAgICAvLyBXZWJHTFxuICAgIGNvbnN0IHJlcG8gPSB0aGlzLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuXG4gICAgY29uc3QgY29tcG9uZW50VGlkcyA9IHRoaXMuX19jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudFRJRHMoKTtcbiAgICBjb25zdCByZW5kZXJpbmdDb21wb25lbnRUaWRzID0gdGhpcy5fX2NvbXBvbmVudFJlcG9zaXRvcnkuZ2V0UmVuZGVyaW5nQ29tcG9uZW50VElEcygpO1xuICAgIGZvciAoY29uc3Qgc3RhZ2Ugb2YgQ29tcG9uZW50Ll9wcm9jZXNzU3RhZ2VzKSB7XG4gICAgICBjb25zdCBtZXRob2ROYW1lID0gc3RhZ2UubWV0aG9kTmFtZTtcbiAgICAgIGNvbnN0IGNvbW1vbk1ldGhvZE5hbWUgPSBgY29tbW9uXyR7bWV0aG9kTmFtZX1gO1xuICAgICAgaWYgKHN0YWdlID09PSBQcm9jZXNzU3RhZ2UuUmVuZGVyKSB7XG4gICAgICAgIC8vIENvYWxlc2NlIHRoZSBHUFUgc2V0dXAgb2YgbWVzaGVzIGFkZGVkIHdoaWxlIGxvYWRpbmcgaW50byBvbmUgbXVsdGktZHJhdyByZWJ1aWxkLlxuICAgICAgICByZXBvLmdldE11bHRpRHJhd1JlcG9zaXRvcnkodGhpcykucmVidWlsZERpcnR5R3JvdXBzKCk7XG4gICAgICAgIC8vIFRoZSBsaWdodCBsaXN0cyBtdXN0IGJlIHdyaXR0ZW4gYmVmb3JlIHRoZSBzdHJhdGVneSB1cGxvYWRzIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSBpbiBwcmVyZW5kZXIuXG4gICAgICAgIHRoaXMuX19saWdodENsdXN0ZXJTeXN0ZW0udXBkYXRlKGV4cHJlc3Npb25zKTtcbiAgICAgICAgTWVzaFJlbmRlcmVyQ29tcG9uZW50LmNvbW1vbl8kcHJlcmVuZGVyKHRoaXMpO1xuICAgICAgICBmb3IgKGNvbnN0IGV4cCBvZiBleHByZXNzaW9ucykge1xuICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50VGlkIG9mIHJlbmRlcmluZ0NvbXBvbmVudFRpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50ID0gQ29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRDbGFzcyhjb21wb25lbnRUaWQpITtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVuZGVyUGFzcyBvZiBleHAucmVuZGVyUGFzc2VzKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3BlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzcGVjdG9yLnNldE1hcmtlcihgfCAke2V4cC51bmlxdWVOYW1lfTogJHtyZW5kZXJQYXNzLnVuaXF1ZU5hbWV9I2ApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlbmRlclBhc3MuZG9QcmVSZW5kZXIoKTtcblxuICAgICAgICAgICAgICByZXBvLnN3aXRjaERlcHRoVGVzdChyZW5kZXJQYXNzLmlzRGVwdGhUZXN0KTtcblxuICAgICAgICAgICAgICAvLyBiaW5kIEZyYW1lYnVmZmVyXG4gICAgICAgICAgICAgIHRoaXMuYmluZEZyYW1lYnVmZmVyV2ViR0wocmVuZGVyUGFzcyk7XG5cbiAgICAgICAgICAgICAgLy8gc2V0IFZpZXdwb3J0IGZvciBOb3JtYWwgKE5vdCBXZWJYUilcbiAgICAgICAgICAgICAgdGhpcy5zZXRWaWV3cG9ydEZvck5vcm1hbFJlbmRlcmluZyhyZW5kZXJQYXNzKTtcbiAgICAgICAgICAgICAgLy8gc2Npc3NvciBoaW50cyAoZS5nLiB0aGUgc2NyZWVuIGJvdW5kcyBvZiBhbiBTREYgcGFzcykgZm9yIG5vcm1hbCByZW5kZXJpbmdcbiAgICAgICAgICAgICAgdGhpcy5zZXRTY2lzc29yRm9yTm9ybWFsUmVuZGVyaW5nKHJlbmRlclBhc3MpO1xuXG4gICAgICAgICAgICAgIGlmIChjb21wb25lbnRUaWQgPT09IFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTWVzaFJlbmRlcmVyQ29tcG9uZW50VElEKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xlYXIgRnJhbWVidWZmZXJcbiAgICAgICAgICAgICAgICB0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuY2xlYXJGcmFtZUJ1ZmZlcih0aGlzLCByZW5kZXJQYXNzKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJlbmRlclBhc3MuX2lzQ2hhbmdlZFNvcnRSZW5kZXJSZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgY29uc3QgcHJpbWl0aXZlVWlkcyA9IE1lc2hSZW5kZXJlckNvbXBvbmVudC5zb3J0XyRyZW5kZXIodGhpcywgcmVuZGVyUGFzcyk7XG4gICAgICAgICAgICAgIGxldCBkb1JlbmRlciA9IHJlbmRlclBhc3MuX3JlbmRlcmVkU29tZXRoaW5nQmVmb3JlO1xuICAgICAgICAgICAgICBpZiAoZG9SZW5kZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnRDbGFzc19jb21tb25NZXRob2QgPSAoY29tcG9uZW50Q2xhc3MgYXMgYW55KVtjb21tb25NZXRob2ROYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCByZW5kZXJlZFNvbWV0aGluZyA9IGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCh7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NBcHByb2FjaDogdGhpcy5fX3Byb2Nlc3NBcHByb2FjaCxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGFzczogcmVuZGVyUGFzcyxcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc1N0YWdlOiBzdGFnZSxcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyUGFzc1RpY2tDb3VudDogdGhpcy5fX3JlbmRlclBhc3NUaWNrQ291bnQsXG4gICAgICAgICAgICAgICAgICAgIHByaW1pdGl2ZVVpZHMsXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlJZHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIGVuZ2luZTogdGhpcyxcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgcmVuZGVyUGFzcy5fcmVuZGVyZWRTb21ldGhpbmdCZWZvcmUgPSByZW5kZXJlZFNvbWV0aGluZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudFRpZCA9PT0gV2VsbEtub3duQ29tcG9uZW50VElEcy5FZmZla3NlZXJDb21wb25lbnRUSUQgJiYgcmVuZGVyUGFzcy5lbnRpdGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUZXh0dXJlMkRCaW5kaW5ncyA9IHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LmdldEN1cnJlbnRUZXh0dXJlMkRCaW5kaW5nc0ZvckVmZmVrc2VlcigpO1xuICAgICAgICAgICAgICAgIHdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5LnNldFdlYkdMU3RhdGVUb0RlZmF1bHRGb3JFZmZla3NlZXIoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVudGl0eSBvZiByZW5kZXJQYXNzLmVudGl0aWVzKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBlZmZla3NlZXJDb21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRFZmZla3NlZXIoKTtcbiAgICAgICAgICAgICAgICAgIGlmIChlZmZla3NlZXJDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBlZmZla3NlZXJDb21wb25lbnQuJHJlbmRlcigpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeS5yZXN0b3JlVGV4dHVyZTJEQmluZGluZ3NGb3JFZmZla3NlZXIoY3VycmVudFRleHR1cmUyREJpbmRpbmdzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aGlzLl9fcmVuZGVyUGFzc1RpY2tDb3VudCsrO1xuXG4gICAgICAgICAgICAgIHJlbmRlclBhc3MuX2NvcHlGcmFtZWJ1ZmZlclRvUmVzb2x2ZUZyYW1lYnVmZmVyc1dlYkdMKCk7XG5cbiAgICAgICAgICAgICAgcmVuZGVyUGFzcy5kb1Bvc3RSZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLl9faXNDb21wb25lbnRSdW50aW1lSG9va0RpcnR5KCkgfHxcbiAgICAgICAgICBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcykgIT09IHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50IHx8XG4gICAgICAgICAgQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzKSAhPT0gdGhpcy5fX2xhc3RDYW1lcmFDb21wb25lbnRzVXBkYXRlQ291bnQgfHxcbiAgICAgICAgICBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnQoKSAhPT0gdGhpcy5fX2xhc3RQcmltaXRpdmVDb3VudCB8fFxuICAgICAgICAgIExpZ2h0Q29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMpICE9PSB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50XG4gICAgICAgICkge1xuICAgICAgICAgIGZvciAoY29uc3QgY29tcG9uZW50VGlkIG9mIGNvbXBvbmVudFRpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50ID0gQ29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnRDbGFzcyhjb21wb25lbnRUaWQpITtcblxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kID0gKGNvbXBvbmVudENsYXNzIGFzIGFueSlbY29tbW9uTWV0aG9kTmFtZV07XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50Q2xhc3NfY29tbW9uTWV0aG9kKSB7XG4gICAgICAgICAgICAgIGNvbXBvbmVudENsYXNzX2NvbW1vbk1ldGhvZCh7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0FwcHJvYWNoOiB0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhc3M6IHZvaWQgMCxcbiAgICAgICAgICAgICAgICBwcm9jZXNzU3RhZ2U6IHN0YWdlLFxuICAgICAgICAgICAgICAgIHJlbmRlclBhc3NUaWNrQ291bnQ6IHRoaXMuX19yZW5kZXJQYXNzVGlja0NvdW50LFxuICAgICAgICAgICAgICAgIGRpc3BsYXlJZHg6IDAsXG4gICAgICAgICAgICAgICAgZW5naW5lOiB0aGlzLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29tcG9uZW50Q2xhc3MucHJvY2Vzcyh0aGlzLCBjb21wb25lbnRDbGFzcywgc3RhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHN0YWdlID09PSBQcm9jZXNzU3RhZ2UuTG9naWMpIHtcbiAgICAgICAgLy8gVGhlIHRyYW5zZm9ybSBnaXptb3Mga2VlcCBhIGNvbnN0YW50IG9uLXNjcmVlbiBzaXplLCBzbyB0aGV5IGhhdmUgdG8gYmUgcmVzY2FsZWRcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIENhbWVyYUNvbXBvbmVudCAoVElEIDkpIGhhcyB1cGRhdGVkIGl0cyBtYXRyaWNlcy4gVGhpcyBydW5zIG91dHNpZGUgdGhlXG4gICAgICAgIC8vIGNoYW5nZSBnYXRlIGFib3ZlIHNvIHRoYXQgYSBmcmFtZSB3aGljaCBza2lwcyB0aGUgTG9naWMgc3RhZ2Ugc3RpbGwgY29ycmVjdHMgdGhlbS5cbiAgICAgICAgU2NlbmVHcmFwaENvbXBvbmVudC5fdXBkYXRlVHJhbnNmb3JtR2l6bW9zQnlDYW1lcmFDaGFuZ2UodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudCh0aGlzKTtcbiAgICB0aGlzLl9fcHJvY2Vzc0NvbXBvbmVudFJ1bnRpbWVIb29rc01hcmtVcGRhdGVkKCk7XG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcyk7XG4gICAgdGhpcy5fX2xhc3RQcmltaXRpdmVDb3VudCA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudCgpO1xuICAgIHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSBMaWdodENvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgcHJvY2Vzc1RpbWUoKSB7XG4gICAgcmV0dXJuIFRpbWUubGFzdFRpbWVUaW1lSW50ZXJ2YWxJbk1pbGxpc2Vjb25kcztcbiAgfVxuXG4gIHN0YXRpYyBnZXQgdGltZUF0UHJvY2Vzc0JlZ2luKCkge1xuICAgIHJldHVybiBUaW1lLnRpbWVBdFByb2Nlc3NCZWdpbk1pbGxpc2Vjb25kcztcbiAgfVxuXG4gIHN0YXRpYyBnZXQgdGltZUF0UHJvY2Vzc0VuZCgpIHtcbiAgICByZXR1cm4gVGltZS50aW1lQXRQcm9jZXNzRW5kTWlsbGlzZWNvbmRzO1xuICB9XG5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVDYW1lcmEoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBjb25zdCBjYW1lcmFFbnRpdHkgPSBjcmVhdGVDYW1lcmFFbnRpdHkoZW5naW5lLCB0cnVlKTtcbiAgICBjYW1lcmFFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoWzAsIDAsIDFdKTtcbiAgICBjYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkudHlwZSA9IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljO1xuICAgIGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS56TmVhciA9IDAuMTtcbiAgICBjYW1lcmFFbnRpdHkuZ2V0Q2FtZXJhKCkuekZhciA9IDEwMDAwO1xuICAgIGNvbnN0IHdlYkNHQXBpUmVwb3NpdG9yeSA9IGVuZ2luZS5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICBjb25zdCBbd2lkdGgsIGhlaWdodF0gPSB3ZWJDR0FwaVJlcG9zaXRvcnkuZ2V0Q2FudmFzU2l6ZSgpO1xuICAgIGNhbWVyYUVudGl0eS5nZXRDYW1lcmEoKS54TWFnID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgY2FtZXJhRW50aXR5LmdldENhbWVyYSgpLnlNYWcgPSAxO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRWaWV3cG9ydEZvck5vcm1hbFJlbmRlcmluZyhyZW5kZXJQYXNzOiBSZW5kZXJQYXNzKSB7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gICAgY29uc3Qgd2ViQVJTeXN0ZW0gPSB0aGlzLl9fd2ViQVJTeXN0ZW07XG4gICAgaWYgKCghd2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlIHx8ICFyZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmcpICYmICF3ZWJBUlN5c3RlbT8uaXNXZWJBUk1vZGUpIHtcbiAgICAgICh0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLnNldFZpZXdwb3J0KHRoaXMsIHJlbmRlclBhc3MuZ2V0Vmlld3BvcnQoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgdGhlIHBhc3MncyBzY2lzc29yIHJlY3RhbmdsZSBmb3Igbm9ybWFsIChub24tWFIpIHJlbmRlcmluZy5cbiAgICpcbiAgICogVGhlIHNjaXNzb3IgaXMgYSBjdWxsaW5nIGhpbnQ7IFhSL0FSIHBhc3NlcyB1c2UgdGhlaXIgb3duIHZpZXdwb3J0cywgc28gdGhleVxuICAgKiBydW4gd2l0aG91dCBvbmUuXG4gICAqL1xuICBwcml2YXRlIHNldFNjaXNzb3JGb3JOb3JtYWxSZW5kZXJpbmcocmVuZGVyUGFzczogUmVuZGVyUGFzcykge1xuICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX3dlYlhSU3lzdGVtO1xuICAgIGNvbnN0IHdlYkFSU3lzdGVtID0gdGhpcy5fX3dlYkFSU3lzdGVtO1xuICAgIGNvbnN0IHJlcG9zaXRvcnkgPSB0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnk7XG4gICAgaWYgKCghd2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlIHx8ICFyZW5kZXJQYXNzLmlzVnJSZW5kZXJpbmcpICYmICF3ZWJBUlN5c3RlbT8uaXNXZWJBUk1vZGUpIHtcbiAgICAgIHJlcG9zaXRvcnkuc2V0U2Npc3NvclJlY3QocmVuZGVyUGFzcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcG9zaXRvcnkuc2V0U2Npc3NvclJlY3QodW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJpbmRGcmFtZWJ1ZmZlcldlYkdMKHJlbmRlclBhc3M6IFJlbmRlclBhc3MpIHtcbiAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgICBjb25zdCB3ZWJBUlN5c3RlbSA9IHRoaXMuX193ZWJBUlN5c3RlbTtcbiAgICBpZiAod2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlICYmIHJlbmRlclBhc3MuaXNPdXRwdXRGb3JWcikge1xuICAgICAgY29uc3QgZ2x3ID0gKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIhO1xuICAgICAgY29uc3QgZ2wgPSBnbHcuZ2V0UmF3Q29udGV4dCgpO1xuICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB3ZWJYUlN5c3RlbS5mcmFtZWJ1ZmZlciEpO1xuICAgIH0gZWxzZSBpZiAod2ViQVJTeXN0ZW0/LmlzV2ViQVJNb2RlKSB7XG4gICAgICBjb25zdCBnbHcgPSAodGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciE7XG4gICAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHdlYkFSU3lzdGVtLmZyYW1lYnVmZmVyISk7XG4gICAgfSBlbHNlIHtcbiAgICAgICh0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLmJpbmRGcmFtZWJ1ZmZlcihyZW5kZXJQYXNzLmdldEZyYW1lYnVmZmVyKCkpO1xuICAgICAgKHRoaXMuX19jZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuc2V0RHJhd1RhcmdldHMocmVuZGVyUGFzcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2Rpc3BsYXlSbkluZm8oKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgJWNSaG9kb25pdGUlY1dlYjNEIExpYnJhcnklYyAlY3ZlcnNpb24lYyR7VkVSU0lPTi52ZXJzaW9ufSVjICVjYnJhbmNoJWMke1ZFUlNJT04uYnJhbmNofSVjICVjbW9kZSVjJHt0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoLnN0cn1gLFxuICAgICAgJ2ZvbnQtd2VpZ2h0OiBib2xkOyBwYWRkaW5nOiA0cHggOHB4OyBib3JkZXItcmFkaXVzOiA2cHggMHB4IDBweCA2cHg7IGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgI2ZmMDA4NCAwJSwjZmYwMDIyIDEwMCUpOycsXG4gICAgICAncGFkZGluZzogNHB4OyBib3JkZXItcmFkaXVzOiAwcHggNnB4IDZweCAwcHg7IGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgIzg0MDBmZiAwJSwjNDQwMGZmIDEwMCUpOycsXG4gICAgICAnJyxcbiAgICAgICdiYWNrZ3JvdW5kOiAjNjY2OyBwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDZweCAwcHggMHB4IDZweCcsXG4gICAgICAnYmFja2dyb3VuZDogZmlyZWJyaWNrOyBwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDBweCA2cHggNnB4IDBweCcsXG4gICAgICAnJyxcbiAgICAgICdiYWNrZ3JvdW5kOiAjNjY2OyBwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDZweCAwcHggMHB4IDZweCcsXG4gICAgICAnYmFja2dyb3VuZDogZ3JlZW47IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogMHB4IDZweCA2cHggMHB4JyxcbiAgICAgICcnLFxuICAgICAgJ2JhY2tncm91bmQ6ICM2NjY7IHBhZGRpbmc6IDRweDsgYm9yZGVyLXJhZGl1czogNnB4IDBweCAwcHggNnB4JyxcbiAgICAgICdiYWNrZ3JvdW5kOiBibHVlOyBwYWRkaW5nOiA0cHg7IGJvcmRlci1yYWRpdXM6IDBweCA2cHggNnB4IDBweCdcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIFJob2Rvbml0ZSBzeXN0ZW0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIERvbid0IGZvcmdldCBgYXdhaXRgIHRvIHVzZSB0aGlzIG1ldGhvZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgXG4gICAqIGNvbnN0IGVuZ2luZSA9IGF3YWl0IFJuLkVuZ2luZS5pbml0KHtcbiAgICogICBhcHByb2FjaDogUm4uUHJvY2Vzc0FwcHJvYWNoLldlYkdMMixcbiAgICogICBjYW52YXM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3b3JsZCcpIGFzIEhUTUxDYW52YXNFbGVtZW50LFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBkZXNjXG4gICAqIEByZXR1cm5zXG4gICAqL1xuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSBjb21wb25lbnQgY2xhc3NlcyB0aGUgZW5naW5lIGl0c2VsZiBwcm9jZXNzZXMgZXZlcnkgZnJhbWUuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIE90aGVyIGNvbXBvbmVudCBjbGFzc2VzIGFyZSByZWdpc3RlcmVkIG9uIGZpcnN0IHVzZSBieSBgRW50aXR5UmVwb3NpdG9yeS5hZGRDb21wb25lbnRUb0VudGl0eWAuXG4gICAqIFRoZSBjb3JlIGNsYXNzZXMgYXJlIHJlZ2lzdGVyZWQgaGVyZSBiZWNhdXNlIHRoZSByZW5kZXIgbG9vcCBsb29rcyB1cCB0aGUgTWVzaFJlbmRlcmVyQ29tcG9uZW50IGNsYXNzXG4gICAqIGJ5IGl0cyBDb21wb25lbnRUSUQsIGJlY2F1c2UgU2tlbGV0YWxDb21wb25lbnQncyBib25lIGRhdGEgbWVtYmVycyBtdXN0IGJlIHJlZ2lzdGVyZWQgYmVmb3JlIGFueSBzaGFkZXIgaXNcbiAgICogZ2VuZXJhdGVkLCBhbmQgYmVjYXVzZSBlbnRpdHkgaGVscGVycyBzdWNoIGFzIGBjcmVhdGVHcm91cEVudGl0eWAgYW5kIGBjcmVhdGVNZXNoRW50aXR5YCBhZGRcbiAgICogdGhlbSBieSBDb21wb25lbnRUSUQ6IGltcG9ydGluZyB0aGUgY2xhc3NlcyB0aGVyZSB3b3VsZCBjcmVhdGUgY2lyY3VsYXIgaW1wb3J0cyBiZXR3ZWVuIHRoZVxuICAgKiBjb21wb25lbnRzLCB0aGUgZ2l6bW9zIGFuZCB0aGUgbWVzaCBoZWxwZXJzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19yZWdpc3RlckNvcmVDb21wb25lbnRDbGFzc2VzKCkge1xuICAgIENvbXBvbmVudFJlcG9zaXRvcnkuX2Vuc3VyZUNvbXBvbmVudENsYXNzUmVnaXN0ZXJlZChUcmFuc2Zvcm1Db21wb25lbnQpO1xuICAgIENvbXBvbmVudFJlcG9zaXRvcnkuX2Vuc3VyZUNvbXBvbmVudENsYXNzUmVnaXN0ZXJlZChTY2VuZUdyYXBoQ29tcG9uZW50KTtcbiAgICBDb21wb25lbnRSZXBvc2l0b3J5Ll9lbnN1cmVDb21wb25lbnRDbGFzc1JlZ2lzdGVyZWQoTWVzaENvbXBvbmVudCk7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKE1lc2hSZW5kZXJlckNvbXBvbmVudCk7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKENhbWVyYUNvbXBvbmVudCk7XG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKExpZ2h0Q29tcG9uZW50KTtcbiAgICAvLyBBbmltYXRpb25Db21wb25lbnQgYW5kIENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQgcmVnaXN0ZXIgdGhlbXNlbHZlcyBvbiBmaXJzdCB1c2UgYW5kIHByb3ZpZGUgdGhlaXIgb3duXG4gICAgLy8gcnVudGltZSBob29rcywgc28gdGhleSBzdGF5IG91dCBvZiB0aGUgY29yZSBwYXRoLlxuICAgIC8vIFNrZWxldGFsQ29tcG9uZW50IHJlZ2lzdGVycyBpdHMgYm9uZSBkYXRhIG1lbWJlcnMgd2hlbiBpdHMgbW9kdWxlIGlzIGV2YWx1YXRlZCwgYW5kIGV2ZXJ5IGdlbmVyYXRlZFxuICAgIC8vIHNoYWRlciBkZWNsYXJlcyB0aGUgYm9uZSBkYXRhIGdldHRlcnMgKGdldF9ib25lRGF0YSBldGMuKSwgc28gdGhlIGNsYXNzIG11c3QgYmUgcGFydCBvZiB0aGUgY29yZVxuICAgIC8vIGV2ZW4gaW4gYXBwbGljYXRpb25zIHdpdGhvdXQgc2tpbm5lZCBtZXNoZXMuXG4gICAgQ29tcG9uZW50UmVwb3NpdG9yeS5fZW5zdXJlQ29tcG9uZW50Q2xhc3NSZWdpc3RlcmVkKFNrZWxldGFsQ29tcG9uZW50KTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgaW5pdChkZXNjOiBFbmdpbmVJbml0RGVzY3JpcHRpb24pOiBQcm9taXNlPEVuZ2luZT4ge1xuICAgIGlmIChcbiAgICAgIGRlc2MuYXBwcm9hY2ggIT09IFByb2Nlc3NBcHByb2FjaC5Ob25lICYmXG4gICAgICBkZXNjLmFwcHJvYWNoICE9PSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyICYmXG4gICAgICBkZXNjLmFwcHJvYWNoICE9PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVXG4gICAgKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IChkZXNjLmFwcHJvYWNoIGFzIGFueSk/LnN0ciA/PyBTdHJpbmcoZGVzYy5hcHByb2FjaCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBVbnN1cHBvcnRlZCBwcm9jZXNzIGFwcHJvYWNoIFwiJHt2YWx1ZX1cIi4gVGhlIFwiVW5pZm9ybVwiIGFuZCBcIkRhdGFUZXh0dXJlXCIgbW9kZXMgd2VyZSByZW1vdmVkLiBVc2UgUHJvY2Vzc0FwcHJvYWNoLldlYkdMMiAoXCJXZWJHTDJcIikgb3IgUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSAoXCJXZWJHUFVcIikuYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdMMiAmJiB0eXBlb2YgX19STl9XRUJHTF9fICE9PSAndW5kZWZpbmVkJyAmJiAhX19STl9XRUJHTF9fKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2Nlc3NBcHByb2FjaC5XZWJHTDIgaXMgdW5hdmFpbGFibGU6IHRoaXMgYnVpbGQgd2FzIGJ1bmRsZWQgd2l0aCBfX1JOX1dFQkdMX18gPSBmYWxzZS4nKTtcbiAgICB9XG4gICAgaWYgKGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUgJiYgdHlwZW9mIF9fUk5fV0VCR1BVX18gIT09ICd1bmRlZmluZWQnICYmICFfX1JOX1dFQkdQVV9fKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2Nlc3NBcHByb2FjaC5XZWJHUFUgaXMgdW5hdmFpbGFibGU6IHRoaXMgYnVpbGQgd2FzIGJ1bmRsZWQgd2l0aCBfX1JOX1dFQkdQVV9fID0gZmFsc2UuJyk7XG4gICAgfVxuXG4gICAgRW5naW5lLl9fcmVnaXN0ZXJDb3JlQ29tcG9uZW50Q2xhc3NlcygpO1xuXG4gICAgLy8gVGhlIFBCUiBtb2R1bGUgKHRoZSBzaGVlbiBMVVQgaW1hZ2UpIGlzIGxvYWRlZCBvbiBkZW1hbmQgYnkgRHVtbXlUZXh0dXJlcy5yZXF1ZXN0U2hlZW5MdXRUZXh0dXJlKCkuXG4gICAgLy8gVGhlIFhSIHN1cHBvcnQgcHVsbHMgaW4gdGhlIGdsVEYgaW1wb3J0ZXIgKGNvbnRyb2xsZXIgbW9kZWxzKSwgc28gaXQgaXMgbG9hZGVkIG9ubHkgd2hlbiByZXF1ZXN0ZWQuXG4gICAgY29uc3Qgcm5YUk1vZHVsZSA9XG4gICAgICAoZGVzYy54ciA/PyBFbmdpbmUuX2xvYWRYUkJ5RGVmYXVsdCkgPyAoKGF3YWl0IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5sb2FkTW9kdWxlKCd4cicpKSBhcyBSblhSKSA6IHVuZGVmaW5lZDtcblxuICAgIGxldCBtYXhHUFVEYXRhU3RvcmFnZVNpemU6IEJ5dGUgPSAwO1xuICAgIGxldCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeTogSUNHQVBJUmVzb3VyY2VSZXBvc2l0b3J5IHwgdW5kZWZpbmVkO1xuICAgIGlmIChkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICAvLyBXZWJHUFVcbiAgICAgIGF3YWl0IE1vZHVsZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5sb2FkTW9kdWxlKCd3ZWJncHUnKTtcblxuICAgICAgY29uc3Qgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID1cbiAgICAgICAgQ0dBUElSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5KCkgYXMgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3Qgd2ViZ3B1TW9kdWxlID0gTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmdldE1vZHVsZSgnd2ViZ3B1Jyk7XG4gICAgICBjb25zdCBXZWJHcHVEZXZpY2VXcmFwcGVyQ2xhc3MgPSB3ZWJncHVNb2R1bGUuV2ViR3B1RGV2aWNlV3JhcHBlciBhcyB0eXBlb2YgV2ViR3B1RGV2aWNlV3JhcHBlcjtcbiAgICAgIGNvbnN0IGFkYXB0ZXIgPSBhd2FpdCBuYXZpZ2F0b3IuZ3B1LnJlcXVlc3RBZGFwdGVyKHsgeHJDb21wYXRpYmxlOiB0cnVlIH0pO1xuICAgICAgY29uc3QgeyBtYXhCdWZmZXJTaXplLCBtYXhTdG9yYWdlQnVmZmVyQmluZGluZ1NpemUgfSA9IGFkYXB0ZXIhLmxpbWl0cztcbiAgICAgIGNvbnN0IGZlYXR1cmVzOiBHUFVGZWF0dXJlTmFtZVtdID0gW107XG4gICAgICBmdW5jdGlvbiBhZGRGZWF0dXJlKGZlYXR1cmU6IEdQVUZlYXR1cmVOYW1lKSB7XG4gICAgICAgIGlmIChhZGFwdGVyIS5mZWF0dXJlcy5oYXMoZmVhdHVyZSkpIHtcbiAgICAgICAgICBmZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhZGRGZWF0dXJlKCdmbG9hdDMyLWZpbHRlcmFibGUnKTtcbiAgICAgIGFkZEZlYXR1cmUoJ3JnMTFiMTB1ZmxvYXQtcmVuZGVyYWJsZScpO1xuICAgICAgYWRkRmVhdHVyZSgndGV4dHVyZS1jb21wcmVzc2lvbi1iYycpO1xuICAgICAgYWRkRmVhdHVyZSgndGV4dHVyZS1jb21wcmVzc2lvbi1ldGMyJyk7XG4gICAgICBhZGRGZWF0dXJlKCd0ZXh0dXJlLWNvbXByZXNzaW9uLWFzdGMnKTtcbiAgICAgIC8vIFVzZWQgYnkgdGhlIEdQVSB0aW1lciAoRW5naW5lLmdwdVRpbWVyRW5hYmxlZCkuIEVuYWJsaW5nIHRoZSBmZWF0dXJlIGhhcyBubyBjb3N0IHVudGlsIGl0IGlzIHVzZWQuXG4gICAgICBhZGRGZWF0dXJlKCd0aW1lc3RhbXAtcXVlcnknKTtcblxuICAgICAgY29uc3QgZGV2aWNlID0gYXdhaXQgYWRhcHRlciEucmVxdWVzdERldmljZSh7XG4gICAgICAgIHJlcXVpcmVkRmVhdHVyZXM6IGZlYXR1cmVzLFxuICAgICAgICByZXF1aXJlZExpbWl0czoge1xuICAgICAgICAgIG1heFN0b3JhZ2VCdWZmZXJCaW5kaW5nU2l6ZSxcbiAgICAgICAgICBtYXhCdWZmZXJTaXplLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBtYXhHUFVEYXRhU3RvcmFnZVNpemUgPSBtYXhTdG9yYWdlQnVmZmVyQmluZGluZ1NpemU7XG4gICAgICBjb25zdCB3ZWJHcHVEZXZpY2VXcmFwcGVyID0gbmV3IFdlYkdwdURldmljZVdyYXBwZXJDbGFzcyhkZXNjLmNhbnZhcywgYWRhcHRlciEsIGRldmljZSk7XG4gICAgICB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuYWRkV2ViR3B1RGV2aWNlV3JhcHBlcih3ZWJHcHVEZXZpY2VXcmFwcGVyKTtcbiAgICAgIHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5yZWNyZWF0ZVN5c3RlbURlcHRoVGV4dHVyZSgpO1xuICAgICAgd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmNyZWF0ZUJpbmRHcm91cExheW91dEZvckRyYXdQYXJhbWV0ZXJzKCk7XG4gICAgICBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB9IGVsc2UgaWYgKGRlc2MuYXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHTDIpIHtcbiAgICAgIC8vIFdlYkdMXG4gICAgICBhd2FpdCBNb2R1bGVNYW5hZ2VyLmdldEluc3RhbmNlKCkubG9hZE1vZHVsZSgnd2ViZ2wnKTtcblxuICAgICAgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBDR0FQSVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHTFJlc291cmNlUmVwb3NpdG9yeSgpO1xuICAgICAgKGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5nZW5lcmF0ZVdlYkdMQ29udGV4dChcbiAgICAgICAgZGVzYy5jb25maWcgPz8gbmV3IENvbmZpZygpLFxuICAgICAgICBkZXNjLmNhbnZhcyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgZGVzYy53ZWJnbE9wdGlvblxuICAgICAgKTtcbiAgICAgIChjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeSkuc3dpdGNoRGVwdGhUZXN0KHRydWUpO1xuICAgICAgbWF4R1BVRGF0YVN0b3JhZ2VTaXplID1cbiAgICAgICAgKGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IGFzIFdlYkdMUmVzb3VyY2VSZXBvc2l0b3J5KS5jdXJyZW50V2ViR0xDb250ZXh0V3JhcHBlciEuZ2V0TWF4VGV4dHVyZVNpemUoKSAqKiAyICpcbiAgICAgICAgNCAvKiByZ2JhICovICpcbiAgICAgICAgNCAvKiBieXRlICovO1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXhHUFVEYXRhU3RvcmFnZVNpemUgPSAxMDI0ICoqIDIgKiA0IC8qIHJnYmEgKi8gKiA0IC8qIGJ5dGUgKi87XG4gICAgfVxuXG4gICAgY29uc3QgZW5naW5lID0gbmV3IEVuZ2luZShkZXNjLmFwcHJvYWNoLCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSEsIG1heEdQVURhdGFTdG9yYWdlU2l6ZSwgZGVzYy5jb25maWcsIHJuWFJNb2R1bGUpO1xuICAgIGVuZ2luZS5fX2VuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPSBkZXNjLmFwcHJvYWNoO1xuICAgIGVuZ2luZS5fX2NvbmZpZy5ldmVudFRhcmdldERvbSA9IGVuZ2luZS5fX2NvbmZpZy5ldmVudFRhcmdldERvbSA/PyBkZXNjLmNhbnZhcztcbiAgICBpZiAoZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgZW5naW5lLl9fd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5ID0gY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIH1cbiAgICBpZiAoZGVzYy5hcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdMMikge1xuICAgICAgZW5naW5lLl9fd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSBhcyBXZWJHTFJlc291cmNlUmVwb3NpdG9yeTtcbiAgICB9XG4gICAgZW5naW5lLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSE7XG5cbiAgICBpZiAoZGVzYy5ub3RUb0Rpc3BsYXlSbkluZm9BdEluaXQgIT09IHRydWUpIHtcbiAgICAgIGVuZ2luZS5fX2Rpc3BsYXlSbkluZm8oKTtcbiAgICB9XG5cbiAgICBjb25zdCBnbG9iYWxEYXRhUmVwb3NpdG9yeSA9IGVuZ2luZS5fX2dsb2JhbERhdGFSZXBvc2l0b3J5O1xuICAgIGdsb2JhbERhdGFSZXBvc2l0b3J5LmluaXRpYWxpemUoZGVzYy5hcHByb2FjaCk7XG5cbiAgICBpZiAoZGVzYy5jYW52YXMgIT0gbnVsbCAmJiBkZXNjLmFwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR0wyKSB7XG4gICAgICAvLyBEZWFsIHdpdGggV2ViR0wgY29udGV4dCBsb3N0IGFuZCByZXN0b3JlXG4gICAgICBkZXNjLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAnd2ViZ2xjb250ZXh0bG9zdCcsXG4gICAgICAgICgoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgLy8gQ2FsbGluZyBwcmV2ZW50RGVmYXVsdCBzaWduYWxzIHRvIHRoZSBwYWdlIHRoYXQgeW91IGludGVudCB0byBoYW5kbGUgY29udGV4dCByZXN0b3JhdGlvbi5cbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGVuZ2luZS5zdG9wUmVuZGVyTG9vcCgpO1xuICAgICAgICAgIGVuZ2luZS5sb2dnZXIuZXJyb3IoJ1dlYkdMIGNvbnRleHQgbG9zdCBvY2N1cnJlZC4nKTtcbiAgICAgICAgfSkuYmluZCh0aGlzKVxuICAgICAgKTtcblxuICAgICAgZGVzYy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2ViZ2xjb250ZXh0cmVzdG9yZWQnLCAoKSA9PiB7XG4gICAgICAgIC8vIE9uY2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgdGhlIGdsIGNvbnRleHQgd2lsbCBiZSByZXN0b3JlZCBidXQgYW55IGdyYXBoaWNzIHJlc291cmNlc1xuICAgICAgICAvLyB0aGF0IHdlcmUgcHJldmlvdXNseSBsb2FkZWQgd2lsbCBiZSBsb3N0LCBzbyB0aGUgc2NlbmUgc2hvdWxkIGJlIHJlbG9hZGVkLlxuICAgICAgICBlbmdpbmUubG9nZ2VyLmVycm9yKCdXZWJHTCBjb250ZXh0IHJlc3RvcmVkLicpO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgcmVzdG9yaW5nIHRoZSBwcmV2aW91cyBncmFwaGljcyByZXNvdXJjZXNcbiAgICAgICAgLy8gbG9hZFNjZW5lR3JhcGhpY3MoZ2wpO1xuICAgICAgICBlbmdpbmUucmVzdGFydFJlbmRlckxvb3AoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGVuZ2luZS5fX2R1bW15VGV4dHVyZXMgPSBhd2FpdCBEdW1teVRleHR1cmVzLmluaXQoZW5naW5lKTtcblxuICAgIGVuZ2luZS5fX2VuZ2luZVN0YXRlLnZpZXdwb3J0QXNwZWN0UmF0aW8gPSBkZXNjLmNhbnZhcyAhPSBudWxsID8gZGVzYy5jYW52YXMud2lkdGggLyBkZXNjLmNhbnZhcy5oZWlnaHQgOiAxO1xuXG4gICAgcmV0dXJuIGVuZ2luZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgcHJvY2Vzc0FwcHJvYWNoKCkge1xuICAgIHJldHVybiB0aGlzLl9fcHJvY2Vzc0FwcHJvYWNoO1xuICB9XG5cbiAgcHVibGljIHJlc2l6ZUNhbnZhcyh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgIGNvbnN0IHJlcG8gPSB0aGlzLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHJlcG8ucmVzaXplQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xuICAgIHRoaXMuX19lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvID0gd2lkdGggLyBoZWlnaHQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q2FudmFzU2l6ZSgpIHtcbiAgICBjb25zdCByZXBvID0gdGhpcy5jZ0FwaVJlc291cmNlUmVwb3NpdG9yeTtcbiAgICByZXR1cm4gcmVwby5nZXRDYW52YXNTaXplKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXIoKSB7XG4gICAgcmV0dXJuICh0aGlzLl9fY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgYXMgV2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkpLmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICB9XG5cbiAgcHVibGljIGdldCBlbnRpdHlSZXBvc2l0b3J5KCkge1xuICAgIHJldHVybiB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY29tcG9uZW50UmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbXBvbmVudFJlcG9zaXRvcnk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5KCkge1xuICAgIHJldHVybiB0aGlzLl9fY29tcG9uZW50TWVtb3J5UmVnaXN0cnk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIFdlYlhSIChWUikgc3lzdGVtLlxuICAgKiBAdGhyb3dzIElmIHRoZSBYUiBzdXBwb3J0IGlzIG5vdCBlbmFibGVkIChzZWUge0BsaW5rIGVuYWJsZVhSfSBhbmQgYEVuZ2luZUluaXREZXNjcmlwdGlvbi54cmApXG4gICAqL1xuICBwdWJsaWMgZ2V0IHdlYlhSU3lzdGVtKCk6IFdlYlhSU3lzdGVtIHtcbiAgICBpZiAodGhpcy5fX3dlYlhSU3lzdGVtID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFbmdpbmUuX194ck5vdEVuYWJsZWRNZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193ZWJYUlN5c3RlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgV2ViQVIgc3lzdGVtLlxuICAgKiBAdGhyb3dzIElmIHRoZSBYUiBzdXBwb3J0IGlzIG5vdCBlbmFibGVkIChzZWUge0BsaW5rIGVuYWJsZVhSfSBhbmQgYEVuZ2luZUluaXREZXNjcmlwdGlvbi54cmApXG4gICAqL1xuICBwdWJsaWMgZ2V0IHdlYkFSU3lzdGVtKCk6IFdlYkFSU3lzdGVtIHtcbiAgICBpZiAodGhpcy5fX3dlYkFSU3lzdGVtID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFbmdpbmUuX194ck5vdEVuYWJsZWRNZXNzYWdlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX193ZWJBUlN5c3RlbTtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBYUiBzdXBwb3J0IChXZWJYUiBhbmQgV2ViQVIgc3lzdGVtcykgaXMgZW5hYmxlZC4gKi9cbiAgcHVibGljIGdldCBpc1hSRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX3dlYlhSU3lzdGVtICE9IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogVGhlIFdlYlhSIHN5c3RlbSwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIFhSIHN1cHBvcnQgaXMgbm90IGVuYWJsZWQuXG4gICAqIEludGVybmFsIGNvZGUgdXNlcyBpdCBzbyB0aGF0IHJlbmRlcmluZyB3aXRob3V0IFhSIG5ldmVyIG5lZWRzIHRoZSBYUiBtb2R1bGUuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHVibGljIGdldCBfd2ViWFJTeXN0ZW1JZkVuYWJsZWQoKTogV2ViWFJTeXN0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fd2ViWFJTeXN0ZW07XG4gIH1cblxuICAvKipcbiAgICogVGhlIFdlYkFSIHN5c3RlbSwgb3IgdW5kZWZpbmVkIHdoZW4gdGhlIFhSIHN1cHBvcnQgaXMgbm90IGVuYWJsZWQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHVibGljIGdldCBfd2ViQVJTeXN0ZW1JZkVuYWJsZWQoKTogV2ViQVJTeXN0ZW0gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fd2ViQVJTeXN0ZW07XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyB0aGUgV2ViWFIvV2ViQVIgc3VwcG9ydCBhZnRlciBpbml0aWFsaXphdGlvbiBieSBsb2FkaW5nIHRoZSBYUiBtb2R1bGUuXG4gICAqIERvZXMgbm90aGluZyB3aGVuIGl0IGlzIGFscmVhZHkgZW5hYmxlZCAoZS5nLiBieSBgRW5naW5lLmluaXQoeyB4cjogdHJ1ZSB9KWApLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgV2ViWFIgc3lzdGVtXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3Qgd2ViWFJTeXN0ZW0gPSBhd2FpdCBlbmdpbmUuZW5hYmxlWFIoKTtcbiAgICogYXdhaXQgd2ViWFJTeXN0ZW0ucmVhZHlGb3JXZWJYUihidXR0b25FbGVtZW50LCBiYXNlUGF0aCk7XG4gICAqIGBgYFxuICAgKi9cbiAgcHVibGljIGFzeW5jIGVuYWJsZVhSKCk6IFByb21pc2U8V2ViWFJTeXN0ZW0+IHtcbiAgICBpZiAodGhpcy5fX3dlYlhSU3lzdGVtID09IG51bGwpIHtcbiAgICAgIGNvbnN0IHJuWFJNb2R1bGUgPSAoYXdhaXQgTW9kdWxlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmxvYWRNb2R1bGUoJ3hyJykpIGFzIFJuWFI7XG4gICAgICBpZiAodGhpcy5fX3dlYlhSU3lzdGVtID09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fX2luaXRYUlN5c3RlbXMocm5YUk1vZHVsZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fd2ViWFJTeXN0ZW0hO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2luaXRYUlN5c3RlbXMocm5YUk1vZHVsZTogUm5YUikge1xuICAgIHRoaXMuX193ZWJYUlN5c3RlbSA9IHJuWFJNb2R1bGUuV2ViWFJTeXN0ZW0uaW5pdCh0aGlzKTtcbiAgICB0aGlzLl9fd2ViQVJTeXN0ZW0gPSByblhSTW9kdWxlLldlYkFSU3lzdGVtLmluaXQodGhpcyk7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3hyTm90RW5hYmxlZE1lc3NhZ2UgPVxuICAgICdUaGUgWFIgc3VwcG9ydCBpcyBub3QgZW5hYmxlZC4gSW5pdGlhbGl6ZSB0aGUgZW5naW5lIHdpdGggRW5naW5lLmluaXQoeyB4cjogdHJ1ZSB9KSBvciBjYWxsICcgK1xuICAgICdhd2FpdCBlbmdpbmUuZW5hYmxlWFIoKSBmaXJzdC4gVGhlIGRlZmF1bHQgUm4gbmFtZXNwYWNlIGV4cG9ydCBlbmFibGVzIGl0IGF1dG9tYXRpY2FsbHkuJztcblxuICBwdWJsaWMgZ2V0IG1lbW9yeU1hbmFnZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tZW1vcnlNYW5hZ2VyITtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZ2xvYmFsRGF0YVJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19nbG9iYWxEYXRhUmVwb3NpdG9yeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydHMgbG9hZGluZyB0aGUgbGlnaHQgY2x1c3RlciBzeXN0ZW0uIENhbGxlZCB3aGVuIHRoZSBmaXJzdCBsaWdodCBpcyBhZGRlZDsgYXBwbGljYXRpb25zIHdpdGhvdXQgbGlnaHRzXG4gICAqIG5ldmVyIGRvd25sb2FkIGl0LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9yZXF1ZXN0TGlnaHRDbHVzdGVyU3lzdGVtKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9faXNEZXN0cm95ZWQgfHwgdGhpcy5fX2xpZ2h0Q2x1c3RlclN5c3RlbVByb21pc2UgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtUHJvbWlzZSA9IGltcG9ydCgnLi4vcmVuZGVyZXIvbGlnaHRDbHVzdGVyL0xpZ2h0Q2x1c3RlclN5c3RlbScpXG4gICAgICAudGhlbigoeyBMaWdodENsdXN0ZXJTeXN0ZW0gfSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19saWdodENsdXN0ZXJTeXN0ZW0gPSBuZXcgTGlnaHRDbHVzdGVyU3lzdGVtKHRoaXMpO1xuICAgICAgICB0aGlzLl9faXNMaWdodENsdXN0ZXJTeXN0ZW1Mb2FkZWQgPSB0cnVlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oYEZhaWxlZCB0byBsb2FkIHRoZSBsaWdodCBjbHVzdGVyIHN5c3RlbTogJHtlcnJvcn1gKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdhaXRzIGZvciB0aGUgcmVhbCBsaWdodCBjbHVzdGVyIHN5c3RlbS4gVGVzdHMgYW5kIGFwcGxpY2F0aW9ucyB0aGF0IG5lZWQgaXQgaW1tZWRpYXRlbHkgY2FsbCB0aGlzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIF9lbnN1cmVMaWdodENsdXN0ZXJTeXN0ZW0oKTogUHJvbWlzZTxJTGlnaHRDbHVzdGVyU3lzdGVtPiB7XG4gICAgdGhpcy5fcmVxdWVzdExpZ2h0Q2x1c3RlclN5c3RlbSgpO1xuICAgIGF3YWl0IHRoaXMuX19saWdodENsdXN0ZXJTeXN0ZW1Qcm9taXNlO1xuICAgIHJldHVybiB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzeXN0ZW0gdGhhdCBidWlsZHMgdGhlIGxpZ2h0IGxpc3RzIG9mIENsdXN0ZXJlZCBGb3J3YXJkIHJlbmRlcmluZy5cbiAgICovXG4gIHB1YmxpYyBnZXQgbGlnaHRDbHVzdGVyU3lzdGVtKCk6IElMaWdodENsdXN0ZXJTeXN0ZW0ge1xuICAgIHJldHVybiB0aGlzLl9fbGlnaHRDbHVzdGVyU3lzdGVtO1xuICB9XG5cbiAgcHVibGljIGdldCBtYXRlcmlhbFJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbFJlcG9zaXRvcnk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHdlYmdsUmVzb3VyY2VSZXBvc2l0b3J5KCkge1xuICAgIHJldHVybiB0aGlzLl9fd2ViZ2xSZXNvdXJjZVJlcG9zaXRvcnkhO1xuICB9XG5cbiAgcHVibGljIGdldCBjZ0FwaVJlc291cmNlUmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICB9XG5cbiAgcHVibGljIGdldCB3ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX193ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkhO1xuICB9XG5cbiAgcHVibGljIGdldCBkdW1teVRleHR1cmVzKCkge1xuICAgIHJldHVybiB0aGlzLl9fZHVtbXlUZXh0dXJlcyE7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVuZ2luZVN0YXRlKCkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lU3RhdGU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2NvbmZpZztcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbG9nZ2VyKCkge1xuICAgIHJldHVybiB0aGlzLl9fbG9nZ2VyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNoYWRlciBwcm9ncmFtIGNhY2hlIGZvciB0aGlzIGVuZ2luZSBpbnN0YW5jZS5cbiAgICogVGhpcyBjYWNoZSBtYXBzIHNoYWRlciB0ZXh0IHRvIGNvbXBpbGVkIHNoYWRlciBwcm9ncmFtIFVJRHMuXG4gICAqIEVhY2ggZW5naW5lIGhhcyBpdHMgb3duIGNhY2hlIHRvIHByZXZlbnQgY3Jvc3MtY29udGFtaW5hdGlvbiBiZXR3ZWVuIFdlYkdMIGNvbnRleHRzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBnZXQgc2hhZGVyUHJvZ3JhbUNhY2hlKCk6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLl9fc2hhZGVyUHJvZ3JhbUNhY2hlO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxlQUFlO0FBS3hCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsNkJBQTZCO0FBQ3RDLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMseUJBQXlCO0FBQ2xDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsOEJBQThCO0FBQ3ZDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsK0JBQStCO0FBQ3hDLFNBQVMsMkJBQTJCO0FBQ3BDLFNBQVMsaUNBQWlDO0FBQzFDLFNBQVMsY0FBYztBQUN2QixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLDRCQUE0QjtBQUNyQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLG9CQUFvQjtBQUM3QixT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VyxTQUFTO0FBQ2xCLFdBQU8sS0FBS0M7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFXLHFCQUEwQztBQUNuRCxXQUFPLEtBQUtKO0FBQUEsRUFDZDtBQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQXgzQ2EsUUFzQkosbUJBQW1CO0FBdEJmLFFBNENJYyxLQUFvQyxvQkFBSSxJQUFJO0FBNUNoRCxRQTZDSVQsS0FBZ0I7QUE3Q3BCLFFBNHhDYW1DLEtBQ3RCO0FBN3hDRyxJQUFNLFNBQU47IiwKICAibmFtZXMiOiBbIl9fcHJvY2Vzc0FwcHJvYWNoIiwgIl9fZW5naW5lU3RhdGUiLCAiX19yZW5kZXJQYXNzVGlja0NvdW50IiwgIl9fYW5pbWF0aW9uRnJhbWVJZCIsICJfX2FyZ3MiLCAiX19saWdodENsdXN0ZXJTeXN0ZW0iLCAiX19pc0xpZ2h0Q2x1c3RlclN5c3RlbUxvYWRlZCIsICJfX2lzRGVzdHJveWVkIiwgIl9fbGFzdENhbWVyYUNvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0UHJpbWl0aXZlQ291bnQiLCAiX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19zaGFkZXJQcm9ncmFtQ2FjaGUiLCAiX19ncHVUaW1lckVuYWJsZWQiLCAiX19lbmdpbmVVaWQiLCAiX19jb25maWciLCAiX19sb2dnZXIiLCAiX19lbmdpbmVDb3VudCIsICJfX2NnQXBpUmVzb3VyY2VSZXBvc2l0b3J5IiwgIl9fY29tcG9uZW50TWVtb3J5UmVnaXN0cnkiLCAiX19jb21wb25lbnRSZXBvc2l0b3J5IiwgIl9fZW50aXR5UmVwb3NpdG9yeSIsICJfX21hdGVyaWFsUmVwb3NpdG9yeSIsICJfX21lbW9yeU1hbmFnZXIiLCAiX19pbml0WFJTeXN0ZW1zIiwgIl9fZ2xvYmFsRGF0YVJlcG9zaXRvcnkiLCAiX19lbmdpbmVzIiwgIl9fcmVuZGVyTG9vcEZ1bmMiLCAiX19kZXN0cm95UmVzb3VyY2VzIiwgIl9fZHVtbXlUZXh0dXJlcyIsICJfX3dlYkdwdVJlc291cmNlUmVwb3NpdG9yeSIsICJfX2NsZWFudXBDb21wb25lbnRSdW50aW1lSG9va3MiLCAiX193ZWJnbEdwdVRpbWVyIiwgIl9fZXhwcmVzc2lvbkZvclByb2Nlc3NBdXRvIiwgIl9fcmVuZGVyUGFzc0ZvclByb2Nlc3NBdXRvIiwgIl9fZ2V0QW5pbWF0aW9uRnJhbWVPYmplY3QiLCAiX19hbmltYXRpb25GcmFtZU9iamVjdCIsICJfX3dlYlhSU3lzdGVtIiwgIl9fd2ViQVJTeXN0ZW0iLCAiX19iZWdpbkdwdVRpbWVyIiwgIl9fcHJvY2Vzc0NvbXBvbmVudFJ1bnRpbWVIb29rc0JlZ2luRnJhbWUiLCAiX19lbmRHcHVUaW1lciIsICJfX2dldFdlYkdMR3B1VGltZXIiLCAiX193ZWJnbFJlc291cmNlUmVwb3NpdG9yeSIsICJfX3Byb2Nlc3NSZW5kZXJQYXNzV2ViR1BVIiwgIl9fcmVuZGVyTWVzaGVzV2ViR1BVIiwgIl9fcmVuZGVyRGVmZXJyZWRFZmZla3NlZXJFZmZlY3RzQWZ0ZXJSZXNvbHZlV2ViR1BVIiwgIl9faXNDb21wb25lbnRSdW50aW1lSG9va0RpcnR5IiwgIl9fcHJvY2Vzc0NvbXBvbmVudFJ1bnRpbWVIb29rc01hcmtVcGRhdGVkIiwgIl9fZGlzcGxheVJuSW5mbyIsICJfX3JlZ2lzdGVyQ29yZUNvbXBvbmVudENsYXNzZXMiLCAiYWRkRmVhdHVyZSIsICJfX3hyTm90RW5hYmxlZE1lc3NhZ2UiLCAiX19saWdodENsdXN0ZXJTeXN0ZW1Qcm9taXNlIl0KfQo=
