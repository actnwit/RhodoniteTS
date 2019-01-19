import ComponentRepository from '../core/ComponentRepository';
import Component from '../core/Component';
import Primitive from '../geometry/Primitive';
import EntityRepository from '../core/EntityRepository';
import { WellKnownComponentTIDs } from './WellKnownComponentTIDs';
import Vector3 from '../math/Vector3';
import Vector4 from '../math/Vector4';
import { CameraTypeEnum, CameraType } from '../definitions/CameraType';
import Matrix44 from '../math/Matrix44';
import { WebGLStrategy } from '../../webgl/main';
import SceneGraphComponent from './SceneGraphComponent';
import RowMajarMatrix44 from '../math/RowMajarMatrix44';
import MutableRowMajarMatrix44 from '../math/MutableRowMajarMatrix44';

export default class CameraComponent extends Component {
  private _direction: Vector3 = Vector3.dummy();
  private _up: Vector3 = Vector3.dummy();
  private _corner: Vector4 = Vector4.dummy();

  // x: zNear, y: zFar,
  // if perspective, z: fovy, w: aspect
  // if ortho, z: xmag, w: ymag
  private _parameters: Vector4 = Vector4.dummy();
  public type?: CameraTypeEnum;
  private __sceneGraphComponent?: SceneGraphComponent;

  private _projectionMatrix: MutableRowMajarMatrix44 = MutableRowMajarMatrix44.dummy();
  private _viewMatrix: MutableRowMajarMatrix44 = MutableRowMajarMatrix44.dummy();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository) {
    super(entityUid, componentSid, entityComponent);
  }

  set up(vec: Vector3) {
    this._up.copyComponents(vec);
  }

  get up() {
    return this._up.clone();
  }

  get upInner() {
    return this._up.clone();
  }

  set direction(vec: Vector3) {
    this._direction.copyComponents(vec);
  }

  get direction() {
    return this._direction.clone();
  }

  get directionInner() {
    return this._direction;
  }

  set corner(vec: Vector4) {
    this._corner.copyComponents(vec);
  }

  get corner() {
    return this._corner.clone();
  }

  get cornerInner() {
    return this._corner;
  }

  set parameters(vec: Vector4) {
    this._parameters.copyComponents(vec);
  }

  get parameters() {
    return this._parameters.clone();
  }

  get parametersInner() {
    return this._parameters;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraComponentTID;
  }

  get projectionMatrix() {
    const zNear = this._parameters.x;
    const zFar = this._parameters.y;

    if (this.type === CameraType.Perspective) {
      const fovy = this._parameters.z;
      const aspect = this._parameters.w;
      var yscale = 1.0 / Math.tan((0.5 * fovy * Math.PI) / 180);
      var xscale = yscale / aspect;
      this._projectionMatrix.setComponents(
        xscale, 0, 0, 0,
        0, yscale, 0, 0,
        0, 0,  -(zFar + zNear) / (zFar - zNear), -(2.0 * zFar * zNear) / (zFar - zNear),
        0, 0, -1, 0);
    } else if (this.type === CameraType.Orthographic) {
      const xmag = this._parameters.z;
      const ymag = this._parameters.w;
      this._projectionMatrix.setComponents(
        1/xmag, 0.0, 0.0, 0,
        0.0, 1/ymag, 0.0, 0,
        0.0, 0.0, -2/(zFar-zNear), -(zFar+zNear)/(zFar-zNear),
        0.0, 0.0, 0.0, 1.0
      );
    } else {
      const left = this._corner.x;
      const right = this._corner.y;
      const top = this._corner.z;
      const bottom = this._corner.w;
      this._projectionMatrix.setComponents(
        2*zNear/(right-left), 0.0, (right+left)/(right-left), 0.0,
        0.0, 2*zNear/(top-bottom), (top+bottom)/(top-bottom), 0.0,
        0.0, 0.0, - (zFar+zNear)/(zFar-zNear), -1*2*zFar*zNear/(zFar-zNear),
        0.0, 0.0, -1.0, 0.0
      );
    }

    return new Matrix44(null);
  }

  get viewMatrix() {
    return new Matrix44(null);
  }

  $create({strategy}: {
    strategy: WebGLStrategy
  }) {
    if (this.__sceneGraphComponent != null) {
      return;
    }

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent.componentTID) as SceneGraphComponent;
  }

}
ComponentRepository.registerComponentClass(CameraComponent.componentTID, CameraComponent);
