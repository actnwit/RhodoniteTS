// src/foundation/cameras/OrbitCameraController.ts
import { AABB } from "../math/AABB.js";
import { MathUtil } from "../math/MathUtil.js";
import { Matrix44 } from "../math/Matrix44.js";
import { MutableMatrix33 } from "../math/MutableMatrix33.js";
import { MutableMatrix44 } from "../math/MutableMatrix44.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
import { INPUT_HANDLING_STATE_CAMERA_CONTROLLER, InputManager } from "../system/InputManager.js";
import { AbstractCameraController } from "./AbstractCameraController.js";
var _OrbitCameraController = class _OrbitCameraController extends AbstractCameraController {
  constructor(cameraControllerComponent, config) {
    super();
    this.dollyScale = 2;
    this.scaleOfLengthCenterToCamera = 1;
    this.moveSpeed = 1;
    this.followTargetAABB = false;
    this.autoUpdate = true;
    this.R = false;
    this.ia = 0;
    this.yb = 1;
    this.aa = false;
    this.ja = 0;
    this.ka = 0;
    this.T = -1;
    this.S = -1;
    this.ca = 0;
    this.la = 0;
    this.ma = 0;
    this.Y = 1;
    this.wa = 1;
    this.xa = 1;
    this.Ma = 2.8;
    this.V = MutableVector3.zero();
    this.da = MutableVector3.zero();
    this.na = MutableVector3.zero();
    this.oa = MutableVector3.zero();
    this.ya = MutableVector3.zero();
    // private __verticalAngleThreshold = 0;
    // private __verticalAngleOfVectors = 0;
    this.Na = true;
    // private __doResetWhenCameraSettingChanged = false;
    this.W = 0;
    this.X = 0;
    this.U = 0;
    this.Q = 0;
    this.ea = 0.5;
    this.za = MutableVector3.zero();
    this.Z = MutableVector3.zero();
    this.pa = MutableVector3.zero();
    this.O = [];
    this.qa = 5e3;
    this.P = false;
    this.ra = false;
    this.fa = false;
    this.sa = false;
    this._ = null;
    this.Aa = 0;
    this.aabbWithSkeletal = true;
    this.useInitialTargetAABBForLength = false;
    // private __controllerTranslate = MutableVector3.zero();
    this.Oa = this.Pa.bind(this);
    this.Ba = this.Qa.bind(this);
    this.Ra = this.Sa.bind(this);
    this.Ta = this.Ua.bind(this);
    this.Va = this.Wa.bind(this);
    this.Xa = this.Ya.bind(this);
    this.Za = this._a.bind(this);
    this.$a = this.ab.bind(this);
    this.bb = this.cb.bind(this);
    this.Ca = this.db.bind(this);
    this.Da = this.eb.bind(this);
    this.fb = this.gb.bind(this);
    this.hb = this.ib.bind(this);
    this.jb = this.kb.bind(this);
    this.lb = this.mb.bind(this);
    this.nb = this.ob.bind(this);
    this.registerEventListeners(config);
    this.Ia = cameraControllerComponent;
  }
  /**
   * Gets the current update count.
   * @returns The current update count
   */
  get updateCount() {
    return this.ia;
  }
  /**
   * Updates the update count and notifies the camera controller component.
   * @internal
   */
  _updateCount() {
    this.ia++;
    this.Ia._updateCount(this.ia);
  }
  /**
   * Resets the dolly and translation values to their default state.
   */
  resetDollyAndTranslation() {
    this.ea = 0.5;
    this.ma = 0;
    this.la = 0;
    this.V = MutableVector3.zero();
  }
  /**
   * Sets a single target entity for the camera to focus on.
   * @param targetEntity - The entity to set as target
   */
  setTarget(targetEntity) {
    this.setTargets([targetEntity]);
  }
  /**
   * Sets multiple target entities for the camera to focus on.
   * @param targetEntities - Array of entities to set as targets
   */
  setTargets(targetEntities) {
    this.O = targetEntities;
    this.ba = void 0;
    this.R = false;
    this._updateCount();
  }
  /**
   * Gets the current target entities.
   * @returns Array of target entities
   */
  getTargets() {
    return this.O;
  }
  /**
   * Sets whether to prevent default behavior on events.
   * @param flag - True to prevent default, false otherwise
   */
  set doPreventDefault(flag) {
    this.P = flag;
  }
  /**
   * Gets whether default behavior is prevented on events.
   * @returns True if default is prevented, false otherwise
   */
  get doPreventDefault() {
    return this.P;
  }
  /**
   * Handles mouse down events.
   * @param e - The mouse event
   * @internal
   */
  Pa(e) {
    this.$(e);
    if (this.fa) return;
    this.S = e.clientX;
    this.T = e.clientY;
    this.W = this.U;
    this.X = this.Q;
    this.aa = true;
    this.ja = e.timeStamp;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles mouse move events for camera control.
   * @param e - The mouse event
   * @internal
   */
  Sa(e) {
    this.$(e);
    if (Is.false(this.isMouseDown)) return;
    if (this.fa) return;
    if (this.ca === 0) {
      this.ca = e.buttons;
    }
    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;
    switch (this.ca) {
      case 1:
        if (this.ra) {
          this.va(this.S, this.T, currentMouseX, currentMouseY);
        } else {
          this.Ja(this.S, this.T, currentMouseX, currentMouseY);
          this.W = this.U;
          this.X = this.Q;
        }
        break;
      case 2:
        this.tb(this.S, currentMouseX);
        break;
      case 4:
        this.va(this.S, this.T, currentMouseX, currentMouseY);
        break;
      default:
        return;
    }
    this.S = currentMouseX;
    this.T = currentMouseY;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles mouse up events.
   * @param e - The mouse event
   * @internal
   */
  Qa(e) {
    this.ca = 0;
    this.S = -1;
    this.T = -1;
    this.aa = false;
    this.ka = e.timeStamp;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles touch down events.
   * @param e - The touch event
   * @internal
   */
  Ua(e) {
    this.$(e);
    if (e.touches.length === 1) {
      this.S = e.touches[0].clientX;
      this.T = e.touches[0].clientY;
      this.W = this.U;
      this.X = this.Q;
    } else {
      this.S = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      this.T = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
    }
    this.aa = true;
    this.ja = e.timeStamp;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles touch move events for camera control.
   * @param e - The touch event
   * @internal
   */
  Ya(e) {
    this.$(e);
    if (Is.false(this.isMouseDown)) return;
    let currentTouchX = e.touches[0].clientX;
    let currentTouchY = e.touches[0].clientY;
    if (e.touches.length === 1) {
      currentTouchX = e.touches[0].clientX;
      currentTouchY = e.touches[0].clientY;
      this.Ja(this.S, this.T, currentTouchX, currentTouchY);
      this.W = this.U;
      this.X = this.Q;
    } else {
      currentTouchX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      currentTouchY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
      this.va(this.S, this.T, currentTouchX, currentTouchY);
    }
    this.S = currentTouchX;
    this.T = currentTouchY;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles touch up events.
   * @param e - The touch event
   * @internal
   */
  Wa(e) {
    const touchNumber = e.touches.length;
    if (touchNumber === 0) {
      this.S = -1;
      this.T = -1;
    } else if (touchNumber === 1) {
      this.S = e.touches[0].clientX;
      this.T = e.touches[0].clientY;
      this.W = this.U;
      this.X = this.Q;
    } else {
      this.S = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      this.T = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
    }
    this.aa = false;
    this.ka = e.timeStamp;
    this.R = false;
    this._updateCount();
  }
  /**
   * Sets the X-axis rotation value.
   * @param value - The rotation value in degrees
   */
  set rotX(value) {
    this.U = value;
    this.R = false;
    this._updateCount();
  }
  /**
   * Gets the X-axis rotation value.
   * @returns The rotation value in degrees
   */
  get rotX() {
    return this.U;
  }
  /**
   * Sets the Y-axis rotation value.
   * @param value - The rotation value in degrees
   */
  set rotY(value) {
    this.Q = value;
    this.R = false;
    this._updateCount();
  }
  /**
   * Gets the Y-axis rotation value.
   * @returns The rotation value in degrees
   */
  get rotY() {
    return this.Q;
  }
  /**
   * Sets the maximum Y rotation angle limit.
   * @param maximum_y - The maximum Y rotation angle
   */
  set maximumY(maximum_y) {
    this.ga = maximum_y;
  }
  /**
   * Sets the minimum Y rotation angle limit.
   * @param minimum_y - The minimum Y rotation angle
   */
  set minimumY(minimum_y) {
    this.ha = minimum_y;
  }
  /**
   * Controls rotation based on mouse/touch movement.
   * @param originalX - Original X position
   * @param originalY - Original Y position
   * @param currentX - Current X position
   * @param currentY - Current Y position
   * @internal
   */
  Ja(originalX, originalY, currentX, currentY) {
    const delta_x = (currentX - originalX) * this.Y * 0.3;
    const delta_y = (currentY - originalY) * this.Y * 0.3;
    this.U = this.W - delta_x;
    this.Q = this.X - delta_y;
    if (this.ga != null && this.Q > this.ga) {
      this.Q = this.ga;
    }
    if (this.ha != null && this.Q < this.ha) {
      this.Q = this.ha;
    }
  }
  /**
   * Controls zoom/dolly based on mouse movement.
   * @param originalValue - Original position value
   * @param currentValue - Current position value
   * @internal
   */
  tb(originalValue, currentValue) {
    this.dolly -= (currentValue - originalValue) / 1e3 * this.Y;
  }
  /**
   * Controls parallel translation based on mouse/touch movement.
   * @param originalX - Original X position
   * @param originalY - Original Y position
   * @param currentX - Current X position
   * @param currentY - Current Y position
   * @internal
   */
  va(originalX, originalY, currentX, currentY) {
    this.la = (currentY - originalY) / 1e3 * this.Y;
    this.ma = (currentX - originalX) / 1e3 * this.Y;
    const scale = this.wa * this.xa * this.Ma;
    const upDirTranslateVec = _OrbitCameraController.ta;
    upDirTranslateVec.copyComponents(this.oa).normalize().multiply(this.la).multiply(scale);
    const tangentDirTranslateVec = _OrbitCameraController.ua;
    tangentDirTranslateVec.copyComponents(this.ya).normalize().multiply(this.ma).multiply(scale);
    this.V.add(upDirTranslateVec).add(tangentDirTranslateVec);
  }
  /**
   * Calculates the distance between two touch points.
   * @param e - The touch event
   * @returns The distance between touch points
   * @internal
   */
  Ka(e) {
    const touches = e.touches;
    const diffX = touches[1].clientX - touches[0].clientX;
    const diffY = touches[1].clientY - touches[0].clientY;
    return Math.hypot(diffX, diffY);
  }
  /**
   * Handles pinch in/out gestures for zoom control.
   * @param e - The touch event
   * @internal
   */
  _a(e) {
    if (e.touches.length < 2) return;
    if (this._ == null) {
      this._ = this.Ka(e);
      return;
    }
    const currentDistance = this.Ka(e);
    const originalDistance = this._;
    if (!this.sa) {
      if (Math.abs(currentDistance - originalDistance) > 35) {
        this._ = currentDistance;
        this.sa = true;
      }
      return;
    }
    const ratio = originalDistance / currentDistance;
    this.dolly *= (ratio * this.Y) ** (2.2 / 15);
    this._ = currentDistance;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles the end of pinch in/out gestures.
   * @param e - The touch event
   * @internal
   */
  ab(e) {
    if (e.touches.length < 2) {
      this.sa = false;
      this._ = null;
    }
    this.R = false;
    this._updateCount();
  }
  /**
   * Tries to prevent default behavior if configured to do so.
   * @param evt - The event to prevent default on
   * @internal
   */
  $(evt) {
    if (this.P) {
      evt.preventDefault();
    }
  }
  /**
   * Handles mouse wheel events for zoom control.
   * @param evt - The wheel event
   * @internal
   */
  cb(evt) {
    this.$(evt);
    this.dolly += Math.sign(evt.deltaY) / 200;
    this.R = false;
    this._updateCount();
  }
  /**
   * Handles context menu events.
   * @param evt - The context menu event
   * @internal
   */
  eb(evt) {
    this.$(evt);
  }
  /**
   * Sets the dolly (zoom) value with gamma correction.
   * @param value - The dolly value (0-1)
   */
  set dolly(value) {
    value = Math.min(value, 1);
    value = Math.max(value, 1e-4);
    let gamma = value ** 5;
    gamma = Math.max(gamma, 1e-4);
    this.ea = gamma;
  }
  /**
   * Gets the dolly (zoom) value with gamma correction.
   * @returns The dolly value (0-1)
   */
  get dolly() {
    return this.ea ** (1 / 5);
  }
  /**
   * Handles mouse double-click events for resetting camera state.
   * @param evt - The mouse event
   * @internal
   */
  db(evt) {
    if (evt.shiftKey) {
      this.V.zero();
    } else if (evt.ctrlKey) {
      this.Q = 0;
      this.U = 0;
      this.X = 0;
      this.W = 0;
    }
  }
  /**
   * Resets dolly and position on double tap for touch devices.
   * @param e - The touch event
   * @internal
   */
  ob(e) {
    if (e.touches.length > 1) return;
    const currentTime = Date.now();
    if (currentTime - this.Aa < 300) {
      this.dolly = 0.5 ** (1 / 2.2);
      this.V.zero();
      this.U = 0;
      this.Q = 0;
    } else {
      this.Aa = currentTime;
    }
  }
  /**
   * Handles shift key press events.
   * @param e - The keyboard event
   * @internal
   */
  gb(e) {
    if (e.shiftKey === true) {
      this.ra = true;
    }
  }
  /**
   * Handles shift key release events.
   * @param e - The keyboard event
   * @internal
   */
  ib(e) {
    if (e.shiftKey === false) {
      this.ra = false;
    }
  }
  /**
   * Handles ctrl key press events.
   * @param e - The keyboard event
   * @internal
   */
  kb(e) {
    if (e.ctrlKey === true) {
      this.fa = true;
    }
  }
  /**
   * Handles ctrl key release events.
   * @param e - The keyboard event
   * @internal
   */
  mb(e) {
    if (e.ctrlKey === false) {
      this.fa = false;
    }
  }
  /**
   * Registers event listeners for mouse, touch, and keyboard events.
   */
  registerEventListeners(config) {
    let eventTargetDom = window;
    if (Is.exist(config.eventTargetDom)) {
      eventTargetDom = config.eventTargetDom;
    }
    if ("ontouchend" in document) {
      InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, [
        {
          eventName: "touchstart",
          handler: this.Ta,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchmove",
          handler: this.Xa,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchend",
          handler: this.Va,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchmove",
          handler: this.Za,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchend",
          handler: this.$a,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchstart",
          handler: this.nb,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "contextmenu",
          handler: this.Da,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "dblclick",
          handler: this.Ca,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        }
      ]);
    } else {
      InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, [
        {
          eventName: "mousedown",
          handler: this.Oa,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "mouseup",
          handler: this.Ba,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "mouseleave",
          handler: this.Ba,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "mousemove",
          handler: this.Ra,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "keydown",
          handler: this.fb,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "keyup",
          handler: this.hb,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "keydown",
          handler: this.jb,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "keyup",
          handler: this.lb,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "contextmenu",
          handler: this.Da,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "wheel",
          handler: this.bb,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "dblclick",
          handler: this.Ca,
          options: {
            passive: !this.P
          },
          classInstance: this,
          eventTargetDom
        }
      ]);
    }
  }
  /**
   * Unregisters all event listeners.
   */
  unregisterEventListeners() {
    InputManager.unregister(INPUT_HANDLING_STATE_CAMERA_CONTROLLER);
  }
  /**
   * Gets the field of view Y value from the camera component.
   * @param camera - The camera component
   * @returns The fovy value in degrees
   * @internal
   */
  ub(camera) {
    if (camera.fovy) {
      return camera.fovy;
    }
    return MathUtil.radianToDegree(2 * Math.atan(Math.abs(camera.top - camera.bottom) / (2 * camera.zNear)));
  }
  /**
   * Main logic method that updates the camera based on controller state.
   * @param cameraComponent - The camera component to update
   */
  logic(cameraComponent) {
    if (!this.R || this.autoUpdate) {
      this.vb(cameraComponent);
      this.wb();
      this.xb(cameraComponent);
      this.R = true;
    }
  }
  /**
   * Gets the target AABB (Axis-Aligned Bounding Box) for a target entity.
   * @param targetEntity - The target entity
   * @returns The AABB of the target entity
   * @internal
   */
  La(targetEntity) {
    if (this.aabbWithSkeletal) {
      return targetEntity.tryToGetSceneGraph().worldMergedAABBWithSkeletal;
    }
    return targetEntity.tryToGetSceneGraph().worldMergedAABB;
  }
  /**
   * update center, eye and up vectors of OrbitCameraController
   * @internal
   */
  vb(camera) {
    const eyeVec = camera.eye;
    const centerVec = camera._direction;
    const upVec = camera._up;
    const newEyeVec = this.za;
    const newCenterVec = this.Z;
    const newUpVec = this.pa.copyComponents(upVec);
    if (this.O.length === 0) {
      newEyeVec.copyComponents(eyeVec);
      newCenterVec.copyComponents(centerVec);
    } else {
      if (this.ba == null) {
        const aabb = new AABB();
        for (const targetEntity of this.O) {
          aabb.mergeAABB(this.La(targetEntity));
        }
        this.ba = aabb.clone();
      }
      let aabbToUse = this.ba;
      if (this.followTargetAABB) {
        const aabb = new AABB();
        for (const targetEntity of this.O) {
          aabb.mergeAABB(this.La(targetEntity));
        }
        aabbToUse = aabb;
      }
      newCenterVec.copyComponents(aabbToUse.centerPoint);
      const centerToCameraVec = MutableVector3.subtractTo(eyeVec, centerVec, newEyeVec);
      const centerToCameraVecNormalized = centerToCameraVec.normalize();
      const lengthCenterToCorner = this.useInitialTargetAABBForLength ? this.ba.lengthCenterToCorner : aabbToUse.lengthCenterToCorner;
      let lengthCenterToCamera = lengthCenterToCorner * (1 + 1 / Math.tan(MathUtil.degreeToRadian(camera.fovy / 2))) * this.scaleOfLengthCenterToCamera;
      if (Math.abs(lengthCenterToCamera) < 1e-5) {
        lengthCenterToCamera = 1;
      }
      centerToCameraVecNormalized.multiply(lengthCenterToCamera).add(newCenterVec);
      const sg = camera.entity.tryToGetSceneGraph();
      if (sg != null) {
        const invMat = Matrix44.invertTo(sg.matrixInner, _OrbitCameraController.sb);
        invMat.multiplyVector3To(newCenterVec, newCenterVec);
        invMat.multiplyVector3To(newEyeVec, newEyeVec);
        invMat.multiplyVector3To(newUpVec, newUpVec);
      }
    }
  }
  /**
   * calculate up, eye, center and tangent vector with controller influence
   * @internal
   */
  wb() {
    const centerToEyeVec = MutableVector3.subtractTo(
      this.za,
      this.Z,
      _OrbitCameraController.ta
    );
    centerToEyeVec.multiply(this.ea * this.dollyScale);
    this.wa = centerToEyeVec.length();
    const newUpVec = this.oa;
    const newEyeVec = this.da;
    const newCenterVec = this.na;
    const newTangentVec = this.ya;
    if (this.Na) {
      const projectedCenterToEyeVec = _OrbitCameraController.ua;
      projectedCenterToEyeVec.setComponents(centerToEyeVec.x, 0, centerToEyeVec.z);
      let horizontalAngleOfVectors = Vector3.angleOfVectors(projectedCenterToEyeVec, _OrbitCameraController.Ea);
      const horizontalSign = Math.sign(projectedCenterToEyeVec.cross(_OrbitCameraController.Ea).y);
      horizontalAngleOfVectors *= horizontalSign;
      const rotateM_X = _OrbitCameraController.Fa;
      const rotateM_Y = _OrbitCameraController.Ga;
      const rotateM_Reset = _OrbitCameraController.qb;
      const rotateM_Revert = _OrbitCameraController.rb;
      rotateM_X.rotateX(MathUtil.degreeToRadian(this.Q));
      rotateM_Y.rotateY(MathUtil.degreeToRadian(this.U));
      rotateM_Reset.rotateY(MathUtil.degreeToRadian(horizontalAngleOfVectors));
      rotateM_Revert.rotateY(MathUtil.degreeToRadian(-horizontalAngleOfVectors));
      const rotateM = _OrbitCameraController.Ha;
      MutableMatrix33.multiplyTo(rotateM_X, rotateM_Reset, rotateM);
      rotateM.multiplyByLeft(rotateM_Y);
      rotateM.multiplyByLeft(rotateM_Revert);
      rotateM.multiplyVectorTo(this.pa, newUpVec);
      rotateM.multiplyVectorTo(centerToEyeVec, newEyeVec).add(this.Z);
      newCenterVec.copyComponents(this.Z);
      const newEyeToCenterVec = _OrbitCameraController.pb;
      MutableVector3.subtractTo(newCenterVec, newEyeVec, newEyeToCenterVec);
      MutableVector3.crossTo(newUpVec, newEyeToCenterVec, newTangentVec);
      newEyeVec.add(this.V);
      newCenterVec.add(this.V);
    } else {
      const rotateM_X = _OrbitCameraController.Fa;
      const rotateM_Y = _OrbitCameraController.Ga;
      rotateM_X.rotateX(MathUtil.degreeToRadian(this.Q));
      rotateM_Y.rotateY(MathUtil.degreeToRadian(this.U));
      const rotateM = MutableMatrix33.multiplyTo(rotateM_Y, rotateM_X, _OrbitCameraController.Ha);
      rotateM.multiplyVectorTo(this.pa, newUpVec);
      rotateM.multiplyVectorTo(centerToEyeVec, newEyeVec).add(this.Z);
      newCenterVec.copyComponents(this.Z);
      const newEyeToCenterVec = _OrbitCameraController.ua;
      MutableVector3.subtractTo(newCenterVec, newEyeVec, newEyeToCenterVec);
      MutableVector3.crossTo(newUpVec, newEyeToCenterVec, newTangentVec);
      newEyeVec.add(this.V);
      newCenterVec.add(this.V);
    }
  }
  /**
   * Updates the camera component with new calculated values.
   * @param camera - The camera component to update
   * @internal
   */
  xb(camera) {
    const eyeDirection = _OrbitCameraController.ta.copyComponents(this.na);
    eyeDirection.subtract(this.da).normalize();
    this._calcZNearInner(camera, this.da, eyeDirection);
    this._calcZFarInner(camera);
    const ratio = camera.zFar / camera.zNear;
    const minRatio = this.qa;
    const scale = ratio / minRatio;
    const newLeft = camera.left + scale;
    const newRight = camera.right + scale;
    const newTop = camera.top + scale;
    const newBottom = camera.bottom + scale;
    const fovy = this.ub(camera);
    this.xa = Math.tan(MathUtil.degreeToRadian(fovy / 2));
    camera.eyeInner = this.da;
    camera.directionInner = this.na;
    camera.upInner = this.oa;
    camera.leftInner = newLeft;
    camera.rightInner = newRight;
    camera.topInner = newTop;
    camera.bottomInner = newBottom;
    camera.fovyInner = fovy;
  }
  /**
   * Sets the scale factor for zNear and zFar calculations.
   * @param value - The scale factor
   */
  set scaleOfZNearAndZFar(value) {
    this.qa = value;
    this.R = false;
    this._updateCount();
  }
  /**
   * Gets the scale factor for zNear and zFar calculations.
   * @returns The scale factor
   */
  get scaleOfZNearAndZFar() {
    return this.qa;
  }
  /**
   * Gets whether the mouse is currently pressed down.
   * @returns True if mouse is down, false otherwise
   */
  get isMouseDown() {
    return this.aa;
  }
  /**
   * Gets the timestamp of the last mouse down event.
   * @returns The timestamp in milliseconds
   */
  get lastMouseDownTimeStamp() {
    return this.ja;
  }
  /**
   * Gets the timestamp of the last mouse up event.
   * @returns The timestamp in milliseconds
   */
  get lastMouseUpTimeStamp() {
    return this.ka;
  }
};
_OrbitCameraController.Ea = Vector3.fromCopyArray([0, 0, 1]);
_OrbitCameraController.ta = MutableVector3.zero();
_OrbitCameraController.ua = MutableVector3.zero();
_OrbitCameraController.pb = MutableVector3.zero();
_OrbitCameraController.Fa = MutableMatrix33.identity();
_OrbitCameraController.Ga = MutableMatrix33.identity();
_OrbitCameraController.Ha = MutableMatrix33.identity();
_OrbitCameraController.qb = MutableMatrix33.identity();
_OrbitCameraController.rb = MutableMatrix33.identity();
_OrbitCameraController.sb = MutableMatrix44.identity();
var OrbitCameraController = _OrbitCameraController;
export {
  OrbitCameraController
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY2FtZXJhcy9PcmJpdENhbWVyYUNvbnRyb2xsZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ291bnQsIFNpemUgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENhbWVyYUNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQgfSBmcm9tICcuLi9jb21wb25lbnRzL0NhbWVyYUNvbnRyb2xsZXIvQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IENvbmZpZyB9IGZyb20gJy4uL2NvcmUvQ29uZmlnJztcbmltcG9ydCB0eXBlIHsgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBBQUJCIH0gZnJvbSAnLi4vbWF0aC9BQUJCJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi4vbWF0aC9NYXRoVXRpbCc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDMzIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4MzMnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi9taXNjL0lzJztcbmltcG9ydCB7IElOUFVUX0hBTkRMSU5HX1NUQVRFX0NBTUVSQV9DT05UUk9MTEVSLCBJbnB1dE1hbmFnZXIgfSBmcm9tICcuLi9zeXN0ZW0vSW5wdXRNYW5hZ2VyJztcbmltcG9ydCB7IEFic3RyYWN0Q2FtZXJhQ29udHJvbGxlciB9IGZyb20gJy4vQWJzdHJhY3RDYW1lcmFDb250cm9sbGVyJztcbmltcG9ydCB0eXBlIHsgSUNhbWVyYUNvbnRyb2xsZXIgfSBmcm9tICcuL0lDYW1lcmFDb250cm9sbGVyJztcblxuZGVjbGFyZSBsZXQgd2luZG93OiBhbnk7XG5cbi8qKlxuICogT3JiaXRDYW1lcmFDb250cm9sbGVyIGlzIGEgY2FtZXJhIGNvbnRyb2xsZXIgdGhhdCBhbGxvd3MgdGhlIHVzZXIgdG8gb3JiaXQgYXJvdW5kIGEgdGFyZ2V0LlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIE9yYml0Q2FtZXJhQ29udHJvbGxlciBleHRlbmRzIEFic3RyYWN0Q2FtZXJhQ29udHJvbGxlciBpbXBsZW1lbnRzIElDYW1lcmFDb250cm9sbGVyIHtcbiAgcHVibGljIGRvbGx5U2NhbGUgPSAyLjA7XG4gIHB1YmxpYyBzY2FsZU9mTGVuZ3RoQ2VudGVyVG9DYW1lcmEgPSAxLjA7XG4gIHB1YmxpYyBtb3ZlU3BlZWQgPSAxO1xuICBwdWJsaWMgZm9sbG93VGFyZ2V0QUFCQiA9IGZhbHNlO1xuICBwdWJsaWMgYXV0b1VwZGF0ZSA9IHRydWU7XG5cbiAgcHJpdmF0ZSBfX3VwZGF0ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3VwZGF0ZUNvdW50ID0gMDtcbiAgcHJpdmF0ZSBfX2ZpeGVkTGVuZ3RoT2ZDZW50ZXJUb0V5ZSA9IDE7XG4gIHByaXZhdGUgX19pc01vdXNlRG93biA9IGZhbHNlO1xuICBwcml2YXRlIF9fbGFzdE1vdXNlRG93blRpbWVTdGFtcCA9IDA7XG4gIHByaXZhdGUgX19sYXN0TW91c2VVcFRpbWVTdGFtcCA9IDA7XG4gIHByaXZhdGUgX19vcmlnaW5hbFkgPSAtMTtcbiAgcHJpdmF0ZSBfX29yaWdpbmFsWCA9IC0xO1xuICBwcml2YXRlIF9fYnV0dG9uTnVtYmVyID0gMDtcbiAgcHJpdmF0ZSBfX21vdXNlX3RyYW5zbGF0ZV95ID0gMDtcbiAgcHJpdmF0ZSBfX21vdXNlX3RyYW5zbGF0ZV94ID0gMDtcbiAgcHJpdmF0ZSBfX2VmZmljaWVuY3kgPSAxO1xuICBwcml2YXRlIF9fbGVuZ3RoT2ZDZW50ZXJUb0V5ZSA9IDE7XG4gIHByaXZhdGUgX19mb3Z5QmlhcyA9IDEuMDtcbiAgcHJpdmF0ZSBfX3NjYWxlT2ZUcmFuc2xhdGlvbiA9IDIuODtcbiAgcHJpdmF0ZSBfX21vdXNlVHJhbnNsYXRlVmVjID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fbmV3RXllVmVjID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fbmV3Q2VudGVyVmVjID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fbmV3VXBWZWMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19uZXdUYW5nZW50VmVjID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAvLyBwcml2YXRlIF9fdmVydGljYWxBbmdsZVRocmVzaG9sZCA9IDA7XG4gIC8vIHByaXZhdGUgX192ZXJ0aWNhbEFuZ2xlT2ZWZWN0b3JzID0gMDtcbiAgcHJpdmF0ZSBfX2lzU3ltbWV0cnlNb2RlID0gdHJ1ZTtcbiAgLy8gcHJpdmF0ZSBfX2RvUmVzZXRXaGVuQ2FtZXJhU2V0dGluZ0NoYW5nZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3JvdF9iZ25feCA9IDA7XG4gIHByaXZhdGUgX19yb3RfYmduX3kgPSAwO1xuICBwcml2YXRlIF9fcm90X3ggPSAwO1xuICBwcml2YXRlIF9fcm90X3kgPSAwO1xuICBwcml2YXRlIF9fZG9sbHkgPSAwLjU7XG4gIHByaXZhdGUgX19leWVWZWMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19jZW50ZXJWZWMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX191cFZlYyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJvdGVjdGVkIF9fdGFyZ2V0RW50aXRpZXM6IElTY2VuZUdyYXBoRW50aXR5W10gPSBbXTtcbiAgcHJpdmF0ZSBfX3NjYWxlT2ZaTmVhckFuZFpGYXIgPSA1MDAwO1xuICBwcml2YXRlIF9fZG9QcmV2ZW50RGVmYXVsdCA9IGZhbHNlO1xuICBwcml2YXRlIF9faXNQcmVzc2luZ1NoaWZ0ID0gZmFsc2U7XG4gIHByaXZhdGUgX19pc1ByZXNzaW5nQ3RybCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX19waW5jaEluT3V0Q29udHJvbCA9IGZhbHNlO1xuICBwcml2YXRlIF9fcGluY2hJbk91dE9yaWdpbmFsRGlzdGFuY2U/OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9fbWF4aW11bV95PzogbnVtYmVyO1xuICBwcml2YXRlIF9fbWluaW11bV95PzogbnVtYmVyO1xuXG4gIHByaXZhdGUgX19yZXNldERvbGx5VG91Y2hUaW1lOiBDb3VudCA9IDA7XG5cbiAgcHJpdmF0ZSBfX2luaXRpYWxUYXJnZXRBQUJCPzogQUFCQjtcblxuICBwdWJsaWMgYWFiYldpdGhTa2VsZXRhbCA9IHRydWU7XG4gIHB1YmxpYyB1c2VJbml0aWFsVGFyZ2V0QUFCQkZvckxlbmd0aCA9IGZhbHNlO1xuXG4gIC8vIHByaXZhdGUgX19jb250cm9sbGVyVHJhbnNsYXRlID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIF9fbW91c2VEb3duRnVuYyA9IHRoaXMuX19tb3VzZURvd24uYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX21vdXNlVXBGdW5jID0gdGhpcy5fX21vdXNlVXAuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX21vdXNlTW92ZUZ1bmMgPSB0aGlzLl9fbW91c2VNb3ZlLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX190b3VjaERvd25GdW5jID0gdGhpcy5fX3RvdWNoRG93bi5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fdG91Y2hVcEZ1bmMgPSB0aGlzLl9fdG91Y2hVcC5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fdG91Y2hNb3ZlRnVuYyA9IHRoaXMuX190b3VjaE1vdmUuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX3BpbmNoSW5PdXRGdW5jID0gdGhpcy5fX3BpbmNoSW5PdXQuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX3BpbmNoSW5PdXRFbmRGdW5jID0gdGhpcy5fX3BpbmNoSW5PdXRFbmQuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX21vdXNlV2hlZWxGdW5jID0gdGhpcy5fX21vdXNlV2hlZWwuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX21vdXNlRGJsQ2xpY2tGdW5jID0gdGhpcy5fX21vdXNlRGJsQ2xpY2suYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX2NvbnRleHRNZW51RnVuYyA9IHRoaXMuX19jb250ZXh0TWVudS5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fcHJlc3NTaGlmdEZ1bmMgPSB0aGlzLl9fcHJlc3NTaGlmdC5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9fcmVsZWFzZVNoaWZ0RnVuYyA9IHRoaXMuX19yZWxlYXNlU2hpZnQuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfX3ByZXNzQ3RybEZ1bmMgPSB0aGlzLl9fcHJlc3NDdHJsLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX19yZWxlYXNlQ3RybEZ1bmMgPSB0aGlzLl9fcmVsZWFzZUN0cmwuYmluZCh0aGlzKTtcblxuICBwcml2YXRlIF9fcmVzZXREb2xseUFuZFBvc2l0aW9uRnVuYyA9IHRoaXMuX19yZXNldERvbGx5QW5kUG9zaXRpb24uYmluZCh0aGlzKTtcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBfX3RtcF91cDogVmVjdG9yMyA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgMV0pO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjM18xOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWMzXzI6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3JvdGF0ZU1fWDogTXV0YWJsZU1hdHJpeDMzID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3JvdGF0ZU1fWTogTXV0YWJsZU1hdHJpeDMzID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX3JvdGF0ZU06IE11dGFibGVNYXRyaXgzMyA9IE11dGFibGVNYXRyaXgzMy5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcF9yb3RhdGVNX1Jlc2V0OiBNdXRhYmxlTWF0cml4MzMgPSBNdXRhYmxlTWF0cml4MzMuaWRlbnRpdHkoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfcm90YXRlTV9SZXZlcnQ6IE11dGFibGVNYXRyaXgzMyA9IE11dGFibGVNYXRyaXgzMy5pZGVudGl0eSgpO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wTWF0NDRfMDogTXV0YWJsZU1hdHJpeDQ0ID0gTXV0YWJsZU1hdHJpeDQ0LmlkZW50aXR5KCk7XG5cbiAgcHJpdmF0ZSBfX2NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQ6IENhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQ7XG5cbiAgY29uc3RydWN0b3IoY2FtZXJhQ29udHJvbGxlckNvbXBvbmVudDogQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCwgY29uZmlnOiBDb25maWcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudExpc3RlbmVycyhjb25maWcpO1xuICAgIHRoaXMuX19jYW1lcmFDb250cm9sbGVyQ29tcG9uZW50ID0gY2FtZXJhQ29udHJvbGxlckNvbXBvbmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHVwZGF0ZSBjb3VudC5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdXBkYXRlIGNvdW50XG4gICAqL1xuICBnZXQgdXBkYXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX191cGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB1cGRhdGUgY291bnQgYW5kIG5vdGlmaWVzIHRoZSBjYW1lcmEgY29udHJvbGxlciBjb21wb25lbnQuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ291bnQoKSB7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgdGhpcy5fX2NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuX3VwZGF0ZUNvdW50KHRoaXMuX191cGRhdGVDb3VudCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBkb2xseSBhbmQgdHJhbnNsYXRpb24gdmFsdWVzIHRvIHRoZWlyIGRlZmF1bHQgc3RhdGUuXG4gICAqL1xuICByZXNldERvbGx5QW5kVHJhbnNsYXRpb24oKSB7XG4gICAgdGhpcy5fX2RvbGx5ID0gMC41O1xuICAgIHRoaXMuX19tb3VzZV90cmFuc2xhdGVfeCA9IDA7XG4gICAgdGhpcy5fX21vdXNlX3RyYW5zbGF0ZV95ID0gMDtcbiAgICB0aGlzLl9fbW91c2VUcmFuc2xhdGVWZWMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIHNpbmdsZSB0YXJnZXQgZW50aXR5IGZvciB0aGUgY2FtZXJhIHRvIGZvY3VzIG9uLlxuICAgKiBAcGFyYW0gdGFyZ2V0RW50aXR5IC0gVGhlIGVudGl0eSB0byBzZXQgYXMgdGFyZ2V0XG4gICAqL1xuICBzZXRUYXJnZXQodGFyZ2V0RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkge1xuICAgIHRoaXMuc2V0VGFyZ2V0cyhbdGFyZ2V0RW50aXR5XSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBtdWx0aXBsZSB0YXJnZXQgZW50aXRpZXMgZm9yIHRoZSBjYW1lcmEgdG8gZm9jdXMgb24uXG4gICAqIEBwYXJhbSB0YXJnZXRFbnRpdGllcyAtIEFycmF5IG9mIGVudGl0aWVzIHRvIHNldCBhcyB0YXJnZXRzXG4gICAqL1xuICBzZXRUYXJnZXRzKHRhcmdldEVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdKSB7XG4gICAgdGhpcy5fX3RhcmdldEVudGl0aWVzID0gdGFyZ2V0RW50aXRpZXM7XG4gICAgdGhpcy5fX2luaXRpYWxUYXJnZXRBQUJCID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX191cGRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHRhcmdldCBlbnRpdGllcy5cbiAgICogQHJldHVybnMgQXJyYXkgb2YgdGFyZ2V0IGVudGl0aWVzXG4gICAqL1xuICBnZXRUYXJnZXRzKCk6IElTY2VuZUdyYXBoRW50aXR5W10ge1xuICAgIHJldHVybiB0aGlzLl9fdGFyZ2V0RW50aXRpZXM7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB3aGV0aGVyIHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciBvbiBldmVudHMuXG4gICAqIEBwYXJhbSBmbGFnIC0gVHJ1ZSB0byBwcmV2ZW50IGRlZmF1bHQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc2V0IGRvUHJldmVudERlZmF1bHQoZmxhZzogYm9vbGVhbikge1xuICAgIHRoaXMuX19kb1ByZXZlbnREZWZhdWx0ID0gZmxhZztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgZGVmYXVsdCBiZWhhdmlvciBpcyBwcmV2ZW50ZWQgb24gZXZlbnRzLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGRlZmF1bHQgaXMgcHJldmVudGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBkb1ByZXZlbnREZWZhdWx0KCkge1xuICAgIHJldHVybiB0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vdXNlIGRvd24gZXZlbnRzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSBtb3VzZSBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fbW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcbiAgICB0aGlzLl9fdHJ5VG9QcmV2ZW50RGVmYXVsdChlKTtcbiAgICAvLyBpZiAodGhpcy5pc01vdXNlRG93bikgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9faXNQcmVzc2luZ0N0cmwpIHJldHVybjtcblxuICAgIHRoaXMuX19vcmlnaW5hbFggPSBlLmNsaWVudFg7XG4gICAgdGhpcy5fX29yaWdpbmFsWSA9IGUuY2xpZW50WTtcbiAgICB0aGlzLl9fcm90X2Jnbl94ID0gdGhpcy5fX3JvdF94O1xuICAgIHRoaXMuX19yb3RfYmduX3kgPSB0aGlzLl9fcm90X3k7XG5cbiAgICB0aGlzLl9faXNNb3VzZURvd24gPSB0cnVlO1xuICAgIHRoaXMuX19sYXN0TW91c2VEb3duVGltZVN0YW1wID0gZS50aW1lU3RhbXA7XG5cbiAgICAvLyBjb25zb2xlLmxvZygnb3JpZ2luYWwnLCB0aGlzLl9fb3JpZ2luYWxYLCB0aGlzLl9fb3JpZ2luYWxZKTtcblxuICAgIHRoaXMuX191cGRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vdXNlIG1vdmUgZXZlbnRzIGZvciBjYW1lcmEgY29udHJvbC5cbiAgICogQHBhcmFtIGUgLSBUaGUgbW91c2UgZXZlbnRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX21vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5fX3RyeVRvUHJldmVudERlZmF1bHQoZSk7XG4gICAgaWYgKElzLmZhbHNlKHRoaXMuaXNNb3VzZURvd24pKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX19pc1ByZXNzaW5nQ3RybCkgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMuX19idXR0b25OdW1iZXIgPT09IDApIHtcbiAgICAgIHRoaXMuX19idXR0b25OdW1iZXIgPSBlLmJ1dHRvbnM7XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudE1vdXNlWCA9IGUuY2xpZW50WDtcbiAgICBjb25zdCBjdXJyZW50TW91c2VZID0gZS5jbGllbnRZO1xuICAgIC8vIGNvbnNvbGUubG9nKCdjdXJyZW50TW91c2U6ICcsIGN1cnJlbnRNb3VzZVgsIGN1cnJlbnRNb3VzZVkpO1xuICAgIHN3aXRjaCAodGhpcy5fX2J1dHRvbk51bWJlcikge1xuICAgICAgY2FzZSAxOiAvLyBsZWZ0XG4gICAgICAgIGlmICh0aGlzLl9faXNQcmVzc2luZ1NoaWZ0KSB7XG4gICAgICAgICAgdGhpcy5fX3BhcmFsbGVsVHJhbnNsYXRlQ29udHJvbCh0aGlzLl9fb3JpZ2luYWxYLCB0aGlzLl9fb3JpZ2luYWxZLCBjdXJyZW50TW91c2VYLCBjdXJyZW50TW91c2VZKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9fcm90YXRlQ29udHJvbCh0aGlzLl9fb3JpZ2luYWxYLCB0aGlzLl9fb3JpZ2luYWxZLCBjdXJyZW50TW91c2VYLCBjdXJyZW50TW91c2VZKTtcbiAgICAgICAgICB0aGlzLl9fcm90X2Jnbl94ID0gdGhpcy5fX3JvdF94O1xuICAgICAgICAgIHRoaXMuX19yb3RfYmduX3kgPSB0aGlzLl9fcm90X3k7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6IC8vIHJpZ2h0XG4gICAgICAgIHRoaXMuX196b29tQ29udHJvbCh0aGlzLl9fb3JpZ2luYWxYLCBjdXJyZW50TW91c2VYKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6IC8vIGNlbnRlclxuICAgICAgICB0aGlzLl9fcGFyYWxsZWxUcmFuc2xhdGVDb250cm9sKHRoaXMuX19vcmlnaW5hbFgsIHRoaXMuX19vcmlnaW5hbFksIGN1cnJlbnRNb3VzZVgsIGN1cnJlbnRNb3VzZVkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX29yaWdpbmFsWCA9IGN1cnJlbnRNb3VzZVg7XG4gICAgdGhpcy5fX29yaWdpbmFsWSA9IGN1cnJlbnRNb3VzZVk7XG4gICAgdGhpcy5fX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl91cGRhdGVDb3VudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW91c2UgdXAgZXZlbnRzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSBtb3VzZSBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fbW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5fX2J1dHRvbk51bWJlciA9IDA7XG4gICAgdGhpcy5fX29yaWdpbmFsWCA9IC0xO1xuICAgIHRoaXMuX19vcmlnaW5hbFkgPSAtMTtcblxuICAgIHRoaXMuX19pc01vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMuX19sYXN0TW91c2VVcFRpbWVTdGFtcCA9IGUudGltZVN0YW1wO1xuICAgIHRoaXMuX191cGRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRvdWNoIGRvd24gZXZlbnRzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSB0b3VjaCBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fdG91Y2hEb3duKGU6IFRvdWNoRXZlbnQpIHtcbiAgICB0aGlzLl9fdHJ5VG9QcmV2ZW50RGVmYXVsdChlKTtcblxuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICB0aGlzLl9fb3JpZ2luYWxYID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB0aGlzLl9fb3JpZ2luYWxZID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgICB0aGlzLl9fcm90X2Jnbl94ID0gdGhpcy5fX3JvdF94O1xuICAgICAgdGhpcy5fX3JvdF9iZ25feSA9IHRoaXMuX19yb3RfeTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX29yaWdpbmFsWCA9IChlLnRvdWNoZXNbMF0uY2xpZW50WCArIGUudG91Y2hlc1sxXS5jbGllbnRYKSAqIDAuNTtcbiAgICAgIHRoaXMuX19vcmlnaW5hbFkgPSAoZS50b3VjaGVzWzBdLmNsaWVudFkgKyBlLnRvdWNoZXNbMV0uY2xpZW50WSkgKiAwLjU7XG4gICAgfVxuXG4gICAgdGhpcy5fX2lzTW91c2VEb3duID0gdHJ1ZTtcbiAgICB0aGlzLl9fbGFzdE1vdXNlRG93blRpbWVTdGFtcCA9IGUudGltZVN0YW1wO1xuICAgIHRoaXMuX191cGRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRvdWNoIG1vdmUgZXZlbnRzIGZvciBjYW1lcmEgY29udHJvbC5cbiAgICogQHBhcmFtIGUgLSBUaGUgdG91Y2ggZXZlbnRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX3RvdWNoTW92ZShlOiBUb3VjaEV2ZW50KSB7XG4gICAgdGhpcy5fX3RyeVRvUHJldmVudERlZmF1bHQoZSk7XG4gICAgaWYgKElzLmZhbHNlKHRoaXMuaXNNb3VzZURvd24pKSByZXR1cm47XG5cbiAgICBsZXQgY3VycmVudFRvdWNoWCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIGxldCBjdXJyZW50VG91Y2hZID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGN1cnJlbnRUb3VjaFggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGN1cnJlbnRUb3VjaFkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICAgIHRoaXMuX19yb3RhdGVDb250cm9sKHRoaXMuX19vcmlnaW5hbFgsIHRoaXMuX19vcmlnaW5hbFksIGN1cnJlbnRUb3VjaFgsIGN1cnJlbnRUb3VjaFkpO1xuICAgICAgdGhpcy5fX3JvdF9iZ25feCA9IHRoaXMuX19yb3RfeDtcbiAgICAgIHRoaXMuX19yb3RfYmduX3kgPSB0aGlzLl9fcm90X3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRUb3VjaFggPSAoZS50b3VjaGVzWzBdLmNsaWVudFggKyBlLnRvdWNoZXNbMV0uY2xpZW50WCkgKiAwLjU7XG4gICAgICBjdXJyZW50VG91Y2hZID0gKGUudG91Y2hlc1swXS5jbGllbnRZICsgZS50b3VjaGVzWzFdLmNsaWVudFkpICogMC41O1xuXG4gICAgICB0aGlzLl9fcGFyYWxsZWxUcmFuc2xhdGVDb250cm9sKHRoaXMuX19vcmlnaW5hbFgsIHRoaXMuX19vcmlnaW5hbFksIGN1cnJlbnRUb3VjaFgsIGN1cnJlbnRUb3VjaFkpO1xuICAgIH1cbiAgICB0aGlzLl9fb3JpZ2luYWxYID0gY3VycmVudFRvdWNoWDtcbiAgICB0aGlzLl9fb3JpZ2luYWxZID0gY3VycmVudFRvdWNoWTtcbiAgICB0aGlzLl9fdXBkYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3VwZGF0ZUNvdW50KCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0b3VjaCB1cCBldmVudHMuXG4gICAqIEBwYXJhbSBlIC0gVGhlIHRvdWNoIGV2ZW50XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX190b3VjaFVwKGU6IFRvdWNoRXZlbnQpIHtcbiAgICBjb25zdCB0b3VjaE51bWJlciA9IGUudG91Y2hlcy5sZW5ndGg7XG4gICAgaWYgKHRvdWNoTnVtYmVyID09PSAwKSB7XG4gICAgICB0aGlzLl9fb3JpZ2luYWxYID0gLTE7XG4gICAgICB0aGlzLl9fb3JpZ2luYWxZID0gLTE7XG4gICAgfSBlbHNlIGlmICh0b3VjaE51bWJlciA9PT0gMSkge1xuICAgICAgdGhpcy5fX29yaWdpbmFsWCA9IGUudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgdGhpcy5fX29yaWdpbmFsWSA9IGUudG91Y2hlc1swXS5jbGllbnRZO1xuICAgICAgdGhpcy5fX3JvdF9iZ25feCA9IHRoaXMuX19yb3RfeDtcbiAgICAgIHRoaXMuX19yb3RfYmduX3kgPSB0aGlzLl9fcm90X3k7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX19vcmlnaW5hbFggPSAoZS50b3VjaGVzWzBdLmNsaWVudFggKyBlLnRvdWNoZXNbMV0uY2xpZW50WCkgKiAwLjU7XG4gICAgICB0aGlzLl9fb3JpZ2luYWxZID0gKGUudG91Y2hlc1swXS5jbGllbnRZICsgZS50b3VjaGVzWzFdLmNsaWVudFkpICogMC41O1xuICAgIH1cbiAgICB0aGlzLl9faXNNb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLl9fbGFzdE1vdXNlVXBUaW1lU3RhbXAgPSBlLnRpbWVTdGFtcDtcbiAgICB0aGlzLl9fdXBkYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3VwZGF0ZUNvdW50KCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgWC1heGlzIHJvdGF0aW9uIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgcm90YXRpb24gdmFsdWUgaW4gZGVncmVlc1xuICAgKi9cbiAgc2V0IHJvdFgodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX19yb3RfeCA9IHZhbHVlO1xuICAgIHRoaXMuX191cGRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBYLWF4aXMgcm90YXRpb24gdmFsdWUuXG4gICAqIEByZXR1cm5zIFRoZSByb3RhdGlvbiB2YWx1ZSBpbiBkZWdyZWVzXG4gICAqL1xuICBnZXQgcm90WCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3JvdF94O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIFktYXhpcyByb3RhdGlvbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHJvdGF0aW9uIHZhbHVlIGluIGRlZ3JlZXNcbiAgICovXG4gIHNldCByb3RZKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLl9fcm90X3kgPSB2YWx1ZTtcbiAgICB0aGlzLl9fdXBkYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3VwZGF0ZUNvdW50KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWS1heGlzIHJvdGF0aW9uIHZhbHVlLlxuICAgKiBAcmV0dXJucyBUaGUgcm90YXRpb24gdmFsdWUgaW4gZGVncmVlc1xuICAgKi9cbiAgZ2V0IHJvdFkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19yb3RfeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYXhpbXVtIFkgcm90YXRpb24gYW5nbGUgbGltaXQuXG4gICAqIEBwYXJhbSBtYXhpbXVtX3kgLSBUaGUgbWF4aW11bSBZIHJvdGF0aW9uIGFuZ2xlXG4gICAqL1xuICBzZXQgbWF4aW11bVkobWF4aW11bV95OiBudW1iZXIpIHtcbiAgICB0aGlzLl9fbWF4aW11bV95ID0gbWF4aW11bV95O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1pbmltdW0gWSByb3RhdGlvbiBhbmdsZSBsaW1pdC5cbiAgICogQHBhcmFtIG1pbmltdW1feSAtIFRoZSBtaW5pbXVtIFkgcm90YXRpb24gYW5nbGVcbiAgICovXG4gIHNldCBtaW5pbXVtWShtaW5pbXVtX3k6IG51bWJlcikge1xuICAgIHRoaXMuX19taW5pbXVtX3kgPSBtaW5pbXVtX3k7XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbHMgcm90YXRpb24gYmFzZWQgb24gbW91c2UvdG91Y2ggbW92ZW1lbnQuXG4gICAqIEBwYXJhbSBvcmlnaW5hbFggLSBPcmlnaW5hbCBYIHBvc2l0aW9uXG4gICAqIEBwYXJhbSBvcmlnaW5hbFkgLSBPcmlnaW5hbCBZIHBvc2l0aW9uXG4gICAqIEBwYXJhbSBjdXJyZW50WCAtIEN1cnJlbnQgWCBwb3NpdGlvblxuICAgKiBAcGFyYW0gY3VycmVudFkgLSBDdXJyZW50IFkgcG9zaXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX3JvdGF0ZUNvbnRyb2wob3JpZ2luYWxYOiBTaXplLCBvcmlnaW5hbFk6IFNpemUsIGN1cnJlbnRYOiBTaXplLCBjdXJyZW50WTogU2l6ZSkge1xuICAgIC8vIGNhbGMgcm90YXRpb24gYW5nbGVcbiAgICBjb25zdCBkZWx0YV94ID0gKGN1cnJlbnRYIC0gb3JpZ2luYWxYKSAqIHRoaXMuX19lZmZpY2llbmN5ICogMC4zO1xuICAgIGNvbnN0IGRlbHRhX3kgPSAoY3VycmVudFkgLSBvcmlnaW5hbFkpICogdGhpcy5fX2VmZmljaWVuY3kgKiAwLjM7XG4gICAgdGhpcy5fX3JvdF94ID0gdGhpcy5fX3JvdF9iZ25feCAtIGRlbHRhX3g7XG4gICAgdGhpcy5fX3JvdF95ID0gdGhpcy5fX3JvdF9iZ25feSAtIGRlbHRhX3k7XG5cbiAgICAvLyBjaGVjayBpZiByb3RhdGlvbiBhbmdsZSBpcyB3aXRoaW4gcmFuZ2VcbiAgICAvLyBpZiAoXG4gICAgLy8gICB0aGlzLl9fdmVydGljYWxBbmdsZVRocmVzaG9sZCAtIHRoaXMuX192ZXJ0aWNhbEFuZ2xlT2ZWZWN0b3JzIDwgdGhpcy5fX3JvdF95XG4gICAgLy8gKSB7XG4gICAgLy8gICAgICAgICAgdGhpcy5fcm90X3kgLT0gdGhpcy5fcm90X3kgLSAodGhpcy5fdmVydGljYWxBbmdsZVRocmVzaG9sZCAtIHRoaXMuX3ZlcnRpY2FsQW5nbGVPZlZlY3RvcnMpO1xuICAgIC8vIH1cblxuICAgIC8vIGlmIChcbiAgICAvLyAgIHRoaXMuX19yb3RfeSA8IC10aGlzLl9fdmVydGljYWxBbmdsZVRocmVzaG9sZCArIHRoaXMuX192ZXJ0aWNhbEFuZ2xlT2ZWZWN0b3JzXG4gICAgLy8gKSB7XG4gICAgLy8gICAgICAgICB0aGlzLl9yb3RfeSArPSB0aGlzLl9yb3RfeSAtICh0aGlzLl92ZXJ0aWNhbEFuZ2xlVGhyZXNob2xkIC0gdGhpcy5fdmVydGljYWxBbmdsZU9mVmVjdG9ycyk7XG4gICAgLy8gfVxuXG4gICAgaWYgKHRoaXMuX19tYXhpbXVtX3kgIT0gbnVsbCAmJiB0aGlzLl9fcm90X3kgPiB0aGlzLl9fbWF4aW11bV95KSB7XG4gICAgICB0aGlzLl9fcm90X3kgPSB0aGlzLl9fbWF4aW11bV95O1xuICAgIH1cbiAgICBpZiAodGhpcy5fX21pbmltdW1feSAhPSBudWxsICYmIHRoaXMuX19yb3RfeSA8IHRoaXMuX19taW5pbXVtX3kpIHtcbiAgICAgIHRoaXMuX19yb3RfeSA9IHRoaXMuX19taW5pbXVtX3k7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnRyb2xzIHpvb20vZG9sbHkgYmFzZWQgb24gbW91c2UgbW92ZW1lbnQuXG4gICAqIEBwYXJhbSBvcmlnaW5hbFZhbHVlIC0gT3JpZ2luYWwgcG9zaXRpb24gdmFsdWVcbiAgICogQHBhcmFtIGN1cnJlbnRWYWx1ZSAtIEN1cnJlbnQgcG9zaXRpb24gdmFsdWVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX3pvb21Db250cm9sKG9yaWdpbmFsVmFsdWU6IFNpemUsIGN1cnJlbnRWYWx1ZTogU2l6ZSkge1xuICAgIHRoaXMuZG9sbHkgLT0gKChjdXJyZW50VmFsdWUgLSBvcmlnaW5hbFZhbHVlKSAvIDEwMDApICogdGhpcy5fX2VmZmljaWVuY3k7XG4gIH1cblxuICAvKipcbiAgICogQ29udHJvbHMgcGFyYWxsZWwgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvdG91Y2ggbW92ZW1lbnQuXG4gICAqIEBwYXJhbSBvcmlnaW5hbFggLSBPcmlnaW5hbCBYIHBvc2l0aW9uXG4gICAqIEBwYXJhbSBvcmlnaW5hbFkgLSBPcmlnaW5hbCBZIHBvc2l0aW9uXG4gICAqIEBwYXJhbSBjdXJyZW50WCAtIEN1cnJlbnQgWCBwb3NpdGlvblxuICAgKiBAcGFyYW0gY3VycmVudFkgLSBDdXJyZW50IFkgcG9zaXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX3BhcmFsbGVsVHJhbnNsYXRlQ29udHJvbChvcmlnaW5hbFg6IFNpemUsIG9yaWdpbmFsWTogU2l6ZSwgY3VycmVudFg6IFNpemUsIGN1cnJlbnRZOiBTaXplKSB7XG4gICAgdGhpcy5fX21vdXNlX3RyYW5zbGF0ZV95ID0gKChjdXJyZW50WSAtIG9yaWdpbmFsWSkgLyAxMDAwKSAqIHRoaXMuX19lZmZpY2llbmN5O1xuICAgIHRoaXMuX19tb3VzZV90cmFuc2xhdGVfeCA9ICgoY3VycmVudFggLSBvcmlnaW5hbFgpIC8gMTAwMCkgKiB0aGlzLl9fZWZmaWNpZW5jeTtcblxuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5fX2xlbmd0aE9mQ2VudGVyVG9FeWUgKiB0aGlzLl9fZm92eUJpYXMgKiB0aGlzLl9fc2NhbGVPZlRyYW5zbGF0aW9uO1xuXG4gICAgY29uc3QgdXBEaXJUcmFuc2xhdGVWZWMgPSBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBWZWMzXzA7XG4gICAgdXBEaXJUcmFuc2xhdGVWZWMuY29weUNvbXBvbmVudHModGhpcy5fX25ld1VwVmVjKS5ub3JtYWxpemUoKS5tdWx0aXBseSh0aGlzLl9fbW91c2VfdHJhbnNsYXRlX3kpLm11bHRpcGx5KHNjYWxlKTtcblxuICAgIGNvbnN0IHRhbmdlbnREaXJUcmFuc2xhdGVWZWMgPSBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBWZWMzXzE7XG4gICAgdGFuZ2VudERpclRyYW5zbGF0ZVZlY1xuICAgICAgLmNvcHlDb21wb25lbnRzKHRoaXMuX19uZXdUYW5nZW50VmVjKVxuICAgICAgLm5vcm1hbGl6ZSgpXG4gICAgICAubXVsdGlwbHkodGhpcy5fX21vdXNlX3RyYW5zbGF0ZV94KVxuICAgICAgLm11bHRpcGx5KHNjYWxlKTtcblxuICAgIHRoaXMuX19tb3VzZVRyYW5zbGF0ZVZlYy5hZGQodXBEaXJUcmFuc2xhdGVWZWMpLmFkZCh0YW5nZW50RGlyVHJhbnNsYXRlVmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byB0b3VjaCBwb2ludHMuXG4gICAqIEBwYXJhbSBlIC0gVGhlIHRvdWNoIGV2ZW50XG4gICAqIEByZXR1cm5zIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRvdWNoIHBvaW50c1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fZ2V0VG91Y2hlc0Rpc3RhbmNlKGU6IFRvdWNoRXZlbnQpIHtcbiAgICBjb25zdCB0b3VjaGVzID0gZS50b3VjaGVzO1xuXG4gICAgY29uc3QgZGlmZlggPSB0b3VjaGVzWzFdLmNsaWVudFggLSB0b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgY29uc3QgZGlmZlkgPSB0b3VjaGVzWzFdLmNsaWVudFkgLSB0b3VjaGVzWzBdLmNsaWVudFk7XG5cbiAgICByZXR1cm4gTWF0aC5oeXBvdChkaWZmWCwgZGlmZlkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgcGluY2ggaW4vb3V0IGdlc3R1cmVzIGZvciB6b29tIGNvbnRyb2wuXG4gICAqIEBwYXJhbSBlIC0gVGhlIHRvdWNoIGV2ZW50XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX19waW5jaEluT3V0KGU6IFRvdWNoRXZlbnQpIHtcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA8IDIpIHJldHVybjtcblxuICAgIGlmICh0aGlzLl9fcGluY2hJbk91dE9yaWdpbmFsRGlzdGFuY2UgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3BpbmNoSW5PdXRPcmlnaW5hbERpc3RhbmNlID0gdGhpcy5fX2dldFRvdWNoZXNEaXN0YW5jZShlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJyZW50RGlzdGFuY2UgPSB0aGlzLl9fZ2V0VG91Y2hlc0Rpc3RhbmNlKGUpO1xuICAgIGNvbnN0IG9yaWdpbmFsRGlzdGFuY2UgPSB0aGlzLl9fcGluY2hJbk91dE9yaWdpbmFsRGlzdGFuY2U7XG4gICAgaWYgKCF0aGlzLl9fcGluY2hJbk91dENvbnRyb2wpIHtcbiAgICAgIGlmIChNYXRoLmFicyhjdXJyZW50RGlzdGFuY2UgLSBvcmlnaW5hbERpc3RhbmNlKSA+IDM1LjApIHtcbiAgICAgICAgdGhpcy5fX3BpbmNoSW5PdXRPcmlnaW5hbERpc3RhbmNlID0gY3VycmVudERpc3RhbmNlO1xuICAgICAgICB0aGlzLl9fcGluY2hJbk91dENvbnRyb2wgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJhdGlvID0gb3JpZ2luYWxEaXN0YW5jZSAvIGN1cnJlbnREaXN0YW5jZTtcbiAgICB0aGlzLmRvbGx5ICo9IChyYXRpbyAqIHRoaXMuX19lZmZpY2llbmN5KSAqKiAoMi4yIC8gMTUuMCk7XG5cbiAgICB0aGlzLl9fcGluY2hJbk91dE9yaWdpbmFsRGlzdGFuY2UgPSBjdXJyZW50RGlzdGFuY2U7XG4gICAgdGhpcy5fX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl91cGRhdGVDb3VudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGVuZCBvZiBwaW5jaCBpbi9vdXQgZ2VzdHVyZXMuXG4gICAqIEBwYXJhbSBlIC0gVGhlIHRvdWNoIGV2ZW50XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX19waW5jaEluT3V0RW5kKGU6IFRvdWNoRXZlbnQpIHtcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHRoaXMuX19waW5jaEluT3V0Q29udHJvbCA9IGZhbHNlO1xuICAgICAgdGhpcy5fX3BpbmNoSW5PdXRPcmlnaW5hbERpc3RhbmNlID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5fX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl91cGRhdGVDb3VudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWVzIHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciBpZiBjb25maWd1cmVkIHRvIGRvIHNvLlxuICAgKiBAcGFyYW0gZXZ0IC0gVGhlIGV2ZW50IHRvIHByZXZlbnQgZGVmYXVsdCBvblxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgX190cnlUb1ByZXZlbnREZWZhdWx0KGV2dDogRXZlbnQpIHtcbiAgICBpZiAodGhpcy5fX2RvUHJldmVudERlZmF1bHQpIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vdXNlIHdoZWVsIGV2ZW50cyBmb3Igem9vbSBjb250cm9sLlxuICAgKiBAcGFyYW0gZXZ0IC0gVGhlIHdoZWVsIGV2ZW50XG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX19tb3VzZVdoZWVsKGV2dDogV2hlZWxFdmVudCkge1xuICAgIHRoaXMuX190cnlUb1ByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgdGhpcy5kb2xseSArPSBNYXRoLnNpZ24oZXZ0LmRlbHRhWSkgLyAyMDA7XG4gICAgdGhpcy5fX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl91cGRhdGVDb3VudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgY29udGV4dCBtZW51IGV2ZW50cy5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBjb250ZXh0IG1lbnUgZXZlbnRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX2NvbnRleHRNZW51KGV2dDogRXZlbnQpIHtcbiAgICB0aGlzLl9fdHJ5VG9QcmV2ZW50RGVmYXVsdChldnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRvbGx5ICh6b29tKSB2YWx1ZSB3aXRoIGdhbW1hIGNvcnJlY3Rpb24uXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBkb2xseSB2YWx1ZSAoMC0xKVxuICAgKi9cbiAgc2V0IGRvbGx5KHZhbHVlKSB7XG4gICAgdmFsdWUgPSBNYXRoLm1pbih2YWx1ZSwgMSk7XG4gICAgdmFsdWUgPSBNYXRoLm1heCh2YWx1ZSwgMC4wMDAxKTtcbiAgICBsZXQgZ2FtbWEgPSB2YWx1ZSAqKiA1O1xuICAgIGdhbW1hID0gTWF0aC5tYXgoZ2FtbWEsIDAuMDAwMSk7XG4gICAgdGhpcy5fX2RvbGx5ID0gZ2FtbWE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZG9sbHkgKHpvb20pIHZhbHVlIHdpdGggZ2FtbWEgY29ycmVjdGlvbi5cbiAgICogQHJldHVybnMgVGhlIGRvbGx5IHZhbHVlICgwLTEpXG4gICAqL1xuICBnZXQgZG9sbHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kb2xseSAqKiAoMSAvIDUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW91c2UgZG91YmxlLWNsaWNrIGV2ZW50cyBmb3IgcmVzZXR0aW5nIGNhbWVyYSBzdGF0ZS5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBtb3VzZSBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fbW91c2VEYmxDbGljayhldnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBpZiAoZXZ0LnNoaWZ0S2V5KSB7XG4gICAgICB0aGlzLl9fbW91c2VUcmFuc2xhdGVWZWMuemVybygpO1xuICAgIH0gZWxzZSBpZiAoZXZ0LmN0cmxLZXkpIHtcbiAgICAgIHRoaXMuX19yb3RfeSA9IDA7XG4gICAgICB0aGlzLl9fcm90X3ggPSAwO1xuICAgICAgdGhpcy5fX3JvdF9iZ25feSA9IDA7XG4gICAgICB0aGlzLl9fcm90X2Jnbl94ID0gMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIGRvbGx5IGFuZCBwb3NpdGlvbiBvbiBkb3VibGUgdGFwIGZvciB0b3VjaCBkZXZpY2VzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSB0b3VjaCBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fcmVzZXREb2xseUFuZFBvc2l0aW9uKGU6IFRvdWNoRXZlbnQpIHtcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA+IDEpIHJldHVybjtcblxuICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBpZiAoY3VycmVudFRpbWUgLSB0aGlzLl9fcmVzZXREb2xseVRvdWNoVGltZSA8IDMwMCkge1xuICAgICAgdGhpcy5kb2xseSA9IDAuNSAqKiAoMS4wIC8gMi4yKTtcbiAgICAgIHRoaXMuX19tb3VzZVRyYW5zbGF0ZVZlYy56ZXJvKCk7XG4gICAgICB0aGlzLl9fcm90X3ggPSAwO1xuICAgICAgdGhpcy5fX3JvdF95ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX3Jlc2V0RG9sbHlUb3VjaFRpbWUgPSBjdXJyZW50VGltZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBzaGlmdCBrZXkgcHJlc3MgZXZlbnRzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSBrZXlib2FyZCBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fcHJlc3NTaGlmdChlOiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGUuc2hpZnRLZXkgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuX19pc1ByZXNzaW5nU2hpZnQgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHNoaWZ0IGtleSByZWxlYXNlIGV2ZW50cy5cbiAgICogQHBhcmFtIGUgLSBUaGUga2V5Ym9hcmQgZXZlbnRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX3JlbGVhc2VTaGlmdChlOiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGUuc2hpZnRLZXkgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLl9faXNQcmVzc2luZ1NoaWZ0ID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgY3RybCBrZXkgcHJlc3MgZXZlbnRzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSBrZXlib2FyZCBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fcHJlc3NDdHJsKGU6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZS5jdHJsS2V5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLl9faXNQcmVzc2luZ0N0cmwgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGN0cmwga2V5IHJlbGVhc2UgZXZlbnRzLlxuICAgKiBAcGFyYW0gZSAtIFRoZSBrZXlib2FyZCBldmVudFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fcmVsZWFzZUN0cmwoZTogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChlLmN0cmxLZXkgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLl9faXNQcmVzc2luZ0N0cmwgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGV2ZW50IGxpc3RlbmVycyBmb3IgbW91c2UsIHRvdWNoLCBhbmQga2V5Ym9hcmQgZXZlbnRzLlxuICAgKi9cbiAgcmVnaXN0ZXJFdmVudExpc3RlbmVycyhjb25maWc6IENvbmZpZykge1xuICAgIGxldCBldmVudFRhcmdldERvbSA9IHdpbmRvdztcbiAgICBpZiAoSXMuZXhpc3QoY29uZmlnLmV2ZW50VGFyZ2V0RG9tKSkge1xuICAgICAgZXZlbnRUYXJnZXREb20gPSBjb25maWcuZXZlbnRUYXJnZXREb207XG4gICAgfVxuXG4gICAgaWYgKCdvbnRvdWNoZW5kJyBpbiBkb2N1bWVudCkge1xuICAgICAgLy8gdG91Y2ggZGV2aWNlc1xuICAgICAgSW5wdXRNYW5hZ2VyLnJlZ2lzdGVyKElOUFVUX0hBTkRMSU5HX1NUQVRFX0NBTUVSQV9DT05UUk9MTEVSLCBbXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICd0b3VjaHN0YXJ0JyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fdG91Y2hEb3duRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAndG91Y2htb3ZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fdG91Y2hNb3ZlRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAndG91Y2hlbmQnLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX190b3VjaFVwRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAndG91Y2htb3ZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fcGluY2hJbk91dEZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ3RvdWNoZW5kJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fcGluY2hJbk91dEVuZEZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ3RvdWNoc3RhcnQnLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19yZXNldERvbGx5QW5kUG9zaXRpb25GdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICdjb250ZXh0bWVudScsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX2NvbnRleHRNZW51RnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAnZGJsY2xpY2snLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19tb3VzZURibENsaWNrRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHBjIGRldmljZXNcbiAgICAgIElucHV0TWFuYWdlci5yZWdpc3RlcihJTlBVVF9IQU5ETElOR19TVEFURV9DQU1FUkFfQ09OVFJPTExFUiwgW1xuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAnbW91c2Vkb3duJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fbW91c2VEb3duRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAnbW91c2V1cCcsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX21vdXNlVXBGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICdtb3VzZWxlYXZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fbW91c2VVcEZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ21vdXNlbW92ZScsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX21vdXNlTW92ZUZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ2tleWRvd24nLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19wcmVzc1NoaWZ0RnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAna2V5dXAnLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19yZWxlYXNlU2hpZnRGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICdrZXlkb3duJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fcHJlc3NDdHJsRnVuYyxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAna2V5dXAnLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX19yZWxlYXNlQ3RybEZ1bmMsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ2NvbnRleHRtZW51JyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9fY29udGV4dE1lbnVGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICd3aGVlbCcsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX21vdXNlV2hlZWxGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICdkYmxjbGljaycsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fX21vdXNlRGJsQ2xpY2tGdW5jLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICBdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlcnMgYWxsIGV2ZW50IGxpc3RlbmVycy5cbiAgICovXG4gIHVucmVnaXN0ZXJFdmVudExpc3RlbmVycygpIHtcbiAgICBJbnB1dE1hbmFnZXIudW5yZWdpc3RlcihJTlBVVF9IQU5ETElOR19TVEFURV9DQU1FUkFfQ09OVFJPTExFUik7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZmllbGQgb2YgdmlldyBZIHZhbHVlIGZyb20gdGhlIGNhbWVyYSBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBjYW1lcmEgLSBUaGUgY2FtZXJhIGNvbXBvbmVudFxuICAgKiBAcmV0dXJucyBUaGUgZm92eSB2YWx1ZSBpbiBkZWdyZWVzXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX19nZXRGb3Z5RnJvbUNhbWVyYShjYW1lcmE6IENhbWVyYUNvbXBvbmVudCkge1xuICAgIGlmIChjYW1lcmEuZm92eSkge1xuICAgICAgcmV0dXJuIGNhbWVyYS5mb3Z5O1xuICAgIH1cbiAgICByZXR1cm4gTWF0aFV0aWwucmFkaWFuVG9EZWdyZWUoMiAqIE1hdGguYXRhbihNYXRoLmFicyhjYW1lcmEudG9wIC0gY2FtZXJhLmJvdHRvbSkgLyAoMiAqIGNhbWVyYS56TmVhcikpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWluIGxvZ2ljIG1ldGhvZCB0aGF0IHVwZGF0ZXMgdGhlIGNhbWVyYSBiYXNlZCBvbiBjb250cm9sbGVyIHN0YXRlLlxuICAgKiBAcGFyYW0gY2FtZXJhQ29tcG9uZW50IC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdG8gdXBkYXRlXG4gICAqL1xuICBsb2dpYyhjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCkge1xuICAgIGlmICghdGhpcy5fX3VwZGF0ZWQgfHwgdGhpcy5hdXRvVXBkYXRlKSB7XG4gICAgICB0aGlzLl9fdXBkYXRlVGFyZ2V0aW5nKGNhbWVyYUNvbXBvbmVudCk7XG4gICAgICB0aGlzLl9fY2FsY3VsYXRlSW5mbHVlbmNlT2ZDb250cm9sbGVyKCk7XG4gICAgICB0aGlzLl9fdXBkYXRlQ2FtZXJhQ29tcG9uZW50KGNhbWVyYUNvbXBvbmVudCk7XG4gICAgICB0aGlzLl9fdXBkYXRlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRhcmdldCBBQUJCIChBeGlzLUFsaWduZWQgQm91bmRpbmcgQm94KSBmb3IgYSB0YXJnZXQgZW50aXR5LlxuICAgKiBAcGFyYW0gdGFyZ2V0RW50aXR5IC0gVGhlIHRhcmdldCBlbnRpdHlcbiAgICogQHJldHVybnMgVGhlIEFBQkIgb2YgdGhlIHRhcmdldCBlbnRpdHlcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIF9fZ2V0VGFyZ2V0QUFCQih0YXJnZXRFbnRpdHk6IElTY2VuZUdyYXBoRW50aXR5KSB7XG4gICAgaWYgKHRoaXMuYWFiYldpdGhTa2VsZXRhbCkge1xuICAgICAgcmV0dXJuIHRhcmdldEVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKSEud29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0RW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpIS53b3JsZE1lcmdlZEFBQkI7XG4gIH1cblxuICAvKipcbiAgICogdXBkYXRlIGNlbnRlciwgZXllIGFuZCB1cCB2ZWN0b3JzIG9mIE9yYml0Q2FtZXJhQ29udHJvbGxlclxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fdXBkYXRlVGFyZ2V0aW5nKGNhbWVyYTogQ2FtZXJhQ29tcG9uZW50KSB7XG4gICAgY29uc3QgZXllVmVjID0gY2FtZXJhLmV5ZTtcbiAgICBjb25zdCBjZW50ZXJWZWMgPSAoY2FtZXJhIGFzIGFueSkuX2RpcmVjdGlvbiBhcyBWZWN0b3IzO1xuICAgIGNvbnN0IHVwVmVjID0gKGNhbWVyYSBhcyBhbnkpLl91cCBhcyBWZWN0b3IzO1xuXG4gICAgY29uc3QgbmV3RXllVmVjID0gdGhpcy5fX2V5ZVZlYztcbiAgICBjb25zdCBuZXdDZW50ZXJWZWMgPSB0aGlzLl9fY2VudGVyVmVjO1xuICAgIGNvbnN0IG5ld1VwVmVjID0gdGhpcy5fX3VwVmVjLmNvcHlDb21wb25lbnRzKHVwVmVjKTtcblxuICAgIGlmICh0aGlzLl9fdGFyZ2V0RW50aXRpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBuZXdFeWVWZWMuY29weUNvbXBvbmVudHMoZXllVmVjKTtcbiAgICAgIG5ld0NlbnRlclZlYy5jb3B5Q29tcG9uZW50cyhjZW50ZXJWZWMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5fX2luaXRpYWxUYXJnZXRBQUJCID09IG51bGwpIHtcbiAgICAgICAgY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAgICAgIGZvciAoY29uc3QgdGFyZ2V0RW50aXR5IG9mIHRoaXMuX190YXJnZXRFbnRpdGllcykge1xuICAgICAgICAgIGFhYmIubWVyZ2VBQUJCKHRoaXMuX19nZXRUYXJnZXRBQUJCKHRhcmdldEVudGl0eSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX19pbml0aWFsVGFyZ2V0QUFCQiA9IGFhYmIuY2xvbmUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gY2FsYyBuZXdDZW50ZXJWZWNcbiAgICAgIGxldCBhYWJiVG9Vc2UgPSB0aGlzLl9faW5pdGlhbFRhcmdldEFBQkIhO1xuICAgICAgaWYgKHRoaXMuZm9sbG93VGFyZ2V0QUFCQikge1xuICAgICAgICBjb25zdCBhYWJiID0gbmV3IEFBQkIoKTtcbiAgICAgICAgZm9yIChjb25zdCB0YXJnZXRFbnRpdHkgb2YgdGhpcy5fX3RhcmdldEVudGl0aWVzKSB7XG4gICAgICAgICAgYWFiYi5tZXJnZUFBQkIodGhpcy5fX2dldFRhcmdldEFBQkIodGFyZ2V0RW50aXR5KSk7XG4gICAgICAgIH1cbiAgICAgICAgYWFiYlRvVXNlID0gYWFiYjtcbiAgICAgIH1cbiAgICAgIG5ld0NlbnRlclZlYy5jb3B5Q29tcG9uZW50cyhhYWJiVG9Vc2UuY2VudGVyUG9pbnQpO1xuICAgICAgLy8gY2FsYyBuZXdFeWVWZWNcbiAgICAgIGNvbnN0IGNlbnRlclRvQ2FtZXJhVmVjID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhleWVWZWMsIGNlbnRlclZlYywgbmV3RXllVmVjKSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgICAgIGNvbnN0IGNlbnRlclRvQ2FtZXJhVmVjTm9ybWFsaXplZCA9IGNlbnRlclRvQ2FtZXJhVmVjLm5vcm1hbGl6ZSgpO1xuICAgICAgY29uc3QgbGVuZ3RoQ2VudGVyVG9Db3JuZXIgPSB0aGlzLnVzZUluaXRpYWxUYXJnZXRBQUJCRm9yTGVuZ3RoXG4gICAgICAgID8gdGhpcy5fX2luaXRpYWxUYXJnZXRBQUJCLmxlbmd0aENlbnRlclRvQ29ybmVyXG4gICAgICAgIDogYWFiYlRvVXNlLmxlbmd0aENlbnRlclRvQ29ybmVyO1xuICAgICAgbGV0IGxlbmd0aENlbnRlclRvQ2FtZXJhID1cbiAgICAgICAgbGVuZ3RoQ2VudGVyVG9Db3JuZXIgKlxuICAgICAgICAoMS4wICsgMS4wIC8gTWF0aC50YW4oTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oY2FtZXJhLmZvdnkgLyAyLjApKSkgKlxuICAgICAgICB0aGlzLnNjYWxlT2ZMZW5ndGhDZW50ZXJUb0NhbWVyYTtcbiAgICAgIGlmIChNYXRoLmFicyhsZW5ndGhDZW50ZXJUb0NhbWVyYSkgPCAwLjAwMDAxKSB7XG4gICAgICAgIGxlbmd0aENlbnRlclRvQ2FtZXJhID0gMTtcbiAgICAgIH1cbiAgICAgIGNlbnRlclRvQ2FtZXJhVmVjTm9ybWFsaXplZC5tdWx0aXBseShsZW5ndGhDZW50ZXJUb0NhbWVyYSkuYWRkKG5ld0NlbnRlclZlYyk7XG5cbiAgICAgIGNvbnN0IHNnID0gY2FtZXJhLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgIGlmIChzZyAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGludk1hdCA9IE1hdHJpeDQ0LmludmVydFRvKHNnLm1hdHJpeElubmVyLCBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBNYXQ0NF8wKTtcblxuICAgICAgICBpbnZNYXQubXVsdGlwbHlWZWN0b3IzVG8obmV3Q2VudGVyVmVjLCBuZXdDZW50ZXJWZWMpO1xuICAgICAgICBpbnZNYXQubXVsdGlwbHlWZWN0b3IzVG8obmV3RXllVmVjLCBuZXdFeWVWZWMpO1xuICAgICAgICBpbnZNYXQubXVsdGlwbHlWZWN0b3IzVG8obmV3VXBWZWMsIG5ld1VwVmVjKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogY2FsY3VsYXRlIHVwLCBleWUsIGNlbnRlciBhbmQgdGFuZ2VudCB2ZWN0b3Igd2l0aCBjb250cm9sbGVyIGluZmx1ZW5jZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9fY2FsY3VsYXRlSW5mbHVlbmNlT2ZDb250cm9sbGVyKCkge1xuICAgIGNvbnN0IGNlbnRlclRvRXllVmVjID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhcbiAgICAgIHRoaXMuX19leWVWZWMsXG4gICAgICB0aGlzLl9fY2VudGVyVmVjLFxuICAgICAgT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wVmVjM18wXG4gICAgKTtcblxuICAgIGNlbnRlclRvRXllVmVjLm11bHRpcGx5KHRoaXMuX19kb2xseSAqIHRoaXMuZG9sbHlTY2FsZSk7XG4gICAgdGhpcy5fX2xlbmd0aE9mQ2VudGVyVG9FeWUgPSBjZW50ZXJUb0V5ZVZlYy5sZW5ndGgoKTtcblxuICAgIGNvbnN0IG5ld1VwVmVjID0gdGhpcy5fX25ld1VwVmVjO1xuICAgIGNvbnN0IG5ld0V5ZVZlYyA9IHRoaXMuX19uZXdFeWVWZWM7XG4gICAgY29uc3QgbmV3Q2VudGVyVmVjID0gdGhpcy5fX25ld0NlbnRlclZlYztcbiAgICBjb25zdCBuZXdUYW5nZW50VmVjID0gdGhpcy5fX25ld1RhbmdlbnRWZWM7XG5cbiAgICBpZiAodGhpcy5fX2lzU3ltbWV0cnlNb2RlKSB7XG4gICAgICBjb25zdCBwcm9qZWN0ZWRDZW50ZXJUb0V5ZVZlYyA9IE9yYml0Q2FtZXJhQ29udHJvbGxlci5fX3RtcFZlYzNfMTtcbiAgICAgIHByb2plY3RlZENlbnRlclRvRXllVmVjLnNldENvbXBvbmVudHMoY2VudGVyVG9FeWVWZWMueCwgMCwgY2VudGVyVG9FeWVWZWMueik7XG5cbiAgICAgIGxldCBob3Jpem9udGFsQW5nbGVPZlZlY3RvcnMgPSBWZWN0b3IzLmFuZ2xlT2ZWZWN0b3JzKHByb2plY3RlZENlbnRlclRvRXllVmVjLCBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBfdXApO1xuICAgICAgY29uc3QgaG9yaXpvbnRhbFNpZ24gPSBNYXRoLnNpZ24ocHJvamVjdGVkQ2VudGVyVG9FeWVWZWMuY3Jvc3MoT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wX3VwKS55KTtcbiAgICAgIGhvcml6b250YWxBbmdsZU9mVmVjdG9ycyAqPSBob3Jpem9udGFsU2lnbjtcblxuICAgICAgY29uc3Qgcm90YXRlTV9YID0gT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wX3JvdGF0ZU1fWDtcbiAgICAgIGNvbnN0IHJvdGF0ZU1fWSA9IE9yYml0Q2FtZXJhQ29udHJvbGxlci5fX3RtcF9yb3RhdGVNX1k7XG4gICAgICBjb25zdCByb3RhdGVNX1Jlc2V0ID0gT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wX3JvdGF0ZU1fUmVzZXQ7XG4gICAgICBjb25zdCByb3RhdGVNX1JldmVydCA9IE9yYml0Q2FtZXJhQ29udHJvbGxlci5fX3RtcF9yb3RhdGVNX1JldmVydDtcblxuICAgICAgcm90YXRlTV9YLnJvdGF0ZVgoTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4odGhpcy5fX3JvdF95KSk7XG4gICAgICByb3RhdGVNX1kucm90YXRlWShNYXRoVXRpbC5kZWdyZWVUb1JhZGlhbih0aGlzLl9fcm90X3gpKTtcbiAgICAgIHJvdGF0ZU1fUmVzZXQucm90YXRlWShNYXRoVXRpbC5kZWdyZWVUb1JhZGlhbihob3Jpem9udGFsQW5nbGVPZlZlY3RvcnMpKTtcbiAgICAgIHJvdGF0ZU1fUmV2ZXJ0LnJvdGF0ZVkoTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oLWhvcml6b250YWxBbmdsZU9mVmVjdG9ycykpO1xuXG4gICAgICBjb25zdCByb3RhdGVNID0gT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wX3JvdGF0ZU07XG4gICAgICBNdXRhYmxlTWF0cml4MzMubXVsdGlwbHlUbyhyb3RhdGVNX1gsIHJvdGF0ZU1fUmVzZXQsIHJvdGF0ZU0pO1xuICAgICAgcm90YXRlTS5tdWx0aXBseUJ5TGVmdChyb3RhdGVNX1kpO1xuICAgICAgcm90YXRlTS5tdWx0aXBseUJ5TGVmdChyb3RhdGVNX1JldmVydCk7XG5cbiAgICAgIHJvdGF0ZU0ubXVsdGlwbHlWZWN0b3JUbyh0aGlzLl9fdXBWZWMsIG5ld1VwVmVjKTtcbiAgICAgIHJvdGF0ZU0ubXVsdGlwbHlWZWN0b3JUbyhjZW50ZXJUb0V5ZVZlYywgbmV3RXllVmVjKS5hZGQodGhpcy5fX2NlbnRlclZlYyk7XG4gICAgICBuZXdDZW50ZXJWZWMuY29weUNvbXBvbmVudHModGhpcy5fX2NlbnRlclZlYyk7XG5cbiAgICAgIGNvbnN0IG5ld0V5ZVRvQ2VudGVyVmVjID0gT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wVmVjM18yO1xuICAgICAgTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhuZXdDZW50ZXJWZWMsIG5ld0V5ZVZlYywgbmV3RXllVG9DZW50ZXJWZWMpO1xuICAgICAgTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhuZXdVcFZlYywgbmV3RXllVG9DZW50ZXJWZWMsIG5ld1RhbmdlbnRWZWMpO1xuXG4gICAgICBuZXdFeWVWZWMuYWRkKHRoaXMuX19tb3VzZVRyYW5zbGF0ZVZlYyk7XG4gICAgICBuZXdDZW50ZXJWZWMuYWRkKHRoaXMuX19tb3VzZVRyYW5zbGF0ZVZlYyk7XG5cbiAgICAgIC8vIGNvbnN0IGhvcml6b25SZXNldFZlYyA9IE9yYml0Q2FtZXJhQ29udHJvbGxlci5fX3RtcFZlYzNfMjtcbiAgICAgIC8vIHJvdGF0ZU1fUmVzZXQubXVsdGlwbHlWZWN0b3JUbyhjZW50ZXJUb0V5ZVZlYywgaG9yaXpvblJlc2V0VmVjKTtcblxuICAgICAgLy8gdGhpcy5fX3ZlcnRpY2FsQW5nbGVPZlZlY3RvcnMgPSBWZWN0b3IzLmFuZ2xlT2ZWZWN0b3JzKGhvcml6b25SZXNldFZlYywgT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wX3VwKTtcbiAgICAgIC8vIGNvbnN0IHZlcnRpY2FsU2lnbiA9IE1hdGguc2lnbihWZWN0b3IzLmNyb3NzVG8oaG9yaXpvblJlc2V0VmVjLCBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBfdXAsIE9yYml0Q2FtZXJhQ29udHJvbGxlci5fX3RtcF92ZXJ0aWNhbFNpZ24pLngpO1xuXG4gICAgICAvL3RoaXMuX3ZlcnRpY2FsQW5nbGVPZlZlY3RvcnMgKj0gdmVydGljYWxTaWduO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByb3RhdGVNX1ggPSBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBfcm90YXRlTV9YO1xuICAgICAgY29uc3Qgcm90YXRlTV9ZID0gT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wX3JvdGF0ZU1fWTtcblxuICAgICAgcm90YXRlTV9YLnJvdGF0ZVgoTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4odGhpcy5fX3JvdF95KSk7XG4gICAgICByb3RhdGVNX1kucm90YXRlWShNYXRoVXRpbC5kZWdyZWVUb1JhZGlhbih0aGlzLl9fcm90X3gpKTtcblxuICAgICAgY29uc3Qgcm90YXRlTSA9IE11dGFibGVNYXRyaXgzMy5tdWx0aXBseVRvKHJvdGF0ZU1fWSwgcm90YXRlTV9YLCBPcmJpdENhbWVyYUNvbnRyb2xsZXIuX190bXBfcm90YXRlTSk7XG5cbiAgICAgIHJvdGF0ZU0ubXVsdGlwbHlWZWN0b3JUbyh0aGlzLl9fdXBWZWMsIG5ld1VwVmVjKTtcbiAgICAgIHJvdGF0ZU0ubXVsdGlwbHlWZWN0b3JUbyhjZW50ZXJUb0V5ZVZlYywgbmV3RXllVmVjKS5hZGQodGhpcy5fX2NlbnRlclZlYyk7XG4gICAgICBuZXdDZW50ZXJWZWMuY29weUNvbXBvbmVudHModGhpcy5fX2NlbnRlclZlYyk7XG5cbiAgICAgIGNvbnN0IG5ld0V5ZVRvQ2VudGVyVmVjID0gT3JiaXRDYW1lcmFDb250cm9sbGVyLl9fdG1wVmVjM18xO1xuICAgICAgTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhuZXdDZW50ZXJWZWMsIG5ld0V5ZVZlYywgbmV3RXllVG9DZW50ZXJWZWMpO1xuICAgICAgTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhuZXdVcFZlYywgbmV3RXllVG9DZW50ZXJWZWMsIG5ld1RhbmdlbnRWZWMpO1xuXG4gICAgICBuZXdFeWVWZWMuYWRkKHRoaXMuX19tb3VzZVRyYW5zbGF0ZVZlYyk7XG4gICAgICBuZXdDZW50ZXJWZWMuYWRkKHRoaXMuX19tb3VzZVRyYW5zbGF0ZVZlYyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNhbWVyYSBjb21wb25lbnQgd2l0aCBuZXcgY2FsY3VsYXRlZCB2YWx1ZXMuXG4gICAqIEBwYXJhbSBjYW1lcmEgLSBUaGUgY2FtZXJhIGNvbXBvbmVudCB0byB1cGRhdGVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX3VwZGF0ZUNhbWVyYUNvbXBvbmVudChjYW1lcmE6IENhbWVyYUNvbXBvbmVudCkge1xuICAgIGNvbnN0IGV5ZURpcmVjdGlvbiA9IE9yYml0Q2FtZXJhQ29udHJvbGxlci5fX3RtcFZlYzNfMC5jb3B5Q29tcG9uZW50cyh0aGlzLl9fbmV3Q2VudGVyVmVjKTtcbiAgICBleWVEaXJlY3Rpb24uc3VidHJhY3QodGhpcy5fX25ld0V5ZVZlYykubm9ybWFsaXplKCk7XG4gICAgdGhpcy5fY2FsY1pOZWFySW5uZXIoY2FtZXJhLCB0aGlzLl9fbmV3RXllVmVjLCBleWVEaXJlY3Rpb24pO1xuICAgIHRoaXMuX2NhbGNaRmFySW5uZXIoY2FtZXJhKTtcblxuICAgIGNvbnN0IHJhdGlvID0gY2FtZXJhLnpGYXIgLyBjYW1lcmEuek5lYXI7XG4gICAgY29uc3QgbWluUmF0aW8gPSB0aGlzLl9fc2NhbGVPZlpOZWFyQW5kWkZhcjtcbiAgICBjb25zdCBzY2FsZSA9IHJhdGlvIC8gbWluUmF0aW87XG5cbiAgICBjb25zdCBuZXdMZWZ0ID0gY2FtZXJhLmxlZnQgKyBzY2FsZTtcbiAgICBjb25zdCBuZXdSaWdodCA9IGNhbWVyYS5yaWdodCArIHNjYWxlO1xuICAgIGNvbnN0IG5ld1RvcCA9IGNhbWVyYS50b3AgKyBzY2FsZTtcbiAgICBjb25zdCBuZXdCb3R0b20gPSBjYW1lcmEuYm90dG9tICsgc2NhbGU7XG5cbiAgICBjb25zdCBmb3Z5ID0gdGhpcy5fX2dldEZvdnlGcm9tQ2FtZXJhKGNhbWVyYSk7XG4gICAgdGhpcy5fX2ZvdnlCaWFzID0gTWF0aC50YW4oTWF0aFV0aWwuZGVncmVlVG9SYWRpYW4oZm92eSAvIDIuMCkpO1xuXG4gICAgY2FtZXJhLmV5ZUlubmVyID0gdGhpcy5fX25ld0V5ZVZlYztcbiAgICBjYW1lcmEuZGlyZWN0aW9uSW5uZXIgPSB0aGlzLl9fbmV3Q2VudGVyVmVjO1xuICAgIGNhbWVyYS51cElubmVyID0gdGhpcy5fX25ld1VwVmVjO1xuICAgIGNhbWVyYS5sZWZ0SW5uZXIgPSBuZXdMZWZ0O1xuICAgIGNhbWVyYS5yaWdodElubmVyID0gbmV3UmlnaHQ7XG4gICAgY2FtZXJhLnRvcElubmVyID0gbmV3VG9wO1xuICAgIGNhbWVyYS5ib3R0b21Jbm5lciA9IG5ld0JvdHRvbTtcbiAgICBjYW1lcmEuZm92eUlubmVyID0gZm92eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzY2FsZSBmYWN0b3IgZm9yIHpOZWFyIGFuZCB6RmFyIGNhbGN1bGF0aW9ucy5cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxlIGZhY3RvclxuICAgKi9cbiAgc2V0IHNjYWxlT2ZaTmVhckFuZFpGYXIodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX19zY2FsZU9mWk5lYXJBbmRaRmFyID0gdmFsdWU7XG4gICAgdGhpcy5fX3VwZGF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl91cGRhdGVDb3VudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNjYWxlIGZhY3RvciBmb3Igek5lYXIgYW5kIHpGYXIgY2FsY3VsYXRpb25zLlxuICAgKiBAcmV0dXJucyBUaGUgc2NhbGUgZmFjdG9yXG4gICAqL1xuICBnZXQgc2NhbGVPZlpOZWFyQW5kWkZhcigpIHtcbiAgICByZXR1cm4gdGhpcy5fX3NjYWxlT2ZaTmVhckFuZFpGYXI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIHRoZSBtb3VzZSBpcyBjdXJyZW50bHkgcHJlc3NlZCBkb3duLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIG1vdXNlIGlzIGRvd24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzTW91c2VEb3duKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNNb3VzZURvd247XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdGltZXN0YW1wIG9mIHRoZSBsYXN0IG1vdXNlIGRvd24gZXZlbnQuXG4gICAqIEByZXR1cm5zIFRoZSB0aW1lc3RhbXAgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBnZXQgbGFzdE1vdXNlRG93blRpbWVTdGFtcCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fbGFzdE1vdXNlRG93blRpbWVTdGFtcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0aW1lc3RhbXAgb2YgdGhlIGxhc3QgbW91c2UgdXAgZXZlbnQuXG4gICAqIEByZXR1cm5zIFRoZSB0aW1lc3RhbXAgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBnZXQgbGFzdE1vdXNlVXBUaW1lU3RhbXAoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2xhc3RNb3VzZVVwVGltZVN0YW1wO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBS0EsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQUN4QixTQUFTLFVBQVU7QUFDbkIsU0FBUyx3Q0FBd0Msb0JB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LEtBQUtVO0FBQUEsVUFDZCxTQUFTO0FBQUEsWUFDUCxTQUFTLENBQUMsS0FBS1Y7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsU0FBUyxLQUFLNEI7QUFBQSxVQUNkLFNBQVM7QUFBQSxZQUNQLFNBQVMsQ0FBQyxLQUFLNUI7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsU0FBUyxLQUFLOEI7QUFBQSxVQUNkLFNBQVM7QUFBQSxZQUNQLFNBQVMsQ0FBQyxLQUFLOUI7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsU0FBUyxLQUFLZ0M7QUFBQSxVQUNkLFNBQVM7QUFBQSxZQUNQLFNBQVMsQ0FBQyxLQUFLaEM7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsU0FBUyxLQUFLa0M7QUFBQSxVQUNkLFNBQVM7QUFBQSxZQUNQLFNBQVMsQ0FBQyxLQUFLbEM7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsU0FBUyxLQUFLMEI7QUFBQSxVQUNkLFNBQVM7QUFBQSxZQUNQLFNBQVMsQ0FBQyxLQUFLMUI7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsU0FBUyxLQUFLc0I7QUFBQSxVQUNkLFNBQVM7QUFBQSxZQUNQLFNBQVMsQ0FBQyxLQUFLdEI7QUFBQSxVQUNqQjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFVBQ2Y7QUFBQSxR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bkMsV0FBTyxLQUFLQztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSx1QkFBK0I7QUFDakMsV0FBTyxLQUFLQztBQUFBLEVBQ2Q7QUFDRjtBQTFrQ2EsdUJBNkVhaUYsS0FBb0IsUUFBUSxjQUFjLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQTdFaEUsdUJBOEVJVCxLQUE4QixlQUFlLEtBQUs7QUE5RXRELHVCQStFSUMsS0FBOEIsZUFBZSxLQUFLO0FBL0V0RCx1QkFnRkljLEtBQThCLGVBQWUsS0FBSztBQWhGdEQsdUJBa0ZJTCxLQUFtQyxnQkFBZ0IsU0FBUztBQWxGaEUsdUJBbUZJQyxLQUFtQyxnQkFBZ0IsU0FBUztBQW5GaEUsdUJBb0ZJRyxLQUFpQyxnQkFBZ0IsU0FBUztBQXBGOUQsdUJBcUZJRixLQUF1QyxnQkFBZ0IsU0FBUztBQXJGcEUsdUJBc0ZJQyxLQUF3QyxnQkFBZ0IsU0FBUztBQXRGckUsdUJBd0ZJTCxLQUFnQyxnQkFBZ0IsU0FBUztBQXhGbkUsSUFBTSx3QkFBTjsiLAogICJuYW1lcyI6IFsiX191cGRhdGVkIiwgIl9fdXBkYXRlQ291bnQiLCAiX19maXhlZExlbmd0aE9mQ2VudGVyVG9FeWUiLCAiX19pc01vdXNlRG93biIsICJfX2xhc3RNb3VzZURvd25UaW1lU3RhbXAiLCAiX19sYXN0TW91c2VVcFRpbWVTdGFtcCIsICJfX29yaWdpbmFsWSIsICJfX29yaWdpbmFsWCIsICJfX2J1dHRvbk51bWJlciIsICJfX21vdXNlX3RyYW5zbGF0ZV95IiwgIl9fbW91c2VfdHJhbnNsYXRlX3giLCAiX19lZmZpY2llbmN5IiwgIl9fbGVuZ3RoT2ZDZW50ZXJUb0V5ZSIsICJfX2ZvdnlCaWFzIiwgIl9fc2NhbGVPZlRyYW5zbGF0aW9uIiwgIl9fbW91c2VUcmFuc2xhdGVWZWMiLCAiX19uZXdFeWVWZWMiLCAiX19uZXdDZW50ZXJWZWMiLCAiX19uZXdVcFZlYyIsICJfX25ld1RhbmdlbnRWZWMiLCAiX19pc1N5bW1ldHJ5TW9kZSIsICJfX3JvdF9iZ25feCIsICJfX3JvdF9iZ25feSIsICJfX3JvdF94IiwgIl9fcm90X3kiLCAiX19kb2xseSIsICJfX2V5ZVZlYyIsICJfX2NlbnRlclZlYyIsICJfX3VwVmVjIiwgIl9fdGFyZ2V0RW50aXRpZXMiLCAiX19zY2FsZU9mWk5lYXJBbmRaRmFyIiwgIl9fZG9QcmV2ZW50RGVmYXVsdCIsICJfX2lzUHJlc3NpbmdTaGlmdCIsICJfX2lzUHJlc3NpbmdDdHJsIiwgIl9fcGluY2hJbk91dENvbnRyb2wiLCAiX19waW5jaEluT3V0T3JpZ2luYWxEaXN0YW5jZSIsICJfX3Jlc2V0RG9sbHlUb3VjaFRpbWUiLCAiX19tb3VzZURvd25GdW5jIiwgIl9fbW91c2VEb3duIiwgIl9fbW91c2VVcEZ1bmMiLCAiX19tb3VzZVVwIiwgIl9fbW91c2VNb3ZlRnVuYyIsICJfX21vdXNlTW92ZSIsICJfX3RvdWNoRG93bkZ1bmMiLCAiX190b3VjaERvd24iLCAiX190b3VjaFVwRnVuYyIsICJfX3RvdWNoVXAiLCAiX190b3VjaE1vdmVGdW5jIiwgIl9fdG91Y2hNb3ZlIiwgIl9fcGluY2hJbk91dEZ1bmMiLCAiX19waW5jaEluT3V0IiwgIl9fcGluY2hJbk91dEVuZEZ1bmMiLCAiX19waW5jaEluT3V0RW5kIiwgIl9fbW91c2VXaGVlbEZ1bmMiLCAiX19tb3VzZVdoZWVsIiwgIl9fbW91c2VEYmxDbGlja0Z1bmMiLCAiX19tb3VzZURibENsaWNrIiwgIl9fY29udGV4dE1lbnVGdW5jIiwgIl9fY29udGV4dE1lbnUiLCAiX19wcmVzc1NoaWZ0RnVuYyIsICJfX3ByZXNzU2hpZnQiLCAiX19yZWxlYXNlU2hpZnRGdW5jIiwgIl9fcmVsZWFzZVNoaWZ0IiwgIl9fcHJlc3NDdHJsRnVuYyIsICJfX3ByZXNzQ3RybCIsICJfX3JlbGVhc2VDdHJsRnVuYyIsICJfX3JlbGVhc2VDdHJsIiwgIl9fcmVzZXREb2xseUFuZFBvc2l0aW9uRnVuYyIsICJfX3Jlc2V0RG9sbHlBbmRQb3NpdGlvbiIsICJfX2NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQiLCAiX19pbml0aWFsVGFyZ2V0QUFCQiIsICJfX3RyeVRvUHJldmVudERlZmF1bHQiLCAiX19wYXJhbGxlbFRyYW5zbGF0ZUNvbnRyb2wiLCAiX19yb3RhdGVDb250cm9sIiwgIl9fem9vbUNvbnRyb2wiLCAiX19tYXhpbXVtX3kiLCAiX19taW5pbXVtX3kiLCAiX190bXBWZWMzXzAiLCAiX190bXBWZWMzXzEiLCAiX19nZXRUb3VjaGVzRGlzdGFuY2UiLCAiX19nZXRGb3Z5RnJvbUNhbWVyYSIsICJfX3VwZGF0ZVRhcmdldGluZyIsICJfX2NhbGN1bGF0ZUluZmx1ZW5jZU9mQ29udHJvbGxlciIsICJfX3VwZGF0ZUNhbWVyYUNvbXBvbmVudCIsICJfX2dldFRhcmdldEFBQkIiLCAiX190bXBNYXQ0NF8wIiwgIl9fdG1wX3VwIiwgIl9fdG1wX3JvdGF0ZU1fWCIsICJfX3RtcF9yb3RhdGVNX1kiLCAiX190bXBfcm90YXRlTV9SZXNldCIsICJfX3RtcF9yb3RhdGVNX1JldmVydCIsICJfX3RtcF9yb3RhdGVNIiwgIl9fdG1wVmVjM18yIl0KfQo=
