import Vector3 from "../math/Vector3";
import Matrix33 from "../math/Matrix33";
import MathClassUtil from "../math/MathClassUtil";
import { MiscUtil } from "../misc/MiscUtil";
import ICameraController from "./ICameraController";
import { FunctionDeclaration } from "@babel/types";
import MutableVector3 from "../math/MutableVector3";
import CameraComponent from "../components/CameraComponent";
import Matrix44 from "../math/Matrix44";
import MutableMatrix44 from "../math/MutableMatrix44";
import { MathUtil } from "../math/MathUtil";
import Entity from "../core/Entity";

type KeyboardEventListener = (evt: KeyboardEvent) => any;
type MouseEventListener = (evt: MouseEvent) => any;

export default class WalkThroughCameraController implements ICameraController {
  private _horizontalSpeed: number;
  private _verticalSpeed: number;
  private _turnSpeed: number;
  private _mouseWheelSpeedScale: number;
  private _inverseVerticalRotating: boolean;
  private _inverseHorizontalRotating: boolean;
  private _onKeydown: KeyboardEventListener;
  private _isKeyDown: boolean = false;
  private _isMouseDrag: boolean = false;
  private _lastKeyCode: number = -1;
  private _onKeyup: KeyboardEventListener;
  private _currentDir = new MutableVector3(0, 0, -1);
  private _currentPos = new MutableVector3(0, 0, 0);
  private _currentCenter = new MutableVector3(0, 0, -1);
  private _newDir = new MutableVector3(0, 0, -1);
  private _isMouseDown: boolean = false;
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

  constructor(
    options = {
      eventTargetDom: document,
      verticalSpeed: 1,
      horizontalSpeed: 1,
      turnSpeed: 0.25,
      mouseWheelSpeedScale: 1,
      inverseVerticalRotating: false,
      inverseHorizontalRotating: false
    }
  ) {

    this._horizontalSpeed = options.horizontalSpeed;
    this._verticalSpeed = options.verticalSpeed;
    this._turnSpeed = options.turnSpeed;
    this._mouseXAdjustScale = this._turnSpeed;
    this._mouseYAdjustScale = this._turnSpeed;
    this._mouseWheelSpeedScale = options.mouseWheelSpeedScale;
    this._inverseVerticalRotating = options.inverseVerticalRotating;
    this._inverseHorizontalRotating = options.inverseHorizontalRotating;

    this.reset();

    this._onKeydown = e => {
      this._isKeyDown = true;
      this._lastKeyCode = e.keyCode;
    };

    this._onKeyup = e => {
      this._isKeyDown = false;
      this._lastKeyCode = -1;
    };

    const eventTargetDom = options.eventTargetDom;

    this.registerEventListeners(eventTargetDom);
  }

  registerEventListeners(eventTargetDom: any = document) {
    this._eventTargetDom = eventTargetDom;

    if (eventTargetDom) {
      document.addEventListener("keydown", this._onKeydown);
      document.addEventListener("keyup", this._onKeyup);

      if ("ontouchend" in document) {
        eventTargetDom.addEventListener(
          "touchstart",
          this._mouseDownBind
        );
        document.addEventListener("touchend", this._mouseUpBind);
        eventTargetDom.addEventListener(
          "touchmove",
          this._mouseMoveBind
        );
      }
      if ("onmouseup" in document) {
        eventTargetDom.addEventListener(
          "mousedown",
          this._mouseDownBind
        );
        document.addEventListener("mouseup", this._mouseUpBind);
        eventTargetDom.addEventListener(
          "mousemove",
          this._mouseMoveBind
        );
      }
      if ("onwheel" in document) {
        eventTargetDom.addEventListener("wheel", this._mouseWheelBind);
      }
    }
  }

