import Component from '../foundation/core/Component';
import EntityRepository from '../foundation/core/EntityRepository';
import SceneGraphComponent from '../foundation/components/SceneGraphComponent';
import {ProcessStage} from '../foundation/definitions/ProcessStage';
import TransformComponent from '../foundation/components/TransformComponent';
import Vector3 from '../foundation/math/Vector3';
import CameraComponent from '../foundation/components/CameraComponent';
import ComponentRepository from '../foundation/core/ComponentRepository';
import {WellKnownComponentTIDs} from '../foundation/components/WellKnownComponentTIDs';
import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import {ComponentTID, EntityUID, ComponentSID, Second} from '../types/CommonTypes';
import Config from '../foundation/core/Config';
import MutableMatrix44 from '../foundation/math/MutableMatrix44';
import {Is} from '../foundation/misc/Is';

declare let effekseer: any;

export default class EffekseerComponent extends Component {
  private __effect?: any;
  private __handle?: any;
  private __speed = 1;
  private __timer?: unknown;
  public uri?: string;
  public playJustAfterLoaded = false;
  public isLoop = false;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __transformComponent?: TransformComponent;
  private static __isInitialized = false;
  private static __tmp_identityMatrix_0: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmp_identityMatrix_1: MutableMatrix44 = MutableMatrix44.identity();

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
    this.__handle = effekseer.play(this.__effect);
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

  set translate(vec: Vector3) {
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

  static common_$load() {
    if (EffekseerComponent.__isInitialized) {
      return;
    }

    const webGLResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    const glw = webGLResourceRepository.currentWebGLContextWrapper;

    if (glw) {
      effekseer.init(glw.getRawContext());
      EffekseerComponent.__isInitialized = true;
    }
  }

  $load() {
    if (this.__effect == null) {
      this.__effect = effekseer.loadEffect(this.uri, () => {
        if (this.playJustAfterLoaded) {
          if (this.isLoop) {
            this.__timer = setInterval(() => {
              this.play();
            }, 500);
          } else {
            this.play();
          }
        }
      });
    }
    this.moveStageTo(ProcessStage.Logic);
  }

  static common_$logic() {
    effekseer.update();
  }

  $logic() {
    if (this.__handle != null) {
      const worldMatrix = EffekseerComponent.__tmp_identityMatrix_0.copyComponents(
        this.__sceneGraphComponent!.worldMatrixInner
        );
      this.__handle.setMatrix(worldMatrix._v);
      this.__handle.setSpeed(this.__speed);
    }

    if (this.isLoop) {
      if (!this.isPlay()) {
        this.play();
      }
    }
  }

  static common_$render() {
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

    effekseer.setProjectionMatrix(projectionMatrix._v);
    effekseer.setCameraMatrix(viewMatrix._v);
    effekseer.draw();
  }
}
ComponentRepository.registerComponentClass(EffekseerComponent);
