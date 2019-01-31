import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import SceneGraphComponent from "./SceneGraphComponent";
import { ProcessStage } from "../definitions/ProcessStage";
import Matrix44 from "../math/Matrix44";
import TransformComponent from "./TransformComponent";
import Vector3 from "../math/Vector3";
import CameraComponent from "./CameraComponent";
import ComponentRepository from "../core/ComponentRepository";
import WebGLResourceRepository from "../../webgl/WebGLResourceRepository";

declare var effekseer:any;

export default class EffekseerComponent extends Component {
  private __effect?: any;
  private __handle?: any;
  private __speed = 1;
  private __timer?: any;
  public uri?: string;
  public playJustAfterLoaded = false;
  public isLoop = false;
  private __sceneGraphComponent?: SceneGraphComponent;
  private __transformComponent?: TransformComponent;
  private static __isInitialized = false;
  private static __tmp_indentityMatrix: Matrix44 = Matrix44.identity();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

  }

  $create() {
    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
    this.__transformComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, TransformComponent) as TransformComponent;
    this.moveStageTo(ProcessStage.Load);
  }

  static common_$load() {
    if (EffekseerComponent.__isInitialized) {
      return;
    }

    const glw = WebGLResourceRepository.getInstance().currentWebGLContextWrapper;

    if (glw) {
      effekseer.init(glw.getRawContext());
      EffekseerComponent.__isInitialized = true;
    }
  }

  $load() {
    if (this.__effect == null) {
      this.__effect = effekseer.loadEffect(this.uri, ()=>{
        if (this.playJustAfterLoaded) {
          if (this.isLoop) {
            this.__timer = setInterval(()=>{ this.play(); }, 500);
          } else {
            this.play();
          }
        }
      });
    }
    this.moveStageTo(ProcessStage.PreRender);
  }

  cancelLoop() {
    clearInterval(this.__timer);
  }

  play() {
    const __play = ()=>{
      // Play the loaded effect
      this.__handle = effekseer.play(this.__effect);
    };

    if (this.isLoop) {
      this.__timer = setInterval(__play, 200);
    } else {
      __play();
    }

  }

  static common_$logic() {
    effekseer.update();
  }

  $prerender() {
    if (this.__handle != null) {
      const worldMatrix = new Matrix44(this.__sceneGraphComponent!.worldMatrixInner);
      this.__handle.setMatrix(worldMatrix.v);
      this.__handle.setSpeed(this.__speed);
    }
  }

  static common_$render() {
    const cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    let viewMatrix = EffekseerComponent.__tmp_indentityMatrix;
    let projectionMatrix = EffekseerComponent.__tmp_indentityMatrix;
    if (cameraComponent) {
      viewMatrix = cameraComponent.viewMatrix;
      projectionMatrix = cameraComponent.projectionMatrix;
    }
    effekseer.setProjectionMatrix(projectionMatrix.v);
    effekseer.setCameraMatrix(viewMatrix.v);
    effekseer.draw();
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
}
ComponentRepository.registerComponentClass(EffekseerComponent);