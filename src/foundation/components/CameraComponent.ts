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
import { BufferUse } from '../definitions/BufferUse';
import { ComponentType } from '../definitions/ComponentType';
import MutableMatrix44 from '../math/MutableMatrix44';
import { ProcessStage } from '../definitions/ProcessStage';
import MutableVector4 from '../math/MutableVector4';
import MutableVector3 from '../math/MutableVector3';
import Frustum from '../geometry/Frustum';
import Config from '../core/Config';
import { ComponentTID, ComponentSID, EntityUID } from '../../types/CommonTypes';
import GlobalDataRepository from '../core/GlobalDataRepository';
import { ShaderSemantics } from '../definitions/ShaderSemantics';
import { MathUtil } from '../math/MathUtil';
import CameraControllerComponent from './CameraControllerComponent';

export default class CameraComponent extends Component {
  private readonly _eye: Vector3 = Vector3.zero();
  private _eyeInner: Vector3 = Vector3.dummy();
  private _direction: Vector3 = Vector3.dummy();
  private _directionInner: Vector3 = Vector3.dummy();
  private _up: Vector3 = Vector3.dummy();
  private _upInner: Vector3 = Vector3.dummy();
  private _filmWidth = 36; // mili meter
  private _filmHeight = 24; // mili meter
  private _focalLength = 20;

  // x: left, y:right, z:top, w: bottom
  private _corner: MutableVector4 = MutableVector4.dummy();
  private _cornerInner: MutableVector4 = MutableVector4.dummy();

  // x: zNear, y: zFar,
  // if perspective, z: fovy, w: aspect
  // if ortho, z: xmag, w: ymag
  private _parameters: MutableVector4 = MutableVector4.dummy();
  private _parametersInner: MutableVector4 = MutableVector4.dummy();
  private __type: CameraTypeEnum = CameraType.Perspective;
  private __sceneGraphComponent?: SceneGraphComponent;

  private _projectionMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private __isProjectionMatrixUpToDate = false;
  private _viewMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private __isViewMatrixUpToDate = false;