  unregisterEventListeners() {
    const eventTargetDom = this._eventTargetDom;

    if (eventTargetDom) {
      document.removeEventListener("keydown", this._onKeydown);
      document.removeEventListener("keyup", this._onKeyup);

      if ("ontouchend" in document) {
        eventTargetDom.removeEventListener(
          "touchstart",
          (this._mouseDown as any).bind(this)
        );
        document.removeEventListener("touchend", this._mouseUpBind);
        eventTargetDom
          .removeEventListener("touchmove", this._mouseMoveBind)
      }
      if ("onmouseup" in document) {
        eventTargetDom.removeEventListener(
          "mousedown",
          this._mouseDownBind
        );
        document.removeEventListener("mouseup", this._mouseUpBind);
        eventTargetDom.removeEventListener(
          "mousemove",
          this._mouseMoveBind
        );
      }
      if ("onwheel" in document) {
        eventTargetDom.removeEventListener(
          "wheel",
          this._mouseWheelBind
        );
      }
    }
  }

  _mouseWheel(e: MouseWheelEvent) {
    if (this._currentDir === null) {
      return;
    }
    let delta = -1 * Math.sign((e as any).deltaY) * this._mouseWheelSpeedScale * this._horizontalSpeed;
    const horizontalDir = new MutableVector3(
      this._currentDir.x,
      0,
      this._currentDir.z
    ).normalize();
    this._currentPos.add(Vector3.multiply(horizontalDir, delta));
    this._currentCenter.add(Vector3.multiply(horizontalDir, delta));
  }

  _mouseDown(evt: MouseEvent) {
    MiscUtil.preventDefaultForDesktopOnly(evt);
    evt.stopPropagation();
    this._isMouseDown = true;

    let rect = (evt.target! as any).getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;

    return false;
  }

  _mouseMove(evt: MouseEvent) {
    MiscUtil.preventDefaultForDesktopOnly(evt);
    if (!this._isMouseDown) {
      return;
    }
    evt.stopPropagation();

    let rect = (evt.target! as any).getBoundingClientRect();
    this._draggedMouseXOnCanvas = evt.clientX - rect.left;
    this._draggedMouseYOnCanvas = evt.clientY - rect.top;

    this._deltaMouseXOnCanvas =
      this._draggedMouseXOnCanvas - this._clickedMouseXOnCanvas;
    this._deltaMouseYOnCanvas =
      this._draggedMouseYOnCanvas - this._clickedMouseYOnCanvas;

    this._isMouseDrag = true;
  }

  _mouseUp(evt: MouseEvent) {
    this._isMouseDown = false;
    this._isMouseDrag = false;

    let rect = (evt.target! as any).getBoundingClientRect();
    this._clickedMouseXOnCanvas = evt.clientX - rect.left;
    this._clickedMouseYOnCanvas = evt.clientY - rect.top;
  }

  tryReset() { }

  reset() {
    this._isKeyDown = false;
    this._lastKeyCode = -1;
    this._currentPos = new MutableVector3(0, 0, 0);
    this._currentCenter = new MutableVector3(0, 0, -1);
    this._currentDir = new MutableVector3(0, 0, -1);
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
    this._newDir = new MutableVector3(0, 0, -1);

  }

