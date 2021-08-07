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
import {
  ComponentTID,
  EntityUID,
  ComponentSID,
  Second,
} from '../types/CommonTypes';
import Config from '../foundation/core/Config';
import MutableMatrix44 from '../foundation/math/MutableMatrix44';
import {Is} from '../foundation/misc/Is';

declare let effekseer: any;

export default class EffekseerComponent extends Component {
  private __effect?: any;
  private __context: any;
  private __handle?: any;
  private __speed = 1;
  private __timer?: unknown;
  public uri?: string;
  public playJustAfterLoaded = false;
  public isLoop = false;
  public isPause = false;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __transformComponent?: TransformComponent;
  private static __isInitialized = false;
  private static __tmp_identityMatrix_0: MutableMatrix44 =
    MutableMatrix44.identity();
  private static __tmp_identityMatrix_1: MutableMatrix44 =
    MutableMatrix44.identity();

  private isLoadefect = false;

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
    this.__handle = this.__context.play(this.__effect);
  }

  stop() {
    this.__handle?.stop();
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

  setTime(second: Second) {
    this.stop();
    this.play();

    let time = 0;
    const oneTime = 0.0166;
    for (let i = 0; time <= second; i++) {
      const advTime = time + oneTime - second;
      const addTime = advTime > 0 ? oneTime - advTime : oneTime;
      time += addTime;
      this.__context.update(addTime / oneTime);
    }
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

  $load() {
    if (EffekseerComponent.__isInitialized) {
      return;
    }
    const useWASM = true;
    if (useWASM) {
      effekseer.initRuntime('./effekseer.wasm', () => {
        if (Is.not.exist(this.__context) && Is.not.exist(this.__effect)) {
          this.__context = effekseer.createContext();
          const webGLResourceRepository =
            CGAPIResourceRepository.getWebGLResourceRepository();
          const glw = webGLResourceRepository.currentWebGLContextWrapper;
          EffekseerComponent.__isInitialized = true;
          this.__context.init(glw!.getRawContext());

          console.log('TO loadeffect');
          this.moveStageTo(ProcessStage.Logic);
        }
      });
    } else {
      if (Is.not.exist(this.__context) && Is.not.exist(this.__effect)) {
        this.__context = effekseer.createContext();
        const webGLResourceRepository =
          CGAPIResourceRepository.getWebGLResourceRepository();
        const glw = webGLResourceRepository.currentWebGLContextWrapper;
        EffekseerComponent.__isInitialized = true;
        this.__context.init(glw!.getRawContext());
        this.__effect = this.__context.loadEffect(this.uri, 1.0, () => {
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
  }

  $loadeffect() {
    console.log('loadeffect');
    this.__effect = this.__context.loadEffect(this.uri, 1.0, () => {
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
    this.moveStageTo(ProcessStage.Logic);
  }

  $logic() {
    console.log('logic');

    if (!this.isLoadefect) {
      this.__effect = this.__context.loadEffect(this.uri, 1.0, () => {
        if (this.playJustAfterLoaded) {
          if (this.isLoop) {
            this.__timer = setInterval(() => {
              this.play();
            }, 500);
          } else {
            this.play();
          }
        }
        this.isLoadefect = true;

        if (!this.isPause) {
          this.__context.update();
        }

        if (this.__handle != null) {
          const worldMatrix =
            EffekseerComponent.__tmp_identityMatrix_0.copyComponents(
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

        this.moveStageTo(ProcessStage.Render);
      });

      console.log('return');
      return;
    }

    if (!this.isPause) {
      this.__context.update();
    }

    if (this.__handle != null) {
      const worldMatrix =
        EffekseerComponent.__tmp_identityMatrix_0.copyComponents(
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
