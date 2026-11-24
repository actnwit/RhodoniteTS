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
    this.m = 1;
    this.o = false;
    this.g = false;
    this.u = false;
    this.p = -1;
    this.q = -1;
  }
  static get componentTID() {
    return WellKnownComponentTIDs.EffekseerComponentTID;
  }
  static B() {
    const global = globalThis;
    return global.effekseer;
  }
  static E(device) {
    if (device == null) {
      return -1;
    }
    let id = _EffekseerComponent.w.get(device);
    if (id == null) {
      id = ++_EffekseerComponent.D;
      _EffekseerComponent.w.set(device, id);
    }
    return id;
  }
  static F(backend) {
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
  static async G(effekseerModule, backend, device) {
    const { wasmPath, scriptPath } = _EffekseerComponent.F(backend);
    const runtimeInitializationKey = `${backend}
${wasmPath != null ? wasmPath : ""}
${scriptPath != null ? scriptPath : ""}
${_EffekseerComponent.E(device)}`;
    if (_EffekseerComponent.j == null || _EffekseerComponent.v !== runtimeInitializationKey) {
      _EffekseerComponent.v = runtimeInitializationKey;
      _EffekseerComponent.j = effekseerModule.initRuntime(
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
        _EffekseerComponent.j = void 0;
        throw error;
      });
    }
    await _EffekseerComponent.j;
  }
  static C(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  cancelLoop() {
    clearInterval(this.n);
  }
  isPlay() {
    if (Is.exist(this.b)) {
      if (this.b.exists) {
        return !this.isPause;
      }
      return false;
    }
    return false;
  }
  play() {
    var _a;
    if (Is.not.exist(this.a)) {
      Logger.default.warn("No Effekseer context yet");
      return false;
    }
    if (Is.not.exist(this.d)) {
      Logger.default.warn("No Effekseer effect yet");
      return false;
    }
    this.stop();
    this.isPause = false;
    this.b = (_a = this.a.play(this.d, 0, 0, 0)) != null ? _a : void 0;
    if (Is.exist(this.b) && this.randomSeed > 0) {
      this.b.setRandomSeed(this.randomSeed);
    }
    return Is.exist(this.b);
  }
  continue() {
    this.isPause = false;
  }
  pause() {
    if (Is.exist(this.b)) {
      this.isPause = true;
      clearInterval(this.n);
    }
  }
  stop() {
    if (Is.exist(this.b)) {
      this.b.stop();
      this.isPause = true;
      clearInterval(this.n);
    }
  }
  set playSpeed(val) {
    if (this.b) {
      this.b.setSpeed(val);
    }
    this.m = val;
  }
  get playSpeed() {
    return this.m;
  }
  setSoundVolume(volume) {
    var _a, _b;
    (_b = (_a = this.a) == null ? void 0 : _a.setSoundVolume) == null ? void 0 : _b.call(_a, volume);
  }
  async resumeSound() {
    var _a;
    this.isSoundEnabled = true;
    this.k();
    if (Is.not.exist((_a = this.a) == null ? void 0 : _a.resumeSound)) {
      return false;
    }
    await this.a.resumeSound();
    return true;
  }
  pauseSound() {
    var _a, _b;
    this.isSoundEnabled = false;
    this.k();
    (_b = (_a = this.a) == null ? void 0 : _a.pauseSound) == null ? void 0 : _b.call(_a);
  }
  H() {
    var _a;
    if (!this.autoResumeSoundByUserGesture || this.isSoundEnabled || Is.not.exist((_a = this.a) == null ? void 0 : _a.resumeSound) || Is.exist(this.e)) {
      return;
    }
    let eventTarget;
    if (this.h() === "webgpu") {
      eventTarget = this.c.webGpuResourceRepository.getWebGpuDeviceWrapper().canvas;
    } else {
      const glw = this.c.webglResourceRepository.currentWebGLContextWrapper;
      eventTarget = glw == null ? void 0 : glw.canvas;
    }
    eventTarget != null ? eventTarget : eventTarget = typeof window !== "undefined" ? window : void 0;
    if (Is.not.exist(eventTarget)) {
      return;
    }
    this.f = eventTarget;
    this.e = () => {
      void this.I();
    };
    eventTarget.addEventListener("pointerdown", this.e, { once: true });
    eventTarget.addEventListener("keydown", this.e, { once: true });
    eventTarget.addEventListener("touchstart", this.e, { once: true, passive: true });
  }
  k() {
    if (Is.not.exist(this.f) || Is.not.exist(this.e)) {
      return;
    }
    this.f.removeEventListener("pointerdown", this.e);
    this.f.removeEventListener("keydown", this.e);
    this.f.removeEventListener("touchstart", this.e);
    this.f = void 0;
    this.e = void 0;
  }
  async I() {
    this.k();
    if (this.g) {
      return;
    }
    const shouldReplay = this.playJustAfterLoaded && !this.isLoop;
    const resumed = await this.resumeSound();
    if (!resumed || this.g) {
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
    if (Is.not.exist(this.a)) {
      return false;
    }
    let time = 0;
    const oneTime = 0.0166;
    time = oneTime;
    while (time <= targetSec) {
      this.a.update(time / oneTime);
      time += oneTime;
      if (targetSec < time) {
        const exceededSec = targetSec - time;
        const remainSec = oneTime - exceededSec;
        this.a.update(remainSec / oneTime);
        break;
      }
    }
    this.pause();
    return true;
  }
  set translate(vec) {
    if (this.b) {
      this.b.setLocation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform().localPosition = vec;
  }
  get translate() {
    return this.entity.tryToGetTransform().localPosition;
  }
  set rotate(vec) {
    if (this.b) {
      this.b.setRotation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform().localEulerAngles = vec;
  }
  get rotate() {
    return this.entity.tryToGetTransform().localEulerAngles;
  }
  set scale(vec) {
    if (this.b) {
      this.b.setScale(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform().localScale = vec;
  }
  get scale() {
    return this.entity.tryToGetTransform().localScale;
  }
  h() {
    return ProcessApproach.isWebGpuApproach(this.c.processApproach) ? "webgpu" : "webgl";
  }
  J() {
    if (this.h() !== "webgpu") {
      return void 0;
    }
    return this.c.webGpuResourceRepository.getWebGpuDeviceWrapper().gpuDevice;
  }
  prepareWebGPURendering(options) {
    var _a;
    if (this.h() !== "webgpu" || Is.not.exist((_a = this.a) == null ? void 0 : _a.configureSurface)) {
      return;
    }
    const webGpuDeviceWrapper = this.c.webGpuResourceRepository.getWebGpuDeviceWrapper();
    const width = webGpuDeviceWrapper.canvas.width;
    const height = webGpuDeviceWrapper.canvas.height;
    if (this.p === width && this.q === height && this.r === (options == null ? void 0 : options.colorFormat) && this.s === (options == null ? void 0 : options.depthFormat)) {
      return;
    }
    this.a.configureSurface({
      width,
      height,
      colorFormat: options == null ? void 0 : options.colorFormat,
      depthFormat: options == null ? void 0 : options.depthFormat,
      enablePremultipliedAlpha: true
    });
    this.p = width;
    this.q = height;
    this.r = options == null ? void 0 : options.colorFormat;
    this.s = options == null ? void 0 : options.depthFormat;
  }
  async K(effekseerModule) {
    var _a, _b, _c, _d, _e;
    if (Is.not.exist(this.uri) && Is.not.exist(this.arrayBuffer)) {
      return false;
    }
    const backend = this.h();
    effekseerModule.setImageCrossOrigin(this.isImageLoadWithCredential ? "use-credentials" : "");
    if (backend === "webgpu") {
      const webGpuResourceRepository = this.c.webGpuResourceRepository;
      const webGpuDeviceWrapper = webGpuResourceRepository.getWebGpuDeviceWrapper();
      const { colorFormat, depthFormat } = webGpuResourceRepository.getEffekseerRenderPassOptions(this.c);
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
      this.a = await effekseerModule.createContext({
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
      const webGLResourceRepository = this.c.webglResourceRepository;
      const glw = webGLResourceRepository.currentWebGLContextWrapper;
      if (Is.not.exist(glw)) {
        Logger.default.error("WebGL context is not ready for Effekseer");
        return false;
      }
      const gl = glw.getRawContext();
      this.a = await effekseerModule.createContext({
        backend,
        graphicsContext: gl,
        enablePremultipliedAlpha: true
      });
    }
    (_c = (_b = this.a).setRestorationOfStatesFlag) == null ? void 0 : _c.call(_b, true);
    if (!this.isSoundEnabled) {
      (_e = (_d = this.a).pauseSound) == null ? void 0 : _e.call(_d);
      this.H();
    }
    const data = Is.exist(this.uri) ? this.uri : this.arrayBuffer;
    try {
      if (this.type === "efkpkg") {
        if (Is.not.exist(_EffekseerComponent.Unzip)) {
          Logger.default.error("Please Set an Unzip object to EffekseerComponent.Unzip");
          this.l(effekseerModule);
          return false;
        }
        this.d = await this.a.loadEffectPackage(data, _EffekseerComponent.Unzip, 1);
      } else {
        this.d = await this.a.loadEffect(data, 1);
      }
    } catch (error) {
      Logger.default.error(`Failed to load Effekseer effect: ${_EffekseerComponent.C(error)}`);
      this.l(effekseerModule);
      return false;
    }
    if (this.g) {
      this.l(effekseerModule);
      return false;
    }
    this.o = true;
    if (this.playJustAfterLoaded) {
      this.play();
    }
    return true;
  }
  $load() {
    if (this.o || this.i != null || this.g) {
      return;
    }
    if (Is.not.exist(this.a) && Is.not.exist(this.d)) {
      const effekseerModule = _EffekseerComponent.B();
      if (Is.not.exist(effekseerModule)) {
        if (!this.u) {
          Logger.default.error(
            "Effekseer module is not found. Import effekseer.js in HTML and assign it to globalThis.effekseer."
          );
          this.u = true;
        }
        return;
      }
      this.i = (async () => {
        await _EffekseerComponent.G(effekseerModule, this.h(), this.J());
        return this.K(effekseerModule);
      })();
      this.i.then((succeed) => {
        if (succeed) {
          this.moveStageTo(ProcessStage.Logic);
        }
      }).catch((error) => {
        Logger.default.error(`Failed to initialize Effekseer: ${_EffekseerComponent.C(error)}`);
      }).finally(() => {
        this.i = void 0;
      });
    }
  }
  $logic() {
    if (!this.isPause) {
      if (Is.exist(this.a) && Is.false(this.isPause)) {
        this.a.update();
      }
    }
    if (this.b != null) {
      const worldMatrix = _EffekseerComponent.t.copyComponents(
        this.entity.tryToGetSceneGraph().matrixInner
      );
      this.b.setMatrix(worldMatrix._v);
      this.b.setSpeed(this.m);
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
    this.g = true;
    const effekseerModule = _EffekseerComponent.B();
    this.l(effekseerModule);
  }
  l(effekseerModule) {
    var _a, _b;
    this.k();
    if (Is.exist(this.b)) {
      this.b.stop();
      this.b = void 0;
    }
    if (Is.exist(this.a)) {
      if (Is.exist(this.d)) {
        this.a.releaseEffect(this.d);
      }
      if (Is.exist(effekseerModule)) {
        effekseerModule.releaseContext(this.a);
      } else {
        (_b = (_a = this.a).release) == null ? void 0 : _b.call(_a);
      }
      this.a = void 0;
    }
    this.d = void 0;
    this.o = false;
    this.p = -1;
    this.q = -1;
    this.r = void 0;
    this.s = void 0;
  }
  L() {
    const cameraComponent = this.c.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.c)
    );
    const viewMatrix = _EffekseerComponent.t;
    const projectionMatrix = _EffekseerComponent.A;
    if (cameraComponent) {
      viewMatrix.copyComponents(cameraComponent.viewMatrix);
      projectionMatrix.copyComponents(cameraComponent.projectionMatrix);
    } else {
      viewMatrix.identity();
      projectionMatrix.identity();
    }
    if (Is.exist(this.a)) {
      this.a.setProjectionMatrix(projectionMatrix._v);
      this.a.setCameraMatrix(viewMatrix._v);
      this.a.draw();
    }
  }
  M(renderPassEncoder, options, displayIdx = 0) {
    var _a, _b, _c;
    const cameraComponent = this.c.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.c)
    );
    const viewMatrix = _EffekseerComponent.t;
    const projectionMatrix = _EffekseerComponent.A;
    if ((_a = this.c._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) {
      const webXRProjectionMatrix = this.c._webXRSystemIfEnabled._getProjectMatrixAt(displayIdx);
      const webXRViewMatrix = this.c._webXRSystemIfEnabled._getViewMatrixAt(displayIdx);
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
    if (Is.exist(this.a) && Is.exist(this.a.drawToRenderPass)) {
      this.a.setProjectionMatrix(projectionMatrix._v);
      this.a.setCameraMatrix(viewMatrix._v);
      this.a.drawToRenderPass(renderPassEncoder, options);
      const webGpuError = (_c = (_b = this.a).getLastWebGPUError) == null ? void 0 : _c.call(_b);
      if (webGpuError) {
        Logger.default.error(webGpuError);
      }
    }
  }
  N() {
    const webXRSystem = this.c._webXRSystemIfEnabled;
    if (webXRSystem == null) {
      return;
    }
    for (let i = 0; i < 2; i++) {
      const projectionMatrix = webXRSystem._getProjectMatrixAt(i);
      const viewMatrix = webXRSystem._getViewMatrixAt(i);
      if (Is.exist(projectionMatrix) && Is.exist(viewMatrix) && Is.exist(this.a)) {
        const webGLResourceRepository = this.c.webglResourceRepository;
        webGLResourceRepository.setViewport(this.c, webXRSystem._getViewportAt(i));
        this.a.setProjectionMatrix(projectionMatrix._v);
        this.a.setCameraMatrix(viewMatrix._v);
        this.a.draw();
      }
    }
  }
  $render() {
    var _a;
    if (Is.not.exist(this.d)) {
      this.moveStageTo(ProcessStage.Load);
      return;
    }
    if ((_a = this.c._webXRSystemIfEnabled) == null ? void 0 : _a.isWebXRMode) {
      this.N();
    } else {
      this.L();
    }
    this.moveStageTo(ProcessStage.Logic);
  }
  $renderWebGPU(renderPassEncoder, options, displayIdx = 0) {
    if (Is.not.exist(this.d)) {
      this.moveStageTo(ProcessStage.Load);
      return;
    }
    this.M(renderPassEncoder, options, displayIdx);
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
_EffekseerComponent.w = /* @__PURE__ */ new WeakMap();
_EffekseerComponent.D = 0;
_EffekseerComponent.t = MutableMatrix44.identity();
_EffekseerComponent.A = MutableMatrix44.identity();
var EffekseerComponent = _EffekseerComponent;
export {
  EffekseerComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL2VmZmVrc2Vlci9FZmZla3NlZXJDb21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9jb21wb25lbnRzL0NvbXBvbmVudFR5cGVzJztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvbXBvbmVudHMvV2VsbEtub3duQ29tcG9uZW50VElEcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IzIH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL0lWZWN0b3InO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vZm91bmRhdGlvbi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vbWlzYy9Jcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9mb3VuZGF0aW9uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB0eXBlIHsgUmVuZGVyUGFzcyB9IGZyb20gJy4uL2ZvdW5kYXRpb24vcmVuZGVyZXIvUmVuZGVyUGFzcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFNJRCwgU2Vjb25kIH0gZnJvbSAnLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuXG50eXBlIEVmZmVrc2VlckVmZmVjdCA9IHtcbiAgaXNMb2FkZWQ6IGJvb2xlYW47XG59O1xuXG50eXBlIEVmZmVrc2VlckhhbmRsZSA9IHtcbiAgcmVhZG9ubHkgZXhpc3RzOiBib29sZWFuO1xuICBzdG9wKCk6IHZvaWQ7XG4gIHNldExvY2F0aW9uKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiB2b2lkO1xuICBzZXRSb3RhdGlvbih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogdm9pZDtcbiAgc2V0U2NhbGUoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IHZvaWQ7XG4gIHNldE1hdHJpeChtYXRyaXhBcnJheTogQXJyYXlMaWtlPG51bWJlcj4pOiB2b2lkO1xuICBzZXRTcGVlZChzcGVlZDogbnVtYmVyKTogdm9pZDtcbiAgc2V0UmFuZG9tU2VlZChzZWVkOiBudW1iZXIpOiB2b2lkO1xufTtcblxudHlwZSBFZmZla3NlZXJDb250ZXh0ID0ge1xuICB1cGRhdGUoZGVsdGFGcmFtZXM/OiBudW1iZXIpOiB2b2lkO1xuICBzZXRQcm9qZWN0aW9uTWF0cml4KG1hdHJpeEFycmF5OiBBcnJheUxpa2U8bnVtYmVyPik6IHZvaWQ7XG4gIHNldENhbWVyYU1hdHJpeChtYXRyaXhBcnJheTogQXJyYXlMaWtlPG51bWJlcj4pOiB2b2lkO1xuICBkcmF3KCk6IHZvaWQ7XG4gIGNvbmZpZ3VyZVN1cmZhY2U/OiAob3B0aW9ucz86IHtcbiAgICB3aWR0aD86IG51bWJlcjtcbiAgICBoZWlnaHQ/OiBudW1iZXI7XG4gICAgY29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0O1xuICAgIGRlcHRoRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDtcbiAgICBhbHBoYU1vZGU/OiBHUFVDYW52YXNBbHBoYU1vZGU7XG4gICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhPzogYm9vbGVhbjtcbiAgfSkgPT4gdm9pZDtcbiAgZHJhd1RvUmVuZGVyUGFzcz86IChcbiAgICByZW5kZXJQYXNzRW5jb2RlcjogR1BVUmVuZGVyUGFzc0VuY29kZXIsXG4gICAgb3B0aW9ucz86IHsgY29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0OyBkZXB0aEZvcm1hdD86IEdQVVRleHR1cmVGb3JtYXQgfVxuICApID0+IHZvaWQ7XG4gIGxvYWRFZmZlY3QoZGF0YTogc3RyaW5nIHwgQXJyYXlCdWZmZXIsIHNjYWxlPzogbnVtYmVyKTogUHJvbWlzZTxFZmZla3NlZXJFZmZlY3Q+O1xuICBsb2FkRWZmZWN0UGFja2FnZShkYXRhOiBzdHJpbmcgfCBBcnJheUJ1ZmZlciwgVW56aXA6IHVua25vd24sIHNjYWxlPzogbnVtYmVyKTogUHJvbWlzZTxFZmZla3NlZXJFZmZlY3Q+O1xuICByZWxlYXNlRWZmZWN0KGVmZmVjdDogRWZmZWtzZWVyRWZmZWN0KTogdm9pZDtcbiAgcmVsZWFzZT86ICgpID0+IHZvaWQ7XG4gIHBsYXkoZWZmZWN0OiBFZmZla3NlZXJFZmZlY3QsIHg/OiBudW1iZXIsIHk/OiBudW1iZXIsIHo/OiBudW1iZXIpOiBFZmZla3NlZXJIYW5kbGUgfCBudWxsO1xuICBzZXRTb3VuZFZvbHVtZT86ICh2b2x1bWU6IG51bWJlcikgPT4gdm9pZDtcbiAgcmVzdW1lU291bmQ/OiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBwYXVzZVNvdW5kPzogKCkgPT4gdm9pZDtcbiAgc2V0UmVzdG9yYXRpb25PZlN0YXRlc0ZsYWc/OiAoZmxhZzogYm9vbGVhbikgPT4gdm9pZDtcbiAgZ2V0TGFzdFdlYkdQVUVycm9yPzogKCkgPT4gc3RyaW5nIHwgdW5kZWZpbmVkO1xufTtcblxudHlwZSBFZmZla3NlZXJNb2R1bGUgPSB7XG4gIGluaXRSdW50aW1lKFxuICAgIG9wdGlvbnM6XG4gICAgICB8IHsgYmFja2VuZDogJ3dlYmdsJzsgd2FzbVBhdGg/OiBzdHJpbmc7IHNjcmlwdFBhdGg/OiBzdHJpbmcgfVxuICAgICAgfCB7IGJhY2tlbmQ6ICd3ZWJncHUnOyBkZXZpY2U/OiBHUFVEZXZpY2U7IHdhc21QYXRoPzogc3RyaW5nOyBzY3JpcHRQYXRoPzogc3RyaW5nIH1cbiAgKTogUHJvbWlzZTx2b2lkPjtcbiAgY3JlYXRlQ29udGV4dChcbiAgICBvcHRpb25zOlxuICAgICAgfCB7XG4gICAgICAgICAgYmFja2VuZDogJ3dlYmdsJztcbiAgICAgICAgICBncmFwaGljc0NvbnRleHQ6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQ7XG4gICAgICAgICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhPzogYm9vbGVhbjtcbiAgICAgICAgfVxuICAgICAgfCB7XG4gICAgICAgICAgYmFja2VuZDogJ3dlYmdwdSc7XG4gICAgICAgICAgY2FudmFzPzogSFRNTENhbnZhc0VsZW1lbnQgfCBPZmZzY3JlZW5DYW52YXM7XG4gICAgICAgICAgY2FudmFzQ29udGV4dD86IEdQVUNhbnZhc0NvbnRleHQ7XG4gICAgICAgICAgZGV2aWNlPzogR1BVRGV2aWNlO1xuICAgICAgICAgIGNvbG9yRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDtcbiAgICAgICAgICBkZXB0aEZvcm1hdD86IEdQVVRleHR1cmVGb3JtYXQ7XG4gICAgICAgICAgd2lkdGg/OiBudW1iZXI7XG4gICAgICAgICAgaGVpZ2h0PzogbnVtYmVyO1xuICAgICAgICAgIGVuYWJsZVByZW11bHRpcGxpZWRBbHBoYT86IGJvb2xlYW47XG4gICAgICAgIH1cbiAgKTogUHJvbWlzZTxFZmZla3NlZXJDb250ZXh0PjtcbiAgcmVsZWFzZUNvbnRleHQoY29udGV4dDogRWZmZWtzZWVyQ29udGV4dCk6IHZvaWQ7XG4gIHNldEltYWdlQ3Jvc3NPcmlnaW4oY3Jvc3NPcmlnaW46IHN0cmluZyk6IHZvaWQ7XG59O1xuXG50eXBlIEVmZmVrc2VlckJhY2tlbmQgPSAnd2ViZ2wnIHwgJ3dlYmdwdSc7XG50eXBlIFdlYkdQVUV4dGVybmFsUmVuZGVyUGFzc09wdGlvbnMgPSB7IGNvbG9yRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDsgZGVwdGhGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0IH07XG5cbmV4cG9ydCBjbGFzcyBFZmZla3NlZXJDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEFOSU1BVElPTl9FVkVOVF9QTEFZID0gMDtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBBTklNQVRJT05fRVZFTlRfUEFVU0UgPSAxO1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEFOSU1BVElPTl9FVkVOVF9FTkQgPSAyO1xuICBwdWJsaWMgc3RhdGljIFVuemlwPzogYW55O1xuICBwdWJsaWMgc3RhdGljIHdhc21Nb2R1bGVVcmk/OiBzdHJpbmc7XG4gIHB1YmxpYyBzdGF0aWMgbmF0aXZlU2NyaXB0VXJpPzogc3RyaW5nO1xuICBwdWJsaWMgc3RhdGljIHdhc21Nb2R1bGVVcmlXZWJHTD86IHN0cmluZztcbiAgcHVibGljIHN0YXRpYyBuYXRpdmVTY3JpcHRVcmlXZWJHTD86IHN0cmluZztcbiAgcHVibGljIHN0YXRpYyB3YXNtTW9kdWxlVXJpV2ViR1BVPzogc3RyaW5nO1xuICBwdWJsaWMgc3RhdGljIG5hdGl2ZVNjcmlwdFVyaVdlYkdQVT86IHN0cmluZztcbiAgcHVibGljIHVyaT86IHN0cmluZztcbiAgcHVibGljIGFycmF5QnVmZmVyPzogQXJyYXlCdWZmZXI7XG4gIHB1YmxpYyB0eXBlID0gJ2Vmayc7XG4gIHB1YmxpYyBwbGF5SnVzdEFmdGVyTG9hZGVkID0gZmFsc2U7XG4gIHB1YmxpYyBpc0xvb3AgPSBmYWxzZTtcbiAgcHVibGljIGlzUGF1c2UgPSBmYWxzZTtcbiAgcHVibGljIHJhbmRvbVNlZWQgPSAtMTtcbiAgcHVibGljIGlzSW1hZ2VMb2FkV2l0aENyZWRlbnRpYWwgPSBmYWxzZTtcbiAgcHVibGljIGlzU291bmRFbmFibGVkID0gZmFsc2U7XG4gIHB1YmxpYyBhdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlID0gdHJ1ZTtcblxuICBwcml2YXRlIF9fZWZmZWN0PzogRWZmZWtzZWVyRWZmZWN0O1xuICBwcml2YXRlIF9fY29udGV4dD86IEVmZmVrc2VlckNvbnRleHQ7XG4gIHByaXZhdGUgX19oYW5kbGU/OiBFZmZla3NlZXJIYW5kbGU7XG4gIHByaXZhdGUgX19zcGVlZCA9IDE7XG4gIHByaXZhdGUgX190aW1lcj86IGFueTtcbiAgcHJpdmF0ZSBfX2lzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzRGVzdHJveWVkID0gZmFsc2U7XG4gIHByaXZhdGUgX19sb2FkUHJvbWlzZT86IFByb21pc2U8Ym9vbGVhbj47XG4gIHByaXZhdGUgX19yZXBvcnRlZE1pc3NpbmdNb2R1bGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2F1dG9SZXN1bWVTb3VuZEV2ZW50VGFyZ2V0PzogRXZlbnRUYXJnZXQ7XG4gIHByaXZhdGUgX19hdXRvUmVzdW1lU291bmRFdmVudEhhbmRsZXI/OiBFdmVudExpc3RlbmVyO1xuICBwcml2YXRlIF9fd2ViR3B1U3VyZmFjZVdpZHRoID0gLTE7XG4gIHByaXZhdGUgX193ZWJHcHVTdXJmYWNlSGVpZ2h0ID0gLTE7XG4gIHByaXZhdGUgX193ZWJHcHVTdXJmYWNlQ29sb3JGb3JtYXQ/OiBHUFVUZXh0dXJlRm9ybWF0O1xuICBwcml2YXRlIF9fd2ViR3B1U3VyZmFjZURlcHRoRm9ybWF0PzogR1BVVGV4dHVyZUZvcm1hdDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlPzogUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBzdGF0aWMgX19ydW50aW1lSW5pdGlhbGl6YXRpb25LZXk/OiBzdHJpbmc7XG4gIHByaXZhdGUgc3RhdGljIF9fd2ViR3B1RGV2aWNlSWRzOiBXZWFrTWFwPEdQVURldmljZSwgbnVtYmVyPiA9IG5ldyBXZWFrTWFwKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fd2ViR3B1RGV2aWNlSWRDb3VudCA9IDA7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX2lkZW50aXR5TWF0cml4XzA6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9pZGVudGl0eU1hdHJpeF8xOiBNdXRhYmxlTWF0cml4NDQgPSBNdXRhYmxlTWF0cml4NDQuaWRlbnRpdHkoKTtcblxuICBzdGF0aWMgZ2V0IGNvbXBvbmVudFRJRCgpIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5FZmZla3NlZXJDb21wb25lbnRUSUQ7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBfX2dldEVmZmVrc2Vlck1vZHVsZSgpOiBFZmZla3NlZXJNb2R1bGUgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGdsb2JhbCA9IGdsb2JhbFRoaXMgYXMgdHlwZW9mIGdsb2JhbFRoaXMgJiB7IGVmZmVrc2Vlcj86IEVmZmVrc2Vlck1vZHVsZSB9O1xuICAgIHJldHVybiBnbG9iYWwuZWZmZWtzZWVyO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRXZWJHcHVEZXZpY2VJZChkZXZpY2U/OiBHUFVEZXZpY2UpOiBudW1iZXIge1xuICAgIGlmIChkZXZpY2UgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgaWQgPSBFZmZla3NlZXJDb21wb25lbnQuX193ZWJHcHVEZXZpY2VJZHMuZ2V0KGRldmljZSk7XG4gICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgIGlkID0gKytFZmZla3NlZXJDb21wb25lbnQuX193ZWJHcHVEZXZpY2VJZENvdW50O1xuICAgICAgRWZmZWtzZWVyQ29tcG9uZW50Ll9fd2ViR3B1RGV2aWNlSWRzLnNldChkZXZpY2UsIGlkKTtcbiAgICB9XG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZXRSdW50aW1lVXJpcyhiYWNrZW5kOiBFZmZla3NlZXJCYWNrZW5kKTogeyB3YXNtUGF0aD86IHN0cmluZzsgc2NyaXB0UGF0aD86IHN0cmluZyB9IHtcbiAgICBpZiAoYmFja2VuZCA9PT0gJ3dlYmdwdScpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdhc21QYXRoOiBFZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaVdlYkdQVSA/PyBFZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaSxcbiAgICAgICAgc2NyaXB0UGF0aDogRWZmZWtzZWVyQ29tcG9uZW50Lm5hdGl2ZVNjcmlwdFVyaVdlYkdQVSA/PyBFZmZla3NlZXJDb21wb25lbnQubmF0aXZlU2NyaXB0VXJpLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHdhc21QYXRoOiBFZmZla3NlZXJDb21wb25lbnQud2FzbU1vZHVsZVVyaVdlYkdMID8/IEVmZmVrc2VlckNvbXBvbmVudC53YXNtTW9kdWxlVXJpLFxuICAgICAgc2NyaXB0UGF0aDogRWZmZWtzZWVyQ29tcG9uZW50Lm5hdGl2ZVNjcmlwdFVyaVdlYkdMID8/IEVmZmVrc2VlckNvbXBvbmVudC5uYXRpdmVTY3JpcHRVcmksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIF9faW5pdGlhbGl6ZVJ1bnRpbWUoXG4gICAgZWZmZWtzZWVyTW9kdWxlOiBFZmZla3NlZXJNb2R1bGUsXG4gICAgYmFja2VuZDogRWZmZWtzZWVyQmFja2VuZCxcbiAgICBkZXZpY2U/OiBHUFVEZXZpY2VcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyB3YXNtUGF0aCwgc2NyaXB0UGF0aCB9ID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fZ2V0UnVudGltZVVyaXMoYmFja2VuZCk7XG4gICAgY29uc3QgcnVudGltZUluaXRpYWxpemF0aW9uS2V5ID0gYCR7YmFja2VuZH1cXG4ke3dhc21QYXRoID8/ICcnfVxcbiR7c2NyaXB0UGF0aCA/PyAnJ31cXG4ke0VmZmVrc2VlckNvbXBvbmVudC5fX2dldFdlYkdwdURldmljZUlkKGRldmljZSl9YDtcbiAgICBpZiAoXG4gICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlID09IG51bGwgfHxcbiAgICAgIEVmZmVrc2VlckNvbXBvbmVudC5fX3J1bnRpbWVJbml0aWFsaXphdGlvbktleSAhPT0gcnVudGltZUluaXRpYWxpemF0aW9uS2V5XG4gICAgKSB7XG4gICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25LZXkgPSBydW50aW1lSW5pdGlhbGl6YXRpb25LZXk7XG4gICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlID0gZWZmZWtzZWVyTW9kdWxlXG4gICAgICAgIC5pbml0UnVudGltZShcbiAgICAgICAgICBiYWNrZW5kID09PSAnd2ViZ3B1J1xuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgYmFja2VuZCxcbiAgICAgICAgICAgICAgICBkZXZpY2UsXG4gICAgICAgICAgICAgICAgd2FzbVBhdGgsXG4gICAgICAgICAgICAgICAgc2NyaXB0UGF0aCxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgYmFja2VuZCxcbiAgICAgICAgICAgICAgICB3YXNtUGF0aCxcbiAgICAgICAgICAgICAgICBzY3JpcHRQYXRoLFxuICAgICAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICBFZmZla3NlZXJDb21wb25lbnQuX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXdhaXQgRWZmZWtzZWVyQ29tcG9uZW50Ll9fcnVudGltZUluaXRpYWxpemF0aW9uUHJvbWlzZTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fZm9ybWF0RXJyb3IoZXJyb3I6IHVua25vd24pOiBzdHJpbmcge1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICByZXR1cm4gZXJyb3IubWVzc2FnZTtcbiAgICB9XG4gICAgcmV0dXJuIFN0cmluZyhlcnJvcik7XG4gIH1cblxuICBjYW5jZWxMb29wKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fX3RpbWVyIGFzIG51bWJlcik7XG4gIH1cblxuICBpc1BsYXkoKTogYm9vbGVhbiB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19oYW5kbGUpKSB7XG4gICAgICBpZiAodGhpcy5fX2hhbmRsZS5leGlzdHMpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzUGF1c2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBsYXkoKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oJ05vIEVmZmVrc2VlciBjb250ZXh0IHlldCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMuX19lZmZlY3QpKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC53YXJuKCdObyBFZmZla3NlZXIgZWZmZWN0IHlldCcpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcCgpO1xuICAgIHRoaXMuaXNQYXVzZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fX2hhbmRsZSA9IHRoaXMuX19jb250ZXh0LnBsYXkodGhpcy5fX2VmZmVjdCwgMCwgMCwgMCkgPz8gdW5kZWZpbmVkO1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9faGFuZGxlKSAmJiB0aGlzLnJhbmRvbVNlZWQgPiAwKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFJhbmRvbVNlZWQodGhpcy5yYW5kb21TZWVkKTtcbiAgICB9XG5cbiAgICAvLyBpZiAodGhpcy5pc0xvb3ApIHtcbiAgICAvLyAgIHRoaXMuX190aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIC8vICAgICB0aGlzLnBsYXkoKTtcbiAgICAvLyAgIH0sIDUwMCk7XG4gICAgLy8gfVxuICAgIHJldHVybiBJcy5leGlzdCh0aGlzLl9faGFuZGxlKTtcbiAgfVxuXG4gIGNvbnRpbnVlKCkge1xuICAgIHRoaXMuaXNQYXVzZSA9IGZhbHNlO1xuICB9XG5cbiAgcGF1c2UoKSB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19oYW5kbGUpKSB7XG4gICAgICB0aGlzLmlzUGF1c2UgPSB0cnVlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9fdGltZXIhKTtcbiAgICB9XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9faGFuZGxlKSkge1xuICAgICAgdGhpcy5fX2hhbmRsZS5zdG9wKCk7XG4gICAgICB0aGlzLmlzUGF1c2UgPSB0cnVlO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9fdGltZXIhKTtcbiAgICB9XG4gIH1cblxuICBzZXQgcGxheVNwZWVkKHZhbCkge1xuICAgIGlmICh0aGlzLl9faGFuZGxlKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFNwZWVkKHZhbCk7XG4gICAgfVxuICAgIHRoaXMuX19zcGVlZCA9IHZhbDtcbiAgfVxuXG4gIGdldCBwbGF5U3BlZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zcGVlZDtcbiAgfVxuXG4gIHNldFNvdW5kVm9sdW1lKHZvbHVtZTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5fX2NvbnRleHQ/LnNldFNvdW5kVm9sdW1lPy4odm9sdW1lKTtcbiAgfVxuXG4gIGFzeW5jIHJlc3VtZVNvdW5kKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRoaXMuaXNTb3VuZEVuYWJsZWQgPSB0cnVlO1xuICAgIHRoaXMuX191bnJlZ2lzdGVyQXV0b1Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSgpO1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX2NvbnRleHQ/LnJlc3VtZVNvdW5kKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLl9fY29udGV4dC5yZXN1bWVTb3VuZCgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcGF1c2VTb3VuZCgpOiB2b2lkIHtcbiAgICB0aGlzLmlzU291bmRFbmFibGVkID0gZmFsc2U7XG4gICAgdGhpcy5fX3VucmVnaXN0ZXJBdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlKCk7XG4gICAgdGhpcy5fX2NvbnRleHQ/LnBhdXNlU291bmQ/LigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfX3JlZ2lzdGVyQXV0b1Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSgpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5hdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlIHx8XG4gICAgICB0aGlzLmlzU291bmRFbmFibGVkIHx8XG4gICAgICBJcy5ub3QuZXhpc3QodGhpcy5fX2NvbnRleHQ/LnJlc3VtZVNvdW5kKSB8fFxuICAgICAgSXMuZXhpc3QodGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlcilcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLl9fZ2V0QmFja2VuZCgpID09PSAnd2ViZ3B1Jykge1xuICAgICAgZXZlbnRUYXJnZXQgPSB0aGlzLl9fZW5naW5lLndlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCkuY2FudmFzO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBnbHcgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5LmN1cnJlbnRXZWJHTENvbnRleHRXcmFwcGVyO1xuICAgICAgZXZlbnRUYXJnZXQgPSBnbHc/LmNhbnZhcztcbiAgICB9XG4gICAgZXZlbnRUYXJnZXQgPz89IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIGlmIChJcy5ub3QuZXhpc3QoZXZlbnRUYXJnZXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXQ7XG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciA9ICgpID0+IHtcbiAgICAgIHZvaWQgdGhpcy5fX3Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSgpO1xuICAgIH07XG5cbiAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudEhhbmRsZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRIYW5kbGVyLCB7IG9uY2U6IHRydWUsIHBhc3NpdmU6IHRydWUgfSk7XG4gIH1cblxuICBwcml2YXRlIF9fdW5yZWdpc3RlckF1dG9SZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTogdm9pZCB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRUYXJnZXQpIHx8IElzLm5vdC5leGlzdCh0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRIYW5kbGVyKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudEhhbmRsZXIpO1xuICAgIHRoaXMuX19hdXRvUmVzdW1lU291bmRFdmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlcik7XG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRIYW5kbGVyKTtcbiAgICB0aGlzLl9fYXV0b1Jlc3VtZVNvdW5kRXZlbnRUYXJnZXQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX19yZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5fX3VucmVnaXN0ZXJBdXRvUmVzdW1lU291bmRCeVVzZXJHZXN0dXJlKCk7XG4gICAgaWYgKHRoaXMuX19pc0Rlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNob3VsZFJlcGxheSA9IHRoaXMucGxheUp1c3RBZnRlckxvYWRlZCAmJiAhdGhpcy5pc0xvb3A7XG4gICAgY29uc3QgcmVzdW1lZCA9IGF3YWl0IHRoaXMucmVzdW1lU291bmQoKTtcbiAgICBpZiAoIXJlc3VtZWQgfHwgdGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChzaG91bGRSZXBsYXkpIHtcbiAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfVxuICB9XG5cbiAgc2V0VGltZSh0YXJnZXRTZWM6IFNlY29uZCkge1xuICAgIGlmICghdGhpcy5wbGF5KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdGltZSA9IDA7XG4gICAgY29uc3Qgb25lVGltZSA9IDAuMDE2NjtcbiAgICB0aW1lID0gb25lVGltZTtcbiAgICB3aGlsZSAodGltZSA8PSB0YXJnZXRTZWMpIHtcbiAgICAgIHRoaXMuX19jb250ZXh0LnVwZGF0ZSh0aW1lIC8gb25lVGltZSk7XG4gICAgICB0aW1lICs9IG9uZVRpbWU7XG4gICAgICBpZiAodGFyZ2V0U2VjIDwgdGltZSkge1xuICAgICAgICBjb25zdCBleGNlZWRlZFNlYyA9IHRhcmdldFNlYyAtIHRpbWU7XG4gICAgICAgIGNvbnN0IHJlbWFpblNlYyA9IG9uZVRpbWUgLSBleGNlZWRlZFNlYztcbiAgICAgICAgdGhpcy5fX2NvbnRleHQudXBkYXRlKHJlbWFpblNlYyAvIG9uZVRpbWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBhdXNlKCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHNldCB0cmFuc2xhdGUodmVjOiBJVmVjdG9yMykge1xuICAgIGlmICh0aGlzLl9faGFuZGxlKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldExvY2F0aW9uKHZlYy54LCB2ZWMueSwgdmVjLnopO1xuICAgIH1cbiAgICB0aGlzLmVudGl0eS50cnlUb0dldFRyYW5zZm9ybSgpIS5sb2NhbFBvc2l0aW9uID0gdmVjO1xuICB9XG5cbiAgZ2V0IHRyYW5zbGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRpdHkudHJ5VG9HZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbjtcbiAgfVxuXG4gIHNldCByb3RhdGUodmVjOiBJVmVjdG9yMykge1xuICAgIGlmICh0aGlzLl9faGFuZGxlKSB7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFJvdGF0aW9uKHZlYy54LCB2ZWMueSwgdmVjLnopO1xuICAgIH1cbiAgICB0aGlzLmVudGl0eS50cnlUb0dldFRyYW5zZm9ybSgpIS5sb2NhbEV1bGVyQW5nbGVzID0gdmVjO1xuICB9XG5cbiAgZ2V0IHJvdGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRpdHkudHJ5VG9HZXRUcmFuc2Zvcm0oKSEubG9jYWxFdWxlckFuZ2xlcztcbiAgfVxuXG4gIHNldCBzY2FsZSh2ZWM6IElWZWN0b3IzKSB7XG4gICAgaWYgKHRoaXMuX19oYW5kbGUpIHtcbiAgICAgIHRoaXMuX19oYW5kbGUuc2V0U2NhbGUodmVjLngsIHZlYy55LCB2ZWMueik7XG4gICAgfVxuICAgIHRoaXMuZW50aXR5LnRyeVRvR2V0VHJhbnNmb3JtKCkhLmxvY2FsU2NhbGUgPSB2ZWM7XG4gIH1cblxuICBnZXQgc2NhbGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW50aXR5LnRyeVRvR2V0VHJhbnNmb3JtKCkhLmxvY2FsU2NhbGU7XG4gIH1cblxuICBwcml2YXRlIF9fZ2V0QmFja2VuZCgpOiBFZmZla3NlZXJCYWNrZW5kIHtcbiAgICByZXR1cm4gUHJvY2Vzc0FwcHJvYWNoLmlzV2ViR3B1QXBwcm9hY2godGhpcy5fX2VuZ2luZS5wcm9jZXNzQXBwcm9hY2gpID8gJ3dlYmdwdScgOiAnd2ViZ2wnO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldFdlYkdwdURldmljZSgpOiBHUFVEZXZpY2UgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9fZ2V0QmFja2VuZCgpICE9PSAnd2ViZ3B1Jykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldFdlYkdwdURldmljZVdyYXBwZXIoKS5ncHVEZXZpY2U7XG4gIH1cblxuICBwcmVwYXJlV2ViR1BVUmVuZGVyaW5nKG9wdGlvbnM/OiBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19nZXRCYWNrZW5kKCkgIT09ICd3ZWJncHUnIHx8IElzLm5vdC5leGlzdCh0aGlzLl9fY29udGV4dD8uY29uZmlndXJlU3VyZmFjZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB3ZWJHcHVEZXZpY2VXcmFwcGVyID0gdGhpcy5fX2VuZ2luZS53ZWJHcHVSZXNvdXJjZVJlcG9zaXRvcnkuZ2V0V2ViR3B1RGV2aWNlV3JhcHBlcigpO1xuICAgIGNvbnN0IHdpZHRoID0gd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMud2lkdGg7XG4gICAgY29uc3QgaGVpZ2h0ID0gd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMuaGVpZ2h0O1xuICAgIGlmIChcbiAgICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlV2lkdGggPT09IHdpZHRoICYmXG4gICAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUhlaWdodCA9PT0gaGVpZ2h0ICYmXG4gICAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUNvbG9yRm9ybWF0ID09PSBvcHRpb25zPy5jb2xvckZvcm1hdCAmJlxuICAgICAgdGhpcy5fX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCA9PT0gb3B0aW9ucz8uZGVwdGhGb3JtYXRcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fY29udGV4dC5jb25maWd1cmVTdXJmYWNlKHtcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0LFxuICAgICAgY29sb3JGb3JtYXQ6IG9wdGlvbnM/LmNvbG9yRm9ybWF0LFxuICAgICAgZGVwdGhGb3JtYXQ6IG9wdGlvbnM/LmRlcHRoRm9ybWF0LFxuICAgICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhOiB0cnVlLFxuICAgIH0pO1xuICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlV2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUhlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUNvbG9yRm9ybWF0ID0gb3B0aW9ucz8uY29sb3JGb3JtYXQ7XG4gICAgdGhpcy5fX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCA9IG9wdGlvbnM/LmRlcHRoRm9ybWF0O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfX2NyZWF0ZUVmZmVrc2VlckNvbnRleHQoZWZmZWtzZWVyTW9kdWxlOiBFZmZla3NlZXJNb2R1bGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoSXMubm90LmV4aXN0KHRoaXMudXJpKSAmJiBJcy5ub3QuZXhpc3QodGhpcy5hcnJheUJ1ZmZlcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgYmFja2VuZCA9IHRoaXMuX19nZXRCYWNrZW5kKCk7XG4gICAgZWZmZWtzZWVyTW9kdWxlLnNldEltYWdlQ3Jvc3NPcmlnaW4odGhpcy5pc0ltYWdlTG9hZFdpdGhDcmVkZW50aWFsID8gJ3VzZS1jcmVkZW50aWFscycgOiAnJyk7XG5cbiAgICBpZiAoYmFja2VuZCA9PT0gJ3dlYmdwdScpIHtcbiAgICAgIGNvbnN0IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeSA9IHRoaXMuX19lbmdpbmUud2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3Qgd2ViR3B1RGV2aWNlV3JhcHBlciA9IHdlYkdwdVJlc291cmNlUmVwb3NpdG9yeS5nZXRXZWJHcHVEZXZpY2VXcmFwcGVyKCk7XG4gICAgICBjb25zdCB7IGNvbG9yRm9ybWF0LCBkZXB0aEZvcm1hdCB9ID0gd2ViR3B1UmVzb3VyY2VSZXBvc2l0b3J5LmdldEVmZmVrc2VlclJlbmRlclBhc3NPcHRpb25zKHRoaXMuX19lbmdpbmUpO1xuICAgICAgY29uc3QgY2FudmFzQ29udGV4dCA9IHdlYkdwdURldmljZVdyYXBwZXIuY29udGV4dDtcbiAgICAgIGNvbnN0IGNhbnZhc1NpemUgPSB7XG4gICAgICAgIHdpZHRoOiB3ZWJHcHVEZXZpY2VXcmFwcGVyLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiB3ZWJHcHVEZXZpY2VXcmFwcGVyLmNhbnZhcy5oZWlnaHQsXG4gICAgICB9O1xuICAgICAgY29uc3QgZXh0ZXJuYWxDYW52YXNDb250ZXh0ID0ge1xuICAgICAgICBjYW52YXM6IGNhbnZhc1NpemUsXG4gICAgICAgIGNvbmZpZ3VyZTogKF9jb25maWd1cmF0aW9uOiBHUFVDYW52YXNDb25maWd1cmF0aW9uKSA9PiB7XG4gICAgICAgICAgLy8gUmhvZG9uaXRlIG93bnMgdGhlIHN3YXBjaGFpbiBjb25maWd1cmF0aW9uLlxuICAgICAgICB9LFxuICAgICAgICB1bmNvbmZpZ3VyZTogY2FudmFzQ29udGV4dC51bmNvbmZpZ3VyZT8uYmluZChjYW52YXNDb250ZXh0KSxcbiAgICAgICAgZ2V0Q3VycmVudFRleHR1cmU6ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gY2FudmFzQ29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xuICAgICAgICB9LFxuICAgICAgfSBhcyBHUFVDYW52YXNDb250ZXh0O1xuICAgICAgdGhpcy5fX2NvbnRleHQgPSBhd2FpdCBlZmZla3NlZXJNb2R1bGUuY3JlYXRlQ29udGV4dCh7XG4gICAgICAgIGJhY2tlbmQsXG4gICAgICAgIGNhbnZhc0NvbnRleHQ6IGV4dGVybmFsQ2FudmFzQ29udGV4dCxcbiAgICAgICAgZGV2aWNlOiB3ZWJHcHVEZXZpY2VXcmFwcGVyLmdwdURldmljZSxcbiAgICAgICAgY29sb3JGb3JtYXQsXG4gICAgICAgIGRlcHRoRm9ybWF0LFxuICAgICAgICB3aWR0aDogd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogd2ViR3B1RGV2aWNlV3JhcHBlci5jYW52YXMuaGVpZ2h0LFxuICAgICAgICBlbmFibGVQcmVtdWx0aXBsaWVkQWxwaGE6IHRydWUsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgY29uc3QgZ2x3ID0gd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkuY3VycmVudFdlYkdMQ29udGV4dFdyYXBwZXI7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGdsdykpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ1dlYkdMIGNvbnRleHQgaXMgbm90IHJlYWR5IGZvciBFZmZla3NlZXInKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBnbCA9IGdsdy5nZXRSYXdDb250ZXh0KCk7XG4gICAgICB0aGlzLl9fY29udGV4dCA9IGF3YWl0IGVmZmVrc2Vlck1vZHVsZS5jcmVhdGVDb250ZXh0KHtcbiAgICAgICAgYmFja2VuZCxcbiAgICAgICAgZ3JhcGhpY3NDb250ZXh0OiBnbCxcbiAgICAgICAgZW5hYmxlUHJlbXVsdGlwbGllZEFscGhhOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX19jb250ZXh0LnNldFJlc3RvcmF0aW9uT2ZTdGF0ZXNGbGFnPy4odHJ1ZSk7XG4gICAgaWYgKCF0aGlzLmlzU291bmRFbmFibGVkKSB7XG4gICAgICB0aGlzLl9fY29udGV4dC5wYXVzZVNvdW5kPy4oKTtcbiAgICAgIHRoaXMuX19yZWdpc3RlckF1dG9SZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gSXMuZXhpc3QodGhpcy51cmkpID8gdGhpcy51cmkgOiB0aGlzLmFycmF5QnVmZmVyO1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy50eXBlID09PSAnZWZrcGtnJykge1xuICAgICAgICBpZiAoSXMubm90LmV4aXN0KEVmZmVrc2VlckNvbXBvbmVudC5VbnppcCkpIHtcbiAgICAgICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignUGxlYXNlIFNldCBhbiBVbnppcCBvYmplY3QgdG8gRWZmZWtzZWVyQ29tcG9uZW50LlVuemlwJyk7XG4gICAgICAgICAgdGhpcy5fX3JlbGVhc2VFZmZla3NlZXJSZXNvdXJjZXMoZWZmZWtzZWVyTW9kdWxlKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX2VmZmVjdCA9IGF3YWl0IHRoaXMuX19jb250ZXh0LmxvYWRFZmZlY3RQYWNrYWdlKGRhdGEgYXMgYW55LCBFZmZla3NlZXJDb21wb25lbnQuVW56aXAsIDEuMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9fZWZmZWN0ID0gYXdhaXQgdGhpcy5fX2NvbnRleHQubG9hZEVmZmVjdChkYXRhIGFzIGFueSwgMS4wKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEZhaWxlZCB0byBsb2FkIEVmZmVrc2VlciBlZmZlY3Q6ICR7RWZmZWtzZWVyQ29tcG9uZW50Ll9fZm9ybWF0RXJyb3IoZXJyb3IpfWApO1xuICAgICAgdGhpcy5fX3JlbGVhc2VFZmZla3NlZXJSZXNvdXJjZXMoZWZmZWtzZWVyTW9kdWxlKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICB0aGlzLl9fcmVsZWFzZUVmZmVrc2VlclJlc291cmNlcyhlZmZla3NlZXJNb2R1bGUpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuX19pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5wbGF5SnVzdEFmdGVyTG9hZGVkKSB7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAkbG9hZCgpIHtcbiAgICBpZiAodGhpcy5fX2lzSW5pdGlhbGl6ZWQgfHwgdGhpcy5fX2xvYWRQcm9taXNlICE9IG51bGwgfHwgdGhpcy5fX2lzRGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX2NvbnRleHQpICYmIElzLm5vdC5leGlzdCh0aGlzLl9fZWZmZWN0KSkge1xuICAgICAgY29uc3QgZWZmZWtzZWVyTW9kdWxlID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fZ2V0RWZmZWtzZWVyTW9kdWxlKCk7XG4gICAgICBpZiAoSXMubm90LmV4aXN0KGVmZmVrc2Vlck1vZHVsZSkpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9fcmVwb3J0ZWRNaXNzaW5nTW9kdWxlKSB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoXG4gICAgICAgICAgICAnRWZmZWtzZWVyIG1vZHVsZSBpcyBub3QgZm91bmQuIEltcG9ydCBlZmZla3NlZXIuanMgaW4gSFRNTCBhbmQgYXNzaWduIGl0IHRvIGdsb2JhbFRoaXMuZWZmZWtzZWVyLidcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuX19yZXBvcnRlZE1pc3NpbmdNb2R1bGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2xvYWRQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgRWZmZWtzZWVyQ29tcG9uZW50Ll9faW5pdGlhbGl6ZVJ1bnRpbWUoZWZmZWtzZWVyTW9kdWxlLCB0aGlzLl9fZ2V0QmFja2VuZCgpLCB0aGlzLl9fZ2V0V2ViR3B1RGV2aWNlKCkpO1xuICAgICAgICByZXR1cm4gdGhpcy5fX2NyZWF0ZUVmZmVrc2VlckNvbnRleHQoZWZmZWtzZWVyTW9kdWxlKTtcbiAgICAgIH0pKCk7XG4gICAgICB0aGlzLl9fbG9hZFByb21pc2VcbiAgICAgICAgLnRoZW4oc3VjY2VlZCA9PiB7XG4gICAgICAgICAgaWYgKHN1Y2NlZWQpIHtcbiAgICAgICAgICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoYEZhaWxlZCB0byBpbml0aWFsaXplIEVmZmVrc2VlcjogJHtFZmZla3NlZXJDb21wb25lbnQuX19mb3JtYXRFcnJvcihlcnJvcil9YCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9fbG9hZFByb21pc2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gICRsb2dpYygpIHtcbiAgICBpZiAoIXRoaXMuaXNQYXVzZSkge1xuICAgICAgLy8gUGxheWluZyAuLi5cbiAgICAgIGlmIChJcy5leGlzdCh0aGlzLl9fY29udGV4dCkgJiYgSXMuZmFsc2UodGhpcy5pc1BhdXNlKSkge1xuICAgICAgICB0aGlzLl9fY29udGV4dC51cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5fX2hhbmRsZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IEVmZmVrc2VlckNvbXBvbmVudC5fX3RtcF9pZGVudGl0eU1hdHJpeF8wLmNvcHlDb21wb25lbnRzKFxuICAgICAgICB0aGlzLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKSEubWF0cml4SW5uZXJcbiAgICAgICk7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldE1hdHJpeCh3b3JsZE1hdHJpeC5fdik7XG4gICAgICB0aGlzLl9faGFuZGxlLnNldFNwZWVkKHRoaXMuX19zcGVlZCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNQYXVzZSkge1xuICAgICAgLy8gSWYgUGF1c2UgbW9kZS4uLlxuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuUmVuZGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0xvb3ApIHtcbiAgICAgIGlmICghdGhpcy5pc1BsYXkoKSkge1xuICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5SZW5kZXIpO1xuICB9XG5cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICB0aGlzLl9faXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgIGNvbnN0IGVmZmVrc2Vlck1vZHVsZSA9IEVmZmVrc2VlckNvbXBvbmVudC5fX2dldEVmZmVrc2Vlck1vZHVsZSgpO1xuICAgIHRoaXMuX19yZWxlYXNlRWZmZWtzZWVyUmVzb3VyY2VzKGVmZmVrc2Vlck1vZHVsZSk7XG4gIH1cblxuICBwcml2YXRlIF9fcmVsZWFzZUVmZmVrc2VlclJlc291cmNlcyhlZmZla3NlZXJNb2R1bGU/OiBFZmZla3NlZXJNb2R1bGUpOiB2b2lkIHtcbiAgICB0aGlzLl9fdW5yZWdpc3RlckF1dG9SZXN1bWVTb3VuZEJ5VXNlckdlc3R1cmUoKTtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2hhbmRsZSkpIHtcbiAgICAgIHRoaXMuX19oYW5kbGUuc3RvcCgpO1xuICAgICAgdGhpcy5fX2hhbmRsZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX19jb250ZXh0KSkge1xuICAgICAgaWYgKElzLmV4aXN0KHRoaXMuX19lZmZlY3QpKSB7XG4gICAgICAgIHRoaXMuX19jb250ZXh0LnJlbGVhc2VFZmZlY3QodGhpcy5fX2VmZmVjdCk7XG4gICAgICB9XG4gICAgICBpZiAoSXMuZXhpc3QoZWZmZWtzZWVyTW9kdWxlKSkge1xuICAgICAgICBlZmZla3NlZXJNb2R1bGUucmVsZWFzZUNvbnRleHQodGhpcy5fX2NvbnRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2NvbnRleHQucmVsZWFzZT8uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fY29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5fX2VmZmVjdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9faXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlV2lkdGggPSAtMTtcbiAgICB0aGlzLl9fd2ViR3B1U3VyZmFjZUhlaWdodCA9IC0xO1xuICAgIHRoaXMuX193ZWJHcHVTdXJmYWNlQ29sb3JGb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgX19kcmF3RWZmZWtzZWVyRWZmZWN0Tm9ybWFsKCk6IHZvaWQge1xuICAgIGNvbnN0IGNhbWVyYUNvbXBvbmVudCA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIGNvbnN0IHZpZXdNYXRyaXggPSBFZmZla3NlZXJDb21wb25lbnQuX190bXBfaWRlbnRpdHlNYXRyaXhfMDtcbiAgICBjb25zdCBwcm9qZWN0aW9uTWF0cml4ID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fdG1wX2lkZW50aXR5TWF0cml4XzE7XG5cbiAgICBpZiAoY2FtZXJhQ29tcG9uZW50KSB7XG4gICAgICB2aWV3TWF0cml4LmNvcHlDb21wb25lbnRzKGNhbWVyYUNvbXBvbmVudC52aWV3TWF0cml4KTtcbiAgICAgIHByb2plY3Rpb25NYXRyaXguY29weUNvbXBvbmVudHMoY2FtZXJhQ29tcG9uZW50LnByb2plY3Rpb25NYXRyaXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3TWF0cml4LmlkZW50aXR5KCk7XG4gICAgICBwcm9qZWN0aW9uTWF0cml4LmlkZW50aXR5KCk7XG4gICAgfVxuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgIHRoaXMuX19jb250ZXh0LnNldFByb2plY3Rpb25NYXRyaXgocHJvamVjdGlvbk1hdHJpeC5fdik7XG4gICAgICB0aGlzLl9fY29udGV4dC5zZXRDYW1lcmFNYXRyaXgodmlld01hdHJpeC5fdik7XG4gICAgICB0aGlzLl9fY29udGV4dC5kcmF3KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfX2RyYXdFZmZla3NlZXJFZmZlY3RXZWJHUFUoXG4gICAgcmVuZGVyUGFzc0VuY29kZXI6IEdQVVJlbmRlclBhc3NFbmNvZGVyLFxuICAgIG9wdGlvbnM/OiBXZWJHUFVFeHRlcm5hbFJlbmRlclBhc3NPcHRpb25zLFxuICAgIGRpc3BsYXlJZHggPSAwXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGNhbWVyYUNvbXBvbmVudCA9IHRoaXMuX19lbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudCh0aGlzLl9fZW5naW5lKVxuICAgICkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIGNvbnN0IHZpZXdNYXRyaXggPSBFZmZla3NlZXJDb21wb25lbnQuX190bXBfaWRlbnRpdHlNYXRyaXhfMDtcbiAgICBjb25zdCBwcm9qZWN0aW9uTWF0cml4ID0gRWZmZWtzZWVyQ29tcG9uZW50Ll9fdG1wX2lkZW50aXR5TWF0cml4XzE7XG5cbiAgICBpZiAodGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ/LmlzV2ViWFJNb2RlKSB7XG4gICAgICBjb25zdCB3ZWJYUlByb2plY3Rpb25NYXRyaXggPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZC5fZ2V0UHJvamVjdE1hdHJpeEF0KGRpc3BsYXlJZHgpO1xuICAgICAgY29uc3Qgd2ViWFJWaWV3TWF0cml4ID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQuX2dldFZpZXdNYXRyaXhBdChkaXNwbGF5SWR4KTtcbiAgICAgIGlmIChJcy5leGlzdCh3ZWJYUlByb2plY3Rpb25NYXRyaXgpICYmIElzLmV4aXN0KHdlYlhSVmlld01hdHJpeCkpIHtcbiAgICAgICAgdmlld01hdHJpeC5jb3B5Q29tcG9uZW50cyh3ZWJYUlZpZXdNYXRyaXgpO1xuICAgICAgICBwcm9qZWN0aW9uTWF0cml4LmNvcHlDb21wb25lbnRzKHdlYlhSUHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3TWF0cml4LmlkZW50aXR5KCk7XG4gICAgICAgIHByb2plY3Rpb25NYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNhbWVyYUNvbXBvbmVudCkge1xuICAgICAgdmlld01hdHJpeC5jb3B5Q29tcG9uZW50cyhjYW1lcmFDb21wb25lbnQudmlld01hdHJpeCk7XG4gICAgICBwcm9qZWN0aW9uTWF0cml4LmNvcHlDb21wb25lbnRzKGNhbWVyYUNvbXBvbmVudC5wcm9qZWN0aW9uTWF0cml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlld01hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgcHJvamVjdGlvbk1hdHJpeC5pZGVudGl0eSgpO1xuICAgIH1cbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2NvbnRleHQpICYmIElzLmV4aXN0KHRoaXMuX19jb250ZXh0LmRyYXdUb1JlbmRlclBhc3MpKSB7XG4gICAgICB0aGlzLl9fY29udGV4dC5zZXRQcm9qZWN0aW9uTWF0cml4KHByb2plY3Rpb25NYXRyaXguX3YpO1xuICAgICAgdGhpcy5fX2NvbnRleHQuc2V0Q2FtZXJhTWF0cml4KHZpZXdNYXRyaXguX3YpO1xuICAgICAgdGhpcy5fX2NvbnRleHQuZHJhd1RvUmVuZGVyUGFzcyhyZW5kZXJQYXNzRW5jb2Rlciwgb3B0aW9ucyk7XG4gICAgICBjb25zdCB3ZWJHcHVFcnJvciA9IHRoaXMuX19jb250ZXh0LmdldExhc3RXZWJHUFVFcnJvcj8uKCk7XG4gICAgICBpZiAod2ViR3B1RXJyb3IpIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3Iod2ViR3B1RXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViWFIoKTogdm9pZCB7XG4gICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICBpZiAod2ViWFJTeXN0ZW0gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgY29uc3QgcHJvamVjdGlvbk1hdHJpeCA9IHdlYlhSU3lzdGVtLl9nZXRQcm9qZWN0TWF0cml4QXQoaSk7XG4gICAgICBjb25zdCB2aWV3TWF0cml4ID0gd2ViWFJTeXN0ZW0uX2dldFZpZXdNYXRyaXhBdChpKTtcbiAgICAgIGlmIChJcy5leGlzdChwcm9qZWN0aW9uTWF0cml4KSAmJiBJcy5leGlzdCh2aWV3TWF0cml4KSAmJiBJcy5leGlzdCh0aGlzLl9fY29udGV4dCkpIHtcbiAgICAgICAgY29uc3Qgd2ViR0xSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLndlYmdsUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgICAgICB3ZWJHTFJlc291cmNlUmVwb3NpdG9yeS5zZXRWaWV3cG9ydCh0aGlzLl9fZW5naW5lLCB3ZWJYUlN5c3RlbS5fZ2V0Vmlld3BvcnRBdChpKSk7XG4gICAgICAgIHRoaXMuX19jb250ZXh0LnNldFByb2plY3Rpb25NYXRyaXgocHJvamVjdGlvbk1hdHJpeC5fdik7XG4gICAgICAgIHRoaXMuX19jb250ZXh0LnNldENhbWVyYU1hdHJpeCh2aWV3TWF0cml4Ll92KTtcbiAgICAgICAgdGhpcy5fX2NvbnRleHQuZHJhdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICRyZW5kZXIoKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fZWZmZWN0KSkge1xuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9hZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZD8uaXNXZWJYUk1vZGUpIHtcbiAgICAgIHRoaXMuX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViWFIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX2RyYXdFZmZla3NlZXJFZmZlY3ROb3JtYWwoKTtcbiAgICB9XG5cbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAkcmVuZGVyV2ViR1BVKHJlbmRlclBhc3NFbmNvZGVyOiBHUFVSZW5kZXJQYXNzRW5jb2Rlciwgb3B0aW9ucz86IFdlYkdQVUV4dGVybmFsUmVuZGVyUGFzc09wdGlvbnMsIGRpc3BsYXlJZHggPSAwKSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fZWZmZWN0KSkge1xuICAgICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9hZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViR1BVKHJlbmRlclBhc3NFbmNvZGVyLCBvcHRpb25zLCBkaXNwbGF5SWR4KTtcbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICBzdGF0aWMgc29ydF8kcmVuZGVyKGVuZ2luZTogRW5naW5lLCByZW5kZXJQYXNzOiBSZW5kZXJQYXNzKTogQ29tcG9uZW50U0lEW10ge1xuICAgIGlmIChJcy5mYWxzZShyZW5kZXJQYXNzLnRvUmVuZGVyRWZmZWtzZWVyRWZmZWN0cykpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgY29uc3QgY29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudHNXaXRoVHlwZShFZmZla3NlZXJDb21wb25lbnQpO1xuICAgIHJldHVybiBjb21wb25lbnRzLm1hcChjID0+IGMuY29tcG9uZW50U0lEKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAb3ZlcnJpZGVcbiAgICogQWRkIHRoaXMgY29tcG9uZW50IHRvIHRoZSBlbnRpdHlcbiAgICogQHBhcmFtIGJhc2UgdGhlIHRhcmdldCBlbnRpdHlcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyB0aGUgY29tcG9uZW50IGNsYXNzIHRvIGFkZFxuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIEVmZmVrc2VlckVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgZ2V0RWZmZWtzZWVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChFZmZla3NlZXJDb21wb25lbnQuY29tcG9uZW50VElEKSBhcyBFZmZla3NlZXJDb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIEVmZmVrc2VlckVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRWZmZWtzZWVyRW50aXR5TWV0aG9kcyB7XG4gIGdldEVmZmVrc2VlcigpOiBFZmZl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QUF4QzVCLG9CQXlDSXVCLElBQTBDLGdCQUFnQixTQUFTO0FBekN2RSxvQkEwQ0lFLElBQTBDLGdCQUFnQixTQUFTO0FBMUM3RSxJQUFNLHFCQUFOOyIsCiAgIm5hbWVzIjogWyJfX3NwZWVkIiwgIl9faXNJbml0aWFsaXplZCIsICJfX2lzRGVzdHJveWVkIiwgIl9fcmVwb3J0ZWRNaXNzaW5nTW9kdWxlIiwgIl9fd2ViR3B1U3VyZmFjZVdpZHRoIiwgIl9fd2ViR3B1U3VyZmFjZUhlaWdodCIsICJfX2dldEVmZmVrc2Vlck1vZHVsZSIsICJfX2dldFdlYkdwdURldmljZUlkIiwgIl9fd2ViR3B1RGV2aWNlSWRzIiwgIl9fd2ViR3B1RGV2aWNlSWRDb3VudCIsICJfX2dldFJ1bnRpbWVVcmlzIiwgIl9faW5pdGlhbGl6ZVJ1bnRpbWUiLCAiX19ydW50aW1lSW5pdGlhbGl6YXRpb25Qcm9taXNlIiwgIl9fcnVudGltZUluaXRpYWxpemF0aW9uS2V5IiwgIl9fZm9ybWF0RXJyb3IiLCAiX190aW1lciIsICJfX2hhbmRsZSIsICJfX2NvbnRleHQiLCAiX19lZmZlY3QiLCAiX191bnJlZ2lzdGVyQXV0b1Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSIsICJfX3JlZ2lzdGVyQXV0b1Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSIsICJfX2F1dG9SZXN1bWVTb3VuZEV2ZW50SGFuZGxlciIsICJfX2dldEJhY2tlbmQiLCAiX19lbmdpbmUiLCAiX19hdXRvUmVzdW1lU291bmRFdmVudFRhcmdldCIsICJfX3Jlc3VtZVNvdW5kQnlVc2VyR2VzdHVyZSIsICJfX2dldFdlYkdwdURldmljZSIsICJfX3dlYkdwdVN1cmZhY2VDb2xvckZvcm1hdCIsICJfX3dlYkdwdVN1cmZhY2VEZXB0aEZvcm1hdCIsICJfX2NyZWF0ZUVmZmVrc2VlckNvbnRleHQiLCAiX19yZWxlYXNlRWZmZWtzZWVyUmVzb3VyY2VzIiwgIl9fbG9hZFByb21pc2UiLCAiX190bXBfaWRlbnRpdHlNYXRyaXhfMCIsICJfX2RyYXdFZmZla3NlZXJFZmZlY3ROb3JtYWwiLCAiX190bXBfaWRlbnRpdHlNYXRyaXhfMSIsICJfX2RyYXdFZmZla3NlZXJFZmZlY3RXZWJHUFUiLCAiX19kcmF3RWZmZWtzZWVyRWZmZWN0V2ViWFIiXQp9Cg==
