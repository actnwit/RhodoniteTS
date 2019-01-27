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
import { BufferUse } from '../definitions/BufferUse';
import { ComponentType } from '../definitions/ComponentType';
import MutableMatrix44 from '../math/MutableMatrix44';
import { ProcessStage } from '../definitions/ProcessStage';
import MutableVector4 from '../math/MutableVector4';

export default class CameraComponent extends Component {
  private _direction: Vector3 = Vector3.dummy();
  private _up: Vector3 = Vector3.dummy();

  // x: left, y:right, z:top, w: bottom
  private _corner: Vector4 = Vector4.dummy();

  // x: zNear, y: zFar,
  // if perspective, z: fovy, w: aspect
  // if ortho, z: xmag, w: ymag
  private _parameters: MutableVector4 = MutableVector4.dummy();
  public type: CameraTypeEnum = CameraType.Perspective;
  private __sceneGraphComponent?: SceneGraphComponent;

  private _projectionMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private _viewMatrix: MutableMatrix44 = MutableMatrix44.dummy();

  private _tmp_f: Vector3 = Vector3.dummy();
  private _tmp_s: Vector3 = Vector3.dummy();
  private _tmp_u: Vector3 = Vector3.dummy();
  public static main: ComponentSID = -1;

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.registerMember(BufferUse.CPUGeneric, 'direction', Vector3, ComponentType.Float, [0, 0, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'up', Vector3, ComponentType.Float, [0, 1, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'corner', Vector4, ComponentType.Float, [-1, 1, 1, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'parameters', MutableVector4, ComponentType.Float, [0.1, 10000, 90, 1]);

    this.registerMember(BufferUse.CPUGeneric, 'projectionMatrix', MutableMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.registerMember(BufferUse.CPUGeneric, 'viewMatrix', MutableMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this.registerMember(BufferUse.CPUGeneric, 'tmp_f', Vector3, ComponentType.Float, [0, 0, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'tmp_s', Vector3, ComponentType.Float, [0, 0, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'tmp_u', Vector3, ComponentType.Float, [0, 0, 0]);

    this.submitToAllocation(20);

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;

    this.moveStageTo(ProcessStage.PreRender);

    CameraComponent.main = componentSid;
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

  set zNear(val: number) {
    this._parameters.x = val;
  }

  get zNear() {
    return this._parameters.x;
  }

  set zFar(val: number) {
    this._parameters.y = val;
  }

  get zFar() {
    return this._parameters.y;
  }

  set fovy(val: number) {
    this._parameters.z = val;
  }

  get fovy() {
    return this._parameters.z;
  }

  set aspect(val: number) {
    this._parameters.w = val;
  }

  get aspect() {
    return this._parameters.w;
  }

  set xmag(val: number) {
    this._parameters.z = val;
  }

  get xmag() {
    return this._parameters.z;
  }

  set ymag(val: number) {
    this._parameters.w = val;
  }

  get ymag() {
    return this._parameters.w;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraComponentTID;
  }

  calcProjectionMatrix() {
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

    return this._projectionMatrix;
  }

  get projectionMatrix() {
    return this._projectionMatrix;
  }

  calcViewMatrix() {
    const eye = Vector3.zero();
    const f = Vector3.normalize(Vector3.subtract(this._direction, eye));
    const s = Vector3.normalize(Vector3.cross(f, this._up));
    const u = Vector3.cross(s, f);

    this._viewMatrix.setComponents(
      s.x,
      s.y,
      s.z,
      -Vector3.dotProduct(s, eye),
      u.x,
      u.y,
      u.z,
      -Vector3.dotProduct(u, eye),
      -f.x,
      -f.y,
      -f.z,
      Vector3.dotProduct(f, eye),
      0,
      0,
      0,
      1);

    const invertWorldMatrix = RowMajarMatrix44.invert(this.__sceneGraphComponent!.worldMatrix);
    this._viewMatrix.multiply(invertWorldMatrix);

    return this._viewMatrix;
  }

  get viewMatrix() {
    return this._viewMatrix;
  }

  $create({strategy}: {
    strategy: WebGLStrategy
  }) {
    if (this.__sceneGraphComponent != null) {
      return;
    }

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;
  }

  $prerender() {
    this.calcProjectionMatrix();
    this.calcViewMatrix();
  }
}
ComponentRepository.registerComponentClass(CameraComponent);
