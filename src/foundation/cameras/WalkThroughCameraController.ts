import { Matrix44 } from '../math/Matrix44';
import { MathClassUtil } from '../math/MathClassUtil';
import { MiscUtil } from '../misc/MiscUtil';
import { ICameraController } from './ICameraController';
import { MutableVector3 } from '../math/MutableVector3';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { Entity } from '../core/Entity';
import { MutableMatrix33 } from '../math/MutableMatrix33';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { AbstractCameraController } from './AbstractCameraController';
import { MathUtil } from '../math/MathUtil';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Is } from '../misc/Is';
import {
  InputHandlerInfo,
  InputManager,
  INPUT_HANDLING_STATE_CAMERA_CONTROLLER,
} from '../system/InputManager';
import { AABB } from '../math/AABB';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';

type KeyboardEventListener = (evt: KeyboardEvent) => any;

/**
 * WalkThroughCameraController is a camera controller that allows the user to walk through a scene.
 *
 */
export class WalkThroughCameraController
  extends AbstractCameraController
  implements ICameraController
{
  private __updateCount = 0;
  private _horizontalSpeed: number;
  private _verticalSpeed: number;
  private _turnSpeed: number;
  private _mouseWheelSpeedScale: number;
  private _inverseVerticalRotating: boolean;
  private _inverseHorizontalRotating: boolean;
  private _onKeydown: KeyboardEventListener;
  private _isKeyDown = false;
  private _isMouseDrag = false;
  private _lastKeyCode = -1;
  private _onKeyup: KeyboardEventListener;
  private _currentDir = MutableVector3.fromCopyArray([0, 0, -1]);
  private _currentPos = MutableVector3.fromCopyArray([0, 0, 0]);
  private _currentCenter = MutableVector3.fromCopyArray([0, 0, -1]);
  private _currentHorizontalDir = MutableVector3.fromCopyArray([0, 0, -1]);
  private _newDir = MutableVector3.fromCopyArray([0, 0, -1]);
  private _isMouseDown = false;
  private _clickedMouseXOnCanvas = -1;
  private _clickedMouseYOnCanvas = -1;
  private _draggedMouseXOnCanvas = -1;
  private _draggedMouseYOnCanvas = -1;
  private _deltaMouseXOnCanvas = -1;
  private _deltaMouseYOnCanvas = -1;
  private _mouseXAdjustScale = 1;
  private _mouseYAdjustScale = 1;
  private _deltaY = -1;
  private _deltaX = -1;
  private _mouseUpBind = (this._mouseUp as any).bind(this);
  private _mouseDownBind = (this._mouseDown as any).bind(this);
  private _mouseMoveBind = (this._mouseMove as any).bind(this);
  private _mouseWheelBind = (this._mouseWheel as any).bind(this);
  private _eventTargetDom?: any;
  private __doPreventDefault = false;
  private _needInitialize = true;
  protected __targetEntities: ISceneGraphEntity[] = [];

  private static __tmpInvMat: MutableMatrix44 = MutableMatrix44.identity();
  private static __tmpRotateMat: MutableMatrix33 = MutableMatrix33.identity();
  private static __tmp_Vec3_0: MutableVector3 = MutableVector3.zero();
  private static __tmp_Vec3_1: MutableVector3 = MutableVector3.zero();

  public aabbWithSkeletal = true;
  private __cameraControllerComponent: CameraControllerComponent;

  constructor(
    cameraControllerComponent: CameraControllerComponent,
    options = {
      eventTargetDom: document,
      verticalSpeed: 1,
      horizontalSpeed: 1,
      turnSpeed: 0.25,
      mouseWheelSpeedScale: 1,
      inverseVerticalRotating: false,
      inverseHorizontalRotating: false,
    }
  ) {
    super();
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

    this._onKeyup = (e) => {
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
  private _updateCount() {
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
  registerEventListeners(eventTargetDom: Document = document) {
    this._eventTargetDom = eventTargetDom;

    const inputHandlerInfos: InputHandlerInfo[] = [
      {
        eventName: 'keydown',
        handler: this._onKeydown,
        options: {
          passive: !this.__doPreventDefault,
        },
        classInstance: this,
        eventTargetDom,
      },
      {
        eventName: 'keyup',
        handler: this._onKeyup,
        options: {
          passive: !this.__doPreventDefault,
        },
        classInstance: this,
        eventTargetDom,
      },
    ];
    if ('ontouchend' in document) {
      inputHandlerInfos.push(
        {
          eventName: 'touchstart',
          handler: this._mouseDownBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchend',
          handler: this._mouseUpBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchmove',
          handler: this._mouseMoveBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        }
      );
    }
    if ('onmouseup' in document) {
      inputHandlerInfos.push(
        {
          eventName: 'mousedown',
          handler: this._mouseDownBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'mouseup',
          handler: this._mouseUpBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'mouseleave',
          handler: this._mouseUpBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'mousemove',
          handler: this._mouseMoveBind,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        }
      );
    }
    if ('onwheel' in document) {
      inputHandlerInfos.push({
        eventName: 'wheel',
        handler: this._mouseWheelBind,
        options: {
          passive: !this.__doPreventDefault,
        },
        classInstance: this,
        eventTargetDom,
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
  private __tryToPreventDefault(evt: Event) {
    if (this.__doPreventDefault) {
      evt.preventDefault();
    }
  }

  /**
   * Handles mouse wheel events for camera movement.
   * @param e - The wheel event
   * @private
   */
  _mouseWheel(e: WheelEvent) {
    if (this._currentDir === null) {
      return;
    }
    const delta =
      -1 * Math.sign((e as any).deltaY) * this._mouseWheelSpeedScale * this._horizontalSpeed;
    const horizontalDir = WalkThroughCameraController.__tmp_Vec3_0;
    horizontalDir.setComponents(this._currentDir.x, 0, this._currentDir.z).normalize();

    const deltaVec = MutableVector3.multiplyTo(
      horizontalDir,
      delta,
      WalkThroughCameraController.__tmp_Vec3_1
    );
    this._currentPos.add(deltaVec);
    this._currentCenter.add(deltaVec);

    this._updateCount();
  }

  /**
   * Handles mouse down events.
   * @param evt - The mouse event
   * @private
   */
  _mouseDown(evt: MouseEvent) {
    this.__tryToPreventDefault(evt);
    this._isMouseDown = true;

    const rect = (evt.target! as any).getBoundingClientRect();
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
  _mouseMove(evt: MouseEvent) {
    this.__tryToPreventDefault(evt);
    if (!this._isMouseDown) {
      return;
    }

    const rect = (evt.target! as any).getBoundingClientRect();
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
  _mouseUp(evt: MouseEvent) {
    this._isMouseDown = false;
    this._isMouseDrag = false;

    const target = evt.target as any;
    if (target?.getBoundingClientRect == null) {
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
  tryReset() {}

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
  logic(cameraComponent: CameraComponent) {
    this.__updateCameraComponent(cameraComponent);
  }

  /**
   * Updates the camera component with new position, direction, and other properties.
   * @param camera - The camera component to update
   * @private
   */
  private __updateCameraComponent(camera: CameraComponent) {
    const aabb = new AABB();
    for (const targetEntity of this.__targetEntities) {
      aabb.mergeAABB(this.__getTargetAABB(targetEntity));
    }
    const targetAABB = aabb;
    if (this._needInitialize && targetAABB != null) {
      const lengthCenterToCamera =
        targetAABB.lengthCenterToCorner *
        (1.0 + 1.0 / Math.tan(MathUtil.degreeToRadian(camera.fovy / 2.0)));
      this._currentPos.copyComponents(targetAABB.centerPoint);
      this._currentPos.z += lengthCenterToCamera;

      this._currentCenter.copyComponents(targetAABB.centerPoint);
      this._currentDir.setComponents(0, 0, -1);

      const sceneComponent = camera.entity.tryToGetSceneGraph();
      if (Is.exist(sceneComponent)) {
        const invMat = Matrix44.invertTo(
          sceneComponent.matrixInner,
          WalkThroughCameraController.__tmpInvMat
        );
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

    const moveVector = WalkThroughCameraController.__tmp_Vec3_0.zero();
    switch (this._lastKeyCode) {
      case 87: // w key
      case 38: // arrow upper key
        moveVector.x = this._currentHorizontalDir.x * this._horizontalSpeed;
        moveVector.z = this._currentHorizontalDir.z * this._horizontalSpeed;
        break;
      case 65: // a key
      case 37: // arrow left key
        moveVector.x = this._currentHorizontalDir.z * this._horizontalSpeed;
        moveVector.z = -this._currentHorizontalDir.x * this._horizontalSpeed;
        break;
      case 83: // s key
      case 40: // arrow down key
        moveVector.x = -this._currentHorizontalDir.x * this._horizontalSpeed;
        moveVector.z = -this._currentHorizontalDir.z * this._horizontalSpeed;
        break;
      case 68: // d key
      case 39: // arrow right key
        moveVector.x = -this._currentHorizontalDir.z * this._horizontalSpeed;
        moveVector.z = this._currentHorizontalDir.x * this._horizontalSpeed;
        break;
      case 81: // q key
        moveVector.x = -this._newDir.x * this._horizontalSpeed;
        moveVector.y = -this._newDir.y * this._horizontalSpeed;
        moveVector.z = -this._newDir.z * this._horizontalSpeed;
        break;
      case 69: // e key
        moveVector.x = this._newDir.x * this._horizontalSpeed;
        moveVector.y = this._newDir.y * this._horizontalSpeed;
        moveVector.z = this._newDir.z * this._horizontalSpeed;
        break;
      case 82: // r key
        moveVector.y = this._verticalSpeed;
        break;
      case 70: // f key
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

      const rotateMatrix = WalkThroughCameraController.__tmpRotateMat.rotateY(
        MathUtil.degreeToRadian(this._deltaX)
      );
      rotateMatrix.multiplyVectorTo(this._currentDir, this._currentDir);

      const newEyeToCenter = MutableVector3.subtractTo(
        this._currentCenter,
        this._currentPos,
        WalkThroughCameraController.__tmp_Vec3_1
      ) as MutableVector3;
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
    camera.upInner = (camera as any)._up;
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
  setTarget(targetEntity: ISceneGraphEntity) {
    this.setTargets([targetEntity]);
  }

  /**
   * Gets the axis-aligned bounding box for a target entity.
   * @param targetEntity - The entity to get the AABB for
   * @returns The AABB of the target entity
   * @private
   */
  private __getTargetAABB(targetEntity: ISceneGraphEntity) {
    if (this.aabbWithSkeletal) {
      return targetEntity.tryToGetSceneGraph()!.worldMergedAABBWithSkeletal;
    } else {
      return targetEntity.tryToGetSceneGraph()!.worldMergedAABB;
    }
  }

  /**
   * Sets multiple target entities for the camera to focus on.
   * Automatically adjusts movement speeds based on the size of the targets.
   * @param targetEntities - Array of entities to set as targets
   */
  setTargets(targetEntities: ISceneGraphEntity[]) {
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
  getTargets(): ISceneGraphEntity[] {
    return this.__targetEntities;
  }

  /**
   * Gets all camera controller information for serialization.
   * @returns Object containing all controller state information
   */
  get allInfo() {
    const info: any = {};

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
    if (typeof arg === 'string') {
      json = JSON.parse(arg);
    }
    for (const key in json) {
      if (json.hasOwnProperty(key) && key in this) {
        if (key === 'quaternion') {
          (this as any)[key] = MathClassUtil.cloneOfMathObjects(
            MathClassUtil.arrayToQuaternion(json[key])
          );
        } else {
          (this as any)[key] = MathClassUtil.cloneOfMathObjects(
            MathClassUtil.arrayToVectorOrMatrix(json[key])
          );
        }
      }
    }
  }
}
