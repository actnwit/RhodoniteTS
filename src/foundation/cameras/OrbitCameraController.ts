import { Vector3 } from '../math/Vector3';
import { MutableVector3 } from '../math/MutableVector3';
import { MathUtil } from '../math/MathUtil';
import { CameraComponent } from '../components/Camera/CameraComponent';
import { MutableMatrix33 } from '../math/MutableMatrix33';
import { Matrix44 } from '../math/Matrix44';
import { Count, Size } from '../../types/CommonTypes';
import { ICameraController } from './ICameraController';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { AABB } from '../math/AABB';
import { AbstractCameraController } from './AbstractCameraController';
import { Is } from '../misc/Is';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { InputManager, INPUT_HANDLING_STATE_CAMERA_CONTROLLER } from '../system/InputManager';
import { Config } from '../core/Config';
import { CameraControllerComponent } from '../components/CameraController/CameraControllerComponent';

declare let window: any;

/**
 * OrbitCameraController is a camera controller that allows the user to orbit around a target.
 *
 */
export class OrbitCameraController extends AbstractCameraController implements ICameraController {
  public dollyScale = 2.0;
  public scaleOfLengthCenterToCamera = 1.0;
  public moveSpeed = 1;
  public followTargetAABB = false;
  public autoUpdate = true;

  private __updated = false;
  private __updateCount = 0;
  private __fixedLengthOfCenterToEye = 1;
  private __isMouseDown = false;
  private __lastMouseDownTimeStamp = 0;
  private __lastMouseUpTimeStamp = 0;
  private __originalY = -1;
  private __originalX = -1;
  private __buttonNumber = 0;
  private __mouse_translate_y = 0;
  private __mouse_translate_x = 0;
  private __efficiency = 1;
  private __lengthOfCenterToEye = 1;
  private __fovyBias = 1.0;
  private __scaleOfTranslation = 2.8;
  private __mouseTranslateVec = MutableVector3.zero();
  private __newEyeVec = MutableVector3.zero();
  private __newCenterVec = MutableVector3.zero();
  private __newUpVec = MutableVector3.zero();
  private __newTangentVec = MutableVector3.zero();
  // private __verticalAngleThreshold = 0;
  // private __verticalAngleOfVectors = 0;
  private __isSymmetryMode = true;
  // private __doResetWhenCameraSettingChanged = false;
  private __rot_bgn_x = 0;
  private __rot_bgn_y = 0;
  private __rot_x = 0;
  private __rot_y = 0;
  private __dolly = 0.5;
  private __eyeVec = MutableVector3.zero();
  private __centerVec = MutableVector3.zero();
  private __upVec = MutableVector3.zero();
  protected __targetEntities: ISceneGraphEntity[] = [];
  private __scaleOfZNearAndZFar = 5000;
  private __doPreventDefault = false;
  private __isPressingShift = false;
  private __isPressingCtrl = false;

  private __pinchInOutControl = false;
  private __pinchInOutOriginalDistance?: number | null = null;

  private __maximum_y?: number;
  private __minimum_y?: number;

  private __resetDollyTouchTime: Count = 0;

  private __initialTargetAABB?: AABB;

  public aabbWithSkeletal = true;
  public useInitialTargetAABBForLength = false;

  // private __controllerTranslate = MutableVector3.zero();
  private __mouseDownFunc = this.__mouseDown.bind(this);
  private __mouseUpFunc = this.__mouseUp.bind(this);
  private __mouseMoveFunc = this.__mouseMove.bind(this);
  private __touchDownFunc = this.__touchDown.bind(this);
  private __touchUpFunc = this.__touchUp.bind(this);
  private __touchMoveFunc = this.__touchMove.bind(this);
  private __pinchInOutFunc = this.__pinchInOut.bind(this);
  private __pinchInOutEndFunc = this.__pinchInOutEnd.bind(this);
  private __mouseWheelFunc = this.__mouseWheel.bind(this);
  private __mouseDblClickFunc = this.__mouseDblClick.bind(this);
  private __contextMenuFunc = this.__contextMenu.bind(this);
  private __pressShiftFunc = this.__pressShift.bind(this);
  private __releaseShiftFunc = this.__releaseShift.bind(this);
  private __pressCtrlFunc = this.__pressCtrl.bind(this);
  private __releaseCtrlFunc = this.__releaseCtrl.bind(this);