  logic(cameraComponent: CameraComponent) {
    const data = this.__convert(cameraComponent);
    const cc = cameraComponent;
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


  private __convert(camera: CameraComponent) {
    if (this._currentPos === null) {
      this._currentPos = new MutableVector3(camera.eye.clone());
    }
    const sg = camera.entity.getSceneGraph();
    const mat = sg.worldMatrixInner;
    const center = mat.multiplyVector3(Vector3.zero());
    if (this._currentCenter === null) {
      this._currentCenter = new MutableVector3(center);
    }
    if (this._currentDir === null) {
      this._currentDir = Vector3.subtract(
        new MutableVector3(center),
        camera.eye
      ).normalize();
    }

    let newEyeToCenter = null;

    const t = this._deltaY / 90;
    this._newDir.x = this._currentDir.x * (1 - t);
    this._newDir.y = t;
    this._newDir.z = this._currentDir.z * (1 - t);
    this._newDir.normalize();

    switch (this._lastKeyCode) {
      case 87: // w key
      case 38: // arrow upper key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          this._currentPos.add(
            Vector3.multiply(horizontalDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(horizontalDir, this._horizontalSpeed)
          );
        }
        break;
      case 65: // a key
      case 37: // arrow left key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          const leftDir = Matrix33.rotateY(MathUtil.degreeToRadian(90)).multiplyVector(horizontalDir);
          this._currentPos.add(
            Vector3.multiply(leftDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(leftDir, this._horizontalSpeed)
          );
        }
        break;
      case 83: // s key
      case 40: // arrow down key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          this._currentPos.add(
            Vector3.multiply(horizontalDir, -this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(horizontalDir, -this._horizontalSpeed)
          );
        }
        break;
      case 68: // d key
      case 39: // arrow right key
        {
          const horizontalDir = new MutableVector3(
            this._currentDir.x,
            0,
            this._currentDir.z
          ).normalize();
          const rightDir = Matrix33.rotateY(MathUtil.degreeToRadian(-90)).multiplyVector(horizontalDir);
          this._currentPos.add(
            Vector3.multiply(rightDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(rightDir, this._horizontalSpeed)
          );
        }
        break;
      case 81: // q key
        {
          this._currentPos.add(
            Vector3.multiply(this._newDir, -this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(this._newDir, -this._horizontalSpeed)
          );
        }
        break;
      case 69: // e key
        {
          this._currentPos.add(
            Vector3.multiply(this._newDir, this._horizontalSpeed)
          );
          this._currentCenter.add(
            Vector3.multiply(this._newDir, this._horizontalSpeed)
          );
        }
        break;
      case 82: // r key
        this._currentPos.add(new Vector3(0, this._verticalSpeed, 0));
        this._currentCenter.add(new Vector3(0, this._verticalSpeed, 0));
        break;
      case 70: // f key
        this._currentPos.add(new Vector3(0, -this._verticalSpeed, 0));
        this._currentCenter.add(new Vector3(0, -this._verticalSpeed, 0));
        break;
    }

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

      this._currentDir = Matrix33.rotateY(MathUtil.degreeToRadian(this._deltaX)).multiplyVector(
        this._currentDir
      );

      newEyeToCenter = Matrix33.rotateY(MathUtil.degreeToRadian(this._deltaX)).multiplyVector(
        Vector3.subtract(this._currentCenter, this._currentPos)
      );
      newEyeToCenter.x = newEyeToCenter.x * (1 - t);
      newEyeToCenter.y = t;
      newEyeToCenter.z = newEyeToCenter.z * (1 - t);
      newEyeToCenter.normalize();
      this._currentCenter = Vector3.add(this._currentPos, newEyeToCenter);

      this._clickedMouseXOnCanvas = this._draggedMouseXOnCanvas;
      this._clickedMouseYOnCanvas = this._draggedMouseYOnCanvas;
      this._deltaMouseXOnCanvas = 0;
      this._deltaMouseYOnCanvas = 0;
    }

    let newLeft = camera.left;
    let newRight = camera.right;
    let newTop = camera.top;
    let newBottom = camera.bottom;

    return {
      newEyeVec: this._currentPos,
      newCenterVec: this._currentCenter,
      newUpVec: camera.up.clone(),
      newZNear: camera.zNear,
      newZFar: camera.zFar,
      newLeft,
      newRight,
      newTop,
      newBottom,
      fovy: camera.fovy
    };
  }

  getDirection() {
    return this._currentCenter !== null ? this._newDir.clone() : null;
  }

  set horizontalSpeed(value) {
    this._horizontalSpeed = value;
  }

  get horizontalSpeed() {
    return this._horizontalSpeed;
  }

  set verticalSpeed(value) {
    this._verticalSpeed = value;
  }

  get verticalSpeed() {
    return this._verticalSpeed;
  }

  setTarget(targetEntity: Entity) {
    const speed = targetEntity.getSceneGraph().worldAABB.lengthCenterToCorner / 10;
    this.verticalSpeed = speed;
    this.horizontalSpeed = speed;
  }

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

  set allInfo(arg) {
    let json = arg;
    if (typeof arg === "string") {
      json = JSON.parse(arg);
    }
    for (let key in json) {
      if (json.hasOwnProperty(key) && key in this) {
        if (key === "quaternion") {
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

