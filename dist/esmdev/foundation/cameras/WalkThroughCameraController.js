// src/foundation/cameras/WalkThroughCameraController.ts
import { AABB } from "../math/AABB.js";
import { MathClassUtil } from "../math/MathClassUtil.js";
import { MathUtil } from "../math/MathUtil.js";
import { Matrix44 } from "../math/Matrix44.js";
import { MutableMatrix33 } from "../math/MutableMatrix33.js";
import { MutableMatrix44 } from "../math/MutableMatrix44.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Is } from "../misc/Is.js";
import { INPUT_HANDLING_STATE_CAMERA_CONTROLLER, InputManager } from "../system/InputManager.js";
import { AbstractCameraController } from "./AbstractCameraController.js";
var _WalkThroughCameraController = class _WalkThroughCameraController extends AbstractCameraController {
  constructor(cameraControllerComponent, options = {
    eventTargetDom: document,
    verticalSpeed: 1,
    horizontalSpeed: 1,
    turnSpeed: 0.25,
    mouseWheelSpeedScale: 1,
    inverseVerticalRotating: false,
    inverseHorizontalRotating: false
  }) {
    super();
    this.__updateCount = 0;
    this._isKeyDown = false;
    this._isMouseDrag = false;
    this._lastKeyCode = -1;
    this._currentDir = MutableVector3.fromCopyArray([0, 0, -1]);
    this._currentPos = MutableVector3.fromCopyArray([0, 0, 0]);
    this._currentCenter = MutableVector3.fromCopyArray([0, 0, -1]);
    this._currentHorizontalDir = MutableVector3.fromCopyArray([0, 0, -1]);
    this._newDir = MutableVector3.fromCopyArray([0, 0, -1]);
    this._isMouseDown = false;
    this._clickedMouseXOnCanvas = -1;
    this._clickedMouseYOnCanvas = -1;
    this._draggedMouseXOnCanvas = -1;
    this._draggedMouseYOnCanvas = -1;
    this._deltaMouseXOnCanvas = -1;
    this._deltaMouseYOnCanvas = -1;
    this._mouseXAdjustScale = 1;
    this._mouseYAdjustScale = 1;
    this._deltaY = -1;
    this._deltaX = -1;
    this._mouseUpBind = this._mouseUp.bind(this);
    this._mouseDownBind = this._mouseDown.bind(this);
    this._mouseMoveBind = this._mouseMove.bind(this);
    this._mouseWheelBind = this._mouseWheel.bind(this);
    this.__doPreventDefault = false;
    this._needInitialize = true;
    this.__targetEntities = [];
    this.aabbWithSkeletal = true;
    this.__cameraControllerComponent = cameraControllerComponent;
    this._horizontalSpeed = options.horizontalSpeed;
    this._verticalSpeed = options.verticalSpeed;
    this._turnSpeed = options.turnSpeed;
    this._mouseXAdjustScale = this._turnSpeed;
    this._mouseYAdjustScale = this._turnSpeed;
    this._mouseWheelSpeedScale = options.mouseWheelSpeedScale;
    this._inverseVerticalRotating = options.inverseVerticalRotating;
    this._inverseHorizontalRotating = options.inverseHorizontalRotating;
    this.reset();
    this._onKeydown = (e) => {
      this._isKeyDown = true;
      this._lastKeyCode = e.keyCode;
    };
    this._onKeyup = () => {
      this._isKeyDown = false;
      this._lastKeyCode = -1;
    };
    const eventTargetDom = options.eventTargetDom;
    this.registerEventListeners(eventTargetDom);
  }
  /**
   * Updates the internal counter and notifies the camera controller component.
   * @private
   */
  _updateCount() {
    this.__updateCount++;
    this.__cameraControllerComponent._updateCount(this.__updateCount);
  }
  /**
   * Gets the current update count.
   * @returns The current update count
   */
  get updateCount() {
    return this.__updateCount;
  }
  /**
   * Registers event listeners for mouse and keyboard input handling.
   * @param eventTargetDom - The DOM element to attach event listeners to, defaults to document
   */
  registerEventListeners(eventTargetDom = document) {
    this._eventTargetDom = eventTargetDom;
    const inputHandlerInfos = [
      {
        eventName: "keydown",
        handler: this._onKeydown,
        options: {
          passive: !this.__doPreventDefault
        },
        classInstance: this,
        eventTargetDom
      },
      {
        eventName: "keyup",
        handler: this._onKeyup,
        options: {
          passive: !this.__doPreventDefault
        },
        classInstance: this,
        eventTargetDom
      }
    ];
    if ("ontouchend" in document) {
      inputHandlerInfos.push(
        {
          eventName: "touchstart",
          handler: this._mouseDownBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchend",
          handler: this._mouseUpBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "touchmove",
          handler: this._mouseMoveBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        }
      );
    }
    if ("onmouseup" in document) {
      inputHandlerInfos.push(
        {
          eventName: "mousedown",
          handler: this._mouseDownBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "mouseup",
          handler: this._mouseUpBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "mouseleave",
          handler: this._mouseUpBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        },
        {
          eventName: "mousemove",
          handler: this._mouseMoveBind,
          options: {
            passive: !this.__doPreventDefault
          },
          classInstance: this,
          eventTargetDom
        }
      );
    }
    if ("onwheel" in document) {
      inputHandlerInfos.push({
        eventName: "wheel",
        handler: this._mouseWheelBind,
        options: {
          passive: !this.__doPreventDefault
        },
        classInstance: this,
        eventTargetDom
      });
    }
    InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, inputHandlerInfos);
  }
  /**
   * Unregisters all event listeners for this camera controller.
   */
  unregisterEventListeners() {
    InputManager.unregister(INPUT_HANDLING_STATE_CAMERA_CONTROLLER);
  }
  /**
   * Attempts to prevent default behavior of events if configured to do so.
   * @param evt - The event to potentially prevent default on
   * @private
   */
  __tryToPreventDefault(evt) {
    if (this.__doPreventDefault) {
      evt.preventDefault();
    }
  }
  /**
   * Handles mouse wheel events for camera movement.
   * @param e - The wheel event
   * @private
   */
  _mouseWheel(e) {
    if (this._currentDir === null) {
      return;
    }
    const delta = -1 * Math.sign(e.deltaY) * this._mouseWheelSpeedScale * this._horizontalSpeed;
    const horizontalDir = _WalkThroughCameraController.__tmp_Vec3_0;
    horizontalDir.setComponents(this._currentDir.x, 0, this._currentDir.z).normalize();
    const deltaVec = MutableVector3.multiplyTo(horizontalDir, delta, _WalkThroughCameraController.__tmp_Vec3_1);
    this._currentPos.add(deltaVec);
    this._currentCenter.add(deltaVec);
    this._updateCount();
  }
  /**
   * Handles mouse down events.
   * @param evt - The mouse event
   * @private
   */
  _mouseDown(evt) {
    this.__tryToPreventDefault(evt);
    this._isMouseDown = true;
    const rect = evt.target.getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;
    this._updateCount();
    return false;
  }
  /**
   * Handles mouse move events for camera rotation during drag.
   * @param evt - The mouse event
   * @private
   */
  _mouseMove(evt) {
    this.__tryToPreventDefault(evt);
    if (!this._isMouseDown) {
      return;
    }
    const rect = evt.target.getBoundingClientRect();
    this._draggedMouseXOnCanvas = evt.clientX - rect.left;
    this._draggedMouseYOnCanvas = evt.clientY - rect.top;
    this._deltaMouseXOnCanvas = this._draggedMouseXOnCanvas - this._clickedMouseXOnCanvas;
    this._deltaMouseYOnCanvas = this._draggedMouseYOnCanvas - this._clickedMouseYOnCanvas;
    this._isMouseDrag = true;
    this._updateCount();
  }
  /**
   * Handles mouse up events to stop dragging.
   * @param evt - The mouse event
   * @private
   */
  _mouseUp(evt) {
    this._isMouseDown = false;
    this._isMouseDrag = false;
    const target = evt.target;
    if ((target == null ? void 0 : target.getBoundingClientRect) == null) {
      return;
    }
    const rect = target.getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;
    this._updateCount();
  }
  /**
   * Attempts to reset the controller state. Currently not implemented.
   */
  tryReset() {
  }
  /**
   * Resets the camera controller to its initial state.
   */
  reset() {
    this._isKeyDown = false;
    this._lastKeyCode = -1;
    this._currentPos.zero();
    this._currentCenter.setComponents(0, 0, -1);
    this._currentDir.setComponents(0, 0, -1);
    this._currentHorizontalDir.setComponents(0, 0, -1);
    this._isMouseDown = false;
    this._isMouseDrag = false;
    this._draggedMouseXOnCanvas = -1;
    this._draggedMouseYOnCanvas = -1;
    this._deltaMouseXOnCanvas = -1;
    this._deltaMouseYOnCanvas = -1;
    this._mouseXAdjustScale = this._turnSpeed;
    this._mouseYAdjustScale = this._turnSpeed;
    this._deltaY = 0;
    this._deltaX = 0;
    this._newDir.setComponents(0, 0, -1);
  }
  /**
   * Main logic method that updates the camera component based on input.
   * @param cameraComponent - The camera component to update
   */
  logic(cameraComponent) {
    this.__updateCameraComponent(cameraComponent);
  }
  /**
   * Updates the camera component with new position, direction, and other properties.
   * @param camera - The camera component to update
   * @private
   */
  __updateCameraComponent(camera) {
    const aabb = new AABB();
    for (const targetEntity of this.__targetEntities) {
      aabb.mergeAABB(this.__getTargetAABB(targetEntity));
    }
    const targetAABB = aabb;
    if (this._needInitialize && targetAABB != null) {
      const lengthCenterToCamera = targetAABB.lengthCenterToCorner * (1 + 1 / Math.tan(MathUtil.degreeToRadian(camera.fovy / 2)));
      this._currentPos.copyComponents(targetAABB.centerPoint);
      this._currentPos.z += lengthCenterToCamera;
      this._currentCenter.copyComponents(targetAABB.centerPoint);
      this._currentDir.setComponents(0, 0, -1);
      const sceneComponent = camera.entity.tryToGetSceneGraph();
      if (Is.exist(sceneComponent)) {
        const invMat = Matrix44.invertTo(sceneComponent.matrixInner, _WalkThroughCameraController.__tmpInvMat);
        invMat.multiplyVector3To(this._currentPos, this._currentPos);
        invMat.multiplyVector3To(this._currentCenter, this._currentCenter);
      }
      this._needInitialize = false;
    }
    const t = this._deltaY / 90;
    this._newDir.x = this._currentDir.x * (1 - t);
    this._newDir.y = t;
    this._newDir.z = this._currentDir.z * (1 - t);
    this._newDir.normalize();
    this._currentHorizontalDir.x = this._currentDir.x;
    this._currentHorizontalDir.y = 0;
    this._currentHorizontalDir.z = this._currentDir.z;
    this._currentHorizontalDir.normalize();
    const moveVector = _WalkThroughCameraController.__tmp_Vec3_0.zero();
    switch (this._lastKeyCode) {
      case 87:
      // w key
      case 38:
        moveVector.x = this._currentHorizontalDir.x * this._horizontalSpeed;
        moveVector.z = this._currentHorizontalDir.z * this._horizontalSpeed;
        break;
      case 65:
      // a key
      case 37:
        moveVector.x = this._currentHorizontalDir.z * this._horizontalSpeed;
        moveVector.z = -this._currentHorizontalDir.x * this._horizontalSpeed;
        break;
      case 83:
      // s key
      case 40:
        moveVector.x = -this._currentHorizontalDir.x * this._horizontalSpeed;
        moveVector.z = -this._currentHorizontalDir.z * this._horizontalSpeed;
        break;
      case 68:
      // d key
      case 39:
        moveVector.x = -this._currentHorizontalDir.z * this._horizontalSpeed;
        moveVector.z = this._currentHorizontalDir.x * this._horizontalSpeed;
        break;
      case 81:
        moveVector.x = -this._newDir.x * this._horizontalSpeed;
        moveVector.y = -this._newDir.y * this._horizontalSpeed;
        moveVector.z = -this._newDir.z * this._horizontalSpeed;
        break;
      case 69:
        moveVector.x = this._newDir.x * this._horizontalSpeed;
        moveVector.y = this._newDir.y * this._horizontalSpeed;
        moveVector.z = this._newDir.z * this._horizontalSpeed;
        break;
      case 82:
        moveVector.y = this._verticalSpeed;
        break;
      case 70:
        moveVector.y = -this._verticalSpeed;
        break;
    }
    this._currentPos.add(moveVector);
    this._currentCenter.add(moveVector);
    if (this._isMouseDrag) {
      if (this._inverseHorizontalRotating) {
        this._deltaX = this._deltaMouseXOnCanvas * this._mouseXAdjustScale;
      } else {
        this._deltaX = -this._deltaMouseXOnCanvas * this._mouseXAdjustScale;
      }
      if (this._inverseVerticalRotating) {
        this._deltaY += this._deltaMouseYOnCanvas * this._mouseYAdjustScale;
      } else {
        this._deltaY += -this._deltaMouseYOnCanvas * this._mouseYAdjustScale;
      }
      this._deltaY = Math.max(-120, Math.min(50, this._deltaY));
      const rotateMatrix = _WalkThroughCameraController.__tmpRotateMat.rotateY(MathUtil.degreeToRadian(this._deltaX));
      rotateMatrix.multiplyVectorTo(this._currentDir, this._currentDir);
      const newEyeToCenter = MutableVector3.subtractTo(
        this._currentCenter,
        this._currentPos,
        _WalkThroughCameraController.__tmp_Vec3_1
      );
      rotateMatrix.multiplyVectorTo(newEyeToCenter, newEyeToCenter);
      newEyeToCenter.x = newEyeToCenter.x * (1 - t);
      newEyeToCenter.y = t;
      newEyeToCenter.z = newEyeToCenter.z * (1 - t);
      newEyeToCenter.normalize();
      this._currentCenter.copyComponents(this._currentPos);
      this._currentCenter.add(newEyeToCenter);
      this._clickedMouseXOnCanvas = this._draggedMouseXOnCanvas;
      this._clickedMouseYOnCanvas = this._draggedMouseYOnCanvas;
      this._deltaMouseXOnCanvas = 0;
      this._deltaMouseYOnCanvas = 0;
    }
    camera.eyeInner = this._currentPos;
    camera.directionInner = this._currentCenter;
    camera.upInner = camera._up;
    camera.leftInner = camera.left;
    camera.rightInner = camera.right;
    camera.topInner = camera.top;
    camera.bottomInner = camera.bottom;
    camera.fovyInner = camera.fovy;
    this._calcZNearInner(camera, this._currentPos, this._newDir);
    this._calcZFarInner(camera);
  }
  /**
   * Gets the current camera direction.
   * @returns The current direction vector or null if not available
   */
  getDirection() {
    return this._currentCenter !== null ? this._newDir.clone() : null;
  }
  /**
   * Sets the horizontal movement speed.
   * @param value - The new horizontal speed value
   */
  set horizontalSpeed(value) {
    this._horizontalSpeed = value;
  }
  /**
   * Gets the current horizontal movement speed.
   * @returns The current horizontal speed
   */
  get horizontalSpeed() {
    return this._horizontalSpeed;
  }
  /**
   * Sets the vertical movement speed.
   * @param value - The new vertical speed value
   */
  set verticalSpeed(value) {
    this._verticalSpeed = value;
  }
  /**
   * Gets the current vertical movement speed.
   * @returns The current vertical speed
   */
  get verticalSpeed() {
    return this._verticalSpeed;
  }
  /**
   * Sets the mouse wheel speed scale.
   * @param value - The new mouse wheel speed scale
   */
  set mouseWheelSpeed(value) {
    this._mouseWheelSpeedScale = value;
  }
  /**
   * Gets the current mouse wheel speed scale.
   * @returns The current mouse wheel speed scale
   */
  get mouseWheelSpeed() {
    return this._mouseWheelSpeedScale;
  }
  /**
   * Sets a single target entity for the camera to focus on.
   * @param targetEntity - The entity to set as the target
   */
  setTarget(targetEntity) {
    this.setTargets([targetEntity]);
  }
  /**
   * Gets the axis-aligned bounding box for a target entity.
   * @param targetEntity - The entity to get the AABB for
   * @returns The AABB of the target entity
   * @private
   */
  __getTargetAABB(targetEntity) {
    if (this.aabbWithSkeletal) {
      return targetEntity.tryToGetSceneGraph().worldMergedAABBWithSkeletal;
    }
    return targetEntity.tryToGetSceneGraph().worldMergedAABB;
  }
  /**
   * Sets multiple target entities for the camera to focus on.
   * Automatically adjusts movement speeds based on the size of the targets.
   * @param targetEntities - Array of entities to set as targets
   */
  setTargets(targetEntities) {
    const aabb = new AABB();
    for (const targetEntity of targetEntities) {
      aabb.mergeAABB(this.__getTargetAABB(targetEntity));
    }
    const speed = aabb.lengthCenterToCorner / 10;
    this.verticalSpeed = speed;
    this.horizontalSpeed = speed;
    this.__targetEntities = targetEntities;
    this._needInitialize = true;
    this._updateCount();
  }
  /**
   * Gets the current target entities.
   * @returns Array of current target entities
   */
  getTargets() {
    return this.__targetEntities;
  }
  /**
   * Gets all camera controller information for serialization.
   * @returns Object containing all controller state information
   */
  get allInfo() {
    const info = {};
    info.verticalSpeed = this.verticalSpeed;
    info.horizontalSpeed = this.horizontalSpeed;
    info._turnSpeed = this._turnSpeed;
    if (this._currentPos) {
      info._currentPos = this._currentPos.clone();
    }
    if (this._currentCenter) {
      info._currentCenter = this._currentCenter.clone();
    }
    if (this._currentDir) {
      info._currentDir = this._currentDir.clone();
    }
    info._deltaY = this._deltaY;
    info._newDir = this._newDir.clone();
    return info;
  }
  /**
   * Sets all camera controller information from serialized data.
   * @param arg - Object or JSON string containing controller state information
   */
  set allInfo(arg) {
    let json = arg;
    if (typeof arg === "string") {
      json = JSON.parse(arg);
    }
    for (const key in json) {
      if (Object.hasOwn(json, key) && key in this) {
        if (key === "quaternion") {
          this[key] = MathClassUtil.cloneOfMathObjects(MathClassUtil.arrayToQuaternion(json[key]));
        } else {
          this[key] = MathClassUtil.cloneOfMathObjects(MathClassUtil.arrayToVectorOrMatrix(json[key]));
        }
      }
    }
  }
};
_WalkThroughCameraController.__tmpInvMat = MutableMatrix44.identity();
_WalkThroughCameraController.__tmpRotateMat = MutableMatrix33.identity();
_WalkThroughCameraController.__tmp_Vec3_0 = MutableVector3.zero();
_WalkThroughCameraController.__tmp_Vec3_1 = MutableVector3.zero();
var WalkThroughCameraController = _WalkThroughCameraController;
export {
  WalkThroughCameraController
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY2FtZXJhcy9XYWxrVGhyb3VnaENhbWVyYUNvbnRyb2xsZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vY29tcG9uZW50cy9DYW1lcmEvQ2FtZXJhQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ2FtZXJhQ29udHJvbGxlci9DYW1lcmFDb250cm9sbGVyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSVNjZW5lR3JhcGhFbnRpdHkgfSBmcm9tICcuLi9oZWxwZXJzL0VudGl0eUhlbHBlcic7XG5pbXBvcnQgeyBBQUJCIH0gZnJvbSAnLi4vbWF0aC9BQUJCJztcbmltcG9ydCB7IE1hdGhDbGFzc1V0aWwgfSBmcm9tICcuLi9tYXRoL01hdGhDbGFzc1V0aWwnO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4MzMgfSBmcm9tICcuLi9tYXRoL011dGFibGVNYXRyaXgzMyc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi9taXNjL0lzJztcbmltcG9ydCB7IElOUFVUX0hBTkRMSU5HX1NUQVRFX0NBTUVSQV9DT05UUk9MTEVSLCB0eXBlIElucHV0SGFuZGxlckluZm8sIElucHV0TWFuYWdlciB9IGZyb20gJy4uL3N5c3RlbS9JbnB1dE1hbmFnZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RDYW1lcmFDb250cm9sbGVyIH0gZnJvbSAnLi9BYnN0cmFjdENhbWVyYUNvbnRyb2xsZXInO1xuaW1wb3J0IHR5cGUgeyBJQ2FtZXJhQ29udHJvbGxlciB9IGZyb20gJy4vSUNhbWVyYUNvbnRyb2xsZXInO1xuXG50eXBlIEtleWJvYXJkRXZlbnRMaXN0ZW5lciA9IChldnQ6IEtleWJvYXJkRXZlbnQpID0+IGFueTtcblxuLyoqXG4gKiBXYWxrVGhyb3VnaENhbWVyYUNvbnRyb2xsZXIgaXMgYSBjYW1lcmEgY29udHJvbGxlciB0aGF0IGFsbG93cyB0aGUgdXNlciB0byB3YWxrIHRocm91Z2ggYSBzY2VuZS5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBXYWxrVGhyb3VnaENhbWVyYUNvbnRyb2xsZXIgZXh0ZW5kcyBBYnN0cmFjdENhbWVyYUNvbnRyb2xsZXIgaW1wbGVtZW50cyBJQ2FtZXJhQ29udHJvbGxlciB7XG4gIHByaXZhdGUgX191cGRhdGVDb3VudCA9IDA7XG4gIHByaXZhdGUgX2hvcml6b250YWxTcGVlZDogbnVtYmVyO1xuICBwcml2YXRlIF92ZXJ0aWNhbFNwZWVkOiBudW1iZXI7XG4gIHByaXZhdGUgX3R1cm5TcGVlZDogbnVtYmVyO1xuICBwcml2YXRlIF9tb3VzZVdoZWVsU3BlZWRTY2FsZTogbnVtYmVyO1xuICBwcml2YXRlIF9pbnZlcnNlVmVydGljYWxSb3RhdGluZzogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfaW52ZXJzZUhvcml6b250YWxSb3RhdGluZzogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfb25LZXlkb3duOiBLZXlib2FyZEV2ZW50TGlzdGVuZXI7XG4gIHByaXZhdGUgX2lzS2V5RG93biA9IGZhbHNlO1xuICBwcml2YXRlIF9pc01vdXNlRHJhZyA9IGZhbHNlO1xuICBwcml2YXRlIF9sYXN0S2V5Q29kZSA9IC0xO1xuICBwcml2YXRlIF9vbktleXVwOiBLZXlib2FyZEV2ZW50TGlzdGVuZXI7XG4gIHByaXZhdGUgX2N1cnJlbnREaXIgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAtMV0pO1xuICBwcml2YXRlIF9jdXJyZW50UG9zID0gTXV0YWJsZVZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgMF0pO1xuICBwcml2YXRlIF9jdXJyZW50Q2VudGVyID0gTXV0YWJsZVZlY3RvcjMuZnJvbUNvcHlBcnJheShbMCwgMCwgLTFdKTtcbiAgcHJpdmF0ZSBfY3VycmVudEhvcml6b250YWxEaXIgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAtMV0pO1xuICBwcml2YXRlIF9uZXdEaXIgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weUFycmF5KFswLCAwLCAtMV0pO1xuICBwcml2YXRlIF9pc01vdXNlRG93biA9IGZhbHNlO1xuICBwcml2YXRlIF9jbGlja2VkTW91c2VYT25DYW52YXMgPSAtMTtcbiAgcHJpdmF0ZSBfY2xpY2tlZE1vdXNlWU9uQ2FudmFzID0gLTE7XG4gIHByaXZhdGUgX2RyYWdnZWRNb3VzZVhPbkNhbnZhcyA9IC0xO1xuICBwcml2YXRlIF9kcmFnZ2VkTW91c2VZT25DYW52YXMgPSAtMTtcbiAgcHJpdmF0ZSBfZGVsdGFNb3VzZVhPbkNhbnZhcyA9IC0xO1xuICBwcml2YXRlIF9kZWx0YU1vdXNlWU9uQ2FudmFzID0gLTE7XG4gIHByaXZhdGUgX21vdXNlWEFkanVzdFNjYWxlID0gMTtcbiAgcHJpdmF0ZSBfbW91c2VZQWRqdXN0U2NhbGUgPSAxO1xuICBwcml2YXRlIF9kZWx0YVkgPSAtMTtcbiAgcHJpdmF0ZSBfZGVsdGFYID0gLTE7XG4gIHByaXZhdGUgX21vdXNlVXBCaW5kID0gKHRoaXMuX21vdXNlVXAgYXMgYW55KS5iaW5kKHRoaXMpO1xuICBwcml2YXRlIF9tb3VzZURvd25CaW5kID0gKHRoaXMuX21vdXNlRG93biBhcyBhbnkpLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX21vdXNlTW92ZUJpbmQgPSAodGhpcy5fbW91c2VNb3ZlIGFzIGFueSkuYmluZCh0aGlzKTtcbiAgcHJpdmF0ZSBfbW91c2VXaGVlbEJpbmQgPSAodGhpcy5fbW91c2VXaGVlbCBhcyBhbnkpLmJpbmQodGhpcyk7XG4gIHByaXZhdGUgX2V2ZW50VGFyZ2V0RG9tPzogYW55O1xuICBwcml2YXRlIF9fZG9QcmV2ZW50RGVmYXVsdCA9IGZhbHNlO1xuICBwcml2YXRlIF9uZWVkSW5pdGlhbGl6ZSA9IHRydWU7XG4gIHByb3RlY3RlZCBfX3RhcmdldEVudGl0aWVzOiBJU2NlbmVHcmFwaEVudGl0eVtdID0gW107XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBJbnZNYXQ6IE11dGFibGVNYXRyaXg0NCA9IE11dGFibGVNYXRyaXg0NC5pZGVudGl0eSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFJvdGF0ZU1hdDogTXV0YWJsZU1hdHJpeDMzID0gTXV0YWJsZU1hdHJpeDMzLmlkZW50aXR5KCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX1ZlYzNfMDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fdG1wX1ZlYzNfMTogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgcHVibGljIGFhYmJXaXRoU2tlbGV0YWwgPSB0cnVlO1xuICBwcml2YXRlIF9fY2FtZXJhQ29udHJvbGxlckNvbXBvbmVudDogQ2FtZXJhQ29udHJvbGxlckNvbXBvbmVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBjYW1lcmFDb250cm9sbGVyQ29tcG9uZW50OiBDYW1lcmFDb250cm9sbGVyQ29tcG9uZW50LFxuICAgIG9wdGlvbnMgPSB7XG4gICAgICBldmVudFRhcmdldERvbTogZG9jdW1lbnQsXG4gICAgICB2ZXJ0aWNhbFNwZWVkOiAxLFxuICAgICAgaG9yaXpvbnRhbFNwZWVkOiAxLFxuICAgICAgdHVyblNwZWVkOiAwLjI1LFxuICAgICAgbW91c2VXaGVlbFNwZWVkU2NhbGU6IDEsXG4gICAgICBpbnZlcnNlVmVydGljYWxSb3RhdGluZzogZmFsc2UsXG4gICAgICBpbnZlcnNlSG9yaXpvbnRhbFJvdGF0aW5nOiBmYWxzZSxcbiAgICB9XG4gICkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQgPSBjYW1lcmFDb250cm9sbGVyQ29tcG9uZW50O1xuXG4gICAgdGhpcy5faG9yaXpvbnRhbFNwZWVkID0gb3B0aW9ucy5ob3Jpem9udGFsU3BlZWQ7XG4gICAgdGhpcy5fdmVydGljYWxTcGVlZCA9IG9wdGlvbnMudmVydGljYWxTcGVlZDtcbiAgICB0aGlzLl90dXJuU3BlZWQgPSBvcHRpb25zLnR1cm5TcGVlZDtcbiAgICB0aGlzLl9tb3VzZVhBZGp1c3RTY2FsZSA9IHRoaXMuX3R1cm5TcGVlZDtcbiAgICB0aGlzLl9tb3VzZVlBZGp1c3RTY2FsZSA9IHRoaXMuX3R1cm5TcGVlZDtcbiAgICB0aGlzLl9tb3VzZVdoZWVsU3BlZWRTY2FsZSA9IG9wdGlvbnMubW91c2VXaGVlbFNwZWVkU2NhbGU7XG4gICAgdGhpcy5faW52ZXJzZVZlcnRpY2FsUm90YXRpbmcgPSBvcHRpb25zLmludmVyc2VWZXJ0aWNhbFJvdGF0aW5nO1xuICAgIHRoaXMuX2ludmVyc2VIb3Jpem9udGFsUm90YXRpbmcgPSBvcHRpb25zLmludmVyc2VIb3Jpem9udGFsUm90YXRpbmc7XG5cbiAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICB0aGlzLl9vbktleWRvd24gPSBlID0+IHtcbiAgICAgIHRoaXMuX2lzS2V5RG93biA9IHRydWU7XG4gICAgICB0aGlzLl9sYXN0S2V5Q29kZSA9IGUua2V5Q29kZTtcbiAgICB9O1xuXG4gICAgdGhpcy5fb25LZXl1cCA9ICgpID0+IHtcbiAgICAgIHRoaXMuX2lzS2V5RG93biA9IGZhbHNlO1xuICAgICAgdGhpcy5fbGFzdEtleUNvZGUgPSAtMTtcbiAgICB9O1xuXG4gICAgY29uc3QgZXZlbnRUYXJnZXREb20gPSBvcHRpb25zLmV2ZW50VGFyZ2V0RG9tO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50TGlzdGVuZXJzKGV2ZW50VGFyZ2V0RG9tKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBpbnRlcm5hbCBjb3VudGVyIGFuZCBub3RpZmllcyB0aGUgY2FtZXJhIGNvbnRyb2xsZXIgY29tcG9uZW50LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlQ291bnQoKSB7XG4gICAgdGhpcy5fX3VwZGF0ZUNvdW50Kys7XG4gICAgdGhpcy5fX2NhbWVyYUNvbnRyb2xsZXJDb21wb25lbnQuX3VwZGF0ZUNvdW50KHRoaXMuX191cGRhdGVDb3VudCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB1cGRhdGUgY291bnQuXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHVwZGF0ZSBjb3VudFxuICAgKi9cbiAgZ2V0IHVwZGF0ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fdXBkYXRlQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGV2ZW50IGxpc3RlbmVycyBmb3IgbW91c2UgYW5kIGtleWJvYXJkIGlucHV0IGhhbmRsaW5nLlxuICAgKiBAcGFyYW0gZXZlbnRUYXJnZXREb20gLSBUaGUgRE9NIGVsZW1lbnQgdG8gYXR0YWNoIGV2ZW50IGxpc3RlbmVycyB0bywgZGVmYXVsdHMgdG8gZG9jdW1lbnRcbiAgICovXG4gIHJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMoZXZlbnRUYXJnZXREb206IERvY3VtZW50ID0gZG9jdW1lbnQpIHtcbiAgICB0aGlzLl9ldmVudFRhcmdldERvbSA9IGV2ZW50VGFyZ2V0RG9tO1xuXG4gICAgY29uc3QgaW5wdXRIYW5kbGVySW5mb3M6IElucHV0SGFuZGxlckluZm9bXSA9IFtcbiAgICAgIHtcbiAgICAgICAgZXZlbnROYW1lOiAna2V5ZG93bicsXG4gICAgICAgIGhhbmRsZXI6IHRoaXMuX29uS2V5ZG93bixcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgfSxcbiAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBldmVudE5hbWU6ICdrZXl1cCcsXG4gICAgICAgIGhhbmRsZXI6IHRoaXMuX29uS2V5dXAsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgIH0sXG4gICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgfSxcbiAgICBdO1xuICAgIGlmICgnb250b3VjaGVuZCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGlucHV0SGFuZGxlckluZm9zLnB1c2goXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICd0b3VjaHN0YXJ0JyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9tb3VzZURvd25CaW5kLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICd0b3VjaGVuZCcsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fbW91c2VVcEJpbmQsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ3RvdWNobW92ZScsXG4gICAgICAgICAgaGFuZGxlcjogdGhpcy5fbW91c2VNb3ZlQmluZCxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoJ29ubW91c2V1cCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGlucHV0SGFuZGxlckluZm9zLnB1c2goXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICdtb3VzZWRvd24nLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX21vdXNlRG93bkJpbmQsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2xhc3NJbnN0YW5jZTogdGhpcyxcbiAgICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGV2ZW50TmFtZTogJ21vdXNldXAnLFxuICAgICAgICAgIGhhbmRsZXI6IHRoaXMuX21vdXNlVXBCaW5kLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBldmVudE5hbWU6ICdtb3VzZWxlYXZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9tb3VzZVVwQmluZCxcbiAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBwYXNzaXZlOiAhdGhpcy5fX2RvUHJldmVudERlZmF1bHQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0RG9tLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZXZlbnROYW1lOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICBoYW5kbGVyOiB0aGlzLl9tb3VzZU1vdmVCaW5kLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHBhc3NpdmU6ICF0aGlzLl9fZG9QcmV2ZW50RGVmYXVsdCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNsYXNzSW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgZXZlbnRUYXJnZXREb20sXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIGlmICgnb253aGVlbCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGlucHV0SGFuZGxlckluZm9zLnB1c2goe1xuICAgICAgICBldmVudE5hbWU6ICd3aGVlbCcsXG4gICAgICAgIGhhbmRsZXI6IHRoaXMuX21vdXNlV2hlZWxCaW5kLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgcGFzc2l2ZTogIXRoaXMuX19kb1ByZXZlbnREZWZhdWx0LFxuICAgICAgICB9LFxuICAgICAgICBjbGFzc0luc3RhbmNlOiB0aGlzLFxuICAgICAgICBldmVudFRhcmdldERvbSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIElucHV0TWFuYWdlci5yZWdpc3RlcihJTlBVVF9IQU5ETElOR19TVEFURV9DQU1FUkFfQ09OVFJPTExFUiwgaW5wdXRIYW5kbGVySW5mb3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXJzIGFsbCBldmVudCBsaXN0ZW5lcnMgZm9yIHRoaXMgY2FtZXJhIGNvbnRyb2xsZXIuXG4gICAqL1xuICB1bnJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgSW5wdXRNYW5hZ2VyLnVucmVnaXN0ZXIoSU5QVVRfSEFORExJTkdfU1RBVEVfQ0FNRVJBX0NPTlRST0xMRVIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGVtcHRzIHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvciBvZiBldmVudHMgaWYgY29uZmlndXJlZCB0byBkbyBzby5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBldmVudCB0byBwb3RlbnRpYWxseSBwcmV2ZW50IGRlZmF1bHQgb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX190cnlUb1ByZXZlbnREZWZhdWx0KGV2dDogRXZlbnQpIHtcbiAgICBpZiAodGhpcy5fX2RvUHJldmVudERlZmF1bHQpIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIG1vdXNlIHdoZWVsIGV2ZW50cyBmb3IgY2FtZXJhIG1vdmVtZW50LlxuICAgKiBAcGFyYW0gZSAtIFRoZSB3aGVlbCBldmVudFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX21vdXNlV2hlZWwoZTogV2hlZWxFdmVudCkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50RGlyID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRlbHRhID0gLTEgKiBNYXRoLnNpZ24oKGUgYXMgYW55KS5kZWx0YVkpICogdGhpcy5fbW91c2VXaGVlbFNwZWVkU2NhbGUgKiB0aGlzLl9ob3Jpem9udGFsU3BlZWQ7XG4gICAgY29uc3QgaG9yaXpvbnRhbERpciA9IFdhbGtUaHJvdWdoQ2FtZXJhQ29udHJvbGxlci5fX3RtcF9WZWMzXzA7XG4gICAgaG9yaXpvbnRhbERpci5zZXRDb21wb25lbnRzKHRoaXMuX2N1cnJlbnREaXIueCwgMCwgdGhpcy5fY3VycmVudERpci56KS5ub3JtYWxpemUoKTtcblxuICAgIGNvbnN0IGRlbHRhVmVjID0gTXV0YWJsZVZlY3RvcjMubXVsdGlwbHlUbyhob3Jpem9udGFsRGlyLCBkZWx0YSwgV2Fsa1Rocm91Z2hDYW1lcmFDb250cm9sbGVyLl9fdG1wX1ZlYzNfMSk7XG4gICAgdGhpcy5fY3VycmVudFBvcy5hZGQoZGVsdGFWZWMpO1xuICAgIHRoaXMuX2N1cnJlbnRDZW50ZXIuYWRkKGRlbHRhVmVjKTtcblxuICAgIHRoaXMuX3VwZGF0ZUNvdW50KCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBtb3VzZSBkb3duIGV2ZW50cy5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBtb3VzZSBldmVudFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX21vdXNlRG93bihldnQ6IE1vdXNlRXZlbnQpIHtcbiAgICB0aGlzLl9fdHJ5VG9QcmV2ZW50RGVmYXVsdChldnQpO1xuICAgIHRoaXMuX2lzTW91c2VEb3duID0gdHJ1ZTtcblxuICAgIGNvbnN0IHJlY3QgPSAoZXZ0LnRhcmdldCEgYXMgYW55KS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB0aGlzLl9jbGlja2VkTW91c2VYT25DYW52YXMgPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICB0aGlzLl9jbGlja2VkTW91c2VZT25DYW52YXMgPSBldnQuY2xpZW50WSAtIHJlY3QudG9wO1xuXG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBtb3VzZSBtb3ZlIGV2ZW50cyBmb3IgY2FtZXJhIHJvdGF0aW9uIGR1cmluZyBkcmFnLlxuICAgKiBAcGFyYW0gZXZ0IC0gVGhlIG1vdXNlIGV2ZW50XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbW91c2VNb3ZlKGV2dDogTW91c2VFdmVudCkge1xuICAgIHRoaXMuX190cnlUb1ByZXZlbnREZWZhdWx0KGV2dCk7XG4gICAgaWYgKCF0aGlzLl9pc01vdXNlRG93bikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY3QgPSAoZXZ0LnRhcmdldCEgYXMgYW55KS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB0aGlzLl9kcmFnZ2VkTW91c2VYT25DYW52YXMgPSBldnQuY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICB0aGlzLl9kcmFnZ2VkTW91c2VZT25DYW52YXMgPSBldnQuY2xpZW50WSAtIHJlY3QudG9wO1xuXG4gICAgdGhpcy5fZGVsdGFNb3VzZVhPbkNhbnZhcyA9IHRoaXMuX2RyYWdnZWRNb3VzZVhPbkNhbnZhcyAtIHRoaXMuX2NsaWNrZWRNb3VzZVhPbkNhbnZhcztcbiAgICB0aGlzLl9kZWx0YU1vdXNlWU9uQ2FudmFzID0gdGhpcy5fZHJhZ2dlZE1vdXNlWU9uQ2FudmFzIC0gdGhpcy5fY2xpY2tlZE1vdXNlWU9uQ2FudmFzO1xuXG4gICAgdGhpcy5faXNNb3VzZURyYWcgPSB0cnVlO1xuICAgIHRoaXMuX3VwZGF0ZUNvdW50KCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBtb3VzZSB1cCBldmVudHMgdG8gc3RvcCBkcmFnZ2luZy5cbiAgICogQHBhcmFtIGV2dCAtIFRoZSBtb3VzZSBldmVudFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX21vdXNlVXAoZXZ0OiBNb3VzZUV2ZW50KSB7XG4gICAgdGhpcy5faXNNb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLl9pc01vdXNlRHJhZyA9IGZhbHNlO1xuXG4gICAgY29uc3QgdGFyZ2V0ID0gZXZ0LnRhcmdldCBhcyBhbnk7XG4gICAgaWYgKHRhcmdldD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRoaXMuX2NsaWNrZWRNb3VzZVhPbkNhbnZhcyA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICAgIHRoaXMuX2NsaWNrZWRNb3VzZVlPbkNhbnZhcyA9IGV2dC5jbGllbnRZIC0gcmVjdC50b3A7XG4gICAgdGhpcy5fdXBkYXRlQ291bnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byByZXNldCB0aGUgY29udHJvbGxlciBzdGF0ZS4gQ3VycmVudGx5IG5vdCBpbXBsZW1lbnRlZC5cbiAgICovXG4gIHRyeVJlc2V0KCkge31cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBjYW1lcmEgY29udHJvbGxlciB0byBpdHMgaW5pdGlhbCBzdGF0ZS5cbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuX2lzS2V5RG93biA9IGZhbHNlO1xuICAgIHRoaXMuX2xhc3RLZXlDb2RlID0gLTE7XG4gICAgdGhpcy5fY3VycmVudFBvcy56ZXJvKCk7XG4gICAgdGhpcy5fY3VycmVudENlbnRlci5zZXRDb21wb25lbnRzKDAsIDAsIC0xKTtcbiAgICB0aGlzLl9jdXJyZW50RGlyLnNldENvbXBvbmVudHMoMCwgMCwgLTEpO1xuICAgIHRoaXMuX2N1cnJlbnRIb3Jpem9udGFsRGlyLnNldENvbXBvbmVudHMoMCwgMCwgLTEpO1xuICAgIHRoaXMuX2lzTW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy5faXNNb3VzZURyYWcgPSBmYWxzZTtcbiAgICB0aGlzLl9kcmFnZ2VkTW91c2VYT25DYW52YXMgPSAtMTtcbiAgICB0aGlzLl9kcmFnZ2VkTW91c2VZT25DYW52YXMgPSAtMTtcbiAgICB0aGlzLl9kZWx0YU1vdXNlWE9uQ2FudmFzID0gLTE7XG4gICAgdGhpcy5fZGVsdGFNb3VzZVlPbkNhbnZhcyA9IC0xO1xuICAgIHRoaXMuX21vdXNlWEFkanVzdFNjYWxlID0gdGhpcy5fdHVyblNwZWVkO1xuICAgIHRoaXMuX21vdXNlWUFkanVzdFNjYWxlID0gdGhpcy5fdHVyblNwZWVkO1xuICAgIHRoaXMuX2RlbHRhWSA9IDA7XG4gICAgdGhpcy5fZGVsdGFYID0gMDtcbiAgICB0aGlzLl9uZXdEaXIuc2V0Q29tcG9uZW50cygwLCAwLCAtMSk7XG4gIH1cblxuICAvKipcbiAgICogTWFpbiBsb2dpYyBtZXRob2QgdGhhdCB1cGRhdGVzIHRoZSBjYW1lcmEgY29tcG9uZW50IGJhc2VkIG9uIGlucHV0LlxuICAgKiBAcGFyYW0gY2FtZXJhQ29tcG9uZW50IC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdG8gdXBkYXRlXG4gICAqL1xuICBsb2dpYyhjYW1lcmFDb21wb25lbnQ6IENhbWVyYUNvbXBvbmVudCkge1xuICAgIHRoaXMuX191cGRhdGVDYW1lcmFDb21wb25lbnQoY2FtZXJhQ29tcG9uZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjYW1lcmEgY29tcG9uZW50IHdpdGggbmV3IHBvc2l0aW9uLCBkaXJlY3Rpb24sIGFuZCBvdGhlciBwcm9wZXJ0aWVzLlxuICAgKiBAcGFyYW0gY2FtZXJhIC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdG8gdXBkYXRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fdXBkYXRlQ2FtZXJhQ29tcG9uZW50KGNhbWVyYTogQ2FtZXJhQ29tcG9uZW50KSB7XG4gICAgY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAgZm9yIChjb25zdCB0YXJnZXRFbnRpdHkgb2YgdGhpcy5fX3RhcmdldEVudGl0aWVzKSB7XG4gICAgICBhYWJiLm1lcmdlQUFCQih0aGlzLl9fZ2V0VGFyZ2V0QUFCQih0YXJnZXRFbnRpdHkpKTtcbiAgICB9XG4gICAgY29uc3QgdGFyZ2V0QUFCQiA9IGFhYmI7XG4gICAgaWYgKHRoaXMuX25lZWRJbml0aWFsaXplICYmIHRhcmdldEFBQkIgIT0gbnVsbCkge1xuICAgICAgY29uc3QgbGVuZ3RoQ2VudGVyVG9DYW1lcmEgPVxuICAgICAgICB0YXJnZXRBQUJCLmxlbmd0aENlbnRlclRvQ29ybmVyICogKDEuMCArIDEuMCAvIE1hdGgudGFuKE1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKGNhbWVyYS5mb3Z5IC8gMi4wKSkpO1xuICAgICAgdGhpcy5fY3VycmVudFBvcy5jb3B5Q29tcG9uZW50cyh0YXJnZXRBQUJCLmNlbnRlclBvaW50KTtcbiAgICAgIHRoaXMuX2N1cnJlbnRQb3MueiArPSBsZW5ndGhDZW50ZXJUb0NhbWVyYTtcblxuICAgICAgdGhpcy5fY3VycmVudENlbnRlci5jb3B5Q29tcG9uZW50cyh0YXJnZXRBQUJCLmNlbnRlclBvaW50KTtcbiAgICAgIHRoaXMuX2N1cnJlbnREaXIuc2V0Q29tcG9uZW50cygwLCAwLCAtMSk7XG5cbiAgICAgIGNvbnN0IHNjZW5lQ29tcG9uZW50ID0gY2FtZXJhLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgIGlmIChJcy5leGlzdChzY2VuZUNvbXBvbmVudCkpIHtcbiAgICAgICAgY29uc3QgaW52TWF0ID0gTWF0cml4NDQuaW52ZXJ0VG8oc2NlbmVDb21wb25lbnQubWF0cml4SW5uZXIsIFdhbGtUaHJvdWdoQ2FtZXJhQ29udHJvbGxlci5fX3RtcEludk1hdCk7XG4gICAgICAgIGludk1hdC5tdWx0aXBseVZlY3RvcjNUbyh0aGlzLl9jdXJyZW50UG9zLCB0aGlzLl9jdXJyZW50UG9zKTtcbiAgICAgICAgaW52TWF0Lm11bHRpcGx5VmVjdG9yM1RvKHRoaXMuX2N1cnJlbnRDZW50ZXIsIHRoaXMuX2N1cnJlbnRDZW50ZXIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9uZWVkSW5pdGlhbGl6ZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IHQgPSB0aGlzLl9kZWx0YVkgLyA5MDtcbiAgICB0aGlzLl9uZXdEaXIueCA9IHRoaXMuX2N1cnJlbnREaXIueCAqICgxIC0gdCk7XG4gICAgdGhpcy5fbmV3RGlyLnkgPSB0O1xuICAgIHRoaXMuX25ld0Rpci56ID0gdGhpcy5fY3VycmVudERpci56ICogKDEgLSB0KTtcbiAgICB0aGlzLl9uZXdEaXIubm9ybWFsaXplKCk7XG5cbiAgICB0aGlzLl9jdXJyZW50SG9yaXpvbnRhbERpci54ID0gdGhpcy5fY3VycmVudERpci54O1xuICAgIHRoaXMuX2N1cnJlbnRIb3Jpem9udGFsRGlyLnkgPSAwO1xuICAgIHRoaXMuX2N1cnJlbnRIb3Jpem9udGFsRGlyLnogPSB0aGlzLl9jdXJyZW50RGlyLno7XG4gICAgdGhpcy5fY3VycmVudEhvcml6b250YWxEaXIubm9ybWFsaXplKCk7XG5cbiAgICBjb25zdCBtb3ZlVmVjdG9yID0gV2Fsa1Rocm91Z2hDYW1lcmFDb250cm9sbGVyLl9fdG1wX1ZlYzNfMC56ZXJvKCk7XG4gICAgc3dpdGNoICh0aGlzLl9sYXN0S2V5Q29kZSkge1xuICAgICAgY2FzZSA4NzogLy8gdyBrZXlcbiAgICAgIGNhc2UgMzg6IC8vIGFycm93IHVwcGVyIGtleVxuICAgICAgICBtb3ZlVmVjdG9yLnggPSB0aGlzLl9jdXJyZW50SG9yaXpvbnRhbERpci54ICogdGhpcy5faG9yaXpvbnRhbFNwZWVkO1xuICAgICAgICBtb3ZlVmVjdG9yLnogPSB0aGlzLl9jdXJyZW50SG9yaXpvbnRhbERpci56ICogdGhpcy5faG9yaXpvbnRhbFNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjU6IC8vIGEga2V5XG4gICAgICBjYXNlIDM3OiAvLyBhcnJvdyBsZWZ0IGtleVxuICAgICAgICBtb3ZlVmVjdG9yLnggPSB0aGlzLl9jdXJyZW50SG9yaXpvbnRhbERpci56ICogdGhpcy5faG9yaXpvbnRhbFNwZWVkO1xuICAgICAgICBtb3ZlVmVjdG9yLnogPSAtdGhpcy5fY3VycmVudEhvcml6b250YWxEaXIueCAqIHRoaXMuX2hvcml6b250YWxTcGVlZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDgzOiAvLyBzIGtleVxuICAgICAgY2FzZSA0MDogLy8gYXJyb3cgZG93biBrZXlcbiAgICAgICAgbW92ZVZlY3Rvci54ID0gLXRoaXMuX2N1cnJlbnRIb3Jpem9udGFsRGlyLnggKiB0aGlzLl9ob3Jpem9udGFsU3BlZWQ7XG4gICAgICAgIG1vdmVWZWN0b3IueiA9IC10aGlzLl9jdXJyZW50SG9yaXpvbnRhbERpci56ICogdGhpcy5faG9yaXpvbnRhbFNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjg6IC8vIGQga2V5XG4gICAgICBjYXNlIDM5OiAvLyBhcnJvdyByaWdodCBrZXlcbiAgICAgICAgbW92ZVZlY3Rvci54ID0gLXRoaXMuX2N1cnJlbnRIb3Jpem9udGFsRGlyLnogKiB0aGlzLl9ob3Jpem9udGFsU3BlZWQ7XG4gICAgICAgIG1vdmVWZWN0b3IueiA9IHRoaXMuX2N1cnJlbnRIb3Jpem9udGFsRGlyLnggKiB0aGlzLl9ob3Jpem9udGFsU3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4MTogLy8gcSBrZXlcbiAgICAgICAgbW92ZVZlY3Rvci54ID0gLXRoaXMuX25ld0Rpci54ICogdGhpcy5faG9yaXpvbnRhbFNwZWVkO1xuICAgICAgICBtb3ZlVmVjdG9yLnkgPSAtdGhpcy5fbmV3RGlyLnkgKiB0aGlzLl9ob3Jpem9udGFsU3BlZWQ7XG4gICAgICAgIG1vdmVWZWN0b3IueiA9IC10aGlzLl9uZXdEaXIueiAqIHRoaXMuX2hvcml6b250YWxTcGVlZDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDY5OiAvLyBlIGtleVxuICAgICAgICBtb3ZlVmVjdG9yLnggPSB0aGlzLl9uZXdEaXIueCAqIHRoaXMuX2hvcml6b250YWxTcGVlZDtcbiAgICAgICAgbW92ZVZlY3Rvci55ID0gdGhpcy5fbmV3RGlyLnkgKiB0aGlzLl9ob3Jpem9udGFsU3BlZWQ7XG4gICAgICAgIG1vdmVWZWN0b3IueiA9IHRoaXMuX25ld0Rpci56ICogdGhpcy5faG9yaXpvbnRhbFNwZWVkO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgODI6IC8vIHIga2V5XG4gICAgICAgIG1vdmVWZWN0b3IueSA9IHRoaXMuX3ZlcnRpY2FsU3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3MDogLy8gZiBrZXlcbiAgICAgICAgbW92ZVZlY3Rvci55ID0gLXRoaXMuX3ZlcnRpY2FsU3BlZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB0aGlzLl9jdXJyZW50UG9zLmFkZChtb3ZlVmVjdG9yKTtcbiAgICB0aGlzLl9jdXJyZW50Q2VudGVyLmFkZChtb3ZlVmVjdG9yKTtcblxuICAgIGlmICh0aGlzLl9pc01vdXNlRHJhZykge1xuICAgICAgaWYgKHRoaXMuX2ludmVyc2VIb3Jpem9udGFsUm90YXRpbmcpIHtcbiAgICAgICAgdGhpcy5fZGVsdGFYID0gdGhpcy5fZGVsdGFNb3VzZVhPbkNhbnZhcyAqIHRoaXMuX21vdXNlWEFkanVzdFNjYWxlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZGVsdGFYID0gLXRoaXMuX2RlbHRhTW91c2VYT25DYW52YXMgKiB0aGlzLl9tb3VzZVhBZGp1c3RTY2FsZTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pbnZlcnNlVmVydGljYWxSb3RhdGluZykge1xuICAgICAgICB0aGlzLl9kZWx0YVkgKz0gdGhpcy5fZGVsdGFNb3VzZVlPbkNhbnZhcyAqIHRoaXMuX21vdXNlWUFkanVzdFNjYWxlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZGVsdGFZICs9IC10aGlzLl9kZWx0YU1vdXNlWU9uQ2FudmFzICogdGhpcy5fbW91c2VZQWRqdXN0U2NhbGU7XG4gICAgICB9XG4gICAgICB0aGlzLl9kZWx0YVkgPSBNYXRoLm1heCgtMTIwLCBNYXRoLm1pbig1MCwgdGhpcy5fZGVsdGFZKSk7XG5cbiAgICAgIGNvbnN0IHJvdGF0ZU1hdHJpeCA9IFdhbGtUaHJvdWdoQ2FtZXJhQ29udHJvbGxlci5fX3RtcFJvdGF0ZU1hdC5yb3RhdGVZKE1hdGhVdGlsLmRlZ3JlZVRvUmFkaWFuKHRoaXMuX2RlbHRhWCkpO1xuICAgICAgcm90YXRlTWF0cml4Lm11bHRpcGx5VmVjdG9yVG8odGhpcy5fY3VycmVudERpciwgdGhpcy5fY3VycmVudERpcik7XG5cbiAgICAgIGNvbnN0IG5ld0V5ZVRvQ2VudGVyID0gTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhcbiAgICAgICAgdGhpcy5fY3VycmVudENlbnRlcixcbiAgICAgICAgdGhpcy5fY3VycmVudFBvcyxcbiAgICAgICAgV2Fsa1Rocm91Z2hDYW1lcmFDb250cm9sbGVyLl9fdG1wX1ZlYzNfMVxuICAgICAgKSBhcyBNdXRhYmxlVmVjdG9yMztcbiAgICAgIHJvdGF0ZU1hdHJpeC5tdWx0aXBseVZlY3RvclRvKG5ld0V5ZVRvQ2VudGVyLCBuZXdFeWVUb0NlbnRlcik7XG4gICAgICBuZXdFeWVUb0NlbnRlci54ID0gbmV3RXllVG9DZW50ZXIueCAqICgxIC0gdCk7XG4gICAgICBuZXdFeWVUb0NlbnRlci55ID0gdDtcbiAgICAgIG5ld0V5ZVRvQ2VudGVyLnogPSBuZXdFeWVUb0NlbnRlci56ICogKDEgLSB0KTtcbiAgICAgIG5ld0V5ZVRvQ2VudGVyLm5vcm1hbGl6ZSgpO1xuXG4gICAgICB0aGlzLl9jdXJyZW50Q2VudGVyLmNvcHlDb21wb25lbnRzKHRoaXMuX2N1cnJlbnRQb3MpO1xuICAgICAgdGhpcy5fY3VycmVudENlbnRlci5hZGQobmV3RXllVG9DZW50ZXIpO1xuXG4gICAgICB0aGlzLl9jbGlja2VkTW91c2VYT25DYW52YXMgPSB0aGlzLl9kcmFnZ2VkTW91c2VYT25DYW52YXM7XG4gICAgICB0aGlzLl9jbGlja2VkTW91c2VZT25DYW52YXMgPSB0aGlzLl9kcmFnZ2VkTW91c2VZT25DYW52YXM7XG4gICAgICB0aGlzLl9kZWx0YU1vdXNlWE9uQ2FudmFzID0gMDtcbiAgICAgIHRoaXMuX2RlbHRhTW91c2VZT25DYW52YXMgPSAwO1xuICAgIH1cblxuICAgIGNhbWVyYS5leWVJbm5lciA9IHRoaXMuX2N1cnJlbnRQb3M7XG4gICAgY2FtZXJhLmRpcmVjdGlvbklubmVyID0gdGhpcy5fY3VycmVudENlbnRlcjtcbiAgICBjYW1lcmEudXBJbm5lciA9IChjYW1lcmEgYXMgYW55KS5fdXA7XG4gICAgY2FtZXJhLmxlZnRJbm5lciA9IGNhbWVyYS5sZWZ0O1xuICAgIGNhbWVyYS5yaWdodElubmVyID0gY2FtZXJhLnJpZ2h0O1xuICAgIGNhbWVyYS50b3BJbm5lciA9IGNhbWVyYS50b3A7XG4gICAgY2FtZXJhLmJvdHRvbUlubmVyID0gY2FtZXJhLmJvdHRvbTtcbiAgICBjYW1lcmEuZm92eUlubmVyID0gY2FtZXJhLmZvdnk7XG5cbiAgICB0aGlzLl9jYWxjWk5lYXJJbm5lcihjYW1lcmEsIHRoaXMuX2N1cnJlbnRQb3MsIHRoaXMuX25ld0Rpcik7XG4gICAgdGhpcy5fY2FsY1pGYXJJbm5lcihjYW1lcmEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgY2FtZXJhIGRpcmVjdGlvbi5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgZGlyZWN0aW9uIHZlY3RvciBvciBudWxsIGlmIG5vdCBhdmFpbGFibGVcbiAgICovXG4gIGdldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudENlbnRlciAhPT0gbnVsbCA/IHRoaXMuX25ld0Rpci5jbG9uZSgpIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBob3Jpem9udGFsIG1vdmVtZW50IHNwZWVkLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgbmV3IGhvcml6b250YWwgc3BlZWQgdmFsdWVcbiAgICovXG4gIHNldCBob3Jpem9udGFsU3BlZWQodmFsdWUpIHtcbiAgICB0aGlzLl9ob3Jpem9udGFsU3BlZWQgPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGhvcml6b250YWwgbW92ZW1lbnQgc3BlZWQuXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IGhvcml6b250YWwgc3BlZWRcbiAgICovXG4gIGdldCBob3Jpem9udGFsU3BlZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2hvcml6b250YWxTcGVlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2ZXJ0aWNhbCBtb3ZlbWVudCBzcGVlZC5cbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIG5ldyB2ZXJ0aWNhbCBzcGVlZCB2YWx1ZVxuICAgKi9cbiAgc2V0IHZlcnRpY2FsU3BlZWQodmFsdWUpIHtcbiAgICB0aGlzLl92ZXJ0aWNhbFNwZWVkID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCB2ZXJ0aWNhbCBtb3ZlbWVudCBzcGVlZC5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdmVydGljYWwgc3BlZWRcbiAgICovXG4gIGdldCB2ZXJ0aWNhbFNwZWVkKCkge1xuICAgIHJldHVybiB0aGlzLl92ZXJ0aWNhbFNwZWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1vdXNlIHdoZWVsIHNwZWVkIHNjYWxlLlxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgbmV3IG1vdXNlIHdoZWVsIHNwZWVkIHNjYWxlXG4gICAqL1xuICBzZXQgbW91c2VXaGVlbFNwZWVkKHZhbHVlKSB7XG4gICAgdGhpcy5fbW91c2VXaGVlbFNwZWVkU2NhbGUgPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IG1vdXNlIHdoZWVsIHNwZWVkIHNjYWxlLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBtb3VzZSB3aGVlbCBzcGVlZCBzY2FsZVxuICAgKi9cbiAgZ2V0IG1vdXNlV2hlZWxTcGVlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbW91c2VXaGVlbFNwZWVkU2NhbGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIHNpbmdsZSB0YXJnZXQgZW50aXR5IGZvciB0aGUgY2FtZXJhIHRvIGZvY3VzIG9uLlxuICAgKiBAcGFyYW0gdGFyZ2V0RW50aXR5IC0gVGhlIGVudGl0eSB0byBzZXQgYXMgdGhlIHRhcmdldFxuICAgKi9cbiAgc2V0VGFyZ2V0KHRhcmdldEVudGl0eTogSVNjZW5lR3JhcGhFbnRpdHkpIHtcbiAgICB0aGlzLnNldFRhcmdldHMoW3RhcmdldEVudGl0eV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF4aXMtYWxpZ25lZCBib3VuZGluZyBib3ggZm9yIGEgdGFyZ2V0IGVudGl0eS5cbiAgICogQHBhcmFtIHRhcmdldEVudGl0eSAtIFRoZSBlbnRpdHkgdG8gZ2V0IHRoZSBBQUJCIGZvclxuICAgKiBAcmV0dXJucyBUaGUgQUFCQiBvZiB0aGUgdGFyZ2V0IGVudGl0eVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2dldFRhcmdldEFBQkIodGFyZ2V0RW50aXR5OiBJU2NlbmVHcmFwaEVudGl0eSkge1xuICAgIGlmICh0aGlzLmFhYmJXaXRoU2tlbGV0YWwpIHtcbiAgICAgIHJldHVybiB0YXJnZXRFbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCkhLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldEVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKSEud29ybGRNZXJnZWRBQUJCO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgbXVsdGlwbGUgdGFyZ2V0IGVudGl0aWVzIGZvciB0aGUgY2FtZXJhIHRvIGZvY3VzIG9uLlxuICAgKiBBdXRvbWF0aWNhbGx5IGFkanVzdHMgbW92ZW1lbnQgc3BlZWRzIGJhc2VkIG9uIHRoZSBzaXplIG9mIHRoZSB0YXJnZXRzLlxuICAgKiBAcGFyYW0gdGFyZ2V0RW50aXRpZXMgLSBBcnJheSBvZiBlbnRpdGllcyB0byBzZXQgYXMgdGFyZ2V0c1xuICAgKi9cbiAgc2V0VGFyZ2V0cyh0YXJnZXRFbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSkge1xuICAgIGNvbnN0IGFhYmIgPSBuZXcgQUFCQigpO1xuICAgIGZvciAoY29uc3QgdGFyZ2V0RW50aXR5IG9mIHRhcmdldEVudGl0aWVzKSB7XG4gICAgICBhYWJiLm1lcmdlQUFCQih0aGlzLl9fZ2V0VGFyZ2V0QUFCQih0YXJnZXRFbnRpdHkpKTtcbiAgICB9XG4gICAgY29uc3Qgc3BlZWQgPSBhYWJiLmxlbmd0aENlbnRlclRvQ29ybmVyIC8gMTA7XG4gICAgdGhpcy52ZXJ0aWNhbFNwZWVkID0gc3BlZWQ7XG4gICAgdGhpcy5ob3Jpem9udGFsU3BlZWQgPSBzcGVlZDtcblxuICAgIHRoaXMuX190YXJnZXRFbnRpdGllcyA9IHRhcmdldEVudGl0aWVzO1xuICAgIHRoaXMuX25lZWRJbml0aWFsaXplID0gdHJ1ZTtcbiAgICB0aGlzLl91cGRhdGVDb3VudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgdGFyZ2V0IGVudGl0aWVzLlxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjdXJyZW50IHRhcmdldCBlbnRpdGllc1xuICAgKi9cbiAgZ2V0VGFyZ2V0cygpOiBJU2NlbmVHcmFwaEVudGl0eVtdIHtcbiAgICByZXR1cm4gdGhpcy5fX3RhcmdldEVudGl0aWVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIGNhbWVyYSBjb250cm9sbGVyIGluZm9ybWF0aW9uIGZvciBzZXJpYWxpemF0aW9uLlxuICAgKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyBhbGwgY29udHJvbGxlciBzdGF0ZSBpbmZvcm1hdGlvblxuICAgKi9cbiAgZ2V0IGFsbEluZm8oKSB7XG4gICAgY29uc3QgaW5mbzogYW55ID0ge307XG5cbiAgICBpbmZvLnZlcnRpY2FsU3BlZWQgPSB0aGlzLnZlcnRpY2FsU3BlZWQ7XG4gICAgaW5mby5ob3Jpem9udGFsU3BlZWQgPSB0aGlzLmhvcml6b250YWxTcGVlZDtcbiAgICBpbmZvLl90dXJuU3BlZWQgPSB0aGlzLl90dXJuU3BlZWQ7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRQb3MpIHtcbiAgICAgIGluZm8uX2N1cnJlbnRQb3MgPSB0aGlzLl9jdXJyZW50UG9zLmNsb25lKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jdXJyZW50Q2VudGVyKSB7XG4gICAgICBpbmZvLl9jdXJyZW50Q2VudGVyID0gdGhpcy5fY3VycmVudENlbnRlci5jbG9uZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY3VycmVudERpcikge1xuICAgICAgaW5mby5fY3VycmVudERpciA9IHRoaXMuX2N1cnJlbnREaXIuY2xvbmUoKTtcbiAgICB9XG4gICAgaW5mby5fZGVsdGFZID0gdGhpcy5fZGVsdGFZO1xuICAgIGluZm8uX25ld0RpciA9IHRoaXMuX25ld0Rpci5jbG9uZSgpO1xuXG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhbGwgY2FtZXJhIGNvbnRyb2xsZXIgaW5mb3JtYXRpb24gZnJvbSBzZXJpYWxpemVkIGRhdGEuXG4gICAqIEBwYXJhbSBhcmcgLSBPYmplY3Qgb3IgSlNPTiBzdHJpbmcgY29udGFpbmluZyBjb250cm9sbGVyIHN0YXRlIGluZm9ybWF0aW9uXG4gICAqL1xuICBzZXQgYWxsSW5mbyhhcmcpIHtcbiAgICBsZXQganNvbiA9IGFyZztcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGpzb24gPSBKU09OLnBhcnNlKGFyZyk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIGpzb24pIHtcbiAgICAgIGlmIChPYmplY3QuaGFzT3duKGpzb24sIGtleSkgJiYga2V5IGluIHRoaXMpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJ3F1YXRlcm5pb24nKSB7XG4gICAgICAgICAgKHRoaXMgYXMgYW55KVtrZXldID0gTWF0aENsYXNzVXRpbC5jbG9uZU9mTWF0aE9iamVjdHMoTWF0aENsYXNzVXRpbC5hcnJheVRvUXVhdGVybmlvbihqc29uW2tleV0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAodGhpcyBhcyBhbnkpW2tleV0gPSBNYXRoQ2xhc3NVdGlsLmNsb25lT2ZNYXRoT2JqZWN0cyhNYXRoQ2xhc3NVdGlsLmFycmF5VG9WZWN0b3JPck1hdHJpeChqc29uW2tleV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUdBLFNBQVMsWUFBWTtBQUNyQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHNCQUFz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
