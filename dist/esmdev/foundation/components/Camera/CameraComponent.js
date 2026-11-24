// src/foundation/components/Camera/CameraComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { BufferUse } from "../../definitions/BufferUse.js";
import { CameraType } from "../../definitions/CameraType.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { LightType } from "../../definitions/LightType.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { ShaderType } from "../../definitions/ShaderType.js";
import { Frustum } from "../../geometry/Frustum.js";
import { MathUtil } from "../../math/MathUtil.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { MutableVector4 } from "../../math/MutableVector4.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { Is } from "../../misc/Is.js";
import { CameraControllerComponent } from "../CameraController/CameraControllerComponent.js";
import { TransformComponent } from "../Transform/TransformComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var _CameraComponent = class _CameraComponent extends Component {
  /**
   * Creates a new CameraComponent instance.
   *
   * @param engine - The engine instance
   * @param entityUid - The unique identifier of the entity this component belongs to
   * @param componentSid - The component system identifier
   * @param entityRepository - The entity repository instance
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this._eyeInner = MutableVector3.zero();
    this._direction = MutableVector3.fromCopy3(0, 0, -1);
    this._directionInner = MutableVector3.fromCopy3(0, 0, -1);
    this._up = MutableVector3.fromCopy3(0, 1, 0);
    this._upInner = MutableVector3.fromCopy3(0, 1, 0);
    this._filmWidth = 36;
    // mili meter
    this._filmHeight = 24;
    // mili meter
    this._focalLength = 20;
    this.primitiveMode = false;
    // x: left, y:right, z:top, w: bottom
    this._corner = MutableVector4.fromCopy4(-1, 1, 1, -1);
    this._cornerInner = MutableVector4.fromCopy4(-1, 1, 1, -1);
    // x: zNear, y: zFar,
    // if perspective, z: fovy, w: aspect
    // if ortho, z: xmag, w: ymag
    this._parameters = MutableVector4.fromCopy4(0.1, 1e4, 90, 1);
    this._parametersInner = MutableVector4.fromCopy4(0.1, 1e4, 90, 1);
    this.__type = CameraType.Perspective;
    this._projectionMatrix = MutableMatrix44.dummy();
    this._viewMatrix = MutableMatrix44.dummy();
    this._viewPosition = MutableVector3.dummy();
    // x: the vec4 index of the light cluster view region of this camera in the GPU data (-1: none). Written by
    // LightClusterSystem every frame (see LightClusterSystem.__assignViews). The shaders read it as the base of the
    // view header, the cluster table and the light index list (WebGL2: through the u_lightClusterView uniform,
    // WebGPU: from the GPU instance data).
    this._lightClusterViewInfo = MutableVector4.dummy();
    this._xrLeft = false;
    this._xrRight = false;
    this.isSyncToLight = false;
    this.__frustum = new Frustum();
    this.__updateCount = 0;
    this.__lastUpdateCount = -1;
    this.__lastTransformComponentsUpdateCount = -1;
    this.__lastLightComponentsUpdateCount = -1;
    this.__lastCameraControllerComponentsUpdateCount = -1;
    this.setFovyAndChangeFocalLength(90);
    if (_CameraComponent.getCurrent(engine) === -1) {
      _CameraComponent.setCurrent(engine, componentSid);
    }
    this.submitToAllocation(engine.config.cameraComponentCountPerBufferView, isReUse);
  }
  /**
   * Gets the current active camera component ID for a specific engine.
   *
   * @param engine - The engine instance
   * @returns The component system identifier of the current active camera for the engine
   */
  static getCurrent(engine) {
    var _a;
    return (_a = this.__currentMap.get(engine.engineUid)) != null ? _a : -1;
  }
  /**
   * Sets the current active camera component for a specific engine.
   *
   * @param engine - The engine instance
   * @param componentSID - The component system identifier of the camera to set as current
   */
  static setCurrent(engine, componentSID) {
    this.__currentMap.set(engine.engineUid, componentSID);
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
   * @param engine - The engine instance
   * @returns The update count of the current camera, or 0 if no camera is active
   */
  static getCurrentCameraUpdateCount(engine) {
    var _a;
    const currentCameraComponent = engine.componentRepository.getComponent(
      _CameraComponent,
      _CameraComponent.getCurrent(engine)
    );
    return (_a = currentCameraComponent == null ? void 0 : currentCameraComponent.updateCount) != null ? _a : 0;
  }
  /**
   * Sets the camera type (perspective, orthographic, or frustum).
   *
   * @param type - The camera type to set
   */
  set type(type) {
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
    return _CameraComponent._eye;
  }
  /**
   * Attempts to set the eye position (throws error as this is not supported).
   *
   * @param noUseVec - The vector to set (not used)
   * @throws Always throws an error as eye positioning should use TransformComponent
   */
  set eye(_noUseVec) {
    throw Error("In Rhodonite, eye is always (0,0,0). Use TransformComponent for Camera positioning.");
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
  set eyeInner(vec) {
    this._eyeInner.copyComponents(vec);
    this.__updateCount++;
  }
  /**
   * Sets the internal up vector.
   *
   * @param vec - The vector to set as the internal up direction
   */
  set upInner(vec) {
    this._upInner.copyComponents(vec);
    this.__updateCount++;
  }
  /**
   * Sets the up vector of the camera.
   *
   * @param vec - The vector to set as the up direction
   */
  set up(vec) {
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
  set direction(vec) {
    const oldDirection = this._direction;
    const newDirection = vec;
    const oldUp = this._up;
    const orthogonalVectorNewDirectionAndOldUp = MutableVector3.crossTo(
      newDirection,
      oldUp,
      _CameraComponent.__tmpVector3_0
    );
    const isOrthogonalNewDirectionAndOldUp = orthogonalVectorNewDirectionAndOldUp.length() === 0;
    let newUpNonNormalize;
    if (isOrthogonalNewDirectionAndOldUp) {
      const relativeXaxis = MutableVector3.crossTo(oldDirection, oldUp, _CameraComponent.__tmpVector3_1);
      newUpNonNormalize = MutableVector3.crossTo(relativeXaxis, newDirection, _CameraComponent.__tmpVector3_2);
    } else {
      const newDirectionComponentInOldUp = MutableVector3.multiplyTo(
        newDirection,
        newDirection.dot(oldUp),
        _CameraComponent.__tmpVector3_1
      );
      newUpNonNormalize = MutableVector3.subtractTo(
        oldUp,
        newDirectionComponentInOldUp,
        _CameraComponent.__tmpVector3_2
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
  set directionInner(vec) {
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
  set corner(vec) {
    this._corner.copyComponents(vec);
    this.__updateCount++;
  }
  /**
   * Gets the corner parameters.
   *
   * @returns A copy of the corner vector
   */
  get corner() {
    return this._corner.clone();
  }
  /**
   * Sets the left clipping plane position.
   *
   * @param value - The left clipping plane position
   */
  set left(value) {
    this._corner.x = value;
    this.__updateCount++;
  }
  /**
   * Sets the internal left clipping plane position.
   *
   * @param value - The internal left clipping plane position
   */
  set leftInner(value) {
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
  set right(value) {
    this._corner.y = value;
    this.__updateCount++;
  }
  /**
   * Sets the internal right clipping plane position.
   *
   * @param value - The internal right clipping plane position
   */
  set rightInner(value) {
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
  set top(value) {
    this._corner.z = value;
    this.__updateCount++;
  }
  /**
   * Sets the internal top clipping plane position.
   *
   * @param value - The internal top clipping plane position
   */
  set topInner(value) {
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
  set bottom(value) {
    this._corner.w = value;
    this.__updateCount++;
  }
  /**
   * Sets the internal bottom clipping plane position.
   *
   * @param value - The internal bottom clipping plane position
   */
  set bottomInner(value) {
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
  set cornerInner(vec) {
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
  set parametersInner(vec) {
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
  get parameters() {
    return this._parameters.clone();
  }
  /**
   * Sets the near clipping plane distance.
   *
   * @param val - The near clipping plane distance
   */
  set zNear(val) {
    this._parameters.x = val;
    this.__updateCount++;
  }
  /**
   * Sets the internal near clipping plane distance.
   *
   * @param val - The internal near clipping plane distance
   */
  set zNearInner(val) {
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
  set focalLength(val) {
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
  set focalLengthInner(val) {
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
  set zFar(val) {
    this._parameters.y = val;
    this.__updateCount++;
  }
  /**
   * Sets the internal far clipping plane distance.
   *
   * @param val - The internal far clipping plane distance
   */
  set zFarInner(val) {
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
  setFovyAndChangeFilmSize(degree) {
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
  setFovyAndChangeFocalLength(degree) {
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
  set fovyInner(val) {
    this._parametersInner.z = val;
    this.__updateCount++;
  }
  /**
   * Sets the aspect ratio and adjusts the film width accordingly.
   *
   * @param val - The aspect ratio (width/height)
   */
  set aspect(val) {
    this._parameters.w = val;
    this._filmWidth = this._filmHeight * val;
    this.__updateCount++;
  }
  /**
   * Sets the internal aspect ratio.
   *
   * @param val - The internal aspect ratio
   */
  set aspectInner(val) {
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
  set xMag(val) {
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
  set yMag(val) {
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
  static get componentTID() {
    return WellKnownComponentTIDs.CameraComponentTID;
  }
  /**
   * Gets the component type identifier for this camera component.
   *
   * @returns The camera component type identifier
   */
  get componentTID() {
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
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.type === CameraType.Perspective) {
        const fovy = this._parametersInner.z;
        let aspect = this._parametersInner.w;
        if (aspect < 0) {
          aspect = this.__engine.engineState.viewportAspectRatio;
        }
        const yscale = 1 / Math.tan(0.5 * fovy * Math.PI / 180);
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
        if (zFar === Number.POSITIVE_INFINITY) {
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
          0,
          0,
          0,
          0,
          1 / ymag,
          0,
          0,
          0,
          0,
          -1 / (zFar - zNear),
          -zNear / (zFar - zNear),
          0,
          0,
          0,
          1
        );
      } else {
        const left = this._cornerInner.x;
        const right = this._cornerInner.y;
        const top = this._cornerInner.z;
        const bottom = this._cornerInner.w;
        const nf = 1 / (zNear - zFar);
        this._projectionMatrix.setComponents(
          2 * zNear / (right - left),
          0,
          (right + left) / (right - left),
          0,
          0,
          2 * zNear / (top - bottom),
          (top + bottom) / (top - bottom),
          0,
          0,
          0,
          zFar * nf,
          zFar * zNear * nf,
          0,
          0,
          -1,
          0
        );
      }
    } else {
      if (this.type === CameraType.Perspective) {
        const fovy = this._parametersInner.z;
        let aspect = this._parametersInner.w;
        if (aspect < 0) {
          aspect = this.__engine.engineState.viewportAspectRatio;
        }
        const yscale = 1 / Math.tan(0.5 * fovy * Math.PI / 180);
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
        if (zFar === Number.POSITIVE_INFINITY) {
          this._projectionMatrix.m22 = -1;
          this._projectionMatrix.m23 = -2 * zNear;
        } else {
          const nf = 1 / (zNear - zFar);
          this._projectionMatrix.m22 = (zFar + zNear) * nf;
          this._projectionMatrix.m23 = 2 * zFar * zNear * nf;
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
          0,
          0,
          0,
          0,
          1 / ymag,
          0,
          0,
          0,
          0,
          -2 / (zFar - zNear),
          -(zFar + zNear) / (zFar - zNear),
          0,
          0,
          0,
          1
        );
      } else {
        const left = this._cornerInner.x;
        const right = this._cornerInner.y;
        const top = this._cornerInner.z;
        const bottom = this._cornerInner.w;
        const nf = 1 / (zNear - zFar);
        this._projectionMatrix.setComponents(
          2 * zNear / (right - left),
          0,
          (right + left) / (right - left),
          0,
          0,
          2 * zNear / (top - bottom),
          (top + bottom) / (top - bottom),
          0,
          0,
          0,
          (zFar + zNear) * nf,
          2 * zFar * zNear * nf,
          0,
          0,
          -1,
          0
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
    const f = MutableVector3.subtractTo(this._directionInner, eye, _CameraComponent.__tmpVector3_0).normalize();
    const s = MutableVector3.crossTo(f, this._upInner, _CameraComponent.__tmpVector3_1).normalize();
    const u = MutableVector3.crossTo(s, f, _CameraComponent.__tmpVector3_2);
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
        _CameraComponent.__tmpMatrix44_0
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
  set viewMatrix(viewMatrix) {
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
      const webXRSystem = this.__engine._webXRSystemIfEnabled;
      if (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) {
        if (this._xrLeft) {
          return webXRSystem.leftProjectionMatrix;
        }
        if (this._xrRight) {
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
  set projectionMatrix(projectionMatrix) {
    this._projectionMatrix.copyComponents(projectionMatrix);
    this.__updateCount++;
  }
  /**
   * The projection matrix that is uploaded to the GPU (in XR mode, the matrix of the eye copied in $logic).
   *
   * @internal
   */
  get _projectionMatrixForGpu() {
    return this._projectionMatrix;
  }
  /**
   * The light cluster view info uploaded to the GPU.
   * x: the vec4 index of the light cluster view region of this camera (-1: none).
   *
   * @internal
   */
  get _lightClusterViewInfoForGpu() {
    return this._lightClusterViewInfo;
  }
  /**
   * Gets the combined view-projection matrix.
   *
   * @returns The view-projection matrix
   */
  get viewProjectionMatrix() {
    return MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, _CameraComponent.__tmpMatrix44_0);
  }
  /**
   * Gets the bias view-projection matrix for shadow mapping.
   *
   * @returns The bias view-projection matrix adjusted for the current graphics API
   */
  get biasViewProjectionMatrix() {
    MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, _CameraComponent.__tmpMatrix44_0);
    if (this.__engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return MutableMatrix44.multiplyTo(
        _CameraComponent.__biasMatrixWebGPU,
        _CameraComponent.__tmpMatrix44_0,
        _CameraComponent.__tmpMatrix44_1
      );
    }
    return MutableMatrix44.multiplyTo(
      _CameraComponent.__biasMatrixWebGL,
      _CameraComponent.__tmpMatrix44_0,
      _CameraComponent.__tmpMatrix44_1
    );
  }
  /**
   * Sets camera values (position) to the viewPosition member.
   */
  __setValuesToViewPosition() {
    this._viewPosition.copyComponents(this.worldPosition);
  }
  /**
   * Gets the world position of the camera.
   *
   * @returns The world position vector
   */
  get worldPosition() {
    this.entity.getSceneGraph().matrixInner.multiplyVector3To(this.eyeInner, _CameraComponent.returnVector3);
    return _CameraComponent.returnVector3;
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
    if (this.__lastUpdateCount === this.__updateCount && this.__lastTransformComponentsUpdateCount === TransformComponent.getUpdateCount(this.__engine) && this.__lastLightComponentsUpdateCount === lightComponentUpdateCount && this.__lastCameraControllerComponentsUpdateCount === CameraControllerComponent.getUpdateCount(this.__engine)) {
      return;
    }
    if (this.isSyncToLight && Is.exist(lightComponent)) {
      this._eyeInner.copyComponents(_CameraComponent._eye);
      this._directionInner.copyComponents(this._direction);
      this._upInner.copyComponents(this._up);
      if (lightComponent.type === LightType.Spot) {
        this.type = CameraType.Perspective;
        this.setFovyAndChangeFilmSize(MathUtil.radianToDegree(lightComponent.outerConeAngle * 2));
        this._cornerInner.copyComponents(this._corner);
        this.aspect = 1;
        this.zNear = lightComponent.shadowZNearForSpotLight;
        this.zFar = lightComponent.range !== -1 ? lightComponent.range : 100;
        this._parametersInner.copyComponents(this._parameters);
      } else if (lightComponent.type === LightType.Directional) {
        this.type = CameraType.Orthographic;
        const areaSize = lightComponent.shadowAreaSizeForDirectionalLight;
        this._cornerInner.copyComponents(Vector4.fromCopy4(-areaSize, areaSize, areaSize, -areaSize));
        this.aspect = 1;
        this.zNear = lightComponent.shadowZNearForDirectionalLight;
        this.zFar = lightComponent.range !== -1 ? lightComponent.range : 100;
        this._parametersInner.x = this.zNear;
        this._parametersInner.y = this.zFar;
        this._parametersInner.z = areaSize;
        this._parametersInner.w = areaSize;
      }
    } else {
      const cameraControllerComponent = this.entity.tryToGetCameraController();
      if (Is.exist(cameraControllerComponent)) {
        this._parametersInner.w = this._parameters.w;
      } else {
        if (!this.primitiveMode) {
          this._eyeInner.copyComponents(_CameraComponent._eye);
          this._directionInner.copyComponents(this._direction);
          this._upInner.copyComponents(this._up);
          this._cornerInner.copyComponents(this._corner);
          this._parametersInner.copyComponents(this._parameters);
        }
      }
    }
    this.calcViewMatrix();
    if (this._xrLeft || this._xrRight) {
      const webXRSystem = this.__engine._webXRSystemIfEnabled;
      if (webXRSystem == null ? void 0 : webXRSystem.isWebXRMode) {
        if (this._xrLeft) {
          this._projectionMatrix.copyComponents(webXRSystem.leftProjectionMatrix);
        } else if (this._xrRight) {
          this._projectionMatrix.copyComponents(webXRSystem.rightProjectionMatrix);
        }
      }
    } else {
      this.calcProjectionMatrix();
    }
    this.__setValuesToViewPosition();
    this.__lastUpdateCount = this.__updateCount;
    this.__lastTransformComponentsUpdateCount = TransformComponent.getUpdateCount(this.__engine);
    this.__lastLightComponentsUpdateCount = lightComponentUpdateCount;
    this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.getUpdateCount(this.__engine);
  }
  /**
   * Gets the entity which has this camera component.
   *
   * @returns The entity which has this component
   */
  get entity() {
    return this.__engine.entityRepository.getEntity(this.__entityUid);
  }
  /**
   * Adds this camera component to an entity, extending it with camera-specific methods.
   *
   * @param base - The target entity
   * @param _componentClass - The component class to add
   * @returns The entity extended with camera component methods
   * @override
   */
  addThisComponentToEntity(base, _componentClass) {
    class CameraEntity extends base.constructor {
      /**
       * Gets the camera component of this entity.
       *
       * @returns The camera component
       */
      getCamera() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.CameraComponentTID);
      }
    }
    applyMixins(base, CameraEntity);
    return base;
  }
  /**
   * Cleans up static resources associated with the specified engine.
   * @param engine - The engine instance to clean up resources for
   * @internal
   */
  static _cleanupForEngine(engine) {
    _CameraComponent.__currentMap.delete(engine.engineUid);
  }
};
_CameraComponent._eye = Vector3.zero();
_CameraComponent.__currentMap = /* @__PURE__ */ new Map();
_CameraComponent.returnVector3 = MutableVector3.zero();
_CameraComponent.__tmpVector3_0 = MutableVector3.zero();
_CameraComponent.__tmpVector3_1 = MutableVector3.zero();
_CameraComponent.__tmpVector3_2 = MutableVector3.zero();
_CameraComponent.__tmpMatrix44_0 = MutableMatrix44.zero();
_CameraComponent.__tmpMatrix44_1 = MutableMatrix44.zero();
_CameraComponent.__biasMatrixWebGL = Matrix44.fromCopy16ColumnMajor(
  0.5,
  0,
  0,
  0,
  0,
  0.5,
  0,
  0,
  0,
  0,
  0.5,
  0,
  0.5,
  0.5,
  0.5,
  1
);
_CameraComponent.__biasMatrixWebGPU = Matrix44.fromCopy16ColumnMajor(
  0.5,
  0,
  0,
  0,
  0,
  -0.5,
  0,
  0,
  0,
  0,
  1,
  0,
  0.5,
  0.5,
  0,
  1
);
var CameraComponent = _CameraComponent;
CameraComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "viewMatrix",
  dataClassType: MutableMatrix44,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Mat4,
  componentType: ComponentType.Float,
  initValues: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
});
CameraComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "projectionMatrix",
  dataClassType: MutableMatrix44,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Mat4,
  componentType: ComponentType.Float,
  initValues: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
});
CameraComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "viewPosition",
  dataClassType: MutableVector3,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec3,
  componentType: ComponentType.Float,
  initValues: [0, 0, 0]
});
CameraComponent.registerMember({
  bufferUse: BufferUse.GPUInstanceData,
  memberName: "lightClusterViewInfo",
  dataClassType: MutableVector4,
  shaderType: ShaderType.VertexAndPixelShader,
  compositionType: CompositionType.Vec4,
  componentType: ComponentType.Float,
  initValues: [-1, 0, 0, 0]
});
export {
  CameraComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvbmVudFNJRCwgQ29tcG9uZW50VElELCBFbnRpdHlVSUQgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IElFbnRpdHkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eSc7XG5pbXBvcnQgeyBhcHBseU1peGlucywgdHlwZSBFbnRpdHlSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHlSZXBvc2l0b3J5JztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDYW1lcmFUeXBlLCB0eXBlIENhbWVyYVR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ2FtZXJhVHlwZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTGlnaHRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHsgRnJ1c3R1bSB9IGZyb20gJy4uLy4uL2dlb21ldHJ5L0ZydXN0dW0nO1xuaW1wb3J0IHR5cGUgeyBJQ2FtZXJhRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi8uLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQgfSBmcm9tICcuLi9DYW1lcmFDb250cm9sbGVyL0NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9XZWxsS25vd25Db21wb25lbnRUSURzJztcblxuLyoqXG4gKiBUaGUgQ29tcG9uZW50IHRoYXQgcmVwcmVzZW50cyBhIGNhbWVyYS5cbiAqXG4gKiBAcmVtYXJrc1xuICogVGhlIGNhbWVyYSBpcyBkZWZpbmVkIHN1Y2ggdGhhdCB0aGUgbG9jYWwgK1ggYXhpcyBpcyB0byB0aGUgcmlnaHQsXG4gKiB0aGUgXCJsZW5zXCIgbG9va3MgdG93YXJkcyB0aGUgbG9jYWwgLVogYXhpcyxcbiAqIGFuZCB0aGUgdG9wIG9mIHRoZSBjYW1lcmEgaXMgYWxpZ25lZCB3aXRoIHRoZSBsb2NhbCArWSBheGlzLlxuICovXG5leHBvcnQgY2xhc3MgQ2FtZXJhQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX2V5ZTogVmVjdG9yMyA9IFZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9leWVJbm5lcjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX2RpcmVjdGlvbjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgLTEpO1xuICBwcml2YXRlIF9kaXJlY3Rpb25Jbm5lcjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgLTEpO1xuICBwcml2YXRlIF91cDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgX3VwSW5uZXI6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApO1xuICBwcml2YXRlIF9maWxtV2lkdGggPSAzNjsgLy8gbWlsaSBtZXRlclxuICBwcml2YXRlIF9maWxtSGVpZ2h0ID0gMjQ7IC8vIG1pbGkgbWV0ZXJcbiAgcHJpdmF0ZSBfZm9jYWxMZW5ndGggPSAyMDtcbiAgcHJpdmF0ZSBwcmltaXRpdmVNb2RlID0gZmFsc2U7XG4gIC8vIHg6IGxlZnQsIHk6cmlnaHQsIHo6dG9wLCB3OiBib3R0b21cbiAgcHJpdmF0ZSBfY29ybmVyOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5NCgtMSwgMSwgMSwgLTEpO1xuICBwcml2YXRlIF9jb3JuZXJJbm5lcjogTXV0YWJsZVZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC5mcm9tQ29weTQoLTEsIDEsIDEsIC0xKTtcblxuICAvLyB4OiB6TmVhciwgeTogekZhcixcbiAgLy8gaWYgcGVyc3BlY3RpdmUsIHo6IGZvdnksIHc6IGFzcGVjdFxuICAvLyBpZiBvcnRobywgejogeG1hZywgdzogeW1hZ1xuICBwcml2YXRlIF9wYXJhbWV0ZXJzOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5NCgwLjEsIDEwMDAwLCA5MCwgMSk7XG4gIHByaXZhdGUgX3BhcmFtZXRlcnNJbm5lcjogTXV0YWJsZVZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC5mcm9tQ29weTQoMC4xLCAxMDAwMCwgOTAsIDEpO1xuICBwcml2YXRlIF9fdHlwZTogQ2FtZXJhVHlwZUVudW0gPSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlO1xuXG4gIHByaXZhdGUgX3Byb2plY3Rpb25NYXRyaXg6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5kdW1teSgpO1xuICBwcml2YXRlIF92aWV3TWF0cml4OiBNdXRhYmxlTWF0cml4NDQgPSBNdXRhYmxlTWF0cml4NDQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBfdmlld1Bvc2l0aW9uOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLmR1bW15KCk7XG4gIC8vIHg6IHRoZSB2ZWM0IGluZGV4IG9mIHRoZSBsaWdodCBjbHVzdGVyIHZpZXcgcmVnaW9uIG9mIHRoaXMgY2FtZXJhIGluIHRoZSBHUFUgZGF0YSAoLTE6IG5vbmUpLiBXcml0dGVuIGJ5XG4gIC8vIExpZ2h0Q2x1c3RlclN5c3RlbSBldmVyeSBmcmFtZSAoc2VlIExpZ2h0Q2x1c3RlclN5c3RlbS5fX2Fzc2lnblZpZXdzKS4gVGhlIHNoYWRlcnMgcmVhZCBpdCBhcyB0aGUgYmFzZSBvZiB0aGVcbiAgLy8gdmlldyBoZWFkZXIsIHRoZSBjbHVzdGVyIHRhYmxlIGFuZCB0aGUgbGlnaHQgaW5kZXggbGlzdCAoV2ViR0wyOiB0aHJvdWdoIHRoZSB1X2xpZ2h0Q2x1c3RlclZpZXcgdW5pZm9ybSxcbiAgLy8gV2ViR1BVOiBmcm9tIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSkuXG4gIHByaXZhdGUgX2xpZ2h0Q2x1c3RlclZpZXdJbmZvOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmR1bW15KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fY3VycmVudE1hcDogTWFwPG51bWJlciwgQ29tcG9uZW50U0lEPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgcmV0dXJuVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3IzXzA6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjNfMTogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjdG9yM18yOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBNYXRyaXg0NF8wID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBNYXRyaXg0NF8xID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19iaWFzTWF0cml4V2ViR0wgPSBNYXRyaXg0NC5mcm9tQ29weTE2Q29sdW1uTWFqb3IoXG4gICAgMC41LFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjUsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuNSxcbiAgICAwLjAsXG4gICAgMC41LFxuICAgIDAuNSxcbiAgICAwLjUsXG4gICAgMS4wXG4gICk7XG4gIHByaXZhdGUgc3RhdGljIF9fYmlhc01hdHJpeFdlYkdQVSA9IE1hdHJpeDQ0LmZyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICAwLjUsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIC0wLjUsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDEuMCxcbiAgICAwLjAsXG4gICAgMC41LFxuICAgIDAuNSxcbiAgICAwLjAsXG4gICAgMS4wXG4gICk7XG4gIF94ckxlZnQgPSBmYWxzZTtcbiAgX3hyUmlnaHQgPSBmYWxzZTtcbiAgcHVibGljIGlzU3luY1RvTGlnaHQgPSBmYWxzZTtcblxuICBwcml2YXRlIF9fZnJ1c3R1bSA9IG5ldyBGcnVzdHVtKCk7XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZUNvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2xhc3RVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuICBwcml2YXRlIF9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IC0xO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IENhbWVyYUNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGVudGl0eVVpZCAtIFRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgZW50aXR5IHRoaXMgY29tcG9uZW50IGJlbG9uZ3MgdG9cbiAgICogQHBhcmFtIGNvbXBvbmVudFNpZCAtIFRoZSBjb21wb25lbnQgc3lzdGVtIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgZW50aXR5IHJlcG9zaXRvcnkgaW5zdGFuY2VcbiAgICogQHBhcmFtIGlzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCBmcm9tIGEgcG9vbFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuXG4gICAgdGhpcy5zZXRGb3Z5QW5kQ2hhbmdlRm9jYWxMZW5ndGgoOTApO1xuXG4gICAgaWYgKENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSkgPT09IC0xKSB7XG4gICAgICBDYW1lcmFDb21wb25lbnQuc2V0Q3VycmVudChlbmdpbmUsIGNvbXBvbmVudFNpZCk7XG4gICAgfVxuXG4gICAgdGhpcy5zdWJtaXRUb0FsbG9jYXRpb24oZW5naW5lLmNvbmZpZy5jYW1lcmFDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcsIGlzUmVVc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYWN0aXZlIGNhbWVyYSBjb21wb25lbnQgSUQgZm9yIGEgc3BlY2lmaWMgZW5naW5lLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHN5c3RlbSBpZGVudGlmaWVyIG9mIHRoZSBjdXJyZW50IGFjdGl2ZSBjYW1lcmEgZm9yIHRoZSBlbmdpbmVcbiAgICovXG4gIHN0YXRpYyBnZXRDdXJyZW50KGVuZ2luZTogRW5naW5lKTogQ29tcG9uZW50U0lEIHtcbiAgICByZXR1cm4gdGhpcy5fX2N1cnJlbnRNYXAuZ2V0KGVuZ2luZS5lbmdpbmVVaWQpID8/IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGN1cnJlbnQgYWN0aXZlIGNhbWVyYSBjb21wb25lbnQgZm9yIGEgc3BlY2lmaWMgZW5naW5lLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gY29tcG9uZW50U0lEIC0gVGhlIGNvbXBvbmVudCBzeXN0ZW0gaWRlbnRpZmllciBvZiB0aGUgY2FtZXJhIHRvIHNldCBhcyBjdXJyZW50XG4gICAqL1xuICBzdGF0aWMgc2V0Q3VycmVudChlbmdpbmU6IEVuZ2luZSwgY29tcG9uZW50U0lEOiBDb21wb25lbnRTSUQpOiB2b2lkIHtcbiAgICB0aGlzLl9fY3VycmVudE1hcC5zZXQoZW5naW5lLmVuZ2luZVVpZCwgY29tcG9uZW50U0lEKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB1cGRhdGUgY291bnQgZm9yIHRoaXMgY2FtZXJhIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB0aW1lcyB0aGlzIGNhbWVyYSBoYXMgYmVlbiB1cGRhdGVkXG4gICAqL1xuICBnZXQgdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191cGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB1cGRhdGUgY291bnQgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIGNhbWVyYS5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZSBjb3VudCBvZiB0aGUgY3VycmVudCBjYW1lcmEsIG9yIDAgaWYgbm8gY2FtZXJhIGlzIGFjdGl2ZVxuICAgKi9cbiAgc3RhdGljIGdldEN1cnJlbnRDYW1lcmFVcGRhdGVDb3VudChlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGN1cnJlbnRDYW1lcmFDb21wb25lbnQgPSBlbmdpbmUuY29tcG9uZW50UmVwb3NpdG9yeS5nZXRDb21wb25lbnQoXG4gICAgICBDYW1lcmFDb21wb25lbnQsXG4gICAgICBDYW1lcmFDb21wb25lbnQuZ2V0Q3VycmVudChlbmdpbmUpXG4gICAgKSBhcyB1bmtub3duIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICByZXR1cm4gY3VycmVudENhbWVyYUNvbXBvbmVudD8udXBkYXRlQ291bnQgPz8gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjYW1lcmEgdHlwZSAocGVyc3BlY3RpdmUsIG9ydGhvZ3JhcGhpYywgb3IgZnJ1c3R1bSkuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIGNhbWVyYSB0eXBlIHRvIHNldFxuICAgKi9cbiAgc2V0IHR5cGUodHlwZTogQ2FtZXJhVHlwZUVudW0pIHtcbiAgICB0aGlzLl9fdHlwZSA9IHR5cGU7XG4gICAgaWYgKHR5cGUgPT09IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljKSB7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVycy53ID0gMTtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci56ID0gMTtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXRGb3Z5QW5kQ2hhbmdlRm9jYWxMZW5ndGgoOTApO1xuICAgICAgdGhpcy5fcGFyYW1ldGVycy53ID0gMTtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci56ID0gOTA7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudyA9IDE7XG4gICAgfVxuXG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2FtZXJhIHR5cGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IGNhbWVyYSB0eXBlXG4gICAqL1xuICBnZXQgdHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2FtZXJhIGV5ZSBwb3NpdGlvbiAoYWx3YXlzICgwLDAsMCkgaW4gUmhvZG9uaXRlKS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGV5ZSBwb3NpdGlvbiB2ZWN0b3IgKGFsd2F5cyB6ZXJvKVxuICAgKi9cbiAgZ2V0IGV5ZSgpIHtcbiAgICAvLyBJbiBSaG9kb25pdGUsIGV5ZSBpcyBhbHdheXMgKDAsMCwwKS4gVXNlIFRyYW5zZm9ybUNvbXBvbmVudCBmb3IgQ2FtZXJhIHBvc2l0aW9uaW5nXG4gICAgcmV0dXJuIENhbWVyYUNvbXBvbmVudC5fZXllO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIHNldCB0aGUgZXllIHBvc2l0aW9uICh0aHJvd3MgZXJyb3IgYXMgdGhpcyBpcyBub3Qgc3VwcG9ydGVkKS5cbiAgICpcbiAgICogQHBhcmFtIG5vVXNlVmVjIC0gVGhlIHZlY3RvciB0byBzZXQgKG5vdCB1c2VkKVxuICAgKiBAdGhyb3dzIEFsd2F5cyB0aHJvd3MgYW4gZXJyb3IgYXMgZXllIHBvc2l0aW9uaW5nIHNob3VsZCB1c2UgVHJhbnNmb3JtQ29tcG9uZW50XG4gICAqL1xuICBzZXQgZXllKF9ub1VzZVZlYzogVmVjdG9yMykge1xuICAgIHRocm93IEVycm9yKCdJbiBSaG9kb25pdGUsIGV5ZSBpcyBhbHdheXMgKDAsMCwwKS4gVXNlIFRyYW5zZm9ybUNvbXBvbmVudCBmb3IgQ2FtZXJhIHBvc2l0aW9uaW5nLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGV5ZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGV5ZSBwb3NpdGlvbiB2ZWN0b3JcbiAgICovXG4gIGdldCBleWVJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5fZXllSW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIGludGVybmFsIGV5ZSBwb3NpdGlvblxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHNldCBleWVJbm5lcih2ZWM6IFZlY3RvcjMpIHtcbiAgICB0aGlzLl9leWVJbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIHVwIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gc2V0IGFzIHRoZSBpbnRlcm5hbCB1cCBkaXJlY3Rpb25cbiAgICovXG4gIHNldCB1cElubmVyKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX3VwSW5uZXIuY29weUNvbXBvbmVudHModmVjKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB1cCB2ZWN0b3Igb2YgdGhlIGNhbWVyYS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gc2V0IGFzIHRoZSB1cCBkaXJlY3Rpb25cbiAgICovXG4gIHNldCB1cCh2ZWM6IFZlY3RvcjMpIHtcbiAgICB0aGlzLl91cC5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwIHZlY3RvciBvZiB0aGUgY2FtZXJhLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIHVwIHZlY3RvclxuICAgKi9cbiAgZ2V0IHVwKCkge1xuICAgIHJldHVybiB0aGlzLl91cC5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIHVwIHZlY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIHVwIHZlY3RvclxuICAgKi9cbiAgZ2V0IHVwSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3VwSW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZGlyZWN0aW9uIHZlY3RvciBvZiB0aGUgY2FtZXJhIGFuZCBhdXRvbWF0aWNhbGx5IGFkanVzdHMgdGhlIHVwIHZlY3RvciB0byByZW1haW4gb3J0aG9nb25hbC5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBuZXcgZGlyZWN0aW9uIHZlY3RvciBmb3IgdGhlIGNhbWVyYVxuICAgKi9cbiAgc2V0IGRpcmVjdGlvbih2ZWM6IFZlY3RvcjMpIHtcbiAgICBjb25zdCBvbGREaXJlY3Rpb24gPSB0aGlzLl9kaXJlY3Rpb247XG4gICAgY29uc3QgbmV3RGlyZWN0aW9uID0gdmVjO1xuICAgIGNvbnN0IG9sZFVwID0gdGhpcy5fdXA7XG5cbiAgICBjb25zdCBvcnRob2dvbmFsVmVjdG9yTmV3RGlyZWN0aW9uQW5kT2xkVXAgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKFxuICAgICAgbmV3RGlyZWN0aW9uLFxuICAgICAgb2xkVXAsXG4gICAgICBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzBcbiAgICApO1xuICAgIGNvbnN0IGlzT3J0aG9nb25hbE5ld0RpcmVjdGlvbkFuZE9sZFVwID0gb3J0aG9nb25hbFZlY3Rvck5ld0RpcmVjdGlvbkFuZE9sZFVwLmxlbmd0aCgpID09PSAwLjA7XG5cbiAgICBsZXQgbmV3VXBOb25Ob3JtYWxpemU6IE11dGFibGVWZWN0b3IzO1xuICAgIGlmIChpc09ydGhvZ29uYWxOZXdEaXJlY3Rpb25BbmRPbGRVcCkge1xuICAgICAgY29uc3QgcmVsYXRpdmVYYXhpcyA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8ob2xkRGlyZWN0aW9uLCBvbGRVcCwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18xKTtcbiAgICAgIG5ld1VwTm9uTm9ybWFsaXplID0gTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhyZWxhdGl2ZVhheGlzLCBuZXdEaXJlY3Rpb24sIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG5ld0RpcmVjdGlvbkNvbXBvbmVudEluT2xkVXAgPSBNdXRhYmxlVmVjdG9yMy5tdWx0aXBseVRvKFxuICAgICAgICBuZXdEaXJlY3Rpb24sXG4gICAgICAgIG5ld0RpcmVjdGlvbi5kb3Qob2xkVXApLFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzFcbiAgICAgICk7XG4gICAgICBuZXdVcE5vbk5vcm1hbGl6ZSA9IE11dGFibGVWZWN0b3IzLnN1YnRyYWN0VG8oXG4gICAgICAgIG9sZFVwLFxuICAgICAgICBuZXdEaXJlY3Rpb25Db21wb25lbnRJbk9sZFVwLFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXAuY29weUNvbXBvbmVudHMobmV3VXBOb25Ob3JtYWxpemUpLm5vcm1hbGl6ZSgpO1xuICAgIHRoaXMuX2RpcmVjdGlvbi5jb3B5Q29tcG9uZW50cyhuZXdEaXJlY3Rpb24pO1xuXG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgZGlyZWN0aW9uIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gc2V0IGFzIHRoZSBpbnRlcm5hbCBkaXJlY3Rpb25cbiAgICovXG4gIHNldCBkaXJlY3Rpb25Jbm5lcih2ZWM6IFZlY3RvcjMpIHtcbiAgICB0aGlzLl9kaXJlY3Rpb25Jbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRpcmVjdGlvbiB2ZWN0b3Igb2YgdGhlIGNhbWVyYS5cbiAgICpcbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBkaXJlY3Rpb24gdmVjdG9yXG4gICAqL1xuICBnZXQgZGlyZWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9kaXJlY3Rpb24uY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBkaXJlY3Rpb24gdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgZGlyZWN0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IGRpcmVjdGlvbklubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9kaXJlY3Rpb25Jbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb3JuZXIgcGFyYW1ldGVycyAobGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tKSBmb3IgZnJ1c3R1bSBjYW1lcmEuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgY29ybmVyIHZlY3RvciAoeDogbGVmdCwgeTogcmlnaHQsIHo6IHRvcCwgdzogYm90dG9tKVxuICAgKi9cbiAgc2V0IGNvcm5lcih2ZWM6IFZlY3RvcjQpIHtcbiAgICB0aGlzLl9jb3JuZXIuY29weUNvbXBvbmVudHModmVjKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb3JuZXIgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBjb3JuZXIgdmVjdG9yXG4gICAqL1xuICBnZXQgY29ybmVyKCk6IFZlY3RvcjQge1xuICAgIHJldHVybiB0aGlzLl9jb3JuZXIuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgbGVmdCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IGxlZnQodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lci54ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgbGVmdCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGludGVybmFsIGxlZnQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCBsZWZ0SW5uZXIodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lcklubmVyLnggPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVmdCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgZ2V0IGxlZnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lci54O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJpZ2h0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCByaWdodCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVyLnkgPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCByaWdodCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGludGVybmFsIHJpZ2h0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgcmlnaHRJbm5lcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVySW5uZXIueSA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJpZ2h0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIGdldCByaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyLnk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgdG9wKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9jb3JuZXIueiA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIHRvcCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGludGVybmFsIHRvcCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IHRvcElubmVyKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9jb3JuZXJJbm5lci56ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBnZXQgdG9wKCkge1xuICAgIHJldHVybiB0aGlzLl9jb3JuZXIuejtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCBib3R0b20odmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lci53ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgYm90dG9tIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgYm90dG9tIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgYm90dG9tSW5uZXIodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lcklubmVyLncgPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIGdldCBib3R0b20oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lci53O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGNvcm5lciBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGludGVybmFsIGNvcm5lciB2ZWN0b3JcbiAgICovXG4gIHNldCBjb3JuZXJJbm5lcih2ZWM6IFZlY3RvcjQpIHtcbiAgICB0aGlzLl9jb3JuZXJJbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGNvcm5lciBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgY29ybmVyIHZlY3RvclxuICAgKi9cbiAgZ2V0IGNvcm5lcklubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9jb3JuZXJJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBjYW1lcmEgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBpbnRlcm5hbCBwYXJhbWV0ZXJzIHZlY3RvclxuICAgKi9cbiAgc2V0IHBhcmFtZXRlcnNJbm5lcih2ZWM6IFZlY3RvcjQpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuY29weUNvbXBvbmVudHModmVjKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBjYW1lcmEgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIHBhcmFtZXRlcnMgdmVjdG9yXG4gICAqL1xuICBnZXQgcGFyYW1ldGVyc0lubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2FtZXJhIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgcGFyYW1ldGVycyB2ZWN0b3JcbiAgICovXG4gIGdldCBwYXJhbWV0ZXJzKCk6IFZlY3RvcjQge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlXG4gICAqL1xuICBzZXQgek5lYXIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnggPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBpbnRlcm5hbCBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlXG4gICAqL1xuICBzZXQgek5lYXJJbm5lcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci54ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlXG4gICAqL1xuICBnZXQgek5lYXJJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1ldGVyc0lubmVyLng7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIGdldCB6TmVhcigpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1ldGVycy54O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZvY2FsIGxlbmd0aCBhbmQgYXV0b21hdGljYWxseSBjYWxjdWxhdGVzIHRoZSBmaWVsZCBvZiB2aWV3LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGZvY2FsIGxlbmd0aCBpbiBtaWxsaW1ldGVyc1xuICAgKi9cbiAgc2V0IGZvY2FsTGVuZ3RoKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fZm9jYWxMZW5ndGggPSB2YWw7XG4gICAgdGhpcy5fcGFyYW1ldGVycy56ID0gMiAqIE1hdGhVdGlsLnJhZGlhblRvRGVncmVlKE1hdGguYXRhbih0aGlzLl9maWxtSGVpZ2h0IC8gKHZhbCAqIDIpKSk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZm9jYWwgbGVuZ3RoLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZm9jYWwgbGVuZ3RoIGluIG1pbGxpbWV0ZXJzXG4gICAqL1xuICBnZXQgZm9jYWxMZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZvY2FsTGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGZvY2FsIGxlbmd0aCBhbmQgY2FsY3VsYXRlcyB0aGUgZmllbGQgb2Ygdmlldy5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBpbnRlcm5hbCBmb2NhbCBsZW5ndGhcbiAgICovXG4gIHNldCBmb2NhbExlbmd0aElubmVyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSAyICogTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUoTWF0aC5hdGFuKHRoaXMuX2ZpbG1IZWlnaHQgLyAodmFsICogMikpKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBmb2NhbCBsZW5ndGguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBmb2NhbCBsZW5ndGhcbiAgICovXG4gIGdldCBmb2NhbExlbmd0aElubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuejtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgZmFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlXG4gICAqL1xuICBzZXQgekZhcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnMueSA9IHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgaW50ZXJuYWwgZmFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlXG4gICAqL1xuICBzZXQgekZhcklubmVyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnkgPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgZmFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgZmFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlXG4gICAqL1xuICBnZXQgekZhcklubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIGdldCB6RmFyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLnk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZmllbGQgb2YgdmlldyBhbmQgYWRqdXN0cyB0aGUgZmlsbSBzaXplIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBAcGFyYW0gZGVncmVlIC0gVGhlIGZpZWxkIG9mIHZpZXcgaW4gZGVncmVlc1xuICAgKi9cbiAgc2V0Rm92eUFuZENoYW5nZUZpbG1TaXplKGRlZ3JlZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVycy56ID0gZGVncmVlO1xuICAgIHRoaXMuX2ZpbG1IZWlnaHQgPSAyICogdGhpcy5mb2NhbExlbmd0aCAqIE1hdGgudGFuKE1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKGRlZ3JlZSkgLyAyKTtcbiAgICB0aGlzLl9maWxtV2lkdGggPSB0aGlzLl9maWxtSGVpZ2h0ICogdGhpcy5hc3BlY3Q7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZmllbGQgb2YgdmlldyBhbmQgYWRqdXN0cyB0aGUgZm9jYWwgbGVuZ3RoIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBAcGFyYW0gZGVncmVlIC0gVGhlIGZpZWxkIG9mIHZpZXcgaW4gZGVncmVlc1xuICAgKi9cbiAgc2V0Rm92eUFuZENoYW5nZUZvY2FsTGVuZ3RoKGRlZ3JlZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVycy56ID0gZGVncmVlO1xuICAgIHRoaXMuX2ZvY2FsTGVuZ3RoID0gdGhpcy5fZmlsbUhlaWdodCAvIDIgLyBNYXRoLnRhbihNYXRoVXRpbC5kZWdyZWVUb1JhZGlhbihkZWdyZWUpIC8gMik7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmllbGQgb2Ygdmlldy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGZpZWxkIG9mIHZpZXcgaW4gZGVncmVlc1xuICAgKi9cbiAgZ2V0IGZvdnkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMuejtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBmaWVsZCBvZiB2aWV3LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGludGVybmFsIGZpZWxkIG9mIHZpZXcgaW4gZGVncmVlc1xuICAgKi9cbiAgc2V0IGZvdnlJbm5lcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci56ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFzcGVjdCByYXRpbyBhbmQgYWRqdXN0cyB0aGUgZmlsbSB3aWR0aCBhY2NvcmRpbmdseS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBhc3BlY3QgcmF0aW8gKHdpZHRoL2hlaWdodClcbiAgICovXG4gIHNldCBhc3BlY3QodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSB2YWw7XG4gICAgdGhpcy5fZmlsbVdpZHRoID0gdGhpcy5fZmlsbUhlaWdodCAqIHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBhc3BlY3QgcmF0aW8uXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgaW50ZXJuYWwgYXNwZWN0IHJhdGlvXG4gICAqL1xuICBzZXQgYXNwZWN0SW5uZXIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudyA9IHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBhc3BlY3QgcmF0aW8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBhc3BlY3QgcmF0aW9cbiAgICovXG4gIGdldCBhc3BlY3RJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYXNwZWN0IHJhdGlvLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYXNwZWN0IHJhdGlvXG4gICAqL1xuICBnZXQgYXNwZWN0KCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLnc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgWCBtYWduaWZpY2F0aW9uIGZvciBvcnRob2dyYXBoaWMgcHJvamVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBYIG1hZ25pZmljYXRpb24gdmFsdWVcbiAgICovXG4gIHNldCB4TWFnKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVycy56ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFggbWFnbmlmaWNhdGlvbiBmb3Igb3J0aG9ncmFwaGljIHByb2plY3Rpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBYIG1hZ25pZmljYXRpb24gdmFsdWVcbiAgICovXG4gIGdldCB4TWFnKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLno7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgWSBtYWduaWZpY2F0aW9uIGZvciBvcnRob2dyYXBoaWMgcHJvamVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBZIG1hZ25pZmljYXRpb24gdmFsdWVcbiAgICovXG4gIHNldCB5TWFnKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVycy53ID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFkgbWFnbmlmaWNhdGlvbiBmb3Igb3J0aG9ncmFwaGljIHByb2plY3Rpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBZIG1hZ25pZmljYXRpb24gdmFsdWVcbiAgICovXG4gIGdldCB5TWFnKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLnc7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgY2FtZXJhIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYW1lcmEgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllclxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuQ2FtZXJhQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgY2FtZXJhIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNhbWVyYSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBnZXQgY29tcG9uZW50VElEKCk6IENvbXBvbmVudFRJRCB7XG4gICAgcmV0dXJuIFdlbGxLbm93bkNvbXBvbmVudFRJRHMuQ2FtZXJhQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgYW5kIHJldHVybnMgdGhlIHByb2plY3Rpb24gbWF0cml4IGJhc2VkIG9uIGNhbWVyYSBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2FsY3VsYXRlZCBwcm9qZWN0aW9uIG1hdHJpeFxuICAgKi9cbiAgY2FsY1Byb2plY3Rpb25NYXRyaXgoKSB7XG4gICAgY29uc3Qgek5lYXIgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueDtcbiAgICBjb25zdCB6RmFyID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnk7XG5cbiAgICBpZiAodGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICBpZiAodGhpcy50eXBlID09PSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlKSB7XG4gICAgICAgIGNvbnN0IGZvdnkgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuejtcbiAgICAgICAgbGV0IGFzcGVjdCA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci53O1xuICAgICAgICBpZiAoYXNwZWN0IDwgMCkge1xuICAgICAgICAgIGFzcGVjdCA9IHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUudmlld3BvcnRBc3BlY3RSYXRpbztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB5c2NhbGUgPSAxLjAgLyBNYXRoLnRhbigoMC41ICogZm92eSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICAgICAgY29uc3QgeHNjYWxlID0geXNjYWxlIC8gYXNwZWN0O1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMCA9IHhzY2FsZTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMDEgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMiA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAzID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMTAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMSA9IHlzY2FsZTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMTIgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMyA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIwID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjEgPSAwO1xuICAgICAgICBpZiAoekZhciA9PT0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKSB7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjIgPSAtMTtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMyA9IC16TmVhcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBuZiA9IDEgLyAoek5lYXIgLSB6RmFyKTtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9IHpGYXIgKiBuZjtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMyA9IHpGYXIgKiB6TmVhciAqIG5mO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMwID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzEgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMiA9IC0xO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMyA9IDA7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWMpIHtcbiAgICAgICAgY29uc3QgeG1hZyA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICAgICAgICBjb25zdCB5bWFnID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnc7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguc2V0Q29tcG9uZW50cyhcbiAgICAgICAgICAxIC8geG1hZyxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDEgLyB5bWFnLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgLTEgLyAoekZhciAtIHpOZWFyKSxcbiAgICAgICAgICAtek5lYXIgLyAoekZhciAtIHpOZWFyKSxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAxLjBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLl9jb3JuZXJJbm5lci54O1xuICAgICAgICBjb25zdCByaWdodCA9IHRoaXMuX2Nvcm5lcklubmVyLnk7XG4gICAgICAgIGNvbnN0IHRvcCA9IHRoaXMuX2Nvcm5lcklubmVyLno7XG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IHRoaXMuX2Nvcm5lcklubmVyLnc7XG4gICAgICAgIGNvbnN0IG5mID0gMSAvICh6TmVhciAtIHpGYXIpO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4LnNldENvbXBvbmVudHMoXG4gICAgICAgICAgKDIgKiB6TmVhcikgLyAocmlnaHQgLSBsZWZ0KSxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgKHJpZ2h0ICsgbGVmdCkgLyAocmlnaHQgLSBsZWZ0KSxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgICgyICogek5lYXIpIC8gKHRvcCAtIGJvdHRvbSksXG4gICAgICAgICAgKHRvcCArIGJvdHRvbSkgLyAodG9wIC0gYm90dG9tKSxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICB6RmFyICogbmYsXG4gICAgICAgICAgekZhciAqIHpOZWFyICogbmYsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAtMS4wLFxuICAgICAgICAgIDAuMFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy50eXBlID09PSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlKSB7XG4gICAgICAgIGNvbnN0IGZvdnkgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuejtcbiAgICAgICAgbGV0IGFzcGVjdCA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci53O1xuICAgICAgICBpZiAoYXNwZWN0IDwgMCkge1xuICAgICAgICAgIGFzcGVjdCA9IHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUudmlld3BvcnRBc3BlY3RSYXRpbztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB5c2NhbGUgPSAxLjAgLyBNYXRoLnRhbigoMC41ICogZm92eSAqIE1hdGguUEkpIC8gMTgwKTtcbiAgICAgICAgY29uc3QgeHNjYWxlID0geXNjYWxlIC8gYXNwZWN0O1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMCA9IHhzY2FsZTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMDEgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMiA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAzID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMTAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMSA9IHlzY2FsZTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMTIgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMyA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIwID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjEgPSAwO1xuICAgICAgICBpZiAoekZhciA9PT0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKSB7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjIgPSAtMTtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMyA9IC0yICogek5lYXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgbmYgPSAxIC8gKHpOZWFyIC0gekZhcik7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjIgPSAoekZhciArIHpOZWFyKSAqIG5mO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gMi4wICogekZhciAqIHpOZWFyICogbmY7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMyID0gLTE7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMzID0gMDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSBDYW1lcmFUeXBlLk9ydGhvZ3JhcGhpYykge1xuICAgICAgICBjb25zdCB4bWFnID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLno7XG4gICAgICAgIGNvbnN0IHltYWcgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudztcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5zZXRDb21wb25lbnRzKFxuICAgICAgICAgIDEgLyB4bWFnLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMSAvIHltYWcsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAtMiAvICh6RmFyIC0gek5lYXIpLFxuICAgICAgICAgIC0oekZhciArIHpOZWFyKSAvICh6RmFyIC0gek5lYXIpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDEuMFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2Nvcm5lcklubmVyLng7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5fY29ybmVySW5uZXIueTtcbiAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fY29ybmVySW5uZXIuejtcbiAgICAgICAgY29uc3QgYm90dG9tID0gdGhpcy5fY29ybmVySW5uZXIudztcbiAgICAgICAgY29uc3QgbmYgPSAxIC8gKHpOZWFyIC0gekZhcik7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguc2V0Q29tcG9uZW50cyhcbiAgICAgICAgICAoMiAqIHpOZWFyKSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAocmlnaHQgKyBsZWZ0KSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgKDIgKiB6TmVhcikgLyAodG9wIC0gYm90dG9tKSxcbiAgICAgICAgICAodG9wICsgYm90dG9tKSAvICh0b3AgLSBib3R0b20pLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgICh6RmFyICsgek5lYXIpICogbmYsXG4gICAgICAgICAgMiAqIHpGYXIgKiB6TmVhciAqIG5mLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgLTEuMCxcbiAgICAgICAgICAwLjBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcHJvamVjdGlvbk1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGFuZCByZXR1cm5zIHRoZSB2aWV3IG1hdHJpeCBiYXNlZCBvbiBjYW1lcmEgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2FsY3VsYXRlZCB2aWV3IG1hdHJpeFxuICAgKi9cbiAgY2FsY1ZpZXdNYXRyaXgoKSB7XG4gICAgY29uc3QgZXllID0gdGhpcy5leWVJbm5lcjtcbiAgICBjb25zdCBmID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyh0aGlzLl9kaXJlY3Rpb25Jbm5lciwgZXllLCBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzApLm5vcm1hbGl6ZSgpO1xuICAgIGNvbnN0IHMgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKGYsIHRoaXMuX3VwSW5uZXIsIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMSkubm9ybWFsaXplKCk7XG4gICAgY29uc3QgdSA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8ocywgZiwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18yKTtcblxuICAgIHRoaXMuX3ZpZXdNYXRyaXguc2V0Q29tcG9uZW50cyhcbiAgICAgIHMueCxcbiAgICAgIHMueSxcbiAgICAgIHMueixcbiAgICAgIC1WZWN0b3IzLmRvdChzLCBleWUpLFxuICAgICAgdS54LFxuICAgICAgdS55LFxuICAgICAgdS56LFxuICAgICAgLVZlY3RvcjMuZG90KHUsIGV5ZSksXG4gICAgICAtZi54LFxuICAgICAgLWYueSxcbiAgICAgIC1mLnosXG4gICAgICBWZWN0b3IzLmRvdChmLCBleWUpLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMVxuICAgICk7XG5cbiAgICBpZiAoIXRoaXMucHJpbWl0aXZlTW9kZSkge1xuICAgICAgY29uc3QgaW52ZXJ0V29ybGRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaW52ZXJ0VG8oXG4gICAgICAgIHRoaXMuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5tYXRyaXhJbm5lcixcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMFxuICAgICAgKTtcblxuICAgICAgdGhpcy5fdmlld01hdHJpeC5tdWx0aXBseShpbnZlcnRXb3JsZE1hdHJpeCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlldyBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2aWV3IG1hdHJpeFxuICAgKi9cbiAgZ2V0IHZpZXdNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlldyBtYXRyaXguXG4gICAqXG4gICAqIEBwYXJhbSB2aWV3TWF0cml4IC0gVGhlIHZpZXcgbWF0cml4IHRvIHNldFxuICAgKi9cbiAgc2V0IHZpZXdNYXRyaXgodmlld01hdHJpeDogTWF0cml4NDQpIHtcbiAgICB0aGlzLl92aWV3TWF0cml4LmNvcHlDb21wb25lbnRzKHZpZXdNYXRyaXgpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHByb2plY3Rpb24gbWF0cml4LCBjb25zaWRlcmluZyBYUiBtb2RlIGlmIGFwcGxpY2FibGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCAobWF5IGJlIFhSLXNwZWNpZmljIG1hdHJpeCBpZiBpbiBYUiBtb2RlKVxuICAgKi9cbiAgZ2V0IHByb2plY3Rpb25NYXRyaXgoKSB7XG4gICAgaWYgKHRoaXMuX3hyTGVmdCB8fCB0aGlzLl94clJpZ2h0KSB7XG4gICAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX19lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYlhSU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBpZiAodGhpcy5feHJMZWZ0KSB7XG4gICAgICAgICAgcmV0dXJuIHdlYlhSU3lzdGVtLmxlZnRQcm9qZWN0aW9uTWF0cml4O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl94clJpZ2h0KSB7XG4gICAgICAgICAgcmV0dXJuIHdlYlhSU3lzdGVtLnJpZ2h0UHJvamVjdGlvbk1hdHJpeDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcHJvamVjdGlvbk1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwcm9qZWN0aW9uIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHByb2plY3Rpb25NYXRyaXggLSBUaGUgcHJvamVjdGlvbiBtYXRyaXggdG8gc2V0XG4gICAqL1xuICBzZXQgcHJvamVjdGlvbk1hdHJpeChwcm9qZWN0aW9uTWF0cml4OiBNYXRyaXg0NCkge1xuICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguY29weUNvbXBvbmVudHMocHJvamVjdGlvbk1hdHJpeCk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHByb2plY3Rpb24gbWF0cml4IHRoYXQgaXMgdXBsb2FkZWQgdG8gdGhlIEdQVSAoaW4gWFIgbW9kZSwgdGhlIG1hdHJpeCBvZiB0aGUgZXllIGNvcGllZCBpbiAkbG9naWMpLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfcHJvamVjdGlvbk1hdHJpeEZvckdwdSgpOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb2plY3Rpb25NYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGxpZ2h0IGNsdXN0ZXIgdmlldyBpbmZvIHVwbG9hZGVkIHRvIHRoZSBHUFUuXG4gICAqIHg6IHRoZSB2ZWM0IGluZGV4IG9mIHRoZSBsaWdodCBjbHVzdGVyIHZpZXcgcmVnaW9uIG9mIHRoaXMgY2FtZXJhICgtMTogbm9uZSkuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9saWdodENsdXN0ZXJWaWV3SW5mb0ZvckdwdSgpOiBNdXRhYmxlVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2xpZ2h0Q2x1c3RlclZpZXdJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbWJpbmVkIHZpZXctcHJvamVjdGlvbiBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2aWV3LXByb2plY3Rpb24gbWF0cml4XG4gICAqL1xuICBnZXQgdmlld1Byb2plY3Rpb25NYXRyaXgoKSB7XG4gICAgcmV0dXJuIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKHRoaXMuX3Byb2plY3Rpb25NYXRyaXgsIHRoaXMuX3ZpZXdNYXRyaXgsIENhbWVyYUNvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJpYXMgdmlldy1wcm9qZWN0aW9uIG1hdHJpeCBmb3Igc2hhZG93IG1hcHBpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBiaWFzIHZpZXctcHJvamVjdGlvbiBtYXRyaXggYWRqdXN0ZWQgZm9yIHRoZSBjdXJyZW50IGdyYXBoaWNzIEFQSVxuICAgKi9cbiAgZ2V0IGJpYXNWaWV3UHJvamVjdGlvbk1hdHJpeCgpIHtcbiAgICBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyh0aGlzLl9wcm9qZWN0aW9uTWF0cml4LCB0aGlzLl92aWV3TWF0cml4LCBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8wKTtcbiAgICBpZiAodGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8oXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX2JpYXNNYXRyaXhXZWJHUFUsXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzAsXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzFcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyhcbiAgICAgIENhbWVyYUNvbXBvbmVudC5fX2JpYXNNYXRyaXhXZWJHTCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzAsXG4gICAgICBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8xXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGNhbWVyYSB2YWx1ZXMgKHBvc2l0aW9uKSB0byB0aGUgdmlld1Bvc2l0aW9uIG1lbWJlci5cbiAgICovXG4gIHByaXZhdGUgX19zZXRWYWx1ZXNUb1ZpZXdQb3NpdGlvbigpIHtcbiAgICB0aGlzLl92aWV3UG9zaXRpb24uY29weUNvbXBvbmVudHModGhpcy53b3JsZFBvc2l0aW9uKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3b3JsZCBwb3NpdGlvbiBvZiB0aGUgY2FtZXJhLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQgcG9zaXRpb24gdmVjdG9yXG4gICAqL1xuICBnZXQgd29ybGRQb3NpdGlvbigpIHtcbiAgICB0aGlzLmVudGl0eS5nZXRTY2VuZUdyYXBoKCkubWF0cml4SW5uZXIubXVsdGlwbHlWZWN0b3IzVG8odGhpcy5leWVJbm5lciwgQ2FtZXJhQ29tcG9uZW50LnJldHVyblZlY3RvcjMpO1xuICAgIHJldHVybiBDYW1lcmFDb21wb25lbnQucmV0dXJuVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjYW1lcmEgZnJ1c3R1bSBiYXNlZCBvbiBjdXJyZW50IHZpZXcgYW5kIHByb2plY3Rpb24gbWF0cmljZXMuXG4gICAqL1xuICB1cGRhdGVGcnVzdHVtKCkge1xuICAgIHRoaXMuX19mcnVzdHVtLnVwZGF0ZSh0aGlzLnZpZXdNYXRyaXgsIHRoaXMucHJvamVjdGlvbk1hdHJpeCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2FtZXJhIGZydXN0dW0gZm9yIGN1bGxpbmcgb3BlcmF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNhbWVyYSBmcnVzdHVtXG4gICAqL1xuICBnZXQgZnJ1c3R1bSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2ZydXN0dW07XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgdGhlIGNhbWVyYSBjb21wb25lbnQgYW5kIG1vdmVzIGl0IHRvIHRoZSBsb2dpYyBzdGFnZS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICAkbG9hZCgpIHtcbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGxvZ2ljIHVwZGF0ZSBmb3IgdGhlIGNhbWVyYSBjb21wb25lbnQuXG4gICAqIFVwZGF0ZXMgdmlldyBhbmQgcHJvamVjdGlvbiBtYXRyaWNlcywgaGFuZGxlcyBsaWdodCBzeW5jaHJvbml6YXRpb24sIGFuZCBtYW5hZ2VzIFhSIG1vZGUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgJGxvZ2ljKCkge1xuICAgIGNvbnN0IGxpZ2h0Q29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRMaWdodCgpO1xuICAgIGxldCBsaWdodENvbXBvbmVudFVwZGF0ZUNvdW50ID0gbGlnaHRDb21wb25lbnQgIT0gbnVsbCA/IGxpZ2h0Q29tcG9uZW50LnVwZGF0ZUNvdW50IDogLTE7XG4gICAgaWYgKFxuICAgICAgdGhpcy5fX2xhc3RVcGRhdGVDb3VudCA9PT0gdGhpcy5fX3VwZGF0ZUNvdW50ICYmXG4gICAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9PT0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpICYmXG4gICAgICB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID09PSBsaWdodENvbXBvbmVudFVwZGF0ZUNvdW50ICYmXG4gICAgICB0aGlzLl9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPT09IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc1N5bmNUb0xpZ2h0ICYmIElzLmV4aXN0KGxpZ2h0Q29tcG9uZW50KSkge1xuICAgICAgLy8gZm9yIFNoYWRvdyBNYXBwaW5nXG4gICAgICAvLyBJTVBPUlRBTlQ6XG4gICAgICAvLyBleWVJbm5lciAvIGRpcmVjdGlvbklubmVyIC8gdXBJbm5lciBhcmUgZGVmaW5lZCBpbiB0aGUgY2FtZXJhJ3MgKmxvY2FsKiBzcGFjZS5cbiAgICAgIC8vIGNhbGNWaWV3TWF0cml4KCkgbGF0ZXIgbXVsdGlwbGllcyBieSBpbnZlcnNlKGVudGl0eS53b3JsZE1hdHJpeCkgd2hlbiBwcmltaXRpdmVNb2RlIGlzIGZhbHNlLlxuICAgICAgLy9cbiAgICAgIC8vIFNldHRpbmcgd29ybGQtc3BhY2UgdmFsdWVzIGhlcmUgY2F1c2VzIHRoZSBlbnRpdHkgdHJhbnNmb3JtIHRvIGJlIGFwcGxpZWQgdHdpY2UsXG4gICAgICAvLyB3aGljaCBtYWtlcyB0aGUgc2hhZG93IHByb2plY3Rpb24gbW92ZSByb3VnaGx5IDJ4IGFzIG11Y2ggYXMgdGhlIGxpZ2h0IHRyYW5zbGF0aW9uLlxuICAgICAgLy9cbiAgICAgIC8vIFRoZSBsaWdodCBkaXJlY3Rpb24gaXMgZGVyaXZlZCBmcm9tIHRoZSBlbnRpdHkgdHJhbnNmb3JtIChMaWdodENvbXBvbmVudCB1c2VzIGxvY2FsIC1aKSxcbiAgICAgIC8vIHNvIGtlZXBpbmcgdGhlIGNhbWVyYSBpbiBpdHMgY2Fub25pY2FsIGxvY2FsIG9yaWVudGF0aW9uIGlzIHN1ZmZpY2llbnQuXG4gICAgICB0aGlzLl9leWVJbm5lci5jb3B5Q29tcG9uZW50cyhDYW1lcmFDb21wb25lbnQuX2V5ZSk7IC8vIGxvY2FsIG9yaWdpblxuICAgICAgdGhpcy5fZGlyZWN0aW9uSW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fZGlyZWN0aW9uKTsgLy8gbG9jYWwgbG9vay1hdCB0YXJnZXQgKHRvd2FyZHMgLVopXG4gICAgICB0aGlzLl91cElubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX3VwKTsgLy8gbG9jYWwgK1lcblxuICAgICAgaWYgKGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5TcG90KSB7XG4gICAgICAgIHRoaXMudHlwZSA9IENhbWVyYVR5cGUuUGVyc3BlY3RpdmU7XG4gICAgICAgIC8vIG91dGVyQ29uZUFuZ2xlIGlzIGEgaGFsZi1hbmdsZSwgc28gbXVsdGlwbHkgYnkgMiB0byBnZXQgdGhlIGZ1bGwgRk9WXG4gICAgICAgIHRoaXMuc2V0Rm92eUFuZENoYW5nZUZpbG1TaXplKE1hdGhVdGlsLnJhZGlhblRvRGVncmVlKGxpZ2h0Q29tcG9uZW50Lm91dGVyQ29uZUFuZ2xlICogMi4wKSk7XG4gICAgICAgIHRoaXMuX2Nvcm5lcklubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX2Nvcm5lcik7XG4gICAgICAgIHRoaXMuYXNwZWN0ID0gMTtcbiAgICAgICAgdGhpcy56TmVhciA9IGxpZ2h0Q29tcG9uZW50LnNoYWRvd1pOZWFyRm9yU3BvdExpZ2h0O1xuICAgICAgICAvLyBVc2UgYSByZWFzb25hYmxlIGRlZmF1bHQgekZhciBmb3Igc2hhZG93IG1hcHBpbmcgdG8gbWFpbnRhaW4gZGVwdGggcHJlY2lzaW9uXG4gICAgICAgIHRoaXMuekZhciA9IGxpZ2h0Q29tcG9uZW50LnJhbmdlICE9PSAtMSA/IGxpZ2h0Q29tcG9uZW50LnJhbmdlIDogMTAwO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fcGFyYW1ldGVycyk7XG4gICAgICB9IGVsc2UgaWYgKGxpZ2h0Q29tcG9uZW50LnR5cGUgPT09IExpZ2h0VHlwZS5EaXJlY3Rpb25hbCkge1xuICAgICAgICB0aGlzLnR5cGUgPSBDYW1lcmFUeXBlLk9ydGhvZ3JhcGhpYztcbiAgICAgICAgY29uc3QgYXJlYVNpemUgPSBsaWdodENvbXBvbmVudC5zaGFkb3dBcmVhU2l6ZUZvckRpcmVjdGlvbmFsTGlnaHQ7XG4gICAgICAgIHRoaXMuX2Nvcm5lcklubmVyLmNvcHlDb21wb25lbnRzKFZlY3RvcjQuZnJvbUNvcHk0KC1hcmVhU2l6ZSwgYXJlYVNpemUsIGFyZWFTaXplLCAtYXJlYVNpemUpKTtcbiAgICAgICAgdGhpcy5hc3BlY3QgPSAxO1xuICAgICAgICB0aGlzLnpOZWFyID0gbGlnaHRDb21wb25lbnQuc2hhZG93Wk5lYXJGb3JEaXJlY3Rpb25hbExpZ2h0O1xuICAgICAgICB0aGlzLnpGYXIgPSBsaWdodENvbXBvbmVudC5yYW5nZSAhPT0gLTEgPyBsaWdodENvbXBvbmVudC5yYW5nZSA6IDEwMDtcbiAgICAgICAgLy8gRm9yIE9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uLCBfcGFyYW1ldGVyc0lubmVyLnogaXMgeG1hZyBhbmQgX3BhcmFtZXRlcnNJbm5lci53IGlzIHltYWdcbiAgICAgICAgLy8gVGhlc2UgYXJlIHRoZSBoYWxmLXdpZHRocyB1c2VkIGluIGNhbGNQcm9qZWN0aW9uTWF0cml4IGZvciBvcnRob2dyYXBoaWMgY2FtZXJhc1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueCA9IHRoaXMuek5lYXI7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci55ID0gdGhpcy56RmFyO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueiA9IGFyZWFTaXplOyAvLyB4bWFnIChoYWxmLXdpZHRoKVxuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudyA9IGFyZWFTaXplOyAvLyB5bWFnIChoYWxmLWhlaWdodClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0Q2FtZXJhQ29udHJvbGxlcigpO1xuICAgICAgaWYgKElzLmV4aXN0KGNhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQpKSB7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gdGhpcy5fcGFyYW1ldGVycy53O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCF0aGlzLnByaW1pdGl2ZU1vZGUpIHtcbiAgICAgICAgICB0aGlzLl9leWVJbm5lci5jb3B5Q29tcG9uZW50cyhDYW1lcmFDb21wb25lbnQuX2V5ZSk7XG4gICAgICAgICAgdGhpcy5fZGlyZWN0aW9uSW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fZGlyZWN0aW9uKTtcbiAgICAgICAgICB0aGlzLl91cElubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX3VwKTtcbiAgICAgICAgICB0aGlzLl9jb3JuZXJJbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl9jb3JuZXIpO1xuICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl9wYXJhbWV0ZXJzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY2FsY1ZpZXdNYXRyaXgoKTtcblxuICAgIGlmICh0aGlzLl94ckxlZnQgfHwgdGhpcy5feHJSaWdodCkge1xuICAgICAgLy8gSW4gWFIgbW9kZSwgZ2V0IHRoZSBwcm9qZWN0aW9uIG1hdHJpeCBmcm9tIFdlYlhSU3lzdGVtXG4gICAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX19lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYlhSU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBpZiAodGhpcy5feHJMZWZ0KSB7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5jb3B5Q29tcG9uZW50cyh3ZWJYUlN5c3RlbS5sZWZ0UHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5feHJSaWdodCkge1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguY29weUNvbXBvbmVudHMod2ViWFJTeXN0ZW0ucmlnaHRQcm9qZWN0aW9uTWF0cml4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbGNQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgfVxuICAgIHRoaXMuX19zZXRWYWx1ZXNUb1ZpZXdQb3NpdGlvbigpO1xuXG4gICAgdGhpcy5fX2xhc3RVcGRhdGVDb3VudCA9IHRoaXMuX191cGRhdGVDb3VudDtcbiAgICB0aGlzLl9fbGFzdFRyYW5zZm9ybUNvbXBvbmVudHNVcGRhdGVDb3VudCA9IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgICB0aGlzLl9fbGFzdExpZ2h0Q29tcG9uZW50c1VwZGF0ZUNvdW50ID0gbGlnaHRDb21wb25lbnRVcGRhdGVDb3VudDtcbiAgICB0aGlzLl9fbGFzdENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnRzVXBkYXRlQ291bnQgPSBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGVudGl0eSB3aGljaCBoYXMgdGhpcyBjYW1lcmEgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHdoaWNoIGhhcyB0aGlzIGNvbXBvbmVudFxuICAgKi9cbiAgZ2V0IGVudGl0eSgpOiBJQ2FtZXJhRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZS5lbnRpdHlSZXBvc2l0b3J5LmdldEVudGl0eSh0aGlzLl9fZW50aXR5VWlkKSBhcyB1bmtub3duIGFzIElDYW1lcmFFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGlzIGNhbWVyYSBjb21wb25lbnQgdG8gYW4gZW50aXR5LCBleHRlbmRpbmcgaXQgd2l0aCBjYW1lcmEtc3BlY2lmaWMgbWV0aG9kcy5cbiAgICpcbiAgICogQHBhcmFtIGJhc2UgLSBUaGUgdGFyZ2V0IGVudGl0eVxuICAgKiBAcGFyYW0gX2NvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byBhZGRcbiAgICogQHJldHVybnMgVGhlIGVudGl0eSBleHRlbmRlZCB3aXRoIGNhbWVyYSBjb21wb25lbnQgbWV0aG9kc1xuICAgKiBAb3ZlcnJpZGVcbiAgICovXG4gIGFkZFRoaXNDb21wb25lbnRUb0VudGl0eTxFbnRpdHlCYXNlQ2xhc3MgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlQ2xhc3MsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgQ2FtZXJhRW50aXR5IGV4dGVuZHMgKGJhc2UuY29uc3RydWN0b3IgYXMgYW55KSB7XG4gICAgICAvKipcbiAgICAgICAqIEdldHMgdGhlIGNhbWVyYSBjb21wb25lbnQgb2YgdGhpcyBlbnRpdHkuXG4gICAgICAgKlxuICAgICAgICogQHJldHVybnMgVGhlIGNhbWVyYSBjb21wb25lbnRcbiAgICAgICAqL1xuICAgICAgZ2V0Q2FtZXJhKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLkNhbWVyYUNvbXBvbmVudFRJRCkgYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBhcHBseU1peGlucyhiYXNlLCBDYW1lcmFFbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlQ2xhc3M7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHN0YXRpYyByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzcGVjaWZpZWQgZW5naW5lLlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZSB0byBjbGVhbiB1cCByZXNvdXJjZXMgZm9yXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKGVuZ2luZTogRW5naW5lKTogdm9pZCB7XG4gICAgQ2FtZXJhQ29tcG9uZW50Ll9fY3VycmVudE1hcC5kZWxldGUoZW5naW5lLmVuZ2luZVVpZCk7XG4gIH1cbn1cblxuQ2FtZXJhQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAndmlld01hdHJpeCcsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVNYXRyaXg0NCxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuTWF0NCxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdLFxufSk7XG5DYW1lcmFDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdwcm9qZWN0aW9uTWF0cml4JyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZU1hdHJpeDQ0LFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5NYXQ0LFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0sXG59KTtcbkNhbWVyYUNvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ3ZpZXdQb3NpdGlvbicsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3IzLFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMCwgMCwgMF0sXG59KTtcbkNhbWVyYUNvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ2xpZ2h0Q2x1c3RlclZpZXdJbmZvJyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZVZlY3RvcjQsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFstMSwgMCwgMCwgMF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUEwQztBQUNuRCxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGtCQUF1QztBQUNoRCxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLGVBQWU7QUFFeEIsU0FB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
