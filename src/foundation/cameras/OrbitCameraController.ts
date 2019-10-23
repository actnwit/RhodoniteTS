import Vector3 from "../math/Vector3";
import MutableVector3 from "../math/MutableVector3";
import { MathUtil } from "../math/MathUtil";
import Matrix33 from "../math/Matrix33";
import CameraComponent from "../components/CameraComponent";
import MutableMatrix33 from "../math/MutableMatrix33";
import Entity from "../core/Entity";
import Matrix44 from "../math/Matrix44";
import { ComponentTID, ComponentSID, EntityUID, Count, Size } from "../../types/CommonTypes";
import ICameraController from "./ICameraController";

declare var window: any;

export default class OrbitCameraController implements ICameraController {
  private __isKeyUp = true;
  private __originalY = -1;
  private __originalX = -1;
  private __buttonNumber = 0;
  private __mouse_translate_y = 0;
  private __mouse_translate_x = 0;
  private __efficiency = 1;
  private __lengthOfCenterToEye = 1;
  private __foyvBias = 1.0;
  private __scaleOfTranslation = 2.8;
  private __mouseTranslateVec = MutableVector3.zero();
  private __newEyeToCenterVec = MutableVector3.zero();
  private __newUpVec = MutableVector3.zero();
  private __newTangentVec = MutableVector3.zero();
  private __verticalAngleThreshold = 0;
  private __verticalAngleOfVectors = 0;
  private __isForceGrab = false;
  private __isSymmetryMode = true;
  public eventTargetDom?: HTMLElement;
  private __doResetWhenCameraSettingChanged = false;
  private __rot_bgn_x = 0;
  private __rot_bgn_y = 0;
  private __rot_x = 0;
  private __rot_y = 0;
  private __dolly = 0.5;
  private __dollyScale = 2.0;
  private __eyeVec = MutableVector3.zero();
  private __centerVec = MutableVector3.zero();
  private __upVec = MutableVector3.zero();
  private __shiftCameraTo = MutableVector3.zero();
  private __lengthCenterToCorner = 0.5;
  private __targetEntity?: Entity;
  private __lengthCameraToObject = 1;
  private __scaleOfLengthCameraToCenter = 1;
  private __zFarAdjustingFactorBasedOnAABB = 2.0;
  private __scaleOfZNearAndZFar = 5000;
  private __doPreventDefault = true;
  public moveSpeed = 1;

  private __pinchInOutControl = false;
  private __pinchInOutOriginalDistance?: number | null = null;

  private static returnVector3Eye = MutableVector3.zero();
  private static returnVector3Center = MutableVector3.zero();
  private static returnVector3Up = MutableVector3.zero();

  private __maximum_y?: number;
  private __minimum_y?: number;

  private __resetDollyTouchTime: Count = 0;

  private __controllerTranslate = MutableVector3.zero();
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
  private _eventTargetDom?: any;

  private __resetDollyAndPositionFunc = this.__resetDollyAndPosition.bind(this);

  constructor() {
    this.registerEventListeners();
  }

  set zFarAdjustingFactorBasedOnAABB(value: number) {
    this.__zFarAdjustingFactorBasedOnAABB = value;
  }

  get zFarAdjustingFactorBasedOnAABB() {
    return this.__zFarAdjustingFactorBasedOnAABB;
  }

  setTarget(targetEntity: Entity) {
    this.__targetEntity = targetEntity;
  }

  getTarget(): Entity | undefined {
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
    if (!this.__isKeyUp) return;

    this.__originalX = e.clientX;
    this.__originalY = e.clientY;
    this.__rot_bgn_x = this.__rot_x;
    this.__rot_bgn_y = this.__rot_y;

    this.__isKeyUp = false;

    // if (typeof e.buttons !== "undefined") {
    //        this.updateCamera();
    // }
  }

