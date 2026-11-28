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
import { MutableVector2 } from "../../math/MutableVector2.js";
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
    this.Gc = CameraType.Perspective;
    this._projectionMatrix = MutableMatrix44.dummy();
    // The projection matrix before the temporal anti-aliasing jitter is applied (not uploaded to the GPU).
    this.Ac = MutableMatrix44.identity();
    this.Bc = false;
    // NDC offset of the temporal anti-aliasing jitter.
    this.yc = MutableVector2.zero();
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
    this.Jc = new Frustum();
    this.ia = 0;
    this.Kc = -1;
    this.Lc = -1;
    this.Mc = -1;
    this.Nc = -1;
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
    return (_a = this.Cc.get(engine.engineUid)) != null ? _a : -1;
  }
  /**
   * Sets the current active camera component for a specific engine.
   *
   * @param engine - The engine instance
   * @param componentSID - The component system identifier of the camera to set as current
   */
  static setCurrent(engine, componentSID) {
    this.Cc.set(engine.engineUid, componentSID);
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
    this.Gc = type;
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
    return this.Gc;
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
      _CameraComponent.Hc
    );
    const isOrthogonalNewDirectionAndOldUp = orthogonalVectorNewDirectionAndOldUp.length() === 0;
    let newUpNonNormalize;
    if (isOrthogonalNewDirectionAndOldUp) {
      const relativeXaxis = MutableVector3.crossTo(oldDirection, oldUp, _CameraComponent.Dc);
      newUpNonNormalize = MutableVector3.crossTo(relativeXaxis, newDirection, _CameraComponent.Ec);
    } else {
      const newDirectionComponentInOldUp = MutableVector3.multiplyTo(
        newDirection,
        newDirection.dot(oldUp),
        _CameraComponent.Dc
      );
      newUpNonNormalize = MutableVector3.subtractTo(
        oldUp,
        newDirectionComponentInOldUp,
        _CameraComponent.Ec
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
    this.Ac.copyComponents(this._projectionMatrix);
    this.Bc = true;
    this.Fc();
    return this._projectionMatrix;
  }
  /**
   * Writes the jittered projection matrix (`__projectionMatrixWithoutJitter` offset by `__jitterOffset`)
   * into `_projectionMatrix`.
   *
   * @remarks
   * Offsetting the NDC position by (jx, jy) is the clip space translation `x' = x + jx * w`, so the
   * w row (row 3) is added, scaled, to the x and y rows. This works for every projection type.
   */
  Fc() {
    const jx = this.yc.x;
    const jy = this.yc.y;
    const src = this.Ac;
    const dst = this._projectionMatrix;
    if (jx === 0 && jy === 0) {
      dst.copyComponents(src);
      return;
    }
    dst.copyComponents(src);
    dst.m00 = src.m00 + jx * src.m30;
    dst.m01 = src.m01 + jx * src.m31;
    dst.m02 = src.m02 + jx * src.m32;
    dst.m03 = src.m03 + jx * src.m33;
    dst.m10 = src.m10 + jy * src.m30;
    dst.m11 = src.m11 + jy * src.m31;
    dst.m12 = src.m12 + jy * src.m32;
    dst.m13 = src.m13 + jy * src.m33;
  }
  /**
   * The sub-pixel offset added to the projected position, in NDC units (2 / width is one pixel).
   *
   * @remarks
   * Used by temporal anti-aliasing. The offset is applied to the projection matrix uploaded to the GPU
   * and to {@link CameraComponent.projectionMatrix}; {@link CameraComponent.projectionMatrixWithoutJitter}
   * keeps the matrix without it. Setting the offset does not count as a camera update (it does not
   * re-run the logic stage of the components); it rewrites the projection matrix in place and requests
   * an upload of the GPU instance data. It is not applied to WebXR eye cameras.
   */
  get jitterOffset() {
    return this.yc;
  }
  set jitterOffset(offset) {
    if (this.yc.x === offset.x && this.yc.y === offset.y) {
      return;
    }
    this.yc.setComponents(offset.x, offset.y);
    if (this._xrLeft || this._xrRight || !this.Bc) {
      return;
    }
    this.Fc();
    this.c._markGpuInstanceDataDirty();
  }
  /**
   * The projection matrix without the jitter offset of temporal anti-aliasing.
   *
   * @remarks
   * Equal to {@link CameraComponent.projectionMatrix} when the jitter offset is zero.
   * Not defined for WebXR eye cameras.
   */
  get projectionMatrixWithoutJitter() {
    return this.Ac;
  }
  /**
   * Calculates and returns the view matrix based on camera position and orientation.
   *
   * @returns The calculated view matrix
   */
  calcViewMatrix() {
    const eye = this.eyeInner;
    const f = MutableVector3.subtractTo(this._directionInner, eye, _CameraComponent.Hc).normalize();
    const s = MutableVector3.crossTo(f, this._upInner, _CameraComponent.Dc).normalize();
    const u = MutableVector3.crossTo(s, f, _CameraComponent.Ec);
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
        _CameraComponent.zc
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
    this.Ac.copyComponents(projectionMatrix);
    this.Bc = true;
    this.Fc();
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
    return MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, _CameraComponent.zc);
  }
  /**
   * Gets the bias view-projection matrix for shadow mapping.
   *
   * @returns The bias view-projection matrix adjusted for the current graphics API
   */
  get biasViewProjectionMatrix() {
    MutableMatrix44.multiplyTo(this._projectionMatrix, this._viewMatrix, _CameraComponent.zc);
    if (this.c.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return MutableMatrix44.multiplyTo(
        _CameraComponent.Pc,
        _CameraComponent.zc,
        _CameraComponent.Ic
      );
    }
    return MutableMatrix44.multiplyTo(
      _CameraComponent.Oc,
      _CameraComponent.zc,
      _CameraComponent.Ic
    );
  }
  /**
   * Sets camera values (position) to the viewPosition member.
   */
  Qc() {
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
    this.Jc.update(this.viewMatrix, this.projectionMatrix);
  }
  /**
   * Gets the camera frustum for culling operations.
   *
   * @returns The camera frustum
   */
  get frustum() {
    return this.Jc;
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
    if (this.Kc === this.ia && this.Lc === TransformComponent.getUpdateCount(this.c) && this.Mc === lightComponentUpdateCount && this.Nc === _getCameraControllerUpdateCount(this.c)) {
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
    this.Qc();
    this.Kc = this.ia;
    this.Lc = TransformComponent.getUpdateCount(this.c);
    this.Mc = lightComponentUpdateCount;
    this.Nc = _getCameraControllerUpdateCount(this.c);
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
    _CameraComponent.Cc.delete(engine.engineUid);
  }
};
_CameraComponent._eye = Vector3.zero();
_CameraComponent.Cc = /* @__PURE__ */ new Map();
_CameraComponent.returnVector3 = MutableVector3.zero();
_CameraComponent.Hc = MutableVector3.zero();
_CameraComponent.Dc = MutableVector3.zero();
_CameraComponent.Ec = MutableVector3.zero();
_CameraComponent.zc = MutableMatrix44.zero();
_CameraComponent.Ic = MutableMatrix44.zero();
_CameraComponent.Oc = Matrix44.fromCopy16ColumnMajor(
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
_CameraComponent.Pc = Matrix44.fromCopy16ColumnMajor(
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvbmVudFNJRCwgQ29tcG9uZW50VElELCBFbnRpdHlVSUQgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuLi8uLi9jb3JlL0NvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IElFbnRpdHkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eSc7XG5pbXBvcnQgeyBhcHBseU1peGlucywgdHlwZSBFbnRpdHlSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHlSZXBvc2l0b3J5JztcbmltcG9ydCB7IEJ1ZmZlclVzZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBDYW1lcmFUeXBlLCB0eXBlIENhbWVyYVR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ2FtZXJhVHlwZSc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTGlnaHRUeXBlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvTGlnaHRUeXBlJztcbmltcG9ydCB7IFByb2Nlc3NBcHByb2FjaCB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHsgU2hhZGVyVHlwZSB9IGZyb20gJy4uLy4uL2RlZmluaXRpb25zL1NoYWRlclR5cGUnO1xuaW1wb3J0IHsgRnJ1c3R1bSB9IGZyb20gJy4uLy4uL2dlb21ldHJ5L0ZydXN0dW0nO1xuaW1wb3J0IHR5cGUgeyBJQ2FtZXJhRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMiB9IGZyb20gJy4uLy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRoVXRpbCB9IGZyb20gJy4uLy4uL21hdGgvTWF0aFV0aWwnO1xuaW1wb3J0IHsgTWF0cml4NDQgfSBmcm9tICcuLi8uLi9tYXRoL01hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZU1hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB0eXBlIHsgVmVjdG9yMiB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMic7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBfZ2V0Q2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50IH0gZnJvbSAnLi4vQ2FtZXJhQ29udHJvbGxlci9DYW1lcmFDb250cm9sbGVyVXBkYXRlQ291bnQnO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHMgfSBmcm9tICcuLi9Db21wb25lbnRUeXBlcyc7XG5pbXBvcnQgeyBUcmFuc2Zvcm1Db21wb25lbnQgfSBmcm9tICcuLi9UcmFuc2Zvcm0vVHJhbnNmb3JtQ29tcG9uZW50JztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9XZWxsS25vd25Db21wb25lbnRUSURzJztcblxuLyoqXG4gKiBUaGUgQ29tcG9uZW50IHRoYXQgcmVwcmVzZW50cyBhIGNhbWVyYS5cbiAqXG4gKiBAcmVtYXJrc1xuICogVGhlIGNhbWVyYSBpcyBkZWZpbmVkIHN1Y2ggdGhhdCB0aGUgbG9jYWwgK1ggYXhpcyBpcyB0byB0aGUgcmlnaHQsXG4gKiB0aGUgXCJsZW5zXCIgbG9va3MgdG93YXJkcyB0aGUgbG9jYWwgLVogYXhpcyxcbiAqIGFuZCB0aGUgdG9wIG9mIHRoZSBjYW1lcmEgaXMgYWxpZ25lZCB3aXRoIHRoZSBsb2NhbCArWSBheGlzLlxuICovXG5leHBvcnQgY2xhc3MgQ2FtZXJhQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgX2V5ZTogVmVjdG9yMyA9IFZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9leWVJbm5lcjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX2RpcmVjdGlvbjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgLTEpO1xuICBwcml2YXRlIF9kaXJlY3Rpb25Jbm5lcjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMCwgLTEpO1xuICBwcml2YXRlIF91cDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weTMoMCwgMSwgMCk7XG4gIHByaXZhdGUgX3VwSW5uZXI6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuZnJvbUNvcHkzKDAsIDEsIDApO1xuICBwcml2YXRlIF9maWxtV2lkdGggPSAzNjsgLy8gbWlsaSBtZXRlclxuICBwcml2YXRlIF9maWxtSGVpZ2h0ID0gMjQ7IC8vIG1pbGkgbWV0ZXJcbiAgcHJpdmF0ZSBfZm9jYWxMZW5ndGggPSAyMDtcbiAgcHJpdmF0ZSBwcmltaXRpdmVNb2RlID0gZmFsc2U7XG4gIC8vIHg6IGxlZnQsIHk6cmlnaHQsIHo6dG9wLCB3OiBib3R0b21cbiAgcHJpdmF0ZSBfY29ybmVyOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5NCgtMSwgMSwgMSwgLTEpO1xuICBwcml2YXRlIF9jb3JuZXJJbm5lcjogTXV0YWJsZVZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC5mcm9tQ29weTQoLTEsIDEsIDEsIC0xKTtcblxuICAvLyB4OiB6TmVhciwgeTogekZhcixcbiAgLy8gaWYgcGVyc3BlY3RpdmUsIHo6IGZvdnksIHc6IGFzcGVjdFxuICAvLyBpZiBvcnRobywgejogeG1hZywgdzogeW1hZ1xuICBwcml2YXRlIF9wYXJhbWV0ZXJzOiBNdXRhYmxlVmVjdG9yNCA9IE11dGFibGVWZWN0b3I0LmZyb21Db3B5NCgwLjEsIDEwMDAwLCA5MCwgMSk7XG4gIHByaXZhdGUgX3BhcmFtZXRlcnNJbm5lcjogTXV0YWJsZVZlY3RvcjQgPSBNdXRhYmxlVmVjdG9yNC5mcm9tQ29weTQoMC4xLCAxMDAwMCwgOTAsIDEpO1xuICBwcml2YXRlIF9fdHlwZTogQ2FtZXJhVHlwZUVudW0gPSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlO1xuXG4gIHByaXZhdGUgX3Byb2plY3Rpb25NYXRyaXg6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5kdW1teSgpO1xuICAvLyBUaGUgcHJvamVjdGlvbiBtYXRyaXggYmVmb3JlIHRoZSB0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nIGppdHRlciBpcyBhcHBsaWVkIChub3QgdXBsb2FkZWQgdG8gdGhlIEdQVSkuXG4gIHByaXZhdGUgX19wcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlcjogTXV0YWJsZU1hdHJpeDQ0ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG4gIHByaXZhdGUgX19oYXNQcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlciA9IGZhbHNlO1xuICAvLyBOREMgb2Zmc2V0IG9mIHRoZSB0ZW1wb3JhbCBhbnRpLWFsaWFzaW5nIGppdHRlci5cbiAgcHJpdmF0ZSBfX2ppdHRlck9mZnNldDogTXV0YWJsZVZlY3RvcjIgPSBNdXRhYmxlVmVjdG9yMi56ZXJvKCk7XG4gIHByaXZhdGUgX3ZpZXdNYXRyaXg6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5kdW1teSgpO1xuICBwcml2YXRlIF92aWV3UG9zaXRpb246IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuZHVtbXkoKTtcbiAgLy8geDogdGhlIHZlYzQgaW5kZXggb2YgdGhlIGxpZ2h0IGNsdXN0ZXIgdmlldyByZWdpb24gb2YgdGhpcyBjYW1lcmEgaW4gdGhlIEdQVSBkYXRhICgtMTogbm9uZSkuIFdyaXR0ZW4gYnlcbiAgLy8gTGlnaHRDbHVzdGVyU3lzdGVtIGV2ZXJ5IGZyYW1lIChzZWUgTGlnaHRDbHVzdGVyU3lzdGVtLl9fYXNzaWduVmlld3MpLiBUaGUgc2hhZGVycyByZWFkIGl0IGFzIHRoZSBiYXNlIG9mIHRoZVxuICAvLyB2aWV3IGhlYWRlciwgdGhlIGNsdXN0ZXIgdGFibGUgYW5kIHRoZSBsaWdodCBpbmRleCBsaXN0IChXZWJHTDI6IHRocm91Z2ggdGhlIHVfbGlnaHRDbHVzdGVyVmlldyB1bmlmb3JtLFxuICAvLyBXZWJHUFU6IGZyb20gdGhlIEdQVSBpbnN0YW5jZSBkYXRhKS5cbiAgcHJpdmF0ZSBfbGlnaHRDbHVzdGVyVmlld0luZm86IE11dGFibGVWZWN0b3I0ID0gTXV0YWJsZVZlY3RvcjQuZHVtbXkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19jdXJyZW50TWFwOiBNYXA8bnVtYmVyLCBDb21wb25lbnRTSUQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHN0YXRpYyByZXR1cm5WZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjNfMDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjdG9yM18xOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3IzXzI6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcE1hdHJpeDQ0XzAgPSBNdXRhYmxlTWF0cml4NDQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcE1hdHJpeDQ0XzEgPSBNdXRhYmxlTWF0cml4NDQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX2JpYXNNYXRyaXhXZWJHTCA9IE1hdHJpeDQ0LmZyb21Db3B5MTZDb2x1bW5NYWpvcihcbiAgICAwLjUsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuNSxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMC41LFxuICAgIDAuMCxcbiAgICAwLjUsXG4gICAgMC41LFxuICAgIDAuNSxcbiAgICAxLjBcbiAgKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19iaWFzTWF0cml4V2ViR1BVID0gTWF0cml4NDQuZnJvbUNvcHkxNkNvbHVtbk1ham9yKFxuICAgIDAuNSxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgLTAuNSxcbiAgICAwLjAsXG4gICAgMC4wLFxuICAgIDAuMCxcbiAgICAwLjAsXG4gICAgMS4wLFxuICAgIDAuMCxcbiAgICAwLjUsXG4gICAgMC41LFxuICAgIDAuMCxcbiAgICAxLjBcbiAgKTtcbiAgX3hyTGVmdCA9IGZhbHNlO1xuICBfeHJSaWdodCA9IGZhbHNlO1xuICBwdWJsaWMgaXNTeW5jVG9MaWdodCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX19mcnVzdHVtID0gbmV3IEZydXN0dW0oKTtcblxuICBwcml2YXRlIF9fdXBkYXRlQ291bnQgPSAwO1xuICBwcml2YXRlIF9fbGFzdFVwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0VHJhbnNmb3JtQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG4gIHByaXZhdGUgX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQgPSAtMTtcbiAgcHJpdmF0ZSBfX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gLTE7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQ2FtZXJhQ29tcG9uZW50IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZW50aXR5VWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBlbnRpdHkgdGhpcyBjb21wb25lbnQgYmVsb25ncyB0b1xuICAgKiBAcGFyYW0gY29tcG9uZW50U2lkIC0gVGhlIGNvbXBvbmVudCBzeXN0ZW0gaWRlbnRpZmllclxuICAgKiBAcGFyYW0gZW50aXR5UmVwb3NpdG9yeSAtIFRoZSBlbnRpdHkgcmVwb3NpdG9yeSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkIGZyb20gYSBwb29sXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5UmVwb3NpdG9yeSwgaXNSZVVzZSk7XG5cbiAgICB0aGlzLnNldEZvdnlBbmRDaGFuZ2VGb2NhbExlbmd0aCg5MCk7XG5cbiAgICBpZiAoQ2FtZXJhQ29tcG9uZW50LmdldEN1cnJlbnQoZW5naW5lKSA9PT0gLTEpIHtcbiAgICAgIENhbWVyYUNvbXBvbmVudC5zZXRDdXJyZW50KGVuZ2luZSwgY29tcG9uZW50U2lkKTtcbiAgICB9XG5cbiAgICB0aGlzLnN1Ym1pdFRvQWxsb2NhdGlvbihlbmdpbmUuY29uZmlnLmNhbWVyYUNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldywgaXNSZVVzZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBhY3RpdmUgY2FtZXJhIGNvbXBvbmVudCBJRCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgc3lzdGVtIGlkZW50aWZpZXIgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIGNhbWVyYSBmb3IgdGhlIGVuZ2luZVxuICAgKi9cbiAgc3RhdGljIGdldEN1cnJlbnQoZW5naW5lOiBFbmdpbmUpOiBDb21wb25lbnRTSUQge1xuICAgIHJldHVybiB0aGlzLl9fY3VycmVudE1hcC5nZXQoZW5naW5lLmVuZ2luZVVpZCkgPz8gLTE7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBhY3RpdmUgY2FtZXJhIGNvbXBvbmVudCBmb3IgYSBzcGVjaWZpYyBlbmdpbmUuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBjb21wb25lbnRTSUQgLSBUaGUgY29tcG9uZW50IHN5c3RlbSBpZGVudGlmaWVyIG9mIHRoZSBjYW1lcmEgdG8gc2V0IGFzIGN1cnJlbnRcbiAgICovXG4gIHN0YXRpYyBzZXRDdXJyZW50KGVuZ2luZTogRW5naW5lLCBjb21wb25lbnRTSUQ6IENvbXBvbmVudFNJRCk6IHZvaWQge1xuICAgIHRoaXMuX19jdXJyZW50TWFwLnNldChlbmdpbmUuZW5naW5lVWlkLCBjb21wb25lbnRTSUQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwZGF0ZSBjb3VudCBmb3IgdGhpcyBjYW1lcmEgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIHRpbWVzIHRoaXMgY2FtZXJhIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICovXG4gIGdldCB1cGRhdGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3VwZGF0ZUNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHVwZGF0ZSBjb3VudCBvZiB0aGUgY3VycmVudCBhY3RpdmUgY2FtZXJhLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlIGNvdW50IG9mIHRoZSBjdXJyZW50IGNhbWVyYSwgb3IgMCBpZiBubyBjYW1lcmEgaXMgYWN0aXZlXG4gICAqL1xuICBzdGF0aWMgZ2V0Q3VycmVudENhbWVyYVVwZGF0ZUNvdW50KGVuZ2luZTogRW5naW5lKSB7XG4gICAgY29uc3QgY3VycmVudENhbWVyYUNvbXBvbmVudCA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5LmdldENvbXBvbmVudChcbiAgICAgIENhbWVyYUNvbXBvbmVudCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5nZXRDdXJyZW50KGVuZ2luZSlcbiAgICApIGFzIHVua25vd24gYXMgQ2FtZXJhQ29tcG9uZW50O1xuICAgIHJldHVybiBjdXJyZW50Q2FtZXJhQ29tcG9uZW50Py51cGRhdGVDb3VudCA/PyAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNhbWVyYSB0eXBlIChwZXJzcGVjdGl2ZSwgb3J0aG9ncmFwaGljLCBvciBmcnVzdHVtKS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgY2FtZXJhIHR5cGUgdG8gc2V0XG4gICAqL1xuICBzZXQgdHlwZSh0eXBlOiBDYW1lcmFUeXBlRW51bSkge1xuICAgIHRoaXMuX190eXBlID0gdHlwZTtcbiAgICBpZiAodHlwZSA9PT0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWMpIHtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnMueiA9IDE7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLncgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldEZvdnlBbmRDaGFuZ2VGb2NhbExlbmd0aCg5MCk7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSAxO1xuICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSA5MDtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gMTtcbiAgICB9XG5cbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgdHlwZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgY2FtZXJhIHR5cGVcbiAgICovXG4gIGdldCB0eXBlKCkge1xuICAgIHJldHVybiB0aGlzLl9fdHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgZXllIHBvc2l0aW9uIChhbHdheXMgKDAsMCwwKSBpbiBSaG9kb25pdGUpLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZXllIHBvc2l0aW9uIHZlY3RvciAoYWx3YXlzIHplcm8pXG4gICAqL1xuICBnZXQgZXllKCkge1xuICAgIC8vIEluIFJob2Rvbml0ZSwgZXllIGlzIGFsd2F5cyAoMCwwLDApLiBVc2UgVHJhbnNmb3JtQ29tcG9uZW50IGZvciBDYW1lcmEgcG9zaXRpb25pbmdcbiAgICByZXR1cm4gQ2FtZXJhQ29tcG9uZW50Ll9leWU7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gc2V0IHRoZSBleWUgcG9zaXRpb24gKHRocm93cyBlcnJvciBhcyB0aGlzIGlzIG5vdCBzdXBwb3J0ZWQpLlxuICAgKlxuICAgKiBAcGFyYW0gbm9Vc2VWZWMgLSBUaGUgdmVjdG9yIHRvIHNldCAobm90IHVzZWQpXG4gICAqIEB0aHJvd3MgQWx3YXlzIHRocm93cyBhbiBlcnJvciBhcyBleWUgcG9zaXRpb25pbmcgc2hvdWxkIHVzZSBUcmFuc2Zvcm1Db21wb25lbnRcbiAgICovXG4gIHNldCBleWUoX25vVXNlVmVjOiBWZWN0b3IzKSB7XG4gICAgdGhyb3cgRXJyb3IoJ0luIFJob2Rvbml0ZSwgZXllIGlzIGFsd2F5cyAoMCwwLDApLiBVc2UgVHJhbnNmb3JtQ29tcG9uZW50IGZvciBDYW1lcmEgcG9zaXRpb25pbmcuJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IGV5ZUlubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9leWVJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBleWUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHNldCBhcyB0aGUgaW50ZXJuYWwgZXllIHBvc2l0aW9uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgc2V0IGV5ZUlubmVyKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX2V5ZUlubmVyLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgdXAgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIGludGVybmFsIHVwIGRpcmVjdGlvblxuICAgKi9cbiAgc2V0IHVwSW5uZXIodmVjOiBWZWN0b3IzKSB7XG4gICAgdGhpcy5fdXBJbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHVwIHZlY3RvciBvZiB0aGUgY2FtZXJhLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIHVwIGRpcmVjdGlvblxuICAgKi9cbiAgc2V0IHVwKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX3VwLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdXAgdmVjdG9yIG9mIHRoZSBjYW1lcmEuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgdXAgdmVjdG9yXG4gICAqL1xuICBnZXQgdXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3VwLmNsb25lKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgdXAgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgdXAgdmVjdG9yXG4gICAqL1xuICBnZXQgdXBJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5fdXBJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBkaXJlY3Rpb24gdmVjdG9yIG9mIHRoZSBjYW1lcmEgYW5kIGF1dG9tYXRpY2FsbHkgYWRqdXN0cyB0aGUgdXAgdmVjdG9yIHRvIHJlbWFpbiBvcnRob2dvbmFsLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIG5ldyBkaXJlY3Rpb24gdmVjdG9yIGZvciB0aGUgY2FtZXJhXG4gICAqL1xuICBzZXQgZGlyZWN0aW9uKHZlYzogVmVjdG9yMykge1xuICAgIGNvbnN0IG9sZERpcmVjdGlvbiA9IHRoaXMuX2RpcmVjdGlvbjtcbiAgICBjb25zdCBuZXdEaXJlY3Rpb24gPSB2ZWM7XG4gICAgY29uc3Qgb2xkVXAgPSB0aGlzLl91cDtcblxuICAgIGNvbnN0IG9ydGhvZ29uYWxWZWN0b3JOZXdEaXJlY3Rpb25BbmRPbGRVcCA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8oXG4gICAgICBuZXdEaXJlY3Rpb24sXG4gICAgICBvbGRVcCxcbiAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMFxuICAgICk7XG4gICAgY29uc3QgaXNPcnRob2dvbmFsTmV3RGlyZWN0aW9uQW5kT2xkVXAgPSBvcnRob2dvbmFsVmVjdG9yTmV3RGlyZWN0aW9uQW5kT2xkVXAubGVuZ3RoKCkgPT09IDAuMDtcblxuICAgIGxldCBuZXdVcE5vbk5vcm1hbGl6ZTogTXV0YWJsZVZlY3RvcjM7XG4gICAgaWYgKGlzT3J0aG9nb25hbE5ld0RpcmVjdGlvbkFuZE9sZFVwKSB7XG4gICAgICBjb25zdCByZWxhdGl2ZVhheGlzID0gTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhvbGREaXJlY3Rpb24sIG9sZFVwLCBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzEpO1xuICAgICAgbmV3VXBOb25Ob3JtYWxpemUgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKHJlbGF0aXZlWGF4aXMsIG5ld0RpcmVjdGlvbiwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbmV3RGlyZWN0aW9uQ29tcG9uZW50SW5PbGRVcCA9IE11dGFibGVWZWN0b3IzLm11bHRpcGx5VG8oXG4gICAgICAgIG5ld0RpcmVjdGlvbixcbiAgICAgICAgbmV3RGlyZWN0aW9uLmRvdChvbGRVcCksXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMVxuICAgICAgKTtcbiAgICAgIG5ld1VwTm9uTm9ybWFsaXplID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhcbiAgICAgICAgb2xkVXAsXG4gICAgICAgIG5ld0RpcmVjdGlvbkNvbXBvbmVudEluT2xkVXAsXG4gICAgICAgIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMlxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cC5jb3B5Q29tcG9uZW50cyhuZXdVcE5vbk5vcm1hbGl6ZSkubm9ybWFsaXplKCk7XG4gICAgdGhpcy5fZGlyZWN0aW9uLmNvcHlDb21wb25lbnRzKG5ld0RpcmVjdGlvbik7XG5cbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBkaXJlY3Rpb24gdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBzZXQgYXMgdGhlIGludGVybmFsIGRpcmVjdGlvblxuICAgKi9cbiAgc2V0IGRpcmVjdGlvbklubmVyKHZlYzogVmVjdG9yMykge1xuICAgIHRoaXMuX2RpcmVjdGlvbklubmVyLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGlyZWN0aW9uIHZlY3RvciBvZiB0aGUgY2FtZXJhLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICovXG4gIGdldCBkaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RpcmVjdGlvbi5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGRpcmVjdGlvbiB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBkaXJlY3Rpb24gdmVjdG9yXG4gICAqL1xuICBnZXQgZGlyZWN0aW9uSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RpcmVjdGlvbklubmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvcm5lciBwYXJhbWV0ZXJzIChsZWZ0LCByaWdodCwgdG9wLCBib3R0b20pIGZvciBmcnVzdHVtIGNhbWVyYS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSBjb3JuZXIgdmVjdG9yICh4OiBsZWZ0LCB5OiByaWdodCwgejogdG9wLCB3OiBib3R0b20pXG4gICAqL1xuICBzZXQgY29ybmVyKHZlYzogVmVjdG9yNCkge1xuICAgIHRoaXMuX2Nvcm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvcm5lciBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNvcHkgb2YgdGhlIGNvcm5lciB2ZWN0b3JcbiAgICovXG4gIGdldCBjb3JuZXIoKTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lci5jbG9uZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxlZnQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgbGVmdCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVyLnggPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgbGVmdCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IGxlZnRJbm5lcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVySW5uZXIueCA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGxlZnQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZWZ0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBnZXQgbGVmdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyLng7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSByaWdodCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IHJpZ2h0KHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9jb3JuZXIueSA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIHJpZ2h0IGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCByaWdodElubmVyKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9jb3JuZXJJbm5lci55ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcmlnaHQgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByaWdodCBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgZ2V0IHJpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLl9jb3JuZXIueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCB0b3AodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lci56ID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgaW50ZXJuYWwgdG9wIGNsaXBwaW5nIHBsYW5lIHBvc2l0aW9uXG4gICAqL1xuICBzZXQgdG9wSW5uZXIodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX2Nvcm5lcklubmVyLnogPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0b3AgY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIGdldCB0b3AoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lci56O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgc2V0IGJvdHRvbSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVyLncgPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBpbnRlcm5hbCBib3R0b20gY2xpcHBpbmcgcGxhbmUgcG9zaXRpb25cbiAgICovXG4gIHNldCBib3R0b21Jbm5lcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fY29ybmVySW5uZXIudyA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJvdHRvbSBjbGlwcGluZyBwbGFuZSBwb3NpdGlvblxuICAgKi9cbiAgZ2V0IGJvdHRvbSgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29ybmVyLnc7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgY29ybmVyIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgaW50ZXJuYWwgY29ybmVyIHZlY3RvclxuICAgKi9cbiAgc2V0IGNvcm5lcklubmVyKHZlYzogVmVjdG9yNCkge1xuICAgIHRoaXMuX2Nvcm5lcklubmVyLmNvcHlDb21wb25lbnRzKHZlYyk7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgY29ybmVyIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBjb3JuZXIgdmVjdG9yXG4gICAqL1xuICBnZXQgY29ybmVySW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvcm5lcklubmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGNhbWVyYSBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIGludGVybmFsIHBhcmFtZXRlcnMgdmVjdG9yXG4gICAqL1xuICBzZXQgcGFyYW1ldGVyc0lubmVyKHZlYzogVmVjdG9yNCkge1xuICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci5jb3B5Q29tcG9uZW50cyh2ZWMpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGNhbWVyYSBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW50ZXJuYWwgcGFyYW1ldGVycyB2ZWN0b3JcbiAgICovXG4gIGdldCBwYXJhbWV0ZXJzSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnNJbm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYW1lcmEgcGFyYW1ldGVycy5cbiAgICpcbiAgICogQHJldHVybnMgQSBjb3B5IG9mIHRoZSBwYXJhbWV0ZXJzIHZlY3RvclxuICAgKi9cbiAgZ2V0IHBhcmFtZXRlcnMoKTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMuY2xvbmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6TmVhcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnMueCA9IHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnRlcm5hbCBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGludGVybmFsIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6TmVhcklubmVyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnggPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW50ZXJuYWwgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIG5lYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIGdldCB6TmVhcklubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIGRpc3RhbmNlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmVhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZVxuICAgKi9cbiAgZ2V0IHpOZWFyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzLng7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZm9jYWwgbGVuZ3RoIGFuZCBhdXRvbWF0aWNhbGx5IGNhbGN1bGF0ZXMgdGhlIGZpZWxkIG9mIHZpZXcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgZm9jYWwgbGVuZ3RoIGluIG1pbGxpbWV0ZXJzXG4gICAqL1xuICBzZXQgZm9jYWxMZW5ndGgodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9mb2NhbExlbmd0aCA9IHZhbDtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSAyICogTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUoTWF0aC5hdGFuKHRoaXMuX2ZpbG1IZWlnaHQgLyAodmFsICogMikpKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmb2NhbCBsZW5ndGguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmb2NhbCBsZW5ndGggaW4gbWlsbGltZXRlcnNcbiAgICovXG4gIGdldCBmb2NhbExlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZm9jYWxMZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW50ZXJuYWwgZm9jYWwgbGVuZ3RoIGFuZCBjYWxjdWxhdGVzIHRoZSBmaWVsZCBvZiB2aWV3LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGludGVybmFsIGZvY2FsIGxlbmd0aFxuICAgKi9cbiAgc2V0IGZvY2FsTGVuZ3RoSW5uZXIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueiA9IDIgKiBNYXRoVXRpbC5yYWRpYW5Ub0RlZ3JlZShNYXRoLmF0YW4odGhpcy5fZmlsbUhlaWdodCAvICh2YWwgKiAyKSkpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGZvY2FsIGxlbmd0aC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGZvY2FsIGxlbmd0aFxuICAgKi9cbiAgZ2V0IGZvY2FsTGVuZ3RoSW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6RmFyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVycy55ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIHNldCB6RmFySW5uZXIodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueSA9IHZhbDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnRlcm5hbCBmYXIgY2xpcHBpbmcgcGxhbmUgZGlzdGFuY2VcbiAgICovXG4gIGdldCB6RmFySW5uZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnNJbm5lci55O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGZhciBjbGlwcGluZyBwbGFuZSBkaXN0YW5jZVxuICAgKi9cbiAgZ2V0IHpGYXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmaWVsZCBvZiB2aWV3IGFuZCBhZGp1c3RzIHRoZSBmaWxtIHNpemUgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBkZWdyZWUgLSBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBzZXRGb3Z5QW5kQ2hhbmdlRmlsbVNpemUoZGVncmVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSBkZWdyZWU7XG4gICAgdGhpcy5fZmlsbUhlaWdodCA9IDIgKiB0aGlzLmZvY2FsTGVuZ3RoICogTWF0aC50YW4oTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oZGVncmVlKSAvIDIpO1xuICAgIHRoaXMuX2ZpbG1XaWR0aCA9IHRoaXMuX2ZpbG1IZWlnaHQgKiB0aGlzLmFzcGVjdDtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBmaWVsZCBvZiB2aWV3IGFuZCBhZGp1c3RzIHRoZSBmb2NhbCBsZW5ndGggYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBwYXJhbSBkZWdyZWUgLSBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBzZXRGb3Z5QW5kQ2hhbmdlRm9jYWxMZW5ndGgoZGVncmVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSBkZWdyZWU7XG4gICAgdGhpcy5fZm9jYWxMZW5ndGggPSB0aGlzLl9maWxtSGVpZ2h0IC8gMiAvIE1hdGgudGFuKE1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKGRlZ3JlZSkgLyAyKTtcbiAgICB0aGlzLl9fdXBkYXRlQ291bnQrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBmaWVsZCBvZiB2aWV3LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBnZXQgZm92eSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1ldGVycy56O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGZpZWxkIG9mIHZpZXcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgaW50ZXJuYWwgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzXG4gICAqL1xuICBzZXQgZm92eUlubmVyKHZhbDogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgYXNwZWN0IHJhdGlvIGFuZCBhZGp1c3RzIHRoZSBmaWxtIHdpZHRoIGFjY29yZGluZ2x5LlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGFzcGVjdCByYXRpbyAod2lkdGgvaGVpZ2h0KVxuICAgKi9cbiAgc2V0IGFzcGVjdCh2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnMudyA9IHZhbDtcbiAgICB0aGlzLl9maWxtV2lkdGggPSB0aGlzLl9maWxtSGVpZ2h0ICogdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGludGVybmFsIGFzcGVjdCByYXRpby5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBpbnRlcm5hbCBhc3BlY3QgcmF0aW9cbiAgICovXG4gIHNldCBhc3BlY3RJbm5lcih2YWw6IG51bWJlcikge1xuICAgIHRoaXMuX3BhcmFtZXRlcnNJbm5lci53ID0gdmFsO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGludGVybmFsIGFzcGVjdCByYXRpby5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGludGVybmFsIGFzcGVjdCByYXRpb1xuICAgKi9cbiAgZ2V0IGFzcGVjdElubmVyKCkge1xuICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhc3BlY3QgcmF0aW8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhc3BlY3QgcmF0aW9cbiAgICovXG4gIGdldCBhc3BlY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMudztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBYIG1hZ25pZmljYXRpb24gZm9yIG9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIFggbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgc2V0IHhNYWcodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLnogPSB2YWw7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWCBtYWduaWZpY2F0aW9uIGZvciBvcnRob2dyYXBoaWMgcHJvamVjdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFggbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgZ2V0IHhNYWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMuejtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBZIG1hZ25pZmljYXRpb24gZm9yIG9ydGhvZ3JhcGhpYyBwcm9qZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIFkgbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgc2V0IHlNYWcodmFsOiBudW1iZXIpIHtcbiAgICB0aGlzLl9wYXJhbWV0ZXJzLncgPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWSBtYWduaWZpY2F0aW9uIGZvciBvcnRob2dyYXBoaWMgcHJvamVjdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFkgbWFnbmlmaWNhdGlvbiB2YWx1ZVxuICAgKi9cbiAgZ2V0IHlNYWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnMudztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyIGZvciBjYW1lcmEgY29tcG9uZW50cy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNhbWVyYSBjb21wb25lbnQgdHlwZSBpZGVudGlmaWVyXG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvbmVudFRJRCgpIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBjYW1lcmEgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2FtZXJhIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXJcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyBhbmQgcmV0dXJucyB0aGUgcHJvamVjdGlvbiBtYXRyaXggYmFzZWQgb24gY2FtZXJhIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYWxjdWxhdGVkIHByb2plY3Rpb24gbWF0cml4XG4gICAqL1xuICBjYWxjUHJvamVjdGlvbk1hdHJpeCgpIHtcbiAgICBjb25zdCB6TmVhciA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci54O1xuICAgIGNvbnN0IHpGYXIgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueTtcblxuICAgIGlmICh0aGlzLl9fZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgZm92eSA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICAgICAgICBsZXQgYXNwZWN0ID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnc7XG4gICAgICAgIGlmIChhc3BlY3QgPCAwKSB7XG4gICAgICAgICAgYXNwZWN0ID0gdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHlzY2FsZSA9IDEuMCAvIE1hdGgudGFuKCgwLjUgKiBmb3Z5ICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICBjb25zdCB4c2NhbGUgPSB5c2NhbGUgLyBhc3BlY3Q7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAwID0geHNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAyID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMDMgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMCA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTExID0geXNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMiA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTEzID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMSA9IDA7XG4gICAgICAgIGlmICh6RmFyID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpIHtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9IC0xO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gLXpOZWFyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IG5mID0gMSAvICh6TmVhciAtIHpGYXIpO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIyID0gekZhciAqIG5mO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gekZhciAqIHpOZWFyICogbmY7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMyID0gLTE7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMzID0gMDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSBDYW1lcmFUeXBlLk9ydGhvZ3JhcGhpYykge1xuICAgICAgICBjb25zdCB4bWFnID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLno7XG4gICAgICAgIGNvbnN0IHltYWcgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudztcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5zZXRDb21wb25lbnRzKFxuICAgICAgICAgIDEgLyB4bWFnLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMSAvIHltYWcsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAtMSAvICh6RmFyIC0gek5lYXIpLFxuICAgICAgICAgIC16TmVhciAvICh6RmFyIC0gek5lYXIpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDEuMFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2Nvcm5lcklubmVyLng7XG4gICAgICAgIGNvbnN0IHJpZ2h0ID0gdGhpcy5fY29ybmVySW5uZXIueTtcbiAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fY29ybmVySW5uZXIuejtcbiAgICAgICAgY29uc3QgYm90dG9tID0gdGhpcy5fY29ybmVySW5uZXIudztcbiAgICAgICAgY29uc3QgbmYgPSAxIC8gKHpOZWFyIC0gekZhcik7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguc2V0Q29tcG9uZW50cyhcbiAgICAgICAgICAoMiAqIHpOZWFyKSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAocmlnaHQgKyBsZWZ0KSAvIChyaWdodCAtIGxlZnQpLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgKDIgKiB6TmVhcikgLyAodG9wIC0gYm90dG9tKSxcbiAgICAgICAgICAodG9wICsgYm90dG9tKSAvICh0b3AgLSBib3R0b20pLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIHpGYXIgKiBuZixcbiAgICAgICAgICB6RmFyICogek5lYXIgKiBuZixcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIC0xLjAsXG4gICAgICAgICAgMC4wXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLnR5cGUgPT09IENhbWVyYVR5cGUuUGVyc3BlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgZm92eSA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci56O1xuICAgICAgICBsZXQgYXNwZWN0ID0gdGhpcy5fcGFyYW1ldGVyc0lubmVyLnc7XG4gICAgICAgIGlmIChhc3BlY3QgPCAwKSB7XG4gICAgICAgICAgYXNwZWN0ID0gdGhpcy5fX2VuZ2luZS5lbmdpbmVTdGF0ZS52aWV3cG9ydEFzcGVjdFJhdGlvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHlzY2FsZSA9IDEuMCAvIE1hdGgudGFuKCgwLjUgKiBmb3Z5ICogTWF0aC5QSSkgLyAxODApO1xuICAgICAgICBjb25zdCB4c2NhbGUgPSB5c2NhbGUgLyBhc3BlY3Q7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAwID0geHNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0wMSA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTAyID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMDMgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMCA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTExID0geXNjYWxlO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0xMiA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTEzID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjAgPSAwO1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMSA9IDA7XG4gICAgICAgIGlmICh6RmFyID09PSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpIHtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9IC0xO1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTIzID0gLTIgKiB6TmVhcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBuZiA9IDEgLyAoek5lYXIgLSB6RmFyKTtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0yMiA9ICh6RmFyICsgek5lYXIpICogbmY7XG4gICAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMjMgPSAyLjAgKiB6RmFyICogek5lYXIgKiBuZjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4Lm0zMCA9IDA7XG4gICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXgubTMxID0gMDtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzIgPSAtMTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5tMzMgPSAwO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09IENhbWVyYVR5cGUuT3J0aG9ncmFwaGljKSB7XG4gICAgICAgIGNvbnN0IHhtYWcgPSB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuejtcbiAgICAgICAgY29uc3QgeW1hZyA9IHRoaXMuX3BhcmFtZXRlcnNJbm5lci53O1xuICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4LnNldENvbXBvbmVudHMoXG4gICAgICAgICAgMSAvIHhtYWcsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAxIC8geW1hZyxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIC0yIC8gKHpGYXIgLSB6TmVhciksXG4gICAgICAgICAgLSh6RmFyICsgek5lYXIpIC8gKHpGYXIgLSB6TmVhciksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgMS4wXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fY29ybmVySW5uZXIueDtcbiAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLl9jb3JuZXJJbm5lci55O1xuICAgICAgICBjb25zdCB0b3AgPSB0aGlzLl9jb3JuZXJJbm5lci56O1xuICAgICAgICBjb25zdCBib3R0b20gPSB0aGlzLl9jb3JuZXJJbm5lci53O1xuICAgICAgICBjb25zdCBuZiA9IDEgLyAoek5lYXIgLSB6RmFyKTtcbiAgICAgICAgdGhpcy5fcHJvamVjdGlvbk1hdHJpeC5zZXRDb21wb25lbnRzKFxuICAgICAgICAgICgyICogek5lYXIpIC8gKHJpZ2h0IC0gbGVmdCksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIChyaWdodCArIGxlZnQpIC8gKHJpZ2h0IC0gbGVmdCksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAoMiAqIHpOZWFyKSAvICh0b3AgLSBib3R0b20pLFxuICAgICAgICAgICh0b3AgKyBib3R0b20pIC8gKHRvcCAtIGJvdHRvbSksXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAwLjAsXG4gICAgICAgICAgKHpGYXIgKyB6TmVhcikgKiBuZixcbiAgICAgICAgICAyICogekZhciAqIHpOZWFyICogbmYsXG4gICAgICAgICAgMC4wLFxuICAgICAgICAgIDAuMCxcbiAgICAgICAgICAtMS4wLFxuICAgICAgICAgIDAuMFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX19wcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlci5jb3B5Q29tcG9uZW50cyh0aGlzLl9wcm9qZWN0aW9uTWF0cml4KTtcbiAgICB0aGlzLl9faGFzUHJvamVjdGlvbk1hdHJpeFdpdGhvdXRKaXR0ZXIgPSB0cnVlO1xuICAgIHRoaXMuX19hcHBseUppdHRlclRvUHJvamVjdGlvbk1hdHJpeCgpO1xuXG4gICAgcmV0dXJuIHRoaXMuX3Byb2plY3Rpb25NYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIHRoZSBqaXR0ZXJlZCBwcm9qZWN0aW9uIG1hdHJpeCAoYF9fcHJvamVjdGlvbk1hdHJpeFdpdGhvdXRKaXR0ZXJgIG9mZnNldCBieSBgX19qaXR0ZXJPZmZzZXRgKVxuICAgKiBpbnRvIGBfcHJvamVjdGlvbk1hdHJpeGAuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIE9mZnNldHRpbmcgdGhlIE5EQyBwb3NpdGlvbiBieSAoangsIGp5KSBpcyB0aGUgY2xpcCBzcGFjZSB0cmFuc2xhdGlvbiBgeCcgPSB4ICsganggKiB3YCwgc28gdGhlXG4gICAqIHcgcm93IChyb3cgMykgaXMgYWRkZWQsIHNjYWxlZCwgdG8gdGhlIHggYW5kIHkgcm93cy4gVGhpcyB3b3JrcyBmb3IgZXZlcnkgcHJvamVjdGlvbiB0eXBlLlxuICAgKi9cbiAgcHJpdmF0ZSBfX2FwcGx5Sml0dGVyVG9Qcm9qZWN0aW9uTWF0cml4KCkge1xuICAgIGNvbnN0IGp4ID0gdGhpcy5fX2ppdHRlck9mZnNldC54O1xuICAgIGNvbnN0IGp5ID0gdGhpcy5fX2ppdHRlck9mZnNldC55O1xuICAgIGNvbnN0IHNyYyA9IHRoaXMuX19wcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlcjtcbiAgICBjb25zdCBkc3QgPSB0aGlzLl9wcm9qZWN0aW9uTWF0cml4O1xuICAgIGlmIChqeCA9PT0gMCAmJiBqeSA9PT0gMCkge1xuICAgICAgZHN0LmNvcHlDb21wb25lbnRzKHNyYyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRzdC5jb3B5Q29tcG9uZW50cyhzcmMpO1xuICAgIGRzdC5tMDAgPSBzcmMubTAwICsganggKiBzcmMubTMwO1xuICAgIGRzdC5tMDEgPSBzcmMubTAxICsganggKiBzcmMubTMxO1xuICAgIGRzdC5tMDIgPSBzcmMubTAyICsganggKiBzcmMubTMyO1xuICAgIGRzdC5tMDMgPSBzcmMubTAzICsganggKiBzcmMubTMzO1xuICAgIGRzdC5tMTAgPSBzcmMubTEwICsgankgKiBzcmMubTMwO1xuICAgIGRzdC5tMTEgPSBzcmMubTExICsgankgKiBzcmMubTMxO1xuICAgIGRzdC5tMTIgPSBzcmMubTEyICsgankgKiBzcmMubTMyO1xuICAgIGRzdC5tMTMgPSBzcmMubTEzICsgankgKiBzcmMubTMzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzdWItcGl4ZWwgb2Zmc2V0IGFkZGVkIHRvIHRoZSBwcm9qZWN0ZWQgcG9zaXRpb24sIGluIE5EQyB1bml0cyAoMiAvIHdpZHRoIGlzIG9uZSBwaXhlbCkuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFVzZWQgYnkgdGVtcG9yYWwgYW50aS1hbGlhc2luZy4gVGhlIG9mZnNldCBpcyBhcHBsaWVkIHRvIHRoZSBwcm9qZWN0aW9uIG1hdHJpeCB1cGxvYWRlZCB0byB0aGUgR1BVXG4gICAqIGFuZCB0byB7QGxpbmsgQ2FtZXJhQ29tcG9uZW50LnByb2plY3Rpb25NYXRyaXh9OyB7QGxpbmsgQ2FtZXJhQ29tcG9uZW50LnByb2plY3Rpb25NYXRyaXhXaXRob3V0Sml0dGVyfVxuICAgKiBrZWVwcyB0aGUgbWF0cml4IHdpdGhvdXQgaXQuIFNldHRpbmcgdGhlIG9mZnNldCBkb2VzIG5vdCBjb3VudCBhcyBhIGNhbWVyYSB1cGRhdGUgKGl0IGRvZXMgbm90XG4gICAqIHJlLXJ1biB0aGUgbG9naWMgc3RhZ2Ugb2YgdGhlIGNvbXBvbmVudHMpOyBpdCByZXdyaXRlcyB0aGUgcHJvamVjdGlvbiBtYXRyaXggaW4gcGxhY2UgYW5kIHJlcXVlc3RzXG4gICAqIGFuIHVwbG9hZCBvZiB0aGUgR1BVIGluc3RhbmNlIGRhdGEuIEl0IGlzIG5vdCBhcHBsaWVkIHRvIFdlYlhSIGV5ZSBjYW1lcmFzLlxuICAgKi9cbiAgZ2V0IGppdHRlck9mZnNldCgpOiBWZWN0b3IyIHtcbiAgICByZXR1cm4gdGhpcy5fX2ppdHRlck9mZnNldDtcbiAgfVxuXG4gIHNldCBqaXR0ZXJPZmZzZXQob2Zmc2V0OiBJVmVjdG9yMikge1xuICAgIGlmICh0aGlzLl9faml0dGVyT2Zmc2V0LnggPT09IG9mZnNldC54ICYmIHRoaXMuX19qaXR0ZXJPZmZzZXQueSA9PT0gb2Zmc2V0LnkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2ppdHRlck9mZnNldC5zZXRDb21wb25lbnRzKG9mZnNldC54LCBvZmZzZXQueSk7XG4gICAgaWYgKHRoaXMuX3hyTGVmdCB8fCB0aGlzLl94clJpZ2h0IHx8ICF0aGlzLl9faGFzUHJvamVjdGlvbk1hdHJpeFdpdGhvdXRKaXR0ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2FwcGx5Sml0dGVyVG9Qcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgdGhpcy5fX2VuZ2luZS5fbWFya0dwdUluc3RhbmNlRGF0YURpcnR5KCk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHByb2plY3Rpb24gbWF0cml4IHdpdGhvdXQgdGhlIGppdHRlciBvZmZzZXQgb2YgdGVtcG9yYWwgYW50aS1hbGlhc2luZy5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogRXF1YWwgdG8ge0BsaW5rIENhbWVyYUNvbXBvbmVudC5wcm9qZWN0aW9uTWF0cml4fSB3aGVuIHRoZSBqaXR0ZXIgb2Zmc2V0IGlzIHplcm8uXG4gICAqIE5vdCBkZWZpbmVkIGZvciBXZWJYUiBleWUgY2FtZXJhcy5cbiAgICovXG4gIGdldCBwcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlcigpOiBNYXRyaXg0NCB7XG4gICAgcmV0dXJuIHRoaXMuX19wcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGFuZCByZXR1cm5zIHRoZSB2aWV3IG1hdHJpeCBiYXNlZCBvbiBjYW1lcmEgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2FsY3VsYXRlZCB2aWV3IG1hdHJpeFxuICAgKi9cbiAgY2FsY1ZpZXdNYXRyaXgoKSB7XG4gICAgY29uc3QgZXllID0gdGhpcy5leWVJbm5lcjtcbiAgICBjb25zdCBmID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyh0aGlzLl9kaXJlY3Rpb25Jbm5lciwgZXllLCBDYW1lcmFDb21wb25lbnQuX190bXBWZWN0b3IzXzApLm5vcm1hbGl6ZSgpO1xuICAgIGNvbnN0IHMgPSBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKGYsIHRoaXMuX3VwSW5uZXIsIENhbWVyYUNvbXBvbmVudC5fX3RtcFZlY3RvcjNfMSkubm9ybWFsaXplKCk7XG4gICAgY29uc3QgdSA9IE11dGFibGVWZWN0b3IzLmNyb3NzVG8ocywgZiwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18yKTtcblxuICAgIHRoaXMuX3ZpZXdNYXRyaXguc2V0Q29tcG9uZW50cyhcbiAgICAgIHMueCxcbiAgICAgIHMueSxcbiAgICAgIHMueixcbiAgICAgIC1WZWN0b3IzLmRvdChzLCBleWUpLFxuICAgICAgdS54LFxuICAgICAgdS55LFxuICAgICAgdS56LFxuICAgICAgLVZlY3RvcjMuZG90KHUsIGV5ZSksXG4gICAgICAtZi54LFxuICAgICAgLWYueSxcbiAgICAgIC1mLnosXG4gICAgICBWZWN0b3IzLmRvdChmLCBleWUpLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMVxuICAgICk7XG5cbiAgICBpZiAoIXRoaXMucHJpbWl0aXZlTW9kZSkge1xuICAgICAgY29uc3QgaW52ZXJ0V29ybGRNYXRyaXggPSBNdXRhYmxlTWF0cml4NDQuaW52ZXJ0VG8oXG4gICAgICAgIHRoaXMuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5tYXRyaXhJbm5lcixcbiAgICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMFxuICAgICAgKTtcblxuICAgICAgdGhpcy5fdmlld01hdHJpeC5tdWx0aXBseShpbnZlcnRXb3JsZE1hdHJpeCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmlldyBtYXRyaXguXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB2aWV3IG1hdHJpeFxuICAgKi9cbiAgZ2V0IHZpZXdNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdNYXRyaXg7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmlldyBtYXRyaXguXG4gICAqXG4gICAqIEBwYXJhbSB2aWV3TWF0cml4IC0gVGhlIHZpZXcgbWF0cml4IHRvIHNldFxuICAgKi9cbiAgc2V0IHZpZXdNYXRyaXgodmlld01hdHJpeDogTWF0cml4NDQpIHtcbiAgICB0aGlzLl92aWV3TWF0cml4LmNvcHlDb21wb25lbnRzKHZpZXdNYXRyaXgpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHByb2plY3Rpb24gbWF0cml4LCBjb25zaWRlcmluZyBYUiBtb2RlIGlmIGFwcGxpY2FibGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCAobWF5IGJlIFhSLXNwZWNpZmljIG1hdHJpeCBpZiBpbiBYUiBtb2RlKVxuICAgKi9cbiAgZ2V0IHByb2plY3Rpb25NYXRyaXgoKSB7XG4gICAgaWYgKHRoaXMuX3hyTGVmdCB8fCB0aGlzLl94clJpZ2h0KSB7XG4gICAgICBjb25zdCB3ZWJYUlN5c3RlbSA9IHRoaXMuX19lbmdpbmUuX3dlYlhSU3lzdGVtSWZFbmFibGVkO1xuICAgICAgaWYgKHdlYlhSU3lzdGVtPy5pc1dlYlhSTW9kZSkge1xuICAgICAgICBpZiAodGhpcy5feHJMZWZ0KSB7XG4gICAgICAgICAgcmV0dXJuIHdlYlhSU3lzdGVtLmxlZnRQcm9qZWN0aW9uTWF0cml4O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl94clJpZ2h0KSB7XG4gICAgICAgICAgcmV0dXJuIHdlYlhSU3lzdGVtLnJpZ2h0UHJvamVjdGlvbk1hdHJpeDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcHJvamVjdGlvbk1hdHJpeDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwcm9qZWN0aW9uIG1hdHJpeC5cbiAgICpcbiAgICogQHBhcmFtIHByb2plY3Rpb25NYXRyaXggLSBUaGUgcHJvamVjdGlvbiBtYXRyaXggdG8gc2V0XG4gICAqL1xuICBzZXQgcHJvamVjdGlvbk1hdHJpeChwcm9qZWN0aW9uTWF0cml4OiBNYXRyaXg0NCkge1xuICAgIHRoaXMuX19wcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlci5jb3B5Q29tcG9uZW50cyhwcm9qZWN0aW9uTWF0cml4KTtcbiAgICB0aGlzLl9faGFzUHJvamVjdGlvbk1hdHJpeFdpdGhvdXRKaXR0ZXIgPSB0cnVlO1xuICAgIHRoaXMuX19hcHBseUppdHRlclRvUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIHRoaXMuX191cGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCB0aGF0IGlzIHVwbG9hZGVkIHRvIHRoZSBHUFUgKGluIFhSIG1vZGUsIHRoZSBtYXRyaXggb2YgdGhlIGV5ZSBjb3BpZWQgaW4gJGxvZ2ljKS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBnZXQgX3Byb2plY3Rpb25NYXRyaXhGb3JHcHUoKTogTWF0cml4NDQge1xuICAgIHJldHVybiB0aGlzLl9wcm9qZWN0aW9uTWF0cml4O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBsaWdodCBjbHVzdGVyIHZpZXcgaW5mbyB1cGxvYWRlZCB0byB0aGUgR1BVLlxuICAgKiB4OiB0aGUgdmVjNCBpbmRleCBvZiB0aGUgbGlnaHQgY2x1c3RlciB2aWV3IHJlZ2lvbiBvZiB0aGlzIGNhbWVyYSAoLTE6IG5vbmUpLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGdldCBfbGlnaHRDbHVzdGVyVmlld0luZm9Gb3JHcHUoKTogTXV0YWJsZVZlY3RvcjQge1xuICAgIHJldHVybiB0aGlzLl9saWdodENsdXN0ZXJWaWV3SW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21iaW5lZCB2aWV3LXByb2plY3Rpb24gbWF0cml4LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmlldy1wcm9qZWN0aW9uIG1hdHJpeFxuICAgKi9cbiAgZ2V0IHZpZXdQcm9qZWN0aW9uTWF0cml4KCkge1xuICAgIHJldHVybiBNdXRhYmxlTWF0cml4NDQubXVsdGlwbHlUbyh0aGlzLl9wcm9qZWN0aW9uTWF0cml4LCB0aGlzLl92aWV3TWF0cml4LCBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8wKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiaWFzIHZpZXctcHJvamVjdGlvbiBtYXRyaXggZm9yIHNoYWRvdyBtYXBwaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmlhcyB2aWV3LXByb2plY3Rpb24gbWF0cml4IGFkanVzdGVkIGZvciB0aGUgY3VycmVudCBncmFwaGljcyBBUElcbiAgICovXG4gIGdldCBiaWFzVmlld1Byb2plY3Rpb25NYXRyaXgoKSB7XG4gICAgTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8odGhpcy5fcHJvamVjdGlvbk1hdHJpeCwgdGhpcy5fdmlld01hdHJpeCwgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMCk7XG4gICAgaWYgKHRoaXMuX19lbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgcmV0dXJuIE11dGFibGVNYXRyaXg0NC5tdWx0aXBseVRvKFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuX19iaWFzTWF0cml4V2ViR1BVLFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8wLFxuICAgICAgICBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8xXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8oXG4gICAgICBDYW1lcmFDb21wb25lbnQuX19iaWFzTWF0cml4V2ViR0wsXG4gICAgICBDYW1lcmFDb21wb25lbnQuX190bXBNYXRyaXg0NF8wLFxuICAgICAgQ2FtZXJhQ29tcG9uZW50Ll9fdG1wTWF0cml4NDRfMVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBjYW1lcmEgdmFsdWVzIChwb3NpdGlvbikgdG8gdGhlIHZpZXdQb3NpdGlvbiBtZW1iZXIuXG4gICAqL1xuICBwcml2YXRlIF9fc2V0VmFsdWVzVG9WaWV3UG9zaXRpb24oKSB7XG4gICAgdGhpcy5fdmlld1Bvc2l0aW9uLmNvcHlDb21wb25lbnRzKHRoaXMud29ybGRQb3NpdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgd29ybGQgcG9zaXRpb24gb2YgdGhlIGNhbWVyYS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IHdvcmxkUG9zaXRpb24oKSB7XG4gICAgdGhpcy5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLm1hdHJpeElubmVyLm11bHRpcGx5VmVjdG9yM1RvKHRoaXMuZXllSW5uZXIsIENhbWVyYUNvbXBvbmVudC5yZXR1cm5WZWN0b3IzKTtcbiAgICByZXR1cm4gQ2FtZXJhQ29tcG9uZW50LnJldHVyblZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY2FtZXJhIGZydXN0dW0gYmFzZWQgb24gY3VycmVudCB2aWV3IGFuZCBwcm9qZWN0aW9uIG1hdHJpY2VzLlxuICAgKi9cbiAgdXBkYXRlRnJ1c3R1bSgpIHtcbiAgICB0aGlzLl9fZnJ1c3R1bS51cGRhdGUodGhpcy52aWV3TWF0cml4LCB0aGlzLnByb2plY3Rpb25NYXRyaXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNhbWVyYSBmcnVzdHVtIGZvciBjdWxsaW5nIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYW1lcmEgZnJ1c3R1bVxuICAgKi9cbiAgZ2V0IGZydXN0dW0oKSB7XG4gICAgcmV0dXJuIHRoaXMuX19mcnVzdHVtO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSBjYW1lcmEgY29tcG9uZW50IGFuZCBtb3ZlcyBpdCB0byB0aGUgbG9naWMgc3RhZ2UuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgJGxvYWQoKSB7XG4gICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9naWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBsb2dpYyB1cGRhdGUgZm9yIHRoZSBjYW1lcmEgY29tcG9uZW50LlxuICAgKiBVcGRhdGVzIHZpZXcgYW5kIHByb2plY3Rpb24gbWF0cmljZXMsIGhhbmRsZXMgbGlnaHQgc3luY2hyb25pemF0aW9uLCBhbmQgbWFuYWdlcyBYUiBtb2RlLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gICRsb2dpYygpIHtcbiAgICBjb25zdCBsaWdodENvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0TGlnaHQoKTtcbiAgICBsZXQgbGlnaHRDb21wb25lbnRVcGRhdGVDb3VudCA9IGxpZ2h0Q29tcG9uZW50ICE9IG51bGwgPyBsaWdodENvbXBvbmVudC51cGRhdGVDb3VudCA6IC0xO1xuICAgIGlmIChcbiAgICAgIHRoaXMuX19sYXN0VXBkYXRlQ291bnQgPT09IHRoaXMuX191cGRhdGVDb3VudCAmJlxuICAgICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPT09IFRyYW5zZm9ybUNvbXBvbmVudC5nZXRVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKSAmJlxuICAgICAgdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9PT0gbGlnaHRDb21wb25lbnRVcGRhdGVDb3VudCAmJlxuICAgICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID09PSBfZ2V0Q2FtZXJhQ29udHJvbGxlclVwZGF0ZUNvdW50KHRoaXMuX19lbmdpbmUpXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNTeW5jVG9MaWdodCAmJiBJcy5leGlzdChsaWdodENvbXBvbmVudCkpIHtcbiAgICAgIC8vIGZvciBTaGFkb3cgTWFwcGluZ1xuICAgICAgLy8gSU1QT1JUQU5UOlxuICAgICAgLy8gZXllSW5uZXIgLyBkaXJlY3Rpb25Jbm5lciAvIHVwSW5uZXIgYXJlIGRlZmluZWQgaW4gdGhlIGNhbWVyYSdzICpsb2NhbCogc3BhY2UuXG4gICAgICAvLyBjYWxjVmlld01hdHJpeCgpIGxhdGVyIG11bHRpcGxpZXMgYnkgaW52ZXJzZShlbnRpdHkud29ybGRNYXRyaXgpIHdoZW4gcHJpbWl0aXZlTW9kZSBpcyBmYWxzZS5cbiAgICAgIC8vXG4gICAgICAvLyBTZXR0aW5nIHdvcmxkLXNwYWNlIHZhbHVlcyBoZXJlIGNhdXNlcyB0aGUgZW50aXR5IHRyYW5zZm9ybSB0byBiZSBhcHBsaWVkIHR3aWNlLFxuICAgICAgLy8gd2hpY2ggbWFrZXMgdGhlIHNoYWRvdyBwcm9qZWN0aW9uIG1vdmUgcm91Z2hseSAyeCBhcyBtdWNoIGFzIHRoZSBsaWdodCB0cmFuc2xhdGlvbi5cbiAgICAgIC8vXG4gICAgICAvLyBUaGUgbGlnaHQgZGlyZWN0aW9uIGlzIGRlcml2ZWQgZnJvbSB0aGUgZW50aXR5IHRyYW5zZm9ybSAoTGlnaHRDb21wb25lbnQgdXNlcyBsb2NhbCAtWiksXG4gICAgICAvLyBzbyBrZWVwaW5nIHRoZSBjYW1lcmEgaW4gaXRzIGNhbm9uaWNhbCBsb2NhbCBvcmllbnRhdGlvbiBpcyBzdWZmaWNpZW50LlxuICAgICAgdGhpcy5fZXllSW5uZXIuY29weUNvbXBvbmVudHMoQ2FtZXJhQ29tcG9uZW50Ll9leWUpOyAvLyBsb2NhbCBvcmlnaW5cbiAgICAgIHRoaXMuX2RpcmVjdGlvbklubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX2RpcmVjdGlvbik7IC8vIGxvY2FsIGxvb2stYXQgdGFyZ2V0ICh0b3dhcmRzIC1aKVxuICAgICAgdGhpcy5fdXBJbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl91cCk7IC8vIGxvY2FsICtZXG5cbiAgICAgIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuU3BvdCkge1xuICAgICAgICB0aGlzLnR5cGUgPSBDYW1lcmFUeXBlLlBlcnNwZWN0aXZlO1xuICAgICAgICAvLyBvdXRlckNvbmVBbmdsZSBpcyBhIGhhbGYtYW5nbGUsIHNvIG11bHRpcGx5IGJ5IDIgdG8gZ2V0IHRoZSBmdWxsIEZPVlxuICAgICAgICB0aGlzLnNldEZvdnlBbmRDaGFuZ2VGaWxtU2l6ZShNYXRoVXRpbC5yYWRpYW5Ub0RlZ3JlZShsaWdodENvbXBvbmVudC5vdXRlckNvbmVBbmdsZSAqIDIuMCkpO1xuICAgICAgICB0aGlzLl9jb3JuZXJJbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl9jb3JuZXIpO1xuICAgICAgICB0aGlzLmFzcGVjdCA9IDE7XG4gICAgICAgIHRoaXMuek5lYXIgPSBsaWdodENvbXBvbmVudC5zaGFkb3daTmVhckZvclNwb3RMaWdodDtcbiAgICAgICAgLy8gVXNlIGEgcmVhc29uYWJsZSBkZWZhdWx0IHpGYXIgZm9yIHNoYWRvdyBtYXBwaW5nIHRvIG1haW50YWluIGRlcHRoIHByZWNpc2lvblxuICAgICAgICB0aGlzLnpGYXIgPSBsaWdodENvbXBvbmVudC5yYW5nZSAhPT0gLTEgPyBsaWdodENvbXBvbmVudC5yYW5nZSA6IDEwMDtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX3BhcmFtZXRlcnMpO1xuICAgICAgfSBlbHNlIGlmIChsaWdodENvbXBvbmVudC50eXBlID09PSBMaWdodFR5cGUuRGlyZWN0aW9uYWwpIHtcbiAgICAgICAgdGhpcy50eXBlID0gQ2FtZXJhVHlwZS5PcnRob2dyYXBoaWM7XG4gICAgICAgIGNvbnN0IGFyZWFTaXplID0gbGlnaHRDb21wb25lbnQuc2hhZG93QXJlYVNpemVGb3JEaXJlY3Rpb25hbExpZ2h0O1xuICAgICAgICB0aGlzLl9jb3JuZXJJbm5lci5jb3B5Q29tcG9uZW50cyhWZWN0b3I0LmZyb21Db3B5NCgtYXJlYVNpemUsIGFyZWFTaXplLCBhcmVhU2l6ZSwgLWFyZWFTaXplKSk7XG4gICAgICAgIHRoaXMuYXNwZWN0ID0gMTtcbiAgICAgICAgdGhpcy56TmVhciA9IGxpZ2h0Q29tcG9uZW50LnNoYWRvd1pOZWFyRm9yRGlyZWN0aW9uYWxMaWdodDtcbiAgICAgICAgdGhpcy56RmFyID0gbGlnaHRDb21wb25lbnQucmFuZ2UgIT09IC0xID8gbGlnaHRDb21wb25lbnQucmFuZ2UgOiAxMDA7XG4gICAgICAgIC8vIEZvciBPcnRob2dyYXBoaWMgcHJvamVjdGlvbiwgX3BhcmFtZXRlcnNJbm5lci56IGlzIHhtYWcgYW5kIF9wYXJhbWV0ZXJzSW5uZXIudyBpcyB5bWFnXG4gICAgICAgIC8vIFRoZXNlIGFyZSB0aGUgaGFsZi13aWR0aHMgdXNlZCBpbiBjYWxjUHJvamVjdGlvbk1hdHJpeCBmb3Igb3J0aG9ncmFwaGljIGNhbWVyYXNcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnggPSB0aGlzLnpOZWFyO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIueSA9IHRoaXMuekZhcjtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLnogPSBhcmVhU2l6ZTsgLy8geG1hZyAoaGFsZi13aWR0aClcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0lubmVyLncgPSBhcmVhU2l6ZTsgLy8geW1hZyAoaGFsZi1oZWlnaHQpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldENhbWVyYUNvbnRyb2xsZXIoKTtcbiAgICAgIGlmIChJcy5leGlzdChjYW1lcmFDb250cm9sbGVyQ29tcG9uZW50KSkge1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIudyA9IHRoaXMuX3BhcmFtZXRlcnMudztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdGhpcy5wcmltaXRpdmVNb2RlKSB7XG4gICAgICAgICAgdGhpcy5fZXllSW5uZXIuY29weUNvbXBvbmVudHMoQ2FtZXJhQ29tcG9uZW50Ll9leWUpO1xuICAgICAgICAgIHRoaXMuX2RpcmVjdGlvbklubmVyLmNvcHlDb21wb25lbnRzKHRoaXMuX2RpcmVjdGlvbik7XG4gICAgICAgICAgdGhpcy5fdXBJbm5lci5jb3B5Q29tcG9uZW50cyh0aGlzLl91cCk7XG4gICAgICAgICAgdGhpcy5fY29ybmVySW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fY29ybmVyKTtcbiAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzSW5uZXIuY29weUNvbXBvbmVudHModGhpcy5fcGFyYW1ldGVycyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNhbGNWaWV3TWF0cml4KCk7XG5cbiAgICBpZiAodGhpcy5feHJMZWZ0IHx8IHRoaXMuX3hyUmlnaHQpIHtcbiAgICAgIC8vIEluIFhSIG1vZGUsIGdldCB0aGUgcHJvamVjdGlvbiBtYXRyaXggZnJvbSBXZWJYUlN5c3RlbVxuICAgICAgY29uc3Qgd2ViWFJTeXN0ZW0gPSB0aGlzLl9fZW5naW5lLl93ZWJYUlN5c3RlbUlmRW5hYmxlZDtcbiAgICAgIGlmICh3ZWJYUlN5c3RlbT8uaXNXZWJYUk1vZGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3hyTGVmdCkge1xuICAgICAgICAgIHRoaXMuX3Byb2plY3Rpb25NYXRyaXguY29weUNvbXBvbmVudHMod2ViWFJTeXN0ZW0ubGVmdFByb2plY3Rpb25NYXRyaXgpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3hyUmlnaHQpIHtcbiAgICAgICAgICB0aGlzLl9wcm9qZWN0aW9uTWF0cml4LmNvcHlDb21wb25lbnRzKHdlYlhSU3lzdGVtLnJpZ2h0UHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYWxjUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIH1cbiAgICB0aGlzLl9fc2V0VmFsdWVzVG9WaWV3UG9zaXRpb24oKTtcblxuICAgIHRoaXMuX19sYXN0VXBkYXRlQ291bnQgPSB0aGlzLl9fdXBkYXRlQ291bnQ7XG4gICAgdGhpcy5fX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQgPSBUcmFuc2Zvcm1Db21wb25lbnQuZ2V0VXBkYXRlQ291bnQodGhpcy5fX2VuZ2luZSk7XG4gICAgdGhpcy5fX2xhc3RMaWdodENvbXBvbmVudHNVcGRhdGVDb3VudCA9IGxpZ2h0Q29tcG9uZW50VXBkYXRlQ291bnQ7XG4gICAgdGhpcy5fX2xhc3RDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50c1VwZGF0ZUNvdW50ID0gX2dldENhbWVyYUNvbnRyb2xsZXJVcGRhdGVDb3VudCh0aGlzLl9fZW5naW5lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnRpdHkgd2hpY2ggaGFzIHRoaXMgY2FtZXJhIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVudGl0eSB3aGljaCBoYXMgdGhpcyBjb21wb25lbnRcbiAgICovXG4gIGdldCBlbnRpdHkoKTogSUNhbWVyYUVudGl0eSB7XG4gICAgcmV0dXJuIHRoaXMuX19lbmdpbmUuZW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHkodGhpcy5fX2VudGl0eVVpZCkgYXMgdW5rbm93biBhcyBJQ2FtZXJhRW50aXR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGhpcyBjYW1lcmEgY29tcG9uZW50IHRvIGFuIGVudGl0eSwgZXh0ZW5kaW5nIGl0IHdpdGggY2FtZXJhLXNwZWNpZmljIG1ldGhvZHMuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNlIC0gVGhlIHRhcmdldCBlbnRpdHlcbiAgICogQHBhcmFtIF9jb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gYWRkXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgZXh0ZW5kZWQgd2l0aCBjYW1lcmEgY29tcG9uZW50IG1ldGhvZHNcbiAgICogQG92ZXJyaWRlXG4gICAqL1xuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZUNsYXNzIGV4dGVuZHMgSUVudGl0eSwgU29tZUNvbXBvbmVudENsYXNzIGV4dGVuZHMgdHlwZW9mIENvbXBvbmVudD4oXG4gICAgYmFzZTogRW50aXR5QmFzZUNsYXNzLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIENhbWVyYUVudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBjYW1lcmEgY29tcG9uZW50IG9mIHRoaXMgZW50aXR5LlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIFRoZSBjYW1lcmEgY29tcG9uZW50XG4gICAgICAgKi9cbiAgICAgIGdldENhbWVyYSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcG9uZW50QnlDb21wb25lbnRUSUQoV2VsbEtub3duQ29tcG9uZW50VElEcy5DYW1lcmFDb21wb25lbnRUSUQpIGFzIENhbWVyYUNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgYXBwbHlNaXhpbnMoYmFzZSwgQ2FtZXJhRW50aXR5KTtcbiAgICByZXR1cm4gYmFzZSBhcyB1bmtub3duIGFzIENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kczxTb21lQ29tcG9uZW50Q2xhc3M+ICYgRW50aXR5QmFzZUNsYXNzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCBzdGF0aWMgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BlY2lmaWVkIGVuZ2luZS5cbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2UgdG8gY2xlYW4gdXAgcmVzb3VyY2VzIGZvclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShlbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIENhbWVyYUNvbXBvbmVudC5fX2N1cnJlbnRNYXAuZGVsZXRlKGVuZ2luZS5lbmdpbmVVaWQpO1xuICB9XG59XG5cbkNhbWVyYUNvbXBvbmVudC5yZWdpc3Rlck1lbWJlcih7XG4gIGJ1ZmZlclVzZTogQnVmZmVyVXNlLkdQVUluc3RhbmNlRGF0YSxcbiAgbWVtYmVyTmFtZTogJ3ZpZXdNYXRyaXgnLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlTWF0cml4NDQsXG4gIHNoYWRlclR5cGU6IFNoYWRlclR5cGUuVmVydGV4QW5kUGl4ZWxTaGFkZXIsXG4gIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLk1hdDQsXG4gIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuRmxvYXQsXG4gIGluaXRWYWx1ZXM6IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSxcbn0pO1xuQ2FtZXJhQ29tcG9uZW50LnJlZ2lzdGVyTWVtYmVyKHtcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2UuR1BVSW5zdGFuY2VEYXRhLFxuICBtZW1iZXJOYW1lOiAncHJvamVjdGlvbk1hdHJpeCcsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVNYXRyaXg0NCxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuTWF0NCxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdLFxufSk7XG5DYW1lcmFDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICd2aWV3UG9zaXRpb24nLFxuICBkYXRhQ2xhc3NUeXBlOiBNdXRhYmxlVmVjdG9yMyxcbiAgc2hhZGVyVHlwZTogU2hhZGVyVHlwZS5WZXJ0ZXhBbmRQaXhlbFNoYWRlcixcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZS5GbG9hdCxcbiAgaW5pdFZhbHVlczogWzAsIDAsIDBdLFxufSk7XG5DYW1lcmFDb21wb25lbnQucmVnaXN0ZXJNZW1iZXIoe1xuICBidWZmZXJVc2U6IEJ1ZmZlclVzZS5HUFVJbnN0YW5jZURhdGEsXG4gIG1lbWJlck5hbWU6ICdsaWdodENsdXN0ZXJWaWV3SW5mbycsXG4gIGRhdGFDbGFzc1R5cGU6IE11dGFibGVWZWN0b3I0LFxuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlLlZlcnRleEFuZFBpeGVsU2hhZGVyLFxuICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlLkZsb2F0LFxuICBpbml0VmFsdWVzOiBbLTEsIDAsIDAsIDBdLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyxtQkFBMEM7QUFDbkQsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxrQkFBdUM7QUFDaEQsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxlQUFlO0FBR3hCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsc0JBQXNCO0FBRS9CLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxVQUFVO0FBRW5CLFNBQVMsdUNBQXVDO0FBRWhELFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsOEJBQThCO0FBVWhDLElBQU0sbUJBQU4sTUFBTSx5QkFBd0IsVUFBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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Q0FBQzsiLAogICJuYW1lcyI6IFsiX190eXBlIiwgIl9fcHJvamVjdGlvbk1hdHJpeFdpdGhvdXRKaXR0ZXIiLCAiX19oYXNQcm9qZWN0aW9uTWF0cml4V2l0aG91dEppdHRlciIsICJfX2ppdHRlck9mZnNldCIsICJfX2ZydXN0dW0iLCAiX191cGRhdGVDb3VudCIsICJfX2xhc3RVcGRhdGVDb3VudCIsICJfX2xhc3RUcmFuc2Zvcm1Db21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0TGlnaHRDb21wb25lbnRzVXBkYXRlQ291bnQiLCAiX19sYXN0Q2FtZXJhQ29udHJvbGxlckNvbXBvbmVudHNVcGRhdGVDb3VudCIsICJfX2N1cnJlbnRNYXAiLCAiX190bXBWZWN0b3IzXzAiLCAiX190bXBWZWN0b3IzXzEiLCAiX190bXBWZWN0b3IzXzIiLCAiX19lbmdpbmUiLCAiX19hcHBseUppdHRlclRvUHJvamVjdGlvbk1hdHJpeCIsICJfX3RtcE1hdHJpeDQ0XzAiLCAiX19iaWFzTWF0cml4V2ViR1BVIiwgIl9fdG1wTWF0cml4NDRfMSIsICJfX2JpYXNNYXRyaXhXZWJHTCIsICJfX3NldFZhbHVlc1RvVmlld1Bvc2l0aW9uIiwgIl9fZW50aXR5VWlkIl0KfQo=
