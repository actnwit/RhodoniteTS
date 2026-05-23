import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../foundation/components/ComponentTypes';
import { WellKnownComponentTIDs } from '../foundation/components/WellKnownComponentTIDs';
import { Component } from '../foundation/core/Component';
import type { IEntity } from '../foundation/core/Entity';
import { applyMixins } from '../foundation/core/EntityRepository';
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
  loadEffect(data: string | ArrayBuffer, scale?: number): Promise<EffekseerEffect>;
  loadEffectPackage(data: string | ArrayBuffer, Unzip: unknown, scale?: number): Promise<EffekseerEffect>;
  releaseEffect(effect: EffekseerEffect): void;
  release?: () => void;
  play(effect: EffekseerEffect, x?: number, y?: number, z?: number): EffekseerHandle | null;
  setRestorationOfStatesFlag?: (flag: boolean) => void;
};

type EffekseerModule = {
  initRuntime(options: { backend: 'webgl'; wasmPath?: string; scriptPath?: string }): Promise<void>;
  createContext(options: {
    backend: 'webgl';
    graphicsContext: WebGLRenderingContext | WebGL2RenderingContext;
    enablePremultipliedAlpha?: boolean;
  }): Promise<EffekseerContext>;
  releaseContext(context: EffekseerContext): void;
  setImageCrossOrigin(crossOrigin: string): void;
};

export class EffekseerComponent extends Component {
  public static readonly ANIMATION_EVENT_PLAY = 0;
  public static readonly ANIMATION_EVENT_PAUSE = 1;
  public static readonly ANIMATION_EVENT_END = 2;
  public static Unzip?: any;
  public static wasmModuleUri?: string;
  public static nativeScriptUri?: string;
  public uri?: string;
  public arrayBuffer?: ArrayBuffer;
  public type = 'efk';
  public playJustAfterLoaded = false;
  public isLoop = false;
  public isPause = false;
  public randomSeed = -1;
  public isImageLoadWithCredential = false;

  private __effect?: EffekseerEffect;
  private __context?: EffekseerContext;
  private __handle?: EffekseerHandle;
  private __speed = 1;
  private __timer?: any;
  private __isInitialized = false;
  private __isDestroyed = false;
  private __loadPromise?: Promise<boolean>;
  private __reportedMissingModule = false;
  private static __runtimeInitializationPromise?: Promise<void>;
  private static __runtimeInitializationKey?: string;
  private static __tmp_identityMatrix_0: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmp_identityMatrix_1: MutableMatrix44 = MutableMatrix44.identity();

  static get componentTID() {
    return WellKnownComponentTIDs.EffekseerComponentTID;
  }

  private static __getEffekseerModule(): EffekseerModule | undefined {
    const global = globalThis as typeof globalThis & { effekseer?: EffekseerModule };
    return global.effekseer;
  }

  private static async __initializeRuntime(effekseerModule: EffekseerModule): Promise<void> {
    const runtimeInitializationKey = `${EffekseerComponent.wasmModuleUri ?? ''}\n${
      EffekseerComponent.nativeScriptUri ?? ''
    }`;
    if (
      EffekseerComponent.__runtimeInitializationPromise == null ||
      EffekseerComponent.__runtimeInitializationKey !== runtimeInitializationKey
    ) {
      EffekseerComponent.__runtimeInitializationKey = runtimeInitializationKey;
      EffekseerComponent.__runtimeInitializationPromise = effekseerModule
        .initRuntime({
          backend: 'webgl',
          wasmPath: EffekseerComponent.wasmModuleUri,
          scriptPath: EffekseerComponent.nativeScriptUri,
        })
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

  private async __createEffekseerContext(effekseerModule: EffekseerModule): Promise<boolean> {
    if (Is.not.exist(this.uri) && Is.not.exist(this.arrayBuffer)) {
      return false;
    }
    const webGLResourceRepository = this.__engine.webglResourceRepository;
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    if (Is.not.exist(glw)) {
      Logger.default.error('WebGL context is not ready for Effekseer');
      return false;
    }

    const gl = glw.getRawContext();
    effekseerModule.setImageCrossOrigin(this.isImageLoadWithCredential ? 'use-credentials' : '');
    this.__context = await effekseerModule.createContext({
      backend: 'webgl',
      graphicsContext: gl,
      enablePremultipliedAlpha: true,
    });
    this.__context.setRestorationOfStatesFlag?.(true);

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
        await EffekseerComponent.__initializeRuntime(effekseerModule);
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
