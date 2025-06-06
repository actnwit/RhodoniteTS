import { ComponentRepository } from '../../core/ComponentRepository';
import { Component } from '../../core/Component';
import { applyMixins, EntityRepository } from '../../core/EntityRepository';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { CameraTypeEnum, CameraType } from '../../definitions/CameraType';
import { Matrix44 } from '../../math/Matrix44';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { ProcessStage } from '../../definitions/ProcessStage';
import { MutableVector4 } from '../../math/MutableVector4';
import { MutableVector3 } from '../../math/MutableVector3';
import { Frustum } from '../../geometry/Frustum';
import { Config } from '../../core/Config';
import { ComponentTID, ComponentSID, EntityUID } from '../../../types/CommonTypes';
import { GlobalDataRepository } from '../../core/GlobalDataRepository';
import { ShaderSemantics } from '../../definitions/ShaderSemantics';
import { MathUtil } from '../../math/MathUtil';
import { ModuleManager } from '../../system/ModuleManager';
import { RnXR } from '../../../xr/main';
import { RenderPass } from '../../renderer/RenderPass';
import { ICameraEntity } from '../../helpers/EntityHelper';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
import { Is } from '../../misc/Is';
import { LightType } from '../../definitions/LightType';
import { SystemState } from '../../system/SystemState';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { TransformComponent } from '../Transform/TransformComponent';
import { CameraControllerComponent } from '../CameraController/CameraControllerComponent';
import { createGroupEntity } from '../SceneGraph/createGroupEntity';

/**
 * The Component that represents a camera.
 *
 * @remarks
 * The camera is defined such that the local +X axis is to the right,
 * the "lens" looks towards the local -Z axis,
 * and the top of the camera is aligned with the local +Y axis.
 */
export class CameraComponent extends Component {
  private static readonly _eye: Vector3 = Vector3.zero();
  private _eyeInner: MutableVector3 = MutableVector3.dummy();
  private _direction: MutableVector3 = MutableVector3.dummy();
  private _directionInner: MutableVector3 = MutableVector3.dummy();
  private _up: MutableVector3 = MutableVector3.dummy();
  private _upInner: MutableVector3 = MutableVector3.dummy();
  private _filmWidth = 36; // mili meter
  private _filmHeight = 24; // mili meter
  private _focalLength = 20;
  private primitiveMode = false;
  // x: left, y:right, z:top, w: bottom
  private _corner: MutableVector4 = MutableVector4.dummy();
  private _cornerInner: MutableVector4 = MutableVector4.dummy();

  // x: zNear, y: zFar,
  // if perspective, z: fovy, w: aspect
  // if ortho, z: xmag, w: ymag
  private _parameters: MutableVector4 = MutableVector4.dummy();
  private _parametersInner: MutableVector4 = MutableVector4.dummy();
  private __type: CameraTypeEnum = CameraType.Perspective;

  private _projectionMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private __isProjectionMatrixUpToDate = false;
  private _viewMatrix: MutableMatrix44 = MutableMatrix44.dummy();
  private __isViewMatrixUpToDate = false;

  private static __current: ComponentSID = -1;
  private static returnVector3 = MutableVector3.zero();
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __tmpVector3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_2: MutableVector3 = MutableVector3.zero();
  private static __tmpMatrix44_0 = MutableMatrix44.zero();
  private static __tmpMatrix44_1 = MutableMatrix44.zero();
  private static __biasMatrixWebGL = Matrix44.fromCopy16ColumnMajor(
    0.5,
    0.0,
    0.0,
    0.0,
    0.0,
    0.5,
    0.0,
    0.0,
    0.0,
    0.0,
    0.5,
    0.0,
    0.5,
    0.5,
    0.5,
    1.0
  );
  private static __biasMatrixWebGPU = Matrix44.fromCopy16ColumnMajor(
    0.5,
    0.0,
    0.0,
    0.0,
    0.0,
    -0.5,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    0.0,
    0.5,
    0.5,
    0.0,
    1.0
  );
  _xrLeft = false;
  _xrRight = false;
  public isSyncToLight = false;

  private __frustum = new Frustum();

  private __updateCount = 0;
  private __lastUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastLightComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;

