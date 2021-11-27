import Component from '../foundation/core/Component';
import EntityRepository from '../foundation/core/EntityRepository';
import SceneGraphComponent from '../foundation/components/SceneGraphComponent';
import {ProcessStage} from '../foundation/definitions/ProcessStage';
import TransformComponent from '../foundation/components/TransformComponent';
import CameraComponent from '../foundation/components/CameraComponent';
import ComponentRepository from '../foundation/core/ComponentRepository';
import {WellKnownComponentTIDs} from '../foundation/components/WellKnownComponentTIDs';
import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import {
  ComponentTID,
  EntityUID,
  ComponentSID,
  Second,
} from '../types/CommonTypes';
import Config from '../foundation/core/Config';
import MutableMatrix44 from '../foundation/math/MutableMatrix44';
import {Is} from '../foundation/misc/Is';
import {IVector3} from '../foundation/math/IVector';

declare let effekseer: any;

export default class EffekseerComponent extends Component {
  public uri?: string;
  public playJustAfterLoaded = false;
  public isLoop = false;
  public isPause = false;
  public static wasmModuleUri = undefined;
  public randomSeed = -1;
  public isImageLoadWithCredential = false;
  private __effect?: any;
  private __context: any;
  private __handle?: any;
  private __speed = 1;
  private __timer?: unknown;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __transformComponent?: TransformComponent;
  private static __isInitialized = false;
  private static __tmp_identityMatrix_0: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmp_identityMatrix_1: MutableMatrix44 = MutableMatrix44.identity();

  private isLoadEffect = false;

  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super(entityUid, componentSid, entityRepository);
    Config.noWebGLTex2DStateCache = true;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.EffekseerComponentTID;
  }

  cancelLoop() {
    clearInterval(this.__timer as number);
  }

  isPlay(): boolean {
    return Is.exist(this.__handle) ? this.__handle.exists : false;
  }

  play() {
    if (Is.not.exist(this.__context)) {
      console.warn('No Effekseer context yet');
      return false;
    }
    if (Is.not.exist(this.__context)) {
      console.warn('No Effekseer effect yet');
      return false;
    }

    this.stop();
    this.isPause = false;

    this.__handle = this.__context?.play(this.__effect);
    if (this.randomSeed > 0) {
      this.__handle?.setRandomSeed(this.randomSeed);
    }

    return true;
  }

  continue() {
    this.isPause = false;
  }

  pause() {
    if (Is.exist(this.__handle)) {
      this.isPause = true;
    }
  }

  stop() {
    if (Is.exist(this.__handle)) {
      this.__handle.stop();
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
    this.__transformComponent!.translate = vec;
  }

  get translate() {
    return this.__transformComponent!.translate;
  }

  set rotate(vec) {
    if (this.__handle) {
      this.__handle.setRotation(vec.x, vec.y, vec.z);
    }
    this.__transformComponent!.rotate = vec;
  }

  get rotate() {
    return this.__transformComponent!.rotate;
  }

  set scale(vec) {
    if (this.__handle) {
      this.__handle.setScale(vec.x, vec.y, vec.z);
    }
    this.__transformComponent!.scale = vec;
  }

  get scale() {
    return this.__transformComponent!.scale;
  }

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      SceneGraphComponent
    ) as SceneGraphComponent;
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(
      this.__entityUid,
      TransformComponent
    ) as TransformComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  private __createEffekseerContext() {
    effekseer.setImageCrossOrigin(
      this.isImageLoadWithCredential ? 'use-credentials' : ''
    );
    this.__context = effekseer.createContext();
    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webGLResourceRepository.currentWebGLContextWrapper;
    EffekseerComponent.__isInitialized = true;
    const gl = glw!.getRawContext();
    this.__context.init(gl);
    this.__effect = this.__context.loadEffect(this.uri, 1.0, () => {
      if (this.playJustAfterLoaded) {
        if (this.isLoop) {
          this.__timer = setInterval(() => {
            this.play();
          }, 500);
        } else {
          this.play();
        }
        this.moveStageTo(ProcessStage.Logic);
      }
    });
  }

  $load() {
    if (EffekseerComponent.__isInitialized) {
      return;
    }
    if (Is.not.exist(this.__context) && Is.not.exist(this.__effect)) {
      const useWASM = Is.exist(EffekseerComponent.wasmModuleUri);
      if (useWASM) {
        effekseer.initRuntime(EffekseerComponent.wasmModuleUri, () => {
          this.__createEffekseerContext();
          this.moveStageTo(ProcessStage.Logic);
        });
      } else {
        this.__createEffekseerContext();
        this.moveStageTo(ProcessStage.Logic);
      }
    }
  }

  $logic() {
    if (!this.isPause) {
      // Playing ...
      this.__context.update();
    }

    if (this.__handle != null) {
      const worldMatrix = EffekseerComponent.__tmp_identityMatrix_0.copyComponents(
        this.__sceneGraphComponent!.worldMatrixInner
      );
      this.__handle.setMatrix(worldMatrix._v);
      this.__handle.setSpeed(this.__speed);
    }

    if(this.isPause) {
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

  $render() {
    const cameraComponent = ComponentRepository.getInstance().getComponent(
      CameraComponent,
      CameraComponent.main
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
    this.__context.setProjectionMatrix(projectionMatrix._v);
    this.__context.setCameraMatrix(viewMatrix._v);
    this.__context.draw();

    this.moveStageTo(ProcessStage.Logic);
  }
}
ComponentRepository.registerComponentClass(EffekseerComponent);