  private __resetDollyAndPositionFunc = this.__resetDollyAndPosition.bind(this);

  private static readonly __tmp_up: Vector3 = Vector3.fromCopyArray([0, 0, 1]);
  private static __tmpVec3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_2: MutableVector3 = MutableVector3.zero();

  private static __tmp_rotateM_X: MutableMatrix33 = MutableMatrix33.identity();
  private static __tmp_rotateM_Y: MutableMatrix33 = MutableMatrix33.identity();
  private static __tmp_rotateM: MutableMatrix33 = MutableMatrix33.identity();
  private static __tmp_rotateM_Reset: MutableMatrix33 = MutableMatrix33.identity();
  private static __tmp_rotateM_Revert: MutableMatrix33 = MutableMatrix33.identity();

  private static __tmpMat44_0: MutableMatrix44 = MutableMatrix44.identity();

  private __cameraControllerComponent: CameraControllerComponent;

  constructor(cameraControllerComponent: CameraControllerComponent) {
    super();
    this.registerEventListeners();
    this.__cameraControllerComponent = cameraControllerComponent;
  }

  /**
   * Gets the current update count.
   * @returns The current update count
   */
  get updateCount() {
    return this.__updateCount;
  }

  /**
   * Updates the update count and notifies the camera controller component.
   * @internal
   */
  private _updateCount() {
    this.__updateCount++;
    this.__cameraControllerComponent._updateCount(this.__updateCount);
  }

  /**
   * Resets the dolly and translation values to their default state.
   */
  resetDollyAndTranslation() {
    this.__dolly = 0.5;
    this.__mouse_translate_x = 0;
    this.__mouse_translate_y = 0;
    this.__mouseTranslateVec = MutableVector3.zero();
  }

  /**
   * Sets a single target entity for the camera to focus on.
   * @param targetEntity - The entity to set as target
   */
  setTarget(targetEntity: ISceneGraphEntity) {
    this.setTargets([targetEntity]);
  }