  /**
   * Creates a new CameraComponent instance.
   *
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component system identifier
   * @param entityRepository - The entity repository instance
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean) {
    super(entityUid, componentSid, entityRepository, isReUse);

    this._setMaxNumberOfComponent(Math.max(10, Math.floor(Config.maxEntityNumber / 100)));

    this.setFovyAndChangeFocalLength(90);

    if (CameraComponent.current === -1) {
      CameraComponent.current = componentSid;
    }

    this.registerMember(BufferUse.CPUGeneric, 'eyeInner', MutableVector3, ComponentType.Float, [0, 0, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'direction', MutableVector3, ComponentType.Float, [0, 0, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'up', MutableVector3, ComponentType.Float, [0, 1, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'directionInner', MutableVector3, ComponentType.Float, [0, 0, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'upInner', MutableVector3, ComponentType.Float, [0, 1, 0]);
    this.registerMember(BufferUse.CPUGeneric, 'corner', MutableVector4, ComponentType.Float, [-1, 1, 1, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'cornerInner', MutableVector4, ComponentType.Float, [-1, 1, 1, -1]);
    this.registerMember(BufferUse.CPUGeneric, 'parameters', MutableVector4, ComponentType.Float, [0.1, 10000, 90, 1]);
    this.registerMember(
      BufferUse.CPUGeneric,
      'parametersInner',
      MutableVector4,
      ComponentType.Float,
      [0.1, 10000, 90, 1]
    );

    this.registerMember(
      BufferUse.CPUGeneric,
      'projectionMatrix',
      MutableMatrix44,
      ComponentType.Float,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );
    this.registerMember(
      BufferUse.CPUGeneric,
      'viewMatrix',
      MutableMatrix44,
      ComponentType.Float,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    );

    this.submitToAllocation(Config.maxCameraNumber, isReUse);

    if (isReUse) {
      return;
    }

    const globalDataRepository = GlobalDataRepository.getInstance();
    globalDataRepository.takeOne('viewMatrix');
    globalDataRepository.takeOne('projectionMatrix');
    globalDataRepository.takeOne('viewPosition');
  }

  /**
   * Sets the current active camera component.
   *
   * @param componentSID - The component system identifier of the camera to set as current
   */
  static set current(componentSID: ComponentSID) {
    this.__current = componentSID;
  }

  /**
   * Gets the current active camera component ID.
   *
   * @returns The component system identifier of the current active camera
   */
  static get current() {
    return this.__current;
  }

  /**
   * Gets the update count for this camera component.
   *
   * @returns The number of times this camera has been updated
   */
  get updateCount() {
    return this.__updateCount;
  }

  /**
   * Gets the update count of the current active camera.
   *
   * @returns The update count of the current camera, or 0 if no camera is active
   */
  static get currentCameraUpdateCount() {
    const currentCameraComponent = ComponentRepository.getComponent(
      CameraComponent,
      CameraComponent.current
    ) as CameraComponent;
    return currentCameraComponent?.updateCount ?? 0;
  }

  /**
   * Sets the camera type (perspective, orthographic, or frustum).
   *
   * @param type - The camera type to set
   */
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

