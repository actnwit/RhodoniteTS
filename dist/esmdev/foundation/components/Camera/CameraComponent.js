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
import { _getCameraControllerUpdateCount } from "../CameraController/CameraControllerUpdateCount.js";
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
    this.Cc = CameraType.Perspective;
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
    this.Fc = new Frustum();
    this.ia = 0;
    this.Gc = -1;
    this.Hc = -1;
    this.Ic = -1;
    this.Jc = -1;
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
    return (_a = this.zc.get(engine.engineUid)) != null ? _a : -1;
  }
  /**
   * Sets the current active camera component for a specific engine.
   *
   * @param engine - The engine instance
   * @param componentSID - The component system identifier of the camera to set as current
   */
  static setCurrent(engine, componentSID) {
    this.zc.set(engine.engineUid, componentSID);
  }
  /**
   * Gets the update count for this camera component.
   *
   * @returns The number of times this camera has been updated
   */
  get updateCount() {
    return this.ia;
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
    this.Cc = type;
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
    this.ia++;
  }
  /**
   * Gets the camera type.
   *
   * @returns The current camera type
   */
  get type() {
    return this.Cc;
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
    this.ia++;
  }
  /**
   * Sets the internal up vector.
   *
   * @param vec - The vector to set as the internal up direction
   */
  set upInner(vec) {
    this._upInner.copyComponents(vec);
    this.ia++;
  }
  /**
   * Sets the up vector of the camera.
   *
   * @param vec - The vector to set as the up direction
   */
  set up(vec) {
    this._up.copyComponents(vec);
    this.ia++;
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
      _CameraComponent.Dc
    );
    const isOrthogonalNewDirectionAndOldUp = orthogonalVectorNewDirectionAndOldUp.length() === 0;
    let newUpNonNormalize;
    if (isOrthogonalNewDirectionAndOldUp) {
      const relativeXaxis = MutableVector3.crossTo(oldDirection, oldUp, _CameraComponent.Ac);
      newUpNonNormalize = MutableVector3.crossTo(relativeXaxis, newDirection, _CameraComponent.Bc);
    } else {
      const newDirectionComponentInOldUp = MutableVector3.multiplyTo(
        newDirection,
        newDirection.dot(oldUp),
        _CameraComponent.Ac
      );
      newUpNonNormalize = MutableVector3.subtractTo(
        oldUp,
        newDirectionComponentInOldUp,
        _CameraComponent.Bc
      );
    }
    this._up.copyComponents(newUpNonNormalize).normalize();
    this._direction.copyComponents(newDirection);
    this.ia++;
  }
  /**
   * Sets the internal direction vector.
   *
   * @param vec - The vector to set as the internal direction
   */
  set directionInner(vec) {
    this._directionInner.copyComponents(vec);
    this.ia++;
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
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the internal left clipping plane position.
   *
   * @param value - The internal left clipping plane position
   */
  set leftInner(value) {
    this._cornerInner.x = value;
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the internal right clipping plane position.
   *
   * @param value - The internal right clipping plane position
   */
  set rightInner(value) {
    this._cornerInner.y = value;
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the internal top clipping plane position.
   *
   * @param value - The internal top clipping plane position
   */
  set topInner(value) {
    this._cornerInner.z = value;
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the internal bottom clipping plane position.
   *
   * @param value - The internal bottom clipping plane position
   */
  set bottomInner(value) {
    this._cornerInner.w = value;
    this.ia++;
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
    this.ia++;
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
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the internal near clipping plane distance.
   *
   * @param val - The internal near clipping plane distance
   */
  set zNearInner(val) {
    this._parametersInner.x = val;
    this.ia++;
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
    this.ia++;
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
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the internal far clipping plane distance.
   *
   * @param val - The internal far clipping plane distance
   */
  set zFarInner(val) {
    this._parametersInner.y = val;
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the field of view and adjusts the focal length accordingly.
   *
   * @param degree - The field of view in degrees
   */
  setFovyAndChangeFocalLength(degree) {
    this._parameters.z = degree;
    this._focalLength = this._filmHeight / 2 / Math.tan(MathUtil.degreeToRadian(degree) / 2);
    this.ia++;
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
    this.ia++;
  }
  /**
   * Sets the aspect ratio and adjusts the film width accordingly.
   *
   * @param val - The aspect ratio (width/height)
   */
  set aspect(val) {
    this._parameters.w = val;
    this._filmWidth = this._filmHeight * val;
    this.ia++;
  }
  /**
   * Sets the internal aspect ratio.
   *
   * @param val - The internal aspect ratio
   */
  set aspectInner(val) {
    this._parametersInner.w = val;
    this.ia++;
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
    this.ia++;
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
    if (this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.type === CameraType.Perspective) {
        const fovy = this._parametersInner.z;
        let aspect = this._parametersInner.w;
        if (aspect < 0) {
          aspect = this.c.engineState.viewportAspectRatio;
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
          aspect = this.c.engineState.viewportAspectRatio;
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
    const f = MutableVector3.subtractTo(this._directionInner, eye, _CameraComponent.Dc).normalize();
    const s = MutableVector3.crossTo(f, this._upInner, _CameraComponent.Ac).normalize();
    const u = MutableVector3.crossTo(s, f, _CameraComponent.Bc);
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
        _CameraComponent.yc
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
    this.ia++;
  }
  /**
   * Gets the projection matrix, considering XR mode if applicable.
   *
   * @returns The projection matrix (may be XR-specific matrix if in XR mode)
   */
  get projectionMatrix() {
    if (this._xrLeft || this._xrRight) {
      const webXRSystem = this.c._webXRSystemIfEnabled;
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
    this.ia++;
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
    return MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, _CameraComponent.yc);
  }
  /**
   * Gets the bias view-projection matrix for shadow mapping.
   *
   * @returns The bias view-projection matrix adjusted for the current graphics API
   */
  get biasViewProjectionMatrix() {
    MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, _CameraComponent.yc);
    if (this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return MutableMatrix44.multiplyTo(
        _CameraComponent.Lc,
        _CameraComponent.yc,
        _CameraComponent.Ec
      );
    }
    return MutableMatrix44.multiplyTo(
      _CameraComponent.Kc,
      _CameraComponent.yc,
      _CameraComponent.Ec
    );
  }
  /**
   * Sets camera values (position) to the viewPosition member.
   */
  Mc() {
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
    this.Fc.update(this.viewMatrix, this.projectionMatrix);
  }
  /**
   * Gets the camera frustum for culling operations.
   *
   * @returns The camera frustum
   */
  get frustum() {
    return this.Fc;
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
    if (this.Gc === this.ia && this.Hc === TransformComponent.getUpdateCount(this.c) && this.Ic === lightComponentUpdateCount && this.Jc === _getCameraControllerUpdateCount(this.c)) {
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
      const webXRSystem = this.c._webXRSystemIfEnabled;
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
    this.Mc();
    this.Gc = this.ia;
    this.Hc = TransformComponent.getUpdateCount(this.c);
    this.Ic = lightComponentUpdateCount;
    this.Jc = _getCameraControllerUpdateCount(this.c);
  }
  /**
   * Gets the entity which has this camera component.
   *
   * @returns The entity which has this component
   */
  get entity() {
    return this.c.entityRepository.getEntity(this.Qb);
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
    _CameraComponent.zc.delete(engine.engineUid);
  }
};
_CameraComponent._eye = Vector3.zero();
_CameraComponent.zc = /* @__PURE__ */ new Map();
_CameraComponent.returnVector3 = MutableVector3.zero();
_CameraComponent.Dc = MutableVector3.zero();
_CameraComponent.Ac = MutableVector3.zero();
_CameraComponent.Bc = MutableVector3.zero();
_CameraComponent.yc = MutableMatrix44.zero();
_CameraComponent.Ec = MutableMatrix44.zero();
_CameraComponent.Kc = Matrix44.fromCopy16ColumnMajor(
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
_CameraComponent.Lc = Matrix44.fromCopy16ColumnMajor(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvbmVudFNJRCwgQ29tcG9uZW50VElELCBFbnRpdHlVSUQgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IElFbnRpdHkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eSc7XG5pbXBvcnQgeyBhcHBseU1peGlucywgdHlwZSBFbnRpdHlSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHlSZXBvc2l0b3J5JztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDYW1lcmFUeXBlLCB0eXBlIENhbWVyYVR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ2FtZXJhVHlwZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTGlnaHRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHsgRnJ1c3R1bSB9IGZyb20gJy4uLy4uL2dlb21ldHJ5L0ZydXN0dW0nO1xuaW1wb3J0IHR5cGUgeyBJQ2FtZXJhRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi8uLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQgfSBmcm9tICcuLi9DYW1lcmFDb250cm9sbGVyL0NhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kcyB9IGZyb20gJy4uL0NvbXBvbmVudFR5cGVzJztcbmltcG9ydCB7IFRyYW5zZm9ybUNvbXBvbmVudCB9IGZyb20gJy4uL1RyYW5zZm9ybS9UcmFuc2Zvcm1Db21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuXG4vKipcbiAqIFRoZSBDb21wb25lbnQgdGhhdCByZXByZXNlbnRzIGEgY2FtZXJhLlxuICpcbiAqIEByZW1hcmtzXG4gKiBUaGUgY2FtZXJhIGlzIGRlZmluZWQgc3VjaCB0aGF0IHRoZSBsb2NhbCArWCBheGlzIGlzIHRvIHRoZSByaWdodCxcbiAqIHRoZSBcImxlbnNcIiBsb29rcyB0b3dhcmRzIHRoZSBsb2NhbCAtWiBheGlzLFxuICogYW5kIHRoZSB0b3Agb2YgdGhlIGNhbWVyYSBpcyBhbGlnbmVkIHdpdGggdGhlIGxvY2FsICtZIGF4aXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYW1lcmFDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfZXllOiBWZWN0b3IzID0gVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX2V5ZUlubmVyOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBfZGlyZWN0aW9uOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAtMSk7XG4gIHByaXZhdGUgX2RpcmVjdGlvbklubmVyOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLmZyb21Db3B5MygwLCAwLCAtMSk7XG4gIHByaXZhdGUgX3VwOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLmZyb21Db3B5MygwLCAxLCAwKTtcbiAgcHJpdmF0ZSBfdXBJbm5lcjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgX2ZpbG1XaWR0aCA9IDM2OyAvLyBtaWxpIG1ldGVyXG4gIHByaXZhdGUgX2ZpbG1IZWlnaHQgPSAyNDsgLy8gbWlsaSBtZXRlclxuICBwcml2YXRlIF9mb2NhbExlbmd0aCA9IDIwO1xuICBwcml2YXRlIHByaW1pdGl2ZU1vZGUgPSBmYWxzZTtcbiAgLy8geDogbGVmdCwgeTpyaWdodCwgejp0b3AsIHc6IGJvdHRvbVxuICBwcml2YXRlIF9jb3JuZXI6IE11dGFibGVWZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuZnJvbUNvcHk0KC0xLCAxLCAxLCAtMSk7XG4gIHByaXZhdGUgX2Nvcm5lcklubmVyOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5NCgtMSwgMSwgMSwgLTEpO1xuXG4gIC8vIHg6IHpOZWFyLCB5OiB6RmFyLFxuICAvLyBpZiBwZXJzcGVjdGl2ZSwgejogZm92eSwgdzogYXNwZWN0XG4gIC8vIGlmIG9ydGhvLCB6OiB4bWFnLCB3OiB5bWFnXG4gIHByaXZhdGUgX3BhcmFtZXRlcnM6IE11dGFibGVWZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuZnJvbUNvcHk0KDAuMSwgMTAwMDAsIDkwLCAxKTtcbiAgcHJpdmF0ZSBfcGFyYW1ldGVyc0lubmVyOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5NCgwLjEsIDEwMDAwLCA5MCwgMSk7XG4gIHByaXZhdGUgX190eXBlOiBDYW1lcmFUeXBlRW51bSA9IENhbWVyYVR5cGUuUGVyc3BlY3RpdmU7XG5cbiAgcHJpdmF0ZSBfcHJvamVjdGlvbk1hdHJpeDogTXV0YWJsZU1hdHJpeDQ0ID0gTXV0YWJsZU1hdHJpeDQ0LmR1bW15KCk7XG4gIHByaXZhdGUgX3ZpZXdNYXRyaXg6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5kdW1teSgpO1xuICBwcml2YXRlIF92aWV3UG9zaXRpb246IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuZHVtbXkoKTtcbiAgLy8geDogdGhlIHZlYzQgaW5kZXggb2YgdGhlIGxpZ2h0IGNsdXN0ZXIgdmlldyByZWdpb24gb2YgdGhpcyBjYW1lcmEgaW4gdGhlIEdQVSBkYXRhICgtMTogbm9uZSkuIFdyaXR0ZW4gYnlcbiAgLy8gTGlnaHRDbHVzdGVyU3lzdGVtIGV2ZXJ5IGZyYW1lIChzZWUgTGlnaHRDbHVzdGVyU3lzdGVtLl9fYXNzaWduVmlld3MpLiBUaGUgc2hhZGVycyByZWFkIGl0IGFzIHRoZSBiYXNlIG9mIHRoZVxuICAvLyB2aWV3IGhlYWRlciwgdGhlIGNsdXN0ZXIgdGFibGUgYW5kIHRoZSBsaWdodCBpbmRleCBsaXN0IChXZWJHTDI6IHRocm91Z2ggdGhlIHVfbGlnaHRDbHVzdGVyVmlldyB1bmlmb3JtLFxuICAvLyBXZWJHUFU6IGZyb20gdGhlIEdQVSBpbnN0YW5jZSBkYXRhKS5cbiAgcHJpdmF0ZSBfbGlnaHRDbHVzdGVyVmlld0luZm86IE11dGFibGVWZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19jdXJyZW50TWFwOiBNYXA8bnVtYmVyLCBDb21wb25lbnRTSUQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyByZXR1cm5WZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjNfMDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjdG9yM18xOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3IzXzI6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcE1hdHJpeDQ0XzAgPSBNdXRhYmxlTWF0cml4NDQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcE1hdHJpeDQ0XzEgPSBNdXRhYmxlTWF0cml4NDQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX2JpYXNNYXRyaXhXZWJHTCA9IE1hdHJpeDQ0LmZyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICAwLjUsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuNSxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC41LFxuICAgIDAuMCxcbiAgICAwLjUsXG4gICAgMC41LFxuICAgIDAuNSxcbiAgICAxLjBcbiAgKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19iaWFzTWF0cml4V2ViR1BVID0gTWF0cml4NDQuZnJvbUNvcHkxNkNvbHVtbk1ham9yKFxuICAgIDAuNSxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgLTAuNSxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMS4wLFxuICAgIDAuMCxcbiAgICAwLjUsXG4gICAgMC41LFxuICAgIDAuMCxcbiAgICAxLjBcbiAgKTtcbiAgX3hyTGVmdCA9IGZhbHNlO1xuICBfeHJSaWdodCA9IGZhbHNlO1xuICBwdWJsaWMgaXNTeW5jVG9MaWdodCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX19mcnVzdHVtID0gbmV3IEZydXN0dW0oKTtcblxuICBwcml2YXRlIF9fdXBkYXRlQ291bnQgPSAwO1xuICBwcml2YXRlIF9fbGFzdFVwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQ2FtZXJhQ29tcG9uZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZW50aXR5VWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBlbnRpdHkgdGhpcyBjb21wb25lbnQgYmVsb25ncyB0b1xuICAgKiBAcGFyYW0gY29tcG9uZW50U2lkIC0gVGhlIGNvbXBvbmVudCBzeXN0ZW0gaWRlbnRpZmllclxuICAgKiBAcGFyYW0gZW50aXR5UmVwb3NpdG9yeSAtIFRoZSBlbnRpdHkgcmVwb3NpdG9yeSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkIGZyb20gYSBwb29sXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5UmVwb3NpdG9yeSwgaXNSZVVzZSk7XG5cbiAgICB0aGlzLnNldEZvdnlBbmRDaGFuZ2VGb2NhbExlbmd0aCg5MCk7XG5cbiAgICBpZiAoQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKSA9PT0gLTEpIHtcbiAgICAgIENhbWVyYUNvbXBvbmVudC5zZXRDdXJyZW50KGVuZ2luZSwgY29tcG9uZW50U2lkKTtcbiAgICB9XG5cbiAgICB0aGlzLnN1Ym1pdFRvQWxsb2NhdGlvbihlbmdpbmUuY29uZmlnLmNhbWVyYUNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldywgaXNSZVVzZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBhY3RpdmUgY2FtZXJhIGNvbXBvbmVudCBJRCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgc3lzdGVtIGlkZW50aWZpZXIgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIGNhbWVyYSBmb3IgdGhlIGVuZ2luZVxuICAgKi9cbiAgc3RhdGljIGdldEN1cnJlbnQoZW5naW5lOiBFbmdpbmUpOiBDb21wb25lbnRTSUQge1xuICAgIHJldHVybiB0aGlzLl9fY3VycmVudE1hcC5nZXQoZW5naW5lLmVuZ2luZVVpZCkgPz8gLTE7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBhY3RpdmUgY2FtZXJhIGNvbXBvbmVudCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBjb21wb25lbnRTSUQgLSBUaGUgY29tcG9uZW50IHN5c3RlbSBpZGVudGlmaWVyIG9mIHRoZSBjYW1lcmEgdG8gc2V0IGFzIGN1cnJlbnRcbiAgICovXG4gIHN0YXRpYyBzZXRDdXJyZW50KGVuZ2luZTogRW5naW5lLCBjb21wb25lbnRTSUQ6IENvbXBvbmVudFNJRCk6IHZvaWQge1xuICAgIHRoaXMuX19jdXJyZW50TWFwLnNldChlbmdpbmUuZW5naW5lVWlkLCBjb21wb25lbnRTSUQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwZGF0ZSBjb3VudCBmb3IgdGhpcyBjYW1lcmEgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHRpbWVzIHRoaXMgY2FtZXJhIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICovXG4gIGdldCB1cGRhdGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwZGF0ZSBjb3VudCBvZiB0aGUgY3VycmVudCBhY3RpdmUgY2FtZXJhLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlIGNvdW50IG9mIHRoZSBjdXJyZW50IGNhbWVyYSwgb3IgMCBpZiBubyBjYW1lcmEgaXMgYWN0aXZlXG4gICAqL1xuICBzdGF0aWMgZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KGVuZ2luZTogRW5naW5lKSB7XG4gICAgY29uc3QgY3VycmVudENhbWVyYUNvbXBvbmVudCA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSlcbiAgICApIGFzIHVua25vd24gYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIHJldHVybiBjdXJyZW50Q2FtZXJhQ29tcG9uZW50Py51cGRhdGVDb3VudCA/PyAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNhbWVyYSB0eXBlIChwZXJzcGVjdGl2ZSwgb3J0aG9ncmFwaGljLCBvciBmcnVzdHVtKS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgY2FtZXJhIHR5cGUgdG8gc2V0XG4gICAqL1xuICBzZXQgdHlwZSh0eXBlOiBDYW1lcmFUeXBlRW51bSkge1xuICAgIHRoaXMuX190eXBlID0gdHlwZTtcbiAgICBpZiAodHlwZSA9PT0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWMpIHtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnMueiA9IDE7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLncgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldEZvdnlBbmRDaGFuZ2VGb2NhbExlbmd0aCg5MCk7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSA5MDtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gMTtcbiAgICB9XG5cbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgdHlwZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgY2FtZXJhIHR5cGVcbiAgICovXG4gIGdldCB0eXBlKCkge1xuICAgIHJldHVybiB0aGlzLl9fdHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgZXllIHBvc2l0aW9uIChhbHdheXMgKDAsMCwwKSBpbiBSaG9kb25pdGUpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZXllIHBvc2l0aW9uIHZlY3RvciAoYWx3YXlzIHplcm8pXG4gICAqL1xuICBnZXQgZXllKCkge1xuICAgIC8vIEluIFJob2Rvbml0ZSwgZXllIGlzIGFsd2F5cyAoMCwwLDApLiBVc2UgVHJhbnNmb3JtQ29tcG9uZW50IGZvciBDYW1lcmEgcG9zaXRpb25pbmdcbiAgICByZXR1cm4gQ2FtZXJhQ29tcG9uZW50Ll9leWU7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gc2V0IHRoZSBleWUgcG9zaXRpb24gKHRocm93cyBlcnJvciBhcyB0aGlzIGlzIG5vdCBzdXBwb3J0ZWQpLlxuICAgKlxuICAgKiBAcGFyYW0gbm9Vc2VWZWMgLSBUaGUgdmVjdG9yIHRvIHNldCAobm90IHVzZWQpXG4gICAqIEB0aHJvd3MgQWx3YXlzIHRocm93cyBhbiBlcnJvciBhcyBleWUgcG9zaXRpb25pbmcgc2hvdWxkIHVzZSBUcmFuc2Zvcm1Db21wb25lbnRcbiAgICovXG4gIHNldCBleWUoX25vVXNlVmVjOiBWZWN0b3IzKSB7XG4gICAgdGhyb3cgRXJyb3IoJ0luIFJob2Rvbml0ZSwgZXllIGlzIGFsd2F5cyAoMCwwLDApLiBVc2UgVHJhbnNmb3JtQ29tcG9uZW50IGZvciBDYW1lcmEgcG9zaXRpb25pbmcuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IGV5ZUlubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9leWVJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBleWUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHNldCBhcyB0aGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc2V0IGV5ZUlubmVyKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX2V5ZUlubmVyLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgdXAgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIGludGVybmFsIHVwIGRpcmVjdGlvblxuICAgKi9cbiAgc2V0IHVwSW5uZXIodmVjOiBWZWN0b3IzKSB7XG4gICAgdGhpcy5fdXBJbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHVwIHZlY3RvciBvZiB0aGUgY2FtZXJhLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIHVwIGRpcmVjdGlvblxuICAgKi9cbiAgc2V0IHVwKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX3VwLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXAgdmVjdG9yIG9mIHRoZSBjYW1lcmEuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgdXAgdmVjdG9yXG4gICAqL1xuICBnZXQgdXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3VwLmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgdXAgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgdXAgdmVjdG9yXG4gICAqL1xuICBnZXQgdXBJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5fdXBJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gdmVjdG9yIG9mIHRoZSBjYW1lcmEgYW5kIGF1dG9tYXRpY2FsbHkgYWRqdXN0cyB0aGUgdXAgdmVjdG9yIHRvIHJlbWFpbiBvcnRob2dvbmFsLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIG5ldyBkaXJlY3Rpb24gdmVjdG9yIGZvciB0aGUgY2FtZXJhXG4gICAqL1xuICBzZXQgZGlyZWN0aW9uKHZlYzogVmVjdG9yMykge1xuICAgIGNvbnN0IG9sZERpcmVjdGlvbiA9IHRoaXMuX2RpcmVjdGlvbjtcbiAgICBjb25zdCBuZXdEaXJlY3Rpb24gPSB2ZWM7XG4gICAgY29uc3Qgb2xkVXAgPSB0aGlzLl91cDtcblxuICAgIGNvbnN0IG9ydGhvZ29uYWxWZWN0b3JOZXdEaXJlY3Rpb25BbmRPbGRVcCA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8oXG4gICAgICBuZXdEaXJlY3Rpb24sXG4gICAgICBvbGRVcCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMFxuICAgICk7XG4gICAgY29uc3QgaXNPcnRob2dvbmFsTmV3RGlyZWN0aW9uQW5kT2xkVXAgPSBvcnRob2dvbmFsVmVjdG9yTmV3RGlyZWN0aW9uQW5kT2xkVXAubGVuZ3RoKCkgPT09IDAuMDtcblxuICAgIGxldCBuZXdVcE5vbk5vcm1hbGl6ZTogTXV0YWJsZVZlY3RvcjM7XG4gICAgaWYgKGlzT3J0aG9nb25hbE5ld0RpcmVjdGlvbkFuZE9sZFVwKSB7XG4gICAgICBjb25zdCByZWxhdGl2ZVhheGlzID0gTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhvbGREaXJlY3Rpb24sIG9sZFVwLCBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzEpO1xuICAgICAgbmV3VXBOb25Ob3JtYWxpemUgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKHJlbGF0aXZlWGF4aXMsIG5ld0RpcmVjdGlvbiwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbmV3RGlyZWN0aW9uQ29tcG9uZW50SW5PbGRVcCA9IE11dGFibGVWZWN0b3IzLm11bHRpcGx5VG8oXG4gICAgICAgIG5ld0RpcmVjdGlvbixcbiAgICAgICAgbmV3RGlyZWN0aW9uLmRvdChvbGRVcCksXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMVxuICAgICAgKTtcbiAgICAgIG5ld1VwTm9uTm9ybWFsaXplID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhcbiAgICAgICAgb2xkVXAsXG4gICAgICAgIG5ld0RpcmVjdGlvbkNvbXBvbmVudEluT2xkVXAsXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMlxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cC5jb3B5Q29tcG9uZW50cyhuZXdVcE5vbk5vcm1hbGl6ZSkubm9ybWFsaXplKCk7XG4gICAgdGhpcy5fZGlyZWN0aW9uLmNvcHlDb21wb25lbnRzKG5ld0RpcmVjdGlvbik7XG5cbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBkaXJlY3Rpb24gdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIGludGVybmFsIGRpcmVjdGlvblxuICAgKi9cbiAgc2V0IGRpcmVjdGlvbklubmVyKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX2RpcmVjdGlvbklubmVyLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGlyZWN0aW9uIHZlY3RvciBvZiB0aGUgY2FtZXJhLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICovXG4gIGdldCBkaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RpcmVjdGlvbi5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGRpcmVjdGlvbiB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBkaXJlY3Rpb24gdmVjdG9yXG4gICAqL1xuICBnZXQgZGlyZWN0aW9uSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RpcmVjdGlvbklubmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvcm5lciBwYXJhbWV0ZXJzIChsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pIGZvciBmcnVzdHVtIGNhbWVyYS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBjb3JuZXIgdmVjdG9yICh4OiBsZWZ0LCB5OiByaWdodCwgejogdG9wLCB3OiBib3R0b20pXG4gICAqL1xuICBzZXQgY29ybmVyKHZlYzogVmVjdG9yNCkge1xuICAgIHRoaXMuX2Nvcm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvcm5lciBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGNvcm5lciB2ZWN0b3JcbiAgICovXG4gIGdldCBjb3JuZXIoKTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lci5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxlZnQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgbGVmdCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVyLnggPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgbGVmdCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IGxlZnRJbm5lcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVySW5uZXIueCA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGxlZnQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBnZXQgbGVmdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyLng7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSByaWdodCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IHJpZ2h0KHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9jb3JuZXIueSA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIHJpZ2h0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCByaWdodElubmVyKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9jb3JuZXJJbm5lci55ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByaWdodCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgZ2V0IHJpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLl9jb3JuZXIueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCB0b3AodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lci56ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgdG9wSW5uZXIodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lcklubmVyLnogPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIGdldCB0b3AoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lci56O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IGJvdHRvbSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVyLncgPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBpbnRlcm5hbCBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCBib3R0b21Jbm5lcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVySW5uZXIudyA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgZ2V0IGJvdHRvbSgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyLnc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgY29ybmVyIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgaW50ZXJuYWwgY29ybmVyIHZlY3RvclxuICAgKi9cbiAgc2V0IGNvcm5lcklubmVyKHZlYzogVmVjdG9yNCkge1xuICAgIHRoaXMuX2Nvcm5lcklubmVyLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgY29ybmVyIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBjb3JuZXIgdmVjdG9yXG4gICAqL1xuICBnZXQgY29ybmVySW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lcklubmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGNhbWVyYSBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGludGVybmFsIHBhcmFtZXRlcnMgdmVjdG9yXG4gICAqL1xuICBzZXQgcGFyYW1ldGVyc0lubmVyKHZlYzogVmVjdG9yNCkge1xuICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGNhbWVyYSBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgcGFyYW1ldGVycyB2ZWN0b3JcbiAgICovXG4gIGdldCBwYXJhbWV0ZXJzSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnNJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBwYXJhbWV0ZXJzIHZlY3RvclxuICAgKi9cbiAgZ2V0IHBhcmFtZXRlcnMoKTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6TmVhcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnMueCA9IHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGludGVybmFsIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6TmVhcklubmVyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnggPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIGdldCB6TmVhcklubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZVxuICAgKi9cbiAgZ2V0IHpOZWFyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLng7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jYWwgbGVuZ3RoIGFuZCBhdXRvbWF0aWNhbGx5IGNhbGN1bGF0ZXMgdGhlIGZpZWxkIG9mIHZpZXcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgZm9jYWwgbGVuZ3RoIGluIG1pbGxpbWV0ZXJzXG4gICAqL1xuICBzZXQgZm9jYWxMZW5ndGgodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9mb2NhbExlbmd0aCA9IHZhbDtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSAyICogTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUoTWF0aC5hdGFuKHRoaXMuX2ZpbG1IZWlnaHQgLyAodmFsICogMikpKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmb2NhbCBsZW5ndGguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmb2NhbCBsZW5ndGggaW4gbWlsbGltZXRlcnNcbiAgICovXG4gIGdldCBmb2NhbExlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZm9jYWxMZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgZm9jYWwgbGVuZ3RoIGFuZCBjYWxjdWxhdGVzIHRoZSBmaWVsZCBvZiB2aWV3LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGludGVybmFsIGZvY2FsIGxlbmd0aFxuICAgKi9cbiAgc2V0IGZvY2FsTGVuZ3RoSW5uZXIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueiA9IDIgKiBNYXRoVXRpbC5yYWRpYW5Ub0RlZ3JlZShNYXRoLmF0YW4odGhpcy5fZmlsbUhlaWdodCAvICh2YWwgKiAyKSkpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGZvY2FsIGxlbmd0aC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGZvY2FsIGxlbmd0aFxuICAgKi9cbiAgZ2V0IGZvY2FsTGVuZ3RoSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6RmFyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVycy55ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6RmFySW5uZXIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueSA9IHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIGdldCB6RmFySW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnNJbm5lci55O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZVxuICAgKi9cbiAgZ2V0IHpGYXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmaWVsZCBvZiB2aWV3IGFuZCBhZGp1c3RzIHRoZSBmaWxtIHNpemUgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBkZWdyZWUgLSBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBzZXRGb3Z5QW5kQ2hhbmdlRmlsbVNpemUoZGVncmVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSBkZWdyZWU7XG4gICAgdGhpcy5fZmlsbUhlaWdodCA9IDIgKiB0aGlzLmZvY2FsTGVuZ3RoICogTWF0aC50YW4oTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oZGVncmVlKSAvIDIpO1xuICAgIHRoaXMuX2ZpbG1XaWR0aCA9IHRoaXMuX2ZpbG1IZWlnaHQgKiB0aGlzLmFzcGVjdDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmaWVsZCBvZiB2aWV3IGFuZCBhZGp1c3RzIHRoZSBmb2NhbCBsZW5ndGggYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBkZWdyZWUgLSBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBzZXRGb3Z5QW5kQ2hhbmdlRm9jYWxMZW5ndGgoZGVncmVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSBkZWdyZWU7XG4gICAgdGhpcy5fZm9jYWxMZW5ndGggPSB0aGlzLl9maWxtSGVpZ2h0IC8gMiAvIE1hdGgudGFuKE1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKGRlZ3JlZSkgLyAyKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmaWVsZCBvZiB2aWV3LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBnZXQgZm92eSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1ldGVycy56O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGZpZWxkIG9mIHZpZXcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgaW50ZXJuYWwgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBzZXQgZm92eUlubmVyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXNwZWN0IHJhdGlvIGFuZCBhZGp1c3RzIHRoZSBmaWxtIHdpZHRoIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGFzcGVjdCByYXRpbyAod2lkdGgvaGVpZ2h0KVxuICAgKi9cbiAgc2V0IGFzcGVjdCh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnMudyA9IHZhbDtcbiAgICB0aGlzLl9maWxtV2lkdGggPSB0aGlzLl9maWxtSGVpZ2h0ICogdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGFzcGVjdCByYXRpby5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBpbnRlcm5hbCBhc3BlY3QgcmF0aW9cbiAgICovXG4gIHNldCBhc3BlY3RJbm5lcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGFzcGVjdCByYXRpby5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGFzcGVjdCByYXRpb1xuICAgKi9cbiAgZ2V0IGFzcGVjdElubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhc3BlY3QgcmF0aW8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhc3BlY3QgcmF0aW9cbiAgICovXG4gIGdldCBhc3BlY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMudztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBYIG1hZ25pZmljYXRpb24gZm9yIG9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIFggbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgc2V0IHhNYWcodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWCBtYWduaWZpY2F0aW9uIGZvciBvcnRob2dyYXBoaWMgcHJvamVjdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFggbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgZ2V0IHhNYWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMuejtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBZIG1hZ25pZmljYXRpb24gZm9yIG9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIFkgbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgc2V0IHlNYWcodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWSBtYWduaWZpY2F0aW9uIGZvciBvcnRob2dyYXBoaWMgcHJvamVjdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFkgbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgZ2V0IHlNYWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMudztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBjYW1lcmEgY29tcG9uZW50cy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNhbWVyYSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvbmVudFRJRCgpIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBjYW1lcmEgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2FtZXJhIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyBhbmQgcmV0dXJucyB0aGUgcHJvamVjdGlvbiBtYXRyaXggYmFzZWQgb24gY2FtZXJhIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYWxjdWxhdGVkIHByb2plY3Rpb24gbWF0cml4XG4gICAqL1xuICBjYWxjUHJvamVjdGlvbk1hdHJpeCgpIHtcbiAgICBjb25zdCB6TmVhciA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci54O1xuICAgIGNvbnN0IHpGYXIgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueTtcblxuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgZm92eSA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICAgICAgICBsZXQgYXNwZWN0ID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnc7XG4gICAgICAgIGlmIChhc3BlY3QgPCAwKSB7XG4gICAgICAgICAgYXNwZWN0ID0gdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHlzY2FsZSA9IDEuMCAvIE1hdGgudGFuKCgwLjUgKiBmb3Z5ICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICBjb25zdCB4c2NhbGUgPSB5c2NhbGUgLyBhc3BlY3Q7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAwID0geHNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAyID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMDMgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMCA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTExID0geXNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMiA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTEzID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMSA9IDA7XG4gICAgICAgIGlmICh6RmFyID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpIHtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9IC0xO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gLXpOZWFyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IG5mID0gMSAvICh6TmVhciAtIHpGYXIpO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIyID0gekZhciAqIG5mO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gekZhciAqIHpOZWFyICogbmY7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMyID0gLTE7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMzID0gMDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSBDYW1lcmFUeXBlLk9ydGhvZ3JhcGhpYykge1xuICAgICAgICBjb25zdCB4bWFnID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLno7XG4gICAgICAgIGNvbnN0IHltYWcgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudztcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5zZXRDb21wb25lbnRzKFxuICAgICAgICAgIDEgLyB4bWFnLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMSAvIHltYWcsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAtMSAvICh6RmFyIC0gek5lYXIpLFxuICAgICAgICAgIC16TmVhciAvICh6RmFyIC0gek5lYXIpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDEuMFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2Nvcm5lcklubmVyLng7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5fY29ybmVySW5uZXIueTtcbiAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fY29ybmVySW5uZXIuejtcbiAgICAgICAgY29uc3QgYm90dG9tID0gdGhpcy5fY29ybmVySW5uZXIudztcbiAgICAgICAgY29uc3QgbmYgPSAxIC8gKHpOZWFyIC0gekZhcik7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguc2V0Q29tcG9uZW50cyhcbiAgICAgICAgICAoMiAqIHpOZWFyKSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAocmlnaHQgKyBsZWZ0KSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgKDIgKiB6TmVhcikgLyAodG9wIC0gYm90dG9tKSxcbiAgICAgICAgICAodG9wICsgYm90dG9tKSAvICh0b3AgLSBib3R0b20pLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIHpGYXIgKiBuZixcbiAgICAgICAgICB6RmFyICogek5lYXIgKiBuZixcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIC0xLjAsXG4gICAgICAgICAgMC4wXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgZm92eSA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICAgICAgICBsZXQgYXNwZWN0ID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnc7XG4gICAgICAgIGlmIChhc3BlY3QgPCAwKSB7XG4gICAgICAgICAgYXNwZWN0ID0gdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHlzY2FsZSA9IDEuMCAvIE1hdGgudGFuKCgwLjUgKiBmb3Z5ICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICBjb25zdCB4c2NhbGUgPSB5c2NhbGUgLyBhc3BlY3Q7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAwID0geHNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAyID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMDMgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMCA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTExID0geXNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMiA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTEzID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMSA9IDA7XG4gICAgICAgIGlmICh6RmFyID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpIHtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9IC0xO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gLTIgKiB6TmVhcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBuZiA9IDEgLyAoek5lYXIgLSB6RmFyKTtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9ICh6RmFyICsgek5lYXIpICogbmY7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjMgPSAyLjAgKiB6RmFyICogek5lYXIgKiBuZjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMCA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMxID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzIgPSAtMTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzMgPSAwO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljKSB7XG4gICAgICAgIGNvbnN0IHhtYWcgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuejtcbiAgICAgICAgY29uc3QgeW1hZyA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci53O1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4LnNldENvbXBvbmVudHMoXG4gICAgICAgICAgMSAvIHhtYWcsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAxIC8geW1hZyxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIC0yIC8gKHpGYXIgLSB6TmVhciksXG4gICAgICAgICAgLSh6RmFyICsgek5lYXIpIC8gKHpGYXIgLSB6TmVhciksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMS4wXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fY29ybmVySW5uZXIueDtcbiAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLl9jb3JuZXJJbm5lci55O1xuICAgICAgICBjb25zdCB0b3AgPSB0aGlzLl9jb3JuZXJJbm5lci56O1xuICAgICAgICBjb25zdCBib3R0b20gPSB0aGlzLl9jb3JuZXJJbm5lci53O1xuICAgICAgICBjb25zdCBuZiA9IDEgLyAoek5lYXIgLSB6RmFyKTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5zZXRDb21wb25lbnRzKFxuICAgICAgICAgICgyICogek5lYXIpIC8gKHJpZ2h0IC0gbGVmdCksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIChyaWdodCArIGxlZnQpIC8gKHJpZ2h0IC0gbGVmdCksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAoMiAqIHpOZWFyKSAvICh0b3AgLSBib3R0b20pLFxuICAgICAgICAgICh0b3AgKyBib3R0b20pIC8gKHRvcCAtIGJvdHRvbSksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgKHpGYXIgKyB6TmVhcikgKiBuZixcbiAgICAgICAgICAyICogekZhciAqIHpOZWFyICogbmYsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAtMS4wLFxuICAgICAgICAgIDAuMFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wcm9qZWN0aW9uTWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgYW5kIHJldHVybnMgdGhlIHZpZXcgbWF0cml4IGJhc2VkIG9uIGNhbWVyYSBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYWxjdWxhdGVkIHZpZXcgbWF0cml4XG4gICAqL1xuICBjYWxjVmlld01hdHJpeCgpIHtcbiAgICBjb25zdCBleWUgPSB0aGlzLmV5ZUlubmVyO1xuICAgIGNvbnN0IGYgPSBNdXRhYmxlVmVjdG9yMy5zdWJ0cmFjdFRvKHRoaXMuX2RpcmVjdGlvbklubmVyLCBleWUsIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMCkubm9ybWFsaXplKCk7XG4gICAgY29uc3QgcyA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8oZiwgdGhpcy5fdXBJbm5lciwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18xKS5ub3JtYWxpemUoKTtcbiAgICBjb25zdCB1ID0gTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhzLCBmLCBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzIpO1xuXG4gICAgdGhpcy5fdmlld01hdHJpeC5zZXRDb21wb25lbnRzKFxuICAgICAgcy54LFxuICAgICAgcy55LFxuICAgICAgcy56LFxuICAgICAgLVZlY3RvcjMuZG90KHMsIGV5ZSksXG4gICAgICB1LngsXG4gICAgICB1LnksXG4gICAgICB1LnosXG4gICAgICAtVmVjdG9yMy5kb3QodSwgZXllKSxcbiAgICAgIC1mLngsXG4gICAgICAtZi55LFxuICAgICAgLWYueixcbiAgICAgIFZlY3RvcjMuZG90KGYsIGV5ZSksXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAxXG4gICAgKTtcblxuICAgIGlmICghdGhpcy5wcmltaXRpdmVNb2RlKSB7XG4gICAgICBjb25zdCBpbnZlcnRXb3JsZE1hdHJpeCA9IE11dGFibGVNYXRyaXg0NC5pbnZlcnRUbyhcbiAgICAgICAgdGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyLFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8wXG4gICAgICApO1xuXG4gICAgICB0aGlzLl92aWV3TWF0cml4Lm11bHRpcGx5KGludmVydFdvcmxkTWF0cml4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdmlld01hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2aWV3IG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZpZXcgbWF0cml4XG4gICAqL1xuICBnZXQgdmlld01hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld01hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aWV3IG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHZpZXdNYXRyaXggLSBUaGUgdmlldyBtYXRyaXggdG8gc2V0XG4gICAqL1xuICBzZXQgdmlld01hdHJpeCh2aWV3TWF0cml4OiBNYXRyaXg0NCkge1xuICAgIHRoaXMuX3ZpZXdNYXRyaXguY29weUNvbXBvbmVudHModmlld01hdHJpeCk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcHJvamVjdGlvbiBtYXRyaXgsIGNvbnNpZGVyaW5nIFhSIG1vZGUgaWYgYXBwbGljYWJsZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHByb2plY3Rpb24gbWF0cml4IChtYXkgYmUgWFItc3BlY2lmaWMgbWF0cml4IGlmIGluIFhSIG1vZGUpXG4gICAqL1xuICBnZXQgcHJvamVjdGlvbk1hdHJpeCgpIHtcbiAgICBpZiAodGhpcy5feHJMZWZ0IHx8IHRoaXMuX3hyUmlnaHQpIHtcbiAgICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgICBpZiAod2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlKSB7XG4gICAgICAgIGlmICh0aGlzLl94ckxlZnQpIHtcbiAgICAgICAgICByZXR1cm4gd2ViWFJTeXN0ZW0ubGVmdFByb2plY3Rpb25NYXRyaXg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3hyUmlnaHQpIHtcbiAgICAgICAgICByZXR1cm4gd2ViWFJTeXN0ZW0ucmlnaHRQcm9qZWN0aW9uTWF0cml4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wcm9qZWN0aW9uTWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHByb2plY3Rpb24gbWF0cml4LlxuICAgKlxuICAgKiBAcGFyYW0gcHJvamVjdGlvbk1hdHJpeCAtIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCB0byBzZXRcbiAgICovXG4gIHNldCBwcm9qZWN0aW9uTWF0cml4KHByb2plY3Rpb25NYXRyaXg6IE1hdHJpeDQ0KSB7XG4gICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5jb3B5Q29tcG9uZW50cyhwcm9qZWN0aW9uTWF0cml4KTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcHJvamVjdGlvbiBtYXRyaXggdGhhdCBpcyB1cGxvYWRlZCB0byB0aGUgR1BVIChpbiBYUiBtb2RlLCB0aGUgbWF0cml4IG9mIHRoZSBleWUgY29waWVkIGluICRsb2dpYykuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZ2V0IF9wcm9qZWN0aW9uTWF0cml4Rm9yR3B1KCk6IE1hdHJpeDQ0IHtcbiAgICByZXR1cm4gdGhpcy5fcHJvamVjdGlvbk1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbGlnaHQgY2x1c3RlciB2aWV3IGluZm8gdXBsb2FkZWQgdG8gdGhlIEdQVS5cbiAgICogeDogdGhlIHZlYzQgaW5kZXggb2YgdGhlIGxpZ2h0IGNsdXN0ZXIgdmlldyByZWdpb24gb2YgdGhpcyBjYW1lcmEgKC0xOiBub25lKS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX2xpZ2h0Q2x1c3RlclZpZXdJbmZvRm9yR3B1KCk6IE11dGFibGVWZWN0b3I0IHtcbiAgICByZXR1cm4gdGhpcy5fbGlnaHRDbHVzdGVyVmlld0luZm87XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tYmluZWQgdmlldy1wcm9qZWN0aW9uIG1hdHJpeC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZpZXctcHJvamVjdGlvbiBtYXRyaXhcbiAgICovXG4gIGdldCB2aWV3UHJvamVjdGlvbk1hdHJpeCgpIHtcbiAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8odGhpcy5fcHJvamVjdGlvbk1hdHJpeCwgdGhpcy5fdmlld01hdHJpeCwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmlhcyB2aWV3LXByb2plY3Rpb24gbWF0cml4IGZvciBzaGFkb3cgbWFwcGluZy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJpYXMgdmlldy1wcm9qZWN0aW9uIG1hdHJpeCBhZGp1c3RlZCBmb3IgdGhlIGN1cnJlbnQgZ3JhcGhpY3MgQVBJXG4gICAqL1xuICBnZXQgYmlhc1ZpZXdQcm9qZWN0aW9uTWF0cml4KCkge1xuICAgIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKHRoaXMuX3Byb2plY3Rpb25NYXRyaXgsIHRoaXMuX3ZpZXdNYXRyaXgsIENhbWVyYUNvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzApO1xuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyhcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fYmlhc01hdHJpeFdlYkdQVSxcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMCxcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKFxuICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fYmlhc01hdHJpeFdlYkdMLFxuICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzFcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgY2FtZXJhIHZhbHVlcyAocG9zaXRpb24pIHRvIHRoZSB2aWV3UG9zaXRpb24gbWVtYmVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfX3NldFZhbHVlc1RvVmlld1Bvc2l0aW9uKCkge1xuICAgIHRoaXMuX3ZpZXdQb3NpdGlvbi5jb3B5Q29tcG9uZW50cyh0aGlzLndvcmxkUG9zaXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHdvcmxkIHBvc2l0aW9uIG9mIHRoZSBjYW1lcmEuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB3b3JsZCBwb3NpdGlvbiB2ZWN0b3JcbiAgICovXG4gIGdldCB3b3JsZFBvc2l0aW9uKCkge1xuICAgIHRoaXMuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjNUbyh0aGlzLmV5ZUlubmVyLCBDYW1lcmFDb21wb25lbnQucmV0dXJuVmVjdG9yMyk7XG4gICAgcmV0dXJuIENhbWVyYUNvbXBvbmVudC5yZXR1cm5WZWN0b3IzO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNhbWVyYSBmcnVzdHVtIGJhc2VkIG9uIGN1cnJlbnQgdmlldyBhbmQgcHJvamVjdGlvbiBtYXRyaWNlcy5cbiAgICovXG4gIHVwZGF0ZUZydXN0dW0oKSB7XG4gICAgdGhpcy5fX2ZydXN0dW0udXBkYXRlKHRoaXMudmlld01hdHJpeCwgdGhpcy5wcm9qZWN0aW9uTWF0cml4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgZnJ1c3R1bSBmb3IgY3VsbGluZyBvcGVyYXRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2FtZXJhIGZydXN0dW1cbiAgICovXG4gIGdldCBmcnVzdHVtKCkge1xuICAgIHJldHVybiB0aGlzLl9fZnJ1c3R1bTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgY2FtZXJhIGNvbXBvbmVudCBhbmQgbW92ZXMgaXQgdG8gdGhlIGxvZ2ljIHN0YWdlLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gICRsb2FkKCkge1xuICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgbG9naWMgdXBkYXRlIGZvciB0aGUgY2FtZXJhIGNvbXBvbmVudC5cbiAgICogVXBkYXRlcyB2aWV3IGFuZCBwcm9qZWN0aW9uIG1hdHJpY2VzLCBoYW5kbGVzIGxpZ2h0IHN5bmNocm9uaXphdGlvbiwgYW5kIG1hbmFnZXMgWFIgbW9kZS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICAkbG9naWMoKSB7XG4gICAgY29uc3QgbGlnaHRDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldExpZ2h0KCk7XG4gICAgbGV0IGxpZ2h0Q29tcG9uZW50VXBkYXRlQ291bnQgPSBsaWdodENvbXBvbmVudCAhPSBudWxsID8gbGlnaHRDb21wb25lbnQudXBkYXRlQ291bnQgOiAtMTtcbiAgICBpZiAoXG4gICAgICB0aGlzLl9fbGFzdFVwZGF0ZUNvdW50ID09PSB0aGlzLl9fdXBkYXRlQ291bnQgJiZcbiAgICAgIHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID09PSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSkgJiZcbiAgICAgIHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPT09IGxpZ2h0Q29tcG9uZW50VXBkYXRlQ291bnQgJiZcbiAgICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9PT0gX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzU3luY1RvTGlnaHQgJiYgSXMuZXhpc3QobGlnaHRDb21wb25lbnQpKSB7XG4gICAgICAvLyBmb3IgU2hhZG93IE1hcHBpbmdcbiAgICAgIC8vIElNUE9SVEFOVDpcbiAgICAgIC8vIGV5ZUlubmVyIC8gZGlyZWN0aW9uSW5uZXIgLyB1cElubmVyIGFyZSBkZWZpbmVkIGluIHRoZSBjYW1lcmEncyAqbG9jYWwqIHNwYWNlLlxuICAgICAgLy8gY2FsY1ZpZXdNYXRyaXgoKSBsYXRlciBtdWx0aXBsaWVzIGJ5IGludmVyc2UoZW50aXR5LndvcmxkTWF0cml4KSB3aGVuIHByaW1pdGl2ZU1vZGUgaXMgZmFsc2UuXG4gICAgICAvL1xuICAgICAgLy8gU2V0dGluZyB3b3JsZC1zcGFjZSB2YWx1ZXMgaGVyZSBjYXVzZXMgdGhlIGVudGl0eSB0cmFuc2Zvcm0gdG8gYmUgYXBwbGllZCB0d2ljZSxcbiAgICAgIC8vIHdoaWNoIG1ha2VzIHRoZSBzaGFkb3cgcHJvamVjdGlvbiBtb3ZlIHJvdWdobHkgMnggYXMgbXVjaCBhcyB0aGUgbGlnaHQgdHJhbnNsYXRpb24uXG4gICAgICAvL1xuICAgICAgLy8gVGhlIGxpZ2h0IGRpcmVjdGlvbiBpcyBkZXJpdmVkIGZyb20gdGhlIGVudGl0eSB0cmFuc2Zvcm0gKExpZ2h0Q29tcG9uZW50IHVzZXMgbG9jYWwgLVopLFxuICAgICAgLy8gc28ga2VlcGluZyB0aGUgY2FtZXJhIGluIGl0cyBjYW5vbmljYWwgbG9jYWwgb3JpZW50YXRpb24gaXMgc3VmZmljaWVudC5cbiAgICAgIHRoaXMuX2V5ZUlubmVyLmNvcHlDb21wb25lbnRzKENhbWVyYUNvbXBvbmVudC5fZXllKTsgLy8gbG9jYWwgb3JpZ2luXG4gICAgICB0aGlzLl9kaXJlY3Rpb25Jbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl9kaXJlY3Rpb24pOyAvLyBsb2NhbCBsb29rLWF0IHRhcmdldCAodG93YXJkcyAtWilcbiAgICAgIHRoaXMuX3VwSW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fdXApOyAvLyBsb2NhbCArWVxuXG4gICAgICBpZiAobGlnaHRDb21wb25lbnQudHlwZSA9PT0gTGlnaHRUeXBlLlNwb3QpIHtcbiAgICAgICAgdGhpcy50eXBlID0gQ2FtZXJhVHlwZS5QZXJzcGVjdGl2ZTtcbiAgICAgICAgLy8gb3V0ZXJDb25lQW5nbGUgaXMgYSBoYWxmLWFuZ2xlLCBzbyBtdWx0aXBseSBieSAyIHRvIGdldCB0aGUgZnVsbCBGT1ZcbiAgICAgICAgdGhpcy5zZXRGb3Z5QW5kQ2hhbmdlRmlsbVNpemUoTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUobGlnaHRDb21wb25lbnQub3V0ZXJDb25lQW5nbGUgKiAyLjApKTtcbiAgICAgICAgdGhpcy5fY29ybmVySW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fY29ybmVyKTtcbiAgICAgICAgdGhpcy5hc3BlY3QgPSAxO1xuICAgICAgICB0aGlzLnpOZWFyID0gbGlnaHRDb21wb25lbnQuc2hhZG93Wk5lYXJGb3JTcG90TGlnaHQ7XG4gICAgICAgIC8vIFVzZSBhIHJlYXNvbmFibGUgZGVmYXVsdCB6RmFyIGZvciBzaGFkb3cgbWFwcGluZyB0byBtYWludGFpbiBkZXB0aCBwcmVjaXNpb25cbiAgICAgICAgdGhpcy56RmFyID0gbGlnaHRDb21wb25lbnQucmFuZ2UgIT09IC0xID8gbGlnaHRDb21wb25lbnQucmFuZ2UgOiAxMDA7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl9wYXJhbWV0ZXJzKTtcbiAgICAgIH0gZWxzZSBpZiAobGlnaHRDb21wb25lbnQudHlwZSA9PT0gTGlnaHRUeXBlLkRpcmVjdGlvbmFsKSB7XG4gICAgICAgIHRoaXMudHlwZSA9IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljO1xuICAgICAgICBjb25zdCBhcmVhU2l6ZSA9IGxpZ2h0Q29tcG9uZW50LnNoYWRvd0FyZWFTaXplRm9yRGlyZWN0aW9uYWxMaWdodDtcbiAgICAgICAgdGhpcy5fY29ybmVySW5uZXIuY29weUNvbXBvbmVudHMoVmVjdG9yNC5mcm9tQ29weTQoLWFyZWFTaXplLCBhcmVhU2l6ZSwgYXJlYVNpemUsIC1hcmVhU2l6ZSkpO1xuICAgICAgICB0aGlzLmFzcGVjdCA9IDE7XG4gICAgICAgIHRoaXMuek5lYXIgPSBsaWdodENvbXBvbmVudC5zaGFkb3daTmVhckZvckRpcmVjdGlvbmFsTGlnaHQ7XG4gICAgICAgIHRoaXMuekZhciA9IGxpZ2h0Q29tcG9uZW50LnJhbmdlICE9PSAtMSA/IGxpZ2h0Q29tcG9uZW50LnJhbmdlIDogMTAwO1xuICAgICAgICAvLyBGb3IgT3J0aG9ncmFwaGljIHByb2plY3Rpb24sIF9wYXJhbWV0ZXJzSW5uZXIueiBpcyB4bWFnIGFuZCBfcGFyYW1ldGVyc0lubmVyLncgaXMgeW1hZ1xuICAgICAgICAvLyBUaGVzZSBhcmUgdGhlIGhhbGYtd2lkdGhzIHVzZWQgaW4gY2FsY1Byb2plY3Rpb25NYXRyaXggZm9yIG9ydGhvZ3JhcGhpYyBjYW1lcmFzXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci54ID0gdGhpcy56TmVhcjtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnkgPSB0aGlzLnpGYXI7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci56ID0gYXJlYVNpemU7IC8vIHhtYWcgKGhhbGYtd2lkdGgpXG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gYXJlYVNpemU7IC8vIHltYWcgKGhhbGYtaGVpZ2h0KVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjYW1lcmFDb250cm9sbGVyQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRDYW1lcmFDb250cm9sbGVyKCk7XG4gICAgICBpZiAoSXMuZXhpc3QoY2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCkpIHtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLncgPSB0aGlzLl9wYXJhbWV0ZXJzLnc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMucHJpbWl0aXZlTW9kZSkge1xuICAgICAgICAgIHRoaXMuX2V5ZUlubmVyLmNvcHlDb21wb25lbnRzKENhbWVyYUNvbXBvbmVudC5fZXllKTtcbiAgICAgICAgICB0aGlzLl9kaXJlY3Rpb25Jbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl9kaXJlY3Rpb24pO1xuICAgICAgICAgIHRoaXMuX3VwSW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fdXApO1xuICAgICAgICAgIHRoaXMuX2Nvcm5lcklubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX2Nvcm5lcik7XG4gICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX3BhcmFtZXRlcnMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jYWxjVmlld01hdHJpeCgpO1xuXG4gICAgaWYgKHRoaXMuX3hyTGVmdCB8fCB0aGlzLl94clJpZ2h0KSB7XG4gICAgICAvLyBJbiBYUiBtb2RlLCBnZXQgdGhlIHByb2plY3Rpb24gbWF0cml4IGZyb20gV2ViWFJTeXN0ZW1cbiAgICAgIGNvbnN0IHdlYlhSU3lzdGVtID0gdGhpcy5fX2VuZ2luZS5fd2ViWFJTeXN0ZW1JZkVuYWJsZWQ7XG4gICAgICBpZiAod2ViWFJTeXN0ZW0/LmlzV2ViWFJNb2RlKSB7XG4gICAgICAgIGlmICh0aGlzLl94ckxlZnQpIHtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4LmNvcHlDb21wb25lbnRzKHdlYlhSU3lzdGVtLmxlZnRQcm9qZWN0aW9uTWF0cml4KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl94clJpZ2h0KSB7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5jb3B5Q29tcG9uZW50cyh3ZWJYUlN5c3RlbS5yaWdodFByb2plY3Rpb25NYXRyaXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FsY1Byb2plY3Rpb25NYXRyaXgoKTtcbiAgICB9XG4gICAgdGhpcy5fX3NldFZhbHVlc1RvVmlld1Bvc2l0aW9uKCk7XG5cbiAgICB0aGlzLl9fbGFzdFVwZGF0ZUNvdW50ID0gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICAgIHRoaXMuX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gVHJhbnNmb3JtQ29tcG9uZW50LmdldFVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpO1xuICAgIHRoaXMuX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSBsaWdodENvbXBvbmVudFVwZGF0ZUNvdW50O1xuICAgIHRoaXMuX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCA9IF9nZXRDYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW50aXR5IHdoaWNoIGhhcyB0aGlzIGNhbWVyYSBjb21wb25lbnQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgd2hpY2ggaGFzIHRoaXMgY29tcG9uZW50XG4gICAqL1xuICBnZXQgZW50aXR5KCk6IElDYW1lcmFFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuZ2V0RW50aXR5KHRoaXMuX19lbnRpdHlVaWQpIGFzIHVua25vd24gYXMgSUNhbWVyYUVudGl0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoaXMgY2FtZXJhIGNvbXBvbmVudCB0byBhbiBlbnRpdHksIGV4dGVuZGluZyBpdCB3aXRoIGNhbWVyYS1zcGVjaWZpYyBtZXRob2RzLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSB0YXJnZXQgZW50aXR5XG4gICAqIEBwYXJhbSBfY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIGFkZFxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IGV4dGVuZGVkIHdpdGggY2FtZXJhIGNvbXBvbmVudCBtZXRob2RzXG4gICAqIEBvdmVycmlkZVxuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2VDbGFzcyBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2VDbGFzcyxcbiAgICBfY29tcG9uZW50Q2xhc3M6IFNvbWVDb21wb25lbnRDbGFzc1xuICApIHtcbiAgICBjbGFzcyBDYW1lcmFFbnRpdHkgZXh0ZW5kcyAoYmFzZS5jb25zdHJ1Y3RvciBhcyBhbnkpIHtcbiAgICAgIC8qKlxuICAgICAgICogR2V0cyB0aGUgY2FtZXJhIGNvbXBvbmVudCBvZiB0aGlzIGVudGl0eS5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJucyBUaGUgY2FtZXJhIGNvbXBvbmVudFxuICAgICAgICovXG4gICAgICBnZXRDYW1lcmEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFdlbGxLbm93bkNvbXBvbmVudFRJRHMuQ2FtZXJhQ29tcG9uZW50VElEKSBhcyBDYW1lcmFDb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGx5TWl4aW5zKGJhc2UsIENhbWVyYUVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2VDbGFzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgc3RhdGljIHJlc291cmNlcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNwZWNpZmllZCBlbmdpbmUuXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlIHRvIGNsZWFuIHVwIHJlc291cmNlcyBmb3JcbiAgICogQGludGVybmFsXG4gICAqL1xuICBzdGF0aWMgX2NsZWFudXBGb3JFbmdpbmUoZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBDYW1lcmFDb21wb25lbnQuX19jdXJyZW50TWFwLmRlbGV0ZShlbmdpbmUuZW5naW5lVWlkKTtcbiAgfVxufVxuXG5DYW1lcmFDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICd2aWV3TWF0cml4JyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZU1hdHJpeDQ0LFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5NYXQ0LFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0sXG59KTtcbkNhbWVyYUNvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ3Byb2plY3Rpb25NYXRyaXgnLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlTWF0cml4NDQsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLk1hdDQsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSxcbn0pO1xuQ2FtZXJhQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAndmlld1Bvc2l0aW9uJyxcbiAgZGF0YUNsYXNzVHlwZTogTXV0YWJsZVZlY3RvcjMsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFswLCAwLCAwXSxcbn0pO1xuQ2FtZXJhQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAnbGlnaHRDbHVzdGVyVmlld0luZm8nLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlVmVjdG9yNCxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjNCxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWy0xLCAwLCAwLCAwXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsaUJBQWlCO0FBRTFCLFNBQVMsbUJBQTBDO0FBQ25ELFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsa0JBQXVDO0FBQ2hELFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsZUFBZTtBQUV4QixTQUFTLGdCQUFnQjtB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TjtBQXV1Q1AsZ0JBQWdCLGVBQWU7QUFBQSxFQUM3QixXQUFXLFVBQVU7QUFBQSxFQUNyQixZQUFZO0FBQUEsRUFDWixlQUFlO0FBQUEsRUFDZixZQUFZLFdBQVc7QUFBQSxFQUN2QixpQkFBaUIsZ0JBQWdCO0FBQUEsRUFDakMsZUFBZSxjQUFjO0FBQUEsRUFDN0IsWUFBWSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDN0QsQ0FBQztBQUNELGdCQUFnQixlQUFlO0FBQUEsRUFDN0IsV0FBVyxVQUFVO0FBQUEsRUFDckIsWUFBWTtBQUFBLEVBQ1osZUFBZTtBQUFBLEVBQ2YsWUFBWSxXQUFXO0FBQUEsRUFDdkIsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQ2pDLGVBQWUsY0FBYztBQUFBLEVBQzdCLFlBQVksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQzdELENBQUM7QUFDRCxnQkFBZ0IsZUFBZTtBQUFBLEVBQzdCLFdBQVcsVUFBVTtBQUFBLEVBQ3JCLFlBQVk7QUFBQSxFQUNaLGVBQWU7QUFBQSxFQUNmLFlBQVksV0FBVztBQUFBLEVBQ3ZCLGlCQUFpQixnQkFBZ0I7QUFBQSxFQUNqQyxlQUFlLGNBQWM7QUFBQSxFQUM3QixZQUFZLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDdEIsQ0FBQztBQUNELGdCQUFnQixlQUFlO0FBQUEsRUFDN0IsV0FBVyxVQUFVO0FBQUEsRUFDckIsWUFBWTtBQUFBLEVBQ1osZUFBZTtBQUFBLEVBQ2YsWUFBWSxXQUFXO0FBQUEsRUFDdkIsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQ2pDLGVBQWUsY0FBYztBQUFBLEVBQzdCLFlBQVksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQzFCLENBQUM7IiwKICAibmFtZXMiOiBbIl9fdHlwZSIsICJfX2ZydXN0dW0iLCAiX191cGRhdGVDb3VudCIsICJfX2xhc3RVcGRhdGVDb3VudCIsICJfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX2N1cnJlbnRNYXAiLCAiX190bXBWZWN0b3IzXzAiLCAiX190bXBWZWN0b3IzXzEiLCAiX190bXBWZWN0b3IzXzIiLCAiX19lbmdpbmUiLCAiX190bXBNYXRyaXg0NF8wIiwgIl9fYmlhc01hdHJpeFdlYkdQVSIsICJfX3RtcE1hdHJpeDQ0XzEiLCAiX19iaWFzTWF0cml4V2ViR0wiLCAiX19zZXRWYWx1ZXNUb1ZpZXdQb3NpdGlvbiIsICJfX2VudGl0eVVpZCJdCn0K
