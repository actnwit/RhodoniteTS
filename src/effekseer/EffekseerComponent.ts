/// <reference path="../../vendor/effekseer.d.ts" />
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

export class EffekseerComponent extends Component {
  public static readonly ANIMATION_EVENT_PLAY = 0;
  public static readonly ANIMATION_EVENT_PAUSE = 1;
  public static readonly ANIMATION_EVENT_END = 2;
  public static Unzip?: any;
  public uri?: string;
  public arrayBuffer?: ArrayBuffer;
  public type = 'efk';
  public playJustAfterLoaded = false;
  public isLoop = false;
  public isPause = false;
  public static wasmModuleUri = undefined;
  public randomSeed = -1;
  public isImageLoadWithCredential = false;
  private __effect?: effekseer.EffekseerEffect;
  private __context?: effekseer.EffekseerContext;
  private __handle?: effekseer.EffekseerHandle;
  private __speed = 1;
  private __timer?: any;
  private __isInitialized = false;
  private static __tmp_identityMatrix_0: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmp_identityMatrix_1: MutableMatrix44 = MutableMatrix44.identity();

  private isLoadEffect = false;

  static get componentTID() {
    return WellKnownComponentTIDs.EffekseerComponentTID;
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

    this.__handle = this.__context.play(this.__effect, 0, 0, 0);
    if (Is.exist(this.__handle) && Is.exist(this.__handle.setRandomSeed) && this.randomSeed > 0) {
      this.__handle.setRandomSeed(this.randomSeed);
    }

    // if (this.isLoop) {
    //   this.__timer = setTimeout(() => {
    //     this.play();
    //   }, 500);
    // }
    return true;
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

  set rotate(vec) {
    if (this.__handle) {
      this.__handle.setRotation(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform()!.localEulerAngles = vec;
  }

  get rotate() {
    return this.entity.tryToGetTransform()!.localEulerAngles;
  }

  set scale(vec) {
    if (this.__handle) {
      this.__handle.setScale(vec.x, vec.y, vec.z);
    }
    this.entity.tryToGetTransform()!.localScale = vec;
  }

  get scale() {
    return this.entity.tryToGetTransform()!.localScale;
  }

  private __createEffekseerContext(): boolean {
    if (Is.not.exist(this.uri) && Is.not.exist(this.arrayBuffer)) {
      // console.error('Effekseer data not found.');
      return false;
    }
    effekseer.setImageCrossOrigin(this.isImageLoadWithCredential ? 'use-credentials' : '');
    this.__context = effekseer.createContext();
    if (Is.not.exist(this.__context)) {
      Logger.default.error('Effekseer context creation fails');
      return false;
    }
    const webGLResourceRepository = this.__engine.webglResourceRepository;
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    this.__isInitialized = true;
    const gl = glw!.getRawContext();
    const data = Is.exist(this.uri) ? this.uri : this.arrayBuffer;
    this.__context.init(gl, { enablePremultipliedAlpha: true });

    const onLoad = () => {
      if (this.playJustAfterLoaded) {
        this.play();
        this.moveStageTo(ProcessStage.Logic);
      }
    };
    const onError = (message: string, path: string) => {
      Logger.default.error(`${message}, ${path}`);
    };
    if (this.type === 'efkpkg') {
      if (Is.not.exist(EffekseerComponent.Unzip)) {
        Logger.default.error('Please Set an Unzip object to EffekseerComponent.Unzip');
        return false;
      }
      this.__effect = this.__context.loadEffectPackage(
        data as any,
        EffekseerComponent.Unzip,
        1.0,
        onLoad.bind(this),
        onError.bind(this)
      );
    } else {
      this.__effect = this.__context.loadEffect(data as any, 1.0, onLoad.bind(this), onError.bind(this));
    }

    return true;
  }

  $load() {
    if (this.__isInitialized) {
      return;
    }
    if (Is.not.exist(this.__context) && Is.not.exist(this.__effect)) {
      const useWASM = Is.exist(EffekseerComponent.wasmModuleUri);
      if (useWASM) {
        effekseer.initRuntime(
          EffekseerComponent.wasmModuleUri!,
          () => {
            const succeed = this.__createEffekseerContext();
            if (succeed) {
              this.moveStageTo(ProcessStage.Logic);
            }
          },
          () => {
            Logger.default.error('Failed to initialize Effekseer');
          }
        );
      } else {
        const succeed = this.__createEffekseerContext();
        if (succeed) {
          this.moveStageTo(ProcessStage.Logic);
        }
      }
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
    if (Is.exist(this.__context)) {
      this.__context.releaseEffect(!this.__effect);
      effekseer.releaseContext(this.__context);
      this.__context = undefined;
    }
    if (Is.exist(this.__handle)) {
      this.__handle = undefined;
    }
    this.__effect = undefined;
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
    // const webGLResourceRepository =
    //   CGAPIResourceRepository.getWebGLResourceRepository();
    // webGLResourceRepository.setWebGLStateToDefault();
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