  private _tmp_f: Vector3 = Vector3.dummy();
  private _tmp_s: Vector3 = Vector3.dummy();
  private _tmp_u: Vector3 = Vector3.dummy();
  private static __main: ComponentSID = -1;
  private static invertedMatrix44 = new MutableMatrix44([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  private static returnVector3 = MutableVector3.zero();
  private static __globalDataRepository = GlobalDataRepository.getInstance();

  private __frustum = new Frustum();

  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);

    this.maxNumberOfComponent = Math.max(10, Math.floor(Config.maxEntityNumber/100));

    this.registerMember(BufferUse.CPUGeneric, 'eyeInner', Vector3, ComponentType.Float, [0, 0, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'direction', Vector3, ComponentType.Float, [0, 0, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'up', Vector3, ComponentType.Float, [0, 1, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'directionInner', Vector3, ComponentType.Float, [0, 0, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'upInner', Vector3, ComponentType.Float, [0, 1, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'corner', MutableVector4, ComponentType.Float, [-1, 1, 1, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'cornerInner', MutableVector4, ComponentType.Float, [-1, 1, 1, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'parameters', MutableVector4, ComponentType.Float, [0.1, 10000, 90, 1]);
    this.registerMember(BufferUse.CPUGeneric, 'parametersInner', MutableVector4, ComponentType.Float, [0.1, 10000, 90, 1]);

    this.registerMember(BufferUse.CPUGeneric, 'projectionMatrix', MutableMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.registerMember(BufferUse.CPUGeneric, 'viewMatrix', MutableMatrix44, ComponentType.Float, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this.registerMember(BufferUse.CPUGeneric, 'tmp_f', Vector3, ComponentType.Float, [0, 0, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'tmp_s', Vector3, ComponentType.Float, [0, 0, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'tmp_u', Vector3, ComponentType.Float, [0, 0, 0]);

    this.submitToAllocation(Config.maxCameraNumber);

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;

    this.moveStageTo(ProcessStage.PreRender);

    const globalDataRepository = GlobalDataRepository.getInstance();
    globalDataRepository.takeOne(ShaderSemantics.ViewMatrix);
    globalDataRepository.takeOne(ShaderSemantics.ProjectionMatrix);
    globalDataRepository.takeOne(ShaderSemantics.ViewPosition);

    this.setFovyAndChangeFocalLength(90);
    CameraComponent.main = componentSid;
  }


  static set main(componentSID: ComponentSID) {
    this.__main = componentSID;
  }

  static get main() {
    return this.__main;
  }

  set type(type: CameraTypeEnum) {
    this.__type = type;
    if (type === CameraType.Orthographic) {
      this._parameters.z = 1;
      this._parameters.w = 1;
      this._parametersInner.z = 1;
      this._parametersInner.w = 1;
    } else {
      this.setFovyAndChangeFocalLength(90);
      this._parameters.w = 1;
      this._parametersInner.z = 90;
      this._parametersInner.w = 1;
    }
  }

  get type() {
    return this.__type;
  }

  get eye() {
    return Vector3.zero();
  }

  get eyeInner() {
    return this._eyeInner;
  }

  set eyeInner(vec: Vector3) {
    this._eyeInner = vec;
  }

  set upInner(vec: Vector3) {
    this._upInner.copyComponents(vec);
  }

  set up(vec: Vector3) {
    this._up.copyComponents(vec);
  }

  get up() {
    return this._up.clone();
  }

  get upInner() {
    return this._upInner;
  }

  set direction(vec: Vector3) {
    const oldDirection = this._direction;
    const newDirection = vec;
    const oldUp = this._up;

    let newUpNonNomalize;
    if (Vector3.cross(newDirection, oldUp).isEqual(Vector3.zero())) {
      const relativeXaxis = Vector3.cross(oldDirection, oldUp);
      newUpNonNomalize = Vector3.cross(relativeXaxis, newDirection);
    } else {
      const newDirectionComponentInOldUp = Vector3.multiply(newDirection, newDirection.dotProduct(oldUp));
      newUpNonNomalize = Vector3.subtract(oldUp, newDirectionComponentInOldUp);
    }

    this._up = Vector3.normalize(newUpNonNomalize);
    this._direction.copyComponents(newDirection);
  }

  set directionInner(vec: Vector3) {
    this._directionInner.copyComponents(vec);
  }

  get direction() {
    return this._direction.clone();
  }

  get directionInner() {
    return this._directionInner;
  }

  set corner(vec: Vector4) {
    this._corner.copyComponents(vec);
  }

  get corner(): Vector4 {
    return this._corner.clone();
  }

  set left(value: number) {
    this._corner.x = value;
  }

  set leftInner(value: number) {
    this._cornerInner.x = value;
  }

  get left() {
    return this._corner.x;
  }

  set right(value: number) {
    this._corner.y = value;
  }

  set rightInner(value: number) {
    this._cornerInner.y = value;
  }

  get right() {
    return this._corner.y;
  }

  set top(value: number) {
    this._corner.z = value;
  }

  set topInner(value: number) {
    this._cornerInner.z = value;
  }

  get top() {
    return this._corner.z;
  }

  set bottom(value: number) {
    this._corner.w = value;
  }

  set bottomInner(value: number) {
    this._cornerInner.w = value;
  }

  get bottom() {
    return this._corner.w;
  }

  set cornerInner(vec: Vector4) {
    this._corner = new MutableVector4(vec);
  }

  get cornerInner() {
    return this._corner;
  }

  // set parameters(vec: Vector4) {
  //   this._parameters.copyComponents(vec);
  // }

  set parametersInner(vec: Vector4) {
    this._parametersInner.copyComponents(vec);
  }

  get parameters(): Vector4 {
    return this._parameters.clone();
  }

  set zNear(val: number) {
    this._parameters.x = val;
  }

  set zNearInner(val: number) {
    this._parametersInner.x = val;
  }

  get zNearInner() {
    return this._parametersInner.x;
  }

  get zNear() {
    return this._parameters.x;
  }

  set focalLength(val: number) {
    this._focalLength = val;
    this._parameters.z = 2 * MathUtil.radianToDegree(Math.atan(this._filmHeight/(val * 2)));
  }
  get focalLength() {
    return this._focalLength;
  }

  set zFar(val: number) {
    this._parameters.y = val;
  }

  set zFarInner(val: number) {
    this._parametersInner.y = val;
  }

  get zFarInner() {
    return this._parametersInner.y;
  }

  get zFar() {
    return this._parameters.y;
  }

  setFovyAndChangeFilmSize(degree: number) {
    this._parameters.z = degree;
    this._filmHeight = 2 * this.focalLength * Math.tan(MathUtil.degreeToRadian(degree) / 2);
    this._filmWidth = this._filmHeight * this.aspect;
  }

  setFovyAndChangeFocalLength(degree: number) {
    this._parameters.z = degree;
    this._focalLength = this._filmHeight / 2 / Math.tan(MathUtil.degreeToRadian(degree) / 2);
  }

  get fovy() {
    return this._parameters.z;
  }

  set fovyInner(val: number) {
    this._parametersInner.z = val;
  }

  set aspect(val: number) {
    this._parameters.w = val;
    this._filmWidth = this._filmHeight * val;
  }

  get aspect() {
    return this._parameters.w;
  }

  set xMag(val: number) {
    this._parameters.z = val;
  }

  get xMag() {
    return this._parameters.z;
  }

  set yMag(val: number) {
    this._parameters.w = val;
  }

  get yMag() {
    return this._parameters.w;
  }

  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraComponentTID;
  }

  $logic() {
    const cameraControllerComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, CameraControllerComponent) as CameraControllerComponent;
    if (cameraControllerComponent == null) {
      this.eyeInner = this.eye;
      this.directionInner = this.direction;
      this.upInner = this.up;
      this.cornerInner = this.corner;
      this.parametersInner = this.parameters;
    } else {
      this._parametersInner.w = this.parameters.w;
    }

    this.moveStageTo(ProcessStage.PreRender);
  }

  calcProjectionMatrix() {
    const zNear = this._parametersInner.x;
    const zFar = this._parametersInner.y;

    if (this.type === CameraType.Perspective) {
      const fovy = this._parametersInner.z;
      const aspect = this._parametersInner.w;
      var yscale = 1.0 / Math.tan((0.5 * fovy * Math.PI) / 180);
      var xscale = yscale / aspect;
      this._projectionMatrix.setComponents(
        xscale, 0, 0, 0,
        0, yscale, 0, 0,
        0, 0, -(zFar + zNear) / (zFar - zNear), -(2.0 * zFar * zNear) / (zFar - zNear),
        0, 0, -1, 0);
    } else if (this.type === CameraType.Orthographic) {
      const xmag = this._parametersInner.z;
      const ymag = this._parametersInner.w;
      this._projectionMatrix.setComponents(
        1 / xmag, 0.0, 0.0, 0,
        0.0, 1 / ymag, 0.0, 0,
        0.0, 0.0, -2 / (zFar - zNear), -(zFar + zNear) / (zFar - zNear),
        0.0, 0.0, 0.0, 1.0
      );
    } else {
      const left = this._cornerInner.x;
      const right = this._cornerInner.y;
      const top = this._cornerInner.z;
      const bottom = this._cornerInner.w;
      this._projectionMatrix.setComponents(
        2 * zNear / (right - left), 0.0, (right + left) / (right - left), 0.0,
        0.0, 2 * zNear / (top - bottom), (top + bottom) / (top - bottom), 0.0,
        0.0, 0.0, - (zFar + zNear) / (zFar - zNear), -1 * 2 * zFar * zNear / (zFar - zNear),
        0.0, 0.0, -1.0, 0.0
      );
    }

    return this._projectionMatrix;
  }

  get projectionMatrix() {
    return this._projectionMatrix;
  }

  calcViewMatrix() {
    const eye = this.eyeInner;
    const f = Vector3.normalize(Vector3.subtract(this._directionInner, eye));
    const s = Vector3.normalize(Vector3.cross(f, this._upInner));
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

    Matrix44.invertTo(this.__sceneGraphComponent!.worldMatrixInner, CameraComponent.invertedMatrix44);
    const invertWorldMatrix = CameraComponent.invertedMatrix44;
    this._viewMatrix.multiply(invertWorldMatrix);

    return this._viewMatrix;
  }

  get viewMatrix() {
    return this._viewMatrix;
  }

  get viewProjectionMatrix() {
    return Matrix44.multiply(this._projectionMatrix, this._viewMatrix);
  }

  $create({ strategy }: {
    strategy: WebGLStrategy
  }) {
    if (this.__sceneGraphComponent != null) {
      return;
    }

    this.__sceneGraphComponent = this.__entityRepository.getComponentOfEntity(this.__entityUid, SceneGraphComponent) as SceneGraphComponent;

    this.moveStageTo(ProcessStage.Logic);
  }

  $prerender() {
    this.calcProjectionMatrix();
    this.calcViewMatrix();

    this.moveStageTo(ProcessStage.Logic);
  }

  setValuesToGlobalDataRepository() {
    CameraComponent.__globalDataRepository.setValue(ShaderSemantics.ViewMatrix, this.componentSID, this.viewMatrix);
    CameraComponent.__globalDataRepository.setValue(ShaderSemantics.ProjectionMatrix, this.componentSID, this.projectionMatrix);
    CameraComponent.__globalDataRepository.setValue(ShaderSemantics.ViewPosition, this.componentSID, this.worldPosition);
  }

  get worldPosition(): Vector3 {
    this.__sceneGraphComponent!.worldMatrixInner.multiplyVector3To(this.eyeInner, CameraComponent.returnVector3 as MutableVector3);
    return CameraComponent.returnVector3 as Vector3;
  }

  updateFrustum() {
    this.__frustum.update(this.viewMatrix, this.projectionMatrix);
  }

  get frustum() {
    return this.__frustum;
  }
}
ComponentRepository.registerComponentClass(CameraComponent);
