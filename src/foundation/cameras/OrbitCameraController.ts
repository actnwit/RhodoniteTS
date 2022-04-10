import { Vector3 } from '../math/Vector3';
import MutableVector3 from '../math/MutableVector3';
import {MathUtil} from '../math/MathUtil';
import CameraComponent from '../components/Camera/CameraComponent';
import MutableMatrix33 from '../math/MutableMatrix33';
import Matrix44 from '../math/Matrix44';
import {Count, Size} from '../../types/CommonTypes';
import ICameraController from './ICameraController';
import MutableMatrix44 from '../math/MutableMatrix44';
import AABB from '../math/AABB';
import AbstractCameraController from './AbstractCameraController';
import {Is} from '../misc/Is';
import {ISceneGraphEntity} from '../helpers/EntityHelper';
import {
  InputManager,
  INPUT_HANDLING_STATE_CAMERACONTROLLER,
} from '../system/InputManager';
import Config from '../core/Config';

declare let window: any;

export default class OrbitCameraController
  extends AbstractCameraController
  implements ICameraController
{
  public dollyScale = 2.0;
  public scaleOfLengthCenterToCamera = 1.0;
  public moveSpeed = 1;
  public followTargetAABB = false;

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
  protected __targetEntity?: ISceneGraphEntity;
  private __scaleOfZNearAndZFar = 5000;
  private __doPreventDefault = false;
  private __isPressingShift = false;
  private __isPressingCtrl = false;

  private __pinchInOutControl = false;
  private __pinchInOutOriginalDistance?: number | null = null;

  private __maximum_y?: number;
  private __minimum_y?: number;

  private __resetDollyTouchTime: Count = 0;

  private __originalTargetAABB?: AABB;

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
  private static __tmp_rotateM_Reset: MutableMatrix33 =
    MutableMatrix33.identity();
  private static __tmp_rotateM_Revert: MutableMatrix33 =
    MutableMatrix33.identity();

  private static __tmpMat44_0: MutableMatrix44 = MutableMatrix44.identity();

  constructor() {
    super();
    this.registerEventListeners();
  }

  setTarget(targetEntity: ISceneGraphEntity) {
    this.__targetEntity = targetEntity;
    this.__originalTargetAABB = undefined;
  }

  getTarget(): ISceneGraphEntity | undefined {
    return this.__targetEntity;
  }

  set doPreventDefault(flag: boolean) {
    this.__doPreventDefault = flag;
  }

  get doPreventDefault() {
    return this.__doPreventDefault;
  }

  __mouseDown(e: MouseEvent) {
    this.__tryToPreventDefault(e);
    if (this.isMouseDown) return;
    if (this.__isPressingCtrl) return;

    this.__originalX = e.clientX;
    this.__originalY = e.clientY;
    this.__rot_bgn_x = this.__rot_x;
    this.__rot_bgn_y = this.__rot_y;

    this.__isMouseDown = true;
    this.__lastMouseDownTimeStamp = e.timeStamp;
  }

  __mouseMove(e: MouseEvent) {
    this.__tryToPreventDefault(e);
    if (Is.false(this.isMouseDown)) return;
    if (this.__isPressingCtrl) return;

    if (this.__buttonNumber === 0) {
      this.__buttonNumber = e.buttons;
    }

    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;
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
          this.__rotateControl(
            this.__originalX,
            this.__originalY,
            currentMouseX,
            currentMouseY
          );
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
  }

  __mouseUp(e: MouseEvent) {
    this.__buttonNumber = 0;
    this.__originalX = -1;
    this.__originalY = -1;

    this.__isMouseDown = false;
    this.__lastMouseUpTimeStamp = e.timeStamp;
  }

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
  }

  __touchMove(e: TouchEvent) {
    this.__tryToPreventDefault(e);
    if (Is.false(this.isMouseDown)) return;

    let currentTouchX = e.touches[0].clientX;
    let currentTouchY = e.touches[0].clientY;
    if (e.touches.length === 1) {
      currentTouchX = e.touches[0].clientX;
      currentTouchY = e.touches[0].clientY;
      this.__rotateControl(
        this.__originalX,
        this.__originalY,
        currentTouchX,
        currentTouchY
      );
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
  }

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
  }

  set rotX(value: number) {
    this.__rot_x = value;
  }

  get rotX() {
    return this.__rot_x;
  }

  set rotY(value: number) {
    this.__rot_y = value;
  }

  get rotY() {
    return this.__rot_y;
  }

  set maximumY(maximum_y: number) {
    this.__maximum_y = maximum_y;
  }
  set minimumY(minimum_y: number) {
    this.__minimum_y = minimum_y;
  }

  __rotateControl(
    originalX: Size,
    originalY: Size,
    currentX: Size,
    currentY: Size
  ) {
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

  __zoomControl(originalValue: Size, currentValue: Size) {
    this.dolly -= ((currentValue - originalValue) / 1000) * this.__efficiency;
  }

  __parallelTranslateControl(
    originalX: Size,
    originalY: Size,
    currentX: Size,
    currentY: Size
  ) {
    this.__mouse_translate_y =
      ((currentY - originalY) / 1000) * this.__efficiency;
    this.__mouse_translate_x =
      ((currentX - originalX) / 1000) * this.__efficiency;

    const scale =
      this.__lengthOfCenterToEye * this.__fovyBias * this.__scaleOfTranslation;

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

  __getTouchesDistance(e: TouchEvent) {
    const touches = e.touches;

    const diffX = touches[1].clientX - touches[0].clientX;
    const diffY = touches[1].clientY - touches[0].clientY;

    return Math.hypot(diffX, diffY);
  }

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
  }

  __pinchInOutEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      this.__pinchInOutControl = false;
      this.__pinchInOutOriginalDistance = null;
    }
  }

  private __tryToPreventDefault(evt: Event) {
    if (this.__doPreventDefault) {
      evt.preventDefault();
    }
  }

  __mouseWheel(evt: WheelEvent) {
    this.__tryToPreventDefault(evt);
    this.dolly += Math.sign(evt.deltaY) / 200;
  }

  __contextMenu(evt: Event) {
    this.__tryToPreventDefault(evt);
  }

  set dolly(value) {
    value = Math.min(value, 1);
    value = Math.max(value, 0.0001);
    let gamma = Math.pow(value, 5);
    gamma = Math.max(gamma, 0.0001);
    this.__dolly = gamma;
  }

  get dolly() {
    return Math.pow(this.__dolly, 1 / 5);
  }

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

  __pressShift(e: KeyboardEvent) {
    if (e.shiftKey === true) {
      this.__isPressingShift = true;
    }
  }

  __releaseShift(e: KeyboardEvent) {
    if (e.shiftKey === false) {
      this.__isPressingShift = false;
    }
  }

  __pressCtrl(e: KeyboardEvent) {
    if (e.ctrlKey === true) {
      this.__isPressingCtrl = true;
    }
  }

  __releaseCtrl(e: KeyboardEvent) {
    if (e.ctrlKey === false) {
      this.__isPressingCtrl = false;
    }
  }

  registerEventListeners() {
    let eventTargetDom = window;
    if (Is.exist(Config.eventTargetDom)) {
      eventTargetDom = Config.eventTargetDom;
    }

    if ('ontouchend' in document) {
      // touch devices
      InputManager.register(INPUT_HANDLING_STATE_CAMERACONTROLLER, [
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
      InputManager.register(INPUT_HANDLING_STATE_CAMERACONTROLLER, [
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

  unregisterEventListeners() {
    InputManager.unregister(INPUT_HANDLING_STATE_CAMERACONTROLLER);
  }

  __getFovyFromCamera(camera: CameraComponent) {
    if (camera.fovy) {
      return camera.fovy;
    } else {
      return MathUtil.radianToDegree(
        2 * Math.atan(Math.abs(camera.top - camera.bottom) / (2 * camera.zNear))
      );
    }
  }

  logic(cameraComponent: CameraComponent) {
    this.__updateTargeting(cameraComponent);
    this.__calculateInfluenceOfController();
    this.__updateCameraComponent(cameraComponent);
  }

  /**
   * @private update center, eye and up vectors of OrbitCameraController
   */
  __updateTargeting(camera: CameraComponent) {
    const eyeVec = camera.eye;
    const centerVec = (camera as any)._direction as Vector3;
    const upVec = (camera as any)._up as Vector3;

    const newEyeVec = this.__eyeVec;
    const newCenterVec = this.__centerVec;
    const newUpVec = this.__upVec.copyComponents(upVec);

    if (this.__targetEntity == null) {
      newEyeVec.copyComponents(eyeVec);
      newCenterVec.copyComponents(centerVec);
    } else {
      if (this.__originalTargetAABB == null) {
        const targetAABB = this.__targetEntity.tryToGetSceneGraph()!.worldAABB;
        this.__originalTargetAABB = targetAABB.clone();
      }

      // calc newCenterVec
      if (this.followTargetAABB) {
        const targetAABB = this.__targetEntity.tryToGetSceneGraph()!.worldAABB;
        newCenterVec.copyComponents(targetAABB.centerPoint);
      } else {
        newCenterVec.copyComponents(this.__originalTargetAABB.centerPoint);
      }

      // calc newEyeVec
      const centerToCameraVec = MutableVector3.subtractTo(
        eyeVec,
        centerVec,
        newEyeVec
      ) as MutableVector3;
      const centerToCameraVecNormalized = centerToCameraVec.normalize();
      let lengthCenterToCamera =
        this.__originalTargetAABB.lengthCenterToCorner *
        (1.0 + 1.0 / Math.tan(MathUtil.degreeToRadian(camera.fovy / 2.0))) *
        this.scaleOfLengthCenterToCamera;
      if (Math.abs(lengthCenterToCamera) < 0.00001) {
        lengthCenterToCamera = 1;
      }
      centerToCameraVecNormalized
        .multiply(lengthCenterToCamera)
        .add(newCenterVec);

      const sg = camera.entity.tryToGetSceneGraph();
      if (sg != null) {
        const invMat = Matrix44.invertTo(
          sg.worldMatrixInner,
          OrbitCameraController.__tmpMat44_0
        );

        invMat.multiplyVector3To(newCenterVec, newCenterVec);
        invMat.multiplyVector3To(newEyeVec, newEyeVec);
        invMat.multiplyVector3To(newUpVec, newUpVec);
      }
    }
  }

  /**
   * @private calculate up, eye, center and tangent vector with controller influence
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
      projectedCenterToEyeVec.setComponents(
        centerToEyeVec.x,
        0,
        centerToEyeVec.z
      );

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
      rotateM_Revert.rotateY(
        MathUtil.degreeToRadian(-horizontalAngleOfVectors)
      );

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

  __updateCameraComponent(camera: CameraComponent) {
    const eyeDirection = OrbitCameraController.__tmpVec3_0.copyComponents(
      this.__newCenterVec
    );
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

  set scaleOfZNearAndZFar(value: number) {
    this.__scaleOfZNearAndZFar = value;
  }

  get scaleOfZNearAndZFar() {
    return this.__scaleOfZNearAndZFar;
  }

  get isMouseDown(): boolean {
    return this.__isMouseDown;
  }

  get lastMouseDownTimeStamp(): number {
    return this.__lastMouseDownTimeStamp;
  }

  get lastMouseUpTimeStamp(): number {
    return this.__lastMouseUpTimeStamp;
  }
}