  /**
   * Sets multiple target entities for the camera to focus on.
   * @param targetEntities - Array of entities to set as targets
   */
  setTargets(targetEntities: ISceneGraphEntity[]) {
    this.__targetEntities = targetEntities;
    this.__initialTargetAABB = undefined;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Gets the current target entities.
   * @returns Array of target entities
   */
  getTargets(): ISceneGraphEntity[] {
    return this.__targetEntities;
  }

  /**
   * Sets whether to prevent default behavior on events.
   * @param flag - True to prevent default, false otherwise
   */
  set doPreventDefault(flag: boolean) {
    this.__doPreventDefault = flag;
  }

  /**
   * Gets whether default behavior is prevented on events.
   * @returns True if default is prevented, false otherwise
   */
  get doPreventDefault() {
    return this.__doPreventDefault;
  }

  /**
   * Handles mouse down events.
   * @param e - The mouse event
   * @internal
   */
  __mouseDown(e: MouseEvent) {
    this.__tryToPreventDefault(e);
    // if (this.isMouseDown) return;
    if (this.__isPressingCtrl) return;

    this.__originalX = e.clientX;
    this.__originalY = e.clientY;
    this.__rot_bgn_x = this.__rot_x;
    this.__rot_bgn_y = this.__rot_y;

    this.__isMouseDown = true;
    this.__lastMouseDownTimeStamp = e.timeStamp;

    // console.log('original', this.__originalX, this.__originalY);

    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles mouse move events for camera control.
   * @param e - The mouse event
   * @internal
   */
  __mouseMove(e: MouseEvent) {
    this.__tryToPreventDefault(e);
    if (Is.false(this.isMouseDown)) return;
    if (this.__isPressingCtrl) return;

    if (this.__buttonNumber === 0) {
      this.__buttonNumber = e.buttons;
    }

    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;
    // console.log('currentMouse: ', currentMouseX, currentMouseY);
    switch (this.__buttonNumber) {
      case 1: // left
        if (this.__isPressingShift) {
          this.__parallelTranslateControl(
            this.__originalX,
            this.__originalY,
            currentMouseX,
            currentMouseY
          );
        } else {
          this.__rotateControl(this.__originalX, this.__originalY, currentMouseX, currentMouseY);
          this.__rot_bgn_x = this.__rot_x;
          this.__rot_bgn_y = this.__rot_y;
        }
        break;
      case 2: // right
        this.__zoomControl(this.__originalX, currentMouseX);
        break;
      case 4: // center
        this.__parallelTranslateControl(
          this.__originalX,
          this.__originalY,
          currentMouseX,
          currentMouseY
        );
        break;
      default:
        return;
    }
    this.__originalX = currentMouseX;
    this.__originalY = currentMouseY;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles mouse up events.
   * @param e - The mouse event
   * @internal
   */
  __mouseUp(e: MouseEvent) {
    this.__buttonNumber = 0;
    this.__originalX = -1;
    this.__originalY = -1;

    this.__isMouseDown = false;
    this.__lastMouseUpTimeStamp = e.timeStamp;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles touch down events.
   * @param e - The touch event
   * @internal
   */
  __touchDown(e: TouchEvent) {
    this.__tryToPreventDefault(e);

    if (e.touches.length === 1) {
      this.__originalX = e.touches[0].clientX;
      this.__originalY = e.touches[0].clientY;
      this.__rot_bgn_x = this.__rot_x;
      this.__rot_bgn_y = this.__rot_y;
    } else {
      this.__originalX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      this.__originalY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
    }

    this.__isMouseDown = true;
    this.__lastMouseDownTimeStamp = e.timeStamp;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles touch move events for camera control.
   * @param e - The touch event
   * @internal
   */
  __touchMove(e: TouchEvent) {
    this.__tryToPreventDefault(e);
    if (Is.false(this.isMouseDown)) return;

    let currentTouchX = e.touches[0].clientX;
    let currentTouchY = e.touches[0].clientY;
    if (e.touches.length === 1) {
      currentTouchX = e.touches[0].clientX;
      currentTouchY = e.touches[0].clientY;
      this.__rotateControl(this.__originalX, this.__originalY, currentTouchX, currentTouchY);
      this.__rot_bgn_x = this.__rot_x;
      this.__rot_bgn_y = this.__rot_y;
    } else {
      currentTouchX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      currentTouchY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;

      this.__parallelTranslateControl(
        this.__originalX,
        this.__originalY,
        currentTouchX,
        currentTouchY
      );
    }
    this.__originalX = currentTouchX;
    this.__originalY = currentTouchY;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles touch up events.
   * @param e - The touch event
   * @internal
   */
  __touchUp(e: TouchEvent) {
    const touchNumber = e.touches.length;
    if (touchNumber === 0) {
      this.__originalX = -1;
      this.__originalY = -1;
    } else if (touchNumber === 1) {
      this.__originalX = e.touches[0].clientX;
      this.__originalY = e.touches[0].clientY;
      this.__rot_bgn_x = this.__rot_x;
      this.__rot_bgn_y = this.__rot_y;
    } else {
      this.__originalX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      this.__originalY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
    }
    this.__isMouseDown = false;
    this.__lastMouseUpTimeStamp = e.timeStamp;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Sets the X-axis rotation value.
   * @param value - The rotation value in degrees
   */
  set rotX(value: number) {
    this.__rot_x = value;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Gets the X-axis rotation value.
   * @returns The rotation value in degrees
   */
  get rotX() {
    return this.__rot_x;
  }

  /**
   * Sets the Y-axis rotation value.
   * @param value - The rotation value in degrees
   */
  set rotY(value: number) {
    this.__rot_y = value;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Gets the Y-axis rotation value.
   * @returns The rotation value in degrees
   */
  get rotY() {
    return this.__rot_y;
  }

  /**
   * Sets the maximum Y rotation angle limit.
   * @param maximum_y - The maximum Y rotation angle
   */
  set maximumY(maximum_y: number) {
    this.__maximum_y = maximum_y;
  }

  /**
   * Sets the minimum Y rotation angle limit.
   * @param minimum_y - The minimum Y rotation angle
   */
  set minimumY(minimum_y: number) {
    this.__minimum_y = minimum_y;
  }

  /**
   * Controls rotation based on mouse/touch movement.
   * @param originalX - Original X position
   * @param originalY - Original Y position
   * @param currentX - Current X position
   * @param currentY - Current Y position
   * @internal
   */
  __rotateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size) {
    // calc rotation angle
    const delta_x = (currentX - originalX) * this.__efficiency * 0.3;
    const delta_y = (currentY - originalY) * this.__efficiency * 0.3;
    this.__rot_x = this.__rot_bgn_x - delta_x;
    this.__rot_y = this.__rot_bgn_y - delta_y;

    // check if rotation angle is within range
    // if (
    //   this.__verticalAngleThreshold - this.__verticalAngleOfVectors < this.__rot_y
    // ) {
    //          this._rot_y -= this._rot_y - (this._verticalAngleThreshold - this._verticalAngleOfVectors);
    // }

    // if (
    //   this.__rot_y < -this.__verticalAngleThreshold + this.__verticalAngleOfVectors
    // ) {
    //         this._rot_y += this._rot_y - (this._verticalAngleThreshold - this._verticalAngleOfVectors);
    // }

    if (this.__maximum_y != null && this.__rot_y > this.__maximum_y) {
      this.__rot_y = this.__maximum_y;
    }
    if (this.__minimum_y != null && this.__rot_y < this.__minimum_y) {
      this.__rot_y = this.__minimum_y;
    }
  }

  /**
   * Controls zoom/dolly based on mouse movement.
   * @param originalValue - Original position value
   * @param currentValue - Current position value
   * @internal
   */
  __zoomControl(originalValue: Size, currentValue: Size) {
    this.dolly -= ((currentValue - originalValue) / 1000) * this.__efficiency;
  }

  /**
   * Controls parallel translation based on mouse/touch movement.
   * @param originalX - Original X position
   * @param originalY - Original Y position
   * @param currentX - Current X position
   * @param currentY - Current Y position
   * @internal
   */
  __parallelTranslateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size) {
    this.__mouse_translate_y = ((currentY - originalY) / 1000) * this.__efficiency;
    this.__mouse_translate_x = ((currentX - originalX) / 1000) * this.__efficiency;

    const scale = this.__lengthOfCenterToEye * this.__fovyBias * this.__scaleOfTranslation;

    const upDirTranslateVec = OrbitCameraController.__tmpVec3_0;
    upDirTranslateVec
      .copyComponents(this.__newUpVec)
      .normalize()
      .multiply(this.__mouse_translate_y)
      .multiply(scale);

    const tangentDirTranslateVec = OrbitCameraController.__tmpVec3_1;
    tangentDirTranslateVec
      .copyComponents(this.__newTangentVec)
      .normalize()
      .multiply(this.__mouse_translate_x)
      .multiply(scale);

    this.__mouseTranslateVec.add(upDirTranslateVec).add(tangentDirTranslateVec);
  }

  /**
   * Calculates the distance between two touch points.
   * @param e - The touch event
   * @returns The distance between touch points
   * @internal
   */
  __getTouchesDistance(e: TouchEvent) {
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
  __pinchInOut(e: TouchEvent) {
    if (e.touches.length < 2) return;

    if (this.__pinchInOutOriginalDistance == null) {
      this.__pinchInOutOriginalDistance = this.__getTouchesDistance(e);
      return;
    }

    const currentDistance = this.__getTouchesDistance(e);
    const originalDistance = this.__pinchInOutOriginalDistance;
    if (!this.__pinchInOutControl) {
      if (Math.abs(currentDistance - originalDistance) > 35.0) {
        this.__pinchInOutOriginalDistance = currentDistance;
        this.__pinchInOutControl = true;
      }
      return;
    }

    const ratio = originalDistance / currentDistance;
    this.dolly *= Math.pow(ratio * this.__efficiency, 2.2 / 15.0);

    this.__pinchInOutOriginalDistance = currentDistance;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles the end of pinch in/out gestures.
   * @param e - The touch event
   * @internal
   */
  __pinchInOutEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      this.__pinchInOutControl = false;
      this.__pinchInOutOriginalDistance = null;
    }
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Tries to prevent default behavior if configured to do so.
   * @param evt - The event to prevent default on
   * @internal
   */
  private __tryToPreventDefault(evt: Event) {
    if (this.__doPreventDefault) {
      evt.preventDefault();
    }
  }

  /**
   * Handles mouse wheel events for zoom control.
   * @param evt - The wheel event
   * @internal
   */
  __mouseWheel(evt: WheelEvent) {
    this.__tryToPreventDefault(evt);
    this.dolly += Math.sign(evt.deltaY) / 200;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Handles context menu events.
   * @param evt - The context menu event
   * @internal
   */
  __contextMenu(evt: Event) {
    this.__tryToPreventDefault(evt);
  }

  /**
   * Sets the dolly (zoom) value with gamma correction.
   * @param value - The dolly value (0-1)
   */
  set dolly(value) {
    value = Math.min(value, 1);
    value = Math.max(value, 0.0001);
    let gamma = Math.pow(value, 5);
    gamma = Math.max(gamma, 0.0001);
    this.__dolly = gamma;
  }

  /**
   * Gets the dolly (zoom) value with gamma correction.
   * @returns The dolly value (0-1)
   */
  get dolly() {
    return Math.pow(this.__dolly, 1 / 5);
  }

  /**
   * Handles mouse double-click events for resetting camera state.
   * @param evt - The mouse event
   * @internal
   */
  __mouseDblClick(evt: MouseEvent) {
    if (evt.shiftKey) {
      this.__mouseTranslateVec.zero();
    } else if (evt.ctrlKey) {
      this.__rot_y = 0;
      this.__rot_x = 0;
      this.__rot_bgn_y = 0;
      this.__rot_bgn_x = 0;
    }
  }

  /**
   * Resets dolly and position on double tap for touch devices.
   * @param e - The touch event
   * @internal
   */
  __resetDollyAndPosition(e: TouchEvent) {
    if (e.touches.length > 1) return;

    const currentTime = new Date().getTime();
    if (currentTime - this.__resetDollyTouchTime < 300) {
      this.dolly = Math.pow(0.5, 1.0 / 2.2);
      this.__mouseTranslateVec.zero();
      this.__rot_x = 0;
      this.__rot_y = 0;
    } else {
      this.__resetDollyTouchTime = currentTime;
    }
  }

  /**
   * Handles shift key press events.
   * @param e - The keyboard event
   * @internal
   */
  __pressShift(e: KeyboardEvent) {
    if (e.shiftKey === true) {
      this.__isPressingShift = true;
    }
  }

  /**
   * Handles shift key release events.
   * @param e - The keyboard event
   * @internal
   */
  __releaseShift(e: KeyboardEvent) {
    if (e.shiftKey === false) {
      this.__isPressingShift = false;
    }
  }

  /**
   * Handles ctrl key press events.
   * @param e - The keyboard event
   * @internal
   */
  __pressCtrl(e: KeyboardEvent) {
    if (e.ctrlKey === true) {
      this.__isPressingCtrl = true;
    }
  }

  /**
   * Handles ctrl key release events.
   * @param e - The keyboard event
   * @internal
   */
  __releaseCtrl(e: KeyboardEvent) {
    if (e.ctrlKey === false) {
      this.__isPressingCtrl = false;
    }
  }

  /**
   * Registers event listeners for mouse, touch, and keyboard events.
   */
  registerEventListeners() {
    let eventTargetDom = window;
    if (Is.exist(Config.eventTargetDom)) {
      eventTargetDom = Config.eventTargetDom;
    }

    if ('ontouchend' in document) {
      // touch devices
      InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, [
        {
          eventName: 'touchstart',
          handler: this.__touchDownFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchmove',
          handler: this.__touchMoveFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchend',
          handler: this.__touchUpFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchmove',
          handler: this.__pinchInOutFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchend',
          handler: this.__pinchInOutEndFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'touchstart',
          handler: this.__resetDollyAndPositionFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'contextmenu',
          handler: this.__contextMenuFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'dblclick',
          handler: this.__mouseDblClickFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
      ]);
    } else {
      // pc devices
      InputManager.register(INPUT_HANDLING_STATE_CAMERA_CONTROLLER, [
        {
          eventName: 'mousedown',
          handler: this.__mouseDownFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'mouseup',
          handler: this.__mouseUpFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'mouseleave',
          handler: this.__mouseUpFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'mousemove',
          handler: this.__mouseMoveFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'keydown',
          handler: this.__pressShiftFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'keyup',
          handler: this.__releaseShiftFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'keydown',
          handler: this.__pressCtrlFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'keyup',
          handler: this.__releaseCtrlFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'contextmenu',
          handler: this.__contextMenuFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'wheel',
          handler: this.__mouseWheelFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
        {
          eventName: 'dblclick',
          handler: this.__mouseDblClickFunc,
          options: {
            passive: !this.__doPreventDefault,
          },
          classInstance: this,
          eventTargetDom,
        },
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
  __getFovyFromCamera(camera: CameraComponent) {
    if (camera.fovy) {
      return camera.fovy;
    } else {
      return MathUtil.radianToDegree(
        2 * Math.atan(Math.abs(camera.top - camera.bottom) / (2 * camera.zNear))
      );
    }
  }

  /**
   * Main logic method that updates the camera based on controller state.
   * @param cameraComponent - The camera component to update
   */
  logic(cameraComponent: CameraComponent) {
    if (!this.__updated || this.autoUpdate) {
      this.__updateTargeting(cameraComponent);
      this.__calculateInfluenceOfController();
      this.__updateCameraComponent(cameraComponent);
      this.__updated = true;
    }
  }

  /**
   * Gets the target AABB (Axis-Aligned Bounding Box) for a target entity.
   * @param targetEntity - The target entity
   * @returns The AABB of the target entity
   * @internal
   */
  private __getTargetAABB(targetEntity: ISceneGraphEntity) {
    if (this.aabbWithSkeletal) {
      return targetEntity.tryToGetSceneGraph()!.worldMergedAABBWithSkeletal;
    } else {
      return targetEntity.tryToGetSceneGraph()!.worldMergedAABB;
    }
  }

  /**
   * update center, eye and up vectors of OrbitCameraController
   * @internal
   */
  __updateTargeting(camera: CameraComponent) {
    const eyeVec = camera.eye;
    const centerVec = (camera as any)._direction as Vector3;
    const upVec = (camera as any)._up as Vector3;

    const newEyeVec = this.__eyeVec;
    const newCenterVec = this.__centerVec;
    const newUpVec = this.__upVec.copyComponents(upVec);

    if (this.__targetEntities.length === 0) {
      newEyeVec.copyComponents(eyeVec);
      newCenterVec.copyComponents(centerVec);
    } else {
      if (this.__initialTargetAABB == null) {
        const aabb = new AABB();
        for (const targetEntity of this.__targetEntities) {
          aabb.mergeAABB(this.__getTargetAABB(targetEntity));
        }
        this.__initialTargetAABB = aabb.clone();
      }

      // calc newCenterVec
      let aabbToUse = this.__initialTargetAABB!;
      if (this.followTargetAABB) {
        const aabb = new AABB();
        for (const targetEntity of this.__targetEntities) {
          aabb.mergeAABB(this.__getTargetAABB(targetEntity));
        }
        aabbToUse = aabb;
      }
      newCenterVec.copyComponents(aabbToUse.centerPoint);
      // calc newEyeVec
      const centerToCameraVec = MutableVector3.subtractTo(
        eyeVec,
        centerVec,
        newEyeVec
      ) as MutableVector3;
      const centerToCameraVecNormalized = centerToCameraVec.normalize();
      const lengthCenterToCorner = this.useInitialTargetAABBForLength
        ? this.__initialTargetAABB.lengthCenterToCorner
        : aabbToUse.lengthCenterToCorner;
      let lengthCenterToCamera =
        lengthCenterToCorner *
        (1.0 + 1.0 / Math.tan(MathUtil.degreeToRadian(camera.fovy / 2.0))) *
        this.scaleOfLengthCenterToCamera;
      if (Math.abs(lengthCenterToCamera) < 0.00001) {
        lengthCenterToCamera = 1;
      }
      centerToCameraVecNormalized.multiply(lengthCenterToCamera).add(newCenterVec);

      const sg = camera.entity.tryToGetSceneGraph();
      if (sg != null) {
        const invMat = Matrix44.invertTo(sg.matrixInner, OrbitCameraController.__tmpMat44_0);

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
  __calculateInfluenceOfController() {
    const centerToEyeVec = MutableVector3.subtractTo(
      this.__eyeVec,
      this.__centerVec,
      OrbitCameraController.__tmpVec3_0
    );

    centerToEyeVec.multiply(this.__dolly * this.dollyScale);
    this.__lengthOfCenterToEye = centerToEyeVec.length();

    const newUpVec = this.__newUpVec;
    const newEyeVec = this.__newEyeVec;
    const newCenterVec = this.__newCenterVec;
    const newTangentVec = this.__newTangentVec;

    if (this.__isSymmetryMode) {
      const projectedCenterToEyeVec = OrbitCameraController.__tmpVec3_1;
      projectedCenterToEyeVec.setComponents(centerToEyeVec.x, 0, centerToEyeVec.z);

      let horizontalAngleOfVectors = Vector3.angleOfVectors(
        projectedCenterToEyeVec,
        OrbitCameraController.__tmp_up
      );
      const horizontalSign = Math.sign(
        projectedCenterToEyeVec.cross(OrbitCameraController.__tmp_up).y
      );
      horizontalAngleOfVectors *= horizontalSign;

      const rotateM_X = OrbitCameraController.__tmp_rotateM_X;
      const rotateM_Y = OrbitCameraController.__tmp_rotateM_Y;
      const rotateM_Reset = OrbitCameraController.__tmp_rotateM_Reset;
      const rotateM_Revert = OrbitCameraController.__tmp_rotateM_Revert;

      rotateM_X.rotateX(MathUtil.degreeToRadian(this.__rot_y));
      rotateM_Y.rotateY(MathUtil.degreeToRadian(this.__rot_x));
      rotateM_Reset.rotateY(MathUtil.degreeToRadian(horizontalAngleOfVectors));
      rotateM_Revert.rotateY(MathUtil.degreeToRadian(-horizontalAngleOfVectors));

      const rotateM = OrbitCameraController.__tmp_rotateM;
      MutableMatrix33.multiplyTo(rotateM_X, rotateM_Reset, rotateM);
      rotateM.multiplyByLeft(rotateM_Y);
      rotateM.multiplyByLeft(rotateM_Revert);

      rotateM.multiplyVectorTo(this.__upVec, newUpVec);
      rotateM.multiplyVectorTo(centerToEyeVec, newEyeVec).add(this.__centerVec);
      newCenterVec.copyComponents(this.__centerVec);

      const newEyeToCenterVec = OrbitCameraController.__tmpVec3_2;
      MutableVector3.subtractTo(newCenterVec, newEyeVec, newEyeToCenterVec);
      MutableVector3.crossTo(newUpVec, newEyeToCenterVec, newTangentVec);

      newEyeVec.add(this.__mouseTranslateVec);
      newCenterVec.add(this.__mouseTranslateVec);

      // const horizonResetVec = OrbitCameraController.__tmpVec3_2;
      // rotateM_Reset.multiplyVectorTo(centerToEyeVec, horizonResetVec);

      // this.__verticalAngleOfVectors = Vector3.angleOfVectors(horizonResetVec, OrbitCameraController.__tmp_up);
      // const verticalSign = Math.sign(Vector3.crossTo(horizonResetVec, OrbitCameraController.__tmp_up, OrbitCameraController.__tmp_verticalSign).x);

      //this._verticalAngleOfVectors *= verticalSign;
    } else {
      const rotateM_X = OrbitCameraController.__tmp_rotateM_X;
      const rotateM_Y = OrbitCameraController.__tmp_rotateM_Y;

      rotateM_X.rotateX(MathUtil.degreeToRadian(this.__rot_y));
      rotateM_Y.rotateY(MathUtil.degreeToRadian(this.__rot_x));

      const rotateM = MutableMatrix33.multiplyTo(
        rotateM_Y,
        rotateM_X,
        OrbitCameraController.__tmp_rotateM
      );

      rotateM.multiplyVectorTo(this.__upVec, newUpVec);
      rotateM.multiplyVectorTo(centerToEyeVec, newEyeVec).add(this.__centerVec);
      newCenterVec.copyComponents(this.__centerVec);

      const newEyeToCenterVec = OrbitCameraController.__tmpVec3_1;
      MutableVector3.subtractTo(newCenterVec, newEyeVec, newEyeToCenterVec);
      MutableVector3.crossTo(newUpVec, newEyeToCenterVec, newTangentVec);

      newEyeVec.add(this.__mouseTranslateVec);
      newCenterVec.add(this.__mouseTranslateVec);
    }
  }

  /**
   * Updates the camera component with new calculated values.
   * @param camera - The camera component to update
   * @internal
   */
  __updateCameraComponent(camera: CameraComponent) {
    const eyeDirection = OrbitCameraController.__tmpVec3_0.copyComponents(this.__newCenterVec);
    eyeDirection.subtract(this.__newEyeVec).normalize();
    this._calcZNearInner(camera, this.__newEyeVec, eyeDirection);
    this._calcZFarInner(camera);

    const ratio = camera.zFar / camera.zNear;
    const minRatio = this.__scaleOfZNearAndZFar;
    const scale = ratio / minRatio;

    const newLeft = camera.left + scale;
    const newRight = camera.right + scale;
    const newTop = camera.top + scale;
    const newBottom = camera.bottom + scale;

    const fovy = this.__getFovyFromCamera(camera);
    this.__fovyBias = Math.tan(MathUtil.degreeToRadian(fovy / 2.0));

    camera.eyeInner = this.__newEyeVec;
    camera.directionInner = this.__newCenterVec;
    camera.upInner = this.__newUpVec;
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
  set scaleOfZNearAndZFar(value: number) {
    this.__scaleOfZNearAndZFar = value;
    this.__updated = false;
    this._updateCount();
  }

  /**
   * Gets the scale factor for zNear and zFar calculations.
   * @returns The scale factor
   */
  get scaleOfZNearAndZFar() {
    return this.__scaleOfZNearAndZFar;
  }

  /**
   * Gets whether the mouse is currently pressed down.
   * @returns True if mouse is down, false otherwise
   */
  get isMouseDown(): boolean {
    return this.__isMouseDown;
  }

  /**
   * Gets the timestamp of the last mouse down event.
   * @returns The timestamp in milliseconds
   */
  get lastMouseDownTimeStamp(): number {
    return this.__lastMouseDownTimeStamp;
  }

  /**
   * Gets the timestamp of the last mouse up event.
   * @returns The timestamp in milliseconds
   */
  get lastMouseUpTimeStamp(): number {
    return this.__lastMouseUpTimeStamp;
  }
}