    this.__updateCount++;
  }

  /**
   * Gets the camera type.
   *
   * @returns The current camera type
   */
  get type() {
    return this.__type;
  }

  /**
   * Gets the camera eye position (always (0,0,0) in Rhodonite).
   *
   * @returns The eye position vector (always zero)
   */
  get eye() {
    // In Rhodonite, eye is always (0,0,0). Use TransformComponent for Camera positioning
    return CameraComponent._eye;
  }

  /**
   * Attempts to set the eye position (throws error as this is not supported).
   *
   * @param noUseVec - The vector to set (not used)
   * @throws Always throws an error as eye positioning should use TransformComponent
   */
  set eye(noUseVec: Vector3) {
    throw Error('In Rhodonite, eye is always (0,0,0). Use TransformComponent for Camera positioning.');
  }

  /**
   * Gets the internal eye position.
   *
   * @returns The internal eye position vector
   */
  get eyeInner() {
    return this._eyeInner;
  }

  /**
   * Sets the internal eye position.
   *
   * @param vec - The vector to set as the internal eye position
   * @internal
   */
  set eyeInner(vec: Vector3) {
    this._eyeInner.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Sets the internal up vector.
   *
   * @param vec - The vector to set as the internal up direction
   */
  set upInner(vec: Vector3) {
    this._upInner.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Sets the up vector of the camera.
   *
   * @param vec - The vector to set as the up direction
   */
  set up(vec: Vector3) {
    this._up.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Gets the up vector of the camera.
   *
   * @returns A copy of the up vector
   */
  get up() {
    return this._up.clone();
  }

  /**
   * Gets the internal up vector.
   *
   * @returns The internal up vector
   */
  get upInner() {
    return this._upInner;
  }

  /**
   * Sets the direction vector of the camera and automatically adjusts the up vector to remain orthogonal.
   *
   * @param vec - The new direction vector for the camera
   */
  set direction(vec: Vector3) {
    const oldDirection = this._direction;
    const newDirection = vec;
    const oldUp = this._up;

    const orthogonalVectorNewDirectionAndOldUp = MutableVector3.crossTo(
      newDirection,
      oldUp,
      CameraComponent.__tmpVector3_0
    );
    const isOrthogonalNewDirectionAndOldUp = orthogonalVectorNewDirectionAndOldUp.length() === 0.0;

    let newUpNonNormalize;
    if (isOrthogonalNewDirectionAndOldUp) {
      const relativeXaxis = MutableVector3.crossTo(oldDirection, oldUp, CameraComponent.__tmpVector3_1);
      newUpNonNormalize = MutableVector3.crossTo(relativeXaxis, newDirection, CameraComponent.__tmpVector3_2);
    } else {
      const newDirectionComponentInOldUp = MutableVector3.multiplyTo(
        newDirection,
        newDirection.dot(oldUp),
        CameraComponent.__tmpVector3_1
      );
      newUpNonNormalize = MutableVector3.subtractTo(
        oldUp,
        newDirectionComponentInOldUp,
        CameraComponent.__tmpVector3_2
      );
    }

    this._up.copyComponents(newUpNonNormalize).normalize();
    this._direction.copyComponents(newDirection);

    this.__updateCount++;
  }

  /**
   * Sets the internal direction vector.
   *
   * @param vec - The vector to set as the internal direction
   */
  set directionInner(vec: Vector3) {
    this._directionInner.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Gets the direction vector of the camera.
   *
   * @returns A copy of the direction vector
   */
  get direction() {
    return this._direction.clone();
  }

  /**
   * Gets the internal direction vector.
   *
   * @returns The internal direction vector
   */
  get directionInner() {
    return this._directionInner;
  }

  /**
   * Sets the corner parameters (left, right, top, bottom) for frustum camera.
   *
   * @param vec - The corner vector (x: left, y: right, z: top, w: bottom)
   */
  set corner(vec: Vector4) {
    this._corner.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Gets the corner parameters.
   *
   * @returns A copy of the corner vector
   */
  get corner(): Vector4 {
    return this._corner.clone();
  }

  /**
   * Sets the left clipping plane position.
   *
   * @param value - The left clipping plane position
   */
  set left(value: number) {
    this._corner.x = value;
    this.__updateCount++;
  }

  /**
   * Sets the internal left clipping plane position.
   *
   * @param value - The internal left clipping plane position
   */
  set leftInner(value: number) {
    this._cornerInner.x = value;
    this.__updateCount++;
  }

  /**
   * Gets the left clipping plane position.
   *
   * @returns The left clipping plane position
   */
  get left() {
    return this._corner.x;
  }

  /**
   * Sets the right clipping plane position.
   *
   * @param value - The right clipping plane position
   */
  set right(value: number) {
    this._corner.y = value;
    this.__updateCount++;
  }

  /**
   * Sets the internal right clipping plane position.
   *
   * @param value - The internal right clipping plane position
   */
  set rightInner(value: number) {
    this._cornerInner.y = value;
    this.__updateCount++;
  }

  /**
   * Gets the right clipping plane position.
   *
   * @returns The right clipping plane position
   */
  get right() {
    return this._corner.y;
  }

  /**
   * Sets the top clipping plane position.
   *
   * @param value - The top clipping plane position
   */
  set top(value: number) {
    this._corner.z = value;
    this.__updateCount++;
  }

  /**
   * Sets the internal top clipping plane position.
   *
   * @param value - The internal top clipping plane position
   */
  set topInner(value: number) {
    this._cornerInner.z = value;
    this.__updateCount++;
  }

  /**
   * Gets the top clipping plane position.
   *
   * @returns The top clipping plane position
   */
  get top() {
    return this._corner.z;
  }

  /**
   * Sets the bottom clipping plane position.
   *
   * @param value - The bottom clipping plane position
   */
  set bottom(value: number) {
    this._corner.w = value;
    this.__updateCount++;
  }

  /**
   * Sets the internal bottom clipping plane position.
   *
   * @param value - The internal bottom clipping plane position
   */
  set bottomInner(value: number) {
    this._cornerInner.w = value;
    this.__updateCount++;
  }

  /**
   * Gets the bottom clipping plane position.
   *
   * @returns The bottom clipping plane position
   */
  get bottom() {
    return this._corner.w;
  }

  /**
   * Sets the internal corner parameters.
   *
   * @param vec - The internal corner vector
   */
  set cornerInner(vec: Vector4) {
    this._cornerInner.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Gets the internal corner parameters.
   *
   * @returns The internal corner vector
   */
  get cornerInner() {
    return this._cornerInner;
  }

  /**
   * Sets the internal camera parameters.
   *
   * @param vec - The internal parameters vector
   */
  set parametersInner(vec: Vector4) {
    this._parametersInner.copyComponents(vec);
    this.__updateCount++;
  }

  /**
   * Gets the internal camera parameters.
   *
   * @returns The internal parameters vector
   */
  get parametersInner() {
    return this._parametersInner;
  }

  /**
   * Gets the camera parameters.
   *
   * @returns A copy of the parameters vector
   */
  get parameters(): Vector4 {
    return this._parameters.clone();
  }

  /**
   * Sets the near clipping plane distance.
   *
   * @param val - The near clipping plane distance
   */
  set zNear(val: number) {
    this._parameters.x = val;
    this.__updateCount++;
  }

  /**
   * Sets the internal near clipping plane distance.
   *
   * @param val - The internal near clipping plane distance
   */
  set zNearInner(val: number) {
    this._parametersInner.x = val;
    this.__updateCount++;
  }

  /**
   * Gets the internal near clipping plane distance.
   *
   * @returns The internal near clipping plane distance
   */
  get zNearInner() {
    return this._parametersInner.x;
  }

  /**
   * Gets the near clipping plane distance.
   *
   * @returns The near clipping plane distance
   */
  get zNear() {
    return this._parameters.x;
  }

  /**
   * Sets the focal length and automatically calculates the field of view.
   *
   * @param val - The focal length in millimeters
   */
  set focalLength(val: number) {
    this._focalLength = val;
    this._parameters.z = 2 * MathUtil.radianToDegree(Math.atan(this._filmHeight / (val * 2)));
    this.__updateCount++;
  }

  /**
   * Gets the focal length.
   *
   * @returns The focal length in millimeters
   */
  get focalLength() {
    return this._focalLength;
  }

  /**
   * Sets the internal focal length and calculates the field of view.
   *
   * @param val - The internal focal length
   */
  set focalLengthInner(val: number) {
    this._parametersInner.z = 2 * MathUtil.radianToDegree(Math.atan(this._filmHeight / (val * 2)));
    this.__updateCount++;
  }

  /**
   * Gets the internal focal length.
   *
   * @returns The internal focal length
   */
  get focalLengthInner() {
    return this._parametersInner.z;
  }

  /**
   * Sets the far clipping plane distance.
   *
   * @param val - The far clipping plane distance
   */
  set zFar(val: number) {
    this._parameters.y = val;
    this.__updateCount++;
  }

  /**
   * Sets the internal far clipping plane distance.
   *
   * @param val - The internal far clipping plane distance
   */
  set zFarInner(val: number) {
    this._parametersInner.y = val;
    this.__updateCount++;
  }

  /**
   * Gets the internal far clipping plane distance.
   *
   * @returns The internal far clipping plane distance
   */
  get zFarInner() {
    return this._parametersInner.y;
  }

  /**
   * Gets the far clipping plane distance.
   *
   * @returns The far clipping plane distance
   */
  get zFar() {
    return this._parameters.y;
  }

  /**
   * Sets the field of view and adjusts the film size accordingly.
   *
   * @param degree - The field of view in degrees
   */
  setFovyAndChangeFilmSize(degree: number) {
    this._parameters.z = degree;
    this._filmHeight = 2 * this.focalLength * Math.tan(MathUtil.degreeToRadian(degree) / 2);
    this._filmWidth = this._filmHeight * this.aspect;
    this.__updateCount++;
  }

  /**
   * Sets the field of view and adjusts the focal length accordingly.
   *
   * @param degree - The field of view in degrees
   */
  setFovyAndChangeFocalLength(degree: number) {
    this._parameters.z = degree;
    this._focalLength = this._filmHeight / 2 / Math.tan(MathUtil.degreeToRadian(degree) / 2);
    this.__updateCount++;
  }

  /**
   * Gets the field of view.
   *
   * @returns The field of view in degrees
   */
  get fovy() {
    return this._parameters.z;
  }

  /**
   * Sets the internal field of view.
   *
   * @param val - The internal field of view in degrees
   */
  set fovyInner(val: number) {
    this._parametersInner.z = val;
    this.__updateCount++;
  }

  /**
   * Sets the aspect ratio and adjusts the film width accordingly.
   *
   * @param val - The aspect ratio (width/height)
   */
  set aspect(val: number) {
    this._parameters.w = val;
    this._filmWidth = this._filmHeight * val;
    this.__updateCount++;
  }

  /**
   * Sets the internal aspect ratio.
   *
   * @param val - The internal aspect ratio
   */
  set aspectInner(val: number) {
    this._parametersInner.w = val;
    this.__updateCount++;
  }

  /**
   * Gets the internal aspect ratio.
   *
   * @returns The internal aspect ratio
   */
  get aspectInner() {
    return this._parametersInner.w;
  }

  /**
   * Gets the aspect ratio.
   *
   * @returns The aspect ratio
   */
  get aspect() {
    return this._parameters.w;
  }

  /**
   * Sets the X magnification for orthographic projection.
   *
   * @param val - The X magnification value
   */
  set xMag(val: number) {
    this._parameters.z = val;
    this.__updateCount++;
  }

  /**
   * Gets the X magnification for orthographic projection.
   *
   * @returns The X magnification value
   */
  get xMag() {
    return this._parameters.z;
  }

  /**
   * Sets the Y magnification for orthographic projection.
   *
   * @param val - The Y magnification value
   */
  set yMag(val: number) {
    this._parameters.w = val;
  }

  /**
   * Gets the Y magnification for orthographic projection.
   *
   * @returns The Y magnification value
   */
  get yMag() {
    return this._parameters.w;
  }

  /**
   * Gets the component type identifier for camera components.
   *
   * @returns The camera component type identifier
   */
  static get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraComponentTID;
  }

  /**
   * Gets the component type identifier for this camera component.
   *
   * @returns The camera component type identifier
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CameraComponentTID;
  }

  /**
   * Calculates and returns the projection matrix based on camera parameters.
   *
   * @returns The calculated projection matrix
   */
  calcProjectionMatrix() {
    const zNear = this._parametersInner.x;
    const zFar = this._parametersInner.y;

    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.type === CameraType.Perspective) {
        const fovy = this._parametersInner.z;
        let aspect = this._parametersInner.w;
        if (aspect < 0) {
          aspect = SystemState.viewportAspectRatio;
        }
        const yscale = 1.0 / Math.tan((0.5 * fovy * Math.PI) / 180);
        const xscale = yscale / aspect;
        this._projectionMatrix.m00 = xscale;
        this._projectionMatrix.m01 = 0;
        this._projectionMatrix.m02 = 0;
        this._projectionMatrix.m03 = 0;
        this._projectionMatrix.m10 = 0;
        this._projectionMatrix.m11 = yscale;
        this._projectionMatrix.m12 = 0;
        this._projectionMatrix.m13 = 0;
        this._projectionMatrix.m20 = 0;
        this._projectionMatrix.m21 = 0;
        if (zFar === Infinity) {
          this._projectionMatrix.m22 = -1;
          this._projectionMatrix.m23 = -zNear;
        } else {
          const nf = 1 / (zNear - zFar);
          this._projectionMatrix.m22 = zFar * nf;
          this._projectionMatrix.m23 = zFar * zNear * nf;
        }
        this._projectionMatrix.m30 = 0;
        this._projectionMatrix.m31 = 0;
        this._projectionMatrix.m32 = -1;
        this._projectionMatrix.m33 = 0;
      } else if (this.type === CameraType.Orthographic) {
        const xmag = this._parametersInner.z;
        const ymag = this._parametersInner.w;
        this._projectionMatrix.setComponents(
          1 / xmag,
          0.0,
          0.0,
          0,
          0.0,
          1 / ymag,
          0.0,
          0,
          0.0,
          0.0,
          -1 / (zFar - zNear),
          -zNear / (zFar - zNear),
          0.0,
          0.0,
          0.0,
          1.0
        );
      } else {
        const left = this._cornerInner.x;
        const right = this._cornerInner.y;
        const top = this._cornerInner.z;
        const bottom = this._cornerInner.w;
        const nf = 1 / (zNear - zFar);
        this._projectionMatrix.setComponents(
          (2 * zNear) / (right - left),
          0.0,
          (right + left) / (right - left),
          0.0,
          0.0,
          (2 * zNear) / (top - bottom),
          (top + bottom) / (top - bottom),
          0.0,
          0.0,
          0.0,
          zFar * nf,
          zFar * zNear * nf,
          0.0,
          0.0,
          -1.0,
          0.0
        );
      }
    } else {
      if (this.type === CameraType.Perspective) {
        const fovy = this._parametersInner.z;
        let aspect = this._parametersInner.w;
        if (aspect < 0) {
          aspect = SystemState.viewportAspectRatio;
        }
        const yscale = 1.0 / Math.tan((0.5 * fovy * Math.PI) / 180);
        const xscale = yscale / aspect;
        this._projectionMatrix.m00 = xscale;
        this._projectionMatrix.m01 = 0;
        this._projectionMatrix.m02 = 0;
        this._projectionMatrix.m03 = 0;
        this._projectionMatrix.m10 = 0;
        this._projectionMatrix.m11 = yscale;
        this._projectionMatrix.m12 = 0;
        this._projectionMatrix.m13 = 0;
        this._projectionMatrix.m20 = 0;
        this._projectionMatrix.m21 = 0;
        if (zFar === Infinity) {
          this._projectionMatrix.m22 = -1;
          this._projectionMatrix.m23 = -2 * zNear;
        } else {
          const nf = 1 / (zNear - zFar);
          this._projectionMatrix.m22 = (zFar + zNear) * nf;
          this._projectionMatrix.m23 = 2.0 * zFar * zNear * nf;
        }
        this._projectionMatrix.m30 = 0;
        this._projectionMatrix.m31 = 0;
        this._projectionMatrix.m32 = -1;
        this._projectionMatrix.m33 = 0;
      } else if (this.type === CameraType.Orthographic) {
        const xmag = this._parametersInner.z;
        const ymag = this._parametersInner.w;
        this._projectionMatrix.setComponents(
          1 / xmag,
          0.0,
          0.0,
          0,
          0.0,
          1 / ymag,
          0.0,
          0,
          0.0,
          0.0,
          -2 / (zFar - zNear),
          -(zFar + zNear) / (zFar - zNear),
          0.0,
          0.0,
          0.0,
          1.0
        );
      } else {
        const left = this._cornerInner.x;
        const right = this._cornerInner.y;
        const top = this._cornerInner.z;
        const bottom = this._cornerInner.w;
        const nf = 1 / (zNear - zFar);
        this._projectionMatrix.setComponents(
          (2 * zNear) / (right - left),
          0.0,
          (right + left) / (right - left),
          0.0,
          0.0,
          (2 * zNear) / (top - bottom),
          (top + bottom) / (top - bottom),
          0.0,
          0.0,
          0.0,
          (zFar + zNear) * nf,
          2 * zFar * zNear * nf,
          0.0,
          0.0,
          -1.0,
          0.0
        );
      }
    }

    return this._projectionMatrix;
  }

  /**
   * Calculates and returns the view matrix based on camera position and orientation.
   *
   * @returns The calculated view matrix
   */
  calcViewMatrix() {
    const eye = this.eyeInner;
    const f = MutableVector3.subtractTo(this._directionInner, eye, CameraComponent.__tmpVector3_0).normalize();
    const s = MutableVector3.crossTo(f, this._upInner, CameraComponent.__tmpVector3_1).normalize();
    const u = MutableVector3.crossTo(s, f, CameraComponent.__tmpVector3_2);

    this._viewMatrix.setComponents(
      s.x,
      s.y,
      s.z,
      -Vector3.dot(s, eye),
      u.x,
      u.y,
      u.z,
      -Vector3.dot(u, eye),
      -f.x,
      -f.y,
      -f.z,
      Vector3.dot(f, eye),
      0,
      0,
      0,
      1
    );

    if (!this.primitiveMode) {
      const invertWorldMatrix = MutableMatrix44.invertTo(
        this.entity.getSceneGraph().matrixInner,
        CameraComponent.__tmpMatrix44_0
      );

      this._viewMatrix.multiply(invertWorldMatrix);
    }

    return this._viewMatrix;
  }

  /**
   * Gets the view matrix.
   *
   * @returns The view matrix
   */
  get viewMatrix() {
    return this._viewMatrix;
  }

  /**
   * Sets the view matrix.
   *
   * @param viewMatrix - The view matrix to set
   */
  set viewMatrix(viewMatrix: Matrix44) {
    this._viewMatrix.copyComponents(viewMatrix);
    this.__updateCount++;
  }

  /**
   * Gets the projection matrix, considering XR mode if applicable.
   *
   * @returns The projection matrix (may be XR-specific matrix if in XR mode)
   */
  get projectionMatrix() {
    if (this._xrLeft || this._xrRight) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      if (rnXRModule?.WebXRSystem.getInstance().isWebXRMode) {
        const webXRSystem = rnXRModule.WebXRSystem.getInstance();
        if (this._xrLeft) {
          return webXRSystem.leftProjectionMatrix;
        } else if (this._xrRight) {
          return webXRSystem.rightProjectionMatrix;
        }
      }
    }
    return this._projectionMatrix;
  }

  /**
   * Sets the projection matrix.
   *
   * @param projectionMatrix - The projection matrix to set
   */
  set projectionMatrix(projectionMatrix: Matrix44) {
    this._projectionMatrix.copyComponents(projectionMatrix);
    this.__updateCount++;
  }

  /**
   * Gets the combined view-projection matrix.
   *
   * @returns The view-projection matrix
   */
  get viewProjectionMatrix() {
    return MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, CameraComponent.__tmpMatrix44_0);
  }

  /**
   * Gets the bias view-projection matrix for shadow mapping.
   *
   * @returns The bias view-projection matrix adjusted for the current graphics API
   */
  get biasViewProjectionMatrix() {
    MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, CameraComponent.__tmpMatrix44_0);
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return MutableMatrix44.multiplyTo(
        CameraComponent.__biasMatrixWebGPU,
        CameraComponent.__tmpMatrix44_0,
        CameraComponent.__tmpMatrix44_1
      );
    } else {
      return MutableMatrix44.multiplyTo(
        CameraComponent.__biasMatrixWebGL,
        CameraComponent.__tmpMatrix44_0,
        CameraComponent.__tmpMatrix44_1
      );
    }
  }

  /**
   * Sets only the matrix values to the global data repository.
   */
  setValuesToGlobalDataRepositoryOnlyMatrices() {
    CameraComponent.__globalDataRepository.setValue('viewMatrix', this.componentSID, this.viewMatrix);
    CameraComponent.__globalDataRepository.setValue('projectionMatrix', this.componentSID, this.projectionMatrix);
  }

  /**
   * Sets camera values (matrices and position) to the global data repository.
   */
  setValuesToGlobalDataRepository() {
    CameraComponent.__globalDataRepository.setValue('viewMatrix', this.componentSID, this.viewMatrix);
    CameraComponent.__globalDataRepository.setValue('projectionMatrix', this.componentSID, this.projectionMatrix);
    CameraComponent.__globalDataRepository.setValue('viewPosition', this.componentSID, this.worldPosition);
  }

  /**
   * Gets the world position of the camera.
   *
   * @returns The world position vector
   */
  get worldPosition() {
    this.entity.getSceneGraph().matrixInner.multiplyVector3To(this.eyeInner, CameraComponent.returnVector3);
    return CameraComponent.returnVector3;
  }

  /**
   * Updates the camera frustum based on current view and projection matrices.
   */
  updateFrustum() {
    this.__frustum.update(this.viewMatrix, this.projectionMatrix);
  }

  /**
   * Gets the camera frustum for culling operations.
   *
   * @returns The camera frustum
   */
  get frustum() {
    return this.__frustum;
  }

  /**
   * Loads the camera component and moves it to the logic stage.
   *
   * @internal
   */
  $load() {
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Executes the logic update for the camera component.
   * Updates view and projection matrices, handles light synchronization, and manages XR mode.
   *
   * @internal
   */
  $logic() {
    const lightComponent = this.entity.tryToGetLight();
    let lightComponentUpdateCount = lightComponent != null ? lightComponent.updateCount : -1;
    if (
      this.__lastUpdateCount === this.__updateCount &&
      this.__lastTransformComponentsUpdateCount === TransformComponent.updateCount &&
      this.__lastLightComponentsUpdateCount === lightComponentUpdateCount &&
      this.__lastCameraControllerComponentsUpdateCount === CameraControllerComponent.updateCount
    ) {
      return;
    }

    if (this.isSyncToLight && Is.exist(lightComponent)) {
      // for Shadow Mapping
      this._eyeInner.copyComponents(CameraComponent._eye);
      this._directionInner.copyComponents(this._direction);
      this._upInner.copyComponents(this._up);
      if (lightComponent.type === LightType.Spot) {
        this.type = CameraType.Perspective;
        this.setFovyAndChangeFilmSize(MathUtil.radianToDegree(lightComponent.outerConeAngle));
        this._cornerInner.copyComponents(this._corner);
        this.aspect = 1;
        this.zNear = 0.1;
        this.zFar = lightComponent.range !== -1 ? lightComponent.range : 10000;
        this._parametersInner.copyComponents(this._parameters);
      } else if (lightComponent.type === LightType.Directional) {
        this.type = CameraType.Orthographic;
        const areaSize = lightComponent.shadowAreaSizeForDirectionalLight;
        this._cornerInner.copyComponents(Vector4.fromCopy4(-areaSize, areaSize, areaSize, -areaSize));
        this.aspect = 1;
        this.zNear = 0.1;
        this.zFar = lightComponent.range !== -1 ? lightComponent.range : 100;
        this._parametersInner.copyComponents(this._parameters);
      }
    } else {
      const cameraControllerComponent = this.entity.tryToGetCameraController();
      if (Is.exist(cameraControllerComponent)) {
        this._parametersInner.w = this._parameters.w;
      } else {
        if (!this.primitiveMode) {
          this._eyeInner.copyComponents(CameraComponent._eye);
          this._directionInner.copyComponents(this._direction);
          this._upInner.copyComponents(this._up);
          this._cornerInner.copyComponents(this._corner);
          this._parametersInner.copyComponents(this._parameters);
        }
      }
    }

    this.calcViewMatrix();

    if (!this._xrLeft && !this._xrRight) {
      this.calcProjectionMatrix();
    }
    this.setValuesToGlobalDataRepository();

    this.__lastUpdateCount = this.__updateCount;
    this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
    this.__lastLightComponentsUpdateCount = lightComponentUpdateCount;
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
  }

  /**
   * Gets the entity that has the current active camera component.
   *
   * @returns The entity with the current camera component
   */
  static getCurrentCameraEntity() {
    const currentCameraComponent = ComponentRepository.getComponent(this, this.current) as CameraComponent;
    return currentCameraComponent.entity;
  }

  /**
   * Gets the entity which has this camera component.
   *
   * @returns The entity which has this component
   */
  get entity(): ICameraEntity {
    return EntityRepository.getEntity(this.__entityUid) as unknown as ICameraEntity;
  }

  /**
   * Adds this camera component to an entity, extending it with camera-specific methods.
   *
   * @param base - The target entity
   * @param _componentClass - The component class to add
   * @returns The entity extended with camera component methods
   * @override
   */
  addThisComponentToEntity<EntityBaseClass extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBaseClass,
    _componentClass: SomeComponentClass
  ) {
    class CameraEntity extends (base.constructor as any) {
      constructor(entityUID: EntityUID, isAlive: boolean, components?: Map<ComponentTID, Component>) {
        super(entityUID, isAlive, components);
      }

      /**
       * Gets the camera component of this entity.
       *
       * @returns The camera component
       */
      getCamera() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.CameraComponentTID) as CameraComponent;
      }
    }
    applyMixins(base, CameraEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBaseClass;
  }
}