  __mouseMove(e: MouseEvent) {
    this.__tryToPreventDefault(e);
    if (this.__isKeyUp) return;

    if (this.__buttonNumber === 0) {
      this.__buttonNumber = e.buttons;
    }

    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;
    switch (this.__buttonNumber) {
      case 1: // left
        this.__rotateControl(this.__originalX, this.__originalY, currentMouseX, currentMouseY);
        this.__rot_bgn_x = this.__rot_x;
        this.__rot_bgn_y = this.__rot_y;
        break;
      case 2: // right
        this.__zoomControl(this.__originalX, currentMouseX);
        break;
      case 4: // center
        this.__parallelTranslateControl(this.__originalX, this.__originalY, currentMouseX, currentMouseY);
        break;
      default:
        return;
    }
    this.__originalX = currentMouseX;
    this.__originalY = currentMouseY;
  };

  __mouseUp(e: MouseEvent) {
    if (e.buttons !== 0) return;

    this.__buttonNumber = 0;
    this.__originalX = -1;
    this.__originalY = -1;

    this.__isKeyUp = true;
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

    this.__isKeyUp = false;
  }

  __touchMove(e: TouchEvent) {
    this.__tryToPreventDefault(e);
    if (this.__isKeyUp) return;

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

      this.__parallelTranslateControl(this.__originalX, this.__originalY, currentTouchX, currentTouchY);
    }
    this.__originalX = currentTouchX;
    this.__originalY = currentTouchY;
  }

  __touchUp(e: TouchEvent) {
    const touchNumber = e.touches.length;
    if (touchNumber === 0) {
      this.__originalX = -1;
      this.__originalY = -1;
      this.__isKeyUp = true;
    } else if (touchNumber === 1) {
      this.__originalX = e.touches[0].clientX;
      this.__originalY = e.touches[0].clientY;
      this.__rot_bgn_x = this.__rot_x;
      this.__rot_bgn_y = this.__rot_y;
    } else {
      this.__originalX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      this.__originalY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
    }
  }

  set maximumY(maximum_y: number) {
    this.__maximum_y = maximum_y;
  }
  set minimumY(minimum_y: number) {
    this.__minimum_y = minimum_y;
  }

  __rotateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size) {
    // calc rotation angle
    let delta_x = (currentX - originalX) * this.__efficiency * 0.3;
    let delta_y = (currentY - originalY) * this.__efficiency * 0.3;
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
      this.__rot_y = this.__maximum_y
    }
    if (this.__minimum_y != null && this.__rot_y < this.__minimum_y) {
      this.__rot_y = this.__minimum_y
    }
  }

  __zoomControl(originalValue: Size, currentValue: Size) {
    this.dolly -= ((currentValue - originalValue) / 1000) * this.__efficiency;
  }

  __parallelTranslateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size) {
    this.__mouse_translate_y = ((currentY - originalY) / 1000) * this.__efficiency;
    this.__mouse_translate_x = ((currentX - originalX) / 1000) * this.__efficiency;

    const scale = this.__lengthOfCenterToEye * this.__foyvBias * this.__scaleOfTranslation;

    this.__mouseTranslateVec = Vector3.add(
      this.__mouseTranslateVec,
      MutableVector3.normalize(this.__newUpVec).multiply(this.__mouse_translate_y).multiply(scale)
    );
    this.__mouseTranslateVec = Vector3.add(
      this.__mouseTranslateVec,
      MutableVector3.normalize(this.__newTangentVec).multiply(this.__mouse_translate_x).multiply(scale)
    );
  }

  __getTouchesDistance(e: TouchEvent) {
    const touches = e.touches;

    const x1 = touches[0].clientX;
    const y1 = touches[0].clientY;
    const x2 = touches[1].clientX;
    const y2 = touches[1].clientY;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
    this.dolly += Math.sign(evt.deltaY) * this.__getTargetAABB().lengthCenterToCorner / 300;
  };

  __contextMenu(evt: Event) {
    if (evt.preventDefault) {
      this.__tryToPreventDefault(evt);
    } else {
      evt.returnValue = false;
    }
  };

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
      this.__mouseTranslateVec = new MutableVector3(0, 0, 0);
    } else if (evt.ctrlKey) {
      this.__rot_y = 0;
      this.__rot_x = 0;
      this.__rot_bgn_y = 0;
      this.__rot_bgn_x = 0;
    }
  };

  __resetDollyAndPosition(e: TouchEvent) {
    if (e.touches.length > 1) return;

    const currentTime = new Date().getTime();
    if (currentTime - this.__resetDollyTouchTime < 300) {
      this.dolly = Math.pow(0.5, 1.0 / 2.2);
      this.__mouseTranslateVec = new MutableVector3(0, 0, 0);
      this.__rot_x = 0;
      this.__rot_y = 0;
    } else {
      this.__resetDollyTouchTime = currentTime;
    }
  }


  registerEventListeners(eventTargetDom: any = document) {
    this._eventTargetDom = eventTargetDom;

    if (eventTargetDom) {
      if ("ontouchend" in document) {
        eventTargetDom.addEventListener("touchstart", this.__touchDownFunc, { passive: !this.__doPreventDefault });
        eventTargetDom.addEventListener("touchmove", this.__touchMoveFunc, { passive: !this.__doPreventDefault });
        eventTargetDom.addEventListener("touchend", this.__touchUpFunc, { passive: !this.__doPreventDefault });

        eventTargetDom.addEventListener("touchmove", this.__pinchInOutFunc, { passive: !this.__doPreventDefault });
        eventTargetDom.addEventListener("touchend", this.__pinchInOutEndFunc, { passive: !this.__doPreventDefault });

        eventTargetDom.addEventListener("touchstart", this.__resetDollyAndPositionFunc, { passive: !this.__doPreventDefault });

      } else {
        eventTargetDom.addEventListener("mousedown", this.__mouseDownFunc, { passive: !this.__doPreventDefault });
        eventTargetDom.addEventListener("mouseup", this.__mouseUpFunc, { passive: !this.__doPreventDefault });
        eventTargetDom.addEventListener("mousemove", this.__mouseMoveFunc, { passive: !this.__doPreventDefault });

        eventTargetDom.addEventListener("contextmenu", (e: any) => { e.preventDefault() });
      }

      if (window.WheelEvent) {
        eventTargetDom.addEventListener("wheel", this.__mouseWheelFunc, { passive: !this.__doPreventDefault });
      }

      eventTargetDom.addEventListener("contextmenu", this.__contextMenuFunc, { passive: !this.__doPreventDefault });
      eventTargetDom.addEventListener("dblclick", this.__mouseDblClickFunc, { passive: !this.__doPreventDefault });
    }
  }

  unregisterEventListeners() {
    const eventTargetDom = this._eventTargetDom;

    if (eventTargetDom) {
      if ("ontouchend" in document) {
        eventTargetDom.removeEventListener("touchstart", this.__touchDownFunc);
        eventTargetDom.removeEventListener("touchmove", this.__touchMoveFunc);
        eventTargetDom.removeEventListener("touchend", this.__touchUpFunc);

        eventTargetDom.removeEventListener("touchmove", this.__pinchInOutFunc);
        eventTargetDom.removeEventListener("touchend", this.__pinchInOutEndFunc);

        eventTargetDom.removeEventListener("touchstart", this.__resetDollyAndPositionFunc);
      }
      else {
        eventTargetDom.removeEventListener("mousedown", this.__mouseDownFunc);
        eventTargetDom.removeEventListener("mouseup", this.__mouseUpFunc);
        eventTargetDom.removeEventListener("mousemove", this.__mouseMoveFunc);

        eventTargetDom.removeEventListener("contextmenu", (e: any) => { e.preventDefault() });
      }
      if (window.WheelEvent) {
        eventTargetDom.removeEventListener("wheel", this.__mouseWheelFunc);
      }
      eventTargetDom.removeEventListener("contextmenu", this.__contextMenuFunc);
      eventTargetDom.removeEventListener("dblclick", this.__mouseDblClickFunc);
    }
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
    const data0 = this.__updateTargeting(cameraComponent!);
    const eye = data0.newEyeVec;
    const center = data0.newCenterVec;
    const up = data0.newUpVec;


    const data = this.__convert(cameraComponent!, eye, center, up);
    const cc = cameraComponent!;
    cc.eyeInner = data.newEyeVec;
    cc.directionInner = data.newCenterVec;
    cc.upInner = data.newUpVec;
    cc.zNearInner = data.newZNear;
    cc.zFarInner = data.newZFar;
    cc.leftInner = data.newLeft;
    cc.rightInner = data.newRight;
    cc.topInner = data.newTop;
    cc.bottomInner = data.newBottom;

    cc.fovyInner = data.fovy;
  }

  __convert(camera: CameraComponent, eye: Vector3, center: Vector3, up: Vector3) {
    let newEyeVec = null;
    let newCenterVec: MutableVector3;
    let newUpVec = null;

    if (this.__isKeyUp || !this.__isForceGrab) {
      this.__eyeVec = Vector3.add(eye, this.__shiftCameraTo);
      this.__centerVec = Vector3.add(center, this.__shiftCameraTo);
      this.__upVec = new MutableVector3(up);
    }

    let fovy = this.__getFovyFromCamera(camera);

    const centerToEyeVec = new MutableVector3(this.__eyeVec).subtract(this.__centerVec)
    centerToEyeVec.multiply((this.__dolly * this.__dollyScale) / Math.tan(MathUtil.degreeToRadian(fovy / 2.0)))

    this.__lengthOfCenterToEye = centerToEyeVec.length();
    if (this.__isSymmetryMode) {
      let horizontalAngleOfVectors = Vector3.angleOfVectors(
        new Vector3(centerToEyeVec.x, 0, centerToEyeVec.z),
        new Vector3(0, 0, 1)
      );
      let horizontalSign = Vector3.cross(
        new Vector3(centerToEyeVec.x, 0, centerToEyeVec.z),
        new Vector3(0, 0, 1)
      ).y;
      if (horizontalSign >= 0) {
        horizontalSign = 1;
      } else {
        horizontalSign = -1;
      }
      horizontalAngleOfVectors *= horizontalSign;
      let rotateM_Reset = MutableMatrix33.rotateY(MathUtil.degreeToRadian(horizontalAngleOfVectors));
      let rotateM_X = MutableMatrix33.rotateX(MathUtil.degreeToRadian(this.__rot_y));
      let rotateM_Y = MutableMatrix33.rotateY(MathUtil.degreeToRadian(this.__rot_x));
      let rotateM_Revert = MutableMatrix33.rotateY(MathUtil.degreeToRadian(-horizontalAngleOfVectors));
      let rotateM = MutableMatrix33.multiply(
        rotateM_Revert,
        MutableMatrix33.multiply(
          rotateM_Y,
          MutableMatrix33.multiply(rotateM_X, rotateM_Reset)
        )
      );

      newUpVec = rotateM.multiplyVector(this.__upVec);
      this.__newUpVec = newUpVec;
      newEyeVec = rotateM.multiplyVector(centerToEyeVec).add(this.__centerVec);
      newCenterVec = new MutableVector3(this.__centerVec);
      this.__newEyeToCenterVec = Vector3.subtract(newCenterVec, newEyeVec);
      this.__newTangentVec = Vector3.cross(
        this.__newUpVec,
        this.__newEyeToCenterVec
      );

      newEyeVec.add(this.__mouseTranslateVec);
      newCenterVec.add(this.__mouseTranslateVec);

      let horizonResetVec = rotateM_Reset.multiplyVector(centerToEyeVec);
      this.__verticalAngleOfVectors = Vector3.angleOfVectors(
        horizonResetVec,
        new Vector3(0, 0, 1)
      );
      let verticalSign = Vector3.cross(horizonResetVec, new Vector3(0, 0, 1)).x;
      if (verticalSign >= 0) {
        verticalSign = 1;
      } else {
        verticalSign = -1;
      }
      //this._verticalAngleOfVectors *= verticalSign;
    } else {
      let rotateM_X = Matrix33.rotateX(MathUtil.degreeToRadian(this.__rot_y));
      let rotateM_Y = Matrix33.rotateY(MathUtil.degreeToRadian(this.__rot_x));
      let rotateM = Matrix33.multiply(rotateM_Y, rotateM_X);

      newUpVec = rotateM.multiplyVector(this.__upVec);
      this.__newUpVec = newUpVec;
      newEyeVec = Vector3.add(rotateM.multiplyVector(centerToEyeVec), this.__centerVec);
      newCenterVec = new MutableVector3(this.__centerVec);
      this.__newEyeToCenterVec = Vector3.subtract(newCenterVec, newEyeVec);
      this.__newTangentVec = Vector3.cross(
        this.__newUpVec,
        this.__newEyeToCenterVec
      );

      newEyeVec.add(this.__mouseTranslateVec);
      newCenterVec.add(this.__mouseTranslateVec);
    }
    const newCenterToEyeLength = Vector3.lengthBtw(newEyeVec, newCenterVec);

    let newLeft = camera.left;
    let newRight = camera.right;
    let newTop = camera.top;
    let newBottom = camera.bottom;
    let newZNear = camera.zNear;
    let newZFar = camera.zFar;
    let ratio = 1;

    if (this.__targetEntity) {
      newZFar =
        camera.zNear + Vector3.subtract(newCenterVec, newEyeVec).length();
      newZFar +=
        this.__getTargetAABB().lengthCenterToCorner *
        this.__zFarAdjustingFactorBasedOnAABB;
    }

    if (typeof newLeft !== "undefined") {
      if (typeof this.__lengthCenterToCorner !== "undefined") {
        //let aabb = this.__getTargetAABB();
        ratio = newZFar / camera.zNear;

        const minRatio = this.__scaleOfZNearAndZFar;
        ratio /= minRatio;

        let scale = ratio;
        newLeft *= scale;
        newRight *= scale;
        newTop *= scale;
        newBottom *= scale;
        //        newZFar *= scale;
        newZNear *= scale;
      }
    }

    this.__foyvBias = Math.tan(MathUtil.degreeToRadian(fovy / 2.0));
    return {
      newEyeVec,
      newCenterVec,
      newUpVec,
      newZNear,
      newZFar,
      newLeft,
      newRight,
      newTop,
      newBottom,
      fovy
    };
  }

  __getTargetAABB() {
    return this.__targetEntity!.getSceneGraph().worldAABB;
  }

  __updateTargeting(camera: CameraComponent) {

    const eyeVec = camera.eye;
    const centerVec = camera.direction;
    const upVec = (camera as any)._up;
    const fovy = camera.fovy;

    if (this.__targetEntity == null) {
      return { newEyeVec: eyeVec, newCenterVec: centerVec, newUpVec: upVec };
    }

    let targetAABB = this.__getTargetAABB()

    const cameraZNearPlaneHeight = camera.top - camera.bottom;
    this.__lengthCenterToCorner = targetAABB.lengthCenterToCorner;
    this.__lengthCameraToObject =
      (targetAABB.lengthCenterToCorner / Math.sin((fovy * Math.PI) / 180 / 2)) *
      this.__scaleOfLengthCameraToCenter;

    let newCenterVec = targetAABB.centerPoint;

    let centerToCameraVec = Vector3.subtract(eyeVec, centerVec);
    let centerToCameraVecNormalized = Vector3.normalize(centerToCameraVec);

    let newEyeVec = Vector3.add(Vector3.multiply(
      centerToCameraVecNormalized,
      this.__lengthCameraToObject
    ), newCenterVec);

    let newUpVec = null;
    if (camera.entity.getSceneGraph()) {
      const sg = camera.entity.getSceneGraph();
      let mat = Matrix44.invert(sg.worldMatrixInner);

      mat.multiplyVector3To(
        newEyeVec, OrbitCameraController.returnVector3Eye
      );
      newEyeVec = OrbitCameraController.returnVector3Eye as Vector3;

      mat.multiplyVector3To(
        newCenterVec, OrbitCameraController.returnVector3Center
      );
      newCenterVec = OrbitCameraController.returnVector3Center as Vector3;

      mat.multiplyVector3To(
        upVec, OrbitCameraController.returnVector3Up
      );
      newUpVec = OrbitCameraController.returnVector3Up as Vector3;

    } else {
      newUpVec = upVec;
    }

    return { newEyeVec, newCenterVec, newUpVec };
  }

  set scaleOfZNearAndZFar(value: number) {
    this.__scaleOfZNearAndZFar = value;
  }

  get scaleOfZNearAndZFar() {
    return this.__scaleOfZNearAndZFar;
  }

}
