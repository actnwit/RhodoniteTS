import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../foundation/components/ComponentTypes';
import { WellKnownComponentTIDs } from '../foundation/components/WellKnownComponentTIDs';
import { Component } from '../foundation/core/Component';
import type { IEntity } from '../foundation/core/Entity';
import { applyMixins } from '../foundation/core/EntityRepository';
import { ProcessApproach } from '../foundation/definitions/ProcessApproach';
import { ProcessStage } from '../foundation/definitions/ProcessStage';
import type { IVector3 } from '../foundation/math/IVector';
import { MutableMatrix44 } from '../foundation/math/MutableMatrix44';
import { Is } from '../foundation/misc/Is';
import { Logger } from '../foundation/misc/Logger';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { ComponentSID, Second } from '../types/CommonTypes';

type EffekseerEffect = {
  isLoaded: boolean;
};

type EffekseerHandle = {
  readonly exists: boolean;
  stop(): void;
  setLocation(x: number, y: number, z: number): void;
  setRotation(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
  setMatrix(matrixArray: ArrayLike<number>): void;
  setSpeed(speed: number): void;
  setRandomSeed(seed: number): void;
};

type EffekseerContext = {
  update(deltaFrames?: number): void;
  setProjectionMatrix(matrixArray: ArrayLike<number>): void;
  setCameraMatrix(matrixArray: ArrayLike<number>): void;
  draw(): void;
  configureSurface?: (options?: {
    width?: number;
    height?: number;
    colorFormat?: GPUTextureFormat;
    depthFormat?: GPUTextureFormat;
    alphaMode?: GPUCanvasAlphaMode;
    enablePremultipliedAlpha?: boolean;
  }) => void;
  drawToRenderPass?: (
    renderPassEncoder: GPURenderPassEncoder,
    options?: { colorFormat?: GPUTextureFormat; depthFormat?: GPUTextureFormat }
  ) => void;
  loadEffect(data: string | ArrayBuffer, scale?: number): Promise<EffekseerEffect>;
  loadEffectPackage(data: string | ArrayBuffer, Unzip: unknown, scale?: number): Promise<EffekseerEffect>;
  releaseEffect(effect: EffekseerEffect): void;
  release?: () => void;
  play(effect: EffekseerEffect, x?: number, y?: number, z?: number): EffekseerHandle | null;
  setSoundVolume?: (volume: number) => void;
  resumeSound?: () => Promise<void>;
  pauseSound?: () => void;
  setRestorationOfStatesFlag?: (flag: boolean) => void;
  getLastWebGPUError?: () => string | undefined;
};

type EffekseerModule = {
  initRuntime(
    options:
      | { backend: 'webgl'; wasmPath?: string; scriptPath?: string }
      | { backend: 'webgpu'; device?: GPUDevice; wasmPath?: string; scriptPath?: string }
  ): Promise<void>;
  createContext(
    options:
      | {
          backend: 'webgl';
          graphicsContext: WebGLRenderingContext | WebGL2RenderingContext;
          enablePremultipliedAlpha?: boolean;
        }
      | {
          backend: 'webgpu';
          canvas?: HTMLCanvasElement | OffscreenCanvas;
          canvasContext?: GPUCanvasContext;
          device?: GPUDevice;
          colorFormat?: GPUTextureFormat;
          depthFormat?: GPUTextureFormat;
          width?: number;
          height?: number;
          enablePremultipliedAlpha?: boolean;
        }
  ): Promise<EffekseerContext>;
  releaseContext(context: EffekseerContext): void;
  setImageCrossOrigin(crossOrigin: string): void;
};

type EffekseerBackend = 'webgl' | 'webgpu';
type WebGPUExternalRenderPassOptions = { colorFormat?: GPUTextureFormat; depthFormat?: GPUTextureFormat };

export class EffekseerComponent extends Component {
  public static readonly ANIMATION_EVENT_PLAY = 0;
  public static readonly ANIMATION_EVENT_PAUSE = 1;
  public static readonly ANIMATION_EVENT_END = 2;
  public static Unzip?: any;
  public static wasmModuleUri?: string;
  public static nativeScriptUri?: string;
  public static wasmModuleUriWebGL?: string;
  public static nativeScriptUriWebGL?: string;
  public static wasmModuleUriWebGPU?: string;
  public static nativeScriptUriWebGPU?: string;
  public uri?: string;
  public arrayBuffer?: ArrayBuffer;
  public type = 'efk';
  public playJustAfterLoaded = false;
  public isLoop = false;
  public isPause = false;
  public randomSeed = -1;
  public isImageLoadWithCredential = false;
  public isSoundEnabled = false;
  public autoResumeSoundByUserGesture = true;

  private __effect?: EffekseerEffect;
  private __context?: EffekseerContext;
  private __handle?: EffekseerHandle;
  private __speed = 1;
  private __timer?: any;
  private __isInitialized = false;
  private __isDestroyed = false;
  private __loadPromise?: Promise<boolean>;
  private __reportedMissingModule = false;
  private __autoResumeSoundEventTarget?: EventTarget;
  private __autoResumeSoundEventHandler?: EventListener;
  private __webGpuSurfaceWidth = -1;
  private __webGpuSurfaceHeight = -1;
  private __webGpuSurfaceColorFormat?: GPUTextureFormat;
  private __webGpuSurfaceDepthFormat?: GPUTextureFormat;
  private static __runtimeInitializationPromise?: Promise<void>;
  private static __runtimeInitializationKey?: string;
  private static __webGpuDeviceIds: WeakMap<GPUDevice, number> = new WeakMap();
  private static __webGpuDeviceIdCount = 0;
  private static __tmp_identityMatrix_0: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmp_identityMatrix_1: MutableMatrix44 = MutableMatrix44.identity();

  static get componentTID() {
    return WellKnownComponentTIDs.EffekseerComponentTID;
  }

  private static __getEffekseerModule(): EffekseerModule | undefined {
    const global = globalThis as typeof globalThis & { effekseer?: EffekseerModule };
    return global.effekseer;
  }

  private static __getWebGpuDeviceId(device?: GPUDevice): number {
    if (device == null) {
      return -1;
    }
    let id = EffekseerComponent.__webGpuDeviceIds.get(device);
    if (id == null) {
      id = ++EffekseerComponent.__webGpuDeviceIdCount;
      EffekseerComponent.__webGpuDeviceIds.set(device, id);
    }
    return id;
  }

  private static __getRuntimeUris(backend: EffekseerBackend): { wasmPath?: string; scriptPath?: string } {
    if (backend === 'webgpu') {
      return {
        wasmPath: EffekseerComponent.wasmModuleUriWebGPU ?? EffekseerComponent.wasmModuleUri,
        scriptPath: EffekseerComponent.nativeScriptUriWebGPU ?? EffekseerComponent.nativeScriptUri,
      };
    }
    return {
      wasmPath: EffekseerComponent.wasmModuleUriWebGL ?? EffekseerComponent.wasmModuleUri,
      scriptPath: EffekseerComponent.nativeScriptUriWebGL ?? EffekseerComponent.nativeScriptUri,
    };
  }

  private static async __initializeRuntime(
    effekseerModule: EffekseerModule,
    backend: EffekseerBackend,
    device?: GPUDevice
  ): Promise<void> {
    const { wasmPath, scriptPath } = EffekseerComponent.__getRuntimeUris(backend);
    const runtimeInitializationKey = `${backend}\n${wasmPath ?? ''}\n${scriptPath ?? ''}\n${EffekseerComponent.__getWebGpuDeviceId(device)}`;
    if (
      EffekseerComponent.__runtimeInitializationPromise == null ||
      EffekseerComponent.__runtimeInitializationKey !== runtimeInitializationKey
    ) {
      EffekseerComponent.__runtimeInitializationKey = runtimeInitializationKey;
      EffekseerComponent.__runtimeInitializationPromise = effekseerModule
        .initRuntime(
          backend === 'webgpu'
            ? {
                backend,
                device,
                wasmPath,
                scriptPath,
              }
            : {
                backend,
                wasmPath,
                scriptPath,
              }
        )
        .catch(error => {
          EffekseerComponent.__runtimeInitializationPromise = undefined;
          throw error;
        });
    }
    await EffekseerComponent.__runtimeInitializationPromise;
  }

  private static __formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  cancelLoop() {
    clearInterval(this.__timer as number);
  }

  isPlay(): boolean {
    if (Is.exist(this.__handle)) {
      if (this.__handle.exists) {
        return !this.isPause;
      }
      return false;
    }
    return false;
  }

  play() {
    if (Is.not.exist(this.__context)) {
      Logger.default.warn('No Effekseer context yet');
      return false;
    }
    if (Is.not.exist(this.__effect)) {
      Logger.default.warn('No Effekseer effect yet');
      return false;
    }

    this.stop();
    this.isPause = false;

    this.__handle = this.__context.play(this.__effect, 0, 0, 0) ?? undefined;
    if (Is.exist(this.__handle) && this.randomSeed > 0) {
      this.__handle.setRandomSeed(this.randomSeed);
    }

    // if (this.isLoop) {
    //   this.__timer = setTimeout(() => {
    //     this.play();
    //   }, 500);
    // }
    return Is.exist(this.__handle);
  }

  continue() {
    this.isPause = false;
  }

  pause() {
    if (Is.exist(this.__handle)) {
      this.isPause = true;
      clearInterval(this.__timer!);
    }
  }

  stop() {
    if (Is.exist(this.__handle)) {
      this.__handle.stop();
      this.isPause = true;
      clearInterval(this.__timer!);
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

  setSoundVolume(volume: number): void {
    this.__context?.setSoundVolume?.(volume);
  }

  async resumeSound(): Promise<boolean> {
    this.isSoundEnabled = true;
    this.__unregisterAutoResumeSoundByUserGesture();
    if (Is.not.exist(this.__context?.resumeSound)) {
      return false;
    }
    await this.__context.resumeSound();
    return true;
  }

  pauseSound(): void {
    this.isSoundEnabled = false;
    this.__unregisterAutoResumeSoundByUserGesture();
    this.__context?.pauseSound?.();
  }

  private __registerAutoResumeSoundByUserGesture(): void {
    if (
      !this.autoResumeSoundByUserGesture ||
      this.isSoundEnabled ||
      Is.not.exist(this.__context?.resumeSound) ||
      Is.exist(this.__autoResumeSoundEventHandler)
    ) {
      return;
    }

    let eventTarget: EventTarget | undefined;
    if (this.__getBackend() === 'webgpu') {
      eventTarget = this.__engine.webGpuResourceRepository.getWebGpuDeviceWrapper().canvas;
    } else {
      const glw = this.__engine.webglResourceRepository.currentWebGLContextWrapper;
      eventTarget = glw?.canvas;
    }
    eventTarget ??= typeof window !== 'undefined' ? window : undefined;
    if (Is.not.exist(eventTarget)) {
      return;
    }

    this.__autoResumeSoundEventTarget = eventTarget;
    this.__autoResumeSoundEventHandler = () => {
      void this.__resumeSoundByUserGesture();
    };

    eventTarget.addEventListener('pointerdown', this.__autoResumeSoundEventHandler, { once: true });
    eventTarget.addEventListener('keydown', this.__autoResumeSoundEventHandler, { once: true });
    eventTarget.addEventListener('touchstart', this.__autoResumeSoundEventHandler, { once: true, passive: true });
  }

  private __unregisterAutoResumeSoundByUserGesture(): void {
    if (Is.not.exist(this.__autoResumeSoundEventTarget) || Is.not.exist(this.__autoResumeSoundEventHandler)) {
      return;
    }

    this.__autoResumeSoundEventTarget.removeEventListener('pointerdown', this.__autoResumeSoundEventHandler);
    this.__autoResumeSoundEventTarget.removeEventListener('keydown', this.__autoResumeSoundEventHandler);
    this.__autoResumeSoundEventTarget.removeEventListener('touchstart', this.__autoResumeSoundEventHandler);
    this.__autoResumeSoundEventTarget = undefined;
    this.__autoResumeSoundEventHandler = undefined;
  }

  private async __resumeSoundByUserGesture(): Promise<void> {
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

  setTime(targetSec: Second) {
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

  set translate(vec: IVector3) {
    if (this.__handle) {
      this.__handle.setLocation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform()!.localPosition = vec;
  }

  get translate() {
    return this.entity.tryToGetTransform()!.localPosition;
  }

  set rotate(vec: IVector3) {
    if (this.__handle) {
      this.__handle.setRotation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform()!.localEulerAngles = vec;
  }

  get rotate() {
    return this.entity.tryToGetTransform()!.localEulerAngles;
  }

  set scale(vec: IVector3) {
    if (this.__handle) {
      this.__handle.setScale(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform()!.localScale = vec;
  }

  get scale() {
    return this.entity.tryToGetTransform()!.localScale;
  }

  private __getBackend(): EffekseerBackend {
    return ProcessApproach.isWebGpuApproach(this.__engine.processApproach) ? 'webgpu' : 'webgl';
  }

  private __getWebGpuDevice(): GPUDevice | undefined {
    if (this.__getBackend() !== 'webgpu') {
      return undefined;
    }
    return this.__engine.webGpuResourceRepository.getWebGpuDeviceWrapper().gpuDevice;
  }

  prepareWebGPURendering(options?: WebGPUExternalRenderPassOptions): void {
    if (this.__getBackend() !== 'webgpu' || Is.not.exist(this.__context?.configureSurface)) {
      return;
    }

    const webGpuDeviceWrapper = this.__engine.webGpuResourceRepository.getWebGpuDeviceWrapper();
    const width = webGpuDeviceWrapper.canvas.width;
    const height = webGpuDeviceWrapper.canvas.height;
    if (
      this.__webGpuSurfaceWidth === width &&
      this.__webGpuSurfaceHeight === height &&
      this.__webGpuSurfaceColorFormat === options?.colorFormat &&
      this.__webGpuSurfaceDepthFormat === options?.depthFormat
    ) {
      return;
    }

    this.__context.configureSurface({
      width,
      height,
      colorFormat: options?.colorFormat,
      depthFormat: options?.depthFormat,
      enablePremultipliedAlpha: true,
    });
    this.__webGpuSurfaceWidth = width;
    this.__webGpuSurfaceHeight = height;
    this.__webGpuSurfaceColorFormat = options?.colorFormat;
    this.__webGpuSurfaceDepthFormat = options?.depthFormat;
  }

  private async __createEffekseerContext(effekseerModule: EffekseerModule): Promise<boolean> {
    if (Is.not.exist(this.uri) && Is.not.exist(this.arrayBuffer)) {
      return false;
    }
    const backend = this.__getBackend();
    effekseerModule.setImageCrossOrigin(this.isImageLoadWithCredential ? 'use-credentials' : '');

    if (backend === 'webgpu') {
      const webGpuResourceRepository = this.__engine.webGpuResourceRepository;
      const webGpuDeviceWrapper = webGpuResourceRepository.getWebGpuDeviceWrapper();
      const { colorFormat, depthFormat } = webGpuResourceRepository.getEffekseerRenderPassOptions(this.__engine);
      const canvasContext = webGpuDeviceWrapper.context;
      const canvasSize = {
        width: webGpuDeviceWrapper.canvas.width,
        height: webGpuDeviceWrapper.canvas.height,
      };
      const externalCanvasContext = {
        canvas: canvasSize,
        configure: (_configuration: GPUCanvasConfiguration) => {
          // Rhodonite owns the swapchain configuration.
        },
        unconfigure: canvasContext.unconfigure?.bind(canvasContext),
        getCurrentTexture: () => {
          return canvasContext.getCurrentTexture();
        },
      } as GPUCanvasContext;
      this.__context = await effekseerModule.createContext({
        backend,
        canvasContext: externalCanvasContext,
        device: webGpuDeviceWrapper.gpuDevice,
        colorFormat,
        depthFormat,
        width: webGpuDeviceWrapper.canvas.width,
        height: webGpuDeviceWrapper.canvas.height,
        enablePremultipliedAlpha: true,
      });
    } else {
      const webGLResourceRepository = this.__engine.webglResourceRepository;
      const glw = webGLResourceRepository.currentWebGLContextWrapper;
      if (Is.not.exist(glw)) {
        Logger.default.error('WebGL context is not ready for Effekseer');
        return false;
      }

      const gl = glw.getRawContext();
      this.__context = await effekseerModule.createContext({
        backend,
        graphicsContext: gl,
        enablePremultipliedAlpha: true,
      });
    }
    this.__context.setRestorationOfStatesFlag?.(true);
    if (!this.isSoundEnabled) {
      this.__context.pauseSound?.();
      this.__registerAutoResumeSoundByUserGesture();
    }

    const data = Is.exist(this.uri) ? this.uri : this.arrayBuffer;
    try {
      if (this.type === 'efkpkg') {
        if (Is.not.exist(EffekseerComponent.Unzip)) {
          Logger.default.error('Please Set an Unzip object to EffekseerComponent.Unzip');
          this.__releaseEffekseerResources(effekseerModule);
          return false;
        }
        this.__effect = await this.__context.loadEffectPackage(data as any, EffekseerComponent.Unzip, 1.0);
      } else {
        this.__effect = await this.__context.loadEffect(data as any, 1.0);
      }
    } catch (error) {
      Logger.default.error(`Failed to load Effekseer effect: ${EffekseerComponent.__formatError(error)}`);
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
      const effekseerModule = EffekseerComponent.__getEffekseerModule();
      if (Is.not.exist(effekseerModule)) {
        if (!this.__reportedMissingModule) {
          Logger.default.error(
            'Effekseer module is not found. Import effekseer.js in HTML and assign it to globalThis.effekseer.'
          );
          this.__reportedMissingModule = true;
        }
        return;
      }

      this.__loadPromise = (async () => {
        await EffekseerComponent.__initializeRuntime(effekseerModule, this.__getBackend(), this.__getWebGpuDevice());
        return this.__createEffekseerContext(effekseerModule);
      })();
      this.__loadPromise
        .then(succeed => {
          if (succeed) {
            this.moveStageTo(ProcessStage.Logic);
          }
        })
        .catch(error => {
          Logger.default.error(`Failed to initialize Effekseer: ${EffekseerComponent.__formatError(error)}`);
        })
        .finally(() => {
          this.__loadPromise = undefined;
        });
    }
  }

  $logic() {
    if (!this.isPause) {
      // Playing ...
      if (Is.exist(this.__context) && Is.false(this.isPause)) {
        this.__context.update();
      }
    }

    if (this.__handle != null) {
      const worldMatrix = EffekseerComponent.__tmp_identityMatrix_0.copyComponents(
        this.entity.tryToGetSceneGraph()!.matrixInner
      );
      this.__handle.setMatrix(worldMatrix._v);
      this.__handle.setSpeed(this.__speed);
    }

    if (this.isPause) {
      // If Pause mode...
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

  _destroy(): void {
    super._destroy();
    this.__isDestroyed = true;
    const effekseerModule = EffekseerComponent.__getEffekseerModule();
    this.__releaseEffekseerResources(effekseerModule);
  }

  private __releaseEffekseerResources(effekseerModule?: EffekseerModule): void {
    this.__unregisterAutoResumeSoundByUserGesture();
    if (Is.exist(this.__handle)) {
      this.__handle.stop();
      this.__handle = undefined;
    }
    if (Is.exist(this.__context)) {
      if (Is.exist(this.__effect)) {
        this.__context.releaseEffect(this.__effect);
      }
      if (Is.exist(effekseerModule)) {
        effekseerModule.releaseContext(this.__context);
      } else {
        this.__context.release?.();
      }
      this.__context = undefined;
    }
    this.__effect = undefined;
    this.__isInitialized = false;
    this.__webGpuSurfaceWidth = -1;
    this.__webGpuSurfaceHeight = -1;
    this.__webGpuSurfaceColorFormat = undefined;
    this.__webGpuSurfaceDepthFormat = undefined;
  }

  private __drawEffekseerEffectNormal(): void {
    const cameraComponent = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    ) as CameraComponent;
    const viewMatrix = EffekseerComponent.__tmp_identityMatrix_0;
    const projectionMatrix = EffekseerComponent.__tmp_identityMatrix_1;

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

  private __drawEffekseerEffectWebGPU(
    renderPassEncoder: GPURenderPassEncoder,
    options?: WebGPUExternalRenderPassOptions,
    displayIdx = 0
  ): void {
    const cameraComponent = this.__engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(this.__engine)
    ) as CameraComponent;
    const viewMatrix = EffekseerComponent.__tmp_identityMatrix_0;
    const projectionMatrix = EffekseerComponent.__tmp_identityMatrix_1;

    if (this.__engine.webXRSystem.isWebXRMode) {
      const webXRProjectionMatrix = this.__engine.webXRSystem._getProjectMatrixAt(displayIdx);
      const webXRViewMatrix = this.__engine.webXRSystem._getViewMatrixAt(displayIdx);
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
      const webGpuError = this.__context.getLastWebGPUError?.();
      if (webGpuError) {
        Logger.default.error(webGpuError);
      }
    }
  }

  private __drawEffekseerEffectWebXR(): void {
    for (let i = 0; i < 2; i++) {
      const projectionMatrix = this.__engine.webXRSystem._getProjectMatrixAt(i);
      const viewMatrix = this.__engine.webXRSystem._getViewMatrixAt(i);
      if (Is.exist(projectionMatrix) && Is.exist(viewMatrix) && Is.exist(this.__context)) {
        const webGLResourceRepository = this.__engine.webglResourceRepository;
        webGLResourceRepository.setViewport(this.__engine, this.__engine.webXRSystem._getViewportAt(i));
        this.__context.setProjectionMatrix(projectionMatrix._v);
        this.__context.setCameraMatrix(viewMatrix._v);
        this.__context.draw();
      }
    }
  }

  $render() {
    if (Is.not.exist(this.__effect)) {
      this.moveStageTo(ProcessStage.Load);
      return;
    }
    if (this.__engine.webXRSystem.isWebXRMode) {
      this.__drawEffekseerEffectWebXR();
    } else {
      this.__drawEffekseerEffectNormal();
    }

    this.moveStageTo(ProcessStage.Logic);
  }

  $renderWebGPU(renderPassEncoder: GPURenderPassEncoder, options?: WebGPUExternalRenderPassOptions, displayIdx = 0) {
    if (Is.not.exist(this.__effect)) {
      this.moveStageTo(ProcessStage.Load);
      return;
    }
    this.__drawEffekseerEffectWebGPU(renderPassEncoder, options, displayIdx);
    this.moveStageTo(ProcessStage.Logic);
  }

  static sort_$render(engine: Engine, renderPass: RenderPass): ComponentSID[] {
    if (Is.false(renderPass.toRenderEffekseerEffects)) {
      return [];
    }
    const components = engine.componentRepository.getComponentsWithType(EffekseerComponent);
    return components.map(c => c.componentSID);
  }

  /**
   * @override
   * Add this component to the entity
   * @param base the target entity
   * @param _componentClass the component class to add
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class EffekseerEntity extends (base.constructor as any) {
      getEffekseer() {
        return this.getComponentByComponentTID(EffekseerComponent.componentTID) as EffekseerComponent;
      }
    }
    applyMixins(base, EffekseerEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}

export interface IEffekseerEntityMethods {
  getEffekseer(): EffekseerComponent;
}
