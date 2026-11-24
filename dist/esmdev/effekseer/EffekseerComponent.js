// src/effekseer/EffekseerComponent.ts
import { CameraComponent } from "../foundation/components/Camera/CameraComponent.js";
import { WellKnownComponentTIDs } from "../foundation/components/WellKnownComponentTIDs.js";
import { Component } from "../foundation/core/Component.js";
import { applyMixins } from "../foundation/core/EntityRepository.js";
import { ProcessApproach } from "../foundation/definitions/ProcessApproach.js";
import { ProcessStage } from "../foundation/definitions/ProcessStage.js";
import { MutableMatrix44 } from "../foundation/math/MutableMatrix44.js";
import { Is } from "../foundation/misc/Is.js";
import { Logger } from "../foundation/misc/Logger.js";
var _EffekseerComponent = class _EffekseerComponent extends Component {
  constructor() {
    super(...arguments);
    this.type = "efk";
    this.playJustAfterLoaded = false;
    this.isLoop = false;
    this.isPause = false;
    this.randomSeed = -1;
    this.isImageLoadWithCredential = false;
    this.isSoundEnabled = false;
    this.autoResumeSoundByUserGesture = true;
    this.__speed = 1;
    this.__isInitialized = false;
    this.__isDestroyed = false;
    this.__reportedMissingModule = false;
    this.__webGpuSurfaceWidth = -1;
    this.__webGpuSurfaceHeight = -1;
  }
  static get componentTID() {
    return WellKnownComponentTIDs.EffekseerComponentTID;
  }
  static __getEffekseerModule() {
    const global = globalThis;
    return global.effekseer;
  }
  static __getWebGpuDeviceId(device) {
    if (device == null) {
      return -1;
    }
    let id = _EffekseerComponent.__webGpuDeviceIds.get(device);
    if (id == null) {
      id = ++_EffekseerComponent.__webGpuDeviceIdCount;
      _EffekseerComponent.__webGpuDeviceIds.set(device, id);
    }
    return id;
  }
  static __getRuntimeUris(backend) {
    var _a, _b, _c, _d;
    if (backend === "webgpu") {
      return {
        wasmPath: (_a = _EffekseerComponent.wasmModuleUriWebGPU) != null ? _a : _EffekseerComponent.wasmModuleUri,
        scriptPath: (_b = _EffekseerComponent.nativeScriptUriWebGPU) != null ? _b : _EffekseerComponent.nativeScriptUri
      };
    }
    return {
      wasmPath: (_c = _EffekseerComponent.wasmModuleUriWebGL) != null ? _c : _EffekseerComponent.wasmModuleUri,
      scriptPath: (_d = _EffekseerComponent.nativeScriptUriWebGL) != null ? _d : _EffekseerComponent.nativeScriptUri
    };
  }
  static async __initializeRuntime(effekseerModule, backend, device) {
    const { wasmPath, scriptPath } = _EffekseerComponent.__getRuntimeUris(backend);
    const runtimeInitializationKey = `${backend}
${wasmPath != null ? wasmPath : ""}
${scriptPath != null ? scriptPath : ""}
${_EffekseerComponent.__getWebGpuDeviceId(device)}`;
    if (_EffekseerComponent.__runtimeInitializationPromise == null || _EffekseerComponent.__runtimeInitializationKey !== runtimeInitializationKey) {
      _EffekseerComponent.__runtimeInitializationKey = runtimeInitializationKey;
      _EffekseerComponent.__runtimeInitializationPromise = effekseerModule.initRuntime(
        backend === "webgpu" ? {
          backend,
          device,
          wasmPath,
          scriptPath
        } : {
          backend,
          wasmPath,
          scriptPath
        }
      ).catch((error) => {
        _EffekseerComponent.__runtimeInitializationPromise = void 0;
        throw error;
      });
    }
    await _EffekseerComponent.__runtimeInitializationPromise;
  }
  static __formatError(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  cancelLoop() {
    clearInterval(this.__timer);
  }
  isPlay() {
    if (Is.exist(this.__handle)) {
      if (this.__handle.exists) {
        return !this.isPause;
      }
      return false;
    }
    return false;
  }
  play() {
    var _a;
    if (Is.not.exist(this.__context)) {
      Logger.default.warn("No Effekseer context yet");
      return false;
    }
    if (Is.not.exist(this.__effect)) {
      Logger.default.warn("No Effekseer effect yet");
      return false;
    }
    this.stop();
    this.isPause = false;
    this.__handle = (_a = this.__context.play(this.__effect, 0, 0, 0)) != null ? _a : void 0;
    if (Is.exist(this.__handle) && this.randomSeed > 0) {
      this.__handle.setRandomSeed(this.randomSeed);
    }
    return Is.exist(this.__handle);
  }
  continue() {
    this.isPause = false;
  }
  pause() {
    if (Is.exist(this.__handle)) {
      this.isPause = true;
      clearInterval(this.__timer);
    }
  }
  stop() {
    if (Is.exist(this.__handle)) {
      this.__handle.stop();
      this.isPause = true;
      clearInterval(this.__timer);
    }
  }
  set playSpeed(val) {
    if (this.__handle) {
      this.__handle.setSpeed(val);
    }
    this.__speed = val;
  }
  get playSpeed() {
    return this.__speed;
  }
  setSoundVolume(volume) {
    var _a, _b;
    (_b = (_a = this.__context) == null ? void 0 : _a.setSoundVolume) == null ? void 0 : _b.call(_a, volume);
  }
  async resumeSound() {
    var _a;
    this.isSoundEnabled = true;
    this.__unregisterAutoResumeSoundByUserGesture();
    if (Is.not.exist((_a = this.__context) == null ? void 0 : _a.resumeSound)) {
      return false;
    }
    await this.__context.resumeSound();
    return true;
  }
  pauseSound() {
    var _a, _b;
    this.isSoundEnabled = false;
    this.__unregisterAutoResumeSoundByUserGesture();
    (_b = (_a = this.__context) == null ? void 0 : _a.pauseSound) == null ? void 0 : _b.call(_a);
  }
  __registerAutoResumeSoundByUserGesture() {
    var _a;
    if (!this.autoResumeSoundByUserGesture || this.isSoundEnabled || Is.not.exist((_a = this.__context) == null ? void 0 : _a.resumeSound) || Is.exist(this.__autoResumeSoundEventHandler)) {
      return;
    }
    let eventTarget;
    if (this.__getBackend() === "webgpu") {
      eventTarget = this.__engine.webGpuResourceRepository.getWebGpuDeviceWrapper().canvas;
    } else {
      const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
      eventTarget = glw == null ? void 0 : glw.canvas;
    }
    eventTarget != null ? eventTarget : eventTarget = typeof window !== "undefined" ? window : void 0;
    if (Is.not.exist(eventTarget)) {
      return;
    }
    this.__autoResumeSoundEventTarget = eventTarget;
    this.__autoResumeSoundEventHandler = () => {
      void this.__resumeSoundByUserGesture();
    };
    eventTarget.addEventListener("pointerdown", this.__autoResumeSoundEventHandler, { once: true });
    eventTarget.addEventListener("keydown", this.__autoResumeSoundEventHandler, { once: true });
    eventTarget.addEventListener("touchstart", this.__autoResumeSoundEventHandler, { once: true, passive: true });
  }
  __unregisterAutoResumeSoundByUserGesture() {
    if (Is.not.exist(this.__autoResumeSoundEventTarget) || Is.not.exist(this.__autoResumeSoundEventHandler)) {
      return;
    }
    this.__autoResumeSoundEventTarget.removeEventListener("pointerdown", this.__autoResumeSoundEventHandler);
    this.__autoResumeSoundEventTarget.removeEventListener("keydown", this.__autoResumeSoundEventHandler);
    this.__autoResumeSoundEventTarget.removeEventListener("touchstart", this.__autoResumeSoundEventHandler);
    this.__autoResumeSoundEventTarget = void 0;
    this.__autoResumeSoundEventHandler = void 0;
  }
  async __resumeSoundByUserGesture() {
    this.__unregisterAutoResumeSoundByUserGesture();
    if (this.__isDestroyed) {
      return;
    }
    const shouldReplay = this.playJustAfterLoaded && !this.isLoop;
    const resumed = await this.resumeSound();
    if (!resumed || this.__isDestroyed) {
      return;
    }
    if (shouldReplay) {
      this.stop();
      this.play();
    }
  }
  setTime(targetSec) {
    if (!this.play()) {
      return false;
    }
    if (Is.not.exist(this.__context)) {
      return false;
    }
    let time = 0;
    const oneTime = 0.0166;
    time = oneTime;
    while (time <= targetSec) {
      this.__context.update(time / oneTime);
      time += oneTime;
      if (targetSec < time) {
        const exceededSec = targetSec - time;
        const remainSec = oneTime - exceededSec;
        this.__context.update(remainSec / oneTime);
        break;
      }
    }
    this.pause();
    return true;
  }
  set translate(vec) {
    if (this.__handle) {
      this.__handle.setLocation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform().localPosition = vec;
  }
  get translate() {
    return this.entity.tryToGetTransform().localPosition;
  }
  set rotate(vec) {
    if (this.__handle) {
      this.__handle.setRotation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform().localEulerAngles = vec;
  }
  get rotate() {
    return this.entity.tryToGetTransform().localEulerAngles;
  }
  set scale(vec) {
    if (this.__handle) {
      this.__handle.setScale(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform().localScale = vec;
  }
  get scale() {
    return this.entity.tryToGetTransform().localScale;
  }
  __getBackend() {
    return ProcessApproach.isWebGpuApproach(this.__engine.processApproach) ? "webgpu" : "webgl";
  }
  __getWebGpuDevice() {
    if (this.__getBackend() !== "webgpu") {
      return void 0;
    }
    return this.__engine.webGpuResourceRepository.getWebGpuDeviceWrapper().gpuDevice;
  }
  prepareWebGPURendering(options) {
    var _a;
    if (this.__getBackend() !== "webgpu" || Is.not.exist((_a = this.__context) == null ? void 0 : _a.configureSurface)) {
      return;
    }
    const webGpuDeviceWrapper = this.__engine.webGpuResourceRepository.getWebGpuDeviceWrapper();
    const width = webGpuDeviceWrapper.canvas.width;
    const height = webGpuDeviceWrapper.canvas.height;
    if (this.__webGpuSurfaceWidth === width && this.__webGpuSurfaceHeight === height && this.__webGpuSurfaceColorFormat === (options == null ? void 0 : options.colorFormat) && this.__webGpuSurfaceDepthFormat === (options == null ? void 0 : options.depthFormat)) {
      return;
    }
    this.__context.configureSurface({
      width,
      height,
      colorFormat: options == null ? void 0 : options.colorFormat,
      depthFormat: options == null ? void 0 : options.depthFormat,
      enablePremultipliedAlpha: true
    });
    this.__webGpuSurfaceWidth = width;
    this.__webGpuSurfaceHeight = height;
    this.__webGpuSurfaceColorFormat = options == null ? void 0 : options.colorFormat;
    this.__webGpuSurfaceDepthFormat = options == null ? void 0 : options.depthFormat;
  }
  async __createEffekseerContext(effekseerModule) {
    var _a, _b, _c, _d, _e;
    if (Is.not.exist(this.uri) && Is.not.exist(this.arrayBuffer)) {
      return false;
    }
    const backend = this.__getBackend();
    effekseerModule.setImageCrossOrigin(this.isImageLoadWithCredential ? "use-credentials" : "");
    if (backend === "webgpu") {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      const webGpuDeviceWrapper = webGpuResourceRepository.getWebGpuDeviceWrapper();
      const { colorFormat, depthFormat } = webGpuResourceRepository.getEffekseerRenderPassOptions(this.__engine);
      const canvasContext = webGpuDeviceWrapper.context;
      const canvasSize = {
        width: webGpuDeviceWrapper.canvas.width,
        height: webGpuDeviceWrapper.canvas.height
      };
      const externalCanvasContext = {
        canvas: canvasSize,
        configure: (_configuration) => {
        },
        unconfigure: (_a = canvasContext.unconfigure) == null ? void 0 : _a.bind(canvasContext),
        getCurrentTexture: () => {
          return canvasContext.getCurrentTexture();
        }
      };
      this.__context = await effekseerModule.createContext({
        backend,
        canvasContext: externalCanvasContext,
        device: webGpuDeviceWrapper.gpuDevice,
        colorFormat,
        depthFormat,
        width: webGpuDeviceWrapper.canvas.width,
        height: webGpuDeviceWrapper.canvas.height,
        enablePremultipliedAlpha: true
      });
    } else {
      const webGLResourceRepository = this.__engine.webglResourceRepository;
      const glw = webGLResourceRepository.currentWebGLContextWrapper;
      if (Is.not.exist(glw)) {
        Logger.default.error("WebGL context is not ready for Effekseer");
        return false;
      }
      const gl = glw.getRawContext();
      this.__context = await effekseerModule.createContext({
        backend,
        graphicsContext: gl,
        enablePremultipliedAlpha: true
      });
    }
    (_c = (_b = this.__context).setRestorationOfStatesFlag) == null ? void 0 : _c.call(_b, true);
    if (!this.isSoundEnabled) {
      (_e = (_d = this.__context).pauseSound) == null ? void 0 : _e.call(_d);
      this.__registerAutoResumeSoundByUserGesture();
    }
    const data = Is.exist(this.uri) ? this.uri : this.arrayBuffer;
    try {
      if (this.type === "efkpkg") {
        if (Is.not.exist(_EffekseerComponent.Unzip)) {
          Logger.default.error("Please Set an Unzip object to EffekseerComponent.Unzip");
          this.__releaseEffekseerResources(effekseerModule);
          return false;
        }
        this.__effect = await this.__context.loadEffectPackage(data, _EffekseerComponent.Unzip, 1);
      } else {
        this.__effect = await this.__context.loadEffect(data, 1);
      }
    } catch (error) {
      Logger.default.error(`Failed to load Effekseer effect: ${_EffekseerComponent.__formatError(error)}`);
      this.__releaseEffekseerResources(effekseerModule);
      return false;
    }
    if (this.__isDestroyed) {
      this.__releaseEffekseerResources(effekseerModule);
      return false;
    }
    this.__isInitialized = true;
    if (this.playJustAfterLoaded) {
      this.play();
    }
    return true;
  }
  $load() {
    if (this.__isInitialized || this.__loadPromise != null || this.__isDestroyed) {
      return;
    }
    if (Is.not.exist(this.__context) && Is.not.exist(this.__effect)) {
      const effekseerModule = _EffekseerComponent.__getEffekseerModule();
      if (Is.not.exist(effekseerModule)) {
        if (!this.__reportedMissingModule) {
          Logger.default.error(
            "Effekseer module is not found. Import effekseer.js in HTML and assign it to globalThis.effekseer."
          );
          this.__reportedMissingModule = true;
        }
        return;
      }
      this.__loadPromise = (async () => {
        await _EffekseerComponent.__initializeRuntime(effekseerModule, this.__getBackend(), this.__getWebGpuDevice());
        return this.__createEffekseerContext(effekseerModule);
      })();
      this.__loadPromise.then((succeed) => {
        if (succeed) {
          this.moveStageTo(ProcessStage.Logic);
        }
      }).catch((error) => {
        Logger.default.error(`Failed to initialize Effekseer: ${_EffekseerComponent.__formatError(error)}`);
      }).finally(() => {
        this.__loadPromise = void 0;
      });
    }
  }
  $logic() {
    if (!this.isPause) {
      if (Is.exist(this.__context) && Is.false(this.isPause)) {
        this.__context.update();
      }
    }
    if (this.__handle != null) {
      const worldMatrix = _EffekseerComponent.__tmp_identityMatrix_0.copyComponents(
        this.entity.tryToGetSceneGraph().matrixInner
      );
      this.__handle.setMatrix(worldMatrix._v);
      this.__handle.setSpeed(this.__speed);
    }
    if (this.isPause) {
      this.moveStageTo(ProcessStage.Render);
      return;
    }
    if (this.isLoop) {
      if (!this.isPlay()) {
        this.play();
      }
    }
    this.moveStageTo(ProcessStage.Render);
  }
  _destroy() {
    super._destroy();
    this.__isDestroyed = true;
    const effekseerModule = _EffekseerComponent.__getEffekseerModule();
    this.__releaseEffekseerResources(effekseerModule);
  }
  __releaseEffekseerResources(effekseerModule) {
    var _a, _b;
    this.__unregisterAutoResumeSoundByUserGesture();
    if (Is.exist(this.__handle)) {
      this.__handle.stop();
      this.__handle = void 0;
    }
    if (Is.exist(this.__context)) {
      if (Is.exist(this.__effect)) {
        this.__context.releaseEffect(this.__effect);
      }
      if (Is.exist(effekseerModule)) {
        effekseerModule.releaseContext(this.__context);
      } else {
        (_b = (_a = this.__context).release) == null ? void 0 : _b.call(_a);
      }
      this.__context = void 0;
    }
    this.__effect = void 0;
    this.__isInitialized = false;
    this.__webGpuSurfaceWidth = -1;
    this.__webGpuSurfaceHeight = -1;
    this.__webGpuSurfaceColorFormat = void 0;
    this.__webGpuSurfaceDepthFormat = void 0;
  }
  __drawEffekseerEffectNormal() {
    const cameraComponent = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    );
    const viewMatrix = _EffekseerComponent.__tmp_identityMatrix_0;
    const projectionMatrix = _EffekseerComponent.__tmp_identityMatrix_1;
    if (cameraComponent) {
      viewMatrix.copyComponents(cameraComponent.viewMatrix);
      projectionMatrix.copyComponents(cameraComponent.projectionMatrix);
    } else {
      viewMatrix.identity();
      projectionMatrix.identity();
    }
    if (Is.exist(this.__context)) {
      this.__context.setProjectionMatrix(projectionMatrix._v);
      this.__context.setCameraMatrix(viewMatrix._v);
      this.__context.draw();
    }
  }
  __drawEffekseerEffectWebGPU(renderPassEncoder, options, displayIdx = 0) {
    var _a, _b, _c;
    const cameraComponent = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    );
    const viewMatrix = _EffekseerComponent.__tmp_identityMatrix_0;
    const projectionMatrix = _EffekseerComponent.__tmp_identityMatrix_1;
    if ((_a = this.__engine._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) {
      const webXRProjectionMatrix = this.__engine._webXRSystemIfEnabled._getProjectMatrixAt(displayIdx);
      const webXRViewMatrix = this.__engine._webXRSystemIfEnabled._getViewMatrixAt(displayIdx);
      if (Is.exist(webXRProjectionMatrix) && Is.exist(webXRViewMatrix)) {
        viewMatrix.copyComponents(webXRViewMatrix);
        projectionMatrix.copyComponents(webXRProjectionMatrix);
      } else {
        viewMatrix.identity();
        projectionMatrix.identity();
      }
    } else if (cameraComponent) {
      viewMatrix.copyComponents(cameraComponent.viewMatrix);
      projectionMatrix.copyComponents(cameraComponent.projectionMatrix);
    } else {
      viewMatrix.identity();
      projectionMatrix.identity();
    }
    if (Is.exist(this.__context) && Is.exist(this.__context.drawToRenderPass)) {
      this.__context.setProjectionMatrix(projectionMatrix._v);
      this.__context.setCameraMatrix(viewMatrix._v);
      this.__context.drawToRenderPass(renderPassEncoder, options);
      const webGpuError = (_c = (_b = this.__context).getLastWebGPUError) == null ? void 0 : _c.call(_b);
      if (webGpuError) {
        Logger.default.error(webGpuError);
      }
    }
  }
  __drawEffekseerEffectWebXR() {
    const webXRSystem = this.__engine._webXRSystemIfEnabled;
    if (webXRSystem == null) {
      return;
    }
    for (let i = 0; i < 2; i++) {
      const projectionMatrix = webXRSystem._getProjectMatrixAt(i);
      const viewMatrix = webXRSystem._getViewMatrixAt(i);
      if (Is.exist(projectionMatrix) && Is.exist(viewMatrix) && Is.exist(this.__context)) {
        const webGLResourceRepository = this.__engine.webglResourceRepository;
        webGLResourceRepository.setViewport(this.__engine, webXRSystem._getViewportAt(i));
        this.__context.setProjectionMatrix(projectionMatrix._v);
        this.__context.setCameraMatrix(viewMatrix._v);
        this.__context.draw();
      }
    }
  }
  $render() {
    var _a;
    if (Is.not.exist(this.__effect)) {
      this.moveStageTo(ProcessStage.Load);
      return;
    }
    if ((_a = this.__engine._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) {
      this.__drawEffekseerEffectWebXR();
    } else {
      this.__drawEffekseerEffectNormal();
    }
    this.moveStageTo(ProcessStage.Logic);
  }
  $renderWebGPU(renderPassEncoder, options, displayIdx = 0) {
    if (Is.not.exist(this.__effect)) {
      this.moveStageTo(ProcessStage.Load);
      return;
    }
    this.__drawEffekseerEffectWebGPU(renderPassEncoder, options, displayIdx);
    this.moveStageTo(ProcessStage.Logic);
  }
  static sort_$render(engine, renderPass) {
    if (Is.false(renderPass.toRenderEffekseerEffects)) {
      return [];
    }
    const components = engine.componentRepository.getComponentsWithType(_EffekseerComponent);
    return components.map((c) => c.componentSID);
  }
  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity(base, _componentClass) {
    class EffekseerEntity extends base.constructor {
      getEffekseer() {
        return this.getComponentByComponentTID(_EffekseerComponent.componentTID);
      }
    }
    applyMixins(base, EffekseerEntity);
    return base;
  }
};
_EffekseerComponent.ANIMATION_EVENT_PLAY = 0;
_EffekseerComponent.ANIMATION_EVENT_PAUSE = 1;
_EffekseerComponent.ANIMATION_EVENT_END = 2;
_EffekseerComponent.__webGpuDeviceIds = /* @__PURE__ */ new WeakMap();
_EffekseerComponent.__webGpuDeviceIdCount = 0;
_EffekseerComponent.__tmp_identityMatrix_0 = MutableMatrix44.identity();
_EffekseerComponent.__tmp_identityMatrix_1 = MutableMatrix44.identity();
var EffekseerComponent = _EffekseerComponent;
export {
  EffekseerComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL2VmZmVrc2Vlci9FZmZla3NlZXJDb21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0NvbXBvbmVudFR5cGVzJztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL0lWZWN0b3InO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFNJRCwgU2Vjb25kIH0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuXG50eXBlIEVmZmVrc2VlckVmZmVjdCA9IHtcbiAgaXNMb2FkZWQ6IGJvb2xlYW47XG59O1xuXG50eXBlIEVmZmVrc2VlckhhbmRsZSA9IHtcbiAgcmVhZG9ubHkgZXhpc3RzOiBib29sZWFuO1xuICBzdG9wKCk6IHZvaWQ7XG4gIHNldExvY2F0aW9uKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiB2b2lkO1xuICBzZXRSb3RhdGlvbih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogdm9pZDtcbiAgc2V0U2NhbGUoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IHZvaWQ7XG4gIHNldE1hdHJpeChtYXRyaXhBcnJheTogQXJyYXlMaWtlPG51bWJlcj4pOiB2b2lkO1xuICBzZXRTcGVlZChzcGVlZDogbnVtYmVyKTogdm9pZDtcbiAgc2V0UmFuZG9tU2VlZChzZWVkOiBudW1iZXIpOiB2b2lkO1xufTtcblxudHlwZSBFZmZla3NlZXJDb250ZXh0ID0ge1xuICB1cGRhdGUoZGVsdGFGcmFtZXM/OiBudW1iZXIpOiB2b2lkO1xuICBzZXRQcm9qZWN0aW9uTWF0cml4KG1hdHJpeEFycmF5OiBBcnJheUxpa2U8bnVtYmVyPik6IHZvaWQ7XG4gIHNldENhbWVyYU1hdHJpeChtYXRyaXhBcnJheTogQXJyYXlMaWtlPG51bWJlcj4pOiB2b2lkO1xuICBkcmF3KCk6IHZvaWQ7XG4gIGNvbmZpZ3VyZVN1cmZhY2U/OiAob3B0aW9ucz86IHtcbiAgICB3aWR0aD86IG51bWJlcjtcbiAgICBoZWlnaHQ/OiBudW1iZXI7XG4gICAgY29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0O1xuICAgIGRlcHRoRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDtcbiAgICBhbHBoYU1vZGU/OiBHUFVDYW52YXNBbHBoYU1vZGU7XG4gICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhPzogYm9vbGVhbjtcbiAgfSkgPT4gdm9pZDtcbiAgZHJhd1RvUmVuZGVyUGFzcz86IChcbiAgICByZW5kZXJQYXNzRW5jb2RlcjogR1BVUmVuZGVyUGFzc0VuY29kZXIsXG4gICAgb3B0aW9ucz86IHsgY29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0OyBkZXB0aEZvcm1hdD86IEdQVVRleHR1cmVGb3JtYXQgfVxuICApID0+IHZvaWQ7XG4gIGxvYWRFZmZlY3QoZGF0YTogc3RyaW5nIHwgQXJyYXlCdWZmZXIsIHNjYWxlPzogbnVtYmVyKTogUHJvbWlzZTxFZmZla3NlZXJFZmZlY3Q+O1xuICBsb2FkRWZmZWN0UGFja2FnZShkYXRhOiBzdHJpbmcgfCBBcnJheUJ1ZmZlciwgVW56aXA6IHVua25vd24sIHNjYWxlPzogbnVtYmVyKTogUHJvbWlzZTxFZmZla3NlZXJFZmZlY3Q+O1xuICByZWxlYXNlRWZmZWN0KGVmZmVjdDogRWZmZWtzZWVyRWZmZWN0KTogdm9pZDtcbiAgcmVsZWFzZT86ICgpID0+IHZvaWQ7XG4gIHBsYXkoZWZmZWN0OiBFZmZla3NlZXJFZmZlY3QsIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHo/OiBudW1iZXIpOiBFZmZla3NlZXJIYW5kbGUgfCBudWxsO1xuICBzZXRTb3VuZFZvbHVtZT86ICh2b2x1bWU6IG51bWJlcikgPT4gdm9pZDtcbiAgcmVzdW1lU291bmQ/OiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBwYXVzZVNvdW5kPzogKCkgPT4gdm9pZDtcbiAgc2V0UmVzdG9yYXRpb25PZlN0YXRlc0ZsYWc/OiAoZmxhZzogYm9vbGVhbikgPT4gdm9pZDtcbiAgZ2V0TGFzdFdlYkdQVUVycm9yPzogKCkgPT4gc3RyaW5nIHwgdW5kZWZpbmVkO1xufTtcblxudHlwZSBFZmZla3NlZXJNb2R1bGUgPSB7XG4gIGluaXRSdW50aW1lKFxuICAgIG9wdGlvbnM6XG4gICAgICB8IHsgYmFja2VuZDogJ3dlYmdsJzsgd2FzbVBhdGg/OiBzdHJpbmc7IHNjcmlwdFBhdGg/OiBzdHJpbmcgfVxuICAgICAgfCB7IGJhY2tlbmQ6ICd3ZWJncHUnOyBkZXZpY2U/OiBHUFVEZXZpY2U7IHdhc21QYXRoPzogc3RyaW5nOyBzY3JpcHRQYXRoPzogc3RyaW5nIH1cbiAgKTogUHJvbWlzZTx2b2lkPjtcbiAgY3JlYXRlQ29udGV4dChcbiAgICBvcHRpb25zOlxuICAgICAgfCB7XG4gICAgICAgICAgYmFja2VuZDogJ3dlYmdsJztcbiAgICAgICAgICBncmFwaGljc0NvbnRleHQ6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQ7XG4gICAgICAgICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhPzogYm9vbGVhbjtcbiAgICAgICAgfVxuICAgICAgfCB7XG4gICAgICAgICAgYmFja2VuZDogJ3dlYmdwdSc7XG4gICAgICAgICAgY2FudmFzPzogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXM7XG4gICAgICAgICAgY2FudmFzQ29udGV4dD86IEdQVUNhbnZhc0NvbnRleHQ7XG4gICAgICAgICAgZGV2aWNlPzogR1BVRGV2aWNlO1xuICAgICAgICAgIGNvbG9yRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDtcbiAgICAgICAgICBkZXB0aEZvcm1hdD86IEdQVVRleHR1cmVGb3JtYXQ7XG4gICAgICAgICAgd2lkdGg/OiBudW1iZXI7XG4gICAgICAgICAgaGVpZ2h0PzogbnVtYmVyO1xuICAgICAgICAgIGVuYWJsZVByZW11bHRpcGxpZWRBbHBoYT86IGJvb2xlYW47XG4gICAgICAgIH1cbiAgKTogUHJvbWlzZTxFZmZla3NlZXJDb250ZXh0PjtcbiAgcmVsZWFzZUNvbnRleHQoY29udGV4dDogRWZmZWtzZWVyQ29udGV4dCk6IHZvaWQ7XG4gIHNldEltYWdlQ3Jvc3NPcmlnaW4oY3Jvc3NPcmlnaW46IHN0cmluZyk6IHZvaWQ7XG59O1xuXG50eXBlIEVmZmVrc2VlckJhY2tlbmQgPSAnd2ViZ2wnIHwgJ3dlYmdwdSc7XG50eXBlIFdlYkdQVUV4dGVybmFsUmVuZGVyUGFzc09wdGlvbnMgPSB7IGNvbG9yRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDsgZGVwdGhGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0IH07XG5cbmV4cG9ydCBjbGFzcyBFZmZla3NlZXJDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEFOSU1BVElPTl9FVkVOVF9QTEFZID0gMDtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBTklNQVRJT05fRVZFTlRfUEFVU0UgPSAxO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEFOSU1BVElPTl9FVkVOVF9FTkQgPSAyO1xuICBwdWJsaWMgc3RhdGljIFVuemlwPzogYW55O1xuICBwdWJsaWMgc3RhdGljIHdhc21Nb2R1bGVVcmk/OiBzdHJpbmc7XG4gIHB1YmxpYyBzdGF0aWMgbmF0aXZlU2NyaXB0VXJpPzogc3RyaW5nO1xuICBwdWJsaWMgc3RhdGljIHdhc21Nb2R1bGVVcmlXZWJHTD86IHN0cmluZztcbiAgcHVibGljIHN0YXRpYyBuYXRpdmVTY3JpcHRVcmlXZWJHTD86IHN0cmluZztcbiAgcHVibGljIHN0YXRpYyB3YXNtTW9kdWxlVXJpV2ViR1BVPzogc3RyaW5nO1xuICBwdWJsaWMgc3RhdGljIG5hdGl2ZVNjcmlwdFVyaVdlYkdQVT86IHN0cmluZztcbiAgcHVibGljIHVyaT86IHN0cmluZztcbiAgcHVibGljIGFycmF5QnVmZmVyPzogQXJyYXlCdWZmZXI7XG4gIHB1YmxpYyB0eXBlID0gJ2Vmayc7XG4gIHB1YmxpYyBwbGF5SnVzdEFmdGVyTG9hZGVkID0gZmFsc2U7XG4gIHB1YmxpYyBpc0xvb3AgPSBmYWxzZTtcbiAgcHVibGljIGlzUGF1c2UgPSBmYWxzZTtcbiAgcHVibGljIHJhbmRvbVNlZWQgPSAtMTtcbiAgcHVibGljIGlzSW1hZ2VMb2FkV2l0aENyZWRlbnRpYWwgPSBmYWxzZTtcbiAgcHVibGljIGlzU291bmRFbmFibGVkID0gZmFsc2U7XG4gIHB1YmxpYyBhdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlID0gdHJ1ZTtcblxuICBwcml2YXRlIF9fZWZmZWN0PzogRWZmZWtzZWVyRWZmZWN0O1xuICBwcml2YXRlIF9fY29udGV4dD86IEVmZmVrc2VlckNvbnRleHQ7XG4gIHByaXZhdGUgX19oYW5kbGU/OiBFZmZla3NlZXJIYW5kbGU7XG4gIHByaXZhdGUgX19zcGVlZCA9IDE7XG4gIHByaXZhdGUgX190aW1lcj86IGFueTtcbiAgcHJpdmF0ZSBfX2lzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzRGVzdHJveWVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19sb2FkUHJvbWlzZT86IFByb21pc2U8Ym9vbGVhbj47XG4gIHByaXZhdGUgX19yZXBvcnRlZE1pc3NpbmdNb2R1bGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2F1dG9SZXN1bWVTb3VuZEV2ZW50VGFyZ2V0PzogRXZlbnRUYXJnZXQ7XG4gIHByaXZhdGUgX19hdXRvUmVzdW1lU291bmRFdmVudEhhbmRsZXI/OiBFdmVudExpc3RlbmVyO1xuICBwcml2YXRlIF9fd2ViR3B1U3VyZmFjZVdpZHRoID0gLTE7XG4gIHByaXZhdGUgX193ZWJHcHVTdXJmYWNlSGVpZ2h0ID0gLTE7XG4gIHByaXZhdGUgX193ZWJHcHVTdXJmYWNlQ29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0O1xuICBwcml2YXRlIF9fd2ViR3B1U3VyZmFjZURlcHRoRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlPzogUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBzdGF0aWMgX19ydW50aW1lSW5pdGlhbGl6YXRpb25LZXk/OiBzdHJpbmc7XG4gIHByaXZhdGUgc3RhdGljIF9fd2ViR3B1RGV2aWNlSWRzOiBXZWFrTWFwPEdQVURldmljZSwgbnVtYmVyPiA9IG5ldyBXZWFrTWFwKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fd2ViR3B1RGV2aWNlSWRDb3VudCA9IDA7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX2lkZW50aXR5TWF0cml4XzA6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9pZGVudGl0eU1hdHJpeF8xOiBNdXRhYmxlTWF0cml4NDQgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcblxuICBzdGF0aWMgZ2V0IGNvbXBvbmVudFRJRCgpIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5FZmZla3NlZXJDb21wb25lbnRUSUQ7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldEVmZmVrc2Vlck1vZHVsZSgpOiBFZmZla3NlZXJNb2R1bGUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGdsb2JhbCA9IGdsb2JhbFRoaXMgYXMgdHlwZW9mIGdsb2JhbFRoaXMgJiB7IGVmZmVrc2Vlcj86IEVmZmVrc2Vlck1vZHVsZSB9O1xuICAgIHJldHVybiBnbG9iYWwuZWZmZWtzZWVyO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRXZWJHcHVEZXZpY2VJZChkZXZpY2U/OiBHUFVEZXZpY2UpOiBudW1iZXIge1xuICAgIGlmIChkZXZpY2UgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgaWQgPSBFZmZla3NlZXJDb21wb25lbnQuX193ZWJHcHVEZXZpY2VJZHMuZ2V0KGRldmljZSk7XG4gICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgIGlkID0gKytFZmZla3NlZXJDb21wb25lbnQuX193ZWJHcHVEZXZpY2VJZENvdW50O1xuICAgICAgRWZmZWtzZWVyQ29tcG9uZW50Ll9fd2ViR3B1RGV2aWNlSWRzLnNldChkZXZpY2UsIGlkKTtcbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSdW50aW1lVXJpcyhiYWNrZW5kOiBFZmZla3NlZXJCYWNrZW5kKTogeyB3YXNtUGF0aD86IHN0cmluZzsgc2NyaXB0UGF0aD86IHN0cmluZyB9IHtcbiAgICBpZiAoYmFja2VuZCA9PT0gJ3dlYmdwdScpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdhc21QYXRoOiBFZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaVdlYkdQVSA/PyBFZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaSxcbiAgICAgICAgc2NyaXB0UGF0aDogRWZmZWtzZWVyQ29tcG9uZW50Lm5hdGl2ZVNjcmlwdFVyaVdlYkdQVSA/PyBFZmZla3NlZXJDb21wb25lbnQubmF0aXZlU2NyaXB0VXJpLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHdhc21QYXRoOiBFZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaVdlYkdMID8/IEVmZmVrc2VlckNvbXBvbmVudC53YXNtTW9kdWxlVXJpLFxuICAgICAgc2NyaXB0UGF0aDogRWZmZWtzZWVyQ29tcG9uZW50Lm5hdGl2ZVNjcmlwdFVyaVdlYkdMID8/IEVmZmVrc2VlckNvbXBvbmVudC5uYXRpdmVTY3JpcHRVcmksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9faW5pdGlhbGl6ZVJ1bnRpbWUoXG4gICAgZWZmZWtzZWVyTW9kdWxlOiBFZmZla3NlZXJNb2R1bGUsXG4gICAgYmFja2VuZDogRWZmZWtzZWVyQmFja2VuZCxcbiAgICBkZXZpY2U/OiBHUFVEZXZpY2VcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyB3YXNtUGF0aCwgc2NyaXB0UGF0aCB9ID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fZ2V0UnVudGltZVVyaXMoYmFja2VuZCk7XG4gICAgY29uc3QgcnVudGltZUluaXRpYWxpemF0aW9uS2V5ID0gYCR7YmFja2VuZH1cXG4ke3dhc21QYXRoID8/ICcnfVxcbiR7c2NyaXB0UGF0aCA/PyAnJ31cXG4ke0VmZmVrc2VlckNvbXBvbmVudC5fX2dldFdlYkdwdURldmljZUlkKGRldmljZSl9YDtcbiAgICBpZiAoXG4gICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlID09IG51bGwgfHxcbiAgICAgIEVmZmVrc2VlckNvbXBvbmVudC5fX3J1bnRpbWVJbml0aWFsaXphdGlvbktleSAhPT0gcnVudGltZUluaXRpYWxpemF0aW9uS2V5XG4gICAgKSB7XG4gICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25LZXkgPSBydW50aW1lSW5pdGlhbGl6YXRpb25LZXk7XG4gICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlID0gZWZmZWtzZWVyTW9kdWxlXG4gICAgICAgIC5pbml0UnVudGltZShcbiAgICAgICAgICBiYWNrZW5kID09PSAnd2ViZ3B1J1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgYmFja2VuZCxcbiAgICAgICAgICAgICAgICBkZXZpY2UsXG4gICAgICAgICAgICAgICAgd2FzbVBhdGgsXG4gICAgICAgICAgICAgICAgc2NyaXB0UGF0aCxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgYmFja2VuZCxcbiAgICAgICAgICAgICAgICB3YXNtUGF0aCxcbiAgICAgICAgICAgICAgICBzY3JpcHRQYXRoLFxuICAgICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXdhaXQgRWZmZWtzZWVyQ29tcG9uZW50Ll9fcnVudGltZUluaXRpYWxpemF0aW9uUHJvbWlzZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZm9ybWF0RXJyb3IoZXJyb3I6IHVua25vd24pOiBzdHJpbmcge1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICByZXR1cm4gZXJyb3IubWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIFN0cmluZyhlcnJvcik7XG4gIH1cblxuICBjYW5jZWxMb29wKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fX3RpbWVyIGFzIG51bWJlcik7XG4gIH1cblxuICBpc1BsYXkoKTogYm9vbGVhbiB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19oYW5kbGUpKSB7XG4gICAgICBpZiAodGhpcy5fX2hhbmRsZS5leGlzdHMpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzUGF1c2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBsYXkoKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ05vIEVmZmVrc2VlciBjb250ZXh0IHlldCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19lZmZlY3QpKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdObyBFZmZla3NlZXIgZWZmZWN0IHlldCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcCgpO1xuICAgIHRoaXMuaXNQYXVzZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fX2hhbmRsZSA9IHRoaXMuX19jb250ZXh0LnBsYXkodGhpcy5fX2VmZmVjdCwgMCwgMCwgMCkgPz8gdW5kZWZpbmVkO1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9faGFuZGxlKSAmJiB0aGlzLnJhbmRvbVNlZWQgPiAwKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFJhbmRvbVNlZWQodGhpcy5yYW5kb21TZWVkKTtcbiAgICB9XG5cbiAgICAvLyBpZiAodGhpcy5pc0xvb3ApIHtcbiAgICAvLyAgIHRoaXMuX190aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIC8vICAgICB0aGlzLnBsYXkoKTtcbiAgICAvLyAgIH0sIDUwMCk7XG4gICAgLy8gfVxuICAgIHJldHVybiBJcy5leGlzdCh0aGlzLl9faGFuZGxlKTtcbiAgfVxuXG4gIGNvbnRpbnVlKCkge1xuICAgIHRoaXMuaXNQYXVzZSA9IGZhbHNlO1xuICB9XG5cbiAgcGF1c2UoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19oYW5kbGUpKSB7XG4gICAgICB0aGlzLmlzUGF1c2UgPSB0cnVlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9fdGltZXIhKTtcbiAgICB9XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9faGFuZGxlKSkge1xuICAgICAgdGhpcy5fX2hhbmRsZS5zdG9wKCk7XG4gICAgICB0aGlzLmlzUGF1c2UgPSB0cnVlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9fdGltZXIhKTtcbiAgICB9XG4gIH1cblxuICBzZXQgcGxheVNwZWVkKHZhbCkge1xuICAgIGlmICh0aGlzLl9faGFuZGxlKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFNwZWVkKHZhbCk7XG4gICAgfVxuICAgIHRoaXMuX19zcGVlZCA9IHZhbDtcbiAgfVxuXG4gIGdldCBwbGF5U3BlZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zcGVlZDtcbiAgfVxuXG4gIHNldFNvdW5kVm9sdW1lKHZvbHVtZTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fX2NvbnRleHQ/LnNldFNvdW5kVm9sdW1lPy4odm9sdW1lKTtcbiAgfVxuXG4gIGFzeW5jIHJlc3VtZVNvdW5kKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRoaXMuaXNTb3VuZEVuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuX191bnJlZ2lzdGVyQXV0b1Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSgpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX2NvbnRleHQ/LnJlc3VtZVNvdW5kKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLl9fY29udGV4dC5yZXN1bWVTb3VuZCgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcGF1c2VTb3VuZCgpOiB2b2lkIHtcbiAgICB0aGlzLmlzU291bmRFbmFibGVkID0gZmFsc2U7XG4gICAgdGhpcy5fX3VucmVnaXN0ZXJBdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlKCk7XG4gICAgdGhpcy5fX2NvbnRleHQ/LnBhdXNlU291bmQ/LigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3JlZ2lzdGVyQXV0b1Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSgpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5hdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlIHx8XG4gICAgICB0aGlzLmlzU291bmRFbmFibGVkIHx8XG4gICAgICBJcy5ub3QuZXhpc3QodGhpcy5fX2NvbnRleHQ/LnJlc3VtZVNvdW5kKSB8fFxuICAgICAgSXMuZXhpc3QodGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlcilcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLl9fZ2V0QmFja2VuZCgpID09PSAnd2ViZ3B1Jykge1xuICAgICAgZXZlbnRUYXJnZXQgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCkuY2FudmFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgICAgZXZlbnRUYXJnZXQgPSBnbHc/LmNhbnZhcztcbiAgICB9XG4gICAgZXZlbnRUYXJnZXQgPz89IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoZXZlbnRUYXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXQ7XG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciA9ICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5fX3Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSgpO1xuICAgIH07XG5cbiAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudEhhbmRsZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRIYW5kbGVyLCB7IG9uY2U6IHRydWUsIHBhc3NpdmU6IHRydWUgfSk7XG4gIH1cblxuICBwcml2YXRlIF9fdW5yZWdpc3RlckF1dG9SZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTogdm9pZCB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRUYXJnZXQpIHx8IElzLm5vdC5leGlzdCh0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRIYW5kbGVyKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudEhhbmRsZXIpO1xuICAgIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlcik7XG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRIYW5kbGVyKTtcbiAgICB0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRUYXJnZXQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX19yZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5fX3VucmVnaXN0ZXJBdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlKCk7XG4gICAgaWYgKHRoaXMuX19pc0Rlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNob3VsZFJlcGxheSA9IHRoaXMucGxheUp1c3RBZnRlckxvYWRlZCAmJiAhdGhpcy5pc0xvb3A7XG4gICAgY29uc3QgcmVzdW1lZCA9IGF3YWl0IHRoaXMucmVzdW1lU291bmQoKTtcbiAgICBpZiAoIXJlc3VtZWQgfHwgdGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChzaG91bGRSZXBsYXkpIHtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfVxuICB9XG5cbiAgc2V0VGltZSh0YXJnZXRTZWM6IFNlY29uZCkge1xuICAgIGlmICghdGhpcy5wbGF5KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdGltZSA9IDA7XG4gICAgY29uc3Qgb25lVGltZSA9IDAuMDE2NjtcbiAgICB0aW1lID0gb25lVGltZTtcbiAgICB3aGlsZSAodGltZSA8PSB0YXJnZXRTZWMpIHtcbiAgICAgIHRoaXMuX19jb250ZXh0LnVwZGF0ZSh0aW1lIC8gb25lVGltZSk7XG4gICAgICB0aW1lICs9IG9uZVRpbWU7XG4gICAgICBpZiAodGFyZ2V0U2VjIDwgdGltZSkge1xuICAgICAgICBjb25zdCBleGNlZWRlZFNlYyA9IHRhcmdldFNlYyAtIHRpbWU7XG4gICAgICAgIGNvbnN0IHJlbWFpblNlYyA9IG9uZVRpbWUgLSBleGNlZWRlZFNlYztcbiAgICAgICAgdGhpcy5fX2NvbnRleHQudXBkYXRlKHJlbWFpblNlYyAvIG9uZVRpbWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBhdXNlKCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHNldCB0cmFuc2xhdGUodmVjOiBJVmVjdG9yMykge1xuICAgIGlmICh0aGlzLl9faGFuZGxlKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldExvY2F0aW9uKHZlYy54LCB2ZWMueSwgdmVjLnopO1xuICAgIH1cbiAgICB0aGlzLmVudGl0eS50cnlUb0dldFRyYW5zZm9ybSgpIS5sb2NhbFBvc2l0aW9uID0gdmVjO1xuICB9XG5cbiAgZ2V0IHRyYW5zbGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRpdHkudHJ5VG9HZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbjtcbiAgfVxuXG4gIHNldCByb3RhdGUodmVjOiBJVmVjdG9yMykge1xuICAgIGlmICh0aGlzLl9faGFuZGxlKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFJvdGF0aW9uKHZlYy54LCB2ZWMueSwgdmVjLnopO1xuICAgIH1cbiAgICB0aGlzLmVudGl0eS50cnlUb0dldFRyYW5zZm9ybSgpIS5sb2NhbEV1bGVyQW5nbGVzID0gdmVjO1xuICB9XG5cbiAgZ2V0IHJvdGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRpdHkudHJ5VG9HZXRUcmFuc2Zvcm0oKSEubG9jYWxFdWxlckFuZ2xlcztcbiAgfVxuXG4gIHNldCBzY2FsZSh2ZWM6IElWZWN0b3IzKSB7XG4gICAgaWYgKHRoaXMuX19oYW5kbGUpIHtcbiAgICAgIHRoaXMuX19oYW5kbGUuc2V0U2NhbGUodmVjLngsIHZlYy55LCB2ZWMueik7XG4gICAgfVxuICAgIHRoaXMuZW50aXR5LnRyeVRvR2V0VHJhbnNmb3JtKCkhLmxvY2FsU2NhbGUgPSB2ZWM7XG4gIH1cblxuICBnZXQgc2NhbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5LnRyeVRvR2V0VHJhbnNmb3JtKCkhLmxvY2FsU2NhbGU7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0QmFja2VuZCgpOiBFZmZla3NlZXJCYWNrZW5kIHtcbiAgICByZXR1cm4gUHJvY2Vzc0FwcHJvYWNoLmlzV2ViR3B1QXBwcm9hY2godGhpcy5fX2VuZ2luZS5wcm9jZXNzQXBwcm9hY2gpID8gJ3dlYmdwdScgOiAnd2ViZ2wnO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFdlYkdwdURldmljZSgpOiBHUFVEZXZpY2UgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9fZ2V0QmFja2VuZCgpICE9PSAnd2ViZ3B1Jykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKS5ncHVEZXZpY2U7XG4gIH1cblxuICBwcmVwYXJlV2ViR1BVUmVuZGVyaW5nKG9wdGlvbnM/OiBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19nZXRCYWNrZW5kKCkgIT09ICd3ZWJncHUnIHx8IElzLm5vdC5leGlzdCh0aGlzLl9fY29udGV4dD8uY29uZmlndXJlU3VyZmFjZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWJHcHVEZXZpY2VXcmFwcGVyID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR3B1RGV2aWNlV3JhcHBlcigpO1xuICAgIGNvbnN0IHdpZHRoID0gd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMuaGVpZ2h0O1xuICAgIGlmIChcbiAgICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlV2lkdGggPT09IHdpZHRoICYmXG4gICAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUhlaWdodCA9PT0gaGVpZ2h0ICYmXG4gICAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUNvbG9yRm9ybWF0ID09PSBvcHRpb25zPy5jb2xvckZvcm1hdCAmJlxuICAgICAgdGhpcy5fX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCA9PT0gb3B0aW9ucz8uZGVwdGhGb3JtYXRcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fY29udGV4dC5jb25maWd1cmVTdXJmYWNlKHtcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgY29sb3JGb3JtYXQ6IG9wdGlvbnM/LmNvbG9yRm9ybWF0LFxuICAgICAgZGVwdGhGb3JtYXQ6IG9wdGlvbnM/LmRlcHRoRm9ybWF0LFxuICAgICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlV2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUNvbG9yRm9ybWF0ID0gb3B0aW9ucz8uY29sb3JGb3JtYXQ7XG4gICAgdGhpcy5fX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCA9IG9wdGlvbnM/LmRlcHRoRm9ybWF0O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfX2NyZWF0ZUVmZmVrc2VlckNvbnRleHQoZWZmZWtzZWVyTW9kdWxlOiBFZmZla3NlZXJNb2R1bGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMudXJpKSAmJiBJcy5ub3QuZXhpc3QodGhpcy5hcnJheUJ1ZmZlcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgYmFja2VuZCA9IHRoaXMuX19nZXRCYWNrZW5kKCk7XG4gICAgZWZmZWtzZWVyTW9kdWxlLnNldEltYWdlQ3Jvc3NPcmlnaW4odGhpcy5pc0ltYWdlTG9hZFdpdGhDcmVkZW50aWFsID8gJ3VzZS1jcmVkZW50aWFscycgOiAnJyk7XG5cbiAgICBpZiAoYmFja2VuZCA9PT0gJ3dlYmdwdScpIHtcbiAgICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3Qgd2ViR3B1RGV2aWNlV3JhcHBlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk7XG4gICAgICBjb25zdCB7IGNvbG9yRm9ybWF0LCBkZXB0aEZvcm1hdCB9ID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldEVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zKHRoaXMuX19lbmdpbmUpO1xuICAgICAgY29uc3QgY2FudmFzQ29udGV4dCA9IHdlYkdwdURldmljZVdyYXBwZXIuY29udGV4dDtcbiAgICAgIGNvbnN0IGNhbnZhc1NpemUgPSB7XG4gICAgICAgIHdpZHRoOiB3ZWJHcHVEZXZpY2VXcmFwcGVyLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiB3ZWJHcHVEZXZpY2VXcmFwcGVyLmNhbnZhcy5oZWlnaHQsXG4gICAgICB9O1xuICAgICAgY29uc3QgZXh0ZXJuYWxDYW52YXNDb250ZXh0ID0ge1xuICAgICAgICBjYW52YXM6IGNhbnZhc1NpemUsXG4gICAgICAgIGNvbmZpZ3VyZTogKF9jb25maWd1cmF0aW9uOiBHUFVDYW52YXNDb25maWd1cmF0aW9uKSA9PiB7XG4gICAgICAgICAgLy8gUmhvZG9uaXRlIG93bnMgdGhlIHN3YXBjaGFpbiBjb25maWd1cmF0aW9uLlxuICAgICAgICB9LFxuICAgICAgICB1bmNvbmZpZ3VyZTogY2FudmFzQ29udGV4dC51bmNvbmZpZ3VyZT8uYmluZChjYW52YXNDb250ZXh0KSxcbiAgICAgICAgZ2V0Q3VycmVudFRleHR1cmU6ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gY2FudmFzQ29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xuICAgICAgICB9LFxuICAgICAgfSBhcyBHUFVDYW52YXNDb250ZXh0O1xuICAgICAgdGhpcy5fX2NvbnRleHQgPSBhd2FpdCBlZmZla3NlZXJNb2R1bGUuY3JlYXRlQ29udGV4dCh7XG4gICAgICAgIGJhY2tlbmQsXG4gICAgICAgIGNhbnZhc0NvbnRleHQ6IGV4dGVybmFsQ2FudmFzQ29udGV4dCxcbiAgICAgICAgZGV2aWNlOiB3ZWJHcHVEZXZpY2VXcmFwcGVyLmdwdURldmljZSxcbiAgICAgICAgY29sb3JGb3JtYXQsXG4gICAgICAgIGRlcHRoRm9ybWF0LFxuICAgICAgICB3aWR0aDogd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMuaGVpZ2h0LFxuICAgICAgICBlbmFibGVQcmVtdWx0aXBsaWVkQWxwaGE6IHRydWUsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3QgZ2x3ID0gd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGdsdykpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ1dlYkdMIGNvbnRleHQgaXMgbm90IHJlYWR5IGZvciBFZmZla3NlZXInKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgICB0aGlzLl9fY29udGV4dCA9IGF3YWl0IGVmZmVrc2Vlck1vZHVsZS5jcmVhdGVDb250ZXh0KHtcbiAgICAgICAgYmFja2VuZCxcbiAgICAgICAgZ3JhcGhpY3NDb250ZXh0OiBnbCxcbiAgICAgICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX19jb250ZXh0LnNldFJlc3RvcmF0aW9uT2ZTdGF0ZXNGbGFnPy4odHJ1ZSk7XG4gICAgaWYgKCF0aGlzLmlzU291bmRFbmFibGVkKSB7XG4gICAgICB0aGlzLl9fY29udGV4dC5wYXVzZVNvdW5kPy4oKTtcbiAgICAgIHRoaXMuX19yZWdpc3RlckF1dG9SZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gSXMuZXhpc3QodGhpcy51cmkpID8gdGhpcy51cmkgOiB0aGlzLmFycmF5QnVmZmVyO1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy50eXBlID09PSAnZWZrcGtnJykge1xuICAgICAgICBpZiAoSXMubm90LmV4aXN0KEVmZmVrc2VlckNvbXBvbmVudC5VbnppcCkpIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignUGxlYXNlIFNldCBhbiBVbnppcCBvYmplY3QgdG8gRWZmZWtzZWVyQ29tcG9uZW50LlVuemlwJyk7XG4gICAgICAgICAgdGhpcy5fX3JlbGVhc2VFZmZla3NlZXJSZXNvdXJjZXMoZWZmZWtzZWVyTW9kdWxlKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2VmZmVjdCA9IGF3YWl0IHRoaXMuX19jb250ZXh0LmxvYWRFZmZlY3RQYWNrYWdlKGRhdGEgYXMgYW55LCBFZmZla3NlZXJDb21wb25lbnQuVW56aXAsIDEuMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9fZWZmZWN0ID0gYXdhaXQgdGhpcy5fX2NvbnRleHQubG9hZEVmZmVjdChkYXRhIGFzIGFueSwgMS4wKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEZhaWxlZCB0byBsb2FkIEVmZmVrc2VlciBlZmZlY3Q6ICR7RWZmZWtzZWVyQ29tcG9uZW50Ll9fZm9ybWF0RXJyb3IoZXJyb3IpfWApO1xuICAgICAgdGhpcy5fX3JlbGVhc2VFZmZla3NlZXJSZXNvdXJjZXMoZWZmZWtzZWVyTW9kdWxlKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICB0aGlzLl9fcmVsZWFzZUVmZmVrc2VlclJlc291cmNlcyhlZmZla3NlZXJNb2R1bGUpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuX19pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5wbGF5SnVzdEFmdGVyTG9hZGVkKSB7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAkbG9hZCgpIHtcbiAgICBpZiAodGhpcy5fX2lzSW5pdGlhbGl6ZWQgfHwgdGhpcy5fX2xvYWRQcm9taXNlICE9IG51bGwgfHwgdGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX2NvbnRleHQpICYmIElzLm5vdC5leGlzdCh0aGlzLl9fZWZmZWN0KSkge1xuICAgICAgY29uc3QgZWZmZWtzZWVyTW9kdWxlID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fZ2V0RWZmZWtzZWVyTW9kdWxlKCk7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGVmZmVrc2Vlck1vZHVsZSkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9fcmVwb3J0ZWRNaXNzaW5nTW9kdWxlKSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAgICAgICAnRWZmZWtzZWVyIG1vZHVsZSBpcyBub3QgZm91bmQuIEltcG9ydCBlZmZla3NlZXIuanMgaW4gSFRNTCBhbmQgYXNzaWduIGl0IHRvIGdsb2JhbFRoaXMuZWZmZWtzZWVyLidcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX19yZXBvcnRlZE1pc3NpbmdNb2R1bGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2xvYWRQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgRWZmZWtzZWVyQ29tcG9uZW50Ll9faW5pdGlhbGl6ZVJ1bnRpbWUoZWZmZWtzZWVyTW9kdWxlLCB0aGlzLl9fZ2V0QmFja2VuZCgpLCB0aGlzLl9fZ2V0V2ViR3B1RGV2aWNlKCkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fX2NyZWF0ZUVmZmVrc2VlckNvbnRleHQoZWZmZWtzZWVyTW9kdWxlKTtcbiAgICAgIH0pKCk7XG4gICAgICB0aGlzLl9fbG9hZFByb21pc2VcbiAgICAgICAgLnRoZW4oc3VjY2VlZCA9PiB7XG4gICAgICAgICAgaWYgKHN1Y2NlZWQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEZhaWxlZCB0byBpbml0aWFsaXplIEVmZmVrc2VlcjogJHtFZmZla3NlZXJDb21wb25lbnQuX19mb3JtYXRFcnJvcihlcnJvcil9YCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9fbG9hZFByb21pc2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRsb2dpYygpIHtcbiAgICBpZiAoIXRoaXMuaXNQYXVzZSkge1xuICAgICAgLy8gUGxheWluZyAuLi5cbiAgICAgIGlmIChJcy5leGlzdCh0aGlzLl9fY29udGV4dCkgJiYgSXMuZmFsc2UodGhpcy5pc1BhdXNlKSkge1xuICAgICAgICB0aGlzLl9fY29udGV4dC51cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2hhbmRsZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IEVmZmVrc2VlckNvbXBvbmVudC5fX3RtcF9pZGVudGl0eU1hdHJpeF8wLmNvcHlDb21wb25lbnRzKFxuICAgICAgICB0aGlzLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKSEubWF0cml4SW5uZXJcbiAgICAgICk7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldE1hdHJpeCh3b3JsZE1hdHJpeC5fdik7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFNwZWVkKHRoaXMuX19zcGVlZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNQYXVzZSkge1xuICAgICAgLy8gSWYgUGF1c2UgbW9kZS4uLlxuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuUmVuZGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0xvb3ApIHtcbiAgICAgIGlmICghdGhpcy5pc1BsYXkoKSkge1xuICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5SZW5kZXIpO1xuICB9XG5cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIGNvbnN0IGVmZmVrc2Vlck1vZHVsZSA9IEVmZmVrc2VlckNvbXBvbmVudC5fX2dldEVmZmVrc2Vlck1vZHVsZSgpO1xuICAgIHRoaXMuX19yZWxlYXNlRWZmZWtzZWVyUmVzb3VyY2VzKGVmZmVrc2Vlck1vZHVsZSk7XG4gIH1cblxuICBwcml2YXRlIF9fcmVsZWFzZUVmZmVrc2VlclJlc291cmNlcyhlZmZla3NlZXJNb2R1bGU/OiBFZmZla3NlZXJNb2R1bGUpOiB2b2lkIHtcbiAgICB0aGlzLl9fdW5yZWdpc3RlckF1dG9SZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2hhbmRsZSkpIHtcbiAgICAgIHRoaXMuX19oYW5kbGUuc3RvcCgpO1xuICAgICAgdGhpcy5fX2hhbmRsZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19jb250ZXh0KSkge1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19lZmZlY3QpKSB7XG4gICAgICAgIHRoaXMuX19jb250ZXh0LnJlbGVhc2VFZmZlY3QodGhpcy5fX2VmZmVjdCk7XG4gICAgICB9XG4gICAgICBpZiAoSXMuZXhpc3QoZWZmZWtzZWVyTW9kdWxlKSkge1xuICAgICAgICBlZmZla3NlZXJNb2R1bGUucmVsZWFzZUNvbnRleHQodGhpcy5fX2NvbnRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2NvbnRleHQucmVsZWFzZT8uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fY29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5fX2VmZmVjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9faXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlV2lkdGggPSAtMTtcbiAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUhlaWdodCA9IC0xO1xuICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlQ29sb3JGb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX19kcmF3RWZmZWtzZWVyRWZmZWN0Tm9ybWFsKCk6IHZvaWQge1xuICAgIGNvbnN0IGNhbWVyYUNvbXBvbmVudCA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIGNvbnN0IHZpZXdNYXRyaXggPSBFZmZla3NlZXJDb21wb25lbnQuX190bXBfaWRlbnRpdHlNYXRyaXhfMDtcbiAgICBjb25zdCBwcm9qZWN0aW9uTWF0cml4ID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fdG1wX2lkZW50aXR5TWF0cml4XzE7XG5cbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICB2aWV3TWF0cml4LmNvcHlDb21wb25lbnRzKGNhbWVyYUNvbXBvbmVudC52aWV3TWF0cml4KTtcbiAgICAgIHByb2plY3Rpb25NYXRyaXguY29weUNvbXBvbmVudHMoY2FtZXJhQ29tcG9uZW50LnByb2plY3Rpb25NYXRyaXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3TWF0cml4LmlkZW50aXR5KCk7XG4gICAgICBwcm9qZWN0aW9uTWF0cml4LmlkZW50aXR5KCk7XG4gICAgfVxuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgIHRoaXMuX19jb250ZXh0LnNldFByb2plY3Rpb25NYXRyaXgocHJvamVjdGlvbk1hdHJpeC5fdik7XG4gICAgICB0aGlzLl9fY29udGV4dC5zZXRDYW1lcmFNYXRyaXgodmlld01hdHJpeC5fdik7XG4gICAgICB0aGlzLl9fY29udGV4dC5kcmF3KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2RyYXdFZmZla3NlZXJFZmZlY3RXZWJHUFUoXG4gICAgcmVuZGVyUGFzc0VuY29kZXI6IEdQVVJlbmRlclBhc3NFbmNvZGVyLFxuICAgIG9wdGlvbnM/OiBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zLFxuICAgIGRpc3BsYXlJZHggPSAwXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGNhbWVyYUNvbXBvbmVudCA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIGNvbnN0IHZpZXdNYXRyaXggPSBFZmZla3NlZXJDb21wb25lbnQuX190bXBfaWRlbnRpdHlNYXRyaXhfMDtcbiAgICBjb25zdCBwcm9qZWN0aW9uTWF0cml4ID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fdG1wX2lkZW50aXR5TWF0cml4XzE7XG5cbiAgICBpZiAodGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ/LmlzV2ViWFJNb2RlKSB7XG4gICAgICBjb25zdCB3ZWJYUlByb2plY3Rpb25NYXRyaXggPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZC5fZ2V0UHJvamVjdE1hdHJpeEF0KGRpc3BsYXlJZHgpO1xuICAgICAgY29uc3Qgd2ViWFJWaWV3TWF0cml4ID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQuX2dldFZpZXdNYXRyaXhBdChkaXNwbGF5SWR4KTtcbiAgICAgIGlmIChJcy5leGlzdCh3ZWJYUlByb2plY3Rpb25NYXRyaXgpICYmIElzLmV4aXN0KHdlYlhSVmlld01hdHJpeCkpIHtcbiAgICAgICAgdmlld01hdHJpeC5jb3B5Q29tcG9uZW50cyh3ZWJYUlZpZXdNYXRyaXgpO1xuICAgICAgICBwcm9qZWN0aW9uTWF0cml4LmNvcHlDb21wb25lbnRzKHdlYlhSUHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3TWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgIHByb2plY3Rpb25NYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNhbWVyYUNvbXBvbmVudCkge1xuICAgICAgdmlld01hdHJpeC5jb3B5Q29tcG9uZW50cyhjYW1lcmFDb21wb25lbnQudmlld01hdHJpeCk7XG4gICAgICBwcm9qZWN0aW9uTWF0cml4LmNvcHlDb21wb25lbnRzKGNhbWVyYUNvbXBvbmVudC5wcm9qZWN0aW9uTWF0cml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlld01hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgcHJvamVjdGlvbk1hdHJpeC5pZGVudGl0eSgpO1xuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2NvbnRleHQpICYmIElzLmV4aXN0KHRoaXMuX19jb250ZXh0LmRyYXdUb1JlbmRlclBhc3MpKSB7XG4gICAgICB0aGlzLl9fY29udGV4dC5zZXRQcm9qZWN0aW9uTWF0cml4KHByb2plY3Rpb25NYXRyaXguX3YpO1xuICAgICAgdGhpcy5fX2NvbnRleHQuc2V0Q2FtZXJhTWF0cml4KHZpZXdNYXRyaXguX3YpO1xuICAgICAgdGhpcy5fX2NvbnRleHQuZHJhd1RvUmVuZGVyUGFzcyhyZW5kZXJQYXNzRW5jb2Rlciwgb3B0aW9ucyk7XG4gICAgICBjb25zdCB3ZWJHcHVFcnJvciA9IHRoaXMuX19jb250ZXh0LmdldExhc3RXZWJHUFVFcnJvcj8uKCk7XG4gICAgICBpZiAod2ViR3B1RXJyb3IpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3Iod2ViR3B1RXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViWFIoKTogdm9pZCB7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBpZiAod2ViWFJTeXN0ZW0gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgY29uc3QgcHJvamVjdGlvbk1hdHJpeCA9IHdlYlhSU3lzdGVtLl9nZXRQcm9qZWN0TWF0cml4QXQoaSk7XG4gICAgICBjb25zdCB2aWV3TWF0cml4ID0gd2ViWFJTeXN0ZW0uX2dldFZpZXdNYXRyaXhBdChpKTtcbiAgICAgIGlmIChJcy5leGlzdChwcm9qZWN0aW9uTWF0cml4KSAmJiBJcy5leGlzdCh2aWV3TWF0cml4KSAmJiBJcy5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgICB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeS5zZXRWaWV3cG9ydCh0aGlzLl9fZW5naW5lLCB3ZWJYUlN5c3RlbS5fZ2V0Vmlld3BvcnRBdChpKSk7XG4gICAgICAgIHRoaXMuX19jb250ZXh0LnNldFByb2plY3Rpb25NYXRyaXgocHJvamVjdGlvbk1hdHJpeC5fdik7XG4gICAgICAgIHRoaXMuX19jb250ZXh0LnNldENhbWVyYU1hdHJpeCh2aWV3TWF0cml4Ll92KTtcbiAgICAgICAgdGhpcy5fX2NvbnRleHQuZHJhdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRyZW5kZXIoKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fZWZmZWN0KSkge1xuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9hZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZD8uaXNXZWJYUk1vZGUpIHtcbiAgICAgIHRoaXMuX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViWFIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2RyYXdFZmZla3NlZXJFZmZlY3ROb3JtYWwoKTtcbiAgICB9XG5cbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAkcmVuZGVyV2ViR1BVKHJlbmRlclBhc3NFbmNvZGVyOiBHUFVSZW5kZXJQYXNzRW5jb2Rlciwgb3B0aW9ucz86IFdlYkdQVUV4dGVybmFsUmVuZGVyUGFzc09wdGlvbnMsIGRpc3BsYXlJZHggPSAwKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fZWZmZWN0KSkge1xuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9hZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViR1BVKHJlbmRlclBhc3NFbmNvZGVyLCBvcHRpb25zLCBkaXNwbGF5SWR4KTtcbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICBzdGF0aWMgc29ydF8kcmVuZGVyKGVuZ2luZTogRW5naW5lLCByZW5kZXJQYXNzOiBSZW5kZXJQYXNzKTogQ29tcG9uZW50U0lEW10ge1xuICAgIGlmIChJcy5mYWxzZShyZW5kZXJQYXNzLnRvUmVuZGVyRWZmZWtzZWVyRWZmZWN0cykpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgY29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShFZmZla3NlZXJDb21wb25lbnQpO1xuICAgIHJldHVybiBjb21wb25lbnRzLm1hcChjID0+IGMuY29tcG9uZW50U0lEKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAb3ZlcnJpZGVcbiAgICogQWRkIHRoaXMgY29tcG9uZW50IHRvIHRoZSBlbnRpdHlcbiAgICogQHBhcmFtIGJhc2UgdGhlIHRhcmdldCBlbnRpdHlcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyB0aGUgY29tcG9uZW50IGNsYXNzIHRvIGFkZFxuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIEVmZmVrc2VlckVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgZ2V0RWZmZWtzZWVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChFZmZla3NlZXJDb21wb25lbnQuY29tcG9uZW50VElEKSBhcyBFZmZla3NlZXJDb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIEVmZmVrc2VlckVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRWZmZWtzZWVyRW50aXR5TWV0aG9kcyB7XG4gIGdldEVmZmVrc2VlcigpOiBFZmZl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
